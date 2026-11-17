import { prisma } from '../utils/prisma.js';

export interface CreateProductDTO {
  name: string;
  category?: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock?: number;
  image?: string;
  supplierId: string;
  expirationDate?: string | null;
}

export interface UpdateProductDTO {
  name?: string;
  category?: string;
  description?: string;
  costPrice?: number;
  sellingPrice?: number;
  stock?: number;
  minStock?: number;
  image?: string;
  supplierId?: string;
  expirationDate?: string | null;
}

function parseExpirationDate(value?: string | null) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const error: any = new Error('La fecha de vencimiento no es válida.');
    error.statusCode = 400;
    throw error;
  }
  const date = new Date(`${value}T12:00:00-05:00`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    const error: any = new Error('La fecha de vencimiento no es válida.');
    error.statusCode = 400;
    throw error;
  }
  return date;
}

const mockProducts: any[] = [
  {
    id: 'prod-demo-1',
    name: 'Arroz Diana 1Kg',
    description: 'Bolsa de arroz grano entero 1000g',
    category: 'Abarrotes',
    costPrice: 3200,
    sellingPrice: 4000,
    stock: 45,
    minStock: 10,
    supplierId: 'sup-demo-1',
    supplier: { id: 'sup-demo-1', name: 'Distribuidora Montería S.A.S.', phone: '+57 300 123 4567' }
  },
  {
    id: 'prod-demo-2',
    name: 'Aceite Gourmet 900ml',
    description: 'Aceite vegetal refinado sin colesterol',
    category: 'Abarrotes',
    costPrice: 8500,
    sellingPrice: 11000,
    stock: 20,
    minStock: 5,
    supplierId: 'sup-demo-1',
    supplier: { id: 'sup-demo-1', name: 'Distribuidora Montería S.A.S.', phone: '+57 300 123 4567' }
  },
  {
    id: 'prod-demo-3',
    name: 'Café Sello Rojo 500g',
    description: 'Café molido tostado tradicional',
    category: 'Bebidas',
    costPrice: 12000,
    sellingPrice: 15500,
    stock: 3, // Stock Crítico (3 <= minStock 5) para probar alerta HU-009
    minStock: 5,
    supplierId: 'sup-demo-1',
    supplier: { id: 'sup-demo-1', name: 'Distribuidora Montería S.A.S.', phone: '+57 300 123 4567' }
  }
];

export class ProductsService {
  async writeOff(id: string, quantity: number, reason: string) {
    if (!Number.isInteger(quantity) || quantity < 1 || !reason?.trim()) {
      const error: any = new Error('Indica una cantidad entera y el motivo de la baja.'); error.statusCode = 400; throw error;
    }
    return prisma.$transaction(async tx => {
      const product = await tx.product.findUnique({ where: { id } });
      if (!product) { const error: any = new Error('Producto no encontrado.'); error.statusCode = 404; throw error; }
      if (quantity > product.stock) { const error: any = new Error(`Stock insuficiente. Disponible: ${product.stock}.`); error.statusCode = 400; throw error; }
      const updated = await tx.product.update({ where: { id }, data: { stock: { decrement: quantity } }, include: { supplier: true } });
      await tx.inventoryMovement.create({ data: { productId: id, type: 'MERMA', quantity: -quantity, unitCost: product.costPrice, note: reason.trim() } });
      return updated;
    });
  }

  async getMovements(id: string) {
    return prisma.inventoryMovement.findMany({ where: { productId: id }, orderBy: { createdAt: 'desc' }, take: 100 });
  }
  async createProduct(data: CreateProductDTO) {
    if (!data.name || data.name.trim() === '') {
      const error: any = new Error('El nombre del producto es obligatorio.');
      error.statusCode = 400;
      throw error;
    }

    if (!data.supplierId) {
      const error: any = new Error('Debes seleccionar un proveedor para este producto.');
      error.statusCode = 400;
      throw error;
    }

    if (Number(data.stock) < 0) {
      const error: any = new Error('El stock debe ser un número mayor o igual a 0.');
      error.statusCode = 400;
      throw error;
    }

    try {
      return await prisma.product.create({
        data: {
          name: data.name.trim(),
          category: data.category?.trim() || 'General',
          description: data.description?.trim(),
          costPrice: Number(data.costPrice),
          sellingPrice: Number(data.sellingPrice),
          stock: Number(data.stock),
          minStock: data.minStock !== undefined ? Number(data.minStock) : 5,
          image: data.image || null,
          supplierId: data.supplierId,
          expirationDate: parseExpirationDate(data.expirationDate)
        },
        include: { supplier: true }
      });
    } catch (err: any) {
      if (err.statusCode) throw err;
      const newProd = {
        id: `prod-mock-${Date.now()}`,
        name: data.name.trim(),
        category: data.category?.trim() || 'General',
        description: data.description?.trim(),
        costPrice: Number(data.costPrice),
        sellingPrice: Number(data.sellingPrice),
        stock: Number(data.stock),
        minStock: data.minStock !== undefined ? Number(data.minStock) : 5,
        expirationDate: data.expirationDate ? parseExpirationDate(data.expirationDate) : null,
        supplierId: data.supplierId,
        supplier: { id: data.supplierId, name: 'Distribuidora Montería S.A.S.' }
      };
      mockProducts.push(newProd);
      return newProd;
    }
  }

