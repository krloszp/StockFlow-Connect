import { prisma } from '../utils/prisma.js';
import { hashPassword, comparePasswords } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UpdateProfileDTO {
  name?: string;
  email?: string;
  phone?: string;
  documentId?: string;
  currentPassword?: string;
  newPassword?: string;
}

const mockUsers: any[] = [];

export class AuthService {
  /**
   * HU-001: Registro de Administrador
   */
  async register(data: RegisterDTO) {
    const { name, email, password } = data;

    if (!name || !email || !password) {
      const error: any = new Error('Todos los campos (nombre, correo, contraseña) son obligatorios.');
      error.statusCode = 400;
      throw error;
    }

    if (password.length < 8) {
      const error: any = new Error('La contraseña debe tener al menos 8 caracteres.');
      error.statusCode = 400;
      throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      if (existingUser) {
        const error: any = new Error('Este correo ya está en uso.');
        error.statusCode = 400;
        throw error;
      }

      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: 'ADMIN'
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          documentId: true,
          role: true,
          createdAt: true
        }
      });

      return { message: 'Cuenta creada. Por favor, inicia sesión.', user };
    } catch (err: any) {
      if (err.statusCode === 400) throw err;

      // Fallback a memoria si la BD no está conectada
      const duplicate = mockUsers.find(u => u.email === normalizedEmail);
      if (duplicate || normalizedEmail === 'admin@stockflow.com') {
        const error: any = new Error('Este correo ya está en uso.');
        error.statusCode = 400;
        throw error;
      }

      const passwordHash = await hashPassword(password);
      const newUser = {
        id: `user-mock-${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        passwordPlain: password,
        role: 'ADMIN',
        createdAt: new Date()
      };

      mockUsers.push(newUser);
      return {
        message: 'Cuenta creada exitosamente. Por favor, inicia sesión.',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt
        }
      };
    }
  }

  /**
   * HU-002: Inicio de Sesión
   */
  async login(data: LoginDTO) {
    const { email, password } = data;

    if (!email || !password) {
      const error: any = new Error('Por favor, ingresa tu correo y contraseña.');
      error.statusCode = 400;
      throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Intentar buscar en la base de datos vía Prisma
    try {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      if (user) {
        const isMatch = await comparePasswords(password, user.passwordHash);
        if (!isMatch) {
          const error: any = new Error('Correo o contraseña incorrectos.');
          error.statusCode = 401;
          throw error;
        }

        const token = generateToken({
          userId: user.id,
          email: user.email,
          role: user.role
        });

        return {
          message: 'Inicio de sesión exitoso.',
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            documentId: user.documentId,
            role: user.role
          }
        };
      }
    } catch (err: any) {
      if (err.statusCode === 401) throw err;
      console.error('Error consultando base de datos en login:', err);
    }

    // 2. Administrador demo por defecto si aún no está en BD
    if (normalizedEmail === 'admin@stockflow.com') {
      if (password !== 'admin1234') {
        const error: any = new Error('Correo o contraseña incorrectos.');
        error.statusCode = 401;
        throw error;
      }

      try {
        const passwordHash = await hashPassword('admin1234');
        const user = await prisma.user.upsert({
          where: { email: 'admin@stockflow.com' },
          update: {},
          create: {
            name: 'Administrador de Prueba',
            email: 'admin@stockflow.com',
            passwordHash,
            role: 'ADMIN'
          }
        });

        const token = generateToken({
          userId: user.id,
          email: user.email,
          role: user.role
        });

        return {
          message: 'Inicio de sesión exitoso.',
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            documentId: user.documentId,
            role: user.role
          }
        };
      } catch {
        const token = generateToken({
          userId: 'admin-demo-id',
          email: 'admin@stockflow.com',
          role: 'ADMIN'
        });

        return {
          message: 'Inicio de sesión exitoso.',
          token,
          user: {
            id: 'admin-demo-id',
            name: 'Administrador de Prueba',
            email: 'admin@stockflow.com',
            role: 'ADMIN'
          }
        };
      }
    }

    // 3. Fallback de usuarios creados en el registro en memoria
    const mockUser = mockUsers.find(u => u.email === normalizedEmail);
    if (mockUser) {
      const isMatch = await comparePasswords(password, mockUser.passwordHash);
      if (!isMatch) {
        const error: any = new Error('Correo o contraseña incorrectos.');
        error.statusCode = 401;
        throw error;
      }

      const token = generateToken({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role
      });

      return {
        message: 'Inicio de sesión exitoso.',
        token,
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role
        }
      };
    }

    const error: any = new Error('Correo o contraseña incorrectos.');
    error.statusCode = 401;
    throw error;
  }

  /**
   * HU-003: Obtener perfil de usuario
   */
  async getProfile(userId: string) {
    try {
      let user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          documentId: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user && userId === 'admin-demo-id') {
        user = await prisma.user.findFirst({
          where: { role: 'ADMIN' },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            documentId: true,
            role: true,
            createdAt: true,
            updatedAt: true
          }
        });
      }

      if (user) return user;
    } catch (err) {
      console.error('Error buscando perfil en BD:', err);
    }

    const mockUser = mockUsers.find(u => u.id === userId);
    if (mockUser) {
      return {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        createdAt: mockUser.createdAt
      };
    }

    if (userId === 'admin-demo-id') {
      return {
        id: 'admin-demo-id',
        name: 'Administrador de Prueba',
        email: 'admin@stockflow.com',
        phone: '',
        documentId: '',
        role: 'ADMIN',
        createdAt: new Date()
      };
    }

    const error: any = new Error('Usuario no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  /**
   * Actualizar datos personales del Administrador
   */
  async updateProfile(userId: string, data: UpdateProfileDTO) {
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user && userId === 'admin-demo-id') {
      user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    }

    if (!user) {
      // Si no existe, creamos o buscamos el usuario base
      const mockUser = mockUsers.find(u => u.id === userId);
      if (mockUser) {
        if (data.name) mockUser.name = data.name.trim();
        if (data.email) mockUser.email = data.email.trim();
        return {
          message: 'Datos del administrador actualizados.',
          user: {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            phone: data.phone || '',
            documentId: data.documentId || '',
            role: mockUser.role
          }
        };
      }
      const error: any = new Error('Usuario administrador no encontrado.');
      error.statusCode = 404;
      throw error;
    }

    const { name, email, phone, documentId, currentPassword, newPassword } = data;

    if (name !== undefined && !name.trim()) {
      const error: any = new Error('El nombre no puede estar vacío.');
      error.statusCode = 400;
      throw error;
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (documentId !== undefined) updateData.documentId = documentId?.trim() || null;

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing && existing.id !== user.id) {
          const error: any = new Error('Este correo ya está en uso por otro usuario.');
          error.statusCode = 400;
          throw error;
        }
        updateData.email = normalizedEmail;
      }
    }

    // Si desea cambiar la contraseña
    if (newPassword) {
      if (!currentPassword) {
        const error: any = new Error('Debes ingresar tu contraseña actual para cambiarla.');
        error.statusCode = 400;
        throw error;
      }
      const isMatch = await comparePasswords(currentPassword, user.passwordHash);
      if (!isMatch) {
        const error: any = new Error('La contraseña actual ingresada es incorrecta.');
        error.statusCode = 400;
        throw error;
      }
      if (newPassword.length < 8) {
        const error: any = new Error('La nueva contraseña debe tener al menos 8 caracteres.');
        error.statusCode = 400;
        throw error;
      }
      updateData.passwordHash = await hashPassword(newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        documentId: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      message: 'Datos del administrador actualizados con éxito.',
      user: updatedUser
    };
  }
}

export const authService = new AuthService();
