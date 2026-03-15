import { TaskLogModel, type TaskLogDocument } from '../models/task-log.model.js';

export class TaskLogRepository {
  async create(data: Pick<TaskLogDocument, 'taskId' | 'event' | 'payload'>): Promise<TaskLogDocument> {
    return TaskLogModel.create(data);
  }

  async listByTask(taskId: string): Promise<TaskLogDocument[]> {
    return TaskLogModel.find({ taskId }).sort({ createdAt: 1 }).exec();
  }
}
