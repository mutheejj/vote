// lib/utils/permissions.ts
// Comprehensive permission utilities for the voting system

import { UserRole, Permission, PERMISSIONS, ROLE_PERMISSIONS } from '../enums';
import { SafeUser } from '../types';

// ============================================================================
// PERMISSION CHECKING
// ============================================================================

/**
 * Check if user has specific permission
 */
export function hasPermission(user: SafeUser | null, permission: Permission): boolean {
  if (!user) return false;

  // Super admins have all permissions
  if (user.role === UserRole.SUPER_ADMIN) return true;

  // Check user's direct permissions
  if (user.permissions && user.permissions.includes(permission)) return true;

  // Check role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: SafeUser | null, permissions: Permission[]): boolean {
  if (!user || !permissions.length) return false;

  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(user: SafeUser | null, permissions: Permission[]): boolean {
  if (!user || !permissions.length) return false;

  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Check if user has specific role
 */
export function hasRole(user: SafeUser | null, role: UserRole): boolean {
  if (!user) return false;
  return user.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: SafeUser | null, roles: UserRole[]): boolean {
  if (!user || !roles.length) return false;

  return roles.includes(user.role);
}

/**
 * Check if user has role level or higher
 */
export function hasRoleLevel(user: SafeUser | null, minimumRole: UserRole): boolean {
  if (!user) return false;

  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.VOTER]: 1,
    [UserRole.MODERATOR]: 2,
    [UserRole.ADMIN]: 3,
    [UserRole.SUPER_ADMIN]: 4
  };

  const userLevel = roleHierarchy[user.role] || 0;
  const minimumLevel = roleHierarchy[minimumRole] || 0;

  return userLevel >= minimumLevel;
}

// ============================================================================
// FEATURE-SPECIFIC PERMISSIONS
// ============================================================================

/**
 * Check if user can manage elections
 */
export function canManageElections(user: SafeUser | null): boolean {
  return hasAnyPermission(user, [
    PERMISSIONS.ELECTION_CREATE,
    PERMISSIONS.ELECTION_UPDATE,
    PERMISSIONS.ELECTION_DELETE
  ]);
}

/**
 * Check if user can create elections
 */
export function canCreateElections(user: SafeUser | null): boolean {
  return hasPermission(user, PERMISSIONS.ELECTION_CREATE);
}

/**
 * Check if user can publish elections
 */
export function canPublishElections(user: SafeUser | null): boolean {
  return hasPermission(user, PERMISSIONS.ELECTION_PUBLISH);
}

/**
 * Check if user can manage candidates
 */
export function canManageCandidates(user: SafeUser | null): boolean {
  return hasAnyPermission(user, [
    PERMISSIONS.CANDIDATE_APPROVE,
    PERMISSIONS.CANDIDATE_REJECT,
    PERMISSIONS.CANDIDATE_DISQUALIFY
  ]);
}

/**
 * Check if user can approve candidates
 */
export function canApproveCandidates(user: SafeUser | null): boolean {
  return hasPermission(user, PERMISSIONS.CANDIDATE_APPROVE);
}

/**
 * Check if user can view vote data
 */
export function canViewVotes(user: SafeUser | null): boolean {
  return hasPermission(user, PERMISSIONS.VOTE_READ);
}

/**
 * Check if user can audit votes
 */
export function canAuditVotes(user: SafeUser | null): boolean {
  return hasPermission(user, PERMISSIONS.VOTE_AUDIT);
}

/**
 * Check if user can manage users
 */
export function canManageUsers(user: SafeUser | null): boolean {
  return hasAnyPermission(user, [
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_MANAGE_ROLES
  ]);
}

/**
 * Check if user can view results
 */
export function canViewResults(user: SafeUser | null): boolean {
  return hasPermission(user, PERMISSIONS.RESULT_READ);
}

/**
 * Check if user can publish results
 */
export function canPublishResults(user: SafeUser | null): boolean {
  return hasPermission(user, PERMISSIONS.RESULT_PUBLISH);
}

/**
 * Check if user can export results
 */
export function canExportResults(user: SafeUser | null): boolean {
  return hasPermission(user, PERMISSIONS.RESULT_EXPORT);
}

/**
 * Check if user can generate reports
 */
export function canGenerateReports(user: SafeUser | null): boolean {
  return hasPermission(user, PERMISSIONS.REPORT_GENERATE);
}

/**
 * Check if user can view analytics
 */
export function canViewAnalytics(user: SafeUser | null): boolean {
  return hasPermission(user, PERMISSIONS.ANALYTICS_VIEW);
}

