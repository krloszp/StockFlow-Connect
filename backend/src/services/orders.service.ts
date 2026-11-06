import { prisma } from '../utils/prisma.js';

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderDTO {
  customerName: string;
  customerPhone: string;
  items: OrderItemInput[];
}

export class OrdersService {
  /**
   * HU-014: Ver Catálogo Público (Público, sin JWT)
   */
  async getPublicCatalog() {
    return await prisma.product.findMany({
      where: {
        stock: { gt: 0 } // Solo mostrar productos con disponibilidad
      },
      select: {
        id: true,
        name: true,
        description: true,
        sellingPrice: true,
        stock: true,
        image: true
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * HU-016: Enviar Pedido (Público, sin JWT)
   */
  async createOrder(data: CreateOrderDTO) {
    const { customerName, customerPhone, items } = data;

    if (!customerName || customerName.trim() === '') {
      const error: any = new Error('Por favor, ingresa tu nombre completo.');
      error.statusCode = 400;
      throw error;
    }

    if (!customerPhone || customerPhone.trim() === '') {
      const error: any = new Error('Por favor, ingresa tu número de contacto/WhatsApp.');
      error.statusCode = 400;
      throw error;
    }

    if (!items || items.length === 0) {
      const error: any = new Error('El pedido debe incluir al menos un producto.');
      error.statusCode = 400;
      throw error;
    }

    let totalAmount = 0;
    const orderItemsToCreate = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        throw new Error(`El producto solicitado no está disponible.`);
      }

      const subtotal = product.sellingPrice * item.quantity;
      totalAmount += subtotal;

      orderItemsToCreate.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.sellingPrice,
        subtotal
      });
    }

    const order = await prisma.order.create({
      data: {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        totalAmount,
        status: 'PENDIENTE',
        items: {
          create: orderItemsToCreate
        }
      },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    return {
      message: '¡Pedido enviado exitosamente! El comerciante se pondrá en contacto contigo a la brevedad.',
      order
    };
  }

  /**
   * Listar Pedidos (Solo para Administrador en Dashboard)
   */
  async getAdminOrders() {
    return await prisma.order.findMany({
      include: {
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Cambiar Estado del Pedido (Completar / Cancelar)
   */
  async updateOrderStatus(id: string, status: 'COMPLETADO' | 'CANCELADO') {
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      const error: any = new Error('Pedido no encontrado.');
      error.statusCode = 404;
      throw error;
    }

    return await prisma.order.update({
      where: { id },
      data: { status }
    });
  }
  /**
   * Consultar Pedidos por Teléfono (Público — Vista Cliente)
   */
  async getOrdersByPhone(phone: string) {
    if (!phone || phone.trim() === '') {
      const error: any = new Error('Ingresa tu número de teléfono para consultar tus pedidos.');
      error.statusCode = 400;
      throw error;
    }

    const orders = await prisma.order.findMany({
      where: { customerPhone: { contains: phone.trim() } },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, description: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { orders };
  }
}

export const ordersService = new OrdersService();
