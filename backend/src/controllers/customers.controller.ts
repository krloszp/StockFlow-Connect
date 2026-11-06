import { Request, Response, NextFunction } from 'express';
import { customersService } from '../services/customers.service.js';

export const createCustomerController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customer = await customersService.createCustomer(req.body);
    res.status(201).json({ message: 'Cliente registrado exitosamente.', customer });
  } catch (error) {
    next(error);
  }
};

export const getCustomersController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customers = await customersService.getCustomers();
    res.status(200).json({ customers });
  } catch (error) {
    next(error);
  }
};

export const searchCustomersController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = (req.query.query as string) || '';
    const customers = await customersService.searchCustomers(query);
    res.status(200).json({ customers });
  } catch (error) {
    next(error);
  }
};

export const getCustomerByIdController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const customer = await customersService.getCustomerById(id);
    res.status(200).json({ customer });
  } catch (error) {
    next(error);
  }
};

export const updateCustomerController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const customer = await customersService.updateCustomer(id, req.body);
    res.status(200).json({ message: 'Datos del cliente actualizados correctamente.', customer });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomerController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await customersService.deleteCustomer(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const registerPaymentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await customersService.registerPayment(id, req.body);
    res.status(200).json({ message: 'Abono registrado exitosamente.', ...result });
  } catch (error) {
    next(error);
  }
};
