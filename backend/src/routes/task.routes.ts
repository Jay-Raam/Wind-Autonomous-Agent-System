import { Router } from 'express';
import { TaskController } from '../controllers/task.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { createTaskSchema } from '../validators/task.validators.js';

const router = Router();
const taskController = new TaskController();

router.use(authMiddleware);
router.post('/', validateBody(createTaskSchema), (req, res, next) => taskController.create(req, res, next));
router.get('/', (req, res, next) => taskController.list(req, res, next));
router.get('/:id', (req, res, next) => taskController.getById(req, res, next));

export const taskRoutes = router;
