import { Worker } from 'bullmq';
import { bullmqRedis } from '../config/redis.js';
import { QUEUE_NAMES } from '../queues/queue.constants.js';
import type { TaskJobData } from '../queues/task.queue.js';
import { getAgentQueue } from '../queues/agent.queue.js';
import { logger } from '../utils/logger.js';

let taskWorker: Worker<TaskJobData> | null = null;

export function startTaskWorker(): Worker<TaskJobData> {
  taskWorker = new Worker<TaskJobData>(
    QUEUE_NAMES.TASK_QUEUE,
    async (job) => {
      const agentQueue = getAgentQueue();

      if (!agentQueue) {
        throw new Error('AgentQueue is unavailable');
      }

      await agentQueue.add('agent.execute', {
        taskId: job.data.taskId,
      });
    },
    { connection: bullmqRedis, concurrency: 20 },
  );

  taskWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Task worker completed job');
  });

  taskWorker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, err: error }, 'Task worker failed job');
  });

  return taskWorker;
}

export async function stopTaskWorker(): Promise<void> {
  if (taskWorker) {
    await taskWorker.close();
    taskWorker = null;
  }
}
