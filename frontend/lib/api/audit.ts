// lib/api/audit.ts
// Audit API service - ALL endpoints matching backend

import axios, { AxiosResponse } from 'axios';
import {
  AuditLog,
  PaginatedResponse,
  ApiResponse
} from '../types';
import { AuditCategory, AuditSeverity } from '../enums';
import { API_CONFIG, API_ENDPOINTS } from '../constants';

const auditApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

auditApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('jkuat-voting-access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================================
// AUDIT LOG QUERIES
// ============================================================================

// GET /audit/logs - Get audit logs with filters
export async function getAuditLogs(params?: {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  category?: AuditCategory;
  severity?: AuditSeverity;
  userId?: string;
  electionId?: string;
  action?: string;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}): Promise<AxiosResponse<ApiResponse<PaginatedResponse<AuditLog>>>> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.page !== undefined) searchParams.append('page', params.page.toString());
    if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params.startDate) searchParams.append('startDate', params.startDate.toISOString());
    if (params.endDate) searchParams.append('endDate', params.endDate.toISOString());
    if (params.category) searchParams.append('category', params.category);
    if (params.severity) searchParams.append('severity', params.severity);
    if (params.userId) searchParams.append('userId', params.userId);
    if (params.electionId) searchParams.append('electionId', params.electionId);
    if (params.action) searchParams.append('action', params.action);
    if (params.search) searchParams.append('search', params.search);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.order) searchParams.append('order', params.order);
  }

  return auditApi.get(`${API_ENDPOINTS.AUDIT.LOGS}?${searchParams.toString()}`);
}

// GET /audit/logs/:id - Get specific audit log
export async function getAuditLog(logId: string): Promise<AxiosResponse<ApiResponse<AuditLog>>> {
  return auditApi.get(`${API_ENDPOINTS.AUDIT.LOGS}/${logId}`);
}

// POST /audit/logs - Create audit log
export async function createAuditLog(logData: {
  action: string;
  category: AuditCategory;
  severity: AuditSeverity;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<AxiosResponse<ApiResponse<AuditLog>>> {
  return auditApi.post(API_ENDPOINTS.AUDIT.LOGS, logData);
}

// GET /audit/stats - Get audit statistics
export async function getAuditStats(params?: {
  startDate?: Date;
  endDate?: Date;
  category?: AuditCategory;
  severity?: AuditSeverity;
}): Promise<AxiosResponse<ApiResponse<any>>> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.startDate) searchParams.append('startDate', params.startDate.toISOString());
    if (params.endDate) searchParams.append('endDate', params.endDate.toISOString());
    if (params.category) searchParams.append('category', params.category);
    if (params.severity) searchParams.append('severity', params.severity);
  }

  return auditApi.get(`${API_ENDPOINTS.AUDIT.LOGS}/stats?${searchParams.toString()}`);
}

// ============================================================================
// AUDIT SEARCH AND FILTERING
// ============================================================================

// POST /audit/search - Advanced audit log search
export async function searchAuditLogs(searchCriteria: {
  query?: string;
  filters: {
    categories?: AuditCategory[];
    severities?: AuditSeverity[];
    dateRange?: {
      startDate: Date;
      endDate: Date;
    };
    users?: string[];
    elections?: string[];
    actions?: string[];
    ipAddresses?: string[];
  };
  pagination?: {
    page: number;
    limit: number;
  };
  sorting?: {
    field: string;
    order: 'asc' | 'desc';
  };
}): Promise<AxiosResponse<ApiResponse<PaginatedResponse<AuditLog>>>> {
  return auditApi.post(API_ENDPOINTS.AUDIT.SEARCH, searchCriteria);
}

// ============================================================================
// AUDIT ANALYTICS AND SUMMARIES
// ============================================================================

// GET /audit/summary - Get audit summary and statistics
export async function getAuditSummary(params?: {
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'category' | 'severity' | 'user' | 'day' | 'hour';
}): Promise<AxiosResponse<ApiResponse<any>>> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.startDate) searchParams.append('startDate', params.startDate.toISOString());
    if (params.endDate) searchParams.append('endDate', params.endDate.toISOString());
    if (params.groupBy) searchParams.append('groupBy', params.groupBy);
  }

  return auditApi.get(`${API_ENDPOINTS.AUDIT.SUMMARY}?${searchParams.toString()}`);
}

// GET /audit/analytics - Get detailed audit analytics
export async function getAuditAnalytics(params?: {
  period?: 'day' | 'week' | 'month' | 'year';
  metrics?: string[];
  breakdown?: string[];
}): Promise<AxiosResponse<ApiResponse<any>>> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.period) searchParams.append('period', params.period);
    if (params.metrics) searchParams.append('metrics', params.metrics.join(','));
    if (params.breakdown) searchParams.append('breakdown', params.breakdown.join(','));
  }

  return auditApi.get(`/analytics?${searchParams.toString()}`);
}

// ============================================================================
// AUDIT EXPORT
// ============================================================================

