import { ToolModel, type ToolDocument } from '../models/tool.model.js';

export class ToolRepository {
  async create(data: Pick<ToolDocument, 'taskId' | 'name' | 'query' | 'status'>): Promise<ToolDocument> {
    return ToolModel.create(data);
  }

  async listByTask(taskId: string): Promise<ToolDocument[]> {
    return ToolModel.find({ taskId }).sort({ createdAt: -1 }).exec();
  }

  async complete(id: string, result: string): Promise<void> {
    await ToolModel.findByIdAndUpdate(id, {
      $set: { status: 'completed', result },
    }).exec();
  }

  async fail(id: string, result: string): Promise<void> {
    await ToolModel.findByIdAndUpdate(id, {
      $set: { status: 'failed', result },
    }).exec();
  }
}
