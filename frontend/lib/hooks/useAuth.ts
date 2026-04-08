// lib/hooks/useAuth.ts
// Authentication hook integrating with authStore and API services

import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import {
  LoginRequest,
  RegisterUserRequest,
  SafeUser,
  TwoFactorVerificationRequest,
  SessionInfo
} from '../types';
import {
  setup2FA,
  verify2FA,
  disable2FA,
  getActiveSessions,
  revokeSession,
  changePassword,
  updateUserProfile,
  requestPasswordReset,
  confirmPasswordReset,
  resendVerificationEmail,
  getAccessToken as getAccessTokenFromStorage
} from '../api/auth';

interface UseAuthOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  autoInitialize?: boolean;
}

interface UseAuthReturn {
  // State
  user: SafeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Core Authentication
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterUserRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;

  // Profile Management
  updateProfile: (data: Partial<SafeUser>) => Promise<void>;
  changeUserPassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;

  // Session Management
  getSessions: () => Promise<SessionInfo[]>;
  revokeUserSession: (sessionId: string) => Promise<void>;

  // Two-Factor Authentication
  setup2FAAuth: () => Promise<{ secret: string; qrCode: string; backupCodes: string[] }>;
  verify2FAAuth: (token: string, type: 'setup' | 'login' | 'disable') => Promise<void>;
  disable2FAAuth: (token: string) => Promise<void>;

  // Password Reset
  requestPasswordResetEmail: (email: string) => Promise<void>;
  confirmPasswordResetRequest: (token: string, newPassword: string, confirmPassword: string) => Promise<void>;

  // Email Verification
  resendEmailVerification: (email: string) => Promise<void>;

  // Token Management
  getAccessToken: () => string | null;

  // Utility functions
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isVerified: boolean;
  canVote: boolean;
}

