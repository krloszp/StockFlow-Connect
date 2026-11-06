import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { 
  registerController, 
  loginController, 
  getProfileController,
  updateProfileController 
} from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Rate limiting para login (HU-002: Máximo 5 intentos por minuto por IP)
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 5,
  message: { message: 'Demasiados intentos fallidos. Intenta de nuevo en 5 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rutas de autenticación y perfil
router.post('/register', registerController);
router.post('/login', loginLimiter, loginController);
router.get('/me', authenticateJWT, getProfileController);
router.put('/profile', authenticateJWT, updateProfileController);

export default router;
