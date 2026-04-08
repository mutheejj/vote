// lib/utils/index.ts
// Central export for all utility functions

// Re-export all utility modules
export * from './cn';
export * from './crypto';
export * from './validators';
export * from './permissions';
export * from './storage';

// Selectively export from dates and formatters to avoid conflicts
export { formatDate, formatDateTime, formatRelativeTime } from './dates';
export * from './formatters';

// Export utility modules as namespaces for organized access
import * as cryptoUtilsNs from './crypto';
import * as dateUtilsNs from './dates';
import * as formatUtilsNs from './formatters';
import * as validatorUtilsNs from './validators';
import * as permissionUtilsNs from './permissions';
import * as storageUtilsNs from './storage';

export const cryptoUtils = cryptoUtilsNs;
export const dateUtils = dateUtilsNs;
export const formatUtils = formatUtilsNs;
export const validatorUtils = validatorUtilsNs;
export const permissionUtils = permissionUtilsNs;
export const storageUtils = storageUtilsNs;

// Common utility functions that don't fit in other categories
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (let key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!isEqual(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
}

export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

export function groupBy<T>(array: T[], keySelector: (item: T) => string): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = keySelector(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

export function uniqueBy<T>(array: T[], keySelector: (item: T) => any): T[] {
  const seen = new Set();
  return array.filter(item => {
    const key = keySelector(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function flatten<T>(array: (T | T[])[]): T[] {
  return array.reduce<T[]>((flat, item) => {
    if (Array.isArray(item)) {
      return [...flat, ...flatten(item)];
    }
    return [...flat, item];
  }, []);
}

export function sortBy<T>(array: T[], keySelector: (item: T) => any, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = keySelector(a);
    const bVal = keySelector(b);

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

export function randomChoice<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

export function range(start: number, end?: number, step = 1): number[] {
  if (end === undefined) {
    end = start;
    start = 0;
  }

  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

export function roundToDecimal(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// Browser and environment utilities
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function isServer(): boolean {
  return !isBrowser();
}

export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (!isBrowser()) return 'desktop';

  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function isMobile(): boolean {
  return getDeviceType() === 'mobile';
}

export function isTablet(): boolean {
  return getDeviceType() === 'tablet';
}

export function isDesktop(): boolean {
  return getDeviceType() === 'desktop';
}

export function getBrowserInfo(): {
  name: string;
  version: string;
  platform: string;
} {
  if (!isBrowser()) {
    return { name: 'unknown', version: 'unknown', platform: 'unknown' };
  }

  const userAgent = navigator.userAgent;
  let name = 'unknown';
  let version = 'unknown';

  if (userAgent.includes('Chrome')) {
    name = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    version = match ? match[1] : 'unknown';
  } else if (userAgent.includes('Firefox')) {
    name = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    version = match ? match[1] : 'unknown';
  } else if (userAgent.includes('Safari')) {
    name = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    version = match ? match[1] : 'unknown';
  } else if (userAgent.includes('Edge')) {
    name = 'Edge';
    const match = userAgent.match(/Edge\/(\d+)/);
    version = match ? match[1] : 'unknown';
  }

  return {
    name,
    version,
    platform: navigator.platform
  };
}

// URL and routing utilities
export function getSearchParams(): URLSearchParams {
  if (!isBrowser()) return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

export function updateSearchParams(params: Record<string, string>): void {
  if (!isBrowser()) return;

  const searchParams = new URLSearchParams(window.location.search);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
  });

  const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
  window.history.replaceState({}, '', newUrl);
}

export function downloadFile(blob: Blob, filename: string): void {
  if (!isBrowser()) return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (!isBrowser()) return Promise.resolve(false);

  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch(() => false);
  }

  // Fallback for older browsers
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return Promise.resolve(successful);
  } catch {
    document.body.removeChild(textArea);
    return Promise.resolve(false);
  }
}

// Error handling utilities
export function createErrorHandler(context?: string) {
  return (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    const contextMessage = context ? `[${context}] ${message}` : message;
    console.error(contextMessage, error);

    // In production, you might want to send errors to a monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to error monitoring service
    }
  };
}

export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  context?: string
): T {
  const errorHandler = createErrorHandler(context);

  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);

      // Handle async functions
      if (result instanceof Promise) {
        return result.catch(errorHandler);
      }

      return result;
    } catch (error) {
      errorHandler(error);
      throw error;
    }
  }) as T;
}

// Performance utilities
export function measure<T>(name: string, fn: () => T): T {
  if (!isBrowser()) return fn();

  const start = performance.now();
  const result = fn();
  const end = performance.now();

  console.log(`[Performance] ${name}: ${end - start}ms`);
  return result;
}

export async function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  if (!isBrowser()) return fn();

  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  console.log(`[Performance] ${name}: ${end - start}ms`);
  return result;
}

// Export a default object with all utilities organized
const utils = {
  crypto: cryptoUtils,
  dates: dateUtils,
  format: formatUtils,
  validators: validatorUtils,
  permissions: permissionUtils,
  storage: storageUtils,

  // Common utilities
  debounce,
  throttle,
  sleep,
  isEqual,
  omit,
  pick,
  groupBy,
  unique,
  uniqueBy,
  chunk,
  flatten,
  sortBy,
  randomChoice,
  range,
  clamp,
  lerp,
  roundToDecimal,

  // Browser utilities
  isBrowser,
  isServer,
  getDeviceType,
  isMobile,
  isTablet,
  isDesktop,
  getBrowserInfo,

  // URL utilities
  getSearchParams,
  updateSearchParams,
  downloadFile,
  copyToClipboard,

  // Error handling
  createErrorHandler,
  withErrorHandling,

  // Performance
  measure,
  measureAsync
};

export default utils;