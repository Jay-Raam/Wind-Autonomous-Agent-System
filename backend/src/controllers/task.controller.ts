import type { NextFunction, Request, Response } from 'express';
import { TaskService } from '../services/task.service.js';

const taskService = new TaskService();

export class TaskController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await taskService.createTask(req.user!.id, req.body.input);
      res.status(202).json(task);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tasks = await taskService.listTasks(req.user!.id);
      res.status(200).json(tasks);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await taskService.getTask(String(req.params.id), req.user!.id);
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  }
}
