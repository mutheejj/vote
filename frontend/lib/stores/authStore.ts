// lib/stores/authStore.ts
// Authentication Zustand store

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SafeUser, TokenPair, LoginRequest, RegisterUserRequest } from '../types';
import {
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
  saveTokens,
  clearTokens,
  getAccessToken
} from '../api/auth';

interface AuthState {
  user: SafeUser | null;
  tokens: TokenPair | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterUserRequest) => Promise<any>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false,

      // Actions
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await loginUser(credentials);
          const { user, tokens, requiresTwoFactor } = response.data.data!;

          if (requiresTwoFactor) {
            set({
              isLoading: false,
              error: 'Two-factor authentication required'
            });
            return;
          }

          saveTokens(tokens);
          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Login failed',
          });
          throw error;
        }
      },

      register: async (data: RegisterUserRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await registerUser(data);
          // Don't authenticate user yet - they need to verify email first
          // Clear any existing tokens
          clearTokens();
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          // Return response data for useAuth to check emailVerificationSent
          return response.data.data;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Registration failed',
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          const tokens = get().tokens;
          if (tokens) {
            await logoutUser({ refreshToken: tokens.refreshToken });
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          clearTokens();
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      refreshProfile: async () => {
        try {
          const response = await getUserProfile();
          const user = response.data.data!;

          set({ user });
        } catch (error: any) {
          console.error('Failed to refresh profile:', error);
          if (error.response?.status === 401) {
            get().logout();
          }
        }
      },

      clearError: () => set({ error: null }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      initialize: async () => {
        // Prevent multiple simultaneous initializations
        if (get().isInitialized || get().isLoading) {
          return;
        }

        const token = getAccessToken();
        if (token) {
          try {
            set({ isLoading: true });

            // Create a timeout promise (reduced to 3 seconds for faster feedback)
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Profile fetch timeout')), 3000);
            });

            // Race between profile fetch and timeout
            const response = await Promise.race([
              getUserProfile(),
              timeoutPromise
            ]) as any;

            const user = response.data.data!;

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
            });
          } catch (error: any) {
            console.error('Failed to initialize auth:', error);

            // Only clear tokens if it's a 401 (unauthorized), not on timeout
            if (error.response?.status === 401) {
              clearTokens();
            }

            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true, // Mark as initialized even on failure to prevent retries
            });
          }
        } else {
          set({ isLoading: false, isInitialized: true });
        }
      },
    }),
    {
      name: 'unielect-voting-auth',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);