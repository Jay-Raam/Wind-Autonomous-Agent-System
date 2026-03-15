import { Worker } from 'bullmq';
import { bullmqRedis } from '../config/redis.js';
import { QUEUE_NAMES } from '../queues/queue.constants.js';
import type { AgentJobData } from '../queues/agent.queue.js';
import { AgentService } from '../services/agent.service.js';
import { logger } from '../utils/logger.js';

const agentService = new AgentService();
let agentWorker: Worker<AgentJobData> | null = null;

export function startAgentWorker(): Worker<AgentJobData> {
  agentWorker = new Worker<AgentJobData>(
    QUEUE_NAMES.AGENT_QUEUE,
    async (job) => {
      try {
        await agentService.executeTask(job.data.taskId, job.data.input);
      } catch (error) {
        await agentService.failTask(job.data.taskId, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    },
    { connection: bullmqRedis, concurrency: 10 },
  );

  agentWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Agent worker completed job');
  });

  agentWorker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, err: error }, 'Agent worker failed job');
  });

  return agentWorker;
}

export async function stopAgentWorker(): Promise<void> {
  if (agentWorker) {
    await agentWorker.close();
    agentWorker = null;
  }
}
