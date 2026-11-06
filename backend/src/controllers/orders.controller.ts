import { Request, Response, NextFunction } from 'express';
import { ordersService } from '../services/orders.service.js';

export const getPublicCatalogController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await ordersService.getPublicCatalog();
    res.status(200).json({ products });
  } catch (error) {
    next(error);
  }
};

export const createOrderController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await ordersService.createOrder(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAdminOrdersController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orders = await ordersService.getAdminOrders();
    res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatusController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body;
    const order = await ordersService.updateOrderStatus(id, status);
    res.status(200).json({ message: 'Estado del pedido actualizado.', order });
  } catch (error) {
    next(error);
  }
};

export const getClientOrdersController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phone } = req.query;
    const result = await ordersService.getOrdersByPhone(phone as string);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
