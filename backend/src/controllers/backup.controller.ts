import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import BackupService from '../services/backup.service';
import AuditService from '../services/audit.service';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

class BackupController {
  /**
   * List all backups
   */
  async listBackups(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const backups = await BackupService.listBackups();

      res.json({
        success: true,
        message: 'Backups retrieved successfully',
        data: backups,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get backup details
   */
  async getBackup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { id } = req.params;

      const backup = await BackupService.getBackup(id);

      if (!backup) {
        throw new AppError('Backup not found', 404);
      }

      res.json({
        success: true,
        message: 'Backup retrieved successfully',
        data: backup,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new backup
   */
  async createBackup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const userId = req.user!.id;
      const userRole = req.user!.role;

      if (userRole !== 'SUPER_ADMIN') {
        throw new AppError('Only Super Admins can create backups', 403);
      }

      const { includePersonalData = false, description } = req.body;

      logger.info(`Backup creation initiated by user: ${userId}`);

      // Create backup (this may take some time)
      const backup = await BackupService.createBackup({
        type: 'MANUAL',
        includePersonalData,
        description,
        createdById: userId,
      });

      // Log audit event
      await AuditService.logAction({
        action: 'DATABASE_BACKUP_CREATED',
        category: 'SYSTEM',
        severity: 'HIGH',
        userId,
        metadata: {
          backupId: backup.id,
          includePersonalData,
          fileSize: backup.fileSize,
          status: backup.status,
        },
      });

      res.json({
        success: true,
        message: 'Backup created successfully',
        data: backup,
      });
    } catch (error) {
      logger.error('Backup creation failed:', error);
      next(error);
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      if (userRole !== 'SUPER_ADMIN') {
        throw new AppError('Only Super Admins can restore backups', 403);
      }

      logger.warn(`Database restore initiated by user: ${userId} for backup: ${id}`);

      // Restore backup
      await BackupService.restoreBackup({
        backupId: id,
        userId,
      });

      // Log audit event
      await AuditService.logAction({
        action: 'DATABASE_BACKUP_RESTORED',
        category: 'SYSTEM',
        severity: 'CRITICAL',
        userId,
        metadata: {
          backupId: id,
        },
      });

      res.json({
        success: true,
        message: 'Database restored successfully from backup',
        data: { backupId: id },
      });
    } catch (error) {
      logger.error('Backup restore failed:', error);
      next(error);
    }
  }

  /**
   * Delete backup
   */
  async deleteBackup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      if (userRole !== 'SUPER_ADMIN') {
        throw new AppError('Only Super Admins can delete backups', 403);
      }

      // Delete backup
      await BackupService.deleteBackup(id);

      // Log audit event
      await AuditService.logAction({
        action: 'DATABASE_BACKUP_DELETED',
        category: 'SYSTEM',
        severity: 'MEDIUM',
        userId,
        metadata: {
          backupId: id,
        },
      });

      res.json({
        success: true,
        message: 'Backup deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download backup file
   */
  async downloadBackup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      if (userRole !== 'SUPER_ADMIN') {
        throw new AppError('Only Super Admins can download backups', 403);
      }

      // Get backup file path
      const filePath = await BackupService.getBackupFilePath(id);
      const backup = await BackupService.getBackup(id);

      if (!backup) {
        throw new AppError('Backup not found', 404);
      }

      // Log audit event
      await AuditService.logAction({
        action: 'DATABASE_BACKUP_DOWNLOADED',
        category: 'SYSTEM',
        severity: 'MEDIUM',
        userId,
        metadata: {
          backupId: id,
        },
      });

      // Send file for download
      res.download(filePath, `backup-${backup.name}-${id}.json.gz`, (err) => {
        if (err) {
          logger.error('Backup download failed:', err);
          next(new AppError('Failed to download backup file', 500));
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new BackupController();
