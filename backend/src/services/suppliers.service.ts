import { prisma } from '../utils/prisma.js';

export interface SupplierDTO {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

const mockSuppliers: any[] = [
  {
    id: 'sup-demo-1',
    name: 'Distribuidora Montería S.A.S.',
    contactName: 'Carlos Mendoza',
    phone: '+57 300 123 4567',
    email: 'contacto@distribuidoramonteria.com',
    address: 'Calle 24 # 5-30, Montería',
    _count: { products: 3 }
  }
];

export class SuppliersService {
  async createSupplier(data: SupplierDTO) {
    if (!data.name || data.name.trim() === '') {
      const error: any = new Error('El nombre del proveedor es obligatorio.');
      error.statusCode = 400;
      throw error;
    }

    try {
      return await prisma.supplier.create({
        data: {
          name: data.name.trim(),
          contactName: data.contactName?.trim(),
          phone: data.phone?.trim(),
          email: data.email?.trim(),
          address: data.address?.trim()
        }
      });
    } catch (err) {
      const newSup = {
        id: `sup-mock-${Date.now()}`,
        name: data.name.trim(),
        contactName: data.contactName?.trim(),
        phone: data.phone?.trim(),
        email: data.email?.trim(),
        address: data.address?.trim(),
        _count: { products: 0 }
      };
      mockSuppliers.push(newSup);
      return newSup;
    }
  }

  async getSuppliers() {
    try {
      const dbSuppliers = await prisma.supplier.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { products: true } } }
      });
      if (dbSuppliers.length > 0) return dbSuppliers;
    } catch (err) {
      // Fallback
    }
    return mockSuppliers;
  }

  async updateSupplier(id: string, data: SupplierDTO) {
    try {
      return await prisma.supplier.update({
        where: { id },
        data: {
          name: data.name ? data.name.trim() : undefined,
          contactName: data.contactName !== undefined ? data.contactName.trim() : undefined,
          phone: data.phone !== undefined ? data.phone.trim() : undefined,
          email: data.email !== undefined ? data.email.trim() : undefined,
          address: data.address !== undefined ? data.address.trim() : undefined
        }
      });
    } catch (err) {
      const idx = mockSuppliers.findIndex(s => s.id === id);
      if (idx !== -1) {
        mockSuppliers[idx] = { ...mockSuppliers[idx], ...data };
        return mockSuppliers[idx];
      }
      const error: any = new Error('Proveedor no encontrado.');
      error.statusCode = 404;
      throw error;
    }
  }

  async deleteSupplier(id: string) {
    try {
      await prisma.supplier.delete({ where: { id } });
      return { message: 'Proveedor eliminado exitosamente.' };
    } catch (err) {
      const idx = mockSuppliers.findIndex(s => s.id === id);
      if (idx !== -1) {
        mockSuppliers.splice(idx, 1);
        return { message: 'Proveedor eliminado exitosamente.' };
      }
      const error: any = new Error('Proveedor no encontrado.');
      error.statusCode = 404;
      throw error;
    }
  }
}

export const suppliersService = new SuppliersService();
