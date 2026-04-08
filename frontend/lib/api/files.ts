// lib/api/files.ts
// File management API service - ALL endpoints matching backend

import axios, { AxiosResponse } from 'axios';
import {
  FileUploadRequest,
  FileUploadResult,
  FileInfo,
  ImageProcessingOptions,
  ApiResponse
} from '../types';
import { FileCategory, AccessLevel } from '../enums';
import { API_CONFIG, API_ENDPOINTS, FILE_CONFIGS } from '../constants';

const filesApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 60000, // Longer timeout for file uploads
});

filesApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('jkuat-voting-access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================================
// FILE UPLOAD
// ============================================================================

// POST /files/upload - Upload file
export async function uploadFile(
  file: File,
  category: FileCategory,
  options?: {
    subCategory?: string;
    tags?: string[];
    isPublic?: boolean;
    accessLevel?: AccessLevel;
    metadata?: Record<string, any>;
    processingOptions?: ImageProcessingOptions;
    onProgress?: (progress: number) => void;
  }
): Promise<AxiosResponse<ApiResponse<FileUploadResult>>> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);

  if (options) {
    if (options.subCategory) formData.append('subCategory', options.subCategory);
    if (options.tags) formData.append('tags', JSON.stringify(options.tags));
    if (options.isPublic !== undefined) formData.append('isPublic', options.isPublic.toString());
    if (options.accessLevel) formData.append('accessLevel', options.accessLevel);
    if (options.metadata) formData.append('metadata', JSON.stringify(options.metadata));
    if (options.processingOptions) formData.append('processingOptions', JSON.stringify(options.processingOptions));
  }

  return filesApi.post(API_ENDPOINTS.FILES.UPLOAD, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (options?.onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        options.onProgress(progress);
      }
    },
  });
}

// POST /files/upload/multiple - Upload multiple files
export async function uploadMultipleFiles(
  files: File[],
  category: FileCategory,
  options?: {
    subCategory?: string;
    tags?: string[];
    isPublic?: boolean;
    accessLevel?: AccessLevel;
    onProgress?: (progress: number) => void;
  }
): Promise<AxiosResponse<ApiResponse<FileUploadResult[]>>> {
  const formData = new FormData();

  files.forEach((file, index) => {
    formData.append('files', file);
  });

  formData.append('category', category);

  if (options) {
    if (options.subCategory) formData.append('subCategory', options.subCategory);
    if (options.tags) formData.append('tags', JSON.stringify(options.tags));
    if (options.isPublic !== undefined) formData.append('isPublic', options.isPublic.toString());
    if (options.accessLevel) formData.append('accessLevel', options.accessLevel);
  }

  return filesApi.post(`${API_ENDPOINTS.FILES.UPLOAD}/multiple`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (options?.onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        options.onProgress(progress);
      }
    },
  });
}

// ============================================================================
// FILE RETRIEVAL
// ============================================================================

// GET /files/:id - Get file by ID
export async function getFile(fileId: string): Promise<AxiosResponse<ApiResponse<FileInfo>>> {
  return filesApi.get(API_ENDPOINTS.FILES.BY_ID(fileId));
}

// GET /files/:id/download - Download file
export async function downloadFile(fileId: string): Promise<AxiosResponse<Blob>> {
  return filesApi.get(`${API_ENDPOINTS.FILES.BY_ID(fileId)}/download`, {
    responseType: 'blob',
  });
}

// GET /files/:id/url - Get file URL
export async function getFileUrl(fileId: string): Promise<AxiosResponse<ApiResponse<{ url: string }>>> {
  return filesApi.get(`${API_ENDPOINTS.FILES.BY_ID(fileId)}/url`);
}

// GET /files/category/:category - Get files by category
export async function getFilesByCategory(
  category: FileCategory,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }
): Promise<AxiosResponse<ApiResponse<{ files: FileInfo[]; total: number }>>> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.page !== undefined) searchParams.append('page', params.page.toString());
    if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.order) searchParams.append('order', params.order);
  }

  return filesApi.get(`${API_ENDPOINTS.FILES.BY_CATEGORY(category)}?${searchParams.toString()}`);
}

// GET /files/user/:userId - Get files by user
export async function getFilesByUser(
  userId: string,
  params?: {
    category?: FileCategory;
    page?: number;
    limit?: number;
  }
): Promise<AxiosResponse<ApiResponse<{ files: FileInfo[]; total: number }>>> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.category) searchParams.append('category', params.category);
    if (params.page !== undefined) searchParams.append('page', params.page.toString());
    if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
  }

  return filesApi.get(`${API_ENDPOINTS.FILES.USER_FILES(userId)}?${searchParams.toString()}`);
}

// ============================================================================
// FILE MANAGEMENT
// ============================================================================

// PUT /files/:id - Update file metadata
export async function updateFileMetadata(
  fileId: string,
  updates: {
    tags?: string[];
    metadata?: Record<string, any>;
    isPublic?: boolean;
    accessLevel?: AccessLevel;
  }
): Promise<AxiosResponse<ApiResponse<FileInfo>>> {
  return filesApi.put(API_ENDPOINTS.FILES.BY_ID(fileId), updates);
}

