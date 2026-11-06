import { Router } from 'express';
import { 
  getPublicCatalogController, createOrderController, 
  getAdminOrdersController, updateOrderStatusController,
  getClientOrdersController
} from '../controllers/orders.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas Públicas (Sin Autenticación para Clientes Finales)
router.get('/catalog', getPublicCatalogController);
router.post('/checkout', createOrderController);
router.get('/my-orders', getClientOrdersController);

// Rutas Privadas (Administrador)
router.get('/admin', authenticateJWT, getAdminOrdersController);
router.patch('/admin/:id/status', authenticateJWT, updateOrderStatusController);

export default router;
