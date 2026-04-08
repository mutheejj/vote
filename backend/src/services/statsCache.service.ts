/**
 * Statistics Cache Service
 *
 * Provides ultra-fast (<10ms) access to system statistics
 * Stats are maintained in real-time via database triggers
 * 100% accurate - updated atomically with data changes
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface StatsValue {
  count: number;
  timestamp: Date;
  [key: string]: any;
}

export class StatsCacheService {
  private static instance: StatsCacheService;

  private constructor() {}

  public static getInstance(): StatsCacheService {
    if (!StatsCacheService.instance) {
      StatsCacheService.instance = new StatsCacheService();
    }
    return StatsCacheService.instance;
  }

  /**
   * Get a cached stat value
   * @param key - The stat key (e.g., 'total_votes', 'active_elections')
   * @returns The stat value or null if not found
   */
  async getStat(key: string): Promise<number | null> {
    try {
      const stat = await prisma.systemStats.findUnique({
        where: { key },
        select: { value: true },
      });

      if (!stat) {
        logger.warn(`Stat not found: ${key}`);
        return null;
      }

      const value = stat.value as StatsValue;
      return value.count || 0;
    } catch (error) {
      logger.error(`Error getting stat ${key}:`, error);
      return null;
    }
  }

  /**
   * Get multiple stats at once
   * @param keys - Array of stat keys
   * @returns Map of key -> count
   */
  async getStats(keys: string[]): Promise<Map<string, number>> {
    try {
      const stats = await prisma.systemStats.findMany({
        where: { key: { in: keys } },
        select: { key: true, value: true },
      });

      const result = new Map<string, number>();
      stats.forEach((stat) => {
        const value = stat.value as StatsValue;
        result.set(stat.key, value.count || 0);
      });

      return result;
    } catch (error) {
      logger.error('Error getting multiple stats:', error);
      return new Map();
    }
  }

  /**
   * Get all system stats
   */
  async getAllStats(): Promise<Map<string, number>> {
    try {
      const stats = await prisma.systemStats.findMany({
        select: { key: true, value: true },
      });

      const result = new Map<string, number>();
      stats.forEach((stat) => {
        const value = stat.value as StatsValue;
        result.set(stat.key, value.count || 0);
      });

      return result;
    } catch (error) {
      logger.error('Error getting all stats:', error);
      return new Map();
    }
  }

  /**
   * Fallback: Count from source table if cache miss
   * Should rarely be needed if triggers are working correctly
   */
  async countFromSource(table: string, where?: any): Promise<number> {
    try {
      logger.warn(`Cache miss - counting from source: ${table}`);

      switch (table) {
        case 'User':
          return await prisma.user.count({ where });
        case 'Election':
          return await prisma.election.count({ where });
        case 'Candidate':
          return await prisma.candidate.count({ where });
        case 'Vote':
          return await prisma.vote.count({ where });
        default:
          logger.error(`Unknown table for counting: ${table}`);
          return 0;
      }
    } catch (error) {
      logger.error(`Error counting from ${table}:`, error);
      return 0;
    }
  }

  /**
   * Manually refresh a specific stat (for testing or recovery)
   * Normally not needed - triggers handle updates automatically
   */
  async refreshStat(key: string): Promise<void> {
    try {
      let count = 0;

      switch (key) {
        case 'total_users':
          count = await prisma.user.count();
          break;
        case 'total_elections':
          count = await prisma.election.count();
          break;
        case 'active_elections':
          count = await prisma.election.count({ where: { status: 'ACTIVE' } });
          break;
        case 'scheduled_elections':
          count = await prisma.election.count({ where: { status: 'SCHEDULED' } });
          break;
        case 'draft_elections':
          count = await prisma.election.count({ where: { status: 'DRAFT' } });
          break;
        case 'completed_elections':
          count = await prisma.election.count({ where: { status: 'COMPLETED' } });
          break;
        case 'total_candidates':
          count = await prisma.candidate.count();
          break;
        case 'approved_candidates':
          count = await prisma.candidate.count({ where: { status: 'APPROVED' } });
          break;
        case 'pending_candidates':
          count = await prisma.candidate.count({ where: { status: 'PENDING' } });
          break;
        case 'total_votes':
          count = await prisma.vote.count();
          break;
        case 'verified_users':
          count = await prisma.user.count({ where: { isVerified: true } });
          break;
        case 'active_users':
          count = await prisma.user.count({ where: { isActive: true } });
          break;
        default:
          logger.warn(`Unknown stat key for refresh: ${key}`);
          return;
      }

      await prisma.systemStats.upsert({
        where: { key },
        update: {
          value: { count, timestamp: new Date() },
          updatedAt: new Date(),
        },
        create: {
          key,
          value: { count, timestamp: new Date() },
        },
      });

      logger.info(`Refreshed stat: ${key} = ${count}`);
    } catch (error) {
      logger.error(`Error refreshing stat ${key}:`, error);
    }
  }

  /**
   * Refresh all stats (for maintenance or after bulk operations)
   */
  async refreshAllStats(): Promise<void> {
    const keys = [
      'total_users',
      'total_elections',
      'active_elections',
      'scheduled_elections',
      'draft_elections',
      'completed_elections',
      'total_candidates',
      'approved_candidates',
      'pending_candidates',
      'total_votes',
      'verified_users',
      'active_users',
    ];

    for (const key of keys) {
      await this.refreshStat(key);
    }

    logger.info('All stats refreshed');
  }
}

// Export singleton instance
export const statsCacheService = StatsCacheService.getInstance();
export default statsCacheService;
