import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { updateSettingsSchema } from '../validators/settings.validators.js';

const router = Router();
const settingsController = new SettingsController();

router.use(authMiddleware);
router.get('/', (req, res, next) => settingsController.get(req, res, next));
router.put('/', validateBody(updateSettingsSchema), (req, res, next) => settingsController.update(req, res, next));

export const settingsRoutes = router;