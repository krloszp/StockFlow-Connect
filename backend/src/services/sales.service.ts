import { prisma } from '../utils/prisma.js';
import { PaymentMethod } from '@prisma/client';

export interface SaleItemInput {
  productId: string;
  quantity: number;
}

export interface CreateSaleDTO {
  paymentMethod: PaymentMethod;
  cashGiven?: number;
  items: SaleItemInput[];
}

export class SalesService {
  /**
   * HU-010: Registrar Venta Rápida POS
   */
  async createSale(data: CreateSaleDTO) {
    const { paymentMethod, cashGiven, items } = data;

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

      // 2. Manejo de vuelto/cambio en Efectivo
      let changeGiven = 0;
      if (paymentMethod === 'EFECTIVO') {
        if (cashGiven !== undefined && Number(cashGiven) < totalAmount) {
          throw new Error(`El dinero recibido ($${cashGiven}) es menor al total de la venta ($${totalAmount}).`);
        }
        if (cashGiven !== undefined) {
          changeGiven = Number(cashGiven) - totalAmount;
        }
      }

      // 3. Crear el registro de la venta
      const sale = await tx.sale.create({
        data: {
          totalAmount,
          paymentMethod: paymentMethod || 'EFECTIVO',
          cashGiven: cashGiven ? Number(cashGiven) : totalAmount,
          changeGiven,
          items: {
            create: saleItemsToCreate
          }
        },
        include: {
          items: {
            include: { product: true }
          }
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
        }
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
