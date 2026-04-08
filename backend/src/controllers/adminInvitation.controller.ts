// backend/src/controllers/adminInvitation.controller.ts

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { validationResult } from 'express-validator';
import { adminInvitationService } from '../services/adminInvitation.service';
import { DeviceInfo } from '../types/auth.types';

interface AuthRequest extends Request {
  user?: {
    id: string;
    studentId: string;
    role: UserRole;
    permissions: string[];
  };
}

export class AdminInvitationController {
  /**
   * SUPER_ADMIN: Create admin invitation
   * POST /api/admin-invitations
   */
  static async createInvitation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { email, role, expiresInDays } = req.body;
      const invitedBy = req.user!.id;

      const invitation = await adminInvitationService.createInvitation({
        email,
        role,
        invitedBy,
        expiresInDays
      });

      res.status(201).json({
        success: true,
        message: 'Invitation created successfully. Email sent to recipient.',
        data: invitation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUBLIC: Verify invitation token
   * GET /api/admin-invitations/verify/:token
   */
  static async verifyInvitationToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;

      const result = await adminInvitationService.verifyInvitationToken(token);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUBLIC: Complete invitation registration
   * POST /api/admin-invitations/complete
   */
  static async completeInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const deviceInfo: DeviceInfo = {
        userAgent: req.get('user-agent') || '',
        ipAddress: req.ip || req.connection.remoteAddress || '',
        platform: req.get('sec-ch-ua-platform') || undefined,
        browser: req.get('sec-ch-ua') || undefined
      };

      const result = await adminInvitationService.completeInvitation(req.body, deviceInfo);

      res.status(201).json({
        success: true,
        message: 'Registration completed successfully. Welcome to UniElect!',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN: Get all invitations with filters
   * GET /api/admin-invitations
   */
  static async getAllInvitations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminInvitationService.getAllInvitations(req.query);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN: Get invitation by ID
   * GET /api/admin-invitations/:id
   */
  static async getInvitationById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const invitation = await adminInvitationService.getInvitationById(id);

      res.json({
        success: true,
        data: invitation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN: Resend invitation
   * POST /api/admin-invitations/:id/resend
   */
  static async resendInvitation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const invitation = await adminInvitationService.resendInvitation(id);

      res.json({
        success: true,
        message: 'Invitation resent successfully.',
        data: invitation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN: Revoke invitation
   * PUT /api/admin-invitations/:id/revoke
   */
  static async revokeInvitation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const revokedBy = req.user!.id;

      const invitation = await adminInvitationService.revokeInvitation(id, revokedBy);

      res.json({
        success: true,
        message: 'Invitation revoked successfully.',
        data: invitation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN: Get invitation statistics
   * GET /api/admin-invitations/stats
   */
  static async getInvitationStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminInvitationService.getInvitationStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}
