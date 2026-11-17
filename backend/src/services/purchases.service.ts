import { prisma } from '../utils/prisma.js';

type PurchaseLineInput = {
  productId?: string;
  quantity: number;
  unitCost: number;
  sellingPrice?: number;
  expirationDate?: string;
  newProduct?: { name: string; category?: string; description?: string; sellingPrice: number; minStock?: number };
};

type PurchaseInput = {
  supplierId?: string;
  supplierName?: string;
  supplierPhone?: string;
  supplierContactName?: string;
  paymentMethod?: string;
  amountPaid?: number;
  invoiceNumber?: string;
  purchaseDate?: string;
  note?: string;
  items: PurchaseLineInput[];
};

const parseDate = (value?: string) => {
  if (!value) return new Date();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T12:00:00-05:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? parsed : null;
};

export class PurchasesService {
  async createPurchase(data: PurchaseInput) {
    if (!Array.isArray(data.items) || data.items.length === 0) {
      const error: any = new Error('Agrega al menos un producto a la compra.');
      error.statusCode = 400;
      throw error;
    }
    if (data.items.some(item => !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1 || !Number.isFinite(Number(item.unitCost)) || Number(item.unitCost) < 0)) {
      const error: any = new Error('Revisa las cantidades y costos de la compra.');
      error.statusCode = 400;
      throw error;
    }
    const purchaseDate = parseDate(data.purchaseDate);
    if (!purchaseDate) {
      const error: any = new Error('La fecha de compra no es válida.');
      error.statusCode = 400;
      throw error;
    }

    return prisma.$transaction(async tx => {
      let supplier = data.supplierId ? await tx.supplier.findUnique({ where: { id: data.supplierId } }) : null;
      if (data.supplierId && !supplier) {
        const error: any = new Error('El proveedor seleccionado no existe.');
        error.statusCode = 400;
        throw error;
      }
      if (!supplier) {
        const name = data.supplierName?.trim();
        if (!name) {
          const error: any = new Error('Selecciona un proveedor o indica el nombre del vendedor.');
          error.statusCode = 400;
          throw error;
        }
        supplier = await tx.supplier.findFirst({ where: data.supplierPhone?.trim()
          ? { OR: [{ phone: data.supplierPhone.trim() }, { name }] }
          : { name } });
        if (!supplier) supplier = await tx.supplier.create({ data: {
          name,
          phone: data.supplierPhone?.trim() || null,
          contactName: data.supplierContactName?.trim() || null
        } });
      }

      const purchaseItems = [];
      let totalAmount = 0;
      for (const line of data.items) {
        const quantity = Number(line.quantity);
        const unitCost = Number(line.unitCost);
        const expirationDate = parseDate(line.expirationDate);
        if (line.expirationDate && !expirationDate) {
          const error: any = new Error('Una de las fechas de vencimiento no es válida.');
          error.statusCode = 400;
          throw error;
        }

        let product;
        if (line.newProduct) {
          const newData = line.newProduct;
          if (!newData.name?.trim() || !Number.isFinite(Number(newData.sellingPrice)) || Number(newData.sellingPrice) < 0) {
            const error: any = new Error('Completa el nombre y un precio de venta válido.');
            error.statusCode = 400;
            throw error;
          }
          product = await tx.product.create({ data: {
            name: newData.name.trim(), category: newData.category?.trim() || 'General',
            description: newData.description?.trim() || null, costPrice: unitCost,
            sellingPrice: Number(newData.sellingPrice), stock: quantity,
            minStock: Number(newData.minStock ?? 5), supplierId: supplier.id,
            expirationDate
          } });
        } else {
          const existing = line.productId ? await tx.product.findUnique({ where: { id: line.productId } }) : null;
          if (!existing) {
            const error: any = new Error('Selecciona un producto existente o agrega los datos del nuevo producto.');
            error.statusCode = 400;
            throw error;
          }
          const sellingPrice = Number(line.sellingPrice ?? existing.sellingPrice);
          if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
            const error: any = new Error(`El precio de venta de ${existing.name} no es válido.`);
            error.statusCode = 400;
            throw error;
          }
          const newStock = existing.stock + quantity;
          const weightedCost = newStock > 0 ? ((existing.stock * existing.costPrice) + (quantity * unitCost)) / newStock : unitCost;
          // The product remains the single catalog/SKU record. Lot expiry and invoice
          // traceability live on PurchaseItem/Purchase instead of duplicate products.
          product = await tx.product.update({ where: { id: existing.id }, data: {
            stock: newStock, costPrice: weightedCost, sellingPrice
          } });
        }
        const subtotal = quantity * unitCost;
        totalAmount += subtotal;
        purchaseItems.push({
          productId: product.id, productName: product.name, quantity, unitCost,
          sellingPriceAtPurchase: product.sellingPrice, subtotal, expirationDate
        });
        await tx.inventoryMovement.create({ data: { productId: product.id, type: 'COMPRA', quantity, unitCost, note: [data.invoiceNumber ? `Factura ${data.invoiceNumber}` : '', expirationDate ? `Vence ${expirationDate.toISOString().slice(0, 10)}` : ''].filter(Boolean).join(' · ') || null } });
      }

      const amountPaid = data.amountPaid === undefined ? (data.paymentMethod === 'CREDITO' ? 0 : totalAmount) : Number(data.amountPaid);
      if (!Number.isFinite(amountPaid) || amountPaid < 0 || amountPaid > totalAmount) {
        const error: any = new Error('El valor pagado debe estar entre cero y el total de la compra.');
        error.statusCode = 400;
        throw error;
      }

      return tx.purchase.create({
        data: {
          totalAmount, supplierId: supplier.id, supplierName: supplier.name,
          paymentMethod: data.paymentMethod || 'EFECTIVO', amountPaid,
          invoiceNumber: data.invoiceNumber?.trim() || null, purchaseDate,
          note: data.note?.trim() || null, items: { create: purchaseItems },
          payments: amountPaid > 0 ? { create: [{ amount: amountPaid, paymentMethod: data.paymentMethod || 'EFECTIVO', note: 'Pago inicial' }] } : undefined
        },
        include: { items: true, payments: true }
      });
    });
  }

  async addPayment(purchaseId: string, amount: number, paymentMethod: string, note?: string) {
    if (!Number.isFinite(amount) || amount <= 0) {
      const error: any = new Error('El abono debe ser mayor que cero.');
      error.statusCode = 400;
      throw error;
    }
    return prisma.$transaction(async tx => {
      const purchase = await tx.purchase.findUnique({ where: { id: purchaseId } });
      if (!purchase) {
        const error: any = new Error('No encontramos la compra.');
        error.statusCode = 404;
        throw error;
      }
      if (purchase.amountPaid + amount > purchase.totalAmount) {
        const error: any = new Error('El abono supera el saldo pendiente de la compra.');
        error.statusCode = 400;
        throw error;
      }
      await tx.purchasePayment.create({ data: { purchaseId, amount, paymentMethod, note: note?.trim() || null } });
      return tx.purchase.update({ where: { id: purchaseId }, data: { amountPaid: { increment: amount } }, include: { items: true, payments: true } });
    });
  }

  async getPurchases(startDate?: string, endDate?: string) {
    let purchaseDate: { gte: Date; lt: Date } | undefined;
    if (startDate || endDate) {
      const start = startDate || endDate!;
      const finish = endDate || start;
      const validStart = parseDate(start);
      const validEnd = parseDate(finish);
      if (!validStart || !validEnd || start > finish) {
        const error: any = new Error('El rango de fechas no es válido.');
        error.statusCode = 400;
        throw error;
      }
      const gte = new Date(`${start}T00:00:00-05:00`);
      const lt = new Date(`${finish}T00:00:00-05:00`);
      lt.setUTCDate(lt.getUTCDate() + 1);
      purchaseDate = { gte, lt };
    }
    return prisma.purchase.findMany({
      where: purchaseDate ? { purchaseDate } : undefined,
      include: { items: true, payments: { orderBy: { createdAt: 'asc' } } },
      orderBy: { purchaseDate: 'desc' }
    });
  }
}

export const purchasesService = new PurchasesService();
