// backend/src/validators/election.validator.ts

import { body, param, query } from 'express-validator';
import { ElectionStatus } from '@prisma/client';

// Create Election Validation
export const validateCreateElection = [
  body('title')
    .optional()
    .customSanitizer(value => value?.trim()),

  body('description')
    .optional()
    .customSanitizer(value => value?.trim()),

  body('positions')
    .optional()
    .isArray({ min: 0 })
    .withMessage('Positions must be an array when provided'),
];

export const validateUpdateElection = [
  param('id')
    .isUUID()
    .withMessage('Invalid election ID'),
  // All other fields are accepted without validation
];

export const validateElectionSearch = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .isIn(Object.values(ElectionStatus))
    .withMessage('Invalid election status'),
];

export default {
  validateCreateElection,
  validateUpdateElection,
  validateElectionSearch,
};