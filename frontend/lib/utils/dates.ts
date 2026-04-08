// lib/utils/dates.ts
// Comprehensive date utilities for the voting system

import { format, formatDistanceToNow, isAfter, isBefore, parseISO, addDays, addHours, addMinutes, differenceInDays, differenceInHours, differenceInMinutes, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Format date for display in the UI
 */
export function formatDate(date: Date | string, formatString = 'PPP'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date | string, formatString = 'PPP p'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
}

/**
 * Format date for forms and inputs
 */
export function formatDateForInput(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy-MM-dd');
}

/**
 * Format datetime for forms and inputs
 */
export function formatDateTimeForInput(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Format time only
 */
export function formatTime(date: Date | string, formatString = 'p'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

// ============================================================================
// ELECTION-SPECIFIC DATE UTILITIES
// ============================================================================

/**
 * Check if an election is currently active
 */
export function isElectionActive(startDate: Date | string, endDate: Date | string): boolean {
  const now = new Date();
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

  return isAfter(now, start) && isBefore(now, end);
}

/**
 * Check if an election is upcoming (starts in the future)
 */
export function isElectionUpcoming(startDate: Date | string): boolean {
  const now = new Date();
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;

  return isAfter(start, now);
}

/**
 * Check if an election has ended
 */
export function isElectionEnded(endDate: Date | string): boolean {
  const now = new Date();
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

  return isAfter(now, end);
}

/**
 * Get election status based on dates
 */
export function getElectionStatus(startDate: Date | string, endDate: Date | string): 'upcoming' | 'active' | 'ended' {
  if (isElectionUpcoming(startDate)) return 'upcoming';
  if (isElectionActive(startDate, endDate)) return 'active';
  return 'ended';
}

/**
 * Get time remaining until election starts or ends
 */
export function getElectionTimeRemaining(startDate: Date | string, endDate: Date | string): {
  status: 'upcoming' | 'active' | 'ended';
  timeRemaining: string;
  totalMinutes: number;
} {
  const now = new Date();
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

  if (isElectionUpcoming(startDate)) {
    const minutes = differenceInMinutes(start, now);
    return {
      status: 'upcoming',
      timeRemaining: formatDistanceToNow(start),
      totalMinutes: minutes
    };
  }

  if (isElectionActive(startDate, endDate)) {
    const minutes = differenceInMinutes(end, now);
    return {
      status: 'active',
      timeRemaining: formatDistanceToNow(end),
      totalMinutes: minutes
    };
  }

  return {
    status: 'ended',
    timeRemaining: 'Election has ended',
    totalMinutes: 0
  };
}

/**
 * Get election duration in human-readable format
 */
export function getElectionDuration(startDate: Date | string, endDate: Date | string): string {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

  const days = differenceInDays(end, start);
  const hours = differenceInHours(end, start) % 24;

  if (days > 0) {
    return hours > 0 ? `${days} day${days > 1 ? 's' : ''} and ${hours} hour${hours > 1 ? 's' : ''}` : `${days} day${days > 1 ? 's' : ''}`;
  }

  return `${differenceInHours(end, start)} hour${differenceInHours(end, start) > 1 ? 's' : ''}`;
}

// ============================================================================
// VOTING SESSION UTILITIES
// ============================================================================

/**
 * Check if a voting session is still valid
 */
export function isVotingSessionValid(expiresAt: Date | string): boolean {
  const now = new Date();
  const expires = typeof expiresAt === 'string' ? parseISO(expiresAt) : expiresAt;

  return isAfter(expires, now);
}

/**
 * Get remaining time for voting session
 */
export function getVotingSessionTimeRemaining(expiresAt: Date | string): {
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formatted: string;
} {
  const now = new Date();
  const expires = typeof expiresAt === 'string' ? parseISO(expiresAt) : expiresAt;

  if (isBefore(expires, now)) {
    return {
      minutes: 0,
      seconds: 0,
      isExpired: true,
      formatted: '00:00'
    };
  }

  const totalSeconds = Math.floor((expires.getTime() - now.getTime()) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    minutes,
    seconds,
    isExpired: false,
    formatted: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  };
}

// ============================================================================
// DATE VALIDATION
// ============================================================================

/**
 * Validate that end date is after start date
 */
export function isValidDateRange(startDate: Date | string, endDate: Date | string): boolean {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

  return isAfter(end, start);
}

/**
 * Validate that date is in the future
 */
export function isFutureDate(date: Date | string): boolean {
  const now = new Date();
  const targetDate = typeof date === 'string' ? parseISO(date) : date;

  return isAfter(targetDate, now);
}

/**
 * Validate minimum election duration
 */
export function hasMinimumDuration(startDate: Date | string, endDate: Date | string, minimumHours = 1): boolean {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

  return differenceInHours(end, start) >= minimumHours;
}

/**
 * Validate that registration period comes before election period
 */
export function isValidRegistrationPeriod(
  registrationStart: Date | string,
  registrationEnd: Date | string,
  electionStart: Date | string
): boolean {
  const regStart = typeof registrationStart === 'string' ? parseISO(registrationStart) : registrationStart;
  const regEnd = typeof registrationEnd === 'string' ? parseISO(registrationEnd) : registrationEnd;
  const elecStart = typeof electionStart === 'string' ? parseISO(electionStart) : electionStart;

  return isValidDateRange(regStart, regEnd) && isBefore(regEnd, elecStart);
}

// ============================================================================
// DATE CALCULATIONS
// ============================================================================

/**
 * Calculate suggested registration period based on election dates
 */
export function getSuggestedRegistrationPeriod(electionStart: Date | string): {
  registrationStart: Date;
  registrationEnd: Date;
} {
  const elecStart = typeof electionStart === 'string' ? parseISO(electionStart) : electionStart;

  return {
    registrationStart: addDays(new Date(), 1), // Start tomorrow
    registrationEnd: addDays(elecStart, -1) // End one day before election
  };
}

/**
 * Calculate default voting session duration
 */
export function getDefaultVotingSessionDuration(): Date {
  return addMinutes(new Date(), 30); // 30 minutes default
}

/**
 * Calculate optimal election duration based on number of voters
 */
export function getOptimalElectionDuration(estimatedVoters: number): {
  minimumHours: number;
  recommendedHours: number;
  recommendedStart: Date;
  recommendedEnd: Date;
} {
  // Base calculation: more voters need longer voting periods
  const baseHours = Math.max(2, Math.ceil(estimatedVoters / 1000) * 4);
  const recommendedHours = Math.min(baseHours, 24); // Cap at 24 hours

  const tomorrow9AM = new Date();
  tomorrow9AM.setDate(tomorrow9AM.getDate() + 1);
  tomorrow9AM.setHours(9, 0, 0, 0);

  return {
    minimumHours: Math.max(1, Math.floor(recommendedHours / 2)),
    recommendedHours,
    recommendedStart: tomorrow9AM,
    recommendedEnd: addHours(tomorrow9AM, recommendedHours)
  };
}

// ============================================================================
// TIMEZONE UTILITIES
// ============================================================================

/**
 * Get user's timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert date to user's timezone
 */
export function toUserTimezone(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  // Note: This is a simplified version. In a real app, you might want to use a library like date-fns-tz
  return dateObj;
}

/**
 * Format date with timezone information
 */
export function formatDateWithTimezone(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const timezone = getUserTimezone();

  return `${formatDateTime(dateObj)} (${timezone})`;
}

// ============================================================================
// BUSINESS HOURS AND SCHEDULES
// ============================================================================

/**
 * Check if date/time falls within business hours
 */
export function isWithinBusinessHours(date: Date | string, startHour = 8, endHour = 17): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const hour = dateObj.getHours();
  const dayOfWeek = dateObj.getDay();

  // Check if it's a weekday (Monday-Friday)
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isBusinessHour = hour >= startHour && hour < endHour;

  return isWeekday && isBusinessHour;
}

/**
 * Get next business day
 */
export function getNextBusinessDay(date: Date | string = new Date()): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  let nextDay = addDays(dateObj, 1);

  // Skip weekends
  while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
    nextDay = addDays(nextDay, 1);
  }

  return nextDay;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a date range object
 */
export function createDateRange(startDate: Date | string, endDate: Date | string): {
  start: Date;
  end: Date;
  isValid: boolean;
  duration: string;
} {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

  return {
    start,
    end,
    isValid: isValidDateRange(start, end),
    duration: getElectionDuration(start, end)
  };
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();

  return startOfDay(dateObj).getTime() === startOfDay(today).getTime();
}

/**
 * Check if a date is within a given number of days
 */
export function isWithinDays(date: Date | string, days: number): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const futureDate = addDays(now, days);

  return isWithinInterval(dateObj, { start: now, end: futureDate });
}

