import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;
let redisAvailable = false;

export async function connectRedis(): Promise<void> {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    redisClient = createClient({
      url,
      socket: {
        connectTimeout: 3000,   // fail fast if Redis isn't running
        reconnectStrategy: false, // don't keep retrying
      },
    }) as RedisClientType;

    redisClient.on('error', () => {
      redisAvailable = false;
    });

    // Race connect against a 4s timeout so startup never hangs
    await Promise.race([
      redisClient.connect(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Redis connect timeout')), 4000)
      ),
    ]);

    redisAvailable = true;
    console.log('Redis connected');
  } catch (err) {
    console.warn('Redis unavailable — running without cache:', (err as Error).message);
    redisAvailable = false;
    try { await redisClient?.disconnect(); } catch { /* ignore */ }
    redisClient = null;
  }
}

export async function getCache(key: string): Promise<string | null> {
  if (!redisAvailable || !redisClient) return null;
  try {
    return await redisClient.get(key);
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: string, ttlSeconds = 3600): Promise<void> {
  if (!redisAvailable || !redisClient) return;
  try {
    await redisClient.setEx(key, ttlSeconds, value);
  } catch {
    // silently fail
  }
}
