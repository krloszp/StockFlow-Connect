import { Request, Response, NextFunction } from 'express';
import { salesService } from '../services/sales.service.js';

export const createSaleController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await salesService.createSale(req.body);
    res.status(201).json({ message: 'Venta registrada exitosamente.', ...result });
  } catch (error) {
    next(error);
  }
};

export const getSalesHistoryController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sales = await salesService.getSalesHistory(req.query.startDate as string | undefined, req.query.endDate as string | undefined);
    res.status(200).json({ sales });
  } catch (error) {
    next(error);
  }
};

export const getProfitMetricsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const metrics = await salesService.getProfitMetrics(req.query.month as string | undefined, req.query.startDate as string | undefined, req.query.endDate as string | undefined);
    res.status(200).json(metrics);
  } catch (error) {
    next(error);
  }
};
