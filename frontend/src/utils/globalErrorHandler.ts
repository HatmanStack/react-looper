/**
 * Global Error Handler
 *
 * Sets up global error handlers for uncaught exceptions and
 * unhandled promise rejections across platforms.
 */

import { Platform } from "react-native";
import { logger } from "./logger";

/**
 * Handler for uncaught JavaScript errors
 */
const handleUncaughtError = (error: Error, isFatal?: boolean): void => {
  logger.error(
    `[GlobalErrorHandler] Uncaught ${isFatal ? "fatal " : ""}error:`,
    error.message,
  );
  logger.error("[GlobalErrorHandler] Stack:", error.stack);
};

/**
 * Handler for unhandled promise rejections
 */
const handleUnhandledRejection = (reason: unknown): void => {
  const message = reason instanceof Error ? reason.message : String(reason);
  logger.error("[GlobalErrorHandler] Unhandled promise rejection:", message);
  if (reason instanceof Error && reason.stack) {
    logger.error("[GlobalErrorHandler] Stack:", reason.stack);
  }
};

/**
 * Initialize global error handlers.
 * Call this once at app startup (in _layout.tsx or App.tsx).
 */
export const initGlobalErrorHandlers = (): void => {
  if (Platform.OS === "web") {
    // Web: Use window event listeners
    if (typeof window !== "undefined") {
      window.addEventListener("error", (event) => {
        handleUncaughtError(event.error || new Error(event.message));
      });

      window.addEventListener("unhandledrejection", (event) => {
        handleUnhandledRejection(event.reason);
      });
    }
  } else {
    // Native: Use React Native's ErrorUtils
    // ErrorUtils is a global provided by React Native runtime
    const ErrorUtils = (global as { ErrorUtils?: ErrorUtilsType }).ErrorUtils;
    if (ErrorUtils) {
      const originalHandler = ErrorUtils.getGlobalHandler();

      ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        handleUncaughtError(error, isFatal);
        // Call original handler to maintain default behavior
        originalHandler?.(error, isFatal);
      });
    }

    // Handle unhandled promise rejections on native
    // React Native sets up a tracking handler by default
    if (typeof global !== "undefined") {
      const globalAny = global as unknown as GlobalWithTracking;
      const originalRejectionHandler = globalAny.onunhandledrejection;
      globalAny.onunhandledrejection = (event: PromiseRejectionEventLike) => {
        handleUnhandledRejection(event.reason);
        originalRejectionHandler?.(event);
      };
    }
  }

  logger.info("[GlobalErrorHandler] Initialized global error handlers");
};

/**
 * Type definitions for React Native's ErrorUtils
 */
interface ErrorUtilsType {
  getGlobalHandler: () => ((error: Error, isFatal?: boolean) => void) | null;
  setGlobalHandler: (
    handler: (error: Error, isFatal?: boolean) => void,
  ) => void;
}

interface PromiseRejectionEventLike {
  reason: unknown;
}

interface GlobalWithTracking {
  onunhandledrejection?: (event: PromiseRejectionEventLike) => void;
}
