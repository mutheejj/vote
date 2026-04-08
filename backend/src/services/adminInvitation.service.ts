// backend/src/services/adminInvitation.service.ts

import { PrismaClient, UserRole, AdminInvitation, User } from '@prisma/client';
import { prisma } from '../config/database';
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

interface CreateInvitationRequest {
  email: string;
  role: UserRole;
  invitedBy: string;
  expiresInDays?: number;
}

interface CompleteInvitationRequest {
  token: string;
  studentId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  faculty?: string;
  department?: string;
  course?: string;
  yearOfStudy?: number;
  admissionYear?: number;
}

interface InvitationFilters {
  status?: 'all' | 'pending' | 'used' | 'expired' | 'revoked';
  role?: UserRole;
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

export class AdminInvitationService {
  private static instance: AdminInvitationService;

  private constructor() {}

  public static getInstance(): AdminInvitationService {
    if (!AdminInvitationService.instance) {
      AdminInvitationService.instance = new AdminInvitationService();
    }
    return AdminInvitationService.instance;
  }

  /**
   * Create admin invitation
   */
  public async createInvitation(data: CreateInvitationRequest): Promise<AdminInvitation> {
    try {
      // Validate email
      if (!this.isValidEmail(data.email)) {
        throw new ValidationError('Invalid email format');
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() }
      });

      if (existingUser) {
        throw new ConflictError('A user with this email already exists');
      }

      // Check for existing pending invitation (not used, not revoked, not expired)
      const existingInvitation = await prisma.adminInvitation.findFirst({
        where: {
          email: data.email.toLowerCase(),
          used: false,
          revokedAt: null,
          expiresAt: {
            gte: new Date()
          }
        }
      });

      if (existingInvitation) {
        throw new ConflictError('An active invitation already exists for this email');
      }

      // Generate invitation token
      const invitationToken = encryptionService.generateToken(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 7)); // Default 7 days

