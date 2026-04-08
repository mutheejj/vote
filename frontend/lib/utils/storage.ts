// lib/utils/storage.ts
// Secure local storage utilities with encryption

import { encryptLocalData, decryptLocalData } from './crypto';
import { STORAGE_KEYS } from '../constants';

// ============================================================================
// SECURE STORAGE OPERATIONS
// ============================================================================

/**
 * Securely store data in localStorage with encryption
 */
export function setSecureItem(key: string, value: any): void {
  try {
    const serializedValue = JSON.stringify(value);
    const encryptedValue = encryptLocalData(serializedValue);
    localStorage.setItem(key, encryptedValue);
  } catch (error) {
    console.error('Failed to store secure item:', error);
  }
}

/**
 * Retrieve and decrypt data from localStorage
 */
export function getSecureItem<T>(key: string): T | null {
  try {
    const encryptedValue = localStorage.getItem(key);
    if (!encryptedValue) return null;

    const decryptedValue = decryptLocalData(encryptedValue);
    if (!decryptedValue) return null;

    return JSON.parse(decryptedValue) as T;
  } catch (error) {
    console.error('Failed to retrieve secure item:', error);
    return null;
  }
}

/**
 * Remove item from localStorage
 */
export function removeSecureItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove secure item:', error);
  }
}

/**
 * Clear all secure storage items
 */
export function clearSecureStorage(): void {
  try {
    const keysToRemove = Object.values(STORAGE_KEYS);
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to clear secure storage:', error);
  }
}

// ============================================================================
// STANDARD STORAGE OPERATIONS
// ============================================================================

/**
 * Store data in localStorage (non-encrypted)
 */
export function setItem(key: string, value: any): void {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error('Failed to store item:', error);
  }
}

/**
 * Retrieve data from localStorage (non-encrypted)
 */
export function getItem<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    if (!value) return null;

    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Failed to retrieve item:', error);
    return null;
  }
}

/**
 * Remove item from localStorage
 */
export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove item:', error);
  }
}

/**
 * Check if item exists in localStorage
 */
export function hasItem(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error('Failed to check item existence:', error);
    return false;
  }
}

/**
 * Get all keys from localStorage
 */
export function getAllKeys(): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }
    return keys;
  } catch (error) {
    console.error('Failed to get all keys:', error);
    return [];
  }
}

// ============================================================================
// SESSION STORAGE OPERATIONS
// ============================================================================

/**
 * Store data in sessionStorage
 */
export function setSessionItem(key: string, value: any): void {
  try {
    const serializedValue = JSON.stringify(value);
    sessionStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error('Failed to store session item:', error);
  }
}

/**
 * Retrieve data from sessionStorage
 */
export function getSessionItem<T>(key: string): T | null {
  try {
    const value = sessionStorage.getItem(key);
    if (!value) return null;

    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Failed to retrieve session item:', error);
    return null;
  }
}

/**
 * Remove item from sessionStorage
 */
export function removeSessionItem(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove session item:', error);
  }
}

/**
 * Clear all sessionStorage
 */
export function clearSessionStorage(): void {
  try {
    sessionStorage.clear();
  } catch (error) {
    console.error('Failed to clear session storage:', error);
  }
}

// ============================================================================
// VOTING SYSTEM SPECIFIC STORAGE
// ============================================================================

/**
 * Store authentication tokens securely
 */
export function setAuthTokens(tokens: { accessToken: string; refreshToken: string }): void {
  setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
  setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
}

/**
 * Get authentication tokens
 */
export function getAuthTokens(): { accessToken: string | null; refreshToken: string | null } {
  return {
    accessToken: getSecureItem<string>(STORAGE_KEYS.ACCESS_TOKEN),
    refreshToken: getSecureItem<string>(STORAGE_KEYS.REFRESH_TOKEN)
  };
}

/**
 * Clear authentication tokens
 */
export function clearAuthTokens(): void {
  removeSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
  removeSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
  removeSecureItem(STORAGE_KEYS.USER);
}

/**
 * Store user information securely
 */
export function setUser(user: any): void {
  setSecureItem(STORAGE_KEYS.USER, user);
}

/**
 * Get user information
 */
export function getUser<T>(): T | null {
  return getSecureItem<T>(STORAGE_KEYS.USER);
}

/**
 * Store voting session data
 */
export function setVotingSession(sessionData: any): void {
  setSecureItem(STORAGE_KEYS.VOTING_SESSION, sessionData);
}

/**
 * Get voting session data
 */
export function getVotingSession<T>(): T | null {
  return getSecureItem<T>(STORAGE_KEYS.VOTING_SESSION);
}

/**
 * Clear voting session data
 */
export function clearVotingSession(): void {
  removeSecureItem(STORAGE_KEYS.VOTING_SESSION);
}

/**
 * Store dashboard preferences
 */
export function setDashboardPreferences(preferences: any): void {
  setItem(STORAGE_KEYS.DASHBOARD_PREFERENCES, preferences);
}