// GET /audit/export - Export audit logs
export async function exportAuditLogs(params: {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  filters?: {
    startDate?: Date;
    endDate?: Date;
    categories?: AuditCategory[];
    severities?: AuditSeverity[];
    userIds?: string[];
    electionIds?: string[];
  };
  includeMetadata?: boolean;
  anonymize?: boolean;
}): Promise<AxiosResponse<ApiResponse<any>>> {
  return auditApi.post(API_ENDPOINTS.AUDIT.EXPORT, params);
}

// ============================================================================
// AUDIT REPORTS
// ============================================================================

// GET /audit/reports/security - Get security audit report
export async function getSecurityAuditReport(params?: {
  startDate?: Date;
  endDate?: Date;
  includeDetails?: boolean;
}): Promise<AxiosResponse<ApiResponse<any>>> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.startDate) searchParams.append('startDate', params.startDate.toISOString());
    if (params.endDate) searchParams.append('endDate', params.endDate.toISOString());
    if (params.includeDetails !== undefined) searchParams.append('includeDetails', params.includeDetails.toString());
  }

  return auditApi.get(`/reports/security?${searchParams.toString()}`);
}

// GET /audit/reports/compliance - Get compliance audit report
export async function getComplianceAuditReport(params?: {
  startDate?: Date;
  endDate?: Date;
  standards?: string[];
}): Promise<AxiosResponse<ApiResponse<any>>> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.startDate) searchParams.append('startDate', params.startDate.toISOString());
    if (params.endDate) searchParams.append('endDate', params.endDate.toISOString());
    if (params.standards) searchParams.append('standards', params.standards.join(','));
  }

  return auditApi.get(`/reports/compliance?${searchParams.toString()}`);
}

// GET /audit/reports/user-activity - Get user activity audit report
export async function getUserActivityAuditReport(params?: {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  activityTypes?: string[];
}): Promise<AxiosResponse<ApiResponse<any>>> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.userId) searchParams.append('userId', params.userId);
    if (params.startDate) searchParams.append('startDate', params.startDate.toISOString());
    if (params.endDate) searchParams.append('endDate', params.endDate.toISOString());
    if (params.activityTypes) searchParams.append('activityTypes', params.activityTypes.join(','));
  }

  return auditApi.get(`/reports/user-activity?${searchParams.toString()}`);
}

// ============================================================================
// AUDIT CONFIGURATION
// ============================================================================

// GET /audit/config - Get audit configuration
export async function getAuditConfig(): Promise<AxiosResponse<ApiResponse<any>>> {
  return auditApi.get('/config');
}

// PUT /audit/config - Update audit configuration (Admin only)
export async function updateAuditConfig(config: {
  retentionPeriod?: number;
  logLevels?: AuditSeverity[];
  categories?: AuditCategory[];
  autoArchive?: boolean;
  alertThresholds?: {
    [key: string]: number;
  };
}): Promise<AxiosResponse<ApiResponse<any>>> {
  return auditApi.put('/config', config);
}

// ============================================================================
// AUDIT ALERTS AND MONITORING
// ============================================================================

// GET /audit/alerts - Get audit alerts
export async function getAuditAlerts(params?: {
  severity?: AuditSeverity;
  acknowledged?: boolean;
  limit?: number;
}): Promise<AxiosResponse<ApiResponse<any>>> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.severity) searchParams.append('severity', params.severity);
    if (params.acknowledged !== undefined) searchParams.append('acknowledged', params.acknowledged.toString());
    if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
  }

  return auditApi.get(`/alerts?${searchParams.toString()}`);
}

// POST /audit/alerts/:id/acknowledge - Acknowledge audit alert
export async function acknowledgeAuditAlert(alertId: string): Promise<AxiosResponse<ApiResponse<{ message: string }>>> {
  return auditApi.post(`/alerts/${alertId}/acknowledge`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Format audit log for display
export function formatAuditLog(log: AuditLog): string {
  const timestamp = new Date(log.timestamp).toLocaleString();
  return `[${timestamp}] ${log.category} - ${log.action} (${log.severity})`;
}

// Get severity color for UI
export function getSeverityColor(severity: AuditSeverity): string {
  const colors = {
    LOW: 'text-green-600',
    MEDIUM: 'text-yellow-600',
    HIGH: 'text-orange-600',
    CRITICAL: 'text-red-600'
  };
  return colors[severity] || 'text-gray-600';
}

// Get category icon
export function getCategoryIcon(category: AuditCategory): string {
  const icons: Record<AuditCategory, string> = {
    [AuditCategory.AUTH]: 'lock',
    [AuditCategory.ELECTION]: 'vote',
    [AuditCategory.VOTE]: 'ballot-box',
    [AuditCategory.ADMIN]: 'user',
    [AuditCategory.SECURITY]: 'shield'
  };
  return icons[category] || 'info';
}

// Check if user can view audit logs
export function canViewAuditLogs(userRole: string): boolean {
  return ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(userRole);
}

// Check if user can export audit logs
export function canExportAuditLogs(userRole: string): boolean {
  return ['ADMIN', 'SUPER_ADMIN'].includes(userRole);
}

export default auditApi;