import IORedis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const sharedOptions = {
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy: () => null,
  reconnectOnError: () => false as const,
};

// Regular client for cache operations
export const redis = new IORedis(env.REDIS_URL, {
  ...sharedOptions,
  maxRetriesPerRequest: 1,
});

// BullMQ requires maxRetriesPerRequest: null for blocking queue operations
export const bullmqRedis = new IORedis(env.REDIS_URL, {
  ...sharedOptions,
  maxRetriesPerRequest: null,
});

for (const client of [redis, bullmqRedis]) {
  client.on('error', (error) => {
    if (env.REDIS_ENABLED) {
      logger.warn({ err: error }, 'Redis client error');
    }
  });
}

let redisAvailable = false;

export async function connectRedis(): Promise<boolean> {
  if (!env.REDIS_ENABLED) {
    logger.warn('Redis is disabled via REDIS_ENABLED=false. Queue workers will not start.');
    redisAvailable = false;
    return false;
  }

  try {
    if (redis.status === 'end' || redis.status === 'wait') {
      await redis.connect();
    }
    if (bullmqRedis.status === 'end' || bullmqRedis.status === 'wait') {
      await bullmqRedis.connect();
    }

    redisAvailable = true;
    logger.info('Redis connected');
    return true;
  } catch (error) {
    redisAvailable = false;
    redis.disconnect(false);
    bullmqRedis.disconnect(false);
    logger.warn({ err: error }, 'Redis unavailable. Running without queue workers.');
    return false;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisAvailable) {
    for (const client of [redis, bullmqRedis]) {
      if (client.status === 'ready' || client.status === 'connect') {
        await client.quit();
      }
    }
  }
}

export function isRedisAvailable(): boolean {
  return redisAvailable;
}
