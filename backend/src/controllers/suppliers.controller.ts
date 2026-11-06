import { Request, Response, NextFunction } from 'express';
import { suppliersService } from '../services/suppliers.service.js';

export const createSupplierController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const supplier = await suppliersService.createSupplier(req.body);
    res.status(201).json({ message: 'Proveedor creado exitosamente.', supplier });
  } catch (error) {
    next(error);
  }
};

export const getSuppliersController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const suppliers = await suppliersService.getSuppliers();
    res.status(200).json({ suppliers });
  } catch (error) {
    next(error);
  }
};

export const updateSupplierController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const supplier = await suppliersService.updateSupplier(id, req.body);
    res.status(200).json({ message: 'Proveedor actualizado exitosamente.', supplier });
  } catch (error) {
    next(error);
  }
};

export const deleteSupplierController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await suppliersService.deleteSupplier(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
