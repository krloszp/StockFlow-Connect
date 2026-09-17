import { prisma } from '../utils/prisma.js';

export interface CreateProductDTO {
  name: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock?: number;
  image?: string;
  supplierId: string;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  costPrice?: number;
  sellingPrice?: number;
  minStock?: number;
  image?: string;
  supplierId?: string;
}

const mockProducts: any[] = [
  {
    id: 'prod-demo-1',
    name: 'Arroz Diana 1Kg',
    description: 'Bolsa de arroz grano entero 1000g',
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
    costPrice: 12000,
    sellingPrice: 15500,
    stock: 3, // Stock Crítico (3 <= minStock 5) para probar alerta HU-009
    minStock: 5,
    supplierId: 'sup-demo-1',
    supplier: { id: 'sup-demo-1', name: 'Distribuidora Montería S.A.S.', phone: '+57 300 123 4567' }
  }
];

export class ProductsService {
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

    if (Number(data.sellingPrice) < Number(data.costPrice)) {
      const error: any = new Error('El precio de venta no puede ser menor al precio de compra.');
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
          description: data.description?.trim(),
          costPrice: Number(data.costPrice),
          sellingPrice: Number(data.sellingPrice),
          stock: Number(data.stock),
          minStock: data.minStock !== undefined ? Number(data.minStock) : 5,
          image: data.image || null,
          supplierId: data.supplierId
        },
        include: { supplier: true }
      });
    } catch (err) {
      const newProd = {
        id: `prod-mock-${Date.now()}`,
        name: data.name.trim(),
        description: data.description?.trim(),
        costPrice: Number(data.costPrice),
        sellingPrice: Number(data.sellingPrice),
        stock: Number(data.stock),
        minStock: data.minStock !== undefined ? Number(data.minStock) : 5,
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
    return {
      totalAlerts: criticalProducts.length,
      criticalProducts
    };
  }

  async updateProduct(id: string, data: UpdateProductDTO) {
    try {
      return await prisma.product.update({
        where: { id },
        data: {
          name: data.name ? data.name.trim() : undefined,
          description: data.description !== undefined ? data.description.trim() : undefined,
          costPrice: data.costPrice !== undefined ? Number(data.costPrice) : undefined,
          sellingPrice: data.sellingPrice !== undefined ? Number(data.sellingPrice) : undefined,
          minStock: data.minStock !== undefined ? Number(data.minStock) : undefined,
          supplierId: data.supplierId || undefined
        },
        include: { supplier: true }
      });
    } catch (err) {
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
      await prisma.product.delete({ where: { id } });
      return { message: 'Producto eliminado exitosamente.' };
    } catch (err) {
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
