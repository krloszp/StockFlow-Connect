import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export const registerController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const loginController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getProfileController = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    const user = await authService.getProfile(userId);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};
