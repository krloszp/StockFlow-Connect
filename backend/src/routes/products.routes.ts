import { Router } from 'express';
import { 
  createProductController, getProductsController, getStockAlertsController, 
  updateProductController, increaseStockController, deleteProductController 
} from '../controllers/products.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas de productos protegidas con autenticación
router.use(authenticateJWT);

router.post('/', createProductController);
router.get('/', getProductsController);
router.get('/alerts', getStockAlertsController);
router.put('/:id', updateProductController);
router.patch('/:id/stock', increaseStockController);
router.delete('/:id', deleteProductController);

export default router;