// DELETE /files/:id - Delete file
export async function deleteFile(fileId: string): Promise<AxiosResponse<ApiResponse<{ message: string }>>> {
  return filesApi.delete(API_ENDPOINTS.FILES.BY_ID(fileId));
}

// DELETE /files/bulk - Delete multiple files
export async function deleteMultipleFiles(fileIds: string[]): Promise<AxiosResponse<ApiResponse<{ deleted: number; failed: number }>>> {
  return filesApi.delete('/bulk', { data: { fileIds } });
}

// ============================================================================
// FILE PROCESSING
// ============================================================================

// POST /files/:id/process - Process file (resize, crop, etc.)
export async function processFile(
  fileId: string,
  processingOptions: ImageProcessingOptions
): Promise<AxiosResponse<ApiResponse<FileUploadResult>>> {
  return filesApi.post(`${API_ENDPOINTS.FILES.BY_ID(fileId)}/process`, { processingOptions });
}

// POST /files/:id/thumbnail - Generate thumbnail
export async function generateThumbnail(
  fileId: string,
  size?: { width: number; height: number }
): Promise<AxiosResponse<ApiResponse<{ thumbnailUrl: string }>>> {
  return filesApi.post(`${API_ENDPOINTS.FILES.BY_ID(fileId)}/thumbnail`, { size });
}

// ============================================================================
// FILE SEARCH
// ============================================================================

// POST /files/search - Advanced file search
export async function searchFiles(searchCriteria: {
  query?: string;
  categories?: FileCategory[];
  mimeTypes?: string[];
  tags?: string[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  sizeRange?: {
    minSize: number;
    maxSize: number;
  };
  accessLevel?: AccessLevel;
  isPublic?: boolean;
  pagination?: {
    page: number;
    limit: number;
  };
  sorting?: {
    field: string;
    order: 'asc' | 'desc';
  };
}): Promise<AxiosResponse<ApiResponse<{ files: FileInfo[]; total: number }>>> {
  return filesApi.post('/search', searchCriteria);
}

// ============================================================================
// FILE SHARING
// ============================================================================

// POST /files/:id/share - Create shareable link
export async function createShareableLink(
  fileId: string,
  options: {
    expiresAt?: Date;
    password?: string;
    allowDownload?: boolean;
    maxViews?: number;
  }
): Promise<AxiosResponse<ApiResponse<{ shareUrl: string; shareId: string }>>> {
  return filesApi.post(`${API_ENDPOINTS.FILES.BY_ID(fileId)}/share`, options);
}

// DELETE /files/:id/share/:shareId - Revoke shareable link
export async function revokeShareableLink(
  fileId: string,
  shareId: string
): Promise<AxiosResponse<ApiResponse<{ message: string }>>> {
  return filesApi.delete(`${API_ENDPOINTS.FILES.BY_ID(fileId)}/share/${shareId}`);
}

// ============================================================================
// FILE ANALYTICS
// ============================================================================

// GET /files/:id/analytics - Get file analytics
export async function getFileAnalytics(fileId: string): Promise<AxiosResponse<ApiResponse<any>>> {
  return filesApi.get(`${API_ENDPOINTS.FILES.BY_ID(fileId)}/analytics`);
}

// GET /files/analytics/usage - Get file usage analytics
export async function getFileUsageAnalytics(params?: {
  period?: 'day' | 'week' | 'month';
  category?: FileCategory;
}): Promise<AxiosResponse<ApiResponse<any>>> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.period) searchParams.append('period', params.period);
    if (params.category) searchParams.append('category', params.category);
  }

  return filesApi.get(`/analytics/usage?${searchParams.toString()}`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Validate file before upload
export function validateFile(file: File, category: FileCategory): { valid: boolean; errors: string[] } {
  const config = FILE_CONFIGS[category as keyof typeof FILE_CONFIGS];
  const errors: string[] = [];

  // Check file size
  if (file.size > config.maxSize) {
    errors.push(`File size exceeds maximum limit of ${formatFileSize(config.maxSize)}`);
  }

  // Check file type
  if (!(config.allowedTypes as readonly string[]).includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed for ${category}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Get file extension
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// Check if file is image
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

// Check if file is document
export function isDocumentFile(mimeType: string): boolean {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  return documentTypes.includes(mimeType);
}

// Get file icon based on type
export function getFileIcon(mimeType: string): string {
  if (isImageFile(mimeType)) return 'image';
  if (isDocumentFile(mimeType)) return 'file-text';
  if (mimeType.includes('video')) return 'video';
  if (mimeType.includes('audio')) return 'music';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'archive';
  return 'file';
}

// Create file preview URL
export function createFilePreviewUrl(file: FileInfo): string | null {
  if (isImageFile(file.mimeType)) {
    return file.thumbnailUrl || file.url;
  }
  return null;
}

export default filesApi;