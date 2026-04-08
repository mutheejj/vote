// backend/src/routes/candidatePreRegistration.routes.ts

import { Router } from 'express';
import { body, param } from 'express-validator';
import { CandidatePreRegistrationController } from '../controllers/candidatePreRegistration.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { registrationRateLimit, generalRateLimit } from '../middleware/rateLimit.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * PUBLIC ROUTES
 */

// Get open elections for candidate registration
router.get(
  '/open-elections',
  generalRateLimit,
  CandidatePreRegistrationController.getOpenElections
);

// Submit candidate application
router.post(
  '/',
  registrationRateLimit,
  [
    body('studentId')
      .notEmpty()
      .withMessage('Student ID is required')
      .isString()
      .trim()
      .isLength({ min: 5, max: 30 })
      .withMessage('Student ID must be between 5 and 30 characters'),
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
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
    body('faculty')
      .notEmpty()
      .withMessage('Faculty is required')
      .isString()
      .trim(),
    body('department')
      .notEmpty()
      .withMessage('Department is required')
      .isString()
      .trim(),
    body('course')
      .notEmpty()
      .withMessage('Course is required')
      .isString()
      .trim(),
    body('yearOfStudy')
      .notEmpty()
      .withMessage('Year of study is required')
      .isInt({ min: 1, max: 6 })
      .withMessage('Year of study must be between 1 and 6'),
    body('intendedPosition')
      .notEmpty()
      .withMessage('Intended position is required')
      .isString()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Intended position must be between 3 and 100 characters'),
    body('electionId')
      .notEmpty()
      .withMessage('Election is required')
      .isString()
      .trim()
      .withMessage('Valid election ID is required'),
    body('positionId')
      .notEmpty()
      .withMessage('Position is required')
      .isString()
      .trim()
      .withMessage('Valid position ID is required'),
    body('reason')
      .notEmpty()
      .withMessage('Reason for candidacy is required')
      .isString()
      .trim()
      .isLength({ min: 100, max: 2000 })
      .withMessage('Reason must be between 100 and 2000 characters')
  ],
  CandidatePreRegistrationController.submitApplication
);

// Verify approval token
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
  CandidatePreRegistrationController.verifyApprovalToken
);

// Complete registration with approved token
router.post(
  '/complete',
  registrationRateLimit,
  [
    body('token')
      .notEmpty()
      .withMessage('Approval token is required')
      .isString(),
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
    body('admissionYear')
      .optional()
      .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
      .withMessage('Invalid admission year')
  ],
  CandidatePreRegistrationController.completeRegistration
);

/**
 * ADMIN ROUTES - Require authentication and authorization
 */

// Get application statistics (placed before /:id to avoid route conflict)
router.get(
  '/stats',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  generalRateLimit,
  CandidatePreRegistrationController.getApplicationStats
);

// Get all applications with filters
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  generalRateLimit,
  CandidatePreRegistrationController.getAllApplications
);

// Get application by ID
router.get(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  generalRateLimit,
  [
    param('id')
      .notEmpty()
      .withMessage('Application ID is required')
      .isUUID()
      .withMessage('Invalid application ID format')
  ],
  CandidatePreRegistrationController.getApplicationById
);

// Approve application
router.put(
  '/:id/approve',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  generalRateLimit,
  [
    param('id')
      .notEmpty()
      .withMessage('Application ID is required')
      .isUUID()
      .withMessage('Invalid application ID format'),
    body('reviewNotes')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Review notes must not exceed 1000 characters')
  ],
  CandidatePreRegistrationController.approveApplication
);

// Reject application
router.put(
  '/:id/reject',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  generalRateLimit,
  [
    param('id')
      .notEmpty()
      .withMessage('Application ID is required')
      .isUUID()
      .withMessage('Invalid application ID format'),
    body('rejectionReason')
      .notEmpty()
      .withMessage('Rejection reason is required')
      .isString()
      .trim()
      .isLength({ min: 20, max: 1000 })
      .withMessage('Rejection reason must be between 20 and 1000 characters')
  ],
  CandidatePreRegistrationController.rejectApplication
);

export default router;
