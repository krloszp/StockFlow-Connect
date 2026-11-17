import { Router } from 'express';
import { 
  createProductController, getProductsController, getStockAlertsController, 
  updateProductController, increaseStockController, deleteProductController 
  , writeOffController, getMovementsController
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
router.post('/:id/write-off', writeOffController);
router.get('/:id/movements', getMovementsController);
router.delete('/:id', deleteProductController);

export default router;
