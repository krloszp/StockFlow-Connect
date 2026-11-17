import { prisma } from '../utils/prisma.js';

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderDTO {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerCedula?: string;
  items: OrderItemInput[];
}

const normalizeProductCode = (id: string) => id.replace(/[^a-z0-9]/gi, '').toUpperCase();

function withWhatsAppCodes<T extends { id: string }>(products: T[]) {
  const normalized = products.map(product => ({ product, idCode: normalizeProductCode(product.id) }));
  return normalized.map(({ product, idCode }) => {
    let length = Math.min(6, idCode.length);
    while (length < idCode.length && normalized.filter(entry => entry.idCode.startsWith(idCode.slice(0, length))).length > 1) length++;
    return { ...product, whatsappCode: idCode.slice(0, length) };
  });
}

export class OrdersService {
  /**
   * HU-014: Ver Catálogo Público (Público, sin JWT)
   */
  async getPublicCatalog() {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        sellingPrice: true,
        stock: true,
        image: true
      },
      orderBy: { name: 'asc' }
    });
    return withWhatsAppCodes(products).filter(product => product.stock > 0);
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
        customerId: data.customerId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim().replace(/\D/g, ''),
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

  async createAdminWhatsAppOrder(data: CreateOrderDTO) {
    const name = data.customerName?.trim();
    const phone = data.customerPhone?.replace(/\D/g, '');
    const cedula = data.customerCedula?.trim();
    if (!name || !phone || !cedula) {
      const error: any = new Error('Nombre, teléfono y cédula del cliente son obligatorios para registrar el pedido.');
      error.statusCode = 400;
      throw error;
    }
    if (!data.items?.length || data.items.some(item => !Number.isInteger(item.quantity) || item.quantity < 1)) {
      const error: any = new Error('Agrega productos con cantidades enteras mayores a cero.');
      error.statusCode = 400;
      throw error;
    }

    return prisma.$transaction(async tx => {
      let customer = await tx.customer.findUnique({ where: { cedula } });
      if (customer?.phone && customer.phone.replace(/\D/g, '').slice(-10) !== phone.slice(-10)) {
        const error: any = new Error('La cédula ya está asociada a otro teléfono. Verifica los datos del cliente.');
        error.statusCode = 409;
        throw error;
      }
      if (customer) {
        customer = await tx.customer.update({ where: { id: customer.id }, data: { phone, name } });
      } else {
        customer = await tx.customer.create({ data: { cedula, name, phone } });
      }

      const requested = new Map<string, number>();
      for (const item of data.items) requested.set(item.productId, (requested.get(item.productId) || 0) + item.quantity);

      let totalAmount = 0;
      const orderLines = [];
      for (const [productId, quantity] of requested) {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product || product.stock < quantity) {
          const error: any = new Error(product ? `Stock insuficiente para ${product.name}. Disponible: ${product.stock}.` : 'Uno de los productos ya no existe.');
          error.statusCode = 409;
          throw error;
        }
        const subtotal = product.sellingPrice * quantity;
        totalAmount += subtotal;
        orderLines.push({ productId: product.id, quantity, unitPrice: product.sellingPrice, subtotal });
      }

      return tx.order.create({
        data: {
          customerId: customer.id,
          customerCedula: customer.cedula,
          customerName: customer.name,
          customerPhone: phone,
          totalAmount,
          status: 'PENDIENTE',
          source: 'WHATSAPP',
          items: { create: orderLines }
        },
        include: { items: { include: { product: true } } }
      });
    });
  }

  async setOrderPaymentMethod(id: string, paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA') {
    if (!['EFECTIVO', 'TRANSFERENCIA'].includes(paymentMethod)) {
      const error: any = new Error('Selecciona efectivo o transferencia como medio de pago.');
      error.statusCode = 400;
      throw error;
    }
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      const error: any = new Error('Pedido no encontrado.');
      error.statusCode = 404;
      throw error;
    }
    if (order.status !== 'LISTO') {
      const error: any = new Error('El medio de pago se registra cuando el pedido está listo para recoger.');
      error.statusCode = 400;
      throw error;
    }
    return prisma.order.update({ where: { id }, data: { paymentMethod } });
  }

  async createOrderFromWhatsAppCode(input: string) {
    const parts = input.trim().toUpperCase().split('|');
    if (parts.length !== 4 || parts[0] !== 'SF1' || parts[3] !== 'FIN') {
      const error: any = new Error('Código inválido. Formato esperado: SF1|teléfono|CÓDIGO:cantidad,...|FIN.');
      error.statusCode = 400;
      throw error;
    }
    const phone = parts[1].replace(/\D/g, '');
    if (phone.length < 10 || phone.length > 15) {
      const error: any = new Error('El código no contiene un teléfono válido.');
      error.statusCode = 400;
      throw error;
    }
    const requested = new Map<string, number>();
    for (const item of parts[2].split(',')) {
      const match = item.match(/^([A-Z0-9]{4,32}):(\d{1,3})$/);
      if (!match || Number(match[2]) < 1) {
        const error: any = new Error(`Selección inválida en el código: ${item}.`);
        error.statusCode = 400;
        throw error;
      }
      requested.set(match[1], (requested.get(match[1]) || 0) + Number(match[2]));
    }
    if (!requested.size) {
      const error: any = new Error('El código no incluye productos.');
      error.statusCode = 400;
      throw error;
    }
    const normalizedCode = `SF1|${phone}|${Array.from(requested, ([sku, quantity]) => [sku, quantity] as const).sort(([a], [b]) => a.localeCompare(b)).map(([sku, quantity]) => `${sku}:${quantity}`).join(',')}|FIN`;
    const duplicate = await prisma.order.findUnique({ where: { whatsappRequestCode: normalizedCode }, include: { items: { include: { product: true } } } });
    if (duplicate) return { order: duplicate, orderCode: duplicate.id.slice(-8).toUpperCase(), alreadyRegistered: true };

    const customer = await prisma.customer.findFirst({ where: { phone: { contains: phone.slice(-10) } } });
    if (!customer) {
      const error: any = new Error('No encontramos un cliente registrado con ese teléfono. Regístralo en Clientes antes de ingresar el pedido.');
      error.statusCode = 404;
      throw error;
    }

    const products = withWhatsAppCodes(await prisma.product.findMany({ orderBy: { id: 'asc' } }));
    const productByCode = new Map(products.map(product => [product.whatsappCode, product]));
    const orderItems = [];
    let totalAmount = 0;
    for (const [sku, quantity] of requested) {
      const product = productByCode.get(sku);
      if (!product) {
        const error: any = new Error(`No reconocemos el código de producto ${sku}. Pide el catálogo actualizado.`);
        error.statusCode = 400;
        throw error;
      }
      if (product.stock < quantity) {
        const error: any = new Error(`Stock insuficiente de ${product.name}. Disponible: ${product.stock}.`);
        error.statusCode = 409;
        throw error;
      }
      const subtotal = product.sellingPrice * quantity;
      totalAmount += subtotal;
      orderItems.push({ productId: product.id, quantity, unitPrice: product.sellingPrice, subtotal });
    }

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        customerCedula: customer.cedula,
        customerName: customer.name,
        customerPhone: phone,
        totalAmount,
        status: 'PENDIENTE',
        source: 'WHATSAPP',
        whatsappRequestCode: normalizedCode,
        items: { create: orderItems }
      },
      include: { items: { include: { product: true } } }
    });
    return { order, orderCode: order.id.slice(-8).toUpperCase(), alreadyRegistered: false };
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
  async updateOrderStatus(id: string, status: 'LISTO' | 'COMPLETADO' | 'CANCELADO') {
    if (!['LISTO', 'COMPLETADO', 'CANCELADO'].includes(status)) {
      const error: any = new Error('Estado de pedido no válido.');
      error.statusCode = 400;
      throw error;
    }
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      const error: any = new Error('Pedido no encontrado.');
      error.statusCode = 404;
      throw error;
    }

    if (status === 'COMPLETADO') {
      if (existing.status !== 'LISTO' && existing.status !== 'COMPLETADO') {
        const error: any = new Error('El pedido debe estar listo para registrarlo como venta.');
        error.statusCode = 400;
        throw error;
      }
      return prisma.$transaction(async tx => {
        const order = await tx.order.findUnique({
          where: { id },
          include: { items: { include: { product: true } } }
        });
        if (!order || (order.status !== 'LISTO' && order.status !== 'COMPLETADO')) {
          const error: any = new Error('El pedido ya no está disponible para completar.');
          error.statusCode = 409;
          throw error;
        }

        const quantities = new Map<string, number>();
        for (const item of order.items) quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
        for (const [productId, quantity] of quantities) {
          const product = await tx.product.findUnique({ where: { id: productId } });
          if (!product || product.stock < quantity) {
            const error: any = new Error(product ? `Stock insuficiente para ${product.name}. Disponible: ${product.stock}.` : 'Uno de los productos del pedido ya no existe.');
            error.statusCode = 409;
            throw error;
          }
          await tx.product.update({ where: { id: productId }, data: { stock: product.stock - quantity } });
        }

        const paymentMethod = order.paymentMethod === 'TRANSFERENCIA' ? 'TRANSFERENCIA' : 'EFECTIVO';
        const sale = await tx.sale.create({
          data: {
            totalAmount: order.totalAmount,
            paymentMethod,
            cashGiven: order.totalAmount,
            changeGiven: 0,
            pendingAmount: 0,
            customerId: order.customerId,
            customerCedula: order.customerCedula,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            items: { create: order.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              costPriceAtSale: item.product.costPrice,
              subtotal: item.subtotal
            })) }
          },
          include: { items: { include: { product: true } }, customer: true }
        });
        await tx.order.delete({ where: { id } });
        return sale;
      });
    }

    return await prisma.order.update({
      where: { id },
      data: { status }
    });
  }

  async deleteCancelledOrder(id: string) {
    const order = await prisma.order.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!order) {
      const error: any = new Error('Pedido no encontrado.');
      error.statusCode = 404;
      throw error;
    }
    if (order.status !== 'CANCELADO') {
      const error: any = new Error('Solo se pueden eliminar pedidos cancelados.');
      error.statusCode = 400;
      throw error;
    }
    await prisma.order.delete({ where: { id } });
    return { message: 'Pedido cancelado eliminado.' };
  }

  /**
   * Consultar Pedidos por Teléfono (Público — Vista Cliente)
   */
  async getOrdersByPhone(phone: string) {
    const normalizedPhone = phone?.trim().replace(/\D/g, '');
    if (!normalizedPhone) {
      const error: any = new Error('Ingresa tu número de teléfono para consultar tus pedidos.');
      error.statusCode = 400;
      throw error;
    }

    const orders = await prisma.order.findMany({
      where: { customerPhone: { contains: normalizedPhone } },
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