/**
 * Check if user can access system settings
 */
export function canAccessSystemSettings(user: SafeUser | null): boolean {
  return hasPermission(user, PERMISSIONS.SYSTEM_CONFIG);
}

/**
 * Check if user can perform system maintenance
 */
export function canPerformMaintenance(user: SafeUser | null): boolean {
  return hasAnyPermission(user, [
    PERMISSIONS.SYSTEM_BACKUP,
    PERMISSIONS.SYSTEM_MONITOR
  ]);
}

// ============================================================================
// ELECTION-SPECIFIC PERMISSIONS
// ============================================================================

/**
 * Check if user can edit specific election
 */
export function canEditElection(user: SafeUser | null, election: { createdBy: string }): boolean {
  if (!user) return false;

  // Super admins and admins can edit any election
  if (hasRoleLevel(user, UserRole.ADMIN)) return true;

  // Election creators can edit their own elections
  if (election.createdBy === user.id && hasPermission(user, PERMISSIONS.ELECTION_UPDATE)) {
    return true;
  }

  return false;
}

/**
 * Check if user can delete specific election
 */
export function canDeleteElection(user: SafeUser | null, election: { createdBy: string }): boolean {
  if (!user) return false;

  // Only super admins and admins can delete elections
  if (hasRoleLevel(user, UserRole.ADMIN)) return true;

  // Election creators can delete their own elections if they have permission
  if (election.createdBy === user.id && hasPermission(user, PERMISSIONS.ELECTION_DELETE)) {
    return true;
  }

  return false;
}

/**
 * Check if user can start/stop election
 */
export function canControlElection(user: SafeUser | null, election: { createdBy: string }): boolean {
  if (!user) return false;

  // Admins can control any election
  if (hasRoleLevel(user, UserRole.ADMIN)) return true;

  // Election creators can control their own elections
  return election.createdBy === user.id && hasPermission(user, PERMISSIONS.ELECTION_PUBLISH);
}

// ============================================================================
// VOTING PERMISSIONS
// ============================================================================

/**
 * Check if user can vote in general
 */
export function canVote(user: SafeUser | null): boolean {
  if (!user) return false;

  // User must be active and verified
  if (!user.isActive || !user.isVerified) return false;

  // Must have voter role or higher
  return hasRoleLevel(user, UserRole.VOTER);
}

/**
 * Check if user is eligible for specific election
 */
export function isEligibleForElection(user: SafeUser | null, election: {
  eligibleFaculties?: string[];
  eligibleDepartments?: string[];
  eligibleCourses?: string[];
  eligibleYears?: number[];
  minVoterAge?: number;
  maxVoterAge?: number;
}): boolean {
  if (!user || !canVote(user)) return false;

  // Check faculty eligibility
  if (election.eligibleFaculties && election.eligibleFaculties.length > 0) {
    if (!election.eligibleFaculties.includes(user.faculty)) return false;
  }

  // Check department eligibility
  if (election.eligibleDepartments && election.eligibleDepartments.length > 0) {
    if (!election.eligibleDepartments.includes(user.department)) return false;
  }

  // Check course eligibility
  if (election.eligibleCourses && election.eligibleCourses.length > 0) {
    if (!election.eligibleCourses.includes(user.course)) return false;
  }

  // Check year of study eligibility
  if (election.eligibleYears && election.eligibleYears.length > 0) {
    if (!election.eligibleYears.includes(user.yearOfStudy)) return false;
  }

  // Age checks would require birth date in user profile
  // For now, we'll skip age checks

  return true;
}

/**
 * Check if user can register as candidate
 */
export function canRegisterAsCandidate(user: SafeUser | null): boolean {
  if (!user) return false;

  // Must be active, verified voter
  if (!canVote(user)) return false;

  // Must not be an admin (conflict of interest)
  if (hasRoleLevel(user, UserRole.ADMIN)) return false;

  return true;
}

// ============================================================================
// UI PERMISSIONS
// ============================================================================

/**
 * Check if user can access admin panel
 */
export function canAccessAdminPanel(user: SafeUser | null): boolean {
  return hasRoleLevel(user, UserRole.MODERATOR);
}

/**
 * Check if user can access candidate features
 */
export function canAccessCandidateFeatures(user: SafeUser | null): boolean {
  return canRegisterAsCandidate(user);
}

/**
 * Check if user can access voter features
 */
export function canAccessVoterFeatures(user: SafeUser | null): boolean {
  return canVote(user);
}

