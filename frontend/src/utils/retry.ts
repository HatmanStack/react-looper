/**
 * Retry Utility
 *
 * Provides retry logic for async operations with exponential backoff.
 * Uses AudioError.isRecoverable() to determine retry eligibility.
 */

import { AudioError } from "../services/audio/AudioError";
import { logger } from "./logger";

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds before first retry (default: 1000) */
  delayMs?: number;
  /** Whether to use exponential backoff (default: true) */
  backoff?: boolean;
  /** Optional callback for each retry attempt */
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "onRetry">> = {
  maxAttempts: 3,
  delayMs: 1000,
  backoff: true,
};

/**
 * Determines if an error is eligible for retry.
 * AudioError instances use isRecoverable(), other errors default to true.
 */
const isRetryable = (error: unknown): boolean => {
  if (error instanceof AudioError) {
    return error.isRecoverable();
  }
  // For non-AudioError exceptions, allow retry by default
  return true;
};

/**
 * Delays execution for the specified milliseconds.
 */
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes an async operation with retry logic.
 *
 * @param operation - The async function to execute
 * @param options - Retry configuration options
 * @returns The result of the operation
 * @throws The last error if all retries fail
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => audioService.playTrack(trackId),
 *   { maxAttempts: 3, delayMs: 500 }
 * );
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxAttempts, delayMs, backoff } = { ...DEFAULT_OPTIONS, ...options };
  const { onRetry } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt === maxAttempts || !isRetryable(error)) {
        logger.error(
          `[Retry] Operation failed after ${attempt} attempt(s):`,
          lastError,
        );
        throw lastError;
      }

      // Calculate delay with optional exponential backoff
      const currentDelay = backoff
        ? delayMs * Math.pow(2, attempt - 1)
        : delayMs;

      logger.warn(
        `[Retry] Attempt ${attempt}/${maxAttempts} failed, retrying in ${currentDelay}ms:`,
        lastError.message,
      );

      onRetry?.(attempt, lastError);
      await delay(currentDelay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError ?? new Error("Retry failed with unknown error");
}
