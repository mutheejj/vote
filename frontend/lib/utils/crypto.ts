// lib/utils/crypto.ts
// Comprehensive client-side crypto utilities for voting system

import CryptoJS from 'crypto-js';

// ============================================================================
// DEVICE FINGERPRINTING
// ============================================================================

/**
 * Generate a comprehensive device fingerprint for security
 */
export function generateDeviceFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    `${window.screen.width}x${window.screen.height}`,
    `${window.screen.colorDepth}bit`,
    navigator.hardwareConcurrency?.toString() || '0',
    navigator.maxTouchPoints?.toString() || '0',
    document.documentElement.clientWidth?.toString() || '0',
    document.documentElement.clientHeight?.toString() || '0'
  ];

  // Add canvas fingerprint for additional uniqueness
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('UniElect Voting System Fingerprint', 2, 2);
    components.push(canvas.toDataURL());
  }

  const fingerprint = components.join('|');
  return CryptoJS.SHA256(fingerprint).toString();
}

/**
 * Generate a voting-specific device fingerprint
 */
export function generateVotingDeviceFingerprint(): string {
  const baseFingerprint = generateDeviceFingerprint();
  const timestamp = new Date().toISOString().split('T')[0]; // Date only for daily rotation
  return CryptoJS.SHA256(`${baseFingerprint}-voting-${timestamp}`).toString();
}

// ============================================================================
// HASHING AND ENCRYPTION
// ============================================================================

/**
 * Hash a string using SHA-256
 */
export function hashString(input: string, salt?: string): string {
  const data = salt ? `${input}${salt}` : input;
  return CryptoJS.SHA256(data).toString();
}

/**
 * Hash password with salt
 */
export function hashPassword(password: string, salt?: string): string {
  const usedSalt = salt || generateSalt();
  return CryptoJS.SHA256(`${password}${usedSalt}`).toString();
}

/**
 * Generate a cryptographically secure salt
 */
export function generateSalt(length = 32): string {
  return CryptoJS.lib.WordArray.random(length / 2).toString();
}

/**
 * Generate a secure random ID
 */
export function generateId(length = 32): string {
  return CryptoJS.lib.WordArray.random(length / 2).toString();
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  const randomBytes = CryptoJS.lib.WordArray.random(16);
  const hex = randomBytes.toString();

  return [
    hex.substr(0, 8),
    hex.substr(8, 4),
    '4' + hex.substr(12, 3), // Version 4
    ((parseInt(hex.substr(16, 1), 16) & 0x3) | 0x8).toString(16) + hex.substr(17, 3),
    hex.substr(20, 12)
  ].join('-');
}

// ============================================================================
// VOTE INTEGRITY AND SECURITY
// ============================================================================

/**
 * Generate a vote hash for integrity verification
 */
export function generateVoteHash(voteData: {
  electionId: string;
  positionId: string;
  candidateId?: string;
  isAbstain: boolean;
  voterId: string;
  timestamp: string;
}): string {
  const voteString = `${voteData.electionId}|${voteData.positionId}|${voteData.candidateId || 'ABSTAIN'}|${voteData.isAbstain}|${voteData.voterId}|${voteData.timestamp}`;
  return CryptoJS.SHA256(voteString).toString();
}

/**
 * Generate a verification code for vote receipt
 */
export function generateVerificationCode(voteHash: string, electionId: string): string {
  const combined = `${voteHash}${electionId}${Date.now()}`;
  const hash = CryptoJS.SHA256(combined).toString();

  // Take first 12 characters and format as groups of 4
  const code = hash.substring(0, 12).toUpperCase();
  return `${code.substring(0, 4)}-${code.substring(4, 8)}-${code.substring(8, 12)}`;
}

/**
 * Verify vote integrity using hash
 */
export function verifyVoteIntegrity(
  voteData: {
    electionId: string;
    positionId: string;
    candidateId?: string;
    isAbstain: boolean;
    voterId: string;
    timestamp: string;
  },
  expectedHash: string
): boolean {
  const calculatedHash = generateVoteHash(voteData);
  return calculatedHash === expectedHash;
}

// ============================================================================
// SESSION SECURITY
// ============================================================================

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  const timestamp = Date.now().toString();
  const randomData = CryptoJS.lib.WordArray.random(32).toString();
  const deviceFingerprint = generateDeviceFingerprint();

  const combined = `${timestamp}|${randomData}|${deviceFingerprint}`;
  return CryptoJS.SHA256(combined).toString();
}

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return CryptoJS.lib.WordArray.random(32).toString();
}

