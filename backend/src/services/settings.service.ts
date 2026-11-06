import { prisma } from '../utils/prisma.js';

export interface BusinessSettingsDTO {
  name: string;
  documentType?: string;
  documentNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  receiptMessage?: string;
  currency?: string;
  logoUrl?: string;
}

export class SettingsService {
  /**
   * Obtener configuración actual del negocio.
   * Si no existe ninguna, crea la inicial por defecto.
   */
  async getBusinessSettings() {
    try {
      let settings = await prisma.businessSettings.findFirst();

      if (!settings) {
        settings = await prisma.businessSettings.create({
          data: {
            name: 'StockFlow Connect',
            documentType: 'NIT',
            documentNumber: '900.123.456-7',
            phone: '+57 300 123 4567',
            email: 'contacto@stockflow.com',
            address: 'Calle 24 # 5-30, Centro',
            city: 'Montería, Córdoba',
            receiptMessage: '¡Gracias por su compra! Vuelva pronto.',
            currency: 'COP'
          }
        });
      }

      return settings;
    } catch (error) {
      console.error('Error al obtener configuración de negocio:', error);
      return {
        id: 'default-settings',
        name: 'StockFlow Connect',
        documentType: 'NIT',
        documentNumber: '900.123.456-7',
        phone: '+57 300 123 4567',
        email: 'contacto@stockflow.com',
        address: 'Calle 24 # 5-30, Centro',
        city: 'Montería, Córdoba',
        receiptMessage: '¡Gracias por su compra! Vuelva pronto.',
        currency: 'COP'
      };
    }
  }

  /**
   * Registrar o actualizar datos del negocio
   */
  async updateBusinessSettings(data: BusinessSettingsDTO) {
    if (!data.name || !data.name.trim()) {
      const error: any = new Error('El nombre del negocio es obligatorio.');
      error.statusCode = 400;
      throw error;
    }

    try {
      let settings = await prisma.businessSettings.findFirst();

      if (settings) {
        settings = await prisma.businessSettings.update({
          where: { id: settings.id },
          data: {
            name: data.name.trim(),
            documentType: data.documentType?.trim() || 'NIT',
            documentNumber: data.documentNumber?.trim() || null,
            phone: data.phone?.trim() || null,
            email: data.email?.trim() || null,
            address: data.address?.trim() || null,
            city: data.city?.trim() || null,
            receiptMessage: data.receiptMessage?.trim() || '¡Gracias por su compra!',
            currency: data.currency?.trim() || 'COP',
            logoUrl: data.logoUrl?.trim() || null
          }
        });
      } else {
        settings = await prisma.businessSettings.create({
          data: {
            name: data.name.trim(),
            documentType: data.documentType?.trim() || 'NIT',
            documentNumber: data.documentNumber?.trim() || null,
            phone: data.phone?.trim() || null,
            email: data.email?.trim() || null,
            address: data.address?.trim() || null,
            city: data.city?.trim() || null,
            receiptMessage: data.receiptMessage?.trim() || '¡Gracias por su compra!',
            currency: data.currency?.trim() || 'COP',
            logoUrl: data.logoUrl?.trim() || null
          }
        });
      }

      return {
        message: 'Datos del negocio actualizados exitosamente.',
        settings
      };
    } catch (error: any) {
      if (error.statusCode === 400) throw error;
      console.error('Error al actualizar configuración:', error);
      throw error;
    }
  }
}

export const settingsService = new SettingsService();
