import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { loginRateLimit } from '../middlewares/rate-limit.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { loginSchema, refreshSchema, registerSchema } from '../validators/auth.validators.js';

const router = Router();
const authController = new AuthController();

router.post('/register', validateBody(registerSchema), (req, res, next) => authController.register(req, res, next));
router.post('/login', loginRateLimit, validateBody(loginSchema), (req, res, next) => authController.login(req, res, next));
router.post('/refresh', validateBody(refreshSchema), (req, res, next) => authController.refresh(req, res, next));
router.post('/logout', authMiddleware, (req, res, next) => authController.logout(req, res, next));

export const authRoutes = router;
