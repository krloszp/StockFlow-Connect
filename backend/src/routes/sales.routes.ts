import { Router } from 'express';
import { createSaleController, getSalesHistoryController, getProfitMetricsController } from '../controllers/sales.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de ventas protegidas con JWT
router.use(authenticateJWT);

router.post('/', createSaleController);
router.get('/', getSalesHistoryController);
router.get('/metrics', getProfitMetricsController);

export default router;
