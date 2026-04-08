import { PrismaClient, BackupType, BackupStatus, Backup } from '@prisma/client';
import { createWriteStream, createReadStream, promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// All table names in the database (for backup/restore)
const DATABASE_TABLES = [
  'User', 'Election', 'Position', 'Candidate', 'Vote', 'VotingSession',
  'VoterEligibility', 'Result', 'Campaign', 'Notification', 'AuditLog',
  'RefreshToken', 'VerificationToken', 'AdminInvitation', 'CandidatePreRegistration',
  'SecurityEvent', 'File', 'SocialMedia', 'Analytics',
  'CryptoKey', 'SecurityHash', 'WebSocketConnection', 'UserPreferences',
  'Task', 'IssueReport', 'GeneratedReport', 'ReportTemplate',
  'DashboardWidget', 'UserAchievement', 'Achievement'
];

interface BackupOptions {
  type?: BackupType;
  includePersonalData?: boolean;
  description?: string;
  createdById: string;
}

interface RestoreOptions {
  backupId: string;
  userId: string;
}

class BackupService {
  private backupDir: string;

  constructor() {
    // Configure backup directory from env or default
    this.backupDir = process.env.BACKUP_PATH || path.join(__dirname, '../../backups');
    this.ensureBackupDirectory();
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      logger.info(`Backup directory ensured at: ${this.backupDir}`);
    } catch (error) {
      logger.error('Failed to create backup directory:', error);
      throw new AppError('Failed to initialize backup directory', 500);
    }
  }

  /**
   * Create a database backup (Neon-compatible using Prisma)
   */
  public async createBackup(options: BackupOptions): Promise<Backup> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const compressedFilename = `${filename}.gz`;
    const filePath = path.join(this.backupDir, compressedFilename);

    // Create backup record
    const backup = await prisma.backup.create({
      data: {
        name: `Backup ${new Date().toLocaleDateString()}`,
        description: options.description || 'Database backup',
        type: options.type || BackupType.MANUAL,
        status: BackupStatus.IN_PROGRESS,
        filePath,
        createdById: options.createdById,
        startedAt: new Date(),
        tables: [],
      },
    });

    try {
      // Step 1: Perform database dump using Prisma
      logger.info(`Starting Neon database backup for backup ID: ${backup.id}`);
      const exportedTables = await this.performDatabaseDump(filename, options.includePersonalData || false);

      // Step 2: Compress the backup
      logger.info(`Compressing backup file: ${filename}`);
      await this.compressFile(filename, compressedFilename);

      // Step 3: Calculate checksum
      logger.info(`Calculating checksum for backup: ${compressedFilename}`);
      const checksum = await this.calculateChecksum(filePath);

      // Step 4: Get file stats
      const stats = await fs.stat(filePath);
      const originalPath = path.join(this.backupDir, filename);
      const originalSize = (await fs.stat(originalPath)).size;
      const compressedSize = stats.size;
      const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);

      // Step 5: Delete uncompressed file
      await fs.unlink(originalPath);

      // Step 6: Count total records
      const recordCount = exportedTables.reduce((sum, table) => sum + table.count, 0);

      // Step 7: Update backup record
      const duration = Math.round((Date.now() - startTime) / 1000);
      const updatedBackup = await prisma.backup.update({
        where: { id: backup.id },
        data: {
          status: BackupStatus.COMPLETED,
          fileSize: compressedSize,
          checksum,
          compressionRatio: parseFloat(compressionRatio),
          completedAt: new Date(),
          duration,
          recordCount,
          tables: exportedTables.map(t => t.name),
        },
      });

      logger.info(`Backup completed successfully: ${backup.id} (${recordCount} records, ${exportedTables.length} tables)`);
      return updatedBackup;
    } catch (error) {
      // Update backup status to failed
      await prisma.backup.update({
        where: { id: backup.id },
        data: {
          status: BackupStatus.FAILED,
          completedAt: new Date(),
          duration: Math.round((Date.now() - startTime) / 1000),
        },
      });

      logger.error(`Backup failed for ID ${backup.id}:`, error);
      throw new AppError('Database backup failed', 500);
    }
  }

  /**
   * Perform database dump using Prisma (Neon-compatible)
   */
  private async performDatabaseDump(filename: string, includePersonalData: boolean): Promise<Array<{name: string, count: number}>> {
    const outputPath = path.join(this.backupDir, filename);
    const backupData: any = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      database: 'neon-serverless-postgresql',
      tables: {},
    };

    const exportedTables: Array<{name: string, count: number}> = [];

    try {
      logger.info('Starting Prisma-based database dump for Neon...');

      // Tables to exclude if personal data should not be included
      const excludedTables = includePersonalData ? [] : ['VerificationToken', 'RefreshToken', 'AuditLog'];

      // Export each table
      for (const tableName of DATABASE_TABLES) {
        if (excludedTables.includes(tableName)) {
          logger.info(`Skipping table ${tableName} (personal data excluded)`);
          continue;
        }

        try {
          // Convert table name to Prisma model name (camelCase)
          const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);

          // Use Prisma to export all records
          const records = await (prisma as any)[modelName]?.findMany();

          if (records) {
            backupData.tables[tableName] = {
              count: records.length,
              data: records,
            };

            exportedTables.push({ name: tableName, count: records.length });
            logger.info(`Exported ${records.length} records from ${tableName}`);
          }
        } catch (error: any) {
          // Some tables might not exist or have different model names
          logger.warn(`Failed to export table ${tableName}: ${error.message}`);
        }
      }

      // Write backup data to JSON file
      const jsonContent = JSON.stringify(backupData, null, 2);
      await fs.writeFile(outputPath, jsonContent, 'utf8');

      logger.info(`Database dump completed: ${filename} (${exportedTables.length} tables exported)`);
      return exportedTables;
    } catch (error) {
      logger.error('Database dump failed:', error);
      throw error;
    }
  }

  /**
   * Compress file using gzip
   */
  private compressFile(inputFilename: string, outputFilename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const inputPath = path.join(this.backupDir, inputFilename);
      const outputPath = path.join(this.backupDir, outputFilename);

      const input = createReadStream(inputPath);
      const output = createWriteStream(outputPath);
      const gzip = zlib.createGzip({ level: 9 }); // Maximum compression

      input
        .pipe(gzip)
        .pipe(output)
        .on('finish', () => {
          logger.info(`File compressed: ${outputFilename}`);
          resolve();
        })
        .on('error', (error) => {
          logger.error('Compression failed:', error);
          reject(error);
        });
    });
  }

  /**
   * Calculate SHA256 checksum of file
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * List all backups
   */
  public async listBackups(): Promise<Backup[]> {
    return await prisma.backup.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get backup by ID
   */
  public async getBackup(backupId: string): Promise<Backup | null> {
    return await prisma.backup.findUnique({
      where: { id: backupId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Delete backup
   */
  public async deleteBackup(backupId: string): Promise<void> {
    const backup = await this.getBackup(backupId);

    if (!backup) {
      throw new AppError('Backup not found', 404);
    }

    // Delete file from filesystem
    if (backup.filePath) {
      try {
        await fs.unlink(backup.filePath);
        logger.info(`Backup file deleted: ${backup.filePath}`);
      } catch (error) {
        logger.warn(`Failed to delete backup file: ${backup.filePath}`, error);
      }
    }

    // Delete database record
    await prisma.backup.delete({
      where: { id: backupId },
    });

    logger.info(`Backup deleted: ${backupId}`);
  }

  /**
   * Restore database from backup (Neon-compatible)
   */
  public async restoreBackup(options: RestoreOptions): Promise<void> {
    const backup = await this.getBackup(options.backupId);

    if (!backup) {
      throw new AppError('Backup not found', 404);
    }

    if (backup.status !== BackupStatus.COMPLETED) {
      throw new AppError('Cannot restore from incomplete backup', 400);
    }

    if (!backup.filePath) {
      throw new AppError('Backup file path not found', 400);
    }

    // Verify backup file exists
    try {
      await fs.access(backup.filePath);
    } catch (error) {
      throw new AppError('Backup file not found on filesystem', 404);
    }

    logger.info(`Starting database restore from backup: ${backup.id}`);

    try {
      // Step 1: Decompress backup file
      const decompressedFile = backup.filePath.replace('.gz', '');
      await this.decompressFile(backup.filePath, decompressedFile);

      // Step 2: Verify checksum
      const compressedChecksum = await this.calculateChecksum(backup.filePath);
      if (compressedChecksum !== backup.checksum) {
        throw new Error('Backup file checksum mismatch. File may be corrupted.');
      }

      // Step 3: Restore database
      await this.performDatabaseRestore(decompressedFile);

      // Step 4: Update backup status
      await prisma.backup.update({
        where: { id: backup.id },
        data: {
          status: BackupStatus.RESTORED,
        },
      });

      // Step 5: Clean up decompressed file
      await fs.unlink(decompressedFile);

      logger.info(`Database restore completed from backup: ${backup.id}`);
    } catch (error) {
      logger.error(`Database restore failed for backup ${backup.id}:`, error);
      throw new AppError('Database restore failed', 500);
    }
  }

  /**
   * Decompress gzip file
   */
  private decompressFile(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const input = createReadStream(inputPath);
      const output = createWriteStream(outputPath);
      const gunzip = zlib.createGunzip();

      input
        .pipe(gunzip)
        .pipe(output)
        .on('finish', () => {
          logger.info(`File decompressed: ${outputPath}`);
          resolve();
        })
        .on('error', (error) => {
          logger.error('Decompression failed:', error);
          reject(error);
        });
    });
  }

  /**
   * Perform database restore using Prisma (Neon-compatible)
   */
  private async performDatabaseRestore(filename: string): Promise<void> {
    try {
      logger.info(`Starting database restore from: ${filename}`);

      // Read backup file
      const backupContent = await fs.readFile(filename, 'utf8');
      const backupData = JSON.parse(backupContent);

      if (!backupData.version || !backupData.tables) {
        throw new Error('Invalid backup file format');
      }

      logger.info(`Restoring backup version ${backupData.version} from ${backupData.timestamp}`);

      // Restore tables in order (handle dependencies manually)
      const tableNames = Object.keys(backupData.tables);
      let totalRestored = 0;

      // First pass: Delete all existing data (in reverse order to avoid FK constraints)
      for (const tableName of tableNames.reverse()) {
        try {
          const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
          await (prisma as any)[modelName]?.deleteMany({});
          logger.info(`Cleared existing data from ${tableName}`);
        } catch (error: any) {
          logger.warn(`Failed to clear table ${tableName}: ${error.message}`);
        }
      }

      // Second pass: Insert backup data (in original order)
      for (const tableName of tableNames.reverse()) {
        const tableData = backupData.tables[tableName];

        if (!tableData.data || tableData.data.length === 0) {
          logger.info(`Skipping empty table: ${tableName}`);
          continue;
        }

        try {
          const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);

          // Insert backup data in batches to avoid memory issues
          const batchSize = 100;
          for (let i = 0; i < tableData.data.length; i += batchSize) {
            const batch = tableData.data.slice(i, i + batchSize);

            await (prisma as any)[modelName]?.createMany({
              data: batch,
              skipDuplicates: true,
            });
          }

          totalRestored += tableData.data.length;
          logger.info(`Restored ${tableData.data.length} records to ${tableName}`);
        } catch (error: any) {
          logger.error(`Failed to restore table ${tableName}: ${error.message}`);
          // Continue with other tables even if one fails
        }
      }

      logger.info(`Database restore completed: ${totalRestored} total records restored`);
    } catch (error) {
      logger.error('Database restore failed:', error);
      throw error;
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  public async cleanupOldBackups(retentionDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldBackups = await prisma.backup.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        type: {
          not: BackupType.MANUAL, // Don't auto-delete manual backups
        },
      },
    });

    let deletedCount = 0;

    for (const backup of oldBackups) {
      try {
        await this.deleteBackup(backup.id);
        deletedCount++;
      } catch (error) {
        logger.error(`Failed to delete old backup ${backup.id}:`, error);
      }
    }

    logger.info(`Cleaned up ${deletedCount} old backups`);
    return deletedCount;
  }

  /**
   * Download backup file
   */
  public async getBackupFilePath(backupId: string): Promise<string> {
    const backup = await this.getBackup(backupId);

    if (!backup) {
      throw new AppError('Backup not found', 404);
    }

    if (!backup.filePath) {
      throw new AppError('Backup file path not found', 400);
    }

    // Verify file exists
    try {
      await fs.access(backup.filePath);
    } catch (error) {
      throw new AppError('Backup file not found on filesystem', 404);
    }

    return backup.filePath;
  }
}

export default new BackupService();
