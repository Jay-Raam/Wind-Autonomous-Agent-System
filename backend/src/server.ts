import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase, ensureMongoIndexes } from './config/database.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { logger } from './utils/logger.js';
import { initSocketServer } from './sockets/socket.server.js';
import { startTaskWorker, stopTaskWorker } from './workers/task.worker.js';
import { startAgentWorker, stopAgentWorker } from './workers/agent.worker.js';
import { startToolWorker, stopToolWorker } from './workers/tool.worker.js';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await ensureMongoIndexes();
  const redisReady = await connectRedis();

  const app = createApp();
  const httpServer = createServer(app);

  initSocketServer(httpServer);

  if (redisReady) {
    startTaskWorker();
    startAgentWorker();
    startToolWorker();
  }

  httpServer.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'Server started');
  });

  const shutdown = async (): Promise<void> => {
    logger.info('Shutting down');

    if (redisReady) {
      await Promise.all([stopTaskWorker(), stopAgentWorker(), stopToolWorker()]);
    }
    await disconnectRedis();
    await disconnectDatabase();

    httpServer.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  logger.error({ err: error }, 'Fatal startup error');
  process.exit(1);
});
