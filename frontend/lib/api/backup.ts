// frontend/lib/api/backup.ts

import axios, { AxiosResponse } from 'axios';
import { API_CONFIG } from '@/lib/constants';

const API_URL = API_CONFIG.BASE_URL;

export interface Backup {
  id: string;
  name: string;
  description: string;
  type: 'MANUAL' | 'SCHEDULED' | 'AUTO';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'RESTORED';
  filePath: string;
  fileSize: number;
  checksum: string;
  compressionRatio: number;
  recordCount: number;
  tables: string[];
  duration: number;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateBackupRequest {
  includePersonalData?: boolean;
  description?: string;
}

export interface RestoreBackupRequest {
  backupId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Get authentication token from storage
 */
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('unielect-voting-access-token');
  }
  return null;
};

/**
 * Create axios instance with auth header
 */
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * List all backups
 */
export const listBackups = async (): Promise<AxiosResponse<ApiResponse<Backup[]>>> => {
  return axios.get(`${API_URL}/admin/backups`, {
    headers: getAuthHeaders(),
  });
};

/**
 * Get backup details by ID
 */
export const getBackup = async (backupId: string): Promise<AxiosResponse<ApiResponse<Backup>>> => {
  return axios.get(`${API_URL}/admin/backups/${backupId}`, {
    headers: getAuthHeaders(),
  });
};

/**
 * Create new backup
 */
export const createBackup = async (
  data: CreateBackupRequest
): Promise<AxiosResponse<ApiResponse<Backup>>> => {
  return axios.post(`${API_URL}/admin/backups`, data, {
    headers: getAuthHeaders(),
  });
};

/**
 * Restore database from backup
 */
export const restoreBackup = async (
  backupId: string
): Promise<AxiosResponse<ApiResponse<{ backupId: string }>>> => {
  return axios.post(
    `${API_URL}/admin/backups/${backupId}/restore`,
    {},
    {
      headers: getAuthHeaders(),
    }
  );
};

/**
 * Delete backup
 */
export const deleteBackup = async (
  backupId: string
): Promise<AxiosResponse<ApiResponse<void>>> => {
  return axios.delete(`${API_URL}/admin/backups/${backupId}`, {
    headers: getAuthHeaders(),
  });
};

/**
 * Download backup file
 */
export const downloadBackup = async (backupId: string): Promise<void> => {
  const token = getAuthToken();

  // Create a temporary link to download the file
  const link = document.createElement('a');
  link.href = `${API_URL}/admin/backups/${backupId}/download?token=${token}`;
  link.download = `backup-${backupId}.json.gz`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Format file size to human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format duration to human-readable format
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
};

/**
 * Get status color for backup status
 */
export const getStatusColor = (status: Backup['status']): string => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800';
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    case 'RESTORED':
      return 'bg-sage-100 text-sage-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get status icon for backup status
 */
export const getStatusIcon = (status: Backup['status']): string => {
  switch (status) {
    case 'COMPLETED':
      return '✓';
    case 'IN_PROGRESS':
      return '⟳';
    case 'FAILED':
      return '✗';
    case 'RESTORED':
      return '↻';
    default:
      return '○';
  }
};
