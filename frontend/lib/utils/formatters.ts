// lib/utils/formatters.ts
// Comprehensive formatting utilities for the voting system

import { format, formatDistanceToNow, parseISO, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { ElectionType, ElectionStatus, CandidateStatus, UserRole } from '../enums';

// ============================================================================
// DATE AND TIME FORMATTING
// ============================================================================

/**
 * Format date with various patterns
 */
export function formatDate(date: Date | string, pattern = 'MMM dd, yyyy'): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, pattern);
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date | string, pattern = 'MMM dd, yyyy HH:mm'): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, pattern);
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date | string): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Format election time remaining
 */
export function formatTimeRemaining(endDate: Date | string): string {
  if (!endDate) return '';
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  const now = new Date();

  if (end <= now) return 'Ended';

  const days = differenceInDays(end, now);
  const hours = differenceInHours(end, now) % 24;
  const minutes = differenceInMinutes(end, now) % 60;

  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
}

/**
 * Format countdown timer (MM:SS format)
 */
export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '00:00';

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// NUMBER AND CURRENCY FORMATTING
// ============================================================================

/**
 * Format number with localization
 */
export function formatNumber(num: number, locale = 'en-US'): string {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format large numbers with abbreviations (K, M, B)
 */
export function formatCompactNumber(num: number, locale = 'en-US'): string {
  if (typeof num !== 'number' || isNaN(num)) return '0';

  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';

  return num.toString();
}

/**
 * Format percentage
 */
export function formatPercentage(num: number, decimals = 1): string {
  if (typeof num !== 'number' || isNaN(num)) return '0%';
  return `${num.toFixed(decimals)}%`;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================================================
// TEXT FORMATTING
// ============================================================================

/**
 * Format person's name
 */
export function formatName(firstName: string, lastName: string, middleName?: string): string {
  if (!firstName && !lastName) return '';

  const parts = [firstName, middleName, lastName].filter(Boolean);
  return parts.join(' ');
}

/**
 * Format name with initials
 */
export function formatNameWithInitials(firstName: string, lastName: string, middleName?: string): string {
  if (!firstName && !lastName) return '';

  if (middleName) {
    return `${firstName} ${middleName.charAt(0)}. ${lastName}`;
  }

  return `${firstName} ${lastName}`;
}

/**
 * Get initials from name
 */
export function getInitials(firstName: string, lastName: string, middleName?: string): string {
  const parts = [firstName, middleName, lastName].filter(Boolean);
  return parts.map(part => part?.charAt(0).toUpperCase() || '').join('');
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

/**
 * Truncate text by words
 */
export function truncateWords(text: string, maxWords: number): string {
  if (!text) return '';

  const words = text.split(' ');
  if (words.length <= maxWords) return text;

  return words.slice(0, maxWords).join(' ') + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convert to title case
 */
export function toTitleCase(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert camelCase to readable text
 */
export function camelCaseToText(text: string): string {
  if (!text) return '';
  return text
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

// ============================================================================
// VOTING SYSTEM SPECIFIC FORMATTING
// ============================================================================

/**
 * Format election type for display
 */
export function formatElectionType(type: ElectionType): string {
  const typeLabels: Record<ElectionType, string> = {
    PRESIDENTIAL: 'Presidential',
    DEPARTMENTAL: 'Departmental',
    FACULTY: 'Faculty',
    CLUB: 'Club',
    SOCIETY: 'Society',
    REFERENDUM: 'Referendum',
    POLL: 'Poll'
  };

  return typeLabels[type] || type;
}

/**
 * Format election status for display
 */
export function formatElectionStatus(status: ElectionStatus): string {
  const statusLabels: Record<ElectionStatus, string> = {
    DRAFT: 'Draft',
    SCHEDULED: 'Scheduled',
    ACTIVE: 'Active',
    PAUSED: 'Paused',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    ARCHIVED: 'Archived'
  };

  return statusLabels[status] || status;
}

/**
 * Format user role for display
 */
export function formatUserRole(role: UserRole): string {
  const roleLabels: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    MODERATOR: 'Moderator',
    VOTER: 'Voter'
  };

  return roleLabels[role] || role;
}

/**
 * Format candidate status for display
 */
export function formatCandidateStatus(status: CandidateStatus): string {
  const statusLabels: Record<CandidateStatus, string> = {
    PENDING: 'Pending Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    DISQUALIFIED: 'Disqualified',
    WITHDRAWN: 'Withdrawn'
  };

  return statusLabels[status] || status;
}

/**
 * Format student ID
 */
export function formatStudentId(studentId: string): string {
  if (!studentId) return '';

  // Format UniElect student ID (e.g., "EN101-0123/2020" -> "EN101-0123/2020")
  const match = studentId.match(/^([A-Z]{2,3})(\d{2,3})-(\d{4})\/(\d{4})$/);
  if (match) {
    const [, prefix, number, id, year] = match;
    return `${prefix}${number}-${id}/${year}`;
  }

  return studentId;
}

/**
 * Format vote count with ordinal suffix
 */
export function formatVoteCount(count: number): string {
  if (count === 1) return '1 vote';
  return `${formatNumber(count)} votes`;
}

/**
 * Format verification code for display
 */
export function formatVerificationCode(code: string): string {
  if (!code) return '';

  // Add spaces between groups of characters for readability
  return code.replace(/(.{4})/g, '$1 ').trim();
}

// ============================================================================
// ADDRESS AND CONTACT FORMATTING
// ============================================================================

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';

  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Format Kenyan phone numbers
  if (digits.startsWith('254')) {
    // +254 format
    return `+254 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  } else if (digits.startsWith('0')) {
    // 0 format
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }

  return phone;
}

/**
 * Format email for display
 */
export function formatEmail(email: string): string {
  if (!email) return '';
  return email.toLowerCase();
}

// ============================================================================
// LIST AND ARRAY FORMATTING
// ============================================================================

/**
 * Format array as comma-separated list
 */
export function formatList(items: string[], conjunction = 'and'): string {
  if (!items || items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;

  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1);

  return `${otherItems.join(', ')}, ${conjunction} ${lastItem}`;
}

/**
 * Format faculties list
 */
export function formatFaculties(faculties: string[]): string {
  if (!faculties || faculties.length === 0) return 'All faculties';
  if (faculties.length === 1) return faculties[0];

  return formatList(faculties);
}

/**
 * Format year of study list
 */
export function formatYearsOfStudy(years: number[]): string {
  if (!years || years.length === 0) return 'All years';

  const sorted = [...years].sort((a, b) => a - b);

  if (sorted.length === 1) return `Year ${sorted[0]}`;

  return `Years ${formatList(sorted.map(y => y.toString()))}`;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format boolean as Yes/No
 */
export function formatBoolean(value: boolean): string {
  return value ? 'Yes' : 'No';
}

/**
 * Format duration in milliseconds to human readable
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) return `${milliseconds}ms`;

  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;

  if (error instanceof Error) return error.message;

  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any;
    return errorObj.message || errorObj.error || JSON.stringify(error);
  }

  return 'An unknown error occurred';
}

// Export all formatters as default object
export default {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatTimeRemaining,
  formatCountdown,
  formatNumber,
  formatCompactNumber,
  formatPercentage,
  formatFileSize,
  formatName,
  formatNameWithInitials,
  getInitials,
  truncateText,
  truncateWords,
  capitalize,
  toTitleCase,
  camelCaseToText,
  formatElectionType,
  formatElectionStatus,
  formatUserRole,
  formatCandidateStatus,
  formatStudentId,
  formatVoteCount,
  formatVerificationCode,
  formatPhoneNumber,
  formatEmail,
  formatList,
  formatFaculties,
  formatYearsOfStudy,
  formatBoolean,
  formatDuration,
  formatErrorMessage
};