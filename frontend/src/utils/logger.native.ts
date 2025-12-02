/**
 * Native-specific logger implementation
 *
 * Uses React Native's console with platform-specific considerations
 * In production, this could integrate with crash reporting services
 */

import { ILogger } from "./logger";

export class NativeLogger implements ILogger {
  log(message: string, ...args: unknown[]): void {
    if (__DEV__) {
      console.log(`[LOG] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (__DEV__) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    // Always log errors, even in production
    console.error(`[ERROR] ${message}`, ...args);
    // In production, this could send to crash reporting service
    // Example: Sentry.captureException(new Error(message));
  }

  info(message: string, ...args: unknown[]): void {
    if (__DEV__) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }
}

export const logger = new NativeLogger();
