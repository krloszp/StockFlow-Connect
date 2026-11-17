import { prisma } from '../utils/prisma.js';

export type PaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CREDITO';

export interface SaleItemInput {
  productId: string;
  quantity: number;
}

export interface CreateSaleDTO {
  paymentMethod: PaymentMethod;
  cashGiven?: number;
  // Datos del cliente / comprador
  customerId?: string;
  customerCedula?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerNote?: string;
  whatsappOptIn?: boolean;
  pendingAmount?: number;
  items: SaleItemInput[];
}

export class SalesService {
  /**
   * HU-010: Registrar Venta Rápida POS
   */
  async createSale(data: CreateSaleDTO) {
    const {
      paymentMethod = 'EFECTIVO',
      cashGiven,
      items,
      customerId,
      customerCedula,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      customerNote,
      whatsappOptIn
    } = data;

    if (!items || items.length === 0) {
      const error: any = new Error('El carrito de venta no puede estar vacío.');
      error.statusCode = 400;
      throw error;
    }

    // 1. Validar productos, calcular totales y descontar stock en transacción de base de datos
    const { result, firstPurchaseContact } = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      let totalCost = 0;
      const saleItemsToCreate = [];

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw new Error(`Producto con ID ${item.productId} no fue encontrado.`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para "${product.name}". Disponible: ${product.stock}, Solicitado: ${item.quantity}.`);
        }

        const subtotal = product.sellingPrice * item.quantity;
        totalAmount += subtotal;
        totalCost += product.costPrice * item.quantity;

        // Actualizar stock del producto
        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock - item.quantity }
        });
        await tx.inventoryMovement.create({ data: { productId: product.id, type: 'VENTA', quantity: -item.quantity, unitCost: product.costPrice, note: 'Salida por venta POS' } });

        saleItemsToCreate.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.sellingPrice,
          costPriceAtSale: product.costPrice,
          subtotal
        });
      }

      // 2. Manejo de métodos de pago y saldos
      let changeGiven = 0;
      let pendingAmount = 0;

      if (paymentMethod === 'EFECTIVO') {
        if (cashGiven !== undefined && Number(cashGiven) < totalAmount) {
          throw new Error(`El dinero recibido ($${cashGiven}) es menor al total de la venta ($${totalAmount}).`);
        }
        if (cashGiven !== undefined) {
          changeGiven = Number(cashGiven) - totalAmount;
        }
      } else if (paymentMethod === 'CREDITO') {
        // Venta a crédito o fiado: si dio abono inicial, el saldo por pagar es el restante
        const initialPayment = cashGiven ? Number(cashGiven) : 0;
        pendingAmount = Math.max(0, totalAmount - initialPayment);
        changeGiven = 0;

        if (!customerCedula && !customerName && !customerId) {
          throw new Error('Para registrar una venta a crédito (fiado), es obligatorio registrar o seleccionar los datos del cliente.');
        }
      }

      // 3. Resolución o Registro Automático del Cliente
      let resolvedCustomerId: string | null = null;
      let finalCustomerCedula = customerCedula?.trim() || null;
      let finalCustomerName = customerName?.trim() || null;
      let finalCustomerPhone = customerPhone?.trim() || null;
      let finalCustomerEmail = customerEmail?.trim() || null;

      // Buscar cliente por ID o por Cédula
      let customerRecord = null;
      if (customerId) {
        customerRecord = await tx.customer.findUnique({ where: { id: customerId } });
      } else if (finalCustomerCedula) {
        customerRecord = await tx.customer.findUnique({ where: { cedula: finalCustomerCedula } });
      }

      if (customerRecord) {
        if (paymentMethod === 'CREDITO' && pendingAmount > 0) {
          const availableCredit = Math.max(0, (customerRecord.creditLimit || 0) - (customerRecord.balance || 0));
          if (pendingAmount > availableCredit) {
            const error: any = new Error(`Crédito no autorizado: saldo actual $${(customerRecord.balance || 0).toLocaleString('es-CO')}, cupo $${(customerRecord.creditLimit || 0).toLocaleString('es-CO')}. Registra un abono o solicita al administrador ampliar el cupo.`);
            error.statusCode = 400;
            throw error;
          }
        }
        resolvedCustomerId = customerRecord.id;
        finalCustomerCedula = customerRecord.cedula;
        if (!finalCustomerName) finalCustomerName = customerRecord.name;
        if (!finalCustomerPhone) finalCustomerPhone = customerRecord.phone;
        if (!finalCustomerEmail) finalCustomerEmail = customerRecord.email;

        // Si la venta genera saldo por pagar a crédito, actualizar el balance del cliente
        if (pendingAmount > 0 || finalCustomerEmail) {
          await tx.customer.update({
            where: { id: customerRecord.id },
            data: {
              balance: pendingAmount > 0 ? (customerRecord.balance || 0) + pendingAmount : undefined,
              email: finalCustomerEmail || undefined
            }
          });
        }
        if (whatsappOptIn !== undefined && customerRecord.whatsappOptIn !== whatsappOptIn) {
          await tx.customer.update({ where: { id: customerRecord.id }, data: { whatsappOptIn } });
          customerRecord.whatsappOptIn = whatsappOptIn;
        }
      } else if (finalCustomerCedula && finalCustomerName) {
        if (paymentMethod === 'CREDITO' && pendingAmount > 0) {
          const error: any = new Error('Este cliente no tiene un cupo de crédito autorizado. Un administrador debe asignar el cupo antes de vender a crédito.');
          error.statusCode = 400;
          throw error;
        }
        // "en caso de no estar registrado a un cliente quien no se le haya dado una venta esta quedara registrado en la sección de clientes."
        // Crear cliente automáticamente
        const newCustomer = await tx.customer.create({
          data: {
            cedula: finalCustomerCedula,
            name: finalCustomerName,
            phone: finalCustomerPhone,
            email: finalCustomerEmail,
            whatsappOptIn: whatsappOptIn === true,
            address: customerAddress?.trim() || null,
            balance: pendingAmount > 0 ? pendingAmount : 0
          }
        });
        resolvedCustomerId = newCustomer.id;
        customerRecord = newCustomer;
      }

      const previousSales = resolvedCustomerId
        ? await tx.sale.count({ where: { customerId: resolvedCustomerId } })
        : 0;

      // 4. Crear el registro de la venta
      const sale = await tx.sale.create({
        data: {
          totalAmount,
          paymentMethod: paymentMethod || 'EFECTIVO',
          cashGiven: cashGiven ? Number(cashGiven) : (paymentMethod === 'CREDITO' ? 0 : totalAmount),
          changeGiven,
          pendingAmount,
          customerId: resolvedCustomerId,
          customerCedula: finalCustomerCedula,
          customerName: finalCustomerName,
          customerPhone: finalCustomerPhone,
          customerNote: customerNote?.trim() || null,
          items: {
            create: saleItemsToCreate
          }
        },
        include: {
          items: {
            include: { product: true }
          },
          customer: true
        }
      });

      let firstPurchaseContact: { name: string; phone: string } | null = null;
      if (resolvedCustomerId && customerRecord?.whatsappOptIn && finalCustomerPhone) {
        if (previousSales === 0) firstPurchaseContact = { name: finalCustomerName || customerRecord.name, phone: finalCustomerPhone };
      }

      return {
        result: { sale, metrics: { totalAmount, totalCost, netProfit: totalAmount - totalCost } },
        firstPurchaseContact
      };
    });

    return { ...result, whatsappWelcome: firstPurchaseContact };
  }

  /**
   * HU-012: Historial de Ventas
   */
  async getSalesHistory(startDate?: string, endDate?: string) {
    const dateRange = this.buildDateRange(startDate, endDate);
    return await prisma.sale.findMany({
      ...(dateRange ? { where: { createdAt: dateRange } } : {}),
      include: {
        items: {
          include: { product: true }
        },
        customer: true,
        allocations: { include: { payment: true }, orderBy: { createdAt: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * HU-013: Cálculo de Ganancias (Ventas Totales - Costos Totales)
   */
  private buildDateRange(startDate?: string, endDate?: string) {
    if (!startDate && !endDate) return undefined;
    const startValue = startDate || endDate!;
    const endValue = endDate || startValue;
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(startValue) || !datePattern.test(endValue) || startValue > endValue) {
      const error: any = new Error('El rango de fechas no es válido.');
      error.statusCode = 400;
      throw error;
    }
    // La operación trabaja con hora local de Colombia (UTC-5).
    const start = new Date(`${startValue}T00:00:00-05:00`);
    const end = new Date(`${endValue}T00:00:00-05:00`);
    end.setUTCDate(end.getUTCDate() + 1);
    return { gte: start, lt: end };
  }

  async getProfitMetrics(month?: string, startDate?: string, endDate?: string) {
    const dateRange = this.buildDateRange(startDate, endDate);
    const [year, monthNumber] = (month || new Date().toISOString().slice(0, 7)).split('-').map(Number);
    const start = new Date(`${month || `${year}-${String(monthNumber).padStart(2, '0')}`}-01T00:00:00-05:00`);
    const end = new Date(year, monthNumber - 1, 1);
    end.setUTCMonth(end.getUTCMonth() + 1);
    const sales = await prisma.sale.findMany({
      // Las ventas no tienen purchaseDate: la fecha del registro está en createdAt.
      // Filtrar por un campo inexistente impedía consultar correctamente ventas anteriores.
      where: { createdAt: dateRange || { gte: start, lt: end } },
      include: {
        items: {
          include: { product: true }
        }
      }
    });
    const [purchaseSummary, products, customerPayments, supplierPayments] = await Promise.all([prisma.purchase.aggregate({
      where: { createdAt: dateRange || { gte: start, lt: end } },
      _sum: { totalAmount: true }
    }), prisma.product.findMany({ select: { stock: true, costPrice: true } }),
    prisma.customerPayment.findMany({ where: { createdAt: dateRange || { gte: start, lt: end } }, select: { amount: true, paymentMethod: true } }),
    prisma.purchasePayment.aggregate({ where: { createdAt: dateRange || { gte: start, lt: end } }, _sum: { amount: true } })]);

    let totalRevenue = 0;
    let totalCost = 0;
    const collectionsByMethod: Record<string, number> = { EFECTIVO: 0, TRANSFERENCIA: 0, TARJETA: 0, CREDITO: 0 };

    for (const sale of sales) {
      totalRevenue += sale.totalAmount;
      const paid = Math.max(0, sale.totalAmount - (sale.pendingAmount || 0));
      const method = sale.paymentMethod in collectionsByMethod ? sale.paymentMethod : 'EFECTIVO';
      if (method !== 'CREDITO') collectionsByMethod[method] += paid;
      for (const item of sale.items) {
        totalCost += item.costPriceAtSale * item.quantity;
      }
    }

    // Abonos a ventas a crédito son recaudos del período y deben sumarse por su propio método.
    for (const payment of customerPayments) {
      const method = payment.paymentMethod in collectionsByMethod ? payment.paymentMethod : 'EFECTIVO';
      collectionsByMethod[method] += payment.amount;
    }
    const receivables = await prisma.customer.aggregate({ _sum: { balance: true } });
    const payables = await prisma.purchase.findMany({ where: { totalAmount: { gt: 0 } }, select: { totalAmount: true, amountPaid: true } });
    const totalPayables = payables.reduce((sum, p) => sum + Math.max(0, p.totalAmount - p.amountPaid), 0);
    const inventoryValue = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);

    const netProfit = totalRevenue - totalCost;

    return {
      totalSalesCount: sales.length,
      totalRevenue,
      totalCost,
      totalPurchases: purchaseSummary._sum.totalAmount || 0,
      netProfit,
      marginPercentage: totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(2)) : 0,
      collectionsByMethod,
      totalCollections: Object.values(collectionsByMethod).reduce((sum, n) => sum + n, 0),
      totalReceivables: receivables._sum.balance || 0,
      totalPayables,
      supplierPayments: supplierPayments._sum.amount || 0,
      inventoryValue,
      overdueReceivables: null
    };
  }
}

export const salesService = new SalesService();
