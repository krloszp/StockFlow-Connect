import { Router } from 'express';
import { 
  createSupplierController, getSuppliersController, 
  updateSupplierController, deleteSupplierController 
} from '../controllers/suppliers.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de proveedores requieren autenticación JWT
router.use(authenticateJWT);

router.post('/', createSupplierController);
router.get('/', getSuppliersController);
router.put('/:id', updateSupplierController);
router.delete('/:id', deleteSupplierController);

export default router;
