import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
const agentController = new AgentController();

router.use(authMiddleware);
router.get('/tasks/:taskId', (req, res, next) => agentController.listByTask(req, res, next));

export const agentRoutes = router;
