import type { NextFunction, Request, Response } from 'express';
import { AgentRepository } from '../repositories/agent.repository.js';

const agentRepository = new AgentRepository();

export class AgentController {
  async listByTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const agents = await agentRepository.listByTask(String(req.params.taskId));
      res.status(200).json(agents);
    } catch (error) {
      next(error);
    }
  }
}
