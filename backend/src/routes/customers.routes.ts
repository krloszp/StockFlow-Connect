import { Router } from 'express';
import {
  createCustomerController,
  getCustomersController,
  searchCustomersController,
  getCustomerByIdController,
  updateCustomerController,
  deleteCustomerController,
  registerPaymentController
} from '../controllers/customers.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de clientes protegidas con autenticación
router.use(authenticateJWT);

router.post('/', createCustomerController);
router.get('/', getCustomersController);
router.get('/search', searchCustomersController);
router.get('/:id', getCustomerByIdController);
router.put('/:id', updateCustomerController);
router.delete('/:id', deleteCustomerController);
router.post('/:id/payments', registerPaymentController);

export default router;
