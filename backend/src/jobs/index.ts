// backend/src/jobs/index.ts

import cron from 'node-cron';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { redis, isDisabled } from '../config/redis';
import { ElectionStatus } from '@prisma/client';
import { getWebSocketService } from '../websocket';
import { emailService } from '../utils/email';
import { smsService } from '../utils/sms';
import { statsCacheService } from '../services/statsCache.service';

export class JobScheduler {
  private static instance: JobScheduler;
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  private constructor() {}

  public static getInstance(): JobScheduler {
    if (!JobScheduler.instance) {
      JobScheduler.instance = new JobScheduler();
    }
    return JobScheduler.instance;
  }

  public initialize(): void {
    logger.info('🔄 Initializing job scheduler...');

    // Schedule election status updates (every 5 minutes - optimized for performance)
    this.scheduleJob('election-status-update', '*/5 * * * *', this.updateElectionStatuses.bind(this));

    // Schedule vote counting updates (every 10 minutes during active elections)
    this.scheduleJob('vote-counting', '*/10 * * * *', this.updateVoteCounts.bind(this));

    // Schedule notification cleanup (daily at midnight)
    this.scheduleJob('cleanup-notifications', '0 0 * * *', this.cleanupNotifications.bind(this));

    // Schedule session cleanup (every 2 hours - reduced frequency)
    this.scheduleJob('cleanup-sessions', '0 */2 * * *', this.cleanupExpiredSessions.bind(this));

    // Schedule audit log archiving (daily at 2 AM)
    this.scheduleJob('archive-audit-logs', '0 2 * * *', this.archiveAuditLogs.bind(this));

    // Schedule election reminders (every 30 minutes - optimized)
    this.scheduleJob('election-reminders', '*/30 * * * *', this.sendElectionReminders.bind(this));

    // Schedule database statistics update (every hour - reduced frequency)
    this.scheduleJob('update-statistics', '0 * * * *', this.updateSystemStatistics.bind(this));

    // Schedule backup cleanup (daily at 3 AM)
    this.scheduleJob('cleanup-backups', '0 3 * * *', this.cleanupOldBackups.bind(this));

    logger.info('✅ Job scheduler initialized with 8 optimized jobs');
  }

  private scheduleJob(name: string, cronPattern: string, task: () => Promise<void>): void {
    const job = cron.schedule(cronPattern, async () => {
      const startTime = Date.now();
      try {
        logger.info(`🔄 Starting job: ${name}`);
        await task();
        const duration = Date.now() - startTime;
        logger.info(`✅ Job completed: ${name} (${duration}ms)`);
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`❌ Job failed: ${name} (${duration}ms)`, error);
      }
    }, {
      scheduled: true,
      timezone: 'Africa/Nairobi' // JKUAT timezone
    });

