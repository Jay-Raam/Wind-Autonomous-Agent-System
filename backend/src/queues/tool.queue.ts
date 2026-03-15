import { Queue } from 'bullmq';
import { bullmqRedis, isRedisAvailable } from '../config/redis.js';
import { env } from '../config/env.js';
import { QUEUE_NAMES } from './queue.constants.js';
import type { ToolName } from '../types/tool.types.js';

export interface ToolJobData {
  taskId: string;
  toolName: ToolName;
  query: string;
  toolRecordId: string;
}

let toolQueue: Queue<ToolJobData> | null = null;

export function getToolQueue(): Queue<ToolJobData> | null {
  if (!env.REDIS_ENABLED || !isRedisAvailable()) {
    return null;
  }

  if (!toolQueue) {
    toolQueue = new Queue<ToolJobData>(QUEUE_NAMES.TOOL_QUEUE, {
      connection: bullmqRedis,
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 1000,
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 500,
        },
      },
    });
  }

  return toolQueue;
}
