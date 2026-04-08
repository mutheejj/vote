// lib/api/elections.ts
// Elections API service

import axios, { AxiosResponse } from 'axios';
import {
  Election,
  CreateElectionData,
  UpdateElectionData,
  ElectionStats,
  ElectionFilters,
  PaginatedResponse,
  ApiResponse
} from '../types';
import { API_CONFIG, API_ENDPOINTS } from '../constants';

const electionsApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
electionsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('unielect-voting-access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('Elections API Request:', {
    method: config.method,
    url: config.url,
    baseURL: config.baseURL,
    fullURL: `${config.baseURL}${config.url}`,
    hasToken: !!token
  });
  return config;
});

export async function getElections(params?: {
  page?: number;
  limit?: number;
  filters?: ElectionFilters;
  [key: string]: any; // Allow additional flat params for backward compatibility
}): Promise<AxiosResponse<ApiResponse<PaginatedResponse<Election>>>> {
  // Flatten filters into query params to match backend expectations
  // Support both nested filters and flat params for backward compatibility
  const { page, limit, filters, ...otherParams } = params || {};

  const queryParams: any = {
    page,
    limit,
    ...filters,     // Spread nested filters if provided
    ...otherParams  // Spread any flat params (search, status, type, etc.)
  };

  return electionsApi.get(API_ENDPOINTS.ELECTIONS.LIST, { params: queryParams });
}

export async function getActiveElections(): Promise<AxiosResponse<ApiResponse<Election[]>>> {
  return electionsApi.get(API_ENDPOINTS.ELECTIONS.ACTIVE);
}

export async function getEligibleElections(): Promise<AxiosResponse<ApiResponse<Election[]>>> {
  return electionsApi.get(API_ENDPOINTS.ELECTIONS.ELIGIBLE);
}

export async function getElectionById(id: string): Promise<AxiosResponse<ApiResponse<Election>>> {
  return electionsApi.get(API_ENDPOINTS.ELECTIONS.BY_ID(id));
}

export async function createElection(data: CreateElectionData): Promise<AxiosResponse<ApiResponse<Election>>> {
  return electionsApi.post(API_ENDPOINTS.ELECTIONS.CREATE, data);
}

export async function updateElection(id: string, data: UpdateElectionData): Promise<AxiosResponse<ApiResponse<Election>>> {
  return electionsApi.put(API_ENDPOINTS.ELECTIONS.UPDATE(id), data);
}

export async function startElection(id: string): Promise<AxiosResponse<ApiResponse<Election>>> {
  return electionsApi.post(API_ENDPOINTS.ELECTIONS.START(id));
}

export async function endElection(id: string): Promise<AxiosResponse<ApiResponse<Election>>> {
  return electionsApi.post(API_ENDPOINTS.ELECTIONS.END(id));
}

// DELETE /elections/:id - Delete election (Super Admin)
export async function deleteElection(id: string): Promise<AxiosResponse<ApiResponse<{ message: string }>>> {
  return electionsApi.delete(API_ENDPOINTS.ELECTIONS.DELETE(id));
}

// POST /elections/:id/pause - Pause election
export async function pauseElection(id: string): Promise<AxiosResponse<ApiResponse<Election>>> {
  return electionsApi.post(API_ENDPOINTS.ELECTIONS.PAUSE(id));
}

// POST /elections/:id/resume - Resume election
export async function resumeElection(id: string): Promise<AxiosResponse<ApiResponse<Election>>> {
  return electionsApi.post(API_ENDPOINTS.ELECTIONS.RESUME(id));
}

// POST /elections/:id/archive - Archive election
export async function archiveElection(id: string): Promise<AxiosResponse<ApiResponse<Election>>> {
  return electionsApi.post(API_ENDPOINTS.ELECTIONS.ARCHIVE(id));
}

// GET /elections/:id/stats - Get election stats
export async function getElectionStats(id: string): Promise<AxiosResponse<ApiResponse<ElectionStats>>> {
  return electionsApi.get(API_ENDPOINTS.ELECTIONS.STATS(id));
}

// POST /elections/:id/voters/add - Add eligible voters
export async function addEligibleVoters(id: string, voterIds: string[]): Promise<AxiosResponse<ApiResponse<{ message: string }>>> {
  return electionsApi.post(API_ENDPOINTS.ELECTIONS.ADD_VOTERS(id), { voterIds });
}

// POST /elections/:id/voters/remove - Remove eligible voters
export async function removeEligibleVoters(id: string, voterIds: string[]): Promise<AxiosResponse<ApiResponse<{ message: string }>>> {
  return electionsApi.post(API_ENDPOINTS.ELECTIONS.REMOVE_VOTERS(id), { voterIds });
}

export default electionsApi;