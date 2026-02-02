/**
 * Web-specific logger implementation
 *
 * Uses browser console with styled output for better debugging experience.
 * Debug logs (log, info) are disabled in production builds.
 */

import { ILogger } from "./logger";

export class WebLogger implements ILogger {
  private isDevelopment: boolean;

  constructor() {
    // Enable debug logs in development, disable in production
    this.isDevelopment = __DEV__;
  }

  log(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.log(
        `%c[LOG]%c ${message}`,
        "color: #03DAC6; font-weight: bold",
        "color: inherit",
        ...args,
      );
    }
  }

  warn(message: string, ...args: unknown[]): void {
    // Warnings always logged
    console.warn(
      `%c[WARN]%c ${message}`,
      "color: #FFAB00; font-weight: bold",
      "color: inherit",
      ...args,
    );
  }

  error(message: string, ...args: unknown[]): void {
    // Errors always logged
    console.error(
      `%c[ERROR]%c ${message}`,
      "color: #CF6679; font-weight: bold",
      "color: inherit",
      ...args,
    );
  }

  info(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.info(
        `%c[INFO]%c ${message}`,
        "color: #3F51B5; font-weight: bold",
        "color: inherit",
        ...args,
      );
    }
  }
}

export const logger = new WebLogger();
