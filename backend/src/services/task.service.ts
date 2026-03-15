import mongoose from 'mongoose';
import { TaskRepository } from '../repositories/task.repository.js';
import { getTaskQueue } from '../queues/task.queue.js';
import { TaskLogRepository } from '../repositories/task-log.repository.js';
import { AppError } from '../utils/errors.js';
import { deleteCacheByPrefix, getJsonCache, setJsonCache } from '../utils/cache.js';
import { AgentService } from './agent.service.js';

export class TaskService {
  constructor(
    private readonly taskRepository = new TaskRepository(),
    private readonly taskLogRepository = new TaskLogRepository(),
    private readonly agentService = new AgentService(),
  ) {}

  async createTask(userId: string, input: string) {
    const task = await this.taskRepository.create({
      userId: new mongoose.Types.ObjectId(userId),
      input,
    });

    await this.taskLogRepository.create({
      taskId: task._id as mongoose.Types.ObjectId,
      event: 'task_created',
      payload: { input },
    });

    const taskQueue = getTaskQueue();

    if (taskQueue) {
      await taskQueue.add('task.process', {
        taskId: task.id,
        userId,
        input,
      });
    } else {
      setImmediate(async () => {
        try {
          await this.agentService.executeTask(task.id, input);
        } catch (error) {
          await this.agentService.failTask(task.id, error instanceof Error ? error.message : 'Task execution failed');
        }
      });
    }

    await deleteCacheByPrefix(`tasks:${userId}:`);

    return task;
  }

  async listTasks(userId: string) {
    const cacheKey = `tasks:${userId}:list`;
    const cached = await getJsonCache<Awaited<ReturnType<TaskRepository['listByUser']>>>(cacheKey);

    if (cached) {
      return cached;
    }

    const tasks = await this.taskRepository.listByUser(userId);
    await setJsonCache(cacheKey, tasks, 15);

    return tasks;
  }

  async getTask(taskId: string, userId: string) {
    const cacheKey = `tasks:${userId}:detail:${taskId}`;
    const cached = await getJsonCache<{ task: Awaited<ReturnType<TaskRepository['findById']>>; logs: unknown[] }>(cacheKey);

    if (cached?.task) {
      return cached;
    }

    const task = await this.taskRepository.findById(taskId);

    if (!task || task.userId.toString() !== userId) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    const logs = await this.taskLogRepository.listByTask(task.id);

    const response = {
      task,
      logs,
    };

    await setJsonCache(cacheKey, response, 10);

    return response;
  }
}
