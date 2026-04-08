// lib/constants.ts
// Constants matching backend configuration

import {
  UNIVERSITY_FACULTIES,
  YEAR_OF_STUDY_OPTIONS,
  ELECTION_TYPE_LABELS,
  ELECTION_STATUS_LABELS,
  USER_ROLE_LABELS,
  CANDIDATE_STATUS_LABELS,
  FileCategory,
  AccessLevel
} from './enums';

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 60000, // 60 seconds - increased for election creation with positions
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// API Endpoints - Exactly matching backend routes
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    PASSWORD_RESET_REQUEST: '/auth/password-reset/request',
    PASSWORD_RESET_CONFIRM: '/auth/password-reset/confirm',
    ACCOUNT_STATUS: '/auth/account-status',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    TWO_FACTOR_SETUP: '/auth/2fa/setup',
    TWO_FACTOR_VERIFY: '/auth/2fa/verify',
    TWO_FACTOR_DISABLE: '/auth/2fa/disable',
    SESSIONS: '/auth/sessions',
  },

  // Elections
  ELECTIONS: {
    LIST: '/elections',
    ACTIVE: '/elections/active',
    ELIGIBLE: '/elections/eligible',
    BY_ID: (id: string) => `/elections/${id}`,
    CREATE: '/elections',
    UPDATE: (id: string) => `/elections/${id}`,
    DELETE: (id: string) => `/elections/${id}`,
    START: (id: string) => `/elections/${id}/start`,
    END: (id: string) => `/elections/${id}/end`,
    PAUSE: (id: string) => `/elections/${id}/pause`,
    RESUME: (id: string) => `/elections/${id}/resume`,
    ARCHIVE: (id: string) => `/elections/${id}/archive`,
    STATS: (id: string) => `/elections/${id}/stats`,
    ADD_VOTERS: (id: string) => `/elections/${id}/voters/add`,
    REMOVE_VOTERS: (id: string) => `/elections/${id}/voters/remove`,
  },

  // Voting
  VOTES: {
    START_SESSION: '/votes/sessions/start',
    END_SESSION: (sessionId: string) => `/votes/sessions/${sessionId}/end`,
    SESSION_DETAILS: (sessionId: string) => `/votes/sessions/${sessionId}`,
    EXTEND_SESSION: (sessionId: string) => `/votes/sessions/${sessionId}/extend`,
    COMPLETE_SESSION: (sessionId: string) => `/votes/sessions/${sessionId}/complete`,
    CAST: '/votes/cast',
    VERIFY: '/votes/verify',
    VERIFICATION_STATUS: (code: string) => `/votes/verify/${code}/status`,
    VALIDATE_BALLOT: '/votes/validate-ballot',
    ELECTION_BALLOT: (electionId: string) => `/votes/elections/${electionId}/ballot`,
    VOTING_STATUS: (electionId: string) => `/votes/elections/${electionId}/status`,
    RECEIPT: (receiptHash: string) => `/votes/receipts/${receiptHash}`,
    HISTORY: '/votes/history',
    REPORT_ISSUE: '/votes/report-issue',
  },

  // Candidates
  CANDIDATES: {
    BY_ELECTION: (electionId: string) => `/candidates/election/${electionId}`,
    BY_POSITION: (positionId: string) => `/candidates/position/${positionId}`,
    BY_ID: (id: string) => `/candidates/${id}`,
    CREATE: '/candidates',
    UPDATE_PROFILE: (id: string) => `/candidates/${id}/profile`,
    UPLOAD_PHOTO: (id: string) => `/candidates/${id}/photo`,
    WITHDRAW: (id: string) => `/candidates/${id}/withdraw`,
    APPROVE: (id: string) => `/candidates/${id}/approve`,
    REJECT: (id: string) => `/candidates/${id}/reject`,
    DISQUALIFY: (id: string) => `/candidates/${id}/disqualify`,
    UPDATE_STATUS: (id: string) => `/candidates/${id}/status`,
    ADD_RUNNING_MATE: (id: string) => `/candidates/${id}/running-mate`,
    REMOVE_RUNNING_MATE: (id: string) => `/candidates/${id}/running-mate`,
    SEARCH_ALL: '/candidates/search/all',
    STATS: (electionId: string) => `/candidates/election/${electionId}/stats`,
    ANALYTICS: (electionId: string) => `/candidates/election/${electionId}/analytics`,
    BULK_APPROVE: '/candidates/bulk/approve',
    BULK_REJECT: '/candidates/bulk/reject',
    EXPORT: (electionId: string) => `/candidates/election/${electionId}/export`,
  },

  // Results
  RESULTS: {
    BY_ELECTION: (electionId: string) => `/results/${electionId}`,
    SUMMARY: (electionId: string) => `/results/${electionId}/summary`,
    LIVE_STATS: (electionId: string) => `/results/${electionId}/live-stats`,
    POSITION_RESULTS: (electionId: string, positionId: string) => `/results/${electionId}/position/${positionId}`,
    ANALYTICS: (electionId: string) => `/results/${electionId}/analytics`,
    CANDIDATE_PERFORMANCE: (electionId: string, candidateId: string) => `/results/${electionId}/candidate/${candidateId}/performance`,
    CALCULATE: (electionId: string) => `/results/${electionId}/calculate`,
    PUBLISH: (electionId: string) => `/results/${electionId}/publish`,
    EXPORT: (electionId: string) => `/results/${electionId}/export`,
    VERIFY_INTEGRITY: (electionId: string) => `/results/${electionId}/verify-integrity`,
  },

  // Admin
  ADMIN: {
    STATS: '/admin/stats',
    CREATE_USER: '/admin/users',
    UPDATE_USER_ROLE: (userId: string) => `/admin/users/${userId}/role`,
    IMPORT_USERS: '/admin/users/import',
    AUDIT_LOGS: '/admin/audit-logs',
    UPDATE_USER_STATUS: (userId: string) => `/admin/users/${userId}/status`,
    GENERATE_REPORT: '/admin/reports',
    CLEAR_CACHE: '/admin/cache/clear',
    DASHBOARD: '/admin/dashboard',
    BACKUP: '/admin/backup',
    SYSTEM_NOTIFICATION: '/admin/notifications/system',
    HEALTH: '/admin/health',
    EMERGENCY_SHUTDOWN: '/admin/emergency/shutdown',
    USERS: '/admin/users',
    USER_DETAILS: (userId: string) => `/admin/users/${userId}`,
    UPDATE_USER: (userId: string) => `/admin/users/${userId}`,
    DELETE_USER: (userId: string) => `/admin/users/${userId}`,
    ANALYTICS: '/admin/analytics',
  },

  // Dashboard
  DASHBOARD: {
    VOTER: '/dashboard/voter',
    CANDIDATE: '/dashboard/candidate',
    ADMIN: '/dashboard/admin',
    UPDATES: '/dashboard/updates',
    REFRESH: '/dashboard/refresh',
    STATS: '/dashboard/stats',
    NOTIFICATIONS: '/dashboard/notifications',
    EXPORT: '/dashboard/export',
    MY_DASHBOARD: '/dashboard/my-dashboard',
    QUICK_STATS: '/dashboard/quick-stats',
    WIDGET: (widgetType: string) => `/dashboard/widgets/${widgetType}`,
    PREFERENCES: '/dashboard/preferences',
  },

  // Files
  FILES: {
    UPLOAD: '/files/upload',
    BY_ID: (id: string) => `/files/${id}`,
    DELETE: (id: string) => `/files/${id}`,
    BY_CATEGORY: (category: string) => `/files/category/${category}`,
    USER_FILES: (userId: string) => `/files/user/${userId}`,
  },

  // Audit
  AUDIT: {
    LOGS: '/audit/logs',
    EXPORT: '/audit/export',
    SEARCH: '/audit/search',
    SUMMARY: '/audit/summary',
  },

  // Reports
  REPORTS: {
    ELECTION: (electionId: string) => `/reports/election/${electionId}`,
    SYSTEM: '/reports/system',
    USER_ACTIVITY: '/reports/user-activity',
    VOTING_ANALYTICS: '/reports/voting-analytics',
    EXPORT: '/reports/export',
  },
} as const;

