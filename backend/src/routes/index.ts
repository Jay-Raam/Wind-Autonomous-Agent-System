import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { taskRoutes } from './task.routes.js';
import { agentRoutes } from './agent.routes.js';
import { toolRoutes } from './tool.routes.js';
import { settingsRoutes } from './settings.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/agents', agentRoutes);
router.use('/tools', toolRoutes);
router.use('/settings', settingsRoutes);

export const apiRoutes = router;
