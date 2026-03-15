import type { NextFunction, Request, Response } from 'express';
import { ToolRepository } from '../repositories/tool.repository.js';
import { TaskRepository } from '../repositories/task.repository.js';
import { AppError } from '../utils/errors.js';

const toolRepository = new ToolRepository();
const taskRepository = new TaskRepository();

export class ToolController {
  async listByTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskId = String(req.params.taskId);
      const task = await taskRepository.findById(taskId);

      if (!task || task.userId.toString() !== req.user!.id) {
        throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
      }

      const tools = await toolRepository.listByTask(taskId);
      res.status(200).json(tools);
    } catch (error) {
      next(error);
    }
  }
}
