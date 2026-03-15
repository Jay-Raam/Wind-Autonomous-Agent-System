import { AgentModel, type AgentDocument } from '../models/agent.model.js';

export class AgentRepository {
  async create(data: Pick<AgentDocument, 'taskId' | 'name' | 'status' | 'output'>): Promise<AgentDocument> {
    return AgentModel.create(data);
  }

  async listByTask(taskId: string): Promise<AgentDocument[]> {
    return AgentModel.find({ taskId }).sort({ createdAt: 1 }).exec();
  }

  async updateStatus(agentId: string, status: AgentDocument['status'], output?: string): Promise<void> {
    await AgentModel.findByIdAndUpdate(agentId, {
      $set: { status, ...(output ? { output } : {}) },
    }).exec();
  }
}
