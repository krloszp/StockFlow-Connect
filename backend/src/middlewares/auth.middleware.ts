import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayloadData } from '../utils/jwt.js';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayloadData;
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Acceso no autorizado. Token no proporcionado.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado. Por favor, inicia sesión de nuevo.' });
    return;
  }
};
