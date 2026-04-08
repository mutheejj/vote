// lib/api/reports.ts
// Reports API service - ALL endpoints matching backend

import axios, { AxiosResponse } from 'axios';
import {
  ApiResponse
} from '../types';
import { ElectionType, UserRole } from '../enums';
import { API_CONFIG, API_ENDPOINTS } from '../constants';

const reportsApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 60000, // Longer timeout for report generation
});

reportsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('jkuat-voting-access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================================
// ELECTION REPORTS
// ============================================================================

// GET /reports/election/:electionId - Get comprehensive election report
export async function getElectionReport(
  electionId: string,
  options?: {
    includeVotingDetails?: boolean;
    includeCandidateAnalytics?: boolean;
    includeVoterTurnout?: boolean;
    includeResults?: boolean;
    format?: 'json' | 'pdf' | 'excel';
  }
): Promise<AxiosResponse<ApiResponse<any>>> {
  const params = new URLSearchParams();

  if (options) {
    if (options.includeVotingDetails !== undefined) {
      params.append('includeVotingDetails', options.includeVotingDetails.toString());
    }
    if (options.includeCandidateAnalytics !== undefined) {
      params.append('includeCandidateAnalytics', options.includeCandidateAnalytics.toString());
    }
    if (options.includeVoterTurnout !== undefined) {
      params.append('includeVoterTurnout', options.includeVoterTurnout.toString());
    }
    if (options.includeResults !== undefined) {
      params.append('includeResults', options.includeResults.toString());
    }
    if (options.format) {
      params.append('format', options.format);
    }
  }

  return reportsApi.get(`${API_ENDPOINTS.REPORTS.ELECTION(electionId)}?${params.toString()}`);
}

// GET /reports/election/:electionId/summary - Get election summary report
export async function getElectionSummaryReport(electionId: string): Promise<AxiosResponse<ApiResponse<any>>> {
  return reportsApi.get(`${API_ENDPOINTS.REPORTS.ELECTION(electionId)}/summary`);
}

// GET /reports/election/:electionId/turnout - Get voter turnout report
export async function getVoterTurnoutReport(
  electionId: string,
  breakdown?: 'faculty' | 'department' | 'year' | 'course'
): Promise<AxiosResponse<ApiResponse<any>>> {
  const params = new URLSearchParams();
  if (breakdown) params.append('breakdown', breakdown);

  return reportsApi.get(`${API_ENDPOINTS.REPORTS.ELECTION(electionId)}/turnout?${params.toString()}`);
}

// GET /reports/election/:electionId/candidates - Get candidate performance report
export async function getCandidatePerformanceReport(electionId: string): Promise<AxiosResponse<ApiResponse<any>>> {
  return reportsApi.get(`${API_ENDPOINTS.REPORTS.ELECTION(electionId)}/candidates`);
}

// GET /reports/election/:electionId/timeline - Get election timeline report
export async function getElectionTimelineReport(electionId: string): Promise<AxiosResponse<ApiResponse<any>>> {
  return reportsApi.get(`${API_ENDPOINTS.REPORTS.ELECTION(electionId)}/timeline`);
}

// ============================================================================
// SYSTEM REPORTS
// ============================================================================

// GET /reports/system - Get comprehensive system report
export async function getSystemReport(options?: {
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  includePerformance?: boolean;
  includeSecurity?: boolean;
  includeUsage?: boolean;
  format?: 'json' | 'pdf' | 'excel';
}): Promise<AxiosResponse<ApiResponse<any>>> {
  const params = new URLSearchParams();

  if (options) {
    if (options.period) params.append('period', options.period);
    if (options.includePerformance !== undefined) {
      params.append('includePerformance', options.includePerformance.toString());
    }
    if (options.includeSecurity !== undefined) {
      params.append('includeSecurity', options.includeSecurity.toString());
    }
    if (options.includeUsage !== undefined) {
      params.append('includeUsage', options.includeUsage.toString());
    }
    if (options.format) params.append('format', options.format);
  }

  return reportsApi.get(`${API_ENDPOINTS.REPORTS.SYSTEM}?${params.toString()}`);
}

// GET /reports/system/health - Get system health report
export async function getSystemHealthReport(): Promise<AxiosResponse<ApiResponse<any>>> {
  return reportsApi.get(`${API_ENDPOINTS.REPORTS.SYSTEM}/health`);
}

// GET /reports/system/performance - Get system performance report
export async function getSystemPerformanceReport(
  period?: 'hour' | 'day' | 'week' | 'month'
): Promise<AxiosResponse<ApiResponse<any>>> {
  const params = new URLSearchParams();
  if (period) params.append('period', period);

  return reportsApi.get(`${API_ENDPOINTS.REPORTS.SYSTEM}/performance?${params.toString()}`);
}

// GET /reports/system/usage - Get system usage report
export async function getSystemUsageReport(options?: {
  startDate?: Date;
  endDate?: Date;
  breakdown?: 'user' | 'feature' | 'time';
}): Promise<AxiosResponse<ApiResponse<any>>> {
  const params = new URLSearchParams();

  if (options) {
    if (options.startDate) params.append('startDate', options.startDate.toISOString());
    if (options.endDate) params.append('endDate', options.endDate.toISOString());
    if (options.breakdown) params.append('breakdown', options.breakdown);
  }

  return reportsApi.get(`${API_ENDPOINTS.REPORTS.SYSTEM}/usage?${params.toString()}`);
}

// ============================================================================
// USER ACTIVITY REPORTS
// ============================================================================

// GET /reports/user-activity - Get user activity report
export async function getUserActivityReport(options?: {
  userId?: string;
  role?: UserRole;
  startDate?: Date;
  endDate?: Date;
  activityType?: string;
  format?: 'json' | 'pdf' | 'excel';
}): Promise<AxiosResponse<ApiResponse<any>>> {
  const params = new URLSearchParams();

  if (options) {
    if (options.userId) params.append('userId', options.userId);
    if (options.role) params.append('role', options.role);
    if (options.startDate) params.append('startDate', options.startDate.toISOString());
    if (options.endDate) params.append('endDate', options.endDate.toISOString());
    if (options.activityType) params.append('activityType', options.activityType);
    if (options.format) params.append('format', options.format);
  }

  return reportsApi.get(`${API_ENDPOINTS.REPORTS.USER_ACTIVITY}?${params.toString()}`);
}

// GET /reports/user-activity/summary - Get user activity summary
export async function getUserActivitySummary(options?: {
  period?: 'day' | 'week' | 'month';
  groupBy?: 'role' | 'faculty' | 'department';
}): Promise<AxiosResponse<ApiResponse<any>>> {
  const params = new URLSearchParams();

  if (options) {
    if (options.period) params.append('period', options.period);
    if (options.groupBy) params.append('groupBy', options.groupBy);
  }

  return reportsApi.get(`${API_ENDPOINTS.REPORTS.USER_ACTIVITY}/summary?${params.toString()}`);
}

// ============================================================================
// VOTING ANALYTICS REPORTS
// ============================================================================

// GET /reports/voting-analytics - Get comprehensive voting analytics
export async function getVotingAnalyticsReport(options?: {
  electionId?: string;
  electionType?: ElectionType;
  startDate?: Date;
  endDate?: Date;
  includeRealTimeData?: boolean;
  format?: 'json' | 'pdf' | 'excel';
}): Promise<AxiosResponse<ApiResponse<any>>> {
  const params = new URLSearchParams();

  if (options) {
    if (options.electionId) params.append('electionId', options.electionId);
    if (options.electionType) params.append('electionType', options.electionType);
    if (options.startDate) params.append('startDate', options.startDate.toISOString());
    if (options.endDate) params.append('endDate', options.endDate.toISOString());
    if (options.includeRealTimeData !== undefined) {
      params.append('includeRealTimeData', options.includeRealTimeData.toString());
    }
    if (options.format) params.append('format', options.format);
  }

  return reportsApi.get(`${API_ENDPOINTS.REPORTS.VOTING_ANALYTICS}?${params.toString()}`);
}

// GET /reports/voting-analytics/trends - Get voting trends report
export async function getVotingTrendsReport(options?: {
  period?: 'hour' | 'day' | 'week' | 'month';
  comparison?: boolean;
}): Promise<AxiosResponse<ApiResponse<any>>> {
  const params = new URLSearchParams();

  if (options) {
    if (options.period) params.append('period', options.period);
    if (options.comparison !== undefined) params.append('comparison', options.comparison.toString());
  }

  return reportsApi.get(`${API_ENDPOINTS.REPORTS.VOTING_ANALYTICS}/trends?${params.toString()}`);
}

// ============================================================================
// SECURITY REPORTS
// ============================================================================

// GET /reports/security - Get security report
export async function getSecurityReport(options?: {
  startDate?: Date;
  endDate?: Date;
  includeIncidents?: boolean;
  includeAuditLogs?: boolean;
  severityFilter?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}): Promise<AxiosResponse<ApiResponse<any>>> {
  const params = new URLSearchParams();

  if (options) {
    if (options.startDate) params.append('startDate', options.startDate.toISOString());
    if (options.endDate) params.append('endDate', options.endDate.toISOString());
    if (options.includeIncidents !== undefined) {
      params.append('includeIncidents', options.includeIncidents.toString());
    }
    if (options.includeAuditLogs !== undefined) {
      params.append('includeAuditLogs', options.includeAuditLogs.toString());
    }
    if (options.severityFilter) params.append('severityFilter', options.severityFilter);
  }

  return reportsApi.get(`/security?${params.toString()}`);
}

// GET /reports/security/incidents - Get security incidents report
export async function getSecurityIncidentsReport(options?: {
  startDate?: Date;
  endDate?: Date;
  status?: 'open' | 'investigating' | 'resolved';
}): Promise<AxiosResponse<ApiResponse<any>>> {
  const params = new URLSearchParams();

  if (options) {
    if (options.startDate) params.append('startDate', options.startDate.toISOString());
    if (options.endDate) params.append('endDate', options.endDate.toISOString());
    if (options.status) params.append('status', options.status);
  }

  return reportsApi.get(`/security/incidents?${params.toString()}`);
}

// ============================================================================
// CUSTOM REPORTS
// ============================================================================

// POST /reports/custom - Generate custom report
export async function generateCustomReport(reportConfig: {
  name: string;
  description?: string;
  dataSource: string;
  filters: Record<string, any>;
  metrics: string[];
  groupBy?: string[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  format?: 'json' | 'pdf' | 'excel' | 'csv';
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string[];
  };
}): Promise<AxiosResponse<ApiResponse<any>>> {
  return reportsApi.post('/custom', reportConfig);
}

// GET /reports/custom - Get list of custom reports
export async function getCustomReports(): Promise<AxiosResponse<ApiResponse<any>>> {
  return reportsApi.get('/custom');
}

// GET /reports/custom/:reportId - Get custom report by ID
export async function getCustomReport(reportId: string): Promise<AxiosResponse<ApiResponse<any>>> {
  return reportsApi.get(`/custom/${reportId}`);
}

// DELETE /reports/custom/:reportId - Delete custom report
export async function deleteCustomReport(reportId: string): Promise<AxiosResponse<ApiResponse<{ message: string }>>> {
  return reportsApi.delete(`/custom/${reportId}`);
}

// ============================================================================
// REPORT EXPORT AND SCHEDULING
// ============================================================================

// POST /reports/export - Export report
export async function exportReport(exportConfig: {
  reportType: string;
  reportId?: string;
  format: 'pdf' | 'excel' | 'csv';
  options?: Record<string, any>;
}): Promise<AxiosResponse<ApiResponse<any>>> {
  return reportsApi.post(API_ENDPOINTS.REPORTS.EXPORT, exportConfig);
}

// GET /reports/scheduled - Get scheduled reports
export async function getScheduledReports(): Promise<AxiosResponse<ApiResponse<any>>> {
  return reportsApi.get('/scheduled');
}

// POST /reports/schedule - Schedule report
export async function scheduleReport(scheduleConfig: {
  reportType: string;
  reportConfig: Record<string, any>;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
}): Promise<AxiosResponse<ApiResponse<any>>> {
  return reportsApi.post('/schedule', scheduleConfig);
}

// DELETE /reports/scheduled/:scheduleId - Cancel scheduled report
export async function cancelScheduledReport(scheduleId: string): Promise<AxiosResponse<ApiResponse<{ message: string }>>> {
  return reportsApi.delete(`/scheduled/${scheduleId}`);
}

// ============================================================================
// REPORT TEMPLATES
// ============================================================================

// GET /reports/templates - Get report templates
export async function getReportTemplates(): Promise<AxiosResponse<ApiResponse<any>>> {
  return reportsApi.get('/templates');
}

// POST /reports/templates - Create report template
export async function createReportTemplate(template: {
  name: string;
  description: string;
  category: string;
  config: Record<string, any>;
}): Promise<AxiosResponse<ApiResponse<any>>> {
  return reportsApi.post('/templates', template);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Format report date range for API
export function formatDateRange(startDate: Date, endDate: Date): { startDate: string; endDate: string } {
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
}

// Get report status display text
export function getReportStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Generating...',
    processing: 'Processing...',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled'
  };
  return statusMap[status] || status;
}

// Get report format display text
export function getReportFormatText(format: string): string {
  const formatMap: Record<string, string> = {
    json: 'JSON Data',
    pdf: 'PDF Document',
    excel: 'Excel Spreadsheet',
    csv: 'CSV File'
  };
  return formatMap[format] || format;
}

// Check if user can generate reports
export function canGenerateReports(userRole: string): boolean {
  return ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(userRole);
}

// Check if user can schedule reports
export function canScheduleReports(userRole: string): boolean {
  return ['ADMIN', 'SUPER_ADMIN'].includes(userRole);
}

// Get default report options for election type
export function getDefaultElectionReportOptions(electionType: ElectionType): Record<string, boolean> {
  return {
    includeVotingDetails: true,
    includeCandidateAnalytics: true,
    includeVoterTurnout: true,
    includeResults: electionType !== 'POLL' // Polls might not have formal results
  };
}

export default reportsApi;