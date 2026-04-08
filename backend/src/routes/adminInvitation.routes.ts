// backend/src/routes/adminInvitation.routes.ts

import { Router } from 'express';
import { body, param } from 'express-validator';
import { AdminInvitationController } from '../controllers/adminInvitation.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { registrationRateLimit, generalRateLimit, adminRateLimit } from '../middleware/rateLimit.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * PUBLIC ROUTES
 */

// Verify invitation token
router.get(
  '/verify/:token',
  generalRateLimit,
  [
    param('token')
      .notEmpty()
      .withMessage('Token is required')
      .isString()
      .isLength({ min: 10 })
      .withMessage('Invalid token format')
  ],
  AdminInvitationController.verifyInvitationToken
);

// Complete invitation registration
router.post(
  '/complete',
  registrationRateLimit,
  [
    body('token')
      .notEmpty()
      .withMessage('Invitation token is required')
      .isString(),
    body('studentId')
      .notEmpty()
      .withMessage('Student ID is required')
      .isString()
      .trim()
      .isLength({ min: 5, max: 30 })
      .withMessage('Student ID must be between 5 and 30 characters'),
    body('firstName')
      .notEmpty()
      .withMessage('First name is required')
      .isString()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .notEmpty()
      .withMessage('Last name is required')
      .isString()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('middleName')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Middle name must not exceed 50 characters'),
    body('phone')
      .optional()
      .isString()
      .trim()
      .matches(/^(\+254|0)[17]\d{8}$/)
      .withMessage('Invalid phone number format'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isString()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    body('confirmPassword')
      .notEmpty()
      .withMessage('Confirm password is required')
      .isString(),
    body('faculty')
      .optional()
      .isString()
      .trim(),
    body('department')
      .optional()
      .isString()
      .trim(),
    body('course')
      .optional()
      .isString()
      .trim(),
    body('yearOfStudy')
      .optional()
      .isInt({ min: 1, max: 6 })
      .withMessage('Year of study must be between 1 and 6'),
    body('admissionYear')
      .optional()
      .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
      .withMessage('Invalid admission year')
  ],
  AdminInvitationController.completeInvitation
);

/**
 * ADMIN ROUTES - Require authentication and authorization
 */

// Get invitation statistics (placed before /:id to avoid route conflict)
router.get(
  '/stats',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  generalRateLimit,
  AdminInvitationController.getInvitationStats
);

// Get all invitations with filters
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  generalRateLimit,
  AdminInvitationController.getAllInvitations
);

// Get invitation by ID
router.get(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  generalRateLimit,
  [
    param('id')
      .notEmpty()
      .withMessage('Invitation ID is required')
      .isString()
      .withMessage('Invalid invitation ID format')
  ],
  AdminInvitationController.getInvitationById
);

/**
 * SUPER_ADMIN ONLY ROUTES
 */

// Create admin invitation
router.post(
  '/',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  adminRateLimit,
  [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('role')
      .notEmpty()
      .withMessage('Role is required')
      .isIn([UserRole.ADMIN, UserRole.MODERATOR])
      .withMessage('Role must be ADMIN or MODERATOR'),
    body('expiresInDays')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Expiration must be between 1 and 30 days')
  ],
  AdminInvitationController.createInvitation
);

// Resend invitation
router.post(
  '/:id/resend',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  adminRateLimit,
  [
    param('id')
      .notEmpty()
      .withMessage('Invitation ID is required')
      .isString()
      .withMessage('Invalid invitation ID format')
  ],
  AdminInvitationController.resendInvitation
);

// Revoke invitation
router.put(
  '/:id/revoke',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  adminRateLimit,
  [
    param('id')
      .notEmpty()
      .withMessage('Invitation ID is required')
      .isString()
      .withMessage('Invalid invitation ID format')
  ],
  AdminInvitationController.revokeInvitation
);

export default router;
