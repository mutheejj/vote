// lib/enums.ts
// Enums that exactly match the backend Prisma schema

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  VOTER = 'VOTER'
}

export enum ElectionType {
  PRESIDENTIAL = 'PRESIDENTIAL',
  STUDENT_UNION = 'STUDENT_UNION',
  DEPARTMENTAL = 'DEPARTMENTAL',
  FACULTY = 'FACULTY',
  CLUB = 'CLUB',
  SOCIETY = 'SOCIETY',
  REFERENDUM = 'REFERENDUM',
  POLL = 'POLL'
}

export enum ElectionStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ARCHIVED = 'ARCHIVED'
}

export enum CandidateStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISQUALIFIED = 'DISQUALIFIED',
  WITHDRAWN = 'WITHDRAWN'
}

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED'
}

export enum TokenType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  TWO_FACTOR = 'TWO_FACTOR'
}

export enum FileCategory {
  PROFILE_IMAGE = 'PROFILE_IMAGE',
  CANDIDATE_PHOTO = 'CANDIDATE_PHOTO',
  CANDIDATE_BANNER = 'CANDIDATE_BANNER',
  MANIFESTO = 'MANIFESTO',
  ELECTION_COVER = 'ELECTION_COVER',
  DOCUMENT = 'DOCUMENT',
  SYSTEM = 'SYSTEM',
  TEMP = 'TEMP'
}

export enum AccessLevel {
  PUBLIC = 'PUBLIC',
  AUTHENTICATED = 'AUTHENTICATED',
  ADMIN_ONLY = 'ADMIN_ONLY',
  PRIVATE = 'PRIVATE'
}

// Permission constants matching backend
export const PERMISSIONS = {
  // User Management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE_ROLES: 'user:manage_roles',

  // Election Management
  ELECTION_CREATE: 'election:create',
  ELECTION_READ: 'election:read',
  ELECTION_UPDATE: 'election:update',
  ELECTION_DELETE: 'election:delete',
  ELECTION_PUBLISH: 'election:publish',
  ELECTION_ARCHIVE: 'election:archive',

  // Voting Management
  VOTE_READ: 'vote:read',
  VOTE_VERIFY: 'vote:verify',
  VOTE_AUDIT: 'vote:audit',

  // Candidate Management
  CANDIDATE_APPROVE: 'candidate:approve',
  CANDIDATE_REJECT: 'candidate:reject',
  CANDIDATE_DISQUALIFY: 'candidate:disqualify',

  // Results Management
  RESULT_READ: 'result:read',
  RESULT_PUBLISH: 'result:publish',
  RESULT_EXPORT: 'result:export',

  // System Administration
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_BACKUP: 'system:backup',
  SYSTEM_MONITOR: 'system:monitor',
  SYSTEM_AUDIT: 'system:audit',

  // Reports and Analytics
  REPORT_GENERATE: 'report:generate',
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role-based permission mapping exactly matching backend
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [UserRole.ADMIN]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_MANAGE_ROLES,
    PERMISSIONS.ELECTION_CREATE,
    PERMISSIONS.ELECTION_READ,
    PERMISSIONS.ELECTION_UPDATE,
    PERMISSIONS.ELECTION_PUBLISH,
    PERMISSIONS.ELECTION_ARCHIVE,
    PERMISSIONS.VOTE_READ,
    PERMISSIONS.VOTE_VERIFY,
    PERMISSIONS.VOTE_AUDIT,
    PERMISSIONS.CANDIDATE_APPROVE,
    PERMISSIONS.CANDIDATE_REJECT,
    PERMISSIONS.CANDIDATE_DISQUALIFY,
    PERMISSIONS.RESULT_READ,
    PERMISSIONS.RESULT_PUBLISH,
    PERMISSIONS.RESULT_EXPORT,
    PERMISSIONS.REPORT_GENERATE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
  ],
  [UserRole.MODERATOR]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.ELECTION_READ,
    PERMISSIONS.VOTE_READ,
    PERMISSIONS.CANDIDATE_APPROVE,
    PERMISSIONS.CANDIDATE_REJECT,
    PERMISSIONS.RESULT_READ,
    PERMISSIONS.REPORT_GENERATE,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  [UserRole.VOTER]: [
    PERMISSIONS.ELECTION_READ,
    PERMISSIONS.RESULT_READ,
  ],
};

// Notification types
export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

// Activity types matching backend
export enum ActivityType {
  ELECTION_CREATED = 'election_created',
  ELECTION_STARTED = 'election_started',
  ELECTION_ENDED = 'election_ended',
  USER_REGISTERED = 'user_registered',
  VOTE_CAST = 'vote_cast'
}

// Audit categories matching backend
export enum AuditCategory {
  AUTH = 'AUTH',
  ELECTION = 'ELECTION',
  VOTE = 'VOTE',
  ADMIN = 'ADMIN',
  SECURITY = 'SECURITY'
}

// Audit severity levels matching backend
export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// System health status
export enum SystemStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

// Connection status
export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable'
}

// Additional backend enums from Prisma schema
export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum BackupType {
  FULL = 'FULL',
  INCREMENTAL = 'INCREMENTAL',
  DIFFERENTIAL = 'DIFFERENTIAL',
  MANUAL = 'MANUAL',
  SCHEDULED = 'SCHEDULED'
}

export enum BackupStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  RESTORED = 'RESTORED'
}

