import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Check if Redis is enabled (defaults to false to avoid connection issues)
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

if (!REDIS_ENABLED) {
  logger.info('Redis is DISABLED. All Redis operations will be no-ops.');
}

class RedisClient {
  private static instance: Redis | null = null;
  private static subscriber: Redis | null = null;
  private static publisher: Redis | null = null;

  private constructor() {}

  public static isDisabled(): boolean {
    return !REDIS_ENABLED;
  }

  public static getInstance(): Redis | null {
    if (!REDIS_ENABLED) {
      return null;
    }

    if (!RedisClient.instance) {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const redisPassword = process.env.REDIS_PASSWORD;
      const redisHost = process.env.REDIS_HOST;
      const redisPort = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;
      const redisUsername = process.env.REDIS_USERNAME;

      const options: any = {
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        lazyConnect: true,
        connectTimeout: 30000,
        commandTimeout: 30000,
        tls: redisUrl.includes('rediss://') || (redisHost && redisHost.includes('redis-cloud.com')) ? {} : undefined,
      };

      if (redisPassword) {
        options.password = redisPassword;
      }

      if (redisUsername) {
        options.username = redisUsername;
      }

      if (redisUrl && redisUrl !== 'redis://localhost:6379') {
        RedisClient.instance = new Redis(redisUrl, options);
      } else if (redisHost) {
        RedisClient.instance = new Redis({
          host: redisHost,
          port: redisPort,
          ...options
        });
      } else {
        RedisClient.instance = new Redis(redisUrl, options);
      }

      RedisClient.instance.on('connect', () => {
        logger.info('Redis client connected');
      });

      RedisClient.instance.on('error', (error) => {
        logger.error('Redis client error:', error);
      });

      RedisClient.instance.on('ready', () => {
        logger.info('Redis client ready');
      });
    }

    return RedisClient.instance;
  }

  public static getSubscriber(): Redis | null {
    if (!REDIS_ENABLED) {
      return null;
    }

    if (!RedisClient.subscriber) {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const redisPassword = process.env.REDIS_PASSWORD;
      const redisHost = process.env.REDIS_HOST;
      const redisPort = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;
      const redisUsername = process.env.REDIS_USERNAME;

      const options: any = {
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        lazyConnect: true,
        connectTimeout: 30000,
        commandTimeout: 30000,
        tls: redisUrl.includes('rediss://') || (redisHost && redisHost.includes('redis-cloud.com')) ? {} : undefined,
      };

      if (redisPassword) {
        options.password = redisPassword;
      }

      if (redisUsername) {
        options.username = redisUsername;
      }

      if (redisUrl && redisUrl !== 'redis://localhost:6379') {
        RedisClient.subscriber = new Redis(redisUrl, options);
      } else if (redisHost) {
        RedisClient.subscriber = new Redis({
          host: redisHost,
          port: redisPort,
          ...options
        });
      } else {
        RedisClient.subscriber = new Redis(redisUrl, options);
      }

      RedisClient.subscriber.on('connect', () => {
        logger.info('Redis subscriber connected');
      });

      RedisClient.subscriber.on('error', (error) => {
        logger.error('Redis subscriber error:', error);
      });
    }

    return RedisClient.subscriber;
  }

  public static getPublisher(): Redis | null {
    if (!REDIS_ENABLED) {
      return null;
    }

    if (!RedisClient.publisher) {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const redisPassword = process.env.REDIS_PASSWORD;
      const redisHost = process.env.REDIS_HOST;
      const redisPort = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;
      const redisUsername = process.env.REDIS_USERNAME;

      const options: any = {
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        lazyConnect: true,
        connectTimeout: 30000,
        commandTimeout: 30000,
        tls: redisUrl.includes('rediss://') || (redisHost && redisHost.includes('redis-cloud.com')) ? {} : undefined,
      };

      if (redisPassword) {
        options.password = redisPassword;
      }

      if (redisUsername) {
        options.username = redisUsername;
      }

      if (redisUrl && redisUrl !== 'redis://localhost:6379') {
        RedisClient.publisher = new Redis(redisUrl, options);
      } else if (redisHost) {
        RedisClient.publisher = new Redis({
          host: redisHost,
          port: redisPort,
          ...options
        });
      } else {
        RedisClient.publisher = new Redis(redisUrl, options);
      }

      RedisClient.publisher.on('connect', () => {
        logger.info('Redis publisher connected');
      });

      RedisClient.publisher.on('error', (error) => {
        logger.error('Redis publisher error:', error);
      });
    }

    return RedisClient.publisher;
  }

