import { redis, isDisabled } from '../config/redis';
import { logger } from './logger';

/**
 * User cache management utilities
 * Call these functions when user data changes to invalidate the cache
 */

/**
 * Invalidate user auth cache
 * Call this after updating user role, permissions, isActive, etc.
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  try {
    const cacheKey = `user:auth:${userId}`;
    await redis?.del(cacheKey);
    logger.info(`User cache invalidated for user: ${userId}`);
  } catch (error) {
    logger.error('Error invalidating user cache:', error);
    // Non-critical error, don't throw
  }
}

/**
 * Invalidate multiple users' cache at once
 */
export async function invalidateMultipleUserCaches(userIds: string[]): Promise<void> {
  try {
    const keys = userIds.map(id => `user:auth:${id}`);
    if (keys && keys.length > 0) {
      await redis?.del(...keys);
      logger.info(`User cache invalidated for ${userIds.length} users`);
    }
  } catch (error) {
    logger.error('Error invalidating multiple user caches:', error);
    // Non-critical error, don't throw
  }
}

/**
 * Refresh user cache with new data
 */
export async function refreshUserCache(userId: string, userData: any): Promise<void> {
  try {
    const cacheKey = `user:auth:${userId}`;
    await redis?.setex(cacheKey, 300, JSON.stringify(userData));
    logger.debug(`User cache refreshed for user: ${userId}`);
  } catch (error) {
    logger.error('Error refreshing user cache:', error);
    // Non-critical error, don't throw
  }
}
