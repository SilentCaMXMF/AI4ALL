import { readFile, writeFile } from 'node:fs/promises';
import type { Platform } from '../types/index.js';

/**
 * Standardized error classes for platform operations
 */
export class PlatformError extends Error {
  constructor(
    public readonly platform: Platform,
    public readonly context: string,
    public readonly originalError?: unknown,
    message?: string
  ) {
    super(message || `[${platform}] ${context}: ${originalError instanceof Error ? originalError.message : 'Unknown error'}`);
    this.name = 'PlatformError';
  }
}

export class NetworkError extends PlatformError {
  constructor(
    platform: Platform,
    context: string,
    public readonly statusCode?: number,
    originalError?: unknown
  ) {
    super(platform, context, originalError, `Network error in ${context}: ${statusCode || 'Unknown status'}`);
    this.name = 'NetworkError';
  }
}

export class RateLimitError extends PlatformError {
  constructor(platform: Platform, context: string, public readonly retryAfter?: number) {
    super(platform, context, undefined, `Rate limit exceeded in ${context}${retryAfter ? ` - retry after ${retryAfter}s` : ''}`);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends PlatformError {
  constructor(platform: Platform, context: string, public readonly field?: string, originalError?: unknown) {
    super(platform, context, originalError, `Validation error in ${context}${field ? ` - field: ${field}` : ''}`);
    this.name = 'ValidationError';
  }
}

/**
 * Create standardized platform error
 */
export function createPlatformError(
  platform: Platform,
  context: string,
  originalError?: unknown
): PlatformError {
  if (originalError instanceof Error) {
    // Handle specific error types based on message patterns
    if (originalError.message.includes('rate limit') || originalError.message.includes('429')) {
      const retryMatch = originalError.message.match(/retry-after:\s*(\d+)/i);
      const retryAfter = retryMatch ? parseInt(retryMatch[1]) : undefined;
      return new RateLimitError(platform, context, retryAfter);
    }
    
    if (originalError.message.includes('fetch') || originalError.message.includes('network')) {
      const statusCodeMatch = originalError.message.match(/(\d{3})/);
      const statusCode = statusCodeMatch ? parseInt(statusCodeMatch[1]) : undefined;
      return new NetworkError(platform, context, statusCode, originalError);
    }
    
    if (originalError.message.includes('validation') || originalError.message.includes('invalid')) {
      return new ValidationError(platform, context, undefined, originalError);
    }
  }
  
  return new PlatformError(platform, context, originalError);
}

/**
 * Log platform error with consistent formatting
 */
export function logPlatformError(
  platform: Platform,
  error: unknown,
  context?: string
): void {
  if (error instanceof PlatformError) {
    console.error(`✗ [${platform}] ${error.context}: ${error.message}`);
    if (error.originalError && error.originalError !== error) {
      console.error(`  Original error:`, error.originalError);
    }
  } else if (error instanceof Error) {
    const contextStr = context ? ` in ${context}` : '';
    console.error(`✗ [${platform}] Error${contextStr}: ${error.message}`);
    if (error.stack) {
      console.error(`  Stack trace:`, error.stack);
    }
  } else {
    console.error(`✗ [${platform}] Unknown error${context ? ` in ${context}` : ''}:`, error);
  }
}

/**
 * Wrapper for async functions with standardized error handling
 */
export async function handleAsyncError<T>(
  asyncFn: () => Promise<T>,
  platform: Platform,
  context: string
): Promise<T> {
  try {
    return await asyncFn();
  } catch (error) {
    const platformError = createPlatformError(platform, context, error);
    logPlatformError(platform, platformError);
    throw platformError;
  }
}

/**
 * Check if error is recoverable (should be retried)
 */
export function isRecoverableError(error: unknown): boolean {
  if (error instanceof RateLimitError) {
    return true;
  }
  
  if (error instanceof NetworkError) {
    // Retry on 5xx server errors and network issues
    return !error.statusCode || error.statusCode >= 500 || error.statusCode === 0;
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('network') ||
      message.includes('econnreset')
    );
  }
  
  return false;
}

/**
 * Extract user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof RateLimitError) {
    return `Rate limit exceeded. Please try again in ${error.retryAfter || 'a few'} seconds.`;
  }
  
  if (error instanceof NetworkError) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return 'Authentication failed. Please check your API credentials.';
    }
    if (error.statusCode === 404) {
      return 'The requested resource was not found.';
    }
    if (error.statusCode && error.statusCode >= 500) {
      return 'Server error. Please try again later.';
    }
    return 'Network error. Please check your connection and try again.';
  }
  
  if (error instanceof ValidationError) {
    return `Invalid data provided${error.field ? ` for ${error.field}` : ''}.`;
  }
  
  if (error instanceof PlatformError) {
    return `Platform error: ${error.message}`;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred.';
}

/**
 * Extract technical error details for logging
 */
export function getTechnicalDetails(error: unknown): object {
  if (error instanceof PlatformError) {
    return {
      type: error.name,
      platform: error.platform,
      context: error.context,
      message: error.message,
      originalError: error.originalError,
      ...(error instanceof RateLimitError && { retryAfter: error.retryAfter }),
      ...(error instanceof NetworkError && { statusCode: error.statusCode }),
      ...(error instanceof ValidationError && { field: error.field })
    };
  }
  
  if (error instanceof Error) {
    return {
      type: error.constructor.name,
      message: error.message,
      stack: error.stack
    };
  }
  
  return {
    type: typeof error,
    value: error
  };
}

// State file management utilities
export async function loadStateFile<T>(
  filePath: string,
  defaultState: T,
  platform: Platform
): Promise<T> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    logPlatformError(platform, error, 'loadState');
    return defaultState;
  }
}

export async function saveStateFile<T>(
  filePath: string,
  state: T,
  platform: Platform
): Promise<void> {
  try {
    await writeFile(filePath, JSON.stringify(state, null, 2));
  } catch (error) {
    logPlatformError(platform, error, 'saveState');
  }
}

// API response validation utility
export async function validateApiResponse<T>(
  response: Response,
  platform: Platform,
  context: string
): Promise<T> {
  if (!response.ok) {
    const error = new Error(`${platform} API error: ${response.status} ${response.statusText}`);
    throw createPlatformError(platform, context, error);
  }
  
  try {
    return await response.json();
  } catch (error) {
    throw createPlatformError(platform, `${context} - JSON parsing`, error);
  }
}

// Optional operation wrapper
export async function handleOptionalOperation<T>(
  asyncFn: () => Promise<T>,
  platform: Platform,
  context: string,
  fallbackValue: T
): Promise<T> {
  try {
    return await asyncFn();
  } catch (error) {
    logPlatformError(platform, error, context);
    return fallbackValue;
  }
}

// Authentication state management
export async function ensureValidToken(
  tokenCheck: () => boolean,
  tokenRefresh: () => Promise<void>,
  platform: Platform,
  context: string
): Promise<void> {
  try {
    if (!tokenCheck()) {
      await tokenRefresh();
    }
  } catch (error) {
    logPlatformError(platform, error, context);
    throw createPlatformError(platform, `${context} - authentication`, error);
  }
}

// Request counter utility
export function incrementRequestCounter(platform: Platform, context: string): void {
  console.debug(`[${platform}] Request counter incremented in ${context}`);
}