  public static async disconnect(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.quit();
    }
    if (RedisClient.subscriber) {
      await RedisClient.subscriber.quit();
    }
    if (RedisClient.publisher) {
      await RedisClient.publisher.quit();
    }
  }

  // All methods return no-op/defaults when Redis is disabled
  public static async setCache(key: string, value: any, ttl: number = 3600): Promise<void> {
    if (!REDIS_ENABLED) return;
    const redis = RedisClient.getInstance();
    if (redis) await redis.setex(key, ttl, JSON.stringify(value));
  }

  public static async getCache<T>(key: string): Promise<T | null> {
    if (!REDIS_ENABLED) return null;
    const redis = RedisClient.getInstance();
    if (!redis) return null;
    const value = await redis?.get(key);
    return value ? JSON.parse(value) : null;
  }

  public static async deleteCache(pattern: string): Promise<void> {
    if (!REDIS_ENABLED) return;
    const redis = RedisClient.getInstance();
    if (!redis) return;
    const keys = await redis?.keys(pattern) ?? [];
    if (keys && keys.length > 0) await redis?.del(...keys);
  }

  public static async createSession(sessionId: string, userId: string, data: any, ttl: number = 3600): Promise<void> {
    if (!REDIS_ENABLED) return;
    const redis = RedisClient.getInstance();
    if (redis) await redis.setex(`session:${sessionId}`, ttl, JSON.stringify({ userId, ...data }));
  }

  public static async getSession(sessionId: string): Promise<any | null> {
    if (!REDIS_ENABLED) return null;
    const redis = RedisClient.getInstance();
    if (!redis) return null;
    const session = await redis?.get(`session:${sessionId}`);
    return session ? JSON.parse(session) : null;
  }

  public static async deleteSession(sessionId: string): Promise<void> {
    if (!REDIS_ENABLED) return;
    const redis = RedisClient.getInstance();
    if (redis) await redis.del(`session:${sessionId}`);
  }

  public static async blacklistToken(token: string, ttl: number = 86400): Promise<void> {
    if (!REDIS_ENABLED) return;
    const redis = RedisClient.getInstance();
    if (redis) await redis.setex(`blacklist:${token}`, ttl, '1');
  }

  public static async isTokenBlacklisted(token: string): Promise<boolean> {
    if (!REDIS_ENABLED) return false;
    const redis = RedisClient.getInstance();
    if (!redis) return false;
    const result = await redis?.get(`blacklist:${token}`);
    return result === '1';
  }

  public static async incrementRateLimit(key: string, window: number = 60): Promise<number> {
    if (!REDIS_ENABLED) return 0;
    const redis = RedisClient.getInstance();
    if (!redis) return 0;
    const multi = redis?.multi();
    multi?.incr(key);
    multi?.expire(key, window);
    const results = await multi?.exec();
    return results ? results[0][1] as number : 0;
  }

  public static async acquireLock(resource: string, ttl: number = 10): Promise<boolean> {
    if (!REDIS_ENABLED) return true;
    const redis = RedisClient.getInstance();
    if (!redis) return true;
    const lockKey = `lock:${resource}`;
    const lockValue = `${Date.now()}-${Math.random()}`;
    const result = await redis?.set(lockKey, lockValue, 'EX', ttl, 'NX');
    return result === 'OK';
  }

  public static async releaseLock(resource: string): Promise<void> {
    if (!REDIS_ENABLED) return;
    const redis = RedisClient.getInstance();
    if (redis) await redis.del(`lock:${resource}`);
  }

  public static async pushToQueue(queueName: string, data: any): Promise<void> {
    if (!REDIS_ENABLED) return;
    const redis = RedisClient.getInstance();
    if (redis) await redis.lpush(`queue:${queueName}`, JSON.stringify(data));
  }

  public static async popFromQueue(queueName: string): Promise<any | null> {
    if (!REDIS_ENABLED) return null;
    const redis = RedisClient.getInstance();
    if (!redis) return null;
    const data = await redis?.rpop(`queue:${queueName}`);
    return data ? JSON.parse(data) : null;
  }

  public static async publish(channel: string, message: any): Promise<void> {
    if (!REDIS_ENABLED) return;
    const publisher = RedisClient.getPublisher();
    if (publisher) await publisher.publish(channel, JSON.stringify(message));
  }

  public static async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    if (!REDIS_ENABLED) return;
    const subscriber = RedisClient.getSubscriber();
    if (!subscriber) return;
    await subscriber.subscribe(channel);
    subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        try {
          const parsed = JSON.parse(message);
          callback(parsed);
        } catch (error) {
          logger.error('Failed to parse message:', error);
        }
      }
    });
  }

  public static async unsubscribe(channel: string): Promise<void> {
    if (!REDIS_ENABLED) return;
    const subscriber = RedisClient.getSubscriber();
    if (subscriber) await subscriber.unsubscribe(channel);
  }
}

// Export singleton instances (null when disabled)
export const redis = RedisClient.getInstance();
export const redisSubscriber = RedisClient.getSubscriber();
export const redisPublisher = RedisClient.getPublisher();

// Export utility functions
export const {
  isDisabled,
  setCache,
  getCache,
  deleteCache,
  createSession,
  getSession,
  deleteSession,
  blacklistToken,
  isTokenBlacklisted,
  incrementRateLimit,
  acquireLock,
  releaseLock,
  pushToQueue,
  popFromQueue,
  publish,
  subscribe,
  unsubscribe,
} = RedisClient;

export default RedisClient;
