// lib/api/auth.ts
// Authentication API service

import axios, { AxiosResponse } from 'axios';
import {
  RegisterUserRequest,
  RegisterUserResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  TokenPair,
  PasswordResetRequest,
  PasswordResetConfirm,
  PasswordResetResponse,
  EmailVerificationRequest,
  EmailVerificationResponse,
  ResendVerificationRequest,
  TwoFactorSetupResponse,
  TwoFactorVerificationRequest,
  TwoFactorVerificationResponse,
  LogoutRequest,
  LogoutResponse,
  AccountStatusResponse,
  SafeUser,
  SessionInfo,
  ApiResponse
} from '../types';
import { API_CONFIG, API_ENDPOINTS } from '../constants';
import { generateDeviceFingerprint } from '../utils/crypto';

// Create axios instance with default config
const authApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('unielect-voting-access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication Service Functions
export async function registerUser(data: RegisterUserRequest): Promise<AxiosResponse<ApiResponse<RegisterUserResponse>>> {
  const deviceInfo = {
    userAgent: navigator.userAgent,
    ipAddress: '',
    deviceFingerprint: generateDeviceFingerprint(),
    platform: navigator.platform,
    browser: navigator.userAgent.split(' ').pop() || 'unknown',
  };

  return authApi.post(API_ENDPOINTS.AUTH.REGISTER, {
    ...data,
    deviceInfo,
  });
}

export async function loginUser(data: LoginRequest): Promise<AxiosResponse<ApiResponse<LoginResponse>>> {
  const deviceInfo = {
    userAgent: navigator.userAgent,
    ipAddress: '',
    deviceFingerprint: generateDeviceFingerprint(),
    platform: navigator.platform,
    browser: navigator.userAgent.split(' ').pop() || 'unknown',
  };

  return authApi.post(API_ENDPOINTS.AUTH.LOGIN, {
    ...data,
    deviceInfo,
  });
}

export async function logoutUser(data?: LogoutRequest): Promise<AxiosResponse<ApiResponse<LogoutResponse>>> {
  return authApi.post(API_ENDPOINTS.AUTH.LOGOUT, data);
}

export async function refreshAccessToken(data: RefreshTokenRequest): Promise<AxiosResponse<ApiResponse<TokenPair>>> {
  return authApi.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, data);
}

export async function getUserProfile(): Promise<AxiosResponse<ApiResponse<SafeUser>>> {
  return authApi.get(API_ENDPOINTS.AUTH.PROFILE);
}

export async function updateUserProfile(data: Partial<SafeUser>): Promise<AxiosResponse<ApiResponse<SafeUser>>> {
  return authApi.put(API_ENDPOINTS.AUTH.PROFILE, data);
}

// Password Management
export async function requestPasswordReset(data: PasswordResetRequest): Promise<AxiosResponse<ApiResponse<PasswordResetResponse>>> {
  return authApi.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST, data);
}

export async function confirmPasswordReset(data: PasswordResetConfirm): Promise<AxiosResponse<ApiResponse<PasswordResetResponse>>> {
  return authApi.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, data);
}

export async function verifyPasswordResetToken(token: string): Promise<AxiosResponse<ApiResponse<{
  valid: boolean;
  email?: string;
  message?: string;
}>>> {
  return authApi.get(`/auth/password-reset/verify/${token}`);
}

export async function setPasswordWithToken(data: {
  token: string;
  newPassword: string;
  confirmPassword?: string;
}): Promise<AxiosResponse<ApiResponse<{
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
}>>> {
  // Include confirmPassword if not provided (use newPassword value)
  const requestData = {
    ...data,
    confirmPassword: data.confirmPassword || data.newPassword,
  };
  return authApi.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, requestData);
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<AxiosResponse<ApiResponse<{ message: string }>>> {
  return authApi.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
}

// Email Verification
export async function verifyEmail(data: EmailVerificationRequest): Promise<AxiosResponse<ApiResponse<EmailVerificationResponse>>> {
  return authApi.get(`${API_ENDPOINTS.AUTH.VERIFY_EMAIL}/${data.token}`);
}

export async function resendVerificationEmail(data: ResendVerificationRequest): Promise<AxiosResponse<ApiResponse<{ message: string }>>> {
  return authApi.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, data);
}

// Two-Factor Authentication
export async function setup2FA(): Promise<AxiosResponse<ApiResponse<TwoFactorSetupResponse>>> {
  return authApi.post(API_ENDPOINTS.AUTH.TWO_FACTOR_SETUP);
}

export async function verify2FA(data: TwoFactorVerificationRequest): Promise<AxiosResponse<ApiResponse<TwoFactorVerificationResponse>>> {
  return authApi.post(API_ENDPOINTS.AUTH.TWO_FACTOR_VERIFY, data);
}

export async function disable2FA(data: TwoFactorVerificationRequest): Promise<AxiosResponse<ApiResponse<TwoFactorVerificationResponse>>> {
  return authApi.post(API_ENDPOINTS.AUTH.TWO_FACTOR_DISABLE, data);
}

// Account Status and Security
export async function getAccountStatus(identifier: string): Promise<AxiosResponse<ApiResponse<AccountStatusResponse>>> {
  return authApi.get(`${API_ENDPOINTS.AUTH.ACCOUNT_STATUS}/${encodeURIComponent(identifier)}`);
}

export async function getActiveSessions(): Promise<AxiosResponse<ApiResponse<SessionInfo[]>>> {
  return authApi.get(API_ENDPOINTS.AUTH.SESSIONS);
}

export async function revokeSession(sessionId: string): Promise<AxiosResponse<ApiResponse<{ message: string }>>> {
  return authApi.delete(`${API_ENDPOINTS.AUTH.SESSIONS}/${sessionId}`);
}

// Helper functions
export function saveTokens(tokens: TokenPair): void {
  // Save to localStorage for API calls
  localStorage.setItem('unielect-voting-access-token', tokens.accessToken);
  localStorage.setItem('unielect-voting-refresh-token', tokens.refreshToken);

  // Save to cookies for middleware (server-side access)
  // Access token expires in 15 minutes (900 seconds)
  document.cookie = `unielect-voting-access-token=${tokens.accessToken}; path=/; max-age=900; SameSite=Lax`;
  // Refresh token expires in 7 days (604800 seconds)
  document.cookie = `unielect-voting-refresh-token=${tokens.refreshToken}; path=/; max-age=604800; SameSite=Lax`;
}

export function clearTokens(): void {
  // Clear from localStorage
  localStorage.removeItem('unielect-voting-access-token');
  localStorage.removeItem('unielect-voting-refresh-token');
  localStorage.removeItem('unielect-voting-user');

  // Clear from cookies
  document.cookie = 'unielect-voting-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'unielect-voting-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

export function getAccessToken(): string | null {
  return localStorage.getItem('unielect-voting-access-token');
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export default authApi;