import { Request, Response, NextFunction } from 'express';
import { productsService } from '../services/products.service.js';

export const createProductController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await productsService.createProduct(req.body);
    res.status(201).json({ message: 'Producto creado exitosamente.', product });
  } catch (error) {
    next(error);
  }
};

export const getProductsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = req.query.search as string;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const result = await productsService.getProducts(query, page, limit);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getStockAlertsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const alerts = await productsService.getStockAlerts();
    res.status(200).json(alerts);
  } catch (error) {
    next(error);
  }
};

export const updateProductController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const product = await productsService.updateProduct(id, req.body);
    res.status(200).json({ message: 'Producto actualizado exitosamente.', product });
  } catch (error) {
    next(error);
  }
};

export const increaseStockController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { quantity } = req.body;
    const product = await productsService.increaseStock(id, quantity);
    res.status(200).json({ message: 'Stock actualizado correctamente.', product });
  } catch (error) {
    next(error);
  }
};

export const writeOffController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id; const product = await productsService.writeOff(id, Number(req.body.quantity), String(req.body.reason || '')); res.status(200).json({ product }); } catch (error) { next(error); }
};
export const getMovementsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id; res.status(200).json({ movements: await productsService.getMovements(id) }); } catch (error) { next(error); }
};

export const deleteProductController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await productsService.deleteProduct(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
