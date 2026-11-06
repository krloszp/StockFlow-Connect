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
  customerAddress?: string;
  customerNote?: string;
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
      customerAddress,
      customerNote
    } = data;

    if (!items || items.length === 0) {
      const error: any = new Error('El carrito de venta no puede estar vacío.');
      error.statusCode = 400;
      throw error;
    }

    // 1. Validar productos, calcular totales y descontar stock en transacción de base de datos
    return await prisma.$transaction(async (tx) => {
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

        saleItemsToCreate.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.sellingPrice,
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

      // Buscar cliente por ID o por Cédula
      let customerRecord = null;
      if (customerId) {
        customerRecord = await tx.customer.findUnique({ where: { id: customerId } });
      } else if (finalCustomerCedula) {
        customerRecord = await tx.customer.findUnique({ where: { cedula: finalCustomerCedula } });
      }

      if (customerRecord) {
        resolvedCustomerId = customerRecord.id;
        finalCustomerCedula = customerRecord.cedula;
        if (!finalCustomerName) finalCustomerName = customerRecord.name;
        if (!finalCustomerPhone) finalCustomerPhone = customerRecord.phone;

        // Si la venta genera saldo por pagar a crédito, actualizar el balance del cliente
        if (pendingAmount > 0) {
          await tx.customer.update({
            where: { id: customerRecord.id },
            data: { balance: (customerRecord.balance || 0) + pendingAmount }
          });
        }
      } else if (finalCustomerCedula && finalCustomerName) {
        // "en caso de no estar registrado a un cliente quien no se le haya dado una venta esta quedara registrado en la sección de clientes."
        // Crear cliente automáticamente
        const newCustomer = await tx.customer.create({
          data: {
            cedula: finalCustomerCedula,
            name: finalCustomerName,
            phone: finalCustomerPhone,
            address: customerAddress?.trim() || null,
            balance: pendingAmount > 0 ? pendingAmount : 0
          }
        });
        resolvedCustomerId = newCustomer.id;
      }

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

      return {
        sale,
        metrics: {
          totalAmount,
          totalCost,
          netProfit: totalAmount - totalCost
        }
      };
    });
  }

  /**
   * HU-012: Historial de Ventas
   */
  async getSalesHistory() {
    return await prisma.sale.findMany({
      include: {
        items: {
          include: { product: true }
        },
        customer: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * HU-013: Cálculo de Ganancias (Ventas Totales - Costos Totales)
   */
  async getProfitMetrics() {
    const sales = await prisma.sale.findMany({
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    let totalRevenue = 0;
    let totalCost = 0;

    for (const sale of sales) {
      totalRevenue += sale.totalAmount;
      for (const item of sale.items) {
        totalCost += item.product.costPrice * item.quantity;
      }
    }

    const netProfit = totalRevenue - totalCost;

    return {
      totalSalesCount: sales.length,
      totalRevenue,
      totalCost,
      netProfit,
      marginPercentage: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0
    };
  }
}

export const salesService = new SalesService();
