import { Router } from 'express';
import { getBusinessSettingsController, updateBusinessSettingsController } from '../controllers/settings.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Obtener datos del negocio (abierto para consulta en POS, Sidebar y Tickets)
router.get('/business', getBusinessSettingsController);

// Registrar y actualizar datos del negocio (protegido por JWT)
router.put('/business', authenticateJWT, updateBusinessSettingsController);

export default router;
