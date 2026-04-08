import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { adminRateLimit } from '../middleware/rateLimit.middleware';
import BackupController from '../controllers/backup.controller';

const router = Router();

/**
 * @route   GET /api/admin/backups
 * @desc    List all backups
 * @access  Super Admin only
 */
router.get(
  '/',
  authenticate,
  authorize('SUPER_ADMIN'),
  adminRateLimit,
  BackupController.listBackups
);

/**
 * @route   GET /api/admin/backups/:id
 * @desc    Get backup details
 * @access  Super Admin only
 */
router.get(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN'),
  adminRateLimit,
  [
    param('id').isString().notEmpty().withMessage('Backup ID is required'),
  ],
  BackupController.getBackup
);

/**
 * @route   POST /api/admin/backups
 * @desc    Create new backup
 * @access  Super Admin only
 */
router.post(
  '/',
  authenticate,
  authorize('SUPER_ADMIN'),
  adminRateLimit,
  [
    body('includePersonalData').optional().isBoolean().withMessage('includePersonalData must be a boolean'),
    body('description').optional().isString().withMessage('description must be a string'),
  ],
  BackupController.createBackup
);

/**
 * @route   POST /api/admin/backups/:id/restore
 * @desc    Restore database from backup
 * @access  Super Admin only
 */
router.post(
  '/:id/restore',
  authenticate,
  authorize('SUPER_ADMIN'),
  adminRateLimit,
  [
    param('id').isString().notEmpty().withMessage('Backup ID is required'),
  ],
  BackupController.restoreBackup
);

/**
 * @route   DELETE /api/admin/backups/:id
 * @desc    Delete backup
 * @access  Super Admin only
 */
router.delete(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN'),
  adminRateLimit,
  [
    param('id').isString().notEmpty().withMessage('Backup ID is required'),
  ],
  BackupController.deleteBackup
);

/**
 * @route   GET /api/admin/backups/:id/download
 * @desc    Download backup file
 * @access  Super Admin only
 */
router.get(
  '/:id/download',
  authenticate,
  authorize('SUPER_ADMIN'),
  adminRateLimit,
  [
    param('id').isString().notEmpty().withMessage('Backup ID is required'),
  ],
  BackupController.downloadBackup
);

export default router;
