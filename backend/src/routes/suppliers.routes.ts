import { Router } from 'express';
import { 
  createSupplierController, getSuppliersController, 
  updateSupplierController, deleteSupplierController, createPurchaseController, getPurchasesController, addPurchasePaymentController
} from '../controllers/suppliers.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de proveedores requieren autenticación JWT
router.use(authenticateJWT);

router.post('/', createSupplierController);
router.get('/', getSuppliersController);
router.post('/purchases', createPurchaseController);
router.get('/purchases', getPurchasesController);
router.post('/purchases/:id/payments', addPurchasePaymentController);
router.put('/:id', updateSupplierController);
router.delete('/:id', deleteSupplierController);

export default router;
