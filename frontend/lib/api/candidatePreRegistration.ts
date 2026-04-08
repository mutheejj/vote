// frontend/lib/api/candidatePreRegistration.ts
// Candidate Pre-Registration API service

import axios, { AxiosResponse } from 'axios';
import { ApiResponse } from '../types';
import { API_CONFIG, API_ENDPOINTS } from '../constants';

// Create axios instance
const candidatePreRegApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
candidatePreRegApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('unielect-voting-access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface SubmitApplicationRequest {
  studentId: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  faculty: string;
  department: string;
  course: string;
  yearOfStudy: number;
  intendedPosition: string;
  electionId: string; // NEW: Reference to specific election
  positionId: string; // NEW: Reference to specific position
  reason: string;
}

export interface SubmitApplicationResponse {
  id: string;
  status: string;
}

export interface VerifyTokenResponse {
  valid: boolean;
  message?: string;
  application?: {
    studentId: string;
    email: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    phone?: string;
    faculty: string;
    department: string;
    course: string;
    yearOfStudy: number;
    intendedPosition: string;
  };
}

export interface CompleteRegistrationRequest {
  token: string;
  password: string;
  confirmPassword: string;
  admissionYear?: number;
}

export interface CompleteRegistrationResponse {
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

export interface CandidateApplication {
  id: string;
  studentId: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  faculty: string;
  department: string;
  course: string;
  yearOfStudy: number;
  intendedPosition: string;
  electionId?: string; // NEW
  positionId?: string; // NEW
  reason: string;
  status: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  approvalToken?: string;
  tokenExpiry?: string;
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  election?: {
    id: string;
    title: string;
    status: string;
  };
  position?: {
    id: string;
    name: string;
  };
}

export interface ApplicationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  registered: number;
  expired: number;
}

// Public API Functions

/**
 * Get open elections for candidate registration
 */
export async function getOpenElections(): Promise<AxiosResponse<ApiResponse<Array<{
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  registrationStart?: string;
  registrationEnd?: string;
  positions: Array<{
    id: string;
    name: string;
    description?: string;
    order: number;
  }>;
}>>>> {
  return candidatePreRegApi.get('/candidate-applications/open-elections');
}

/**
 * Submit candidate application
 */
export async function submitApplication(
  data: SubmitApplicationRequest
): Promise<AxiosResponse<ApiResponse<SubmitApplicationResponse>>> {
  return candidatePreRegApi.post('/candidate-applications', data);
}

/**
 * Verify approval token
 */
export async function verifyApprovalToken(
  token: string
): Promise<AxiosResponse<VerifyTokenResponse>> {
  return candidatePreRegApi.get(`/candidate-applications/verify/${token}`);
}

/**
 * Complete registration with approved token
 */
export async function completeRegistration(
  data: CompleteRegistrationRequest
): Promise<AxiosResponse<ApiResponse<CompleteRegistrationResponse>>> {
  return candidatePreRegApi.post('/candidate-applications/complete', data);
}

// Admin API Functions

/**
 * Get all applications with filters (Admin)
 */
export async function getAllApplications(params?: {
  status?: string;
  page?: number;
  limit?: number;
  faculty?: string;
  department?: string;
}): Promise<AxiosResponse<ApiResponse<{
  data: CandidateApplication[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>>> {
  return candidatePreRegApi.get('/candidate-applications', { params });
}

/**
 * Get application by ID (Admin)
 */
export async function getApplicationById(
  id: string
): Promise<AxiosResponse<ApiResponse<CandidateApplication>>> {
  return candidatePreRegApi.get(`/candidate-applications/${id}`);
}

/**
 * Approve application (Admin)
 */
export async function approveApplication(
  id: string,
  reviewNotes?: string
): Promise<AxiosResponse<ApiResponse<CandidateApplication>>> {
  return candidatePreRegApi.put(`/candidate-applications/${id}/approve`, {
    reviewNotes
  });
}

/**
 * Reject application (Admin)
 */
export async function rejectApplication(
  id: string,
  rejectionReason: string
): Promise<AxiosResponse<ApiResponse<CandidateApplication>>> {
  return candidatePreRegApi.put(`/candidate-applications/${id}/reject`, {
    rejectionReason
  });
}

/**
 * Get application statistics (Admin)
 */
export async function getApplicationStats(): Promise<
  AxiosResponse<ApiResponse<ApplicationStats>>
> {
  return candidatePreRegApi.get('/candidate-applications/stats');
}

export default candidatePreRegApi;
