// lib/types.ts
// Frontend types that exactly match backend types

import {
  UserRole,
  ElectionType,
  ElectionStatus,
  TokenType,
  CandidateStatus,
  SessionStatus,
  FileCategory,
  AccessLevel,
  Permission,
  NotificationType,
  ActivityType,
  AuditCategory,
  AuditSeverity,
  SystemStatus,
  ConnectionStatus,
  NotificationPriority,
  BackupType,
  BackupStatus,
  AchievementType,
  SocialPlatform,
  ProfileVisibility,
  Theme,
  IssueCategory,
  IssuePriority,
  IssueStatus,
  CampaignStatus,
  TaskType,
  TaskPriority,
  TaskStatus,
  AnalyticsEventType
} from './enums';

// User and Authentication Types - Exactly matching backend auth.types.ts
export interface SafeUser {
  id: string;
  studentId: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  profileImage?: string;
  faculty: string;
  department: string;
  course: string;
  yearOfStudy: number;
  admissionYear: number;
  role: UserRole;
  permissions: string[];
  isActive: boolean;
  isVerified: boolean;
  emailVerified?: Date;
  phoneVerified?: Date;
  twoFactorEnabled: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterUserRequest {
  studentId: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  faculty: string;
  department: string;
  course: string;
  yearOfStudy: number;
  admissionYear: number;
}

export interface RegisterUserResponse {
  user: SafeUser;
  tokens: TokenPair;
  emailVerificationSent: boolean;
}

export interface LoginRequest {
  identifier: string; // email or studentId
  password: string;
  deviceInfo?: DeviceInfo;
  twoFactorCode?: string;
}

export interface LoginResponse {
  user: SafeUser;
  tokens: TokenPair;
  requiresTwoFactor: boolean;
  sessionId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
  deviceInfo?: DeviceInfo;
}

export interface DeviceInfo {
  userAgent: string;
  ipAddress: string;
  deviceFingerprint?: string;
  platform?: string;
  browser?: string;
  location?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordResetResponse {
  message: string;
  success: boolean;
}

export interface EmailVerificationRequest {
  token: string;
  userId?: string;
}

export interface EmailVerificationResponse {
  message: string;
  success: boolean;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerificationRequest {
  userId: string;
  token: string;
  type: 'setup' | 'login' | 'disable';
}

export interface TwoFactorVerificationResponse {
  success: boolean;
  message: string;
  backupCodes?: string[];
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  deviceInfo: DeviceInfo;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface LogoutRequest {
  refreshToken?: string;
  logoutAll?: boolean;
}

export interface LogoutResponse {
  message: string;
  success: boolean;
}

export interface AccountStatusResponse {
  isLocked: boolean;
  lockReason?: string;
  lockedUntil?: Date;
  loginAttempts: number;
  maxLoginAttempts: number;
  requiresVerification: boolean;
  verificationTypes: ('email' | 'phone')[];
}

export interface ExtendedJWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
  deviceFingerprint?: string;
  permissions?: string[];
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

// Election Types - Exactly matching backend election.types.ts
export interface CreateElectionData {
  title: string;
  description: string;
  type: ElectionType;
  startDate: Date;
  endDate: Date;
  registrationStart?: Date;
  registrationEnd?: Date;
  eligibleFaculties?: string[];
  eligibleDepartments?: string[];
  eligibleCourses?: string[];
  eligibleYears?: number[];
  minVoterAge?: number;
  maxVoterAge?: number;
  maxVotesPerPosition?: number;
  allowAbstain?: boolean;
  requireAllPositions?: boolean;
  showLiveResults?: boolean;
  requireTwoFactor?: boolean;
  encryptVotes?: boolean;
  anonymousVoting?: boolean;
  coverImage?: string;
  rules?: any;
  positions: CreatePositionData[];
}

export interface CreatePositionData {
  name: string;
  description?: string;
  order: number;
  maxSelections: number;
  minSelections: number;
}

export interface UpdateElectionData extends Partial<CreateElectionData> {
  status?: ElectionStatus;
}

export interface Election {
  id: string;
  title: string;
  description: string;
  type: ElectionType;
  status: ElectionStatus;
  startDate: Date;
  endDate: Date;
  registrationStart?: Date;
  registrationEnd?: Date;
  eligibleFaculties?: string[];
  eligibleDepartments?: string[];
  eligibleCourses?: string[];
  eligibleYears?: number[];
  minVoterAge?: number;
  maxVoterAge?: number;
  maxVotesPerPosition?: number;
  allowAbstain?: boolean;
  requireAllPositions?: boolean;
  showLiveResults?: boolean;
  requireTwoFactor?: boolean;
  encryptVotes?: boolean;
  anonymousVoting?: boolean;
  coverImage?: string;
  rules?: any;
  totalEligibleVoters?: number;
  totalVotesCast?: number;
  turnoutPercentage?: number;
  totalVotes?: number;
  isPublished?: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  positions?: Position[];
  candidates?: Candidate[];
  results?: Result[];
  creator?: Partial<SafeUser>;
  admins?: Partial<SafeUser>[];
}

export interface Position {
  id: string;
  electionId: string;
  name: string;
  description?: string;
  requirementDescription?: string;
  order: number;
  maxSelections: number;
  minSelections: number;
  candidates?: Candidate[];
  votes?: Partial<Vote>[];
  results?: Result[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  faculty: string;
  department: string;
  course?: string;
  yearOfStudy?: number;
  manifesto?: string;
  slogan?: string;
  photo?: string;
  bannerImage?: string;
  socialMedia?: any;
  userId?: string;
  positionId: string;
  electionId: string;
  status: CandidateStatus;
  verifiedAt?: Date;
  disqualifiedAt?: Date;
  disqualifiedReason?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: Partial<SafeUser>;
  position?: Position;
  election?: Election;
  votes?: Partial<Vote>[];
  results?: Result[];
  runningMate?: Candidate;
  runningMateFor?: Candidate;
  runningMateId?: string;
}

// Voting Types
export interface Vote {
  id: string;
  electionId: string;
  positionId: string;
  candidateId?: string;
  voterId: string;
  sessionId: string;
  voteHash: string;
  encryptedVote?: string;
  verificationCode: string;
  verified: boolean;
  isAbstain: boolean;
  castAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VotingSession {
  id: string;
  userId: string;
  electionId: string;
  status: SessionStatus;
  startedAt: Date;
  completedAt?: Date;
  expiresAt: Date;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface BallotData {
  electionId: string;
  sessionId: string;
  votes: PositionVote[];
  deviceFingerprint?: string;
}

export interface PositionVote {
  positionId: string;
  candidateIds: string[];
  abstain?: boolean;
}

export interface VoteReceipt {
  id: string;
  electionId: string;
  voterId: string;
  sessionId: string;
  verificationCode: string;
  encryptedVote?: string;
  receiptHash: string;
  timestamp: Date;
  verified: boolean;
  positions: PositionVoteReceipt[];
}

export interface PositionVoteReceipt {
  positionId: string;
  positionName: string;
  candidateNames: string[];
  abstained: boolean;
}

// Results Types
export interface Result {
  id: string;
  electionId: string;
  positionId: string;
  candidateId: string;
  voteCount: number;
  percentage: number;
  rank: number;
  isWinner: boolean;
  createdAt: Date;
  updatedAt: Date;
  candidate?: Candidate;
  position?: Position;
  election?: Election;
}

export interface ElectionResults {
  electionId: string;
  election: Election;
  totalVotes: number;
  totalEligibleVoters: number;
  turnoutPercentage: number;
  positionResults: PositionResult[];
  lastUpdated: Date;
}

export interface PositionResult {
  position: Position;
  totalVotes: number;
  abstainedVotes: number;
  results: Result[];
  winner?: Result;
}

// Statistics Types
export interface ElectionStats {
  totalEligibleVoters: number;
  totalVotesCast: number;
  turnoutPercentage: number;
  positionStats: PositionStats[];
  timeStats: TimeStats;
  demographicStats: DemographicStats;
  votingProgress: VotingProgress;
}

export interface PositionStats {
  positionId: string;
  positionName: string;
  totalCandidates: number;
  totalVotes: number;
  turnoutPercentage: number;
}

export interface TimeStats {
  hoursRemaining: number;
  votingProgress: number;
  peakVotingHours: PeakHour[];
}

export interface PeakHour {
  hour: number;
  voteCount: number;
}

export interface DemographicStats {
  byFaculty: DemographicBreakdown[];
  byYearOfStudy: DemographicBreakdown[];
  byDepartment: DemographicBreakdown[];
}

export interface DemographicBreakdown {
  name: string;
  faculty?: string;
  department?: string;
  year?: number;
  count: number;
  percentage: number;
}

export interface VotingProgress {
  electionId: string;
  totalEligibleVoters: number;
  totalVotesCast: number;
  currentTurnout: number;
  averageVotingTime: number;
  activeVoters: number;
  completedVoters: number;
  hourlyProgress: HourlyProgress[];
}

export interface HourlyProgress {
  hour: string;
  votes: number;
  cumulative: number;
}

// Dashboard Types - Matching backend dashboard.types.ts
export interface VoterDashboardData {
  profile: VoterProfile;
  eligibleElections: EligibleElection[];
  votingHistory: VotingHistoryItem[];
  notifications: DashboardNotification[];
  upcomingElections: UpcomingElection[];
  recentResults: RecentResult[];
  statistics: VoterStatistics;
}

export interface VoterProfile {
  userId: string;
  name: string;
  studentId: string;
  faculty: string;
  department: string;
  yearOfStudy: number;
  profileImage?: string;
  verificationStatus: 'verified' | 'unverified';
  totalVotesCast: number;
  electionsParticipated: number;
}

export interface EligibleElection {
  electionId: string;
  title: string;
  type: ElectionType;
  status: ElectionStatus;
  startDate: Date;
  endDate: Date;
  hasVoted: boolean;
  positionsCount: number;
}

export interface VotingHistoryItem {
  electionId: string;
  electionTitle: string;
  votedAt: Date;
  verificationCode: string;
  verified: boolean;
  positionsVoted: number;
}

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'election' | 'vote' | 'result';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  createdAt: Date;
  expiresAt?: Date;
  data?: Record<string, any>;
}

export interface UpcomingElection {
  electionId: string;
  title: string;
  type: ElectionType;
  startDate: Date;
  coverImage?: string;
  daysUntil: number;
}

export interface RecentResult {
  electionId: string;
  electionTitle: string;
  completedDate: Date;
  winners: Array<{
    position: string;
    candidateName: string;
    votePercentage: number;
  }>;
}

export interface VoterStatistics {
  participationRate: number;
  electionsEligible: number;
  electionsVoted: number;
  upcomingElections: number;
  verificationRate: number;
}

export interface AdminDashboardData {
  overview: AdminOverview;
  elections: AdminElectionSummary[];
  users: AdminUserSummary;
  candidates: AdminCandidateSummary;
  voting: AdminVotingSummary;
  system: SystemHealth;
  analytics: AdminAnalytics;
  alerts: SystemAlert[];
  recentActivity: AdminActivity[];
  reports: AvailableReport[];
}

export interface AdminOverview {
  totalElections: number;
  activeElections: number;
  totalUsers: number;
  activeUsers: number;
  totalVotes: number;
  todayVotes: number;
  systemUptime: number;
  lastBackup: Date;
  serverLoad: number;
  databaseSize: number;
  storageUsed: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  totalCandidates: number;
  pendingCandidates: number;
}

export interface AdminElectionSummary {
  id: string;
  title: string;
  status: ElectionStatus;
  type: ElectionType;
  startDate: Date;
  endDate: Date;
  totalVotes: number;
  turnoutPercentage: number;
  positionsCount: number;
  candidatesCount: number;
}

export interface AdminUserSummary {
  total: number;
  verified: number;
  unverified: number;
  active: number;
  suspended: number;
  byRole: Record<UserRole, number>;
  byFaculty: Record<string, number>;
  recentRegistrations: number;
}

export interface AdminCandidateSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  disqualified: number;
  byElection: Record<string, number>;
}

export interface AdminVotingSummary {
  totalVotes: number;
  totalVotesCast: number;
  todayVotes: number;
  votesToday: number;
  votesThisWeek: number;
  averageTurnout: number;
  averageVotingTime: number;
  peakVotingHour: number;
  activeVoters: number;
  verifiedVotes: number;
  unverifiedVotes: number;
  votesByElection: Array<{
    electionId: string;
    electionTitle: string;
    voteCount: number;
    turnoutPercentage: number;
  }>;
  votingTrends: Array<{
    date: string;
    votes: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    percentage: number;
  }>;
}

export interface SystemHealth {
  overall?: 'healthy' | 'warning' | 'critical';
  status: SystemStatus;
  database: {
    status: 'connected' | 'disconnected' | 'slow';
    responseTime: number;
    connections: number;
    maxConnections: number;
  };
  redis: {
    status: 'connected' | 'disconnected' | 'slow';
    memory: number;
    maxMemory: number;
    hitRate: number;
  };
  storage: {
    used: number;
    available: number;
    percentage: number;
  };
  server: {
    cpu: number;
    memory: number;
    disk: number;
    uptime: number;
  };
  websocket?: {
    connections: number;
    maxConnections: number;
    messageRate: number;
  };
  lastChecked: Date;
  cpu: number;
  memory: number;
  disk: number;
}

export interface AdminAnalytics {
  votingTrends: Array<{
    date: string;
    votes: number;
  }>;
  topElections: Array<{
    title: string;
    votes: number;
  }>;
  userGrowth: Array<{
    month: string;
    users: number;
  }>;
  systemPerformance: Array<{
    metric: string;
    value: number;
    status: 'good' | 'warning' | 'critical';
  }>;
}

export interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AdminActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target?: string;
  timestamp: Date;
  ipAddress?: string;
}

export interface AvailableReport {
  id: string;
  name: string;
  description: string;
  type: 'election' | 'user' | 'voting' | 'audit' | 'system';
  lastGenerated?: Date;
  canGenerate: boolean;
}

export interface CandidateDashboardData {
  profile: CandidateProfile;
  applications: CandidateApplication[];
  campaigns: Campaign[];
  elections: CandidateElection[];
  analytics: CandidateAnalytics;
  notifications: DashboardNotification[];
  tasks: CandidateTask[];
}

export interface CandidateProfile {
  candidateId: string;
  name: string;
  email: string;
  phone?: string;
  faculty: string;
  department: string;
  photo?: string;
  totalApplications: number;
  approvedApplications: number;
  wonElections: number;
}

export interface CandidateApplication {
  id: string;
  electionTitle: string;
  position: string;
  status: CandidateStatus;
  appliedAt: Date;
  reviewedAt?: Date;
  feedback?: string;
}

export interface Campaign {
  id: string;
  candidateId: string;
  electionId: string;
  electionTitle?: string;
  name: string;
  position?: string;
  slogan?: string;
  description: string;
  manifesto: string;
  logo?: string;
  bannerImage?: string;
  colors?: any;
  email?: string;
  phone?: string;
  website?: string;
  socialMedia?: any;
  status: CampaignStatus;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  viewCount: number;
  shareCount: number;
  engagementRate: number;
  supporters?: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  candidate?: Candidate;
  election?: Election;
  approver?: SafeUser;
  tasks?: Task[];
}

export interface CandidateElection {
  electionId: string;
  title: string;
  position: string;
  status: ElectionStatus;
  result?: 'won' | 'lost' | 'pending';
  voteCount?: number;
  votePercentage?: number;
  rank?: number;
}

export interface CandidateAnalytics {
  totalVotes: number;
  averageVotePercentage: number;
  campaignReach: number;
  supportTrend: Array<{
    date: string;
    supporters: number;
  }>;
}

export interface CandidateTask {
  id: string;
  title: string;
  description: string;
  dueDate?: Date;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

// Audit Types
export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  category: AuditCategory;
  severity: AuditSeverity;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// File Upload Types
export interface FileUpload {
  id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

// Filter and Search Types
export interface ElectionFilters {
  status?: ElectionStatus;
  type?: ElectionType;
  createdById?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
  electionId?: string;
}

export interface VotingSessionUpdate {
  electionId: string;
  activeVoters: number;
  totalVotes: number;
  turnout: number;
  recentVotes: Array<{
    timestamp: Date;
    positionName: string;
    faculty: string;
  }>;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface FormFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: Date;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
}

// Notification Types
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

// Two-Factor Authentication Types
export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  token: string;
  type: 'setup' | 'login' | 'disable';
}

// File Types - Matching backend file.types.ts
export interface FileUploadConfig {
  category: FileCategory;
  destination: string;
  allowedTypes: string[];
  maxSize: number;
  generateThumbnail?: boolean;
  thumbnailSize?: { width: number; height: number };
  accessLevel?: AccessLevel;
}

export interface UploadedFile {
  id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  category: FileCategory;
  accessLevel: AccessLevel;
  uploadedBy: string;
  uploadedAt: Date;
  metadata?: any;
}

// Form Types
export interface ElectionFormData {
  title: string;
  description: string;
  type: ElectionType;
  startDate: Date;
  endDate: Date;
  registrationStart?: Date;
  registrationEnd?: Date;
  eligibleFaculties?: string[];
  eligibleDepartments?: string[];
  eligibleCourses?: string[];
  eligibleYears?: number[];
  allowAbstain?: boolean;
  requireAllPositions?: boolean;
  showLiveResults?: boolean;
  requireTwoFactor?: boolean;
  coverImage?: File;
  positions: PositionFormData[];
}

export interface PositionFormData {
  name: string;
  description?: string;
  order: number;
  maxSelections: number;
  minSelections: number;
}

export interface CandidateFormData {
  userId: string;
  positionId: string;
  manifestoFile?: File;
  profileImage?: File;
  runningMateId?: string;
}

export interface VoterImportData {
  file: File;
  skipDuplicates: boolean;
  updateExisting: boolean;
}

// Chart Data Types
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

// Theme Types
export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

// Store Types (Zustand)
export interface AuthStore {
  user: SafeUser | null;
  tokens: TokenPair | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterUserRequest) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<SafeUser>) => void;
}

export interface ElectionStore {
  elections: Election[];
  currentElection: Election | null;
  isLoading: boolean;
  fetchElections: (filters?: ElectionFilters) => Promise<void>;
  fetchElection: (id: string) => Promise<void>;
  createElection: (data: ElectionFormData) => Promise<Election>;
  updateElection: (id: string, data: Partial<ElectionFormData>) => Promise<Election>;
  deleteElection: (id: string) => Promise<void>;
}

export interface VotingStore {
  currentVote: BallotData | null;
  votedElections: string[];
  isVoting: boolean;
  setCurrentVote: (vote: BallotData) => void;
  submitVote: () => Promise<VoteReceipt>;
  clearCurrentVote: () => void;
  addVotedElection: (electionId: string) => void;
}

export interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

// =============================================================================
// COMPREHENSIVE TYPES FROM BACKEND - EXACT MATCHES
// =============================================================================

// Enhanced Voting Types from backend vote.types.ts
export interface StartVotingSessionRequest {
  electionId: string;
  deviceFingerprint?: string;
}

export interface StartVotingSessionResponse {
  sessionId: string;
  sessionToken: string;
  expiresAt: Date;
  ballot: ElectionBallot;
  remainingTime: number;
}

export interface VotingSessionDetails {
  id: string;
  voterId: string;
  electionId: string;
  status: SessionStatus;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint?: string;
  sessionToken: string;
  expiresAt: Date;
  startedAt: Date;
  lastActivityAt: Date;
  completedAt?: Date;
  votesSubmitted: number;
  totalPositions: number;
}

export interface ElectionBallot {
  electionId: string;
  electionTitle: string;
  electionDescription: string;
  positions: BallotPosition[];
  rules: BallotRules;
  voterEligibility: VoterEligibility;
}

export interface BallotPosition {
  id: string;
  name: string;
  description?: string;
  order: number;
  maxSelections: number;
  minSelections: number;
  candidates: BallotCandidate[];
  allowAbstain: boolean;
}

export interface BallotCandidate {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  photo?: string;
  manifesto?: string;
  slogan?: string;
  socialMedia?: Record<string, string>;
  runningMate?: BallotCandidate;
  isRunningMate: boolean;
  party?: string;
  faculty: string;
  department: string;
  yearOfStudy: number;
}

export interface BallotRules {
  allowAbstain: boolean;
  requireAllPositions: boolean;
  maxVotesPerPosition: number;
  requireTwoFactor: boolean;
  anonymousVoting: boolean;
  votingTimeLimit?: number;
}

export interface VoterEligibility {
  isEligible: boolean;
  reasons?: string[];
  requirements: {
    faculty?: string[];
    departments?: string[];
    courses?: string[];
    years?: number[];
    minAge?: number;
    maxAge?: number;
  };
}

// Enhanced Dashboard Types from backend dashboard.types.ts
export interface ActivityItem {
  id: string;
  type: 'user_registration' | 'election_created' | 'vote_cast' | 'candidate_registered' | 'election_started' | 'election_ended';
  description: string;
  userId?: string;
  electionId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface EligibleElection {
  id: string;
  title: string;
  description: string;
  type: ElectionType;
  status: ElectionStatus;
  startDate: Date;
  endDate: Date;
  totalPositions: number;
  hasVoted: boolean;
  canVote: boolean;
  timeRemaining?: {
    days: number;
    hours: number;
    minutes: number;
  };
  coverImage?: string;
  turnoutPercentage: number;
}

export interface VotingHistoryItem {
  id: string;
  electionId: string;
  electionTitle: string;
  electionType: ElectionType;
  votedAt: Date;
  positionsVoted: number;
  totalPositions: number;
  verificationCode: string;
  status: 'verified' | 'pending' | 'invalid';
}

export interface VoterStatistics {
  totalElectionsParticipated: number;
  totalVotesCast: number;
  participationRate: number;
  lastVoteDate?: Date;
  averageVotingTime: number;
  favoriteElectionType: ElectionType;
  yearlyParticipation: Array<{
    year: number;
    elections: number;
    votes: number;
  }>;
}

export interface CandidateApplication {
  id: string;
  electionId: string;
  electionTitle: string;
  positionId: string;
  positionName: string;
  status: CandidateStatus;
  appliedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  feedback?: string;
  manifesto: string;
  photo?: string;
  bannerImage?: string;
  socialMedia?: Record<string, string>;
}

export interface CampaignMaterial {
  id: string;
  type: 'poster' | 'flyer' | 'video' | 'audio' | 'document';
  title: string;
  description?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
  downloads: number;
  views: number;
}

export interface CampaignEvent {
  id: string;
  title: string;
  description: string;
  type: 'rally' | 'debate' | 'meet_and_greet' | 'online_session';
  venue?: string;
  virtualLink?: string;
  startDate: Date;
  endDate: Date;
  attendees: number;
  maxAttendees?: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

export interface Endorsement {
  id: string;
  endorserName: string;
  endorserTitle: string;
  message: string;
  endorsedAt: Date;
  isPublic: boolean;
}

export interface AdminUserSummary {
  totalUsers: number;
  verifiedUsers: number;
  activeUsers: number;
  newRegistrations: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  usersByRole: Array<{
    role: UserRole;
    count: number;
  }>;
  usersByFaculty: Array<{
    faculty: string;
    count: number;
  }>;
  pendingVerifications: number;
  suspendedUsers: number;
}

export interface AdminCandidateSummary {
  totalCandidates: number;
  pendingApprovals: number;
  approvedCandidates: number;
  rejectedCandidates: number;
  candidatesByElection: Array<{
    electionId: string;
    electionTitle: string;
    candidateCount: number;
  }>;
  candidatesByStatus: Array<{
    status: CandidateStatus;
    count: number;
  }>;
  recentApplications: Array<{
    candidateId: string;
    candidateName: string;
    electionTitle: string;
    positionName: string;
    appliedAt: Date;
  }>;
}

// File Management Types from backend file.types.ts
export interface FileUploadRequest {
  category: FileCategory;
  subCategory?: string;
  tags?: string[];
  isPublic?: boolean;
  accessLevel?: AccessLevel;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

export interface FileUploadResult {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
  category: FileCategory;
  uploadedById?: string;
  createdAt: Date;
}

export interface FileUploadOptions {
  destination: string;
  allowedTypes: string[];
  maxSize: number;
  generateThumbnail?: boolean;
  thumbnailSize?: { width: number; height: number };
  compress?: boolean;
  quality?: number;
  watermark?: boolean;
  watermarkText?: string;
}

export interface FileInfo {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
  category: FileCategory;
  subCategory?: string;
  tags: string[];
  thumbnailUrl?: string;
  isPublic: boolean;
  accessLevel: AccessLevel;
  downloadCount: number;
  checksum?: string;
  metadata?: Record<string, any>;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastAccessed: Date;
  expiresAt?: Date;
}

export interface ImageProcessingOptions {
  resize?: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    position?: string;
  };
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  blur?: number;
  sharpen?: boolean;
  grayscale?: boolean;
  normalize?: boolean;
  rotate?: number;
  flip?: boolean;
  flop?: boolean;
  watermark?: {
    text?: string;
    image?: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity?: number;
  };
}

// Enhanced Security Types
export interface SecurityEventType {
  LOGIN_SUCCESS: 'login_success';
  LOGIN_FAILURE: 'login_failure';
  PASSWORD_CHANGE: 'password_change';
  PASSWORD_RESET: 'password_reset';
  TWO_FACTOR_ENABLED: 'two_factor_enabled';
  TWO_FACTOR_DISABLED: 'two_factor_disabled';
  ACCOUNT_LOCKED: 'account_locked';
  ACCOUNT_UNLOCKED: 'account_unlocked';
  SUSPICIOUS_ACTIVITY: 'suspicious_activity';
  TOKEN_REFRESH: 'token_refresh';
  LOGOUT: 'logout';
}

export interface SecurityEvent {
  type: keyof SecurityEventType;
  userId: string;
  deviceInfo: DeviceInfo;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface RateLimitInfo {
  key: string;
  windowStart: Date;
  windowEnd: Date;
  requests: number;
  limit: number;
  remaining: number;
  resetTime: Date;
}

// User Management Types
export interface UserManagementRequest {
  action: 'activate' | 'deactivate' | 'lock' | 'unlock' | 'reset_password' | 'force_logout';
  userId: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface UserManagementResponse {
  success: boolean;
  message: string;
  user?: SafeUser;
}

export interface BatchUserUpdate {
  userIds: string[];
  updates: Partial<Pick<SafeUser, 'isActive' | 'role' | 'permissions'>>;
  reason?: string;
}

export interface BatchUpdateResponse {
  success: number;
  failed: number;
  errors: Array<{
    userId: string;
    error: string;
  }>;
}

// Account Recovery Types
export interface AccountRecoveryRequest {
  identifier: string; // email or studentId
  method: 'email' | 'phone' | 'security_questions';
}

export interface AccountRecoveryResponse {
  success: boolean;
  message: string;
  method: string;
  nextStep?: string;
}

// Achievement System Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: AchievementType;
  icon?: string;
  badgeColor?: string;
  criteria: any; // Flexible criteria for different achievement types
  points: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  completed: boolean;
  completedAt?: Date;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  achievement?: Achievement;
}

// Social Media Types
export interface SocialMedia {
  id: string;
  userId: string;
  platform: SocialPlatform;
  username: string;
  url: string;
  verified: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User Preferences Types
export interface UserPreferences {
  id: string;
  userId: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  electionReminders: boolean;
  resultNotifications: boolean;
  campaignUpdates: boolean;
  profileVisibility: ProfileVisibility;
  showVotingHistory: boolean;
  showAchievements: boolean;
  theme: Theme;
  language: string;
  timezone: string;
  highContrast: boolean;
  largeFonts: boolean;
  screenReader: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Issue Reporting Types
export interface IssueReport {
  id: string;
  reportedBy: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  page?: string;
  userAgent?: string;
  errorDetails?: any;
  screenshots: string[];
  assignedTo?: string;
  resolvedBy?: string;
  resolution?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  reporter?: SafeUser;
  assignee?: SafeUser;
  resolver?: SafeUser;
}

// Task Management Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo?: string;
  assignedBy: string;
  entityType?: string;
  entityId?: string;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  assignee?: SafeUser;
  creator?: SafeUser;
  completer?: SafeUser;
}

// Analytics Types
export interface Analytics {
  id: string;
  eventType: AnalyticsEventType;
  entityType: string;
  entityId?: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  country?: string;
  region?: string;
  city?: string;
  eventData?: any;
  duration?: number;
  timestamp: Date;
  date: Date;
  user?: SafeUser;
}

// Backup Types
export interface Backup {
  id: string;
  name: string;
  description?: string;
  type: BackupType;
  status: BackupStatus;
  filePath?: string;
  fileSize?: number;
  checksum?: string;
  tables: string[];
  recordCount?: number;
  compressionRatio?: number;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  createdBy?: string;
  createdAt: Date;
  expiresAt?: Date;
  creator?: SafeUser;
}

// Additional Interface Extensions
export interface ElectionWithRelations extends Election {
  positions: (Position & {
    candidates?: (Candidate & {
      user?: Partial<SafeUser>;
    })[];
  })[];
  candidates: (Candidate & {
    position?: Position;
    user?: Partial<SafeUser>;
  })[];
  votes: Partial<Vote>[];
  results: (Result & {
    candidate?: Candidate;
    position?: Position;
  })[];
  creator: Partial<SafeUser>;
  admins: Partial<SafeUser>[];
}

export interface ElectionPermission {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canStart: boolean;
  canEnd: boolean;
  canPause: boolean;
  canViewStats: boolean;
  canManageVoters: boolean;
  canExport: boolean;
}

export interface ElectionNotification {
  id: string;
  electionId: string;
  type: string;
  scheduledFor: Date;
  sent: boolean;
  sentAt?: Date;
  subject: string;
  template: string;
  data: any;
}

// Vote-related types that were missing
export interface VoteVerificationRequest {
  verificationCode: string;
}

export interface VoteVerificationResponse {
  verified: boolean;
  voteDetails: {
    electionId: string;
    electionTitle: string;
    positionName: string;
    candidateName?: string;
    isAbstain: boolean;
    castAt: Date;
    voteHash: string;
  };
  integrity: {
    hashValid: boolean;
    encryptionValid: boolean;
    sequenceValid: boolean;
  };
}

export interface VotingAnalytics {
  electionId: string;
  totalEligibleVoters: number;
  totalVotesCast: number;
  turnoutPercentage: number;
  votingProgress: VotingProgressData;
  demographicBreakdown: DemographicVotingData;
  timeBasedAnalytics: TimeBasedVotingData;
  deviceAnalytics: DeviceVotingData;
  securityMetrics: VotingSecurityMetrics;
}

export interface VotingProgressData {
  hourly: Array<{
    hour: string;
    votes: number;
    cumulative: number;
    turnoutRate: number;
  }>;
  byPosition: Array<{
    positionId: string;
    positionName: string;
    votesCast: number;
    turnoutPercentage: number;
    abstainVotes: number;
  }>;
  realTimeStats: {
    activeVoters: number;
    averageVotingTime: number;
    completionRate: number;
    averageTimePerPosition: number;
  };
}

export interface DemographicVotingData {
  byFaculty: Array<{
    faculty: string;
    totalEligible: number;
    votesCast: number;
    turnoutPercentage: number;
  }>;
  byDepartment: Array<{
    department: string;
    faculty: string;
    totalEligible: number;
    votesCast: number;
    turnoutPercentage: number;
  }>;
  byYear: Array<{
    year: number;
    totalEligible: number;
    votesCast: number;
    turnoutPercentage: number;
  }>;
  byAge: Array<{
    ageRange: string;
    totalEligible: number;
    votesCast: number;
    turnoutPercentage: number;
  }>;
}

export interface TimeBasedVotingData {
  peakHours: Array<{
    hour: number;
    voteCount: number;
    isWeekend: boolean;
  }>;
  dailyTrends: Array<{
    date: string;
    votes: number;
    uniqueVoters: number;
    averageSessionTime: number;
  }>;
  sessionDurations: {
    average: number;
    median: number;
    shortest: number;
    longest: number;
    distribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
  };
}

export interface DeviceVotingData {
  platforms: Array<{
    platform: string;
    count: number;
    percentage: number;
  }>;
  browsers: Array<{
    browser: string;
    version?: string;
    count: number;
    percentage: number;
  }>;
  devices: Array<{
    deviceType: 'mobile' | 'tablet' | 'desktop';
    count: number;
    percentage: number;
  }>;
  locations: Array<{
    location: string;
    count: number;
    percentage: number;
  }>;
}

export interface VotingSecurityMetrics {
  duplicateAttempts: number;
  invalidSessions: number;
  suspiciousActivity: number;
  failedVerifications: number;
  encryptionFailures: number;
  integrityChecks: {
    passed: number;
    failed: number;
    warningsCount: number;
  };
  deviceFingerprinting: {
    unique: number;
    duplicates: number;
    conflicts: number;
  };
}

// Real-time Dashboard Updates
export interface DashboardUpdate {
  type: 'stats' | 'notification' | 'activity' | 'alert' | 'election' | 'vote';
  data: any;
  timestamp: Date;
  targetUsers?: string[];
  targetRoles?: UserRole[];
}

// Dashboard Filter Types
export interface DashboardFilters {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  electionTypes?: ElectionType[];
  electionStatuses?: ElectionStatus[];
  faculties?: string[];
  departments?: string[];
  userRoles?: UserRole[];
  candidateStatuses?: CandidateStatus[];
}