// backend/src/services/candidatePreRegistration.service.ts

import { PrismaClient, PreRegStatus, UserRole, CandidatePreRegistration, User, TokenType } from '@prisma/client';
import { prisma } from '../config/database';
import { redis, isDisabled } from '../config/redis';
import { HashingService } from '../utils/hashing';
import { JWTService } from '../utils/jwt';
import { encryptionService } from '../utils/encryption';
import { emailService } from '../utils/email';
import { logger } from '../utils/logger';
import {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
} from '../utils/errors';
import { DeviceInfo, TokenPair } from '../types/auth.types';

interface SubmitApplicationRequest {
  studentId: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  faculty: string;
  department: string;
  course: string;
  yearOfStudy: number;
  intendedPosition: string;
  electionId: string; // NEW: Reference to specific election
  positionId: string; // NEW: Reference to specific position
  reason: string;
}

interface CompleteRegistrationRequest {
  token: string;
  password: string;
  confirmPassword: string;
  admissionYear?: number;
}

interface ApplicationFilters {
  status?: PreRegStatus | 'all';
  faculty?: string;
  department?: string;
  page?: number;
  limit?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class CandidatePreRegistrationService {
  private static instance: CandidatePreRegistrationService;

  private constructor() {}

  public static getInstance(): CandidatePreRegistrationService {
    if (!CandidatePreRegistrationService.instance) {
      CandidatePreRegistrationService.instance = new CandidatePreRegistrationService();
    }
    return CandidatePreRegistrationService.instance;
  }

  /**
   * Submit candidate application
   */
  public async submitApplication(data: SubmitApplicationRequest): Promise<{ id: string; status: PreRegStatus }> {
    try {
      // Validate application data
      this.validateApplicationData(data);

      // Validate election exists and is accepting applications
      const election = await prisma.election.findUnique({
        where: { id: data.electionId },
        include: { positions: true }
      });

      if (!election) {
        throw new NotFoundError('Election not found');
      }

      if (election.status !== 'DRAFT' && election.status !== 'SCHEDULED') {
        throw new ValidationError('Election is not accepting candidate applications');
      }

      // Validate position exists in this election
      const position = election.positions.find(p => p.id === data.positionId);
      if (!position) {
        throw new NotFoundError('Position not found in this election');
      }

      // Check for existing application
      const existingApplication = await this.checkExistingApplication(data.studentId, data.email);

      if (existingApplication) {
        throw new ConflictError(this.getExistingApplicationMessage(existingApplication));
      }

      // Check if user already registered
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { studentId: data.studentId },
            { email: data.email.toLowerCase() }
          ]
        }
      });

      if (existingUser) {
        throw new ConflictError('A user with this student ID or email already exists.');
      }

      // SECURITY: Prevent admins from registering as candidates (conflict of interest)
      const adminWithEmail = await prisma.user.findFirst({
        where: {
          email: data.email.toLowerCase(),
          role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR] }
        }
      });

      if (adminWithEmail) {
        throw new ValidationError('Administrative accounts cannot register as candidates. This is a security measure to prevent conflicts of interest.');
      }

      // Additional check: prevent admin emails even if not registered yet
      // Check if email matches common admin patterns or is in admin domain
      const emailLower = data.email.toLowerCase();
      if (emailLower.includes('admin') || emailLower.includes('moderator') || emailLower.includes('superadmin')) {
        logger.warn('Attempted candidate registration with admin-like email', {
          email: data.email,
          studentId: data.studentId
        });
      }

      // Generate temporary password (will be sent via email for user to change)
      const temporaryPassword = encryptionService.generateToken(16);
      const hashedPassword = await HashingService.hashPassword(temporaryPassword);

      // Create user account and application in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create user account with VOTER role (candidates can still vote!)
        const newUser = await tx.user.create({
          data: {
            studentId: data.studentId,
            email: data.email.toLowerCase(),
            firstName: data.firstName,
            lastName: data.lastName,
            middleName: data.middleName,
            password: hashedPassword,
            phone: data.phone,
            faculty: data.faculty,
            department: data.department,
            course: data.course,
            yearOfStudy: data.yearOfStudy,
            admissionYear: new Date().getFullYear() - data.yearOfStudy + 1, // Calculate admission year
            role: UserRole.VOTER, // Initially VOTER role
            isActive: true,
            isVerified: false, // Will be verified when email is confirmed
            emailVerified: null
          }
        });

        // Create application linked to user
        const application = await tx.candidatePreRegistration.create({
          data: {
            studentId: data.studentId,
            email: data.email.toLowerCase(),
            firstName: data.firstName,
            lastName: data.lastName,
            middleName: data.middleName,
            phone: data.phone,
            faculty: data.faculty,
            department: data.department,
            course: data.course,
            yearOfStudy: data.yearOfStudy,
            intendedPosition: data.intendedPosition,
            electionId: data.electionId,
            positionId: data.positionId,
            reason: data.reason,
            status: PreRegStatus.PENDING,
            userId: newUser.id // Link to created user
          },
          include: {
            election: true,
            position: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          }
        });

        return { user: newUser, application, temporaryPassword };
      });

      const application = result.application;

      // Generate password reset token for the new user
      const passwordResetToken = encryptionService.generateToken(32);
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.user.update({
        where: { id: result.user.id },
        data: {
          passwordResetToken,
          passwordResetExpires: tokenExpiry
        }
      });

      // Send confirmation email to applicant with password setup link
      await this.sendApplicationConfirmationEmail(application, passwordResetToken);

      // Notify admins
      await this.notifyAdminsOfNewApplication(application);

      logger.info('Candidate application submitted', {
        applicationId: application.id,
        studentId: application.studentId,
        electionId: application.electionId,
        positionId: application.positionId,
        position: application.intendedPosition
      });

      return {
        id: application.id,
        status: application.status
      };
    } catch (error) {
      logger.error('Submit application failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to submit application', 500);
    }
  }

  /**
   * Verify approval token
   */
  public async verifyApprovalToken(token: string): Promise<{
    valid: boolean;
    message?: string;
    application?: Partial<CandidatePreRegistration>;
  }> {
    try {
      if (!token) {
        throw new ValidationError('Approval token is required');
      }

      const application = await prisma.candidatePreRegistration.findUnique({
        where: { approvalToken: token }
      });

      if (!application) {
        return {
          valid: false,
          message: 'Invalid approval token'
        };
      }

      if (application.status !== PreRegStatus.APPROVED) {
        return {
          valid: false,
          message: 'Application is not approved'
        };
      }

      // Check if token expired
      if (application.tokenExpiry && application.tokenExpiry < new Date()) {
        // Update status to expired
        await prisma.candidatePreRegistration.update({
          where: { id: application.id },
          data: { status: PreRegStatus.EXPIRED }
        });

        return {
          valid: false,
          message: 'Approval token has expired. Please reapply.'
        };
      }

      return {
        valid: true,
        application: {
          studentId: application.studentId,
          email: application.email,
          firstName: application.firstName,
          lastName: application.lastName,
          middleName: application.middleName,
          phone: application.phone,
          faculty: application.faculty,
          department: application.department,
          course: application.course,
          yearOfStudy: application.yearOfStudy,
          intendedPosition: application.intendedPosition
        }
      };
    } catch (error) {
      logger.error('Verify approval token failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to verify approval token', 500);
    }
  }

  /**
   * Complete registration with approved token
   */
  public async completeRegistration(
    data: CompleteRegistrationRequest,
    deviceInfo: DeviceInfo
  ): Promise<{ user: Partial<User>; tokens: TokenPair }> {
    try {
      // Validate passwords
      if (data.password !== data.confirmPassword) {
        throw new ValidationError('Passwords do not match');
      }

      // Verify token
      const application = await prisma.candidatePreRegistration.findUnique({
        where: { approvalToken: data.token },
        include: {
          election: {
            select: {
              id: true,
              title: true,
              status: true
            }
          },
          position: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!application) {
        throw new NotFoundError('Invalid or expired token');
      }

      if (application.status !== PreRegStatus.APPROVED) {
        throw new ValidationError('Application is not approved');
      }

      if (application.tokenExpiry && application.tokenExpiry < new Date()) {
        await prisma.candidatePreRegistration.update({
          where: { id: application.id },
          data: { status: PreRegStatus.EXPIRED }
        });
        throw new ValidationError('Token has expired. Please reapply.');
      }

      // Check if already registered
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { studentId: application.studentId },
            { email: application.email }
          ]
        }
      });

      if (existingUser) {
        throw new ConflictError('User already registered');
      }

      // Hash password
      const hashedPassword = await HashingService.hashPassword(data.password);

      // Create user, update application, and create candidate in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create user account with VOTER role (candidates can still vote!)
        const newUser = await tx.user.create({
          data: {
            studentId: application.studentId,
            email: application.email,
            firstName: application.firstName,
            lastName: application.lastName,
            middleName: application.middleName,
            password: hashedPassword,
            phone: application.phone,
            faculty: application.faculty,
            department: application.department,
            course: application.course,
            yearOfStudy: application.yearOfStudy,
            admissionYear: data.admissionYear || new Date().getFullYear(),
            role: UserRole.VOTER,
            isActive: true,
            isVerified: true,
            emailVerified: new Date()
          }
        });

        // Update application status
        await tx.candidatePreRegistration.update({
          where: { id: application.id },
          data: { status: PreRegStatus.REGISTERED }
        });

        // Auto-create Candidate record if election and position are specified
        let candidate = null;
        if (application.electionId && application.positionId) {
          candidate = await tx.candidate.create({
            data: {
              electionId: application.electionId,
              positionId: application.positionId,
              studentId: newUser.studentId,
              firstName: newUser.firstName,
              lastName: newUser.lastName,
              middleName: newUser.middleName,
              email: newUser.email,
              phone: newUser.phone || '',
              faculty: newUser.faculty,
              department: newUser.department,
              course: newUser.course,
              yearOfStudy: newUser.yearOfStudy,
              manifesto: application.reason, // Use application reason as manifesto
              status: 'PENDING', // Requires admin approval
              photo: '', // Can be updated later
              verifiedAt: new Date()
            }
          });

          logger.info('Candidate record auto-created', {
            userId: newUser.id,
            candidateId: candidate.id,
            electionId: application.electionId,
            positionId: application.positionId
          });
        }

        return { user: newUser, candidate };
      });

      const user = result.user;

      // Generate tokens
      const tokens = await JWTService.generateTokenPair(
        user,
        deviceInfo.ipAddress,
        deviceInfo.userAgent
      );

      // Send welcome email
      await emailService.sendWelcomeEmail({
        email: user.email,
        firstName: user.firstName,
        studentId: user.studentId
      });

      // Send candidacy notification email if candidate was created
      if (result.candidate && application.election && application.position) {
        await emailService.sendEmail({
          to: user.email,
          subject: 'Your Candidacy is Pending Approval - UniElect',
          template: 'candidate-pending-approval',
          data: {
            firstName: user.firstName,
            electionTitle: application.election.title,
            positionTitle: application.position.name,
            message: 'Your candidate application has been registered successfully. An admin will review and approve your candidacy shortly.',
            dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
          }
        });
      }

      logger.info('Candidate registration completed', {
        userId: user.id,
        studentId: user.studentId,
        candidateCreated: !!result.candidate,
        candidateId: result.candidate?.id
      });

      return {
        user: {
          id: user.id,
          studentId: user.studentId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        tokens
      };
    } catch (error) {
      logger.error('Complete registration failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to complete registration', 500);
    }
  }

  /**
   * Get all applications with filters (Admin)
   */
  public async getAllApplications(filters: ApplicationFilters): Promise<PaginatedResponse<any>> {
    try {
      const { status, faculty, department, page = 1, limit = 10 } = filters;

      const where: any = {};

      if (status && status !== 'all') {
        where.status = status as PreRegStatus;
      }

      if (faculty) {
        where.faculty = faculty;
      }

      if (department) {
        where.department = department;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [applications, total] = await Promise.all([
        prisma.candidatePreRegistration.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            election: {
              select: {
                id: true,
                title: true,
                status: true
              }
            },
            position: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }),
        prisma.candidatePreRegistration.count({ where })
      ]);

      return {
        data: applications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      };
    } catch (error) {
      logger.error('Get all applications failed:', error);
      throw new AppError('Failed to fetch applications', 500);
    }
  }

  /**
   * Get application by ID (Admin)
   */
  public async getApplicationById(id: string): Promise<any> {
    try {
      const application = await prisma.candidatePreRegistration.findUnique({
        where: { id },
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!application) {
        throw new NotFoundError('Application not found');
      }

      return application;
    } catch (error) {
      logger.error('Get application by ID failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch application', 500);
    }
  }

  /**
   * Approve application (Admin)
   */
  public async approveApplication(
    id: string,
    adminId: string,
    reviewNotes?: string
  ): Promise<CandidatePreRegistration> {
    try {
      const application = await prisma.candidatePreRegistration.findUnique({
        where: { id },
        include: {
          user: true,
          election: {
            select: {
              id: true,
              title: true,
              status: true
            }
          },
          position: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!application) {
        throw new NotFoundError('Application not found');
      }

      // If already approved, return success (idempotent operation)
      if (application.status === PreRegStatus.APPROVED) {
        logger.info('Application already approved', { applicationId: id });
        return application;
      }

      if (application.status !== PreRegStatus.PENDING) {
        throw new ValidationError('Only pending applications can be approved');
      }

      if (!application.userId) {
        throw new ValidationError('Application must have an associated user account');
      }

      // Update application, verify user, and create candidate record in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Verify user since admin approved (keep as VOTER - candidates can still vote)
        await tx.user.update({
          where: { id: application.userId! },
          data: {
            isVerified: true, // Verify user since admin approved
            emailVerified: new Date()
          }
        });

        // Create Candidate record if election and position are specified
        let candidate = null;
        if (application.electionId && application.positionId) {
          candidate = await tx.candidate.create({
            data: {
              electionId: application.electionId,
              positionId: application.positionId,
              studentId: application.studentId,
              firstName: application.firstName,
              lastName: application.lastName,
              middleName: application.middleName,
              email: application.email,
              phone: application.phone || '',
              faculty: application.faculty,
              department: application.department,
              course: application.course,
              yearOfStudy: application.yearOfStudy,
              manifesto: application.reason, // Use application reason as manifesto
              status: 'APPROVED', // Auto-approve since admin approved pre-registration
              photo: '', // Can be updated later
              verifiedAt: new Date()
            }
          });

          logger.info('Candidate record created from approved application', {
            userId: application.userId,
            candidateId: candidate.id,
            electionId: application.electionId,
            positionId: application.positionId
          });
        }

        // Update application status
        const updatedApplication = await tx.candidatePreRegistration.update({
          where: { id },
          data: {
            status: PreRegStatus.APPROVED,
            reviewedBy: adminId,
            reviewedAt: new Date(),
            reviewNotes
          },
          include: {
            user: true,
            election: {
              select: {
                id: true,
                title: true,
                status: true
              }
            },
            position: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        return { application: updatedApplication, candidate };
      });

      // Invalidate candidates cache for this election so new candidate shows up immediately
      if (result.candidate && application.electionId) {
        try {
          // Get all cache keys for this election's candidates
          const pattern = `candidates:election:${application.electionId}:*`;
          const keys = await redis?.keys(pattern) ?? [];
          if (keys && keys.length > 0) {
            await redis?.del(...keys);
          }

          // Also invalidate election stats cache
          await redis?.del(`candidate-stats:${application.electionId}`);

          logger.info('Invalidated candidates cache for election', {
            electionId: application.electionId,
            keysDeleted: keys.length
          });
        } catch (cacheError) {
          logger.error('Failed to invalidate candidates cache:', cacheError);
          // Don't fail the approval if cache invalidation fails
        }
      }

      // Generate a new password reset token for the user to set their password
      let registrationToken: string | null = null;
      if (application.userId) {
        registrationToken = encryptionService.generateToken(32);
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store token in both user record AND VerificationToken table
        // (the confirmPasswordReset function looks for VerificationToken)
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: application.userId! },
            data: {
              passwordResetToken: registrationToken,
              passwordResetExpires: tokenExpiry
            }
          });

          // Create VerificationToken record for password reset
          await tx.verificationToken.create({
            data: {
              token: registrationToken!,
              userId: application.userId!,
              type: TokenType.PASSWORD_RESET,
              expiresAt: tokenExpiry,
            },
          });
        });
      }

      // Send approval email with registration link
      await this.sendApprovalEmail(result.application, registrationToken);

      logger.info('Application approved, user verified, candidate record created', {
        applicationId: id,
        userId: application.userId,
        approvedBy: adminId,
        candidateCreated: !!result.candidate,
        registrationTokenGenerated: !!registrationToken
      });

      return result.application;
    } catch (error) {
      logger.error('Approve application failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to approve application', 500);
    }
  }

  /**
   * Reject application (Admin)
   */
  public async rejectApplication(
    id: string,
    adminId: string,
    rejectionReason: string
  ): Promise<CandidatePreRegistration> {
    try {
      if (!rejectionReason || rejectionReason.length < 20) {
        throw new ValidationError('Rejection reason must be at least 20 characters');
      }

      const application = await prisma.candidatePreRegistration.findUnique({
        where: { id }
      });

      if (!application) {
        throw new NotFoundError('Application not found');
      }

      if (application.status !== PreRegStatus.PENDING) {
        throw new ValidationError('Only pending applications can be rejected');
      }

      // Update application
      const updatedApplication = await prisma.candidatePreRegistration.update({
        where: { id },
        data: {
          status: PreRegStatus.REJECTED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason
        }
      });

      // Send rejection email
      await this.sendRejectionEmail(updatedApplication);

      logger.info('Application rejected', {
        applicationId: id,
        rejectedBy: adminId
      });

      return updatedApplication;
    } catch (error) {
      logger.error('Reject application failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to reject application', 500);
    }
  }

  /**
   * Get open elections for candidate registration (PUBLIC)
   * Returns elections that are accepting candidate applications
   */
  public async getOpenElections(): Promise<any[]> {
    try {
      const now = new Date();

      const elections = await prisma.election.findMany({
        where: {
          AND: [
            {
              OR: [
                { status: 'DRAFT' },
                { status: 'SCHEDULED' }
              ]
            },
            {
              OR: [
                { registrationEnd: null },
                { registrationEnd: { gte: now } }
              ]
            }
          ]
        },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          status: true,
          startDate: true,
          endDate: true,
          registrationStart: true,
          registrationEnd: true,
          positions: {
            select: {
              id: true,
              name: true,
              description: true,
              order: true
            },
            orderBy: {
              order: 'asc'
            }
          }
        },
        orderBy: {
          startDate: 'asc'
        }
      });

      return elections;
    } catch (error) {
      logger.error('Get open elections failed:', error);
      throw new AppError('Failed to fetch open elections', 500);
    }
  }

  /**
   * Get application statistics (Admin)
   */
  public async getApplicationStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    registered: number;
    expired: number;
  }> {
    try {
      const [total, pending, approved, rejected, registered, expired] = await Promise.all([
        prisma.candidatePreRegistration.count(),
        prisma.candidatePreRegistration.count({ where: { status: PreRegStatus.PENDING } }),
        prisma.candidatePreRegistration.count({ where: { status: PreRegStatus.APPROVED } }),
        prisma.candidatePreRegistration.count({ where: { status: PreRegStatus.REJECTED } }),
        prisma.candidatePreRegistration.count({ where: { status: PreRegStatus.REGISTERED } }),
        prisma.candidatePreRegistration.count({ where: { status: PreRegStatus.EXPIRED } })
      ]);

      return {
        total,
        pending,
        approved,
        rejected,
        registered,
        expired
      };
    } catch (error) {
      logger.error('Get application stats failed:', error);
      throw new AppError('Failed to fetch application statistics', 500);
    }
  }

  // Private helper methods

  private validateApplicationData(data: SubmitApplicationRequest): void {
    const errors: string[] = [];

    if (!data.studentId || data.studentId.length < 5) {
      errors.push('Student ID must be at least 5 characters');
    }

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Valid email address is required');
    }

    if (!data.firstName || data.firstName.length < 2) {
      errors.push('First name must be at least 2 characters');
    }

    if (!data.lastName || data.lastName.length < 2) {
      errors.push('Last name must be at least 2 characters');
    }

    if (!data.reason || data.reason.length < 100) {
      errors.push('Reason must be at least 100 characters');
    }

    if (data.reason && data.reason.length > 2000) {
      errors.push('Reason must not exceed 2000 characters');
    }

    if (!data.yearOfStudy || data.yearOfStudy < 1 || data.yearOfStudy > 6) {
      errors.push('Year of study must be between 1 and 6');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
  }

  private async checkExistingApplication(
    studentId: string,
    email: string
  ): Promise<CandidatePreRegistration | null> {
    return prisma.candidatePreRegistration.findFirst({
      where: {
        OR: [
          { studentId },
          { email: email.toLowerCase() }
        ]
      }
    });
  }

  private getExistingApplicationMessage(application: CandidatePreRegistration): string {
    switch (application.status) {
      case PreRegStatus.PENDING:
        return 'You have already submitted an application that is pending review.';
      case PreRegStatus.APPROVED:
        return 'Your application has already been approved. Please check your email for the registration link.';
      case PreRegStatus.REGISTERED:
        return 'You have already completed registration.';
      default:
        return 'An application with this student ID or email already exists.';
    }
  }

  private async sendApplicationConfirmationEmail(application: any, passwordResetToken: string): Promise<void> {
    try {
      const passwordSetupLink = `${process.env.FRONTEND_URL}/auth/set-password?token=${passwordResetToken}`;

      // Send confirmation email to the candidate (not admin notification)
      await emailService.sendEmail({
        to: application.email,
        subject: 'Candidate Application Received - UniElect',
        template: 'candidate-application-confirmation',
        data: {
          firstName: application.firstName,
          studentId: application.studentId,
          applicationId: application.id,
          intendedPosition: application.intendedPosition,
          electionTitle: application.election?.title || 'Upcoming Election',
          positionName: application.position?.name || application.intendedPosition,
          createdAt: application.createdAt.toLocaleString(),
          passwordSetupLink,
          email: application.email
        }
      });
    } catch (error) {
      logger.error('Failed to send application confirmation email:', error);
    }
  }

  private async notifyAdminsOfNewApplication(application: any): Promise<void> {
    try {
      const admins = await prisma.user.findMany({
        where: {
          role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
          isActive: true
        },
        select: { email: true, firstName: true }
      });

      if (admins.length > 0) {
        const electionInfo = application.election ? ` in ${application.election.title}` : '';
        const positionInfo = application.position ? ` for ${application.position.name}` : ` for the position of ${application.intendedPosition}`;

        await emailService.sendEmail({
          to: admins.map(a => a.email),
          subject: 'New Candidate Application Submitted',
          template: 'admin-notification',
          data: {
            title: 'New Candidate Application',
            message: `A new candidate application has been submitted by ${application.firstName} ${application.lastName} (${application.studentId})${positionInfo}${electionInfo}.`,
            actionUrl: `${process.env.FRONTEND_URL}/admin/applications/${application.id}`
          }
        });
      }
    } catch (error) {
      logger.error('Failed to notify admins:', error);
    }
  }

  private async sendApprovalEmail(application: any, registrationToken: string | null = null): Promise<void> {
    try {
      const loginUrl = `${process.env.FRONTEND_URL}/login`;
      const dashboardUrl = `${process.env.FRONTEND_URL}/candidate/dashboard`;
      const electionTitle = application.election?.title || 'the upcoming election';
      const positionName = application.position?.name || application.intendedPosition;

      // Generate registration URL with token if available
      const registrationUrl = registrationToken
        ? `${process.env.FRONTEND_URL}/set-password?token=${registrationToken}`
        : null;

      await emailService.sendEmail({
        to: application.email,
        subject: 'Congratulations! Your Candidate Application Approved - UniElect',
        template: 'candidate-approved',
        data: {
          firstName: application.firstName,
          intendedPosition: application.intendedPosition,
          electionTitle,
          positionName,
          loginUrl,
          dashboardUrl,
          registrationUrl, // New: registration URL with temporary token
          email: application.email,
          reviewNotes: application.reviewNotes || '',
          nextSteps: registrationToken
            ? [
                'Complete your registration by clicking the button in this email',
                'Set a strong, secure password for your account',
                'Complete your candidate profile with photo and detailed manifesto',
                'Access your candidate dashboard to track your campaign',
                'Review the election rules and guidelines'
              ]
            : [
                'Login to your account using your email and password',
                'Complete your candidate profile with photo and detailed manifesto',
                'Access your candidate dashboard to track your campaign',
                'Review the election rules and guidelines'
              ]
        }
      });
    } catch (error) {
      logger.error('Failed to send approval email:', error);
      throw new AppError('Failed to send approval email', 500);
    }
  }

  private async sendRejectionEmail(application: CandidatePreRegistration): Promise<void> {
    try {
      await emailService.sendEmail({
        to: application.email,
        subject: 'Candidate Application Update - UniElect',
        template: 'candidate-rejected',
        data: {
          firstName: application.firstName,
          intendedPosition: application.intendedPosition,
          reason: application.rejectionReason || ''
        }
      });
    } catch (error) {
      logger.error('Failed to send rejection email:', error);
      throw new AppError('Failed to send rejection email', 500);
    }
  }
}

// Export singleton instance
export const candidatePreRegistrationService = CandidatePreRegistrationService.getInstance();

export default candidatePreRegistrationService;
