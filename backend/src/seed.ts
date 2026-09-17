import { prisma } from './utils/prisma.js';
import { hashPassword } from './utils/password.js';

async function seed() {
  console.log('🌱 Sembrando datos de prueba en StockFlow Connect...');

  try {
    // 1. Crear Administrador de Prueba (HU-001 / HU-002)
    const email = 'admin@stockflow.com';
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (!existingUser) {
      const passwordHash = await hashPassword('admin1234');
      await prisma.user.create({
        data: {
          name: 'Administrador de Prueba',
          email,
          passwordHash,
          role: 'ADMIN'
        }
      });
      console.log('✅ Usuario Administrador de Prueba creado: admin@stockflow.com');
    } else {
      console.log('ℹ️ Usuario Administrador ya existía.');
    }

    // 2. Crear Proveedor de Prueba (HU-020)
    let supplier = await prisma.supplier.findFirst();
    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: {
          name: 'Distribuidora Montería S.A.S.',
          contactName: 'Carlos Mendoza',
          phone: '+57 300 123 4567',
          email: 'contacto@distribuidoramonteria.com',
          address: 'Calle 24 # 5-30, Montería'
        }
      });
      console.log('✅ Proveedor de prueba creado.');
    }

    // 3. Crear Productos de Prueba (HU-004 a HU-009)
    const productCount = await prisma.product.count();
    if (productCount === 0 && supplier) {
      await prisma.product.createMany({
        data: [
          {
            name: 'Arroz Diana 1Kg',
            description: 'Bolsa de arroz grano entero 1000g',
            costPrice: 3200,
            sellingPrice: 4000,
            stock: 45,
            minStock: 10,
            supplierId: supplier.id
          },
          {
            name: 'Aceite Gourmet 900ml',
            description: 'Aceite vegetal refinado',
            costPrice: 8500,
            sellingPrice: 11000,
            stock: 20,
            minStock: 5,
            supplierId: supplier.id
          },
          {
            name: 'Café Sello Rojo 500g',
            description: 'Café molido tostado tradicional',
            costPrice: 12000,
            sellingPrice: 15500,
            stock: 3, // Stock Crítico para probar alerta HU-009
            minStock: 5,
            supplierId: supplier.id
          }
        ]
      });
      console.log('✅ Productos de prueba creados.');
    }

    console.log('✨ Semilla de datos completada con éxito.');
  } catch (error) {
    console.error('Error durante la semilla:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
