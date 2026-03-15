import { TaskModel, type TaskDocument } from '../models/task.model.js';

export class TaskRepository {
  async create(input: Pick<TaskDocument, 'userId' | 'input'>): Promise<TaskDocument> {
    return TaskModel.create({
      ...input,
      status: 'pending',
    });
  }

  async findById(taskId: string): Promise<TaskDocument | null> {
    return TaskModel.findById(taskId).exec();
  }

  async listByUser(userId: string): Promise<TaskDocument[]> {
    return TaskModel.find({ userId }).sort({ createdAt: -1 }).limit(100).exec();
  }

  async updateStatus(taskId: string, status: TaskDocument['status'], updates?: Partial<TaskDocument>): Promise<void> {
    await TaskModel.findByIdAndUpdate(taskId, {
      $set: {
        status,
        ...updates,
      },
    }).exec();
  }
}
