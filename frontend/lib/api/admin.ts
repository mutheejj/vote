// lib/api/admin.ts
// Admin API service - ALL endpoints matching backend

import axios, { AxiosResponse } from 'axios';
import { AdminDashboardData, AuditLog, SafeUser, ApiResponse, PaginatedResponse } from '../types';
import { API_CONFIG, API_ENDPOINTS } from '../constants';

const adminApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('unielect-voting-access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// GET /admin/dashboard - Get admin dashboard
export async function getAdminDashboard(): Promise<AxiosResponse<ApiResponse<AdminDashboardData>>> {
  return adminApi.get(API_ENDPOINTS.ADMIN.DASHBOARD);
}

// GET /admin/users - Get all users
export async function getAllUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}): Promise<AxiosResponse<ApiResponse<PaginatedResponse<SafeUser>>>> {
  return adminApi.get(API_ENDPOINTS.ADMIN.USERS, { params });
}

// PUT /admin/users/:userId/role - Update user role
export async function updateUserRole(userId: string, role: string, reason?: string): Promise<AxiosResponse<ApiResponse<SafeUser>>> {
  return adminApi.put(API_ENDPOINTS.ADMIN.UPDATE_USER_ROLE(userId), { role, reason });
}

// PUT /admin/users/:userId/status - Toggle user status
export async function updateUserStatus(userId: string, isActive: boolean, reason?: string): Promise<AxiosResponse<ApiResponse<SafeUser>>> {
  return adminApi.put(API_ENDPOINTS.ADMIN.UPDATE_USER_STATUS(userId), { isActive, reason });
}

// GET /admin/audit-logs - Get audit logs
export async function getAuditLogs(params?: {
  page?: number;
  limit?: number;
  category?: string;
  severity?: string;
}): Promise<AxiosResponse<ApiResponse<PaginatedResponse<AuditLog>>>> {
  return adminApi.get(API_ENDPOINTS.ADMIN.AUDIT_LOGS, { params });
}

// GET /admin/health - Get system health
export async function getSystemHealth(): Promise<AxiosResponse<ApiResponse<any>>> {
  return adminApi.get(API_ENDPOINTS.ADMIN.HEALTH);
}

// GET /admin/stats - Get system statistics
export async function getSystemStats(): Promise<AxiosResponse<ApiResponse<any>>> {
  return adminApi.get('/admin/stats');
}

// GET /admin/activity - Get recent activity
export async function getRecentActivity(params?: {
  limit?: number;
  page?: number;
}): Promise<AxiosResponse<ApiResponse<any>>> {
  return adminApi.get('/admin/activity', { params });
}

// GET /admin/elections/management - Get election management data
export async function getElectionManagement(): Promise<AxiosResponse<ApiResponse<any>>> {
  return adminApi.get('/admin/elections/management');
}

// GET /admin/candidates/management - Get candidate management data
export async function getCandidateManagement(): Promise<AxiosResponse<ApiResponse<any>>> {
  return adminApi.get('/admin/candidates/management');
}

// GET /admin/voters/management - Get voter management data
export async function getVoterManagement(): Promise<AxiosResponse<ApiResponse<any>>> {
  return adminApi.get('/admin/voters/management');
}

// GET /admin/security/overview - Get security overview
export async function getSecurityOverview(): Promise<AxiosResponse<ApiResponse<any>>> {
  return adminApi.get('/admin/security/overview');
}

export default adminApi;