/**
 * Validate session token format
 */
export function isValidSessionToken(token: string): boolean {
  return /^[a-f0-9]{64}$/i.test(token);
}

// ============================================================================
// DATA ENCRYPTION/DECRYPTION (for local storage)
// ============================================================================

/**
 * Encrypt sensitive data for local storage
 */
export function encryptLocalData(data: string, key?: string): string {
  const encryptionKey = key || getOrCreateLocalKey();
  return CryptoJS.AES.encrypt(data, encryptionKey).toString();
}

/**
 * Decrypt data from local storage
 */
export function decryptLocalData(encryptedData: string, key?: string): string {
  try {
    const encryptionKey = key || getOrCreateLocalKey();
    const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return '';
  }
}

/**
 * Get or create a local encryption key
 */
function getOrCreateLocalKey(): string {
  const keyName = 'unielect-voting-local-key';
  let key = localStorage.getItem(keyName);

  if (!key) {
    key = generateId(64);
    localStorage.setItem(keyName, key);
  }

  return key;
}

// ============================================================================
// SECURE RANDOM UTILITIES
// ============================================================================

/**
 * Generate a cryptographically secure random number
 */
export function secureRandom(): number {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
}

/**
 * Generate a secure random integer between min and max
 */
export function secureRandomInt(min: number, max: number): number {
  return Math.floor(secureRandom() * (max - min + 1)) + min;
}

/**
 * Generate a secure random string
 */
export function secureRandomString(length: number, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(secureRandomInt(0, charset.length - 1));
  }
  return result;
}

// ============================================================================
// BLOCKCHAIN-LIKE INTEGRITY CHECKS
// ============================================================================

/**
 * Create a simple blockchain-like hash chain for vote integrity
 */
export function createHashChain(data: string[], previousHash = '0'): string[] {
  const hashes = [previousHash];

  for (let i = 0; i < data.length; i++) {
    const combinedData = `${hashes[i]}|${data[i]}|${i}`;
    const hash = CryptoJS.SHA256(combinedData).toString();
    hashes.push(hash);
  }

  return hashes.slice(1); // Remove the initial hash
}

/**
 * Verify hash chain integrity
 */
export function verifyHashChain(data: string[], hashes: string[], previousHash = '0'): boolean {
  if (data.length !== hashes.length) return false;

  let currentHash = previousHash;

  for (let i = 0; i < data.length; i++) {
    const combinedData = `${currentHash}|${data[i]}|${i}`;
    const expectedHash = CryptoJS.SHA256(combinedData).toString();

    if (expectedHash !== hashes[i]) return false;

    currentHash = hashes[i];
  }

  return true;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if the browser supports crypto operations
 */
export function isCryptoSupported(): boolean {
  return !!(window.crypto && window.crypto.getRandomValues);
}

/**
 * Clear all crypto-related data from local storage
 */
export function clearCryptoData(): void {
  const cryptoKeys = [
    'unielect-voting-local-key',
    'unielect-voting-device-fingerprint',
    'unielect-voting-session-token'
  ];

  cryptoKeys.forEach(key => localStorage.removeItem(key));
}

/**
 * Generate a checksum for data integrity
 */
export function generateChecksum(data: string): string {
  return CryptoJS.MD5(data).toString();
}

/**
 * Verify data checksum
 */
export function verifyChecksum(data: string, expectedChecksum: string): boolean {
  const calculatedChecksum = generateChecksum(data);
  return calculatedChecksum === expectedChecksum;
}

// Export all functions as default object
export default {
  generateDeviceFingerprint,
  generateVotingDeviceFingerprint,
  hashString,
  hashPassword,
  generateSalt,
  generateId,
  generateUUID,
  generateVoteHash,
  generateVerificationCode,
  verifyVoteIntegrity,
  generateSessionToken,
  generateCSRFToken,
  isValidSessionToken,
  encryptLocalData,
  decryptLocalData,
  secureRandom,
  secureRandomInt,
  secureRandomString,
  createHashChain,
  verifyHashChain,
  isCryptoSupported,
  clearCryptoData,
  generateChecksum,
  verifyChecksum
};