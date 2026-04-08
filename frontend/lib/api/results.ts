// lib/api/results.ts
// Results API service - ALL endpoints matching backend

import axios, { AxiosResponse } from 'axios';
import { ElectionResults, Result, ApiResponse } from '../types';
import { API_CONFIG, API_ENDPOINTS } from '../constants';

const resultsApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

resultsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('unielect-voting-access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// GET /results/:electionId - Get election results
export async function getElectionResults(electionId: string): Promise<AxiosResponse<ApiResponse<ElectionResults>>> {
  return resultsApi.get(API_ENDPOINTS.RESULTS.BY_ELECTION(electionId));
}

// GET /results/:electionId/summary - Get result summary
export async function getResultsSummary(electionId: string): Promise<AxiosResponse<ApiResponse<any>>> {
  return resultsApi.get(API_ENDPOINTS.RESULTS.SUMMARY(electionId));
}

// GET /results/:electionId/live-stats - Get live voting stats
export async function getLiveStats(electionId: string): Promise<AxiosResponse<ApiResponse<any>>> {
  return resultsApi.get(API_ENDPOINTS.RESULTS.LIVE_STATS(electionId));
}

// POST /results/:electionId/calculate - Calculate results (Admin)
export async function calculateResults(electionId: string): Promise<AxiosResponse<ApiResponse<ElectionResults>>> {
  return resultsApi.post(API_ENDPOINTS.RESULTS.CALCULATE(electionId));
}

// POST /results/:electionId/publish - Publish results (Admin)
export async function publishResults(electionId: string): Promise<AxiosResponse<ApiResponse<{ message: string }>>> {
  return resultsApi.post(API_ENDPOINTS.RESULTS.PUBLISH(electionId));
}

export default resultsApi;