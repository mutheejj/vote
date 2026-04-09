import { PrismaClient, Election, ElectionStatus, ElectionType, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import Database from '../config/database';
import { AppError, NotFoundError, ValidationError, ConflictError } from '../utils/errors';
import { logger } from '../utils/logger';
import { redis, setCache, getCache, deleteCache, isDisabled } from '../config/redis';
import { emailService } from '../utils/email';
import { smsService } from '../utils/sms';
import { statsCacheService } from './statsCache.service';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';

export interface CreateElectionData {
  title: string;
  description: string;
  type: ElectionType;
  startDate: Date;
  endDate: Date;
  registrationStart?: Date;
  registrationEnd?: Date;
  eligibleFaculties?: string[];
  eligibleDepartments?: string[];
  eligibleCourses?: string[];
  eligibleYears?: number[];
  minVoterAge?: number;
  maxVoterAge?: number;
  maxVotesPerPosition?: number;
  allowAbstain?: boolean;
  requireAllPositions?: boolean;
  showLiveResults?: boolean;
  requireTwoFactor?: boolean;
  encryptVotes?: boolean;
  anonymousVoting?: boolean;
  coverImage?: string;
  rules?: any;
  positions: Array<{
    name: string;
    description?: string;
    order: number;
    maxSelections: number;
    minSelections: number;
  }>;
}

export interface UpdateElectionData extends Partial<CreateElectionData> {
  status?: ElectionStatus;
}

export interface ElectionWithRelations extends Election {
  positions: any[];
  candidates: any[];
  votes: any[];
  results: any[];
  createdBy: any;
  admins: any[];
}

export interface ElectionStats {
  totalEligibleVoters: number;
  totalVotesCast: number;
  turnoutPercentage: number;
  positionStats: Array<{
    positionId: string;
    positionName: string;
    totalCandidates: number;
    totalVotes: number;
    turnoutPercentage: number;
  }>;
  timeStats: {
    hoursRemaining: number;
    votingProgress: number;
    peakVotingHours: Array<{
      hour: number;
      voteCount: number;
    }>;
  };
  demographicStats: {
    byFaculty: Array<{ faculty: string; count: number; percentage: number }>;
    byYearOfStudy: Array<{ year: number; count: number; percentage: number }>;
    byDepartment: Array<{ department: string; count: number; percentage: number }>;
  };
}

export class ElectionService {
  private static instance: ElectionService;
  private auditLog: any; // Will be injected or imported later
  private scheduledJobs: Map<string, any> = new Map();

  private constructor() {
    this.initializeScheduler();
  }

  public static getInstance(): ElectionService {
    if (!ElectionService.instance) {
      ElectionService.instance = new ElectionService();
    }
    return ElectionService.instance;
  }

  /**
   * Initialize election scheduler for automated tasks
   */
  private initializeScheduler(): void {
    // Run every 5 minutes to check for election status changes (optimized for performance)
    cron.schedule('*/5 * * * *', async () => {
      try {
        await this.processScheduledElections();
        await this.processElectionNotifications();
      } catch (error) {
        logger.error('Error in election scheduler:', error);
      }
    });

    logger.info('Election scheduler initialized (5-minute intervals)');
  }

  /**
   * Create a new election
   */
  public async createElection(
    electionData: CreateElectionData,
    createdById: string
  ): Promise<Election> {
    try {
      // Validate election data
      await this.validateElectionData(electionData);

      // Check for overlapping elections of same type
      await this.checkElectionConflicts(electionData);

      const election = await Database.runInTransaction(async (tx) => {
        // Create the election
        const election = await tx.election.create({
          data: {
            id: uuidv4(),
            title: electionData.title,
            description: electionData.description,
            type: electionData.type,
            status: ElectionStatus.DRAFT,
            startDate: electionData.startDate,
            endDate: electionData.endDate,
            registrationStart: electionData.registrationStart,
            registrationEnd: electionData.registrationEnd,
            eligibleFaculties: electionData.eligibleFaculties || [],
            eligibleDepartments: electionData.eligibleDepartments || [],
            eligibleCourses: electionData.eligibleCourses || [],
            eligibleYears: electionData.eligibleYears || [],
            minVoterAge: electionData.minVoterAge,
            maxVoterAge: electionData.maxVoterAge,
            maxVotesPerPosition: electionData.maxVotesPerPosition || 1,
            allowAbstain: electionData.allowAbstain ?? true,
            requireAllPositions: electionData.requireAllPositions ?? false,
            showLiveResults: electionData.showLiveResults ?? false,
            requireTwoFactor: electionData.requireTwoFactor ?? false,
            encryptVotes: electionData.encryptVotes ?? true,
            anonymousVoting: electionData.anonymousVoting ?? true,
            coverImage: electionData.coverImage,
            rules: electionData.rules,
            createdById,
          },
          include: {
            positions: true,
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        });

        // Create positions
        if (electionData.positions?.length) {
          await tx.position.createMany({
            data: electionData.positions.map(pos => ({
              id: uuidv4(),
              electionId: election.id,
              name: pos.name,
              description: pos.description,
              order: pos.order,
              maxSelections: pos.maxSelections,
              minSelections: pos.minSelections,
            })),
          });
        }

        // Calculate eligible voters count
        const eligibleCount = await this.calculateEligibleVotersCount(election.id, tx);
        await tx.election.update({
          where: { id: election.id },
          data: { totalEligibleVoters: eligibleCount },
        });

        logger.info(`Election created: ${election.title} (${election.id})`);
        return election;
      });

      // Cache the election (after transaction commits)
      await this.cacheElection(election);

      // Refresh stats cache immediately after creating election
      await statsCacheService.refreshStat('total_elections');
      await statsCacheService.refreshStat(`${election.status.toLowerCase()}_elections`);

      // Log audit trail (after transaction commits)
      await this.logAudit('CREATE_ELECTION', 'ELECTION', 'MEDIUM', createdById, election.id, null, {
        title: election.title,
        type: election.type,
        startDate: election.startDate,
        endDate: election.endDate,
      });

      return election;
    } catch (error) {
      logger.error('Error creating election:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create election', 500);
    }
  }

  /**
   * Update an existing election
   */
  public async updateElection(
    electionId: string,
    updateData: UpdateElectionData,
    updatedById: string
  ): Promise<Election> {
    try {
      const existingElection = await this.getElectionById(electionId);

      // Validate update permissions
      await this.validateUpdatePermissions(existingElection, updatedById);

      // Validate updated data
      if (updateData.startDate || updateData.endDate) {
        await this.validateElectionData({
          ...existingElection,
          ...updateData,
        } as CreateElectionData);
      }

      const oldData = { ...existingElection };

      const updatedElection = await Database.runInTransaction(async (tx) => {
        // Update election
        const { positions: _, ...updateDataWithoutPositions } = updateData;
        const updatedElection = await tx.election.update({
          where: { id: electionId },
          data: {
            ...updateDataWithoutPositions,
            updatedAt: new Date(),
          },
          include: {
            positions: true,
            candidates: true,
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
            admins: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        });

        // Update positions if provided (for DRAFT or PAUSED elections)
        if (updateData.positions?.length) {
          if (existingElection.status === ElectionStatus.DRAFT || existingElection.status === ElectionStatus.PAUSED) {
            await tx.position.deleteMany({
              where: { electionId },
            });

            // Create new positions
            await tx.position.createMany({
              data: updateData.positions.map(pos => ({
                id: uuidv4(),
                electionId,
                name: pos.name,
                description: pos.description,
                order: pos.order,
                maxSelections: pos.maxSelections,
                minSelections: pos.minSelections,
              })),
            });
          }
        }

        // Recalculate eligible voters if criteria changed
        if (this.hasEligibilityCriteriaChanged(updateData)) {
          const eligibleCount = await this.calculateEligibleVotersCount(electionId, tx);
          await tx.election.update({
            where: { id: electionId },
            data: { totalEligibleVoters: eligibleCount },
          });
        }

        logger.info(`Election updated: ${updatedElection.title} (${electionId})`);
        return updatedElection;
      });

      // Clear cache (after transaction commits)
      await this.clearElectionCache(electionId);

      // Refresh stats cache if status changed
      if (oldData.status !== updatedElection.status) {
        await statsCacheService.refreshStat('total_elections');
        await statsCacheService.refreshStat(`${oldData.status.toLowerCase()}_elections`);
        await statsCacheService.refreshStat(`${updatedElection.status.toLowerCase()}_elections`);
        logger.info(`Stats refreshed after status change: ${oldData.status} -> ${updatedElection.status}`);
      }

      // Log audit trail (after transaction commits)
      await this.logAudit('UPDATE_ELECTION', 'ELECTION', 'MEDIUM', updatedById, electionId, oldData, updateData);

      return updatedElection;
    } catch (error) {
      logger.error('Error updating election:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update election', 500);
    }
  }

  /**
   * Delete an election
   */
  public async deleteElection(electionId: string, deletedById: string): Promise<void> {
    try {
      const election = await this.getElectionById(electionId);

      // Validate delete permissions - allow DRAFT and SCHEDULED only
      const allowedDeleteStatuses = [ElectionStatus.DRAFT, ElectionStatus.SCHEDULED] as const;
      if (!allowedDeleteStatuses.includes(election.status as any)) {
        throw new ValidationError('Only draft and scheduled elections can be deleted');
      }

      await Database.runInTransaction(async (tx) => {
        await tx.election.delete({
          where: { id: electionId },
        });

        logger.info(`Election deleted: ${election.title} (${electionId}) by user ${deletedById}`);
      });

      // Clear all caches (after transaction commits)
      await this.clearElectionCache(electionId);
      await deleteCache(`election:*:${electionId}`);

      // Refresh stats cache immediately after deleting election
      await statsCacheService.refreshStat('total_elections');
      await statsCacheService.refreshStat(`${election.status.toLowerCase()}_elections`);
      logger.info(`Stats refreshed after deleting ${election.status} election`);

      // Cancel scheduled jobs
      this.cancelScheduledJobs(electionId);

      // Log audit trail (after transaction commits)
      await this.logAudit('DELETE_ELECTION', 'ELECTION', 'HIGH', deletedById, electionId, election, null);
    } catch (error) {
      logger.error('Error deleting election:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete election', 500);
    }
  }

  /**
   * Get election by ID with full relations (OPTIMIZED)
   */
  public async getElectionById(electionId: string, useCache: boolean = true): Promise<ElectionWithRelations> {
    try {
      // Try cache first
      if (useCache) {
        const cached = await getCache<ElectionWithRelations>(`election:${electionId}`);
        if (cached) return cached;
      }

      // Optimize: Fetch election data without loading ALL votes
      // Votes can be millions - we should only load vote counts, not individual votes
      const election = await prisma.election.findUnique({
        where: { id: electionId },
        include: {
          positions: {
            orderBy: { order: 'asc' },
            include: {
              candidates: {
                where: { status: 'APPROVED' },
                orderBy: { createdAt: 'asc' },
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  studentId: true,
                  email: true,
                  phone: true,
                  faculty: true,
                  department: true,
                  manifesto: true,
                  slogan: true,
                  photo: true,
                  bannerImage: true,
                  status: true,
                  createdAt: true,
                },
              },
            },
          },
          // REMOVED: Don't load duplicate candidates (already loaded in positions)
          // candidates: { ... },

          // OPTIMIZED: Don't load individual votes - use _count instead
          _count: {
            select: {
              votes: true,
              candidates: true,
            },
          },
          results: {
            include: {
              candidate: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  photo: true,
                  studentId: true,
                },
              },
              position: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: { rank: 'asc' },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          admins: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      });

      if (!election) {
        throw new NotFoundError(`Election with ID ${electionId} not found`);
      }

      // Add empty arrays for backward compatibility
      const optimizedElection = {
        ...election,
        votes: [], // Don't load votes - use _count instead
        candidates: election.positions.flatMap(p => p.candidates), // Flatten from positions
      } as any;

      // Cache the result
      if (useCache) {
        await this.cacheElection(optimizedElection);
      }

      return optimizedElection as ElectionWithRelations;
    } catch (error) {
      logger.error('Error fetching election:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch election', 500);
    }
  }

  /**
   * Get all elections with filtering and pagination
   */
  public async getAllElections(
    filters: {
      status?: ElectionStatus;
      type?: ElectionType;
      createdById?: string;
      search?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    page: number = 1,
    limit: number = 10,
    useCache: boolean = true
  ): Promise<{ elections: Election[]; total: number; pages: number }> {
    try {
      const offset = (page - 1) * limit;
      const cacheKey = `elections:${JSON.stringify(filters)}:${page}:${limit}`;

      // Try cache first
      if (useCache) {
        const cached = await getCache<{ elections: Election[]; total: number; pages: number }>(cacheKey);
        if (cached) return cached;
      }

      // Build where clause
      const where: Prisma.ElectionWhereInput = {};

      if (filters.status) where.status = filters.status;
      if (filters.type) where.type = filters.type;
      if (filters.createdById) where.createdById = filters.createdById;
      if (filters.startDate) where.startDate = { gte: filters.startDate };
      if (filters.endDate) where.endDate = { lte: filters.endDate };
      
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Optimize: Use cached count when no filters are applied
      const useOptimizedCount = Object.keys(where).length === 0 ||
        (Object.keys(where).length === 1 && where.status);

      // Get elections and total count
      const [elections, total] = await Promise.all([
        prisma.election.findMany({
          where,
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            status: true,
            startDate: true,
            endDate: true,
            coverImage: true,
            createdAt: true,
            updatedAt: true,
            createdById: true,
            totalEligibleVoters: true,
            totalVotesCast: true,
            turnoutPercentage: true,
            createdBy: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            positions: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        // Use cached stats when possible, otherwise count from DB
        useOptimizedCount && !where.status
          ? statsCacheService.getStat('total_elections').then(count => count || 0)
          : useOptimizedCount && where.status && typeof where.status === 'string'
          ? statsCacheService.getStat(`${(where.status as string).toLowerCase()}_elections`).then(count => count || 0)
          : prisma.election.count({ where }),
      ]);

      const result = {
        elections: elections as any as Election[],
        total,
        pages: Math.ceil(total / limit),
      };

      // Cache the result
      if (useCache) {
        await setCache(cacheKey, result, 300); // 5 minutes cache
      }

      return result;
    } catch (error) {
      logger.error('Error fetching elections:', error);
      throw new AppError('Failed to fetch elections', 500);
    }
  }

  /**
   * Get active elections (scheduled or currently running)
   */
  public async getActiveElections(useCache: boolean = true): Promise<Election[]> {
    try {
      const cacheKey = 'elections:active';

      if (useCache) {
        const cached = await getCache<Election[]>(cacheKey);
        if (cached) return cached;
      }

      const now = new Date();
      const elections = await prisma.election.findMany({
        where: {
          status: {
            in: [ElectionStatus.SCHEDULED, ElectionStatus.ACTIVE],
          },
          startDate: { lte: now },
          endDate: { gte: now },
        },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          status: true,
          startDate: true,
          endDate: true,
          coverImage: true,
          positions: {
            select: {
              id: true,
              name: true,
              maxSelections: true,
            },
          },
          _count: {
            select: {
              candidates: true,
            },
          },
        },
        orderBy: { startDate: 'asc' },
      });

      if (useCache) {
        await setCache(cacheKey, elections, 300);
      }

      return elections as any;
    } catch (error) {
      logger.error('Error fetching active elections:', error);
      throw new AppError('Failed to fetch active elections', 500);
    }
  }

  /**
   * Get elections a user is eligible to vote in (ULTRA-OPTIMIZED - NO SLOW ARRAY OPERATIONS)
   */
  public async getUserEligibleElections(userId: string, useCache: boolean = true): Promise<Election[]> {
    try {
      const cacheKey = `user:${userId}:eligible-elections`;

      if (useCache) {
        const cached = await getCache<Election[]>(cacheKey);
        if (cached) return cached;
      }

      const now = new Date();
      const currentYear = new Date().getFullYear();

      // Get user and explicit eligibility in parallel
      const [user, explicitEligibilityIds] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            faculty: true,
            department: true,
            course: true,
            yearOfStudy: true,
            admissionYear: true,
          },
        }),
        prisma.voterEligibility.findMany({
          where: { userId },
          select: { electionId: true },
        }),
      ]);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Handle null admissionYear - default to a reasonable age if not set
      const userAge = user.admissionYear ? (currentYear - user.admissionYear + 18) : 20;
      const explicitElectionIds = explicitEligibilityIds.map(r => r.electionId);

      // Build SQL condition for explicit eligibility
      const explicitEligibilityCondition = explicitElectionIds.length > 0
        ? Prisma.sql`e.id = ANY(ARRAY[${Prisma.join(explicitElectionIds.map(id => Prisma.sql`${id}`), ',')}]::text[])`
        : Prisma.sql`FALSE`;

      // Handle NULL user fields by providing empty strings/zero as fallback
      const userFaculty = user.faculty || '';
      const userDepartment = user.department || '';
      const userCourse = user.course || '';
      const userYearOfStudy = user.yearOfStudy || 0;

      // SOLUTION: Use raw SQL for better performance - avoids slow Prisma array operations
      const eligibleElections = await prisma.$queryRaw<any[]>`
        SELECT DISTINCT
          e.id,
          e.title,
          e.description,
          e.type,
          e.status,
          e."startDate",
          e."endDate",
          e."coverImage",
          e."allowAbstain",
          e."requireAllPositions",
          e."maxVotesPerPosition"
        FROM "Election" e
        WHERE e.status = 'ACTIVE'
          AND e."startDate" <= ${now}
          AND e."endDate" >= ${now}
          AND (
            -- Explicit eligibility
            ${explicitEligibilityCondition}
            OR
            -- Open to all (no restrictions) - empty arrays or NULL
            (
              (array_length(e."eligibleFaculties", 1) IS NULL OR array_length(e."eligibleFaculties", 1) = 0)
              AND (array_length(e."eligibleDepartments", 1) IS NULL OR array_length(e."eligibleDepartments", 1) = 0)
              AND (array_length(e."eligibleCourses", 1) IS NULL OR array_length(e."eligibleCourses", 1) = 0)
              AND (array_length(e."eligibleYears", 1) IS NULL OR array_length(e."eligibleYears", 1) = 0)
            )
            OR
            -- Match faculty (only check if array has values and user has faculty)
            (array_length(e."eligibleFaculties", 1) > 0 AND ${userFaculty} <> '' AND ${userFaculty}::text = ANY(e."eligibleFaculties"))
            OR
            -- Match department (only check if array has values and user has department)
            (array_length(e."eligibleDepartments", 1) > 0 AND ${userDepartment} <> '' AND ${userDepartment}::text = ANY(e."eligibleDepartments"))
            OR
            -- Match course (only check if array has values and user has course)
            (array_length(e."eligibleCourses", 1) > 0 AND ${userCourse} <> '' AND ${userCourse}::text = ANY(e."eligibleCourses"))
            OR
            -- Match year (only check if array has values and user has year)
            (array_length(e."eligibleYears", 1) > 0 AND ${userYearOfStudy} > 0 AND ${userYearOfStudy}::integer = ANY(e."eligibleYears"))
          )
          AND (e."minVoterAge" IS NULL OR e."minVoterAge" <= ${userAge})
          AND (e."maxVoterAge" IS NULL OR e."maxVoterAge" >= ${userAge})
        ORDER BY e."endDate" ASC
      `;

      if (eligibleElections.length === 0) {
        if (useCache) {
          await setCache(cacheKey, [], 600);
        }
        return [];
      }

      // Get election IDs for fetching positions and vote counts
      const electionIds = eligibleElections.map(e => e.id);

      // Fetch positions and vote counts separately (more efficient)
      const [positions, voteCounts] = await Promise.all([
        prisma.position.findMany({
          where: { electionId: { in: electionIds } },
          select: {
            id: true,
            electionId: true,
            name: true,
            description: true,
            order: true,
            maxSelections: true,
            minSelections: true,
          },
          orderBy: { order: 'asc' },
        }),
        prisma.vote.groupBy({
          by: ['electionId'],
          where: {
            electionId: { in: electionIds },
            voterId: userId,
          },
          _count: true,
        }),
      ]);

      // Build position map
      const positionMap = positions.reduce((acc, pos) => {
        if (!acc[pos.electionId]) acc[pos.electionId] = [];
        acc[pos.electionId].push(pos);
        return acc;
      }, {} as Record<string, any[]>);

      // Build vote count map
      const voteCountMap = voteCounts.reduce((acc, vc) => {
        acc[vc.electionId] = vc._count;
        return acc;
      }, {} as Record<string, number>);

      // Combine results
      const electionsWithDetails = eligibleElections.map(election => ({
        ...election,
        positions: positionMap[election.id] || [],
        votes: [],
        hasVoted: (voteCountMap[election.id] || 0) > 0,
        _count: {
          votes: voteCountMap[election.id] || 0,
        },
      }));

      if (useCache) {
        await setCache(cacheKey, electionsWithDetails, 600); // 10 minutes cache
      }

      return electionsWithDetails as any;
    } catch (error) {
      logger.error('Error fetching user eligible elections:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch eligible elections', 500);
    }
  }

  /**
   * Start an election
   */
  public async startElection(electionId: string, startedById: string): Promise<Election> {
    try {
      const election = await this.getElectionById(electionId);

      // Validate can start
      if (election.status !== ElectionStatus.SCHEDULED && election.status !== ElectionStatus.DRAFT) {
        throw new ValidationError(`Cannot start election with status: ${election.status}`);
      }

      // Check if we have candidates (skip for system auto-start to allow testing)
      const isSystemAutoStart = startedById === 'system';
      const candidateCount = await prisma.candidate.count({
        where: {
          electionId,
          status: 'APPROVED',
        },
      });

      if (candidateCount === 0 && !isSystemAutoStart) {
        throw new ValidationError('Cannot start election without approved candidates');
      }

      const updatedElection = await Database.runInTransaction(async (tx) => {
        const updatedElection = await tx.election.update({
          where: { id: electionId },
          data: {
            status: ElectionStatus.ACTIVE,
            publishedAt: new Date(),
          },
          include: {
            positions: true,
            candidates: { where: { status: 'APPROVED' } },
          },
        });

        // Calculate and update eligible voters
        const eligibleCount = await this.calculateEligibleVotersCount(electionId, tx);
        await tx.election.update({
          where: { id: electionId },
          data: { totalEligibleVoters: eligibleCount },
        });

        logger.info(`Election started: ${updatedElection.title} (${electionId})`);
        return updatedElection;
      });

      // Clear caches (after transaction commits)
      await this.clearElectionCache(electionId);
      await deleteCache('elections:active');

      // Schedule notifications
      await this.scheduleElectionNotifications(electionId);

      // Send start notifications
      await this.sendElectionNotifications(electionId, 'started');

      // Log audit trail (after transaction commits)
      await this.logAudit('START_ELECTION', 'ELECTION', 'HIGH', startedById, electionId,
        { status: election.status }, { status: ElectionStatus.ACTIVE });

      return updatedElection;
    } catch (error) {
      logger.error('Error starting election:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to start election', 500);
    }
  }

  /**
   * Pause an active election
   */
  public async pauseElection(electionId: string, pausedById: string, reason?: string): Promise<Election> {
    try {
      const election = await this.getElectionById(electionId);

      if (election.status !== ElectionStatus.ACTIVE) {
        throw new ValidationError('Only active elections can be paused');
      }

      const updatedElection = await Database.runInTransaction(async (tx) => {
        const updatedElection = await tx.election.update({
          where: { id: electionId },
          data: { status: ElectionStatus.PAUSED },
        });

        logger.info(`Election paused: ${election.title} (${electionId})`);
        return updatedElection;
      });

      // Clear caches (after transaction commits)
      await this.clearElectionCache(electionId);
      await deleteCache('elections:active');

      // Send pause notifications to admins
      await this.sendAdminNotification(electionId, 'election_paused', {
        reason,
        pausedBy: pausedById,
        timestamp: new Date(),
      });

      // Log audit trail (after transaction commits)
      await this.logAudit('PAUSE_ELECTION', 'ELECTION', 'HIGH', pausedById, electionId,
        { status: election.status }, { status: ElectionStatus.PAUSED, reason });

      return updatedElection;
    } catch (error) {
      logger.error('Error pausing election:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to pause election', 500);
    }
  }

  /**
   * Resume a paused election
   */
  public async resumeElection(electionId: string, resumedById: string): Promise<Election> {
    try {
      const election = await this.getElectionById(electionId);

      if (election.status !== ElectionStatus.PAUSED) {
        throw new ValidationError('Only paused elections can be resumed');
      }

      const updatedElection = await Database.runInTransaction(async (tx) => {
        const updatedElection = await tx.election.update({
          where: { id: electionId },
          data: { status: ElectionStatus.ACTIVE },
        });

        logger.info(`Election resumed: ${election.title} (${electionId})`);
        return updatedElection;
      });

      // Clear caches (after transaction commits)
      await this.clearElectionCache(electionId);
      await deleteCache('elections:active');

      // Send resume notifications
      await this.sendAdminNotification(electionId, 'election_resumed', {
        resumedBy: resumedById,
        timestamp: new Date(),
      });

      // Log audit trail (after transaction commits)
      await this.logAudit('RESUME_ELECTION', 'ELECTION', 'HIGH', resumedById, electionId,
        { status: election.status }, { status: ElectionStatus.ACTIVE });

      return updatedElection;
    } catch (error) {
      logger.error('Error resuming election:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to resume election', 500);
    }
  }

  /**
   * End an election
   */
  public async endElection(electionId: string, endedById: string): Promise<Election> {
    try {
      const election = await this.getElectionById(electionId);

      const allowedStatuses: ElectionStatus[] = [ElectionStatus.ACTIVE, ElectionStatus.PAUSED];
      if (!allowedStatuses.includes(election.status)) {
        throw new ValidationError(`Cannot end election with status: ${election.status}`);
      }

      const result = await Database.runInTransaction(async (tx) => {
        // Calculate final turnout
        const totalVotes = await tx.vote.count({
          where: { electionId },
        });

        const turnout = election.totalEligibleVoters > 0
          ? (totalVotes / election.totalEligibleVoters) * 100
          : 0;

        // Update election with all fields in a single update call
        const updatedElection = await tx.election.update({
          where: { id: electionId },
          data: {
            status: ElectionStatus.COMPLETED,
            endDate: new Date(), // Update actual end time
            totalVotesCast: totalVotes,
            turnoutPercentage: turnout,
          },
        });

        logger.info(`Election ended: ${election.title} (${electionId})`);
        return { updatedElection, totalVotes, turnout };
      });

      // Clear caches (after transaction commits)
      await this.clearElectionCache(electionId);
      await deleteCache('elections:active');

      // Cancel any pending notifications
      this.cancelScheduledJobs(electionId);

      // Send completion notifications
      await this.sendElectionNotifications(electionId, 'ended');

      // Log audit trail (after transaction commits)
      await this.logAudit('END_ELECTION', 'ELECTION', 'HIGH', endedById, electionId,
        { status: election.status }, { status: ElectionStatus.COMPLETED, totalVotes: result.totalVotes, turnout: result.turnout });

      return result.updatedElection;
    } catch (error) {
      logger.error('Error ending election:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to end election', 500);
    }
  }

  /**
   * Publish election results
   */
  public async publishResults(electionId: string, publishedById: string): Promise<void> {
    try {
      const election = await this.getElectionById(electionId);

      if (election.status !== ElectionStatus.COMPLETED) {
        throw new ValidationError('Can only publish results for completed elections');
      }

      await Database.runInTransaction(async (tx) => {
        // Calculate and store results if not already done
        await this.calculateElectionResults(electionId, tx);

        // Mark results as published
        await tx.result.updateMany({
          where: { electionId },
          data: { publishedAt: new Date() },
        });

        logger.info(`Results published for election: ${election.title} (${electionId})`);
      });

      // Clear caches (after transaction commits)
      await this.clearElectionCache(electionId);
      await deleteCache(`election:${electionId}:results`);

      // Send result notifications
      await this.sendResultNotifications(electionId);

      // Log audit trail (after transaction commits)
      await this.logAudit('PUBLISH_RESULTS', 'ELECTION', 'HIGH', publishedById, electionId, null, {
        action: 'results_published',
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Error publishing results:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to publish results', 500);
    }
  }

  /**
   * Archive an election
   */
  public async archiveElection(electionId: string, archivedById: string): Promise<Election> {
    try {
      const election = await this.getElectionById(electionId);

      if (election.status !== ElectionStatus.COMPLETED) {
        throw new ValidationError('Only completed elections can be archived');
      }

      const updatedElection = await Database.runInTransaction(async (tx) => {
        const updatedElection = await tx.election.update({
          where: { id: electionId },
          data: {
            status: ElectionStatus.ARCHIVED,
            archivedAt: new Date(),
          },
        });

        logger.info(`Election archived: ${election.title} (${electionId})`);
        return updatedElection;
      });

      // Clear most caches but keep archived data (after transaction commits)
      await this.clearElectionCache(electionId);

      // Log audit trail (after transaction commits)
      await this.logAudit('ARCHIVE_ELECTION', 'ELECTION', 'MEDIUM', archivedById, electionId,
        { status: election.status }, { status: ElectionStatus.ARCHIVED });

      return updatedElection;
    } catch (error) {
      logger.error('Error archiving election:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to archive election', 500);
    }
  }

  /**
   * Get comprehensive election statistics
   */
  public async getElectionStats(electionId: string, useCache: boolean = true): Promise<ElectionStats> {
    try {
      const cacheKey = `election:${electionId}:stats`;

      if (useCache) {
        const cached = await getCache<ElectionStats>(cacheKey);
        if (cached) return cached;
      }

      const election = await this.getElectionById(electionId);
      
      // Get basic stats
      const [totalVotes, positionStats] = await Promise.all([
        prisma.vote.count({ where: { electionId } }),
        this.getPositionStats(electionId),
      ]);

      // Calculate time stats
      const now = new Date();
      const startDate = new Date(election.startDate);
      const endDate = new Date(election.endDate);
      const totalDuration = endDate.getTime() - startDate.getTime();
      const elapsed = Math.max(0, now.getTime() - startDate.getTime());
      const remaining = Math.max(0, endDate.getTime() - now.getTime());
      
      const hoursRemaining = Math.floor(remaining / (1000 * 60 * 60));
      const votingProgress = totalDuration > 0 ? Math.min(100, (elapsed / totalDuration) * 100) : 0;

      // Get peak voting hours
      const peakVotingHours = await this.getPeakVotingHours(electionId);

      // Get demographic stats
      const demographicStats = await this.getDemographicStats(electionId);

      const stats: ElectionStats = {
        totalEligibleVoters: election.totalEligibleVoters,
        totalVotesCast: totalVotes,
        turnoutPercentage: election.totalEligibleVoters > 0 
          ? (totalVotes / election.totalEligibleVoters) * 100 
          : 0,
        positionStats,
        timeStats: {
          hoursRemaining,
          votingProgress,
          peakVotingHours,
        },
        demographicStats,
      };

      if (useCache) {
        await setCache(cacheKey, stats, 300); // 5 minutes cache
      }

      return stats;
    } catch (error) {
      logger.error('Error getting election stats:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get election statistics', 500);
    }
  }

  /**
   * Add eligible voters to an election
   */
  public async addEligibleVoters(
    electionId: string,
    voterIds: string[],
    addedById: string,
    reason?: string
  ): Promise<void> {
    try {
      const election = await this.getElectionById(electionId);

      const restrictedStatuses: ElectionStatus[] = [ElectionStatus.ACTIVE, ElectionStatus.COMPLETED, ElectionStatus.ARCHIVED];
      if (restrictedStatuses.includes(election.status)) {
        throw new ValidationError('Cannot modify voter eligibility for active or completed elections');
      }

      // Validate voter IDs exist
      const users = await prisma.user.findMany({
        where: { id: { in: voterIds } },
        select: { id: true },
      });

      if (users.length !== voterIds.length) {
        throw new ValidationError('Some voter IDs are invalid');
      }

      await Database.runInTransaction(async (tx) => {
        // Remove existing eligibility records for these voters
        await tx.voterEligibility.deleteMany({
          where: {
            electionId,
            userId: { in: voterIds },
          },
        });

        // Add new eligibility records
        await tx.voterEligibility.createMany({
          data: voterIds.map(userId => ({
            electionId,
            userId,
            addedBy: addedById,
            reason: reason || 'Manually added',
          })),
        });

        // Update eligible voter count
        const eligibleCount = await this.calculateEligibleVotersCount(electionId, tx);
        await tx.election.update({
          where: { id: electionId },
          data: { totalEligibleVoters: eligibleCount },
        });

        logger.info(`Added ${voterIds.length} eligible voters to election: ${electionId}`);
      });

      // Clear caches (after transaction commits)
      await this.clearElectionCache(electionId);
      await deleteCache(`election:${electionId}:eligible-voters`);

      // Log audit trail (after transaction commits)
      await this.logAudit('ADD_ELIGIBLE_VOTERS', 'ELECTION', 'MEDIUM', addedById, electionId, null, {
        voterIds,
        reason,
        count: voterIds.length,
      });
    } catch (error) {
      logger.error('Error adding eligible voters:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to add eligible voters', 500);
    }
  }

  /**
   * Remove eligible voters from an election
   */
  public async removeEligibleVoters(
    electionId: string,
    voterIds: string[],
    removedById: string,
    reason?: string
  ): Promise<void> {
    try {
      const election = await this.getElectionById(electionId);

      const restrictedStatuses: ElectionStatus[] = [ElectionStatus.ACTIVE, ElectionStatus.COMPLETED, ElectionStatus.ARCHIVED];
      if (restrictedStatuses.includes(election.status)) {
        throw new ValidationError('Cannot modify voter eligibility for active or completed elections');
      }

      const removedCount = await Database.runInTransaction(async (tx) => {
        // Remove eligibility records
        const removed = await tx.voterEligibility.deleteMany({
          where: {
            electionId,
            userId: { in: voterIds },
          },
        });

        // Update eligible voter count
        const eligibleCount = await this.calculateEligibleVotersCount(electionId, tx);
        await tx.election.update({
          where: { id: electionId },
          data: { totalEligibleVoters: eligibleCount },
        });

        logger.info(`Removed ${removed.count} eligible voters from election: ${electionId}`);
        return removed.count;
      });

      // Clear caches (after transaction commits)
      await this.clearElectionCache(electionId);
      await deleteCache(`election:${electionId}:eligible-voters`);

      // Log audit trail (after transaction commits)
      await this.logAudit('REMOVE_ELIGIBLE_VOTERS', 'ELECTION', 'MEDIUM', removedById, electionId, null, {
        voterIds,
        reason,
        count: removedCount,
      });
    } catch (error) {
      logger.error('Error removing eligible voters:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to remove eligible voters', 500);
    }
  }

  /**
   * Schedule election notifications
   */
  public async scheduleElectionNotifications(electionId: string): Promise<void> {
    try {
      const election = await this.getElectionById(electionId);
      
      const notifications = [
        // Election started (immediate)
        {
          type: 'election_started',
          scheduledFor: election.startDate,
          subject: `Election Started: ${election.title}`,
          template: 'election-started',
        },
        // 24 hours before end
        {
          type: 'election_reminder_24h',
          scheduledFor: new Date(election.endDate.getTime() - 24 * 60 * 60 * 1000),
          subject: `24 Hours Left: ${election.title}`,
          template: 'election-reminder',
        },
        // 2 hours before end
        {
          type: 'election_reminder_2h',
          scheduledFor: new Date(election.endDate.getTime() - 2 * 60 * 60 * 1000),
          subject: `2 Hours Left: ${election.title}`,
          template: 'election-reminder',
        },
        // Election ending (at end time)
        {
          type: 'election_ended',
          scheduledFor: election.endDate,
          subject: `Election Ended: ${election.title}`,
          template: 'election-ended',
        },
      ];

      await Database.runInTransaction(async (tx) => {
        // Clear existing notifications
        await tx.electionNotification.deleteMany({
          where: { electionId },
        });

        // Create new notifications
        await tx.electionNotification.createMany({
          data: notifications.map(notif => ({
            electionId,
            type: notif.type,
            scheduledFor: notif.scheduledFor,
            subject: notif.subject,
            template: notif.template,
            data: {
              electionTitle: election.title,
              electionId: election.id,
              endDate: election.endDate.toISOString(),
              voteUrl: `${process.env.FRONTEND_URL}/elections/${election.id}/vote`,
            },
          })),
        });
      });

      logger.info(`Scheduled notifications for election: ${election.title} (${electionId})`);
    } catch (error) {
      logger.error('Error scheduling election notifications:', error);
      throw new AppError('Failed to schedule notifications', 500);
    }
  }

  /**
   * Send election notifications
   */
  public async sendElectionNotifications(
    electionId: string,
    type: 'started' | 'reminder' | 'ended'
  ): Promise<void> {
    try {
      const election = await this.getElectionById(electionId);
      
      // Get eligible voters
      const eligibleVoters = await this.getEligibleVoters(electionId);
      
      if (eligibleVoters.length === 0) {
        logger.warn(`No eligible voters found for election: ${electionId}`);
        return;
      }

      const emailData = {
        electionTitle: election.title,
        electionId: election.id,
        endDate: new Date(election.endDate).toLocaleDateString(),
        voteUrl: `${process.env.FRONTEND_URL}/elections/${election.id}/vote`,
      };

      // Send emails in batches
      const batchSize = 50;
      for (let i = 0; i < eligibleVoters.length; i += batchSize) {
        const batch = eligibleVoters.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(async (voter) => {
            // Send email
            await emailService.sendEmail({
              to: voter.email,
              subject: this.getNotificationSubject(type, election.title),
              template: this.getNotificationTemplate(type),
              data: {
                ...emailData,
                firstName: voter.firstName,
              },
            });

            // Send SMS if phone number exists
            if (voter.phone) {
              const message = this.getNotificationMessage(type, election.title, new Date(election.endDate));
              await smsService.sendSMS({
                to: voter.phone,
                message,
              });
            }
          })
        );

        // Rate limiting
        if (i + batchSize < eligibleVoters.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      logger.info(`Sent ${type} notifications for election: ${election.title} (${eligibleVoters.length} recipients)`);
    } catch (error) {
      logger.error('Error sending election notifications:', error);
      throw new AppError('Failed to send notifications', 500);
    }
  }

  // Helper methods

  /**
   * Validate election data
   */
  private async validateElectionData(_data: CreateElectionData): Promise<void> {
    // All validation has been moved to the frontend. Backend accepts any payload
    // and relies on business logic/DB constraints only. This now intentionally
    // permits past dates, overlapping periods, empty descriptions, etc.
    return;
  }

  /**
   * Check for election conflicts
   */
  private async checkElectionConflicts(data: CreateElectionData): Promise<void> {
    // Allow overlapping elections - no restrictions
    return;
  }

  /**
   * Calculate eligible voters count
   */
  private async calculateEligibleVotersCount(electionId: string, tx?: any): Promise<number> {
    const prismaClient = tx || prisma;

    const election = await prismaClient.election.findUnique({
      where: { id: electionId },
      select: {
        eligibleFaculties: true,
        eligibleDepartments: true,
        eligibleCourses: true,
        eligibleYears: true,
        minVoterAge: true,
        maxVoterAge: true,
      },
    });

    if (!election) return 0;

    // Count explicit eligibility entries
    const explicitCount = await prismaClient.voterEligibility.count({
      where: { electionId },
    });

    // Count users matching criteria
    const where: any = {
      isActive: true,
      isVerified: true,
    };

    if (election.eligibleFaculties?.length) {
      where.faculty = { in: election.eligibleFaculties };
    }

    if (election.eligibleDepartments?.length) {
      where.department = { in: election.eligibleDepartments };
    }

    if (election.eligibleCourses?.length) {
      where.course = { in: election.eligibleCourses };
    }

    if (election.eligibleYears?.length) {
      where.yearOfStudy = { in: election.eligibleYears };
    }

    const criteriaCount = await prismaClient.user.count({ where });

    // Return the larger count (explicit or criteria-based)
    return Math.max(explicitCount, criteriaCount);
  }

  /**
   * Get eligible voters
   */
  private async getEligibleVoters(electionId: string) {
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      select: {
        eligibleFaculties: true,
        eligibleDepartments: true,
        eligibleCourses: true,
        eligibleYears: true,
      },
    });

    if (!election) return [];

    // Get explicit eligibility
    const explicitVoters = await prisma.voterEligibility.findMany({
      where: { electionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    // Get criteria-based eligibility
    const where: any = {
      isActive: true,
      isVerified: true,
    };

    if (election.eligibleFaculties?.length) {
      where.faculty = { in: election.eligibleFaculties };
    }

    if (election.eligibleDepartments?.length) {
      where.department = { in: election.eligibleDepartments };
    }

    if (election.eligibleCourses?.length) {
      where.course = { in: election.eligibleCourses };
    }

    if (election.eligibleYears?.length) {
      where.yearOfStudy = { in: election.eligibleYears };
    }

    const criteriaVoters = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    // Combine and deduplicate
    const allVoters = [
      ...explicitVoters.map(e => e.user),
      ...criteriaVoters,
    ];

    return Array.from(
      new Map(allVoters.map(v => [v.id, v])).values()
    );
  }

  /**
   * Process scheduled elections - OPTIMIZED with caching and split queries
   */
  private async processScheduledElections(): Promise<void> {
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    const cacheKey = `elections:to_process:${Math.floor(now.getTime() / (60 * 1000))}`; // Cache per minute

    try {
      // Check cache first (1-minute TTL)
      const cached = await redis?.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.electionsToSchedule.length === 0 &&
            data.electionsToStart.length === 0 &&
            data.electionsToEnd.length === 0) {
          return; // No elections to process
        }
      }

      // OPTIMIZATION: Split IN clause into separate queries for better index usage
      const [draftElectionsToSchedule, scheduledElections, draftElectionsToStart, activeElections] = await Promise.all([
        // Query 1: DRAFT elections to auto-schedule (30 mins before start)
        prisma.election.findMany({
          where: {
            status: ElectionStatus.DRAFT,
            startDate: {
              lte: thirtyMinutesFromNow,  // Start date is within 30 minutes
              gt: now                      // But hasn't started yet
            },
          },
          select: {
            id: true,
            title: true,
            startDate: true,
          },
        }),
        // Query 2: SCHEDULED elections ready to start
        prisma.election.findMany({
          where: {
            status: ElectionStatus.SCHEDULED,
            startDate: { lte: now },
          },
          select: {
            id: true,
            title: true,
          },
        }),
        // Query 3: DRAFT elections that should start immediately (past start date)
        prisma.election.findMany({
          where: {
            status: ElectionStatus.DRAFT,
            startDate: { lte: now },
          },
          select: {
            id: true,
            title: true,
          },
        }),
        // Query 4: ACTIVE elections to end
        prisma.election.findMany({
          where: {
            status: ElectionStatus.ACTIVE,
            endDate: { lte: now },
          },
          select: {
            id: true,
            title: true,
          },
        }),
      ]);

      // Combine SCHEDULED and DRAFT elections ready to start
      const electionsToStart = [...scheduledElections, ...draftElectionsToStart];

      // Cache the result for 1 minute to prevent duplicate queries
      await redis?.setex(
        cacheKey,
        60,
        JSON.stringify({
          electionsToSchedule: draftElectionsToSchedule.map(e => e.id),
          electionsToStart: electionsToStart.map(e => e.id),
          electionsToEnd: activeElections.map(e => e.id),
        })
      );

      // STEP 1: Auto-schedule DRAFT elections 30 minutes before start
      for (const election of draftElectionsToSchedule) {
        try {
          await prisma.election.update({
            where: { id: election.id },
            data: { status: ElectionStatus.SCHEDULED },
          });
          logger.info(`📅 Election auto-scheduled: ${election.title} (${election.id}) - starts at ${election.startDate}`);
          // Invalidate cache after status change
          await redis?.del(cacheKey);
          await this.clearElectionCache(election.id);
        } catch (error) {
          logger.error(`Failed to auto-schedule election ${election.id}:`, error);
        }
      }

      // STEP 2: Start elections that should be active now
      for (const election of electionsToStart) {
        try {
          await this.startElection(election.id, 'system');
          // Invalidate cache after status change
          await redis?.del(cacheKey);
        } catch (error) {
          logger.error(`Failed to auto-start election ${election.id}:`, error);
        }
      }

      // STEP 3: End elections that have passed their end date
      for (const election of activeElections) {
        try {
          await this.endElection(election.id, 'system');
          // Invalidate cache after status change
          await redis?.del(cacheKey);
        } catch (error) {
          logger.error(`Failed to auto-end election ${election.id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in processScheduledElections:', error);
      // Clear cache on error
      await redis?.del(cacheKey);
    }
  }

  /**
   * Process election notifications
   */
  private async processElectionNotifications(): Promise<void> {
    const now = new Date();

    const pendingNotifications = await prisma.electionNotification.findMany({
      where: {
        scheduledFor: { lte: now },
        sent: false,
      },
      select: {
        id: true,
        electionId: true,
        type: true,
        scheduledFor: true,
      },
    });

    for (const notification of pendingNotifications) {
      try {
        const type = notification.type.includes('reminder') ? 'reminder' :
                    notification.type.includes('started') ? 'started' : 'ended';

        await this.sendElectionNotifications(notification.electionId, type as any);

        await prisma.electionNotification.update({
          where: { id: notification.id },
          data: { sent: true, sentAt: new Date() },
        });
      } catch (error) {
        logger.error(`Failed to send notification ${notification.id}:`, error);
      }
    }
  }

  /**
   * Cache election data
   */
  private async cacheElection(election: any): Promise<void> {
    await setCache(`election:${election.id}`, election, 1800); // 30 minutes
  }

  /**
   * Clear election cache
   */
  private async clearElectionCache(electionId: string): Promise<void> {
    await deleteCache(`election:${electionId}`);
    await deleteCache(`election:${electionId}:*`);
  }

  /**
   * Validate update permissions
   */
  private async validateUpdatePermissions(election: Election, userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isCreator = election.createdById === userId;
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    const isElectionAdmin = await prisma.election.findFirst({
      where: {
        id: election.id,
        admins: { some: { id: userId } },
      },
    });

    if (!isCreator && !isAdmin && !isElectionAdmin) {
      throw new ValidationError('Insufficient permissions to update this election');
    }
  }

  /**
   * Check if eligibility criteria changed
   */
  private hasEligibilityCriteriaChanged(updateData: UpdateElectionData): boolean {
    return !!(
      updateData.eligibleFaculties ||
      updateData.eligibleDepartments ||
      updateData.eligibleCourses ||
      updateData.eligibleYears ||
      updateData.minVoterAge !== undefined ||
      updateData.maxVoterAge !== undefined
    );
  }

  /**
   * Calculate election results
   */
  private async calculateElectionResults(electionId: string, tx?: PrismaClient): Promise<void> {
    const prismaClient = tx || prisma;

    const positions = await prismaClient.position.findMany({
      where: { electionId },
      include: {
        candidates: {
          where: { status: 'APPROVED' },
        },
      },
    });

    for (const position of positions) {
      // Get vote counts for each candidate
      const voteCounts = await Promise.all(
        position.candidates.map(async (candidate) => {
          const count = await prismaClient.vote.count({
            where: {
              electionId,
              positionId: position.id,
              candidateId: candidate.id,
            },
          });

          return {
            candidateId: candidate.id,
            totalVotes: count,
          };
        })
      );

      // Calculate total votes for this position
      const totalPositionVotes = voteCounts.reduce((sum, vc) => sum + vc.totalVotes, 0);

      // Sort by vote count (descending) and assign ranks
      const sortedResults = voteCounts
        .sort((a, b) => b.totalVotes - a.totalVotes)
        .map((result, index) => ({
          ...result,
          rank: index + 1,
          percentage: totalPositionVotes > 0 ? (result.totalVotes / totalPositionVotes) * 100 : 0,
          isWinner: index === 0 && result.totalVotes > 0,
          isTie: false, // Will be calculated next
        }));

      // Check for ties
      for (let i = 0; i < sortedResults.length - 1; i++) {
        if (sortedResults[i].totalVotes === sortedResults[i + 1].totalVotes && sortedResults[i].totalVotes > 0) {
          sortedResults[i].isTie = true;
          sortedResults[i + 1].isTie = true;
        }
      }

      // Save results
      for (const result of sortedResults) {
        await prismaClient.result.upsert({
          where: {
            electionId_positionId_candidateId: {
              electionId,
              positionId: position.id,
              candidateId: result.candidateId,
            },
          },
          create: {
            electionId,
            positionId: position.id,
            candidateId: result.candidateId,
            totalVotes: result.totalVotes,
            percentage: result.percentage,
            rank: result.rank,
            isWinner: result.isWinner,
            isTie: result.isTie,
          },
          update: {
            totalVotes: result.totalVotes,
            percentage: result.percentage,
            rank: result.rank,
            isWinner: result.isWinner,
            isTie: result.isTie,
            calculatedAt: new Date(),
          },
        });
      }
    }
  }

  /**
   * Get position statistics
   */
  private async getPositionStats(electionId: string) {
    const positions = await prisma.position.findMany({
      where: { electionId },
      include: {
        candidates: {
          where: { status: 'APPROVED' },
        },
        votes: true,
      },
    });

    const election = await prisma.election.findUnique({
      where: { id: electionId },
      select: { totalEligibleVoters: true },
    });

    return positions.map(position => ({
      positionId: position.id,
      positionName: position.name,
      totalCandidates: position.candidates.length,
      totalVotes: position.votes.length,
      turnoutPercentage: election?.totalEligibleVoters 
        ? (position.votes.length / election.totalEligibleVoters) * 100 
        : 0,
    }));
  }

  /**
   * Get peak voting hours
   */
  private async getPeakVotingHours(electionId: string) {
    const votes = await prisma.vote.findMany({
      where: { electionId },
      select: { castAt: true },
    });

    const hourCounts = votes.reduce((acc, vote) => {
      const hour = vote.castAt.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(hourCounts)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        voteCount: count,
      }))
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, 5); // Top 5 peak hours
  }

  /**
   * Get demographic statistics
   */
  private async getDemographicStats(electionId: string) {
    // This would require joining votes with user data
    // For now, return basic structure
    return {
      byFaculty: [],
      byYearOfStudy: [],
      byDepartment: [],
    };
  }

  /**
   * Send result notifications
   */
  private async sendResultNotifications(electionId: string): Promise<void> {
    const eligibleVoters = await this.getEligibleVoters(electionId);
    const election = await this.getElectionById(electionId);

    const emailData = {
      electionTitle: election.title,
      resultsUrl: `${process.env.FRONTEND_URL}/elections/${electionId}/results`,
    };

    // Send in batches
    const batchSize = 50;
    for (let i = 0; i < eligibleVoters.length; i += batchSize) {
      const batch = eligibleVoters.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(voter =>
          emailService.sendEmail({
            to: voter.email,
            subject: `Results Published: ${election.title}`,
            template: 'results-published',
            data: { ...emailData, firstName: voter.firstName },
          })
        )
      );

      if (i + batchSize < eligibleVoters.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Send admin notification
   */
  private async sendAdminNotification(electionId: string, type: string, data: any): Promise<void> {
    const election = await this.getElectionById(electionId);
    
    // Get election admins and creator
    const admins = [
      election.createdBy,
      ...election.admins,
    ];

    const uniqueAdmins = Array.from(
      new Map(admins.map(admin => [admin.id, admin])).values()
    );

    await Promise.allSettled(
      uniqueAdmins.map(admin =>
        emailService.sendEmail({
          to: admin.email,
          subject: `Election ${type.replace('_', ' ')}: ${election.title}`,
          template: 'admin-notification',
          data: {
            adminName: admin.firstName,
            electionTitle: election.title,
            notificationType: type,
            ...data,
          },
        })
      )
    );
  }

  /**
   * Log audit trail
   */
  private async logAudit(
    action: string,
    category: string,
    severity: string,
    userId: string | null,
    electionId: string | null,
    oldData: any,
    newData: any
  ): Promise<void> {
    try {
      // If userId is 'system', set it to null to avoid foreign key constraint
      // The 'system' string is used for automated actions, not a real user ID
      const validUserId = userId === 'system' ? null : userId;

      await prisma.auditLog.create({
        data: {
          action,
          category: category as any,
          severity: severity as any,
          userId: validUserId,
          electionId,
          oldData: oldData ? JSON.stringify(oldData) : undefined,
          newData: newData ? JSON.stringify(newData) : undefined,
          entityType: 'Election',
          entityId: electionId,
        },
      });
    } catch (error) {
      logger.error('Failed to log audit trail:', error);
    }
  }

  /**
   * Get notification subject
   */
  private getNotificationSubject(type: string, electionTitle: string): string {
    switch (type) {
      case 'started':
        return `Election Started: ${electionTitle}`;
      case 'reminder':
        return `Reminder: Vote in ${electionTitle}`;
      case 'ended':
        return `Election Ended: ${electionTitle}`;
      default:
        return `Election Update: ${electionTitle}`;
    }
  }

  /**
   * Get notification template
   */
  private getNotificationTemplate(type: string): string {
    switch (type) {
      case 'started':
        return 'election-started';
      case 'reminder':
        return 'election-reminder';
      case 'ended':
        return 'election-ended';
      default:
        return 'election-update';
    }
  }

  /**
   * Get SMS notification message
   */
  private getNotificationMessage(type: string, electionTitle: string, endDate: Date): string {
    const endDateStr = endDate.toLocaleDateString();
    
    switch (type) {
      case 'started':
        return `JKUAT Voting: "${electionTitle}" is now open. Vote before ${endDateStr}. Login at ${process.env.FRONTEND_URL}`;
      case 'reminder':
        return `JKUAT Voting Reminder: Time is running out to vote in "${electionTitle}". Ends ${endDateStr}. Don't miss out!`;
      case 'ended':
        return `JKUAT Voting: "${electionTitle}" has ended. Results will be published soon.`;
      default:
        return `JKUAT Voting: Update for "${electionTitle}"`;
    }
  }

  /**
   * Cancel scheduled jobs for an election
   */
  private cancelScheduledJobs(electionId: string): void {
    const jobKey = `election:${electionId}`;
    if (this.scheduledJobs.has(jobKey)) {
      const job = this.scheduledJobs.get(jobKey);
      if (job && typeof job.stop === 'function') {
        job.stop();
      }
      this.scheduledJobs.delete(jobKey);
    }
  }
}

// Export singleton instance
export const electionService = ElectionService.getInstance();

export default electionService;