export enum AchievementType {
  VOTING_PARTICIPATION = 'VOTING_PARTICIPATION',
  ELECTION_CREATOR = 'ELECTION_CREATOR',
  CANDIDATE_REGISTRATION = 'CANDIDATE_REGISTRATION',
  EARLY_VOTER = 'EARLY_VOTER',
  CONSISTENT_VOTER = 'CONSISTENT_VOTER',
  ELECTION_MODERATOR = 'ELECTION_MODERATOR',
  COMMUNITY_ENGAGEMENT = 'COMMUNITY_ENGAGEMENT',
  SYSTEM_CONTRIBUTION = 'SYSTEM_CONTRIBUTION'
}

export enum SocialPlatform {
  TWITTER = 'TWITTER',
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  LINKEDIN = 'LINKEDIN',
  GITHUB = 'GITHUB',
  WEBSITE = 'WEBSITE',
  YOUTUBE = 'YOUTUBE',
  TIKTOK = 'TIKTOK'
}

export enum ProfileVisibility {
  PUBLIC = 'PUBLIC',
  AUTHENTICATED_ONLY = 'AUTHENTICATED_ONLY',
  PRIVATE = 'PRIVATE'
}

export enum Theme {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  AUTO = 'AUTO'
}

export enum IssueCategory {
  BUG = 'BUG',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  UI_UX = 'UI_UX',
  PERFORMANCE = 'PERFORMANCE',
  SECURITY = 'SECURITY',
  AUTHENTICATION = 'AUTHENTICATION',
  VOTING_ISSUE = 'VOTING_ISSUE',
  ELECTION_SETUP = 'ELECTION_SETUP',
  CANDIDATE_REGISTRATION = 'CANDIDATE_REGISTRATION',
  RESULTS_DISPLAY = 'RESULTS_DISPLAY',
  NOTIFICATION = 'NOTIFICATION',
  FILE_UPLOAD = 'FILE_UPLOAD',
  OTHER = 'OTHER'
}

export enum IssuePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  URGENT = 'URGENT'
}

export enum IssueStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  DUPLICATE = 'DUPLICATE',
  WONT_FIX = 'WONT_FIX'
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PUBLISHED = 'PUBLISHED',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED',
  ARCHIVED = 'ARCHIVED'
}

export enum TaskType {
  ELECTION_SETUP = 'ELECTION_SETUP',
  CANDIDATE_REVIEW = 'CANDIDATE_REVIEW',
  CAMPAIGN_APPROVAL = 'CAMPAIGN_APPROVAL',
  RESULT_VERIFICATION = 'RESULT_VERIFICATION',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  CONTENT_MODERATION = 'CONTENT_MODERATION',
  USER_SUPPORT = 'USER_SUPPORT',
  DOCUMENTATION = 'DOCUMENTATION',
  TESTING = 'TESTING',
  DEPLOYMENT = 'DEPLOYMENT',
  OTHER = 'OTHER'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE'
}

export enum AnalyticsEventType {
  PAGE_VIEW = 'PAGE_VIEW',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  VOTE_CAST = 'VOTE_CAST',
  ELECTION_VIEW = 'ELECTION_VIEW',
  CANDIDATE_VIEW = 'CANDIDATE_VIEW',
  RESULT_VIEW = 'RESULT_VIEW',
  DOWNLOAD = 'DOWNLOAD',
  ERROR = 'ERROR',
  SEARCH = 'SEARCH',
  FILTER = 'FILTER',
  SORT = 'SORT'
}

// University specific constants
export const UNIVERSITY_FACULTIES = [
  'School of Engineering',
  'School of Computing and Information Technology',
  'School of Architecture and Building Sciences',
  'School of Business and Entrepreneurship',
  'School of Agriculture and Biotechnology',
  'School of Health Sciences',
  'School of Education',
  'School of Law',
  'School of Veterinary Medicine',
  'School of Physical Sciences',
  'School of Human Resource Development'
] as const;

export const YEAR_OF_STUDY_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

export const ELECTION_TYPE_LABELS: Record<ElectionType, string> = {
  [ElectionType.PRESIDENTIAL]: 'Presidential',
  [ElectionType.STUDENT_UNION]: 'Student Union',
  [ElectionType.DEPARTMENTAL]: 'Departmental',
  [ElectionType.FACULTY]: 'Faculty',
  [ElectionType.CLUB]: 'Club',
  [ElectionType.SOCIETY]: 'Society',
  [ElectionType.REFERENDUM]: 'Referendum',
  [ElectionType.POLL]: 'Poll'
};

export const ELECTION_STATUS_LABELS: Record<ElectionStatus, string> = {
  [ElectionStatus.DRAFT]: 'Draft',
  [ElectionStatus.SCHEDULED]: 'Scheduled',
  [ElectionStatus.ACTIVE]: 'Active',
  [ElectionStatus.PAUSED]: 'Paused',
  [ElectionStatus.COMPLETED]: 'Completed',
  [ElectionStatus.CANCELLED]: 'Cancelled',
  [ElectionStatus.ARCHIVED]: 'Archived'
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.MODERATOR]: 'Moderator',
  [UserRole.VOTER]: 'Voter'
};

export const CANDIDATE_STATUS_LABELS: Record<CandidateStatus, string> = {
  [CandidateStatus.PENDING]: 'Pending',
  [CandidateStatus.APPROVED]: 'Approved',
  [CandidateStatus.REJECTED]: 'Rejected',
  [CandidateStatus.DISQUALIFIED]: 'Disqualified',
  [CandidateStatus.WITHDRAWN]: 'Withdrawn'
};