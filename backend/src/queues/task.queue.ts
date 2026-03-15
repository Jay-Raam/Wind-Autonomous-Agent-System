import { Queue } from 'bullmq';
import { bullmqRedis, isRedisAvailable } from '../config/redis.js';
import { env } from '../config/env.js';
import { QUEUE_NAMES } from './queue.constants.js';

export interface TaskJobData {
  taskId: string;
  userId: string;
  input: string;
}

let taskQueue: Queue<TaskJobData> | null = null;

export function getTaskQueue(): Queue<TaskJobData> | null {
  if (!env.REDIS_ENABLED || !isRedisAvailable()) {
    return null;
  }

  if (!taskQueue) {
    taskQueue = new Queue<TaskJobData>(QUEUE_NAMES.TASK_QUEUE, {
      connection: bullmqRedis,
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 1000,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });
  }

  return taskQueue;
}