// ============================================================================
// PERMISSION UTILITIES
// ============================================================================

/**
 * Get all permissions for a user
 */
export function getUserPermissions(user: SafeUser | null): Permission[] {
  if (!user) return [];

  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  const userPermissions = (user.permissions || []) as Permission[];

  // Combine and deduplicate permissions
  const allPermissions = Array.from(new Set([...rolePermissions, ...userPermissions])) as Permission[];

  return allPermissions;
}

/**
 * Get missing permissions for a user
 */
export function getMissingPermissions(user: SafeUser | null, requiredPermissions: Permission[]): Permission[] {
  if (!user) return requiredPermissions;

  const userPermissions = getUserPermissions(user);
  return requiredPermissions.filter(permission => !userPermissions.includes(permission));
}

/**
 * Check if permission is valid
 */
export function isValidPermission(permission: string): permission is Permission {
  return Object.values(PERMISSIONS).includes(permission as Permission);
}

/**
 * Get permission description
 */
export function getPermissionDescription(permission: Permission): string {
  const descriptions: Record<Permission, string> = {
    [PERMISSIONS.USER_CREATE]: 'Create new users',
    [PERMISSIONS.USER_READ]: 'View user information',
    [PERMISSIONS.USER_UPDATE]: 'Update user information',
    [PERMISSIONS.USER_DELETE]: 'Delete users',
    [PERMISSIONS.USER_MANAGE_ROLES]: 'Manage user roles and permissions',

    [PERMISSIONS.ELECTION_CREATE]: 'Create new elections',
    [PERMISSIONS.ELECTION_READ]: 'View election information',
    [PERMISSIONS.ELECTION_UPDATE]: 'Update election settings',
    [PERMISSIONS.ELECTION_DELETE]: 'Delete elections',
    [PERMISSIONS.ELECTION_PUBLISH]: 'Publish and control elections',
    [PERMISSIONS.ELECTION_ARCHIVE]: 'Archive completed elections',

    [PERMISSIONS.VOTE_READ]: 'View voting data',
    [PERMISSIONS.VOTE_VERIFY]: 'Verify vote integrity',
    [PERMISSIONS.VOTE_AUDIT]: 'Audit voting processes',

    [PERMISSIONS.CANDIDATE_APPROVE]: 'Approve candidate applications',
    [PERMISSIONS.CANDIDATE_REJECT]: 'Reject candidate applications',
    [PERMISSIONS.CANDIDATE_DISQUALIFY]: 'Disqualify candidates',

    [PERMISSIONS.RESULT_READ]: 'View election results',
    [PERMISSIONS.RESULT_PUBLISH]: 'Publish election results',
    [PERMISSIONS.RESULT_EXPORT]: 'Export election results',

    [PERMISSIONS.SYSTEM_CONFIG]: 'Configure system settings',
    [PERMISSIONS.SYSTEM_BACKUP]: 'Perform system backups',
    [PERMISSIONS.SYSTEM_MONITOR]: 'Monitor system health',
    [PERMISSIONS.SYSTEM_AUDIT]: 'Access system audit logs',

    [PERMISSIONS.REPORT_GENERATE]: 'Generate reports',
    [PERMISSIONS.ANALYTICS_VIEW]: 'View analytics and statistics',
    [PERMISSIONS.ANALYTICS_EXPORT]: 'Export analytics data'
  };

  return descriptions[permission] || permission;
}

/**
 * Create permission guard for components
 */
export function createPermissionGuard(requiredPermissions: Permission[], requireAll = true) {
  return (user: SafeUser | null): boolean => {
    if (requireAll) {
      return hasAllPermissions(user, requiredPermissions);
    } else {
      return hasAnyPermission(user, requiredPermissions);
    }
  };
}

// Export all permission utilities
export default {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  hasRoleLevel,
  canManageElections,
  canCreateElections,
  canPublishElections,
  canManageCandidates,
  canApproveCandidates,
  canViewVotes,
  canAuditVotes,
  canManageUsers,
  canViewResults,
  canPublishResults,
  canExportResults,
  canGenerateReports,
  canViewAnalytics,
  canAccessSystemSettings,
  canPerformMaintenance,
  canEditElection,
  canDeleteElection,
  canControlElection,
  canVote,
  isEligibleForElection,
  canRegisterAsCandidate,
  canAccessAdminPanel,
  canAccessCandidateFeatures,
  canAccessVoterFeatures,
  getUserPermissions,
  getMissingPermissions,
  isValidPermission,
  getPermissionDescription,
  createPermissionGuard
};