/**
 * Get dashboard preferences
 */
export function getDashboardPreferences<T>(): T | null {
  return getItem<T>(STORAGE_KEYS.DASHBOARD_PREFERENCES);
}

/**
 * Store theme preference
 */
export function setTheme(theme: string): void {
  setItem(STORAGE_KEYS.THEME, theme);
}

/**
 * Get theme preference
 */
export function getTheme(): string | null {
  return getItem<string>(STORAGE_KEYS.THEME);
}

/**
 * Store device fingerprint
 */
export function setDeviceFingerprint(fingerprint: string): void {
  setItem(STORAGE_KEYS.DEVICE_FINGERPRINT, fingerprint);
}

/**
 * Get device fingerprint
 */
export function getDeviceFingerprint(): string | null {
  return getItem<string>(STORAGE_KEYS.DEVICE_FINGERPRINT);
}

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, 'test');
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if sessionStorage is available
 */
export function isSessionStorageAvailable(): boolean {
  try {
    const test = '__sessionStorage_test__';
    sessionStorage.setItem(test, 'test');
    sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get storage usage information
 */
export function getStorageUsage(): {
  used: number;
  total: number;
  percentage: number;
  available: number;
} {
  try {
    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }

    // Estimate total storage (usually 5-10MB for localStorage)
    const total = 5 * 1024 * 1024; // 5MB estimate
    const available = total - used;
    const percentage = (used / total) * 100;

    return {
      used,
      total,
      percentage,
      available
    };
  } catch (error) {
    console.error('Failed to get storage usage:', error);
    return {
      used: 0,
      total: 0,
      percentage: 0,
      available: 0
    };
  }
}

/**
 * Clear expired items based on timestamp
 */
export function clearExpiredItems(): void {
  try {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      try {
        const item = localStorage.getItem(key);
        if (!item) continue;

        const parsed = JSON.parse(item);
        if (parsed && parsed.expiresAt && parsed.expiresAt < now) {
          keysToRemove.push(key);
        }
      } catch {
        // Skip items that can't be parsed
        continue;
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to clear expired items:', error);
  }
}

/**
 * Store item with expiration
 */
export function setItemWithExpiration(key: string, value: any, expirationMs: number): void {
  try {
    const expiresAt = Date.now() + expirationMs;
    const itemWithExpiration = {
      value,
      expiresAt
    };
    setItem(key, itemWithExpiration);
  } catch (error) {
    console.error('Failed to store item with expiration:', error);
  }
}

/**
 * Get item with expiration check
 */
export function getItemWithExpiration<T>(key: string): T | null {
  try {
    const item = getItem<{ value: T; expiresAt: number }>(key);
    if (!item) return null;

    if (item.expiresAt < Date.now()) {
      removeItem(key);
      return null;
    }

    return item.value;
  } catch (error) {
    console.error('Failed to retrieve item with expiration:', error);
    return null;
  }
}

/**
 * Migrate data from old storage format to new format
 */
export function migrateStorageFormat(migrations: Array<{ key: string; migrate: (value: any) => any }>): void {
  try {
    migrations.forEach(({ key, migrate }) => {
      const oldValue = getItem(key);
      if (oldValue) {
        const newValue = migrate(oldValue);
        setItem(key, newValue);
      }
    });
  } catch (error) {
    console.error('Failed to migrate storage format:', error);
  }
}

/**
 * Create storage observer for changes
 */
export function createStorageObserver(callback: (key: string, newValue: any, oldValue: any) => void): () => void {
  const observer = (event: StorageEvent) => {
    if (event.key && event.storageArea === localStorage) {
      try {
        const newValue = event.newValue ? JSON.parse(event.newValue) : null;
        const oldValue = event.oldValue ? JSON.parse(event.oldValue) : null;
        callback(event.key, newValue, oldValue);
      } catch {
        // Skip items that can't be parsed
      }
    }
  };

  window.addEventListener('storage', observer);

  // Return cleanup function
  return () => {
    window.removeEventListener('storage', observer);
  };
}

// Export all storage utilities
export default {
  setSecureItem,
  getSecureItem,
  removeSecureItem,
  clearSecureStorage,
  setItem,
  getItem,
  removeItem,
  hasItem,
  getAllKeys,
  setSessionItem,
  getSessionItem,
  removeSessionItem,
  clearSessionStorage,
  setAuthTokens,
  getAuthTokens,
  clearAuthTokens,
  setUser,
  getUser,
  setVotingSession,
  getVotingSession,
  clearVotingSession,
  setDashboardPreferences,
  getDashboardPreferences,
  setTheme,
  getTheme,
  setDeviceFingerprint,
  getDeviceFingerprint,
  isLocalStorageAvailable,
  isSessionStorageAvailable,
  getStorageUsage,
  clearExpiredItems,
  setItemWithExpiration,
  getItemWithExpiration,
  migrateStorageFormat,
  createStorageObserver
};