      // Create invitation
      const invitation = await prisma.adminInvitation.create({
        data: {
          email: data.email.toLowerCase(),
          role: data.role,
          invitationToken,
          expiresAt,
          invitedBy: data.invitedBy,
          used: false
        },
        include: {
          inviter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Send invitation email
      await this.sendInvitationEmail(invitation);

      logger.info('Admin invitation created', {
        invitationId: invitation.id,
        email: invitation.email,
        role: invitation.role,
        invitedBy: data.invitedBy
      });

      return invitation;
    } catch (error) {
      logger.error('Create invitation failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create invitation', 500);
    }
  }

  /**
   * Verify invitation token
   */
  public async verifyInvitationToken(token: string): Promise<{
    valid: boolean;
    message?: string;
    invitation?: Partial<AdminInvitation>;
  }> {
    try {
      if (!token) {
        throw new ValidationError('Invitation token is required');
      }

      const invitation = await prisma.adminInvitation.findUnique({
        where: { invitationToken: token }
      });

      if (!invitation) {
        return {
          valid: false,
          message: 'Invalid invitation token'
        };
      }

      // Check if already used
      if (invitation.used) {
        return {
          valid: false,
          message: 'Invitation has already been used'
        };
      }

      // Check if revoked
      if (invitation.revokedAt) {
        return {
          valid: false,
          message: 'Invitation has been revoked'
        };
      }

      // Check if expired
      if (invitation.expiresAt < new Date()) {
        return {
          valid: false,
          message: 'Invitation has expired. Please request a new invitation.'
        };
      }

      return {
        valid: true,
        invitation: {
          email: invitation.email,
          role: invitation.role
        }
      };
    } catch (error) {
      logger.error('Verify invitation token failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to verify invitation token', 500);
    }
  }

  /**
   * Complete invitation registration
   */
  public async completeInvitation(
    data: CompleteInvitationRequest,
    deviceInfo: DeviceInfo
  ): Promise<{ user: Partial<User>; tokens: TokenPair }> {
    try {
      // Validate passwords
      if (data.password !== data.confirmPassword) {
        throw new ValidationError('Passwords do not match');
      }

      // Verify invitation token
      const invitation = await prisma.adminInvitation.findUnique({
        where: { invitationToken: data.token }
      });

      if (!invitation) {
        throw new NotFoundError('Invalid or expired invitation token');
      }

      if (invitation.used) {
        throw new ValidationError('Invitation has already been used');
      }

      if (invitation.revokedAt) {
        throw new ValidationError('Invitation has been revoked');
      }

      if (invitation.expiresAt < new Date()) {
        throw new ValidationError('Invitation has expired');
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: invitation.email },
            { studentId: data.studentId }
          ]
        }
      });

      if (existingUser) {
        throw new ConflictError('User already registered');
      }

      // Hash password
      const hashedPassword = await HashingService.hashPassword(data.password);

      // Create user and update invitation in transaction
      const user = await prisma.$transaction(async (tx) => {
        // Create user account with invited role
        const newUser = await tx.user.create({
          data: {
            studentId: data.studentId,
            email: invitation.email,
            firstName: data.firstName,
            lastName: data.lastName,
            middleName: data.middleName || undefined,
            password: hashedPassword,
            phone: data.phone || undefined,
            faculty: data.faculty || '',
            department: data.department || '',
            course: data.course || '',
            yearOfStudy: data.yearOfStudy || 1,
            admissionYear: data.admissionYear || new Date().getFullYear(),
            role: invitation.role,
            isActive: true,
            isVerified: true,
            emailVerified: new Date()
          }
        });

        // Update invitation to mark as used
        await tx.adminInvitation.update({
          where: { id: invitation.id },
          data: {
            used: true,
            usedAt: new Date(),
            usedByName: `${data.firstName} ${data.lastName}`,
            usedByStudentId: data.studentId
          }
        });

        return newUser;
      });

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

      logger.info('Admin invitation completed', {
        userId: user.id,
        email: user.email,
        role: user.role
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
      logger.error('Complete invitation failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to complete invitation', 500);
    }
  }

  /**
   * Get all invitations with filters (Admin)
   */
  public async getAllInvitations(filters: InvitationFilters): Promise<PaginatedResponse<any>> {
    try {
      const { status, role, page = 1, limit = 10 } = filters;

      const where: any = {};

      if (status && status !== 'all') {
        const now = new Date();

        switch (status) {
          case 'pending':
            where.used = false;
            where.revokedAt = null;
            where.expiresAt = { gte: now };
            break;
          case 'used':
            where.used = true;
            break;
          case 'expired':
            where.used = false;
            where.revokedAt = null;
            where.expiresAt = { lt: now };
            break;
          case 'revoked':
            where.revokedAt = { not: null };
            break;
        }
      }

      if (role) {
        where.role = role;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [invitations, total] = await Promise.all([
        prisma.adminInvitation.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            inviter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }),
        prisma.adminInvitation.count({ where })
      ]);

      return {
        data: invitations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      };
    } catch (error) {
      logger.error('Get all invitations failed:', error);
      throw new AppError('Failed to fetch invitations', 500);
    }
  }

  /**
   * Get invitation by ID (Admin)
   */
  public async getInvitationById(id: string): Promise<any> {
    try {
      const invitation = await prisma.adminInvitation.findUnique({
        where: { id },
        include: {
          inviter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!invitation) {
        throw new NotFoundError('Invitation not found');
      }

      return invitation;
    } catch (error) {
      logger.error('Get invitation by ID failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch invitation', 500);
    }
  }

  /**
   * Resend invitation (Admin)
   */
  public async resendInvitation(id: string): Promise<AdminInvitation> {
    try {
      const invitation = await prisma.adminInvitation.findUnique({
        where: { id },
        include: {
          inviter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!invitation) {
        throw new NotFoundError('Invitation not found');
      }

      if (invitation.used) {
        throw new ValidationError('Cannot resend a used invitation');
      }

      if (invitation.revokedAt) {
        throw new ValidationError('Cannot resend a revoked invitation');
      }

      // Generate new token and extend expiry
      const invitationToken = encryptionService.generateToken(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Extend by 7 days

      // Update invitation
      const updatedInvitation = await prisma.adminInvitation.update({
        where: { id },
        data: {
          invitationToken,
          expiresAt
        },
        include: {
          inviter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Resend invitation email
      await this.sendInvitationEmail(updatedInvitation);

      logger.info('Invitation resent', { invitationId: id });

      return updatedInvitation;
    } catch (error) {
      logger.error('Resend invitation failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to resend invitation', 500);
    }
  }

  /**
   * Revoke invitation (Admin)
   */
  public async revokeInvitation(id: string, revokedBy: string): Promise<AdminInvitation> {
    try {
      const invitation = await prisma.adminInvitation.findUnique({
        where: { id }
      });

      if (!invitation) {
        throw new NotFoundError('Invitation not found');
      }

      if (invitation.used) {
        throw new ValidationError('Cannot revoke a used invitation');
      }

      if (invitation.revokedAt) {
        throw new ValidationError('Invitation is already revoked');
      }

      // Update invitation to mark as revoked
      const updatedInvitation = await prisma.adminInvitation.update({
        where: { id },
        data: {
          revokedAt: new Date(),
          revokedBy
        }
      });

      logger.info('Invitation revoked', { invitationId: id, revokedBy });

      return updatedInvitation;
    } catch (error) {
      logger.error('Revoke invitation failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to revoke invitation', 500);
    }
  }

  /**
   * Get invitation statistics (Admin)
   */
  public async getInvitationStats(): Promise<{
    total: number;
    pending: number;
    used: number;
    expired: number;
    revoked: number;
    byRole: Record<string, number>;
  }> {
    try {
      const now = new Date();

      const [total, used, revoked, pending, expired, byRole] = await Promise.all([
        prisma.adminInvitation.count(),
        prisma.adminInvitation.count({ where: { used: true } }),
        prisma.adminInvitation.count({ where: { revokedAt: { not: null } } }),
        prisma.adminInvitation.count({
          where: {
            used: false,
            revokedAt: null,
            expiresAt: { gte: now }
          }
        }),
        prisma.adminInvitation.count({
          where: {
            used: false,
            revokedAt: null,
            expiresAt: { lt: now }
          }
        }),
        prisma.adminInvitation.groupBy({
          by: ['role'],
          _count: true
        })
      ]);

      const roleStats: Record<string, number> = {};
      byRole.forEach(item => {
        roleStats[item.role] = item._count;
      });

      return {
        total,
        pending,
        used,
        expired,
        revoked,
        byRole: roleStats
      };
    } catch (error) {
      logger.error('Get invitation stats failed:', error);
      throw new AppError('Failed to fetch invitation statistics', 500);
    }
  }

  // Private helper methods

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async sendInvitationEmail(invitation: AdminInvitation & {
    inviter: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }): Promise<void> {
    try {
      const registrationLink = `${process.env.FRONTEND_URL}/register/admin?token=${invitation.invitationToken}`;

      const roleLabels: Record<UserRole, string> = {
        [UserRole.SUPER_ADMIN]: 'Super Administrator',
        [UserRole.ADMIN]: 'Administrator',
        [UserRole.MODERATOR]: 'Moderator',
        [UserRole.VOTER]: 'Voter'
      };

      const roleLabel = roleLabels[invitation.role as UserRole] || 'Staff Member';

      await emailService.sendEmail({
        to: invitation.email,
        subject: `Invitation to Join UniElect as ${roleLabel}`,
        template: 'admin-notification',
        data: {
          title: 'You\'ve Been Invited!',
          message: `${invitation.inviter.firstName} ${invitation.inviter.lastName} has invited you to join the UniElect Voting System as a ${roleLabel}.\n\nClick the link below to complete your registration. This invitation will expire on ${invitation.expiresAt.toLocaleDateString()}.`,
          actionUrl: registrationLink
        }
      });
    } catch (error) {
      logger.error('Failed to send invitation email:', error);
      throw new AppError('Failed to send invitation email', 500);
    }
  }
}

// Export singleton instance
export const adminInvitationService = AdminInvitationService.getInstance();

export default adminInvitationService;