// File Upload Configuration - Matching backend FILE_CONFIGS
export const FILE_CONFIGS = {
  [FileCategory.PROFILE_IMAGE]: {
    destination: 'profiles',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    generateThumbnail: true,
    thumbnailSize: { width: 200, height: 200 },
    accessLevel: AccessLevel.PRIVATE,
  },
  [FileCategory.CANDIDATE_PHOTO]: {
    destination: 'candidates',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    generateThumbnail: true,
    thumbnailSize: { width: 300, height: 400 },
    accessLevel: AccessLevel.PUBLIC,
  },
  [FileCategory.CANDIDATE_BANNER]: {
    destination: 'candidate-banners',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 15 * 1024 * 1024, // 15MB
    generateThumbnail: true,
    thumbnailSize: { width: 800, height: 400 },
    accessLevel: AccessLevel.PUBLIC,
  },
  [FileCategory.MANIFESTO]: {
    destination: 'manifestos',
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSize: 20 * 1024 * 1024, // 20MB
    accessLevel: AccessLevel.PUBLIC,
  },
  [FileCategory.ELECTION_COVER]: {
    destination: 'election-covers',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    generateThumbnail: true,
    thumbnailSize: { width: 600, height: 300 },
    accessLevel: AccessLevel.PUBLIC,
  },
  [FileCategory.DOCUMENT]: {
    destination: 'documents',
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: 25 * 1024 * 1024, // 25MB
    accessLevel: AccessLevel.AUTHENTICATED,
  },
} as const;

