// backend/src/controllers/candidatePreRegistration.controller.ts

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { validationResult } from 'express-validator';
import { candidatePreRegistrationService } from '../services/candidatePreRegistration.service';
import { DeviceInfo } from '../types/auth.types';

interface AuthRequest extends Request {
  user?: {
    id: string;
    studentId: string;
    role: UserRole;
    permissions: string[];
  };
}

export class CandidatePreRegistrationController {
  /**
   * PUBLIC: Get open elections for candidate registration
   * GET /api/candidate-applications/open-elections
   */
  static async getOpenElections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const elections = await candidatePreRegistrationService.getOpenElections();

      res.json({
        success: true,
        data: elections
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUBLIC: Submit candidate application
   * POST /api/candidate-applications
   */
  static async submitApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await candidatePreRegistrationService.submitApplication(req.body);

      res.status(201).json({
        success: true,
        message: 'Application submitted successfully. You will receive an email once it has been reviewed.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUBLIC: Verify approval token
   * GET /api/candidate-applications/verify/:token
   */
  static async verifyApprovalToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;

      const result = await candidatePreRegistrationService.verifyApprovalToken(token);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUBLIC: Complete registration with approved token
   * POST /api/candidate-applications/complete
   */
  static async completeRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await candidatePreRegistrationService.completeRegistration(req.body, deviceInfo);

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
   * ADMIN: Get all applications with filters
   * GET /api/candidate-applications
   */
  static async getAllApplications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await candidatePreRegistrationService.getAllApplications(req.query);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN: Get application by ID
   * GET /api/candidate-applications/:id
   */
  static async getApplicationById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const application = await candidatePreRegistrationService.getApplicationById(id);

      res.json({
        success: true,
        data: application
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN: Approve application
   * PUT /api/candidate-applications/:id/approve
   */
  static async approveApplication(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reviewNotes } = req.body;
      const adminId = req.user!.id;

      const application = await candidatePreRegistrationService.approveApplication(
        id,
        adminId,
        reviewNotes
      );

      res.json({
        success: true,
        message: 'Application approved successfully. Registration link sent to applicant.',
        data: application
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN: Reject application
   * PUT /api/candidate-applications/:id/reject
   */
  static async rejectApplication(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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

      const { id } = req.params;
      const { rejectionReason } = req.body;
      const adminId = req.user!.id;

      const application = await candidatePreRegistrationService.rejectApplication(
        id,
        adminId,
        rejectionReason
      );

      res.json({
        success: true,
        message: 'Application rejected successfully.',
        data: application
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN: Get application statistics
   * GET /api/candidate-applications/stats
   */
  static async getApplicationStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await candidatePreRegistrationService.getApplicationStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}
