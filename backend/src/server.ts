// backend/src/server.ts

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

import { server, io } from './app';
import { logger } from './utils/logger';
import { prisma } from './app';
import { redis } from './config/redis';

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'REDIS_URL'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Server configuration
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('UNHANDLED REJECTION DETAILS:');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  console.error('Stack:', reason?.stack || 'No stack trace');

  logger.error('UNHANDLED REJECTION! Shutting down...', {
    reason: reason,
    message: reason?.message || String(reason),
    stack: reason?.stack,
    type: typeof reason
  });
  server.close(() => {
    process.exit(1);
  });
});

// Database connection test
async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Test database with a simple query
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database query test successful');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

// Redis connection test
async function connectRedis() {
  try {
    // Check if Redis is already connected
    if (redis?.status === 'ready') {
      logger.info('Redis already connected');
    } else if (redis?.status === 'connecting') {
      logger.info('Redis is connecting, waiting...');
      // Wait for connection to complete
      await new Promise((resolve, reject) => {
        redis?.once('ready', resolve);
        redis?.once('error', reject);
      });
    } else {
      // Connect to Redis since lazyConnect is enabled
      await redis?.connect();
    }

    // Test with a ping command
    const pingResult = await redis?.ping();
    logger.info(`Redis connected successfully - Ping: ${pingResult}`);
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
}

// Initialize server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Connect to Redis
    await connectRedis();

    // Start the server
    server.listen(PORT, () => {
      logger.info(`
========================================================
JKUAT Voting System Backend Started Successfully
========================================================

Server Information:
  Environment: ${NODE_ENV}
  Port: ${PORT}
  Database: Connected
  Redis: Connected
  WebSocket: Active

API Endpoints:
  Base URL: http://localhost:${PORT}/api
  Health Check: http://localhost:${PORT}/health
  WebSocket: ws://localhost:${PORT}

Available Routes:
  - Authentication: /api/auth/*
  - Elections: /api/elections/*
  - Voting: /api/votes/*
  - Results: /api/results/*
  - Admin: /api/admin/*
  - Candidates: /api/candidates/*
  - Voters: /api/voters/*

Real-time Features:
  - Live vote counting
  - Election status updates
  - Real-time notifications
  - Admin dashboard updates

Security Features:
  - JWT Authentication
  - Two-Factor Authentication
  - Rate Limiting
  - CORS Protection
  - XSS Prevention
  - Request Sanitization

========================================================
      `);

      // Log WebSocket connection info
      io.on('connection', (socket) => {
        logger.info(`WebSocket client connected: ${socket.id}`);

        socket.on('disconnect', (reason) => {
          logger.info(`WebSocket client disconnected: ${socket.id} (${reason})`);
        });
      });

      // Emit server ready event
      io.emit('server:ready', {
        message: 'JKUAT Voting System is ready for connections',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      });

    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Close server
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close WebSocket connections
      io.close();
      logger.info('WebSocket server closed');

      // Disconnect from database
      await prisma.$disconnect();
      logger.info('Database disconnected');

      // Disconnect from Redis
      redis?.disconnect();
      logger.info('Redis disconnected');

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Additional error monitoring
process.on('warning', (warning) => {
  logger.warn('Node.js Warning:', {
    name: warning.name,
    message: warning.message,
    stack: warning.stack
  });
});

// Memory usage monitoring in development
if (NODE_ENV === 'development') {
  setInterval(() => {
    const usage = process.memoryUsage();
    const mbUsage = {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024)
    };

    // Log if memory usage is high
    if (mbUsage.heapUsed > 512) { // 512 MB threshold
      logger.warn('High memory usage detected:', mbUsage);
    }
  }, 60000); // Check every minute
}

// Start the server
startServer().catch((error) => {
  logger.error('Server startup failed:', error);
  process.exit(1);
});

export default server;