/**
 * Get friendly date description
 */
export function getFriendlyDateDescription(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();

  if (isToday(dateObj)) return 'Today';

  const tomorrow = addDays(now, 1);
  if (startOfDay(dateObj).getTime() === startOfDay(tomorrow).getTime()) return 'Tomorrow';

  const yesterday = addDays(now, -1);
  if (startOfDay(dateObj).getTime() === startOfDay(yesterday).getTime()) return 'Yesterday';

  return formatRelativeTime(dateObj);
}

// Export all utilities as default object for convenience
export default {
  formatDate,
  formatDateTime,
  formatDateForInput,
  formatDateTimeForInput,
  formatTime,
  formatRelativeTime,
  isElectionActive,
  isElectionUpcoming,
  isElectionEnded,
  getElectionStatus,
  getElectionTimeRemaining,
  getElectionDuration,
  isVotingSessionValid,
  getVotingSessionTimeRemaining,
  isValidDateRange,
  isFutureDate,
  hasMinimumDuration,
  isValidRegistrationPeriod,
  getSuggestedRegistrationPeriod,
  getDefaultVotingSessionDuration,
  getOptimalElectionDuration,
  getUserTimezone,
  toUserTimezone,
  formatDateWithTimezone,
  isWithinBusinessHours,
  getNextBusinessDay,
  createDateRange,
  isToday,
  isWithinDays,
  getFriendlyDateDescription
};