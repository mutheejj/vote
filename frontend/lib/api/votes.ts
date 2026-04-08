// lib/api/votes.ts
// Voting API service - ALL endpoints matching backend

import axios, { AxiosResponse } from 'axios';
import {
  BallotData,
  VotingSession,
  VoteReceipt,
  ApiResponse
} from '../types';
import { API_CONFIG, API_ENDPOINTS } from '../constants';

const votesApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

votesApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('unielect-voting-access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// POST /votes/sessions/start - Start voting session
export async function startVotingSession(electionId: string): Promise<AxiosResponse<ApiResponse<VotingSession>>> {
  return votesApi.post(API_ENDPOINTS.VOTES.START_SESSION, { electionId });
}

// PUT /votes/sessions/:sessionId/end - End voting session
export async function endVotingSession(sessionId: string): Promise<AxiosResponse<ApiResponse<VotingSession>>> {
  return votesApi.put(API_ENDPOINTS.VOTES.END_SESSION(sessionId));
}

// GET /votes/sessions/:sessionId - Get session details
export async function getVotingSession(sessionId: string): Promise<AxiosResponse<ApiResponse<VotingSession>>> {
  return votesApi.get(API_ENDPOINTS.VOTES.SESSION_DETAILS(sessionId));
}

// PUT /votes/sessions/:sessionId/extend - Extend session
export async function extendVotingSession(sessionId: string): Promise<AxiosResponse<ApiResponse<VotingSession>>> {
  return votesApi.put(API_ENDPOINTS.VOTES.EXTEND_SESSION(sessionId));
}

// POST /votes/sessions/:sessionId/complete - Complete session
export async function completeVotingSession(sessionId: string): Promise<AxiosResponse<ApiResponse<VotingSession>>> {
  return votesApi.post(API_ENDPOINTS.VOTES.COMPLETE_SESSION(sessionId));
}

// POST /votes/cast - Cast votes
export async function castVotes(data: BallotData): Promise<AxiosResponse<ApiResponse<VoteReceipt>>> {
  // Backend expects { sessionId, ballot } format where ballot is the votes array
  return votesApi.post(API_ENDPOINTS.VOTES.CAST, {
    sessionId: data.sessionId,
    ballot: data.votes
  });
}

// POST /votes/verify - Verify vote
export async function verifyVote(verificationCode: string): Promise<AxiosResponse<ApiResponse<{ verified: boolean; receipt?: VoteReceipt }>>> {
  return votesApi.post(API_ENDPOINTS.VOTES.VERIFY, { verificationCode });
}

// GET /votes/verify/:verificationCode/status - Get verification status
export async function getVerificationStatus(verificationCode: string): Promise<AxiosResponse<ApiResponse<{ status: string; verified: boolean }>>> {
  return votesApi.get(API_ENDPOINTS.VOTES.VERIFICATION_STATUS(verificationCode));
}

// POST /votes/validate-ballot - Validate ballot structure
export async function validateBallot(data: BallotData): Promise<AxiosResponse<ApiResponse<{ valid: boolean; errors?: string[] }>>> {
  // Backend expects { electionId, ballot } where ballot is the votes array
  const payload = {
    electionId: data.electionId,
    ballot: data.votes  // Send votes array, not the entire BallotData object
  };

  console.log('validateBallot called with:', { data, payload });

  return votesApi.post(API_ENDPOINTS.VOTES.VALIDATE_BALLOT, payload);
}

// GET /votes/elections/:electionId/ballot - Get election ballot
export async function getElectionBallot(electionId: string): Promise<AxiosResponse<ApiResponse<any>>> {
  return votesApi.get(API_ENDPOINTS.VOTES.ELECTION_BALLOT(electionId));
}

// GET /votes/elections/:electionId/status - Check voting status
export async function getVotingStatus(electionId: string): Promise<AxiosResponse<ApiResponse<{ hasVoted: boolean; sessionId?: string }>>> {
  return votesApi.get(API_ENDPOINTS.VOTES.VOTING_STATUS(electionId));
}

// GET /votes/receipts/:receiptHash - Get vote receipt
export async function getVoteReceipt(receiptHash: string): Promise<AxiosResponse<ApiResponse<VoteReceipt>>> {
  return votesApi.get(API_ENDPOINTS.VOTES.RECEIPT(receiptHash));
}

// GET /votes/history - Get voting history
export async function getVotingHistory(): Promise<AxiosResponse<ApiResponse<VoteReceipt[]>>> {
  return votesApi.get(API_ENDPOINTS.VOTES.HISTORY);
}

// POST /votes/report-issue - Report voting issue
export async function reportVotingIssue(data: {
  electionId: string;
  sessionId?: string;
  issue: string;
  description: string;
}): Promise<AxiosResponse<ApiResponse<{ message: string }>>> {
  return votesApi.post(API_ENDPOINTS.VOTES.REPORT_ISSUE, data);
}

// ============================================================================
// ADMIN-ONLY VOTING ENDPOINTS
// ============================================================================

// GET /votes/elections/:electionId/progress - Get voting progress (Admin/Moderator)
export async function getVotingProgress(electionId: string): Promise<AxiosResponse<ApiResponse<any>>> {
  return votesApi.get(`/elections/${electionId}/progress`);
}

// GET /votes/elections/:electionId/stats/realtime - Get real-time stats (Admin/Moderator)
export async function getRealTimeVotingStats(electionId: string): Promise<AxiosResponse<ApiResponse<any>>> {
  return votesApi.get(`/elections/${electionId}/stats/realtime`);
}

// GET /votes/elections/:electionId/analytics - Get voting analytics (Admin/Moderator)
export async function getVotingAnalytics(electionId: string): Promise<AxiosResponse<ApiResponse<any>>> {
  return votesApi.get(`/elections/${electionId}/analytics`);
}

// POST /votes/elections/:electionId/tally - Tally votes (Admin only)
export async function tallyElectionVotes(electionId: string, includePartial?: boolean): Promise<AxiosResponse<ApiResponse<any>>> {
  return votesApi.post(`/elections/${electionId}/tally`, { includePartial });
}

// PUT /votes/:voteId/invalidate - Invalidate vote (Admin only)
export async function invalidateVote(voteId: string, reason: string): Promise<AxiosResponse<ApiResponse<{ message: string }>>> {
  return votesApi.put(`/${voteId}/invalidate`, { reason });
}

// GET /votes/elections/:electionId/emergency-options - Get emergency options (Admin only)
export async function getEmergencyVotingOptions(electionId: string): Promise<AxiosResponse<ApiResponse<any>>> {
  return votesApi.get(`/elections/${electionId}/emergency-options`);
}

// GET /votes/elections/:electionId/export - Export voting data (Admin only)
export async function exportVotingData(
  electionId: string,
  format?: 'json' | 'csv' | 'xlsx',
  includePersonalData?: boolean
): Promise<AxiosResponse<ApiResponse<any>>> {
  const params = new URLSearchParams();
  if (format) params.append('format', format);
  if (includePersonalData !== undefined) params.append('includePersonalData', includePersonalData.toString());

  return votesApi.get(`/elections/${electionId}/export?${params.toString()}`);
}

// ============================================================================
// ENHANCED VOTING SESSION MANAGEMENT
// ============================================================================

// Enhanced start voting session with device fingerprint
export async function startVotingSessionEnhanced(data: {
  electionId: string;
  deviceFingerprint?: string;
}): Promise<AxiosResponse<ApiResponse<any>>> {
  return votesApi.post(API_ENDPOINTS.VOTES.START_SESSION, data);
}

// Enhanced extend session with specific extension time
export async function extendVotingSessionEnhanced(
  sessionId: string,
  extensionMinutes: number
): Promise<AxiosResponse<ApiResponse<any>>> {
  return votesApi.put(API_ENDPOINTS.VOTES.EXTEND_SESSION(sessionId), { extensionMinutes });
}

// End session with reason
export async function endVotingSessionWithReason(
  sessionId: string,
  reason?: string
): Promise<AxiosResponse<ApiResponse<any>>> {
  return votesApi.put(API_ENDPOINTS.VOTES.END_SESSION(sessionId), { reason });
}

// ============================================================================
// ENHANCED BALLOT AND VERIFICATION
// ============================================================================

// Enhanced ballot validation with full structure check
export async function validateBallotEnhanced(data: {
  electionId: string;
  ballot: any;
  sessionId: string;
}): Promise<AxiosResponse<ApiResponse<any>>> {
  return votesApi.post(API_ENDPOINTS.VOTES.VALIDATE_BALLOT, data);
}

// Enhanced vote verification with integrity checks
export async function verifyVoteEnhanced(verificationCode: string): Promise<AxiosResponse<ApiResponse<any>>> {
  return votesApi.post(API_ENDPOINTS.VOTES.VERIFY, { verificationCode });
}

// ============================================================================
// VOTING HISTORY AND ANALYTICS
// ============================================================================

// Get detailed voting history with filters
export async function getVotingHistoryDetailed(
  includeDetails?: boolean,
  page?: number,
  limit?: number
): Promise<AxiosResponse<ApiResponse<any>>> {
  const params = new URLSearchParams();
  if (includeDetails !== undefined) params.append('includeDetails', includeDetails.toString());
  if (page !== undefined) params.append('page', page.toString());
  if (limit !== undefined) params.append('limit', limit.toString());

  return votesApi.get(`${API_ENDPOINTS.VOTES.HISTORY}?${params.toString()}`);
}

// ============================================================================
// HELPER FUNCTIONS FOR VOTING
// ============================================================================

// Generate device fingerprint for voting session
export function generateVotingDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('UniElect Voting System Device Fingerprint', 2, 2);
  }

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');

  return btoa(fingerprint).substring(0, 32);
}

// Save voting session to local storage
export function saveVotingSession(sessionData: any): void {
  localStorage.setItem('unielect-voting-session', JSON.stringify(sessionData));
}

// Get saved voting session
export function getSavedVotingSession(): any {
  const session = localStorage.getItem('unielect-voting-session');
  return session ? JSON.parse(session) : null;
}

// Clear voting session
export function clearVotingSession(): void {
  localStorage.removeItem('unielect-voting-session');
}

// Check if voting session is valid
export function isVotingSessionValid(sessionData: any): boolean {
  if (!sessionData || !sessionData.expiresAt) return false;
  return new Date(sessionData.expiresAt) > new Date();
}

export default votesApi;