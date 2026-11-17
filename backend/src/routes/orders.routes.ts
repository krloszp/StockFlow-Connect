import { Router } from 'express';
import { 
  getPublicCatalogController, createOrderController, 
  getAdminOrdersController, updateOrderStatusController,
  getClientOrdersController, verifyWhatsAppWebhookController, receiveWhatsAppWebhookController,
  createAdminWhatsAppOrderController, updateOrderPaymentMethodController, createOrderFromWhatsAppCodeController,
  deleteCancelledOrderController
} from '../controllers/orders.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/whatsapp/webhook', verifyWhatsAppWebhookController);
router.post('/whatsapp/webhook', receiveWhatsAppWebhookController);

// Rutas Públicas (Sin Autenticación para Clientes Finales)
router.get('/catalog', getPublicCatalogController);
router.post('/checkout', createOrderController);
router.get('/my-orders', getClientOrdersController);

// Rutas Privadas (Administrador)
router.get('/admin', authenticateJWT, getAdminOrdersController);
router.post('/admin/whatsapp', authenticateJWT, createAdminWhatsAppOrderController);
router.post('/admin/whatsapp-code', authenticateJWT, createOrderFromWhatsAppCodeController);
router.patch('/admin/:id/status', authenticateJWT, updateOrderStatusController);
router.patch('/admin/:id/payment', authenticateJWT, updateOrderPaymentMethodController);
router.delete('/admin/:id', authenticateJWT, deleteCancelledOrderController);

export default router;