    this.jobs.set(name, job);
    logger.info(`📅 Scheduled job: ${name} with pattern: ${cronPattern}`);
  }

  // Job implementations

  private async updateElectionStatuses(): Promise<void> {
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    try {
      // STEP 1: Auto-schedule DRAFT elections 30 minutes before start time
      // This allows voters to see upcoming elections before they actually start
      const electionsToSchedule = await prisma.election.findMany({
        where: {
          status: ElectionStatus.DRAFT,
          startDate: {
            lte: thirtyMinutesFromNow,  // Start date is within 30 minutes
            gt: now                      // But hasn't started yet
          }
        },
        select: {
          id: true,
          title: true,
          startDate: true
        }
      });

      for (const election of electionsToSchedule) {
        await prisma.election.update({
          where: { id: election.id },
          data: { status: ElectionStatus.SCHEDULED }
        });

        // Broadcast election scheduled
        const webSocketService = getWebSocketService();
        if (webSocketService) {
          await webSocketService.broadcastElectionUpdate({
            electionId: election.id,
            type: 'STATUS_CHANGE',
            data: {
              status: ElectionStatus.SCHEDULED,
              scheduledAt: now,
              startsAt: election.startDate
            },
            timestamp: now
          });
        }

        logger.info(`📅 Election auto-scheduled: ${election.title} (${election.id}) - starts at ${election.startDate}`);
      }

      // Refresh stats cache if elections were scheduled
      if (electionsToSchedule.length > 0) {
        await statsCacheService.refreshStat('draft_elections');
        await statsCacheService.refreshStat('scheduled_elections');
        logger.info(`✅ Stats cache refreshed: ${electionsToSchedule.length} elections auto-scheduled`);
      }

      // STEP 2: Start scheduled elections - OPTIMIZED: select only needed fields
      const electionsToStart = await prisma.election.findMany({
        where: {
          status: ElectionStatus.SCHEDULED,
          startDate: {
            lte: now
          }
        },
        select: {
          id: true,
          title: true
        }
      });

      for (const election of electionsToStart) {
        await prisma.election.update({
          where: { id: election.id },
          data: { status: ElectionStatus.ACTIVE }
        });

        // Broadcast election started
        const webSocketService = getWebSocketService();
        if (webSocketService) {
          await webSocketService.broadcastElectionUpdate({
            electionId: election.id,
            type: 'STATUS_CHANGE',
            data: { status: ElectionStatus.ACTIVE, startedAt: now },
            timestamp: now
          });
        }

        logger.info(`🚀 Election started: ${election.title} (${election.id})`);
      }

      // Refresh stats cache if elections were started
      if (electionsToStart.length > 0) {
        await statsCacheService.refreshStat('scheduled_elections');
        await statsCacheService.refreshStat('active_elections');
        logger.info(`✅ Stats cache refreshed: ${electionsToStart.length} elections started`);
      }

      // End active elections - OPTIMIZED: select only needed fields
      const electionsToEnd = await prisma.election.findMany({
        where: {
          status: ElectionStatus.ACTIVE,
          endDate: {
            lte: now
          }
        },
        select: {
          id: true,
          title: true
        }
      });

      for (const election of electionsToEnd) {
        await prisma.election.update({
          where: { id: election.id },
          data: { status: ElectionStatus.COMPLETED }
        });

        // Trigger final vote counting
        await this.calculateFinalResults(election.id);

        // Broadcast election ended
        const webSocketService = getWebSocketService();
        if (webSocketService) {
          await webSocketService.broadcastElectionUpdate({
            electionId: election.id,
            type: 'STATUS_CHANGE',
            data: { status: ElectionStatus.COMPLETED, endedAt: now },
            timestamp: now
          });
        }

        logger.info(`🏁 Election ended: ${election.title} (${election.id})`);
      }

      // Refresh stats cache if elections were completed
      if (electionsToEnd.length > 0) {
        await statsCacheService.refreshStat('active_elections');
        await statsCacheService.refreshStat('completed_elections');
        logger.info(`✅ Stats cache refreshed: ${electionsToEnd.length} elections completed`);
      }

    } catch (error) {
      logger.error('Error updating election statuses:', error);
    }
  }

  private async updateVoteCounts(): Promise<void> {
    try {
      // OPTIMIZED: Don't load all positions/candidates/votes - use counts instead
      const activeElections = await prisma.election.findMany({
        where: { status: ElectionStatus.ACTIVE },
        select: {
          id: true,
          title: true,
          totalEligibleVoters: true,
          showLiveResults: true
        }
      });

      for (const election of activeElections) {
        const totalVotes = await prisma.vote.count({
          where: { electionId: election.id }
        });

        const uniqueVoters = await prisma.vote.groupBy({
          by: ['voterId'],
          where: { electionId: election.id },
          _count: true
        });

        const turnoutPercentage = election.totalEligibleVoters > 0
          ? (uniqueVoters.length / election.totalEligibleVoters) * 100
          : 0;

        // Update election statistics
        await prisma.election.update({
          where: { id: election.id },
          data: {
            totalVotesCast: totalVotes,
            turnoutPercentage: Math.round(turnoutPercentage * 100) / 100
          }
        });

        // Update live results if enabled
        if (election.showLiveResults) {
          await this.updateLiveResults(election.id);
        }

        // Broadcast turnout update
        const webSocketService = getWebSocketService();
        if (webSocketService) {
          await webSocketService.broadcastElectionUpdate({
            electionId: election.id,
            type: 'TURNOUT_UPDATE',
            data: {
              totalVotes,
              uniqueVoters: uniqueVoters.length,
              turnoutPercentage
            },
            timestamp: new Date()
          });
        }
      }

    } catch (error) {
      logger.error('Error updating vote counts:', error);
    }
  }

  private async updateLiveResults(electionId: string): Promise<void> {
    try {
      const positions = await prisma.position.findMany({
        where: { electionId },
        include: {
          candidates: {
            include: {
              _count: {
                select: { votes: true }
              }
            }
          }
        }
      });

      for (const position of positions) {
        const totalVotes = position.candidates.reduce((sum, candidate) => sum + candidate._count.votes, 0);

        for (const candidate of position.candidates) {
          const voteCount = candidate._count.votes;
          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

          // Update or create result record
          await prisma.result.upsert({
            where: {
              electionId_positionId_candidateId: {
                electionId,
                positionId: position.id,
                candidateId: candidate.id
              }
            },
            update: {
              totalVotes: voteCount,
              percentage: Math.round(percentage * 100) / 100,
              calculatedAt: new Date()
            },
            create: {
              electionId,
              positionId: position.id,
              candidateId: candidate.id,
              totalVotes: voteCount,
              percentage: Math.round(percentage * 100) / 100
            }
          });
        }

        // Determine rankings
        await this.updateCandidateRankings(position.id);
      }

      // Broadcast result update
      const webSocketService = getWebSocketService();
      if (webSocketService) {
        await webSocketService.broadcastElectionUpdate({
          electionId,
          type: 'RESULT_UPDATE',
          data: { message: 'Live results updated' },
          timestamp: new Date()
        });
      }

    } catch (error) {
      logger.error('Error updating live results:', error);
    }
  }

  private async calculateFinalResults(electionId: string): Promise<void> {
    try {
      await this.updateLiveResults(electionId);

      // Determine winners
      const positions = await prisma.position.findMany({
        where: { electionId },
        include: {
          results: {
            orderBy: { totalVotes: 'desc' }
          }
        }
      });

      for (const position of positions) {
        if (position.results.length > 0) {
          const winner = position.results[0];
          const maxVotes = winner.totalVotes;

          // Check for ties
          const topCandidates = position.results.filter(result => result.totalVotes === maxVotes);
          const isTie = topCandidates.length > 1;

          // Update winner status
          for (const result of position.results) {
            const isWinner = result.totalVotes === maxVotes;
            await prisma.result.update({
              where: { id: result.id },
              data: {
                isWinner,
                isTie: isTie && isWinner,
                publishedAt: new Date()
              }
            });
          }
        }
      }

      logger.info(`🏆 Final results calculated for election: ${electionId}`);

    } catch (error) {
      logger.error('Error calculating final results:', error);
    }
  }

  private async updateCandidateRankings(positionId: string): Promise<void> {
    try {
      const results = await prisma.result.findMany({
        where: { positionId },
        orderBy: [
          { totalVotes: 'desc' },
          { percentage: 'desc' }
        ]
      });

      for (let i = 0; i < results.length; i++) {
        await prisma.result.update({
          where: { id: results[i].id },
          data: { rank: i + 1 }
        });
      }

    } catch (error) {
      logger.error('Error updating candidate rankings:', error);
    }
  }

  private async cleanupNotifications(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deleted = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          },
          read: true
        }
      });

      logger.info(`🧹 Cleaned up ${deleted.count} old notifications`);

    } catch (error) {
      logger.error('Error cleaning up notifications:', error);
    }
  }

  private async cleanupExpiredSessions(): Promise<void> {
    try {
      const keys = await redis?.keys('session:*') ?? [];
      let cleaned = 0;

      for (const key of keys) {
        const ttl = await redis?.ttl(key);
        if ((ttl ?? 0) <= 0) {
          await redis?.del(key);
          cleaned++;
        }
      }

      // Also cleanup expired refresh tokens
      const expiredTokens = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      logger.info(`🧹 Cleaned up ${cleaned} expired sessions and ${expiredTokens.count} expired tokens`);

    } catch (error) {
      logger.error('Error cleaning up expired sessions:', error);
    }
  }

  private async archiveAuditLogs(): Promise<void> {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Count logs to archive
      const logsToArchive = await prisma.auditLog.count({
        where: {
          createdAt: {
            lt: sixMonthsAgo
          }
        }
      });

      if (logsToArchive > 0) {
        // In a real implementation, you might want to export these to a separate storage
        // For now, we'll just delete very old logs (adjust as needed)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const deleted = await prisma.auditLog.deleteMany({
          where: {
            createdAt: {
              lt: oneYearAgo
            }
          }
        });

        logger.info(`📁 Archived audit logs: ${logsToArchive} identified, ${deleted.count} deleted`);
      }

    } catch (error) {
      logger.error('Error archiving audit logs:', error);
    }
  }

  private async sendElectionReminders(): Promise<void> {
    try {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // OPTIMIZED: Find elections starting in 1 hour - select only needed fields
      const electionsStartingSoon = await prisma.election.findMany({
        where: {
          status: ElectionStatus.SCHEDULED,
          startDate: {
            gte: now,
            lte: oneHourLater
          }
        },
        select: {
          id: true,
          title: true,
          startDate: true,
          eligibleFaculties: true,
          eligibleDepartments: true,
          eligibleCourses: true
        }
      });

      // OPTIMIZED: Find elections ending in 1 hour - select only needed fields
      const electionsEndingSoon = await prisma.election.findMany({
        where: {
          status: ElectionStatus.ACTIVE,
          endDate: {
            gte: now,
            lte: oneHourLater
          }
        },
        select: {
          id: true,
          title: true,
          endDate: true,
          eligibleFaculties: true,
          eligibleDepartments: true,
          eligibleCourses: true
        }
      });

      // Send reminders
      for (const election of electionsStartingSoon) {
        await this.sendElectionStartReminder(election);
      }

      for (const election of electionsEndingSoon) {
        await this.sendElectionEndReminder(election);
      }

    } catch (error) {
      logger.error('Error sending election reminders:', error);
    }
  }

  private async sendElectionStartReminder(election: any): Promise<void> {
    try {
      // Check if reminder was already sent
      const reminderSent = await redis?.get(`reminder:start:${election.id}`);
      if (reminderSent) return;

      // OPTIMIZED: Get eligible voters - only select email/name fields (not all 30+ columns)
      const eligibleVoters = await prisma.user.findMany({
        where: {
          isActive: true,
          isVerified: true,
          OR: [
            { faculty: { in: election.eligibleFaculties } },
            { department: { in: election.eligibleDepartments } },
            { course: { in: election.eligibleCourses } }
          ]
        },
        select: {
          id: true,
          email: true,
          firstName: true
        }
      });

      // Send reminders (bulk email for efficiency)
      const recipients = eligibleVoters.map(voter => ({
        email: voter.email,
        data: {
          electionTitle: election.title,
          startTime: election.startDate.toLocaleString(),
          votingUrl: `${process.env.FRONTEND_URL}/elections/${election.id}`
        }
      }));
      await emailService.sendBulkEmail(
        recipients,
        `Voting Starts Soon: ${election.title}`,
        'election-starting-reminder'
      );

      // Mark reminder as sent
      await redis?.setex(`reminder:start:${election.id}`, 3600, 'sent');

      logger.info(`📨 Sent start reminders for election: ${election.title}`);

    } catch (error) {
      logger.error('Error sending election start reminder:', error);
    }
  }

  private async sendElectionEndReminder(election: any): Promise<void> {
    try {
      // Check if reminder was already sent
      const reminderSent = await redis?.get(`reminder:end:${election.id}`);
      if (reminderSent) return;

      // OPTIMIZED: Get users who haven't voted yet - only select email/name fields
      const allEligibleVoters = await prisma.user.findMany({
        where: {
          isActive: true,
          isVerified: true,
          OR: [
            { faculty: { in: election.eligibleFaculties } },
            { department: { in: election.eligibleDepartments } },
            { course: { in: election.eligibleCourses } }
          ]
        },
        select: {
          id: true,
          email: true,
          firstName: true
        }
      });

      const votersWhoVoted = await prisma.vote.findMany({
        where: { electionId: election.id },
        select: { voterId: true },
        distinct: ['voterId']
      });

      const votedUserIds = new Set(votersWhoVoted.map(v => v.voterId));
      const nonVoters = allEligibleVoters.filter(voter => !votedUserIds.has(voter.id));

      if (nonVoters.length > 0) {
        const recipients = nonVoters.map(voter => ({
          email: voter.email,
          data: {
            electionTitle: election.title,
            endTime: election.endDate.toLocaleString(),
            votingUrl: `${process.env.FRONTEND_URL}/elections/${election.id}`
          }
        }));
        await emailService.sendBulkEmail(
          recipients,
          `Last Chance to Vote: ${election.title}`,
          'election-ending-reminder'
        );
      }

      // Mark reminder as sent
      await redis?.setex(`reminder:end:${election.id}`, 3600, 'sent');

      logger.info(`📨 Sent end reminders to ${nonVoters.length} non-voters for election: ${election.title}`);

    } catch (error) {
      logger.error('Error sending election end reminder:', error);
    }
  }

  private async updateSystemStatistics(): Promise<void> {
    try {
      // ULTRA-FAST CACHED COUNTS: Real-time accurate via database triggers (<10ms vs 2000ms+)
      const [totalUsers, verifiedUsers, totalElections, activeElections, totalVotes, totalCandidates] = await Promise.all([
        statsCacheService.getStat('total_users'),
        statsCacheService.getStat('verified_users'),
        statsCacheService.getStat('total_elections'),
        statsCacheService.getStat('active_elections'),
        statsCacheService.getStat('total_votes'),
        statsCacheService.getStat('total_candidates')
      ]);

      const stats = {
        totalUsers,
        verifiedUsers,
        totalElections,
        activeElections,
        totalVotes,
        totalCandidates,
        timestamp: new Date().toISOString()
      };

      await redis?.setex('system:statistics', 1800, JSON.stringify(stats)); // Cache for 30 minutes

      logger.info(`📊 Updated system statistics: ${stats.totalUsers} users, ${stats.totalVotes} votes`);

    } catch (error) {
      logger.error('Error updating system statistics:', error);
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      // This would typically clean up database backups, file uploads, etc.
      // For now, we'll clean up old temporary files and cache entries

      const keys = await redis?.keys('temp:*') ?? [];
      let cleaned = 0;

      for (const key of keys) {
        const ttl = await redis?.ttl(key);
        if ((ttl ?? 0) <= 0) {
          await redis?.del(key);
          cleaned++;
        }
      }

      logger.info(`🧹 Cleaned up ${cleaned} temporary cache entries`);

    } catch (error) {
      logger.error('Error cleaning up old backups:', error);
    }
  }

  public stopJob(name: string): void {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      logger.info(`⏹️  Stopped job: ${name}`);
    }
  }

  public stopAllJobs(): void {
    for (const [name, job] of this.jobs.entries()) {
      job.stop();
      logger.info(`⏹️  Stopped job: ${name}`);
    }
    this.jobs.clear();
    logger.info('⏹️  All jobs stopped');
  }

  public getJobStatus(): Array<{ name: string; isRunning: boolean }> {
    return Array.from(this.jobs.entries()).map(([name, job]) => ({
      name,
      isRunning: true // Job exists in map means it's scheduled and running
    }));
  }
}

// Export initialization function
export function initializeJobs(): void {
  const scheduler = JobScheduler.getInstance();
  scheduler.initialize();
}

// Export singleton getter
export function getJobScheduler(): JobScheduler {
  return JobScheduler.getInstance();
}