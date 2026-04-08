// lib/api/candidates.ts
// Candidates API service - ALL endpoints matching backend

import axios, { AxiosResponse } from 'axios';
import { Candidate, ApiResponse } from '../types';
import { API_CONFIG, API_ENDPOINTS } from '../constants';

const candidatesApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

candidatesApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('unielect-voting-access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// GET /candidates/election/:electionId - Get candidates by election
export async function getCandidatesByElection(
  electionId: string,
  params?: {
    positionId?: string;
    status?: string;
    faculty?: string;
    department?: string;
    course?: string;
    yearOfStudy?: number;
    search?: string;
    page?: number;
    limit?: number;
  }
): Promise<AxiosResponse<ApiResponse<{
  candidates: Candidate[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}>>> {
  return candidatesApi.get(API_ENDPOINTS.CANDIDATES.BY_ELECTION(electionId), { params });
}

// GET /candidates/position/:positionId - Get candidates by position
export async function getCandidatesByPosition(
  positionId: string,
  params?: {
    status?: string;
    search?: string;
  }
): Promise<AxiosResponse<ApiResponse<Candidate[]>>> {
  return candidatesApi.get(API_ENDPOINTS.CANDIDATES.BY_POSITION(positionId), { params });
}

// GET /candidates/:id - Get candidate by ID
export async function getCandidateById(id: string): Promise<AxiosResponse<ApiResponse<Candidate>>> {
  return candidatesApi.get(API_ENDPOINTS.CANDIDATES.BY_ID(id));
}

// POST /candidates - Create candidate application
export async function createCandidateApplication(data: {
  positionId: string;
  manifesto?: string;
  slogan?: string;
  runningMateId?: string;
}): Promise<AxiosResponse<ApiResponse<Candidate>>> {
  return candidatesApi.post(API_ENDPOINTS.CANDIDATES.CREATE, data);
}

// PUT /candidates/:id/profile - Update candidate profile
export async function updateCandidateProfile(id: string, data: {
  manifesto?: string;
  slogan?: string;
  socialMedia?: any;
}): Promise<AxiosResponse<ApiResponse<Candidate>>> {
  return candidatesApi.put(API_ENDPOINTS.CANDIDATES.UPDATE_PROFILE(id), data);
}

// POST /candidates/:id/photo - Upload candidate photo
export async function uploadCandidatePhoto(id: string, file: File): Promise<AxiosResponse<ApiResponse<{ photoUrl: string }>>> {
  const formData = new FormData();
  formData.append('photo', file);
  return candidatesApi.post(API_ENDPOINTS.CANDIDATES.UPLOAD_PHOTO(id), formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

// POST /candidates/:id/withdraw - Withdraw candidacy
export async function withdrawCandidacy(id: string, reason?: string): Promise<AxiosResponse<ApiResponse<Candidate>>> {
  return candidatesApi.post(API_ENDPOINTS.CANDIDATES.WITHDRAW(id), { reason });
}

// PUT /candidates/:id/approve - Approve candidate (Admin/Moderator)
export async function approveCandidate(id: string): Promise<AxiosResponse<ApiResponse<Candidate>>> {
  return candidatesApi.put(API_ENDPOINTS.CANDIDATES.APPROVE(id));
}

// PUT /candidates/:id/reject - Reject candidate (Admin/Moderator)
export async function rejectCandidate(id: string, reason: string): Promise<AxiosResponse<ApiResponse<Candidate>>> {
  return candidatesApi.put(API_ENDPOINTS.CANDIDATES.REJECT(id), { reason });
}

// PUT /candidates/:id/disqualify - Disqualify candidate (Admin)
export async function disqualifyCandidate(id: string, reason: string): Promise<AxiosResponse<ApiResponse<Candidate>>> {
  return candidatesApi.put(API_ENDPOINTS.CANDIDATES.DISQUALIFY(id), { reason });
}

// PUT /candidates/:id/status - Update candidate status (Admin)
export async function updateCandidateStatus(id: string, status: string, reason?: string): Promise<AxiosResponse<ApiResponse<Candidate>>> {
  return candidatesApi.put(API_ENDPOINTS.CANDIDATES.UPDATE_STATUS(id), { status, reason });
}

// POST /candidates/:id/running-mate - Add running mate
export async function addRunningMate(id: string, runningMateId: string): Promise<AxiosResponse<ApiResponse<Candidate>>> {
  return candidatesApi.post(API_ENDPOINTS.CANDIDATES.ADD_RUNNING_MATE(id), { runningMateId });
}

// DELETE /candidates/:id/running-mate - Remove running mate
export async function removeRunningMate(id: string): Promise<AxiosResponse<ApiResponse<Candidate>>> {
  return candidatesApi.delete(API_ENDPOINTS.CANDIDATES.REMOVE_RUNNING_MATE(id));
}

// GET /candidates/search/all - Advanced candidate search (Admin)
export async function searchCandidates(params: {
  search?: string;
  status?: string;
  faculty?: string;
  department?: string;
  course?: string;
  yearOfStudy?: number;
  electionId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<AxiosResponse<ApiResponse<{ candidates: Candidate[]; total: number; page: number; totalPages: number }>>> {
  return candidatesApi.get('/candidates/search/all', { params });
}

// GET /candidates/election/:electionId/stats - Get candidate statistics (Admin)
export async function getCandidateStats(electionId: string): Promise<AxiosResponse<ApiResponse<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  disqualified: number;
  byPosition: Array<{
    positionId: string;
    positionName: string;
    count: number;
    approved: number;
  }>;
  byFaculty: Array<{
    faculty: string;
    count: number;
  }>;
}>>> {
  return candidatesApi.get(`/candidates/election/${electionId}/stats`);
}

// GET /candidates/election/:electionId/analytics - Get detailed analytics (Admin)
export async function getCandidateAnalytics(electionId: string, options?: {
  includeVotes?: boolean;
  includeDemographics?: boolean;
}): Promise<AxiosResponse<ApiResponse<any>>> {
  return candidatesApi.get(`/candidates/election/${electionId}/analytics`, { params: options });
}

// POST /candidates/bulk/approve - Bulk approve candidates (Admin)
export async function bulkApproveCandidates(candidateIds: string[]): Promise<AxiosResponse<ApiResponse<{
  approved: number;
  failed: number;
  errors: Array<{ candidateId: string; error: string }>;
}>>> {
  return candidatesApi.post('/candidates/bulk/approve', { candidateIds });
}

// POST /candidates/bulk/reject - Bulk reject candidates (Admin)
export async function bulkRejectCandidates(candidateIds: string[], reason: string): Promise<AxiosResponse<ApiResponse<{
  rejected: number;
  failed: number;
  errors: Array<{ candidateId: string; error: string }>;
}>>> {
  return candidatesApi.post('/candidates/bulk/reject', { candidateIds, reason });
}

// GET /candidates/election/:electionId/export - Export candidate data (Admin)
export async function exportCandidateData(electionId: string, format: 'csv' | 'xlsx' | 'json' = 'csv', options?: {
  includePersonalData?: boolean;
  includeManifestos?: boolean;
  includeVoteData?: boolean;
}): Promise<AxiosResponse<Blob>> {
  return candidatesApi.get(`/candidates/election/${electionId}/export`, {
    params: { format, ...options },
    responseType: 'blob'
  });
}

export default candidatesApi;