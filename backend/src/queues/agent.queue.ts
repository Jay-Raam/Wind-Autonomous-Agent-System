import { Queue } from 'bullmq';
import { bullmqRedis, isRedisAvailable } from '../config/redis.js';
import { env } from '../config/env.js';
import { QUEUE_NAMES } from './queue.constants.js';

export interface AgentJobData {
  taskId: string;
}

let agentQueue: Queue<AgentJobData> | null = null;

export function getAgentQueue(): Queue<AgentJobData> | null {
  if (!env.REDIS_ENABLED || !isRedisAvailable()) {
    return null;
  }

  if (!agentQueue) {
    agentQueue = new Queue<AgentJobData>(QUEUE_NAMES.AGENT_QUEUE, {
      connection: bullmqRedis,
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 1000,
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 1000,
        },
      },
    });
  }

  return agentQueue;
}