export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const {
    redirectTo = '/login',
    requireAuth = false,
    autoInitialize = true
  } = options;

  const router = useRouter();
  const { toast } = useNotificationStore();

  const {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    refreshProfile,
    clearError,
    initialize
  } = useAuthStore();

  // Initialize auth on mount - only once per session
  useEffect(() => {
    if (autoInitialize && !isLoading && !user) {
      // Non-blocking initialize call
      initialize().catch(err => console.error('Auth initialization failed:', err));
    }
  }, [autoInitialize]); // Removed initialize and isLoading from deps to prevent re-runs

  // Redirect if auth is required but user is not authenticated
  useEffect(() => {
    if (requireAuth && !isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [requireAuth, isLoading, isAuthenticated, router, redirectTo]);

  // Core Authentication Functions
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      await storeLogin(credentials);
      toast.success('Login Successful', 'Welcome back!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error('Login Failed', message);
      throw error;
    }
  }, [storeLogin, toast]);

  const register = useCallback(async (data: RegisterUserRequest) => {
    console.log('[useAuth] Registration started', { studentId: data.studentId, email: data.email });
    try {
      console.log('[useAuth] Calling storeRegister...');
      const response = await storeRegister(data);
      console.log('[useAuth] Registration successful', response);

      // Check if verification email was sent successfully
      const emailSent = response?.emailVerificationSent !== false; // Default to true if not specified
      if (emailSent) {
        toast.success('Registration Successful', 'Please check your email for verification.');
      } else {
        toast.warning('Registration Successful', 'Account created but email failed to send. You can request a new verification email.');
      }

      return response; // Return response for RegisterForm to check
    } catch (error: any) {
      console.error('[useAuth] Registration error:', error);
      console.error('[useAuth] Error response:', error.response?.data);
      const message = error.response?.data?.message || error.message || 'Registration failed';
      toast.error('Registration Failed', message);
      throw error;
    }
  }, [storeRegister, toast]);

  const logout = useCallback(async () => {
    try {
      await storeLogout();
      toast.success('Logged Out', 'You have been logged out successfully.');
      router.push('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local state
      toast.warning('Logout Complete', 'You have been logged out locally.');
    }
  }, [storeLogout, toast, router]);

  // Profile Management
  const updateProfile = useCallback(async (data: Partial<SafeUser>) => {
    try {
      const response = await updateUserProfile(data);
      const updatedUser = response.data.data!;

      // Update the store with new user data
      useAuthStore.setState({ user: updatedUser });

      toast.success('Profile Updated', 'Your profile has been updated successfully.');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error('Update Failed', message);
      throw error;
    }
  }, [toast]);

  const changeUserPassword = useCallback(async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    try {
      await changePassword({ currentPassword, newPassword, confirmPassword });
      toast.success('Password Changed', 'Your password has been updated successfully.');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error('Password Change Failed', message);
      throw error;
    }
  }, [toast]);

  // Session Management
  const getSessions = useCallback(async (): Promise<SessionInfo[]> => {
    try {
      const response = await getActiveSessions();
      return response.data.data!;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to get sessions';
      toast.error('Sessions Error', message);
      throw error;
    }
  }, [toast]);

  const revokeUserSession = useCallback(async (sessionId: string) => {
    try {
      await revokeSession(sessionId);
      toast.success('Session Revoked', 'Session has been terminated successfully.');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to revoke session';
      toast.error('Revoke Failed', message);
      throw error;
    }
  }, [toast]);

  // Two-Factor Authentication
  const setup2FAAuth = useCallback(async () => {
    try {
      const response = await setup2FA();
      const setupData = response.data.data!;

      toast.success('2FA Setup', '2FA has been set up. Please save your backup codes.');
      return setupData;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to setup 2FA';
      toast.error('2FA Setup Failed', message);
      throw error;
    }
  }, [toast]);

  const verify2FAAuth = useCallback(async (token: string, type: 'setup' | 'login' | 'disable') => {
    if (!user) throw new Error('User not authenticated');

    try {
      await verify2FA({ userId: user.id, token, type });

      const messages = {
        setup: '2FA has been enabled on your account.',
        login: '2FA verification successful.',
        disable: '2FA has been disabled on your account.'
      };

      toast.success('2FA Verified', messages[type]);

      // Refresh user profile to get updated 2FA status
      await refreshProfile();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to verify 2FA';
      toast.error('2FA Verification Failed', message);
      throw error;
    }
  }, [user, toast, refreshProfile]);

  const disable2FAAuth = useCallback(async (token: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await disable2FA({ userId: user.id, token, type: 'disable' });
      toast.success('2FA Disabled', '2FA has been disabled on your account.');

      // Refresh user profile to get updated 2FA status
      await refreshProfile();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to disable 2FA';
      toast.error('2FA Disable Failed', message);
      throw error;
    }
  }, [user, toast, refreshProfile]);

  // Password Reset
  const requestPasswordResetEmail = useCallback(async (email: string) => {
    try {
      await requestPasswordReset({ email });
      toast.success('Reset Email Sent', 'Password reset link has been sent to your email.');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send reset email';
      toast.error('Reset Request Failed', message);
      throw error;
    }
  }, [toast]);

  const confirmPasswordResetRequest = useCallback(async (
    token: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    try {
      await confirmPasswordReset({ token, newPassword, confirmPassword });
      toast.success('Password Reset', 'Your password has been reset successfully.');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to reset password';
      toast.error('Password Reset Failed', message);
      throw error;
    }
  }, [toast]);

  // Email Verification
  const resendEmailVerification = useCallback(async (email: string) => {
    try {
      await resendVerificationEmail({ email });
      toast.success('Verification Sent', 'Verification email has been sent.');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send verification email';
      toast.error('Verification Failed', message);
      throw error;
    }
  }, [toast]);

  // Token Management
  const getAccessToken = useCallback((): string | null => {
    return getAccessTokenFromStorage();
  }, []);

  // Utility functions
  const hasPermission = useCallback((permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  }, [user]);

  const hasRole = useCallback((role: string): boolean => {
    return user?.role === role;
  }, [user]);

  // Computed values
  const isVerified = useMemo(() => {
    return !!(user?.isVerified && user?.emailVerified !== null);
  }, [user]);

  const canVote = useMemo(() => {
    return !!(isAuthenticated && isVerified && user?.isActive);
  }, [isAuthenticated, isVerified, user]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,

    // Core Authentication
    login,
    register,
    logout,
    refreshProfile,

    // Profile Management
    updateProfile,
    changeUserPassword,

    // Session Management
    getSessions,
    revokeUserSession,

    // Two-Factor Authentication
    setup2FAAuth,
    verify2FAAuth,
    disable2FAAuth,

    // Password Reset
    requestPasswordResetEmail,
    confirmPasswordResetRequest,

    // Email Verification
    resendEmailVerification,

    // Token Management
    getAccessToken,

    // Utility functions
    clearError,
    hasPermission,
    hasRole,
    isVerified,
    canVote
  };
}

export default useAuth;