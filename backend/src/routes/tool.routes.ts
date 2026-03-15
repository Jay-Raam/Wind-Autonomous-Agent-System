import { Router } from 'express';
import { ToolController } from '../controllers/tool.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
const toolController = new ToolController();

router.use(authMiddleware);
router.get('/tasks/:taskId', (req, res, next) => toolController.listByTask(req, res, next));

export const toolRoutes = router;
