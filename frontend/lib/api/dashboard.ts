// lib/api/dashboard.ts
// Dashboard API service - ALL endpoints matching backend

import axios, { AxiosResponse } from 'axios';
import {
  VoterDashboardData,
  CandidateDashboardData,
  AdminDashboardData,
  DashboardNotification,
  UserPreferences,
  ApiResponse
} from '../types';
import { API_CONFIG, API_ENDPOINTS } from '../constants';

const dashboardApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

dashboardApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('jkuat-voting-access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================================
// VOTER DASHBOARD
// ============================================================================

// GET /dashboard/voter - Get voter dashboard data
export async function getVoterDashboard(): Promise<AxiosResponse<ApiResponse<VoterDashboardData>>> {
  return dashboardApi.get(API_ENDPOINTS.DASHBOARD.VOTER);
}

// ============================================================================
// CANDIDATE DASHBOARD
// ============================================================================

// GET /dashboard/candidate - Get candidate dashboard data
export async function getCandidateDashboard(): Promise<AxiosResponse<ApiResponse<CandidateDashboardData>>> {
  return dashboardApi.get(API_ENDPOINTS.DASHBOARD.CANDIDATE);
}

// ============================================================================
// ADMIN DASHBOARD
// ============================================================================

// GET /dashboard/admin - Get admin dashboard data
export async function getAdminDashboard(): Promise<AxiosResponse<ApiResponse<AdminDashboardData>>> {
  return dashboardApi.get(API_ENDPOINTS.DASHBOARD.ADMIN);
}

// ============================================================================
// DASHBOARD NOTIFICATIONS
// ============================================================================

// GET /dashboard/notifications - Get dashboard notifications
export async function getDashboardNotifications(
  unreadOnly?: boolean,
  limit?: number
): Promise<AxiosResponse<ApiResponse<DashboardNotification[]>>> {
  const params = new URLSearchParams();
  if (unreadOnly !== undefined) params.append('unreadOnly', unreadOnly.toString());
  if (limit !== undefined) params.append('limit', limit.toString());

  return dashboardApi.get(`${API_ENDPOINTS.DASHBOARD.NOTIFICATIONS}?${params.toString()}`);
}

// POST /dashboard/notifications/:id/read - Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<AxiosResponse<ApiResponse<{ message: string }>>> {
  return dashboardApi.post(`${API_ENDPOINTS.DASHBOARD.NOTIFICATIONS}/${notificationId}/read`);
}

// POST /dashboard/notifications/mark-all-read - Mark all notifications as read
export async function markAllNotificationsAsRead(): Promise<AxiosResponse<ApiResponse<{ message: string }>>> {
  return dashboardApi.post(`${API_ENDPOINTS.DASHBOARD.NOTIFICATIONS}/mark-all-read`);
}

// DELETE /dashboard/notifications/:id - Delete notification
export async function deleteNotification(notificationId: string): Promise<AxiosResponse<ApiResponse<{ message: string }>>> {
  return dashboardApi.delete(`${API_ENDPOINTS.DASHBOARD.NOTIFICATIONS}/${notificationId}`);
}

// ============================================================================
// DASHBOARD PREFERENCES
// ============================================================================

// GET /dashboard/preferences - Get user dashboard preferences
export async function getDashboardPreferences(): Promise<AxiosResponse<ApiResponse<UserPreferences>>> {
  return dashboardApi.get(API_ENDPOINTS.DASHBOARD.PREFERENCES);
}

// PUT /dashboard/preferences - Update dashboard preferences
export async function updateDashboardPreferences(preferences: Partial<UserPreferences>): Promise<AxiosResponse<ApiResponse<UserPreferences>>> {
  return dashboardApi.put(API_ENDPOINTS.DASHBOARD.PREFERENCES, preferences);
}

// ============================================================================
// DASHBOARD WIDGETS
// ============================================================================

// GET /dashboard/widgets/:widgetType - Get specific widget data
export async function getWidgetData(widgetType: string): Promise<AxiosResponse<ApiResponse<any>>> {
  return dashboardApi.get(API_ENDPOINTS.DASHBOARD.WIDGET(widgetType));
}

// GET /dashboard/quick-stats - Get quick statistics
export async function getQuickStats(): Promise<AxiosResponse<ApiResponse<any>>> {
  return dashboardApi.get(API_ENDPOINTS.DASHBOARD.QUICK_STATS);
}

// ============================================================================
// DASHBOARD UPDATES AND REFRESH
// ============================================================================

// GET /dashboard/updates - Get real-time dashboard updates
export async function getDashboardUpdates(since?: Date): Promise<AxiosResponse<ApiResponse<any>>> {
  const params = new URLSearchParams();
  if (since) params.append('since', since.toISOString());

  return dashboardApi.get(`${API_ENDPOINTS.DASHBOARD.UPDATES}?${params.toString()}`);
}

// POST /dashboard/refresh - Force refresh dashboard data
export async function refreshDashboard(): Promise<AxiosResponse<ApiResponse<{ message: string }>>> {
  return dashboardApi.post(API_ENDPOINTS.DASHBOARD.REFRESH);
}

// ============================================================================
// DASHBOARD EXPORT
// ============================================================================

// GET /dashboard/export - Export dashboard data
export async function exportDashboardData(
  format?: 'pdf' | 'excel' | 'csv',
  includeCharts?: boolean
): Promise<AxiosResponse<ApiResponse<any>>> {
  const params = new URLSearchParams();
  if (format) params.append('format', format);
  if (includeCharts !== undefined) params.append('includeCharts', includeCharts.toString());

  return dashboardApi.get(`${API_ENDPOINTS.DASHBOARD.EXPORT}?${params.toString()}`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Save dashboard preferences to local storage
export function saveDashboardPreferences(preferences: Partial<UserPreferences>): void {
  localStorage.setItem('jkuat-voting-dashboard-preferences', JSON.stringify(preferences));
}

// Get saved dashboard preferences
export function getSavedDashboardPreferences(): Partial<UserPreferences> | null {
  const preferences = localStorage.getItem('jkuat-voting-dashboard-preferences');
  return preferences ? JSON.parse(preferences) : null;
}

// Clear saved dashboard preferences
export function clearDashboardPreferences(): void {
  localStorage.removeItem('jkuat-voting-dashboard-preferences');
}

// Get default dashboard preferences
export function getDefaultDashboardPreferences(): UserPreferences {
  return {
    id: '',
    userId: '',
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    electionReminders: true,
    resultNotifications: true,
    campaignUpdates: false,
    profileVisibility: 'PUBLIC' as any,
    showVotingHistory: false,
    showAchievements: true,
    theme: 'LIGHT' as any,
    language: 'en',
    timezone: 'Africa/Nairobi',
    highContrast: false,
    largeFonts: false,
    screenReader: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export default dashboardApi;