// frontend/lib/api/adminInvitations.ts
// Admin Invitation API service

import axios, { AxiosResponse } from 'axios';
import { ApiResponse } from '../types';
import { API_CONFIG, API_ENDPOINTS } from '../constants';

// Create axios instance
const adminInvitationApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
adminInvitationApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('unielect-voting-access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface CreateInvitationRequest {
  email: string;
  role: 'ADMIN' | 'MODERATOR';
  expiresInDays?: number;
}

export interface AdminInvitation {
  id: string;
  email: string;
  role: string;
  invitationToken: string;
  invitedBy: string;
  expiresAt: string;
  used: boolean;
  usedAt?: string;
  usedByName?: string;
  usedByStudentId?: string;
  revokedAt?: string;
  revokedBy?: string;
  createdAt: string;
  inviter: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface VerifyInvitationResponse {
  valid: boolean;
  message?: string;
  invitation?: {
    email: string;
    role: string;
  };
}

export interface CompleteInvitationRequest {
  token: string;
  studentId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  faculty?: string;
  department?: string;
  course?: string;
  yearOfStudy?: number;
  admissionYear?: number;
}

export interface CompleteInvitationResponse {
  user: {
    id: string;
    studentId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface InvitationStats {
  total: number;
  pending: number;
  used: number;
  expired: number;
  revoked: number;
  byRole: Record<string, number>;
}

// Public API Functions

/**
 * Verify invitation token
 */
export async function verifyInvitationToken(
  token: string
): Promise<AxiosResponse<VerifyInvitationResponse>> {
  return adminInvitationApi.get(`/admin-invitations/verify/${token}`);
}

/**
 * Complete invitation registration
 */
export async function completeInvitation(
  data: CompleteInvitationRequest
): Promise<AxiosResponse<ApiResponse<CompleteInvitationResponse>>> {
  return adminInvitationApi.post('/admin-invitations/complete', data);
}

// Admin API Functions (SUPER_ADMIN and ADMIN only)

/**
 * Create admin invitation (SUPER_ADMIN only)
 */
export async function createInvitation(
  data: CreateInvitationRequest
): Promise<AxiosResponse<ApiResponse<AdminInvitation>>> {
  return adminInvitationApi.post('/admin-invitations', data);
}

/**
 * Get all invitations with filters
 */
export async function getAllInvitations(params?: {
  status?: 'all' | 'pending' | 'used' | 'expired' | 'revoked';
  role?: string;
  page?: number;
  limit?: number;
}): Promise<AxiosResponse<ApiResponse<{
  data: AdminInvitation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>>> {
  return adminInvitationApi.get('/admin-invitations', { params });
}

/**
 * Get invitation by ID
 */
export async function getInvitationById(
  id: string
): Promise<AxiosResponse<ApiResponse<AdminInvitation>>> {
  return adminInvitationApi.get(`/admin-invitations/${id}`);
}

/**
 * Resend invitation
 */
export async function resendInvitation(
  id: string
): Promise<AxiosResponse<ApiResponse<AdminInvitation>>> {
  return adminInvitationApi.post(`/admin-invitations/${id}/resend`);
}

/**
 * Revoke invitation
 */
export async function revokeInvitation(
  id: string
): Promise<AxiosResponse<ApiResponse<AdminInvitation>>> {
  return adminInvitationApi.put(`/admin-invitations/${id}/revoke`);
}

/**
 * Get invitation statistics
 */
export async function getInvitationStats(): Promise<
  AxiosResponse<ApiResponse<InvitationStats>>
> {
  return adminInvitationApi.get('/admin-invitations/stats');
}

export default adminInvitationApi;
