import { prisma } from '../utils/prisma.js';

export interface CustomerDTO {
  cedula: string;
  name: string;
  phone?: string;
  whatsappOptIn?: boolean;
  email?: string;
  address?: string;
  balance?: number;
  creditLimit?: number;
}

export interface RegisterPaymentDTO {
  amount: number;
  paymentMethod: string;
  note?: string;
}

export class CustomersService {
  /**
   * Crear nuevo cliente
   * Cédula y Nombre son obligatorios
   */
  async createCustomer(data: CustomerDTO) {
    const cedula = data.cedula?.trim();
    const name = data.name?.trim();

    if (!cedula) {
      const error: any = new Error('La cédula de ciudadanía es obligatoria.');
      error.statusCode = 400;
      throw error;
    }

    if (!name) {
      const error: any = new Error('El nombre completo del cliente es obligatorio.');
      error.statusCode = 400;
      throw error;
    }
    if (data.creditLimit !== undefined && (!Number.isFinite(Number(data.creditLimit)) || Number(data.creditLimit) < 0)) {
      const error: any = new Error('El cupo de crédito debe ser un valor válido igual o mayor a cero.');
      error.statusCode = 400;
      throw error;
    }

    // Verificar si ya existe cliente con esta cédula
    const existing = await prisma.customer.findUnique({
      where: { cedula }
    });

    if (existing) {
      const error: any = new Error(`Ya existe un cliente registrado con la cédula ${cedula}.`);
      error.statusCode = 409;
      throw error;
    }

    return await prisma.customer.create({
      data: {
        cedula,
        name,
        phone: data.phone?.trim() || null,
        whatsappOptIn: data.whatsappOptIn === true,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        balance: data.balance ? Number(data.balance) : 0,
        creditLimit: data.creditLimit !== undefined ? Number(data.creditLimit) : 0
      }
    });
  }

  /**
   * Listar todos los clientes con cálculo de pedidos pendientes y saldo por pagar
   */
  async getCustomers() {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sales: {
          select: {
            id: true,
            totalAmount: true,
            paymentMethod: true,
            pendingAmount: true,
            createdAt: true
          }
        },
        orders: {
          where: { status: 'PENDIENTE' },
          include: {
            items: {
              include: { product: true }
            }
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          include: { allocations: { include: { sale: true } } }
        }
      }
    });

    // También buscar pedidos pendientes que coincidan por teléfono o cédula
    // para clientes que hicieron pedidos desde el catálogo web
    const allPendingOrders = await prisma.order.findMany({
      where: { status: 'PENDIENTE' },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    return customers.map(customer => {
      // Consolidar pedidos pendientes (asignados por customerId o por coincidencia de teléfono/cédula)
      const matchedPendingOrders = allPendingOrders.filter(o => 
        o.customerId === customer.id || 
        (customer.phone && o.customerPhone && o.customerPhone.trim() === customer.phone.trim()) ||
        (customer.cedula && o.customerCedula && o.customerCedula.trim() === customer.cedula.trim())
      );

      // Eliminar duplicados si los hubiera
      const uniquePendingOrdersMap = new Map();
      matchedPendingOrders.forEach(o => uniquePendingOrdersMap.set(o.id, o));
      const pendingOrders = Array.from(uniquePendingOrdersMap.values());

      const pendingOrdersTotal = pendingOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      return {
        id: customer.id,
        cedula: customer.cedula,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        balance: customer.balance || 0, // Saldo por pagar
        creditLimit: customer.creditLimit || 0,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        pendingOrdersCount: pendingOrders.length,
        pendingOrdersTotal,
        pendingOrders,
        salesCount: customer.sales.length,
        salesActivity: customer.sales.map(sale => ({ createdAt: sale.createdAt })),
        recentPayments: customer.payments
      };
    });
  }

  /**
   * Obtener detalle completo de un cliente
   */
  async getCustomerById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          include: {
            items: {
              include: { product: true }
            },
            allocations: { include: { payment: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        orders: {
          include: {
            items: {
              include: { product: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          include: { allocations: { include: { sale: true } } }
        }
      }
    });

    if (!customer) {
      const error: any = new Error('Cliente no encontrado.');
      error.statusCode = 404;
      throw error;
    }

    // Buscar también pedidos pendientes del catálogo web asociados a este cliente
    const externalPendingOrders = await prisma.order.findMany({
      where: {
        status: 'PENDIENTE',
        customerId: null,
        OR: [
          customer.phone ? { customerPhone: customer.phone } : undefined,
          { customerName: { contains: customer.name } }
        ].filter(Boolean) as any
      },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    const allOrdersMap = new Map();
    customer.orders.forEach(o => allOrdersMap.set(o.id, o));
    externalPendingOrders.forEach(o => allOrdersMap.set(o.id, o));
    const allOrders = Array.from(allOrdersMap.values());

    const pendingOrders = allOrders.filter(o => o.status === 'PENDIENTE');

    return {
      ...customer,
      orders: allOrders,
      pendingOrders,
      pendingOrdersCount: pendingOrders.length,
      pendingOrdersTotal: pendingOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    };
  }

  /**
   * Buscar clientes por cédula o nombre (para autocomplete rápido en POS)
   */
  async searchCustomers(query: string) {
    if (!query || query.trim() === '') {
      return [];
    }

    const q = query.trim().toLowerCase();

    // En SQLite realizamos búsqueda findMany
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { cedula: { contains: q } },
          { name: { contains: q } },
          { phone: { contains: q } }
        ]
      },
      take: 10,
      include: {
        orders: {
          where: { status: 'PENDIENTE' },
          select: { id: true, totalAmount: true }
        }
      }
    });

    return customers.map(c => ({
      id: c.id,
      cedula: c.cedula,
      name: c.name,
      phone: c.phone,
      email: c.email,
      whatsappOptIn: c.whatsappOptIn,
      address: c.address,
      balance: c.balance,
      pendingOrdersCount: c.orders.length,
      pendingOrdersTotal: c.orders.reduce((sum, o) => sum + o.totalAmount, 0)
    }));
  }

  /**
   * Actualizar datos del cliente
   * Cédula y nombre son obligatorios
   */
  async updateCustomer(id: string, data: CustomerDTO) {
    const cedula = data.cedula?.trim();
    const name = data.name?.trim();

    if (!cedula) {
      const error: any = new Error('La cédula de ciudadanía es obligatoria.');
      error.statusCode = 400;
      throw error;
    }

    if (!name) {
      const error: any = new Error('El nombre completo del cliente es obligatorio.');
      error.statusCode = 400;
      throw error;
    }
    if (data.creditLimit !== undefined && (!Number.isFinite(Number(data.creditLimit)) || Number(data.creditLimit) < 0)) {
      const error: any = new Error('El cupo de crédito debe ser un valor válido igual o mayor a cero.');
      error.statusCode = 400;
      throw error;
    }

    // Verificar si otra persona tiene ya esa cédula
    const existing = await prisma.customer.findFirst({
      where: {
        cedula,
        NOT: { id }
      }
    });

    if (existing) {
      const error: any = new Error(`Ya existe otro cliente con la cédula ${cedula}.`);
      error.statusCode = 409;
      throw error;
    }

    return await prisma.customer.update({
      where: { id },
      data: {
        cedula,
        name,
        phone: data.phone !== undefined ? (data.phone ? data.phone.trim() : null) : undefined,
        whatsappOptIn: data.whatsappOptIn !== undefined ? data.whatsappOptIn : undefined,
        email: data.email !== undefined ? (data.email ? data.email.trim() : null) : undefined,
        address: data.address !== undefined ? (data.address ? data.address.trim() : null) : undefined,
        balance: data.balance !== undefined ? Number(data.balance) : undefined,
        creditLimit: data.creditLimit !== undefined ? Number(data.creditLimit) : undefined
      }
    });
  }

  /**
   * Eliminar cliente
   */
  async deleteCustomer(id: string) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      const error: any = new Error('Cliente no encontrado.');
      error.statusCode = 404;
      throw error;
    }

    await prisma.customer.delete({ where: { id } });
    return { message: 'Cliente eliminado exitosamente.' };
  }

  /**
   * Registrar Abono / Pago de Saldo
   */
  async registerPayment(customerId: string, data: RegisterPaymentDTO) {
    const amount = Number(data.amount);
    if (!amount || isNaN(amount) || amount <= 0) {
      const error: any = new Error('El monto del abono debe ser un número positivo.');
      error.statusCode = 400;
      throw error;
    }
    if (!['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'OTRO'].includes(data.paymentMethod)) {
      const error: any = new Error('Selecciona un medio de pago válido.');
      error.statusCode = 400;
      throw error;
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      const error: any = new Error('Cliente no encontrado.');
      error.statusCode = 404;
      throw error;
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Crear registro de pago
      let remainingPayment = amount;
      const creditSales = await tx.sale.findMany({
        where: { customerId, paymentMethod: 'CREDITO', pendingAmount: { gt: 0 } },
        orderBy: { createdAt: 'asc' }
      });
      const allocations: { saleId: string; amount: number }[] = [];
      for (const sale of creditSales) {
        if (remainingPayment <= 0) break;
        const allocated = Math.min(sale.pendingAmount || 0, remainingPayment);
        if (allocated > 0) {
          await tx.sale.update({ where: { id: sale.id }, data: { pendingAmount: (sale.pendingAmount || 0) - allocated } });
          allocations.push({ saleId: sale.id, amount: allocated });
          remainingPayment -= allocated;
        }
      }
      const payment = await tx.customerPayment.create({
        data: {
          customerId,
          amount,
          paymentMethod: data.paymentMethod,
          note: data.note?.trim() || null,
          allocations: { create: allocations }
        }
      });

      // El saldo general también puede incluir deuda inicial u otros cargos.
      const newBalance = Math.max(0, customer.balance - amount);
      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: { balance: newBalance }
      });

      return {
        payment,
        allocations,
        customer: updatedCustomer,
        previousBalance: customer.balance,
        newBalance
      };
    });
  }
}

export const customersService = new CustomersService();
