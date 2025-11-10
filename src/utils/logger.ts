/**
 * Logger interface
 *
 * Provides a consistent logging API across platforms.
 * Platform-specific implementations can customize behavior.
 */

export interface ILogger {
  log(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
}

/**
 * Base logger implementation
 * Platform-specific versions will extend or replace this
 */
export class Logger implements ILogger {
  log(message: string, ...args: unknown[]): void {
    console.log(`[LOG] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    console.info(`[INFO] ${message}`, ...args);
  }
}

/**
 * Export a singleton logger instance
 * This will be resolved to platform-specific implementation by Metro bundler
 */
export const logger = new Logger();