  async getProducts(query?: string, page: number = 1, limit: number = 10) {
    try {
      const dbProducts = await prisma.product.findMany({
        include: { supplier: true },
        orderBy: { updatedAt: 'desc' }
      });
      if (dbProducts.length > 0) {
        return { products: dbProducts, pagination: { total: dbProducts.length, page, limit, totalPages: 1 } };
      }
    } catch (err) {
      // Fallback
    }

    const filtered = query
      ? mockProducts.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      : mockProducts;

    return {
      products: filtered,
      pagination: { total: filtered.length, page, limit, totalPages: 1 }
    };
  }

  async getStockAlerts() {
    const prods = await this.getProducts();
    const criticalProducts = prods.products.filter((p: any) => p.stock <= p.minStock);
    const dateKey = (date: Date) => {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
      const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
      return `${values.year}-${values.month}-${values.day}`;
    };
    const limit = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    let expiringProducts: any[] = [];
    try {
      const lots = await prisma.purchaseItem.findMany({ where: { expirationDate: { lte: limit }, quantity: { gt: 0 } }, include: { product: { include: { supplier: true } }, purchase: true }, orderBy: { expirationDate: 'asc' } });
      expiringProducts = lots.map((lot: any) => ({ ...lot.product, id: `${lot.id}`, productId: lot.productId, stock: lot.quantity, expirationDate: lot.expirationDate, invoiceNumber: lot.purchase.invoiceNumber }));
    } catch {
      expiringProducts = prods.products.filter((p: any) => p.expirationDate && p.stock > 0 && dateKey(new Date(p.expirationDate)) <= dateKey(limit));
    }
    return {
      totalAlerts: criticalProducts.length,
      criticalProducts,
      expiringProducts
    };
  }

  async updateProduct(id: string, data: UpdateProductDTO) {
    if (data.stock !== undefined && data.stock !== null && Number(data.stock) < 0) {
      const error: any = new Error('El stock no puede ser un número negativo.');
      error.statusCode = 400;
      throw error;
    }

    try {
      return await prisma.product.update({
        where: { id },
        data: {
          name: data.name ? data.name.trim() : undefined,
          category: data.category !== undefined ? (data.category.trim() || 'General') : undefined,
          description: data.description !== undefined ? data.description.trim() : undefined,
          costPrice: data.costPrice !== undefined ? Number(data.costPrice) : undefined,
          sellingPrice: data.sellingPrice !== undefined ? Number(data.sellingPrice) : undefined,
          stock: data.stock !== undefined && data.stock !== null ? Number(data.stock) : undefined,
          minStock: data.minStock !== undefined ? Number(data.minStock) : undefined,
          supplierId: data.supplierId || undefined,
          expirationDate: data.expirationDate === undefined ? undefined : parseExpirationDate(data.expirationDate)
        },
        include: { supplier: true }
      });
    } catch (err: any) {
      if (err.statusCode) throw err;
      const idx = mockProducts.findIndex(p => p.id === id);
      if (idx !== -1) {
        mockProducts[idx] = { ...mockProducts[idx], ...data };
        return mockProducts[idx];
      }
      const error: any = new Error('Producto no encontrado.');
      error.statusCode = 404;
      throw error;
    }
  }

  async increaseStock(id: string, quantityToAdd: number) {
    try {
      const existing = await prisma.product.findUnique({ where: { id } });
      if (existing) {
        return await prisma.product.update({
          where: { id },
          data: { stock: existing.stock + Number(quantityToAdd) },
          include: { supplier: true }
        });
      }
    } catch (err) {
      // Fallback
    }

    const target = mockProducts.find(p => p.id === id);
    if (target) {
      target.stock += Number(quantityToAdd);
      return target;
    }

    const error: any = new Error('Producto no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  async deleteProduct(id: string) {
    try {
      const linkedPurchases = await prisma.purchaseItem.count({ where: { productId: id } });
      if (linkedPurchases > 0) {
        const error: any = new Error('Este producto tiene compras registradas y no se puede eliminar sin perder su historial.');
        error.statusCode = 400;
        throw error;
      }
      await prisma.product.delete({ where: { id } });
      return { message: 'Producto eliminado exitosamente.' };
    } catch (err) {
      if ((err as any).statusCode) throw err;
      const idx = mockProducts.findIndex(p => p.id === id);
      if (idx !== -1) {
        mockProducts.splice(idx, 1);
        return { message: 'Producto eliminado exitosamente del inventario.' };
      }
      const error: any = new Error('Producto no encontrado.');
      error.statusCode = 404;
      throw error;
    }
  }
}

export const productsService = new ProductsService();
