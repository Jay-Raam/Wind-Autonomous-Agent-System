import { redis } from '../config/redis.js';

export async function getJsonCache<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);

  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as T;
}

export async function setJsonCache(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function deleteCacheByPrefix(prefix: string): Promise<void> {
  const stream = redis.scanStream({
    match: `${prefix}*`,
    count: 100,
  });

  for await (const keys of stream) {
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}