// Validation Rules - Matching backend validation
export const VALIDATION_RULES = {
  USER: {
    STUDENT_ID: {
      PATTERN: /^[A-Z]{2,3}\d{2,3}-\d{4}\/\d{4}$/,
      MIN_LENGTH: 12,
      MAX_LENGTH: 20,
    },
    EMAIL: {
      PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      UNIVERSITY_DOMAIN: /@(university\.edu|students\.university\.edu)$/,
    },
    PASSWORD: {
      MIN_LENGTH: 8,
      MAX_LENGTH: 128,
      PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    },
    PHONE: {
      PATTERN: /^(\+254|0)[17]\d{8}$/,
    },
    NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 50,
      PATTERN: /^[a-zA-Z\s\-']+$/,
    },
  },
  ELECTION: {
    TITLE: {
      MIN_LENGTH: 5,
      MAX_LENGTH: 200,
    },
    DESCRIPTION: {
      MIN_LENGTH: 10,
      MAX_LENGTH: 2000,
    },
    POSITIONS: {
      MIN_COUNT: 1,
      MAX_COUNT: 20,
    },
  },
  CANDIDATE: {
    MANIFESTO: {
      MAX_LENGTH: 5000,
    },
    SLOGAN: {
      MAX_LENGTH: 100,
    },
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. Insufficient permissions.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  RATE_LIMITED: 'Too many requests. Please try again later.',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit.',
  INVALID_FILE_TYPE: 'Invalid file type. Please select a supported file.',
  VOTING_SESSION_EXPIRED: 'Your voting session has expired. Please start a new session.',
  ELECTION_NOT_ACTIVE: 'This election is not currently active.',
  ALREADY_VOTED: 'You have already voted in this election.',
  INVALID_VERIFICATION_CODE: 'Invalid verification code.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in.',
  LOGOUT_SUCCESS: 'Successfully logged out.',
  REGISTRATION_SUCCESS: 'Account created successfully. Please verify your email.',
  PASSWORD_RESET_SENT: 'Password reset link sent to your email.',
  PASSWORD_CHANGED: 'Password changed successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  VOTE_CAST: 'Your vote has been cast successfully.',
  ELECTION_CREATED: 'Election created successfully.',
  CANDIDATE_APPROVED: 'Candidate approved successfully.',
  FILE_UPLOADED: 'File uploaded successfully.',
  VERIFICATION_SENT: 'Verification email sent.',
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: 'UniElect Voting System',
  SHORT_NAME: 'UniElect',
  DESCRIPTION: 'Secure digital voting platform for university elections',
  VERSION: '1.0.0',
  CONTACT_EMAIL: 'support@unielect.com',
  SUPPORT_URL: 'https://docs.unielect.com',
  GITHUB_URL: 'https://github.com/unielect/voting-system',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'unielect-voting-access-token',
  REFRESH_TOKEN: 'unielect-voting-refresh-token',
  USER: 'unielect-voting-user',
  THEME: 'unielect-voting-theme',
  DASHBOARD_PREFERENCES: 'unielect-voting-dashboard-preferences',
  VOTING_SESSION: 'unielect-voting-session',
  DEVICE_FINGERPRINT: 'unielect-voting-device-fingerprint',
} as const;

// Export all the predefined constants from enums
export {
  UNIVERSITY_FACULTIES,
  YEAR_OF_STUDY_OPTIONS,
  ELECTION_TYPE_LABELS,
  ELECTION_STATUS_LABELS,
  USER_ROLE_LABELS,
  CANDIDATE_STATUS_LABELS,
};