// lib/api/index.ts
// Central API exports - All API services

// Re-export all API services for easy importing
export * from './auth';
export * from './elections';
export * from './candidates';
export * from './votes';
export * from './results';

// Explicitly re-export to avoid ambiguity
export {
  getAdminDashboard as getAdminDashboardData,
  getSystemStats,
  getRecentActivity,
  getElectionManagement,
  getCandidateManagement,
  getVoterManagement,
  getSecurityOverview
} from './admin';

export {
  getAdminDashboard as getAdminDashboardAPI,
  getVoterDashboard,
  getCandidateDashboard
} from './dashboard';

export {
  getAuditLogs as getAuditLogsAPI,
  getAuditLog,
  createAuditLog,
  getAuditStats,
  exportAuditLogs
} from './audit';

export * from './files';
export * from './reports';

// Export default instances for direct use
export { default as authApi } from './auth';
export { default as electionsApi } from './elections';
export { default as candidatesApi } from './candidates';
export { default as votesApi } from './votes';
export { default as resultsApi } from './results';
export { default as adminApi } from './admin';
export { default as dashboardApi } from './dashboard';
export { default as auditApi } from './audit';
export { default as filesApi } from './files';
export { default as reportsApi } from './reports';

// Common API utilities
import axios from 'axios';
import { API_CONFIG } from '../constants';

// Create a base API instance
export const baseApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global request interceptor
baseApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('jkuat-voting-access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response interceptor for error handling
baseApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('jkuat-voting-access-token');
      localStorage.removeItem('jkuat-voting-refresh-token');
      localStorage.removeItem('jkuat-voting-user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Health check endpoint
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await baseApi.get('/health');
    return response.status === 200;
  } catch {
    return false;
  }
}

// API status check
export async function getApiStatus(): Promise<{ status: string; version: string; uptime: number }> {
  const response = await baseApi.get('/');
  return response.data;
}