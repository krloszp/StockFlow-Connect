import { Request, Response, NextFunction } from 'express';
import { suppliersService } from '../services/suppliers.service.js';
import { purchasesService } from '../services/purchases.service.js';

export const createPurchaseController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const purchase = await purchasesService.createPurchase(req.body);
    res.status(201).json({ message: 'Compra registrada y agregada al inventario.', purchase });
  } catch (error) { next(error); }
};

export const getPurchasesController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const purchases = await purchasesService.getPurchases(req.query.startDate as string | undefined, req.query.endDate as string | undefined);
    res.status(200).json({ purchases });
  } catch (error) { next(error); }
};

export const addPurchasePaymentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const purchase = await purchasesService.addPayment(id, Number(req.body.amount), String(req.body.paymentMethod || 'EFECTIVO'), req.body.note);
    res.status(201).json({ message: 'Abono de compra registrado.', purchase });
  } catch (error) { next(error); }
};

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
