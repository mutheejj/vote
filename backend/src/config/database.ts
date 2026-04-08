import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

declare global {
  var prisma: PrismaClient | undefined;
}

class Database {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!Database.instance) {
      Database.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development'
          ? [
              { level: 'warn', emit: 'event' },
              { level: 'error', emit: 'event' },
              { level: 'query', emit: 'event' },
            ]
          : ['error'],
        errorFormat: 'minimal',
      });

      // Log query events in development
      if (process.env.NODE_ENV === 'development') {
        (Database.instance as any).$on('query', (e: any) => {
          if (e.duration > 100) {
            logger.warn(`Slow query detected: ${e.duration}ms`, {
              query: e.query,
              params: e.params,
              target: e.target,
            });
          }
        });
      }

      // Add middleware for performance monitoring
      Database.instance.$use(async (params, next) => {
        const before = Date.now();
        const result = await next(params);
        const after = Date.now();
        const duration = after - before;

        // Log slow queries (threshold: 200ms for production, 100ms for development)
        const threshold = process.env.NODE_ENV === 'production' ? 200 : 100;
        if (duration > threshold) {
          const modelName = params.model || 'RawQuery';
          const actionName = params.action || 'execute';
          const argsString = params.args ? JSON.stringify(params.args) : '';
          logger.warn(`Slow query: ${modelName}.${actionName} took ${duration}ms`, {
            model: modelName,
            action: actionName,
            args: argsString && argsString.length > 0 ? argsString.substring(0, 200) : 'N/A',
          });
        }

        return result;
      });

      // Handle connection events - removed auto-connect to prevent unhandled promises
      // Connection is now handled explicitly in server.ts

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await Database.instance.$disconnect();
        logger.info('Database disconnected');
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await Database.instance.$disconnect();
        logger.info('Database disconnected');
        process.exit(0);
      });
    }

    return Database.instance;
  }

  public static async connect(): Promise<void> {
    try {
      const prisma = Database.getInstance();
      await prisma.$connect();
      logger.info('Database connection established');
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  public static async disconnect(): Promise<void> {
    try {
      if (Database.instance) {
        await Database.instance.$disconnect();
        logger.info('Database disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
      throw error;
    }
  }

  public static async healthCheck(): Promise<boolean> {
    try {
      const prisma = Database.getInstance();
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  public static async runInTransaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    const prisma = Database.getInstance();
    return prisma.$transaction(async (tx) => {
      return fn(tx as PrismaClient);
    });
  }
}

// Export singleton instance
export const prisma = Database.getInstance();

// Export Database class for additional methods
export default Database;

// Global prisma instance for development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}