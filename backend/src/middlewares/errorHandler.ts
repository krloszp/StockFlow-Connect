import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('🔥 Error no capturado:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Tuvimos un problema técnico. Por favor, inténtalo de nuevo en unos minutos.';

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message
  });
};
