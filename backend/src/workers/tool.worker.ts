import { Worker } from 'bullmq';
import { bullmqRedis } from '../config/redis.js';
import { QUEUE_NAMES } from '../queues/queue.constants.js';
import type { ToolJobData } from '../queues/tool.queue.js';
import { ToolService } from '../services/tool.service.js';
import { ToolRepository } from '../repositories/tool.repository.js';
import { logger } from '../utils/logger.js';
import { getSocketServer } from '../sockets/socket.server.js';
import { SOCKET_EVENTS } from '../events/socket-events.js';
import mongoose from 'mongoose';

const toolService = new ToolService();
const toolRepository = new ToolRepository();
let toolWorker: Worker<ToolJobData> | null = null;

export function startToolWorker(): Worker<ToolJobData> {
  toolWorker = new Worker<ToolJobData>(
    QUEUE_NAMES.TOOL_QUEUE,
    async (job) => {
      const toolRecord = await toolRepository.create({
        taskId: new mongoose.Types.ObjectId(job.data.taskId),
        name: job.data.toolName,
        query: job.data.query,
        status: 'running',
      });

      try {
        const result = await toolService.execute({
          taskId: job.data.taskId,
          toolName: job.data.toolName,
          query: job.data.query,
        });

        await toolRepository.complete(toolRecord.id, result);

        const io = getSocketServer();
        io.to(job.data.taskId).emit(SOCKET_EVENTS.TOOL_EXECUTED, {
          taskId: job.data.taskId,
          toolName: job.data.toolName,
          status: 'completed',
          result,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Tool execution failed';
        await toolRepository.fail(toolRecord.id, message);

        const io = getSocketServer();
        io.to(job.data.taskId).emit(SOCKET_EVENTS.TOOL_EXECUTED, {
          taskId: job.data.taskId,
          toolName: job.data.toolName,
          status: 'failed',
          result: message,
        });

        throw error;
      }
    },
    { connection: bullmqRedis, concurrency: 15 },
  );

  toolWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Tool worker completed job');
  });

  toolWorker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, err: error }, 'Tool worker failed job');
  });

  return toolWorker;
}

export async function stopToolWorker(): Promise<void> {
  if (toolWorker) {
    await toolWorker.close();
    toolWorker = null;
  }
}
