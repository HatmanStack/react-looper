/**
 * Service Worker Registration
 * Registers and manages the service worker lifecycle
 */

import { logger } from "./logger";

export function register(): void {
  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    window.addEventListener("load", () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          logger.log("[SW] Registration successful:", registration.scope);

          // Check for updates periodically
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;

            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  logger.log("[SW] New content available, please refresh");

                  // Optionally notify user about update
                  // You can integrate this with your UI state management
                }
              });
            }
          });
        })
        .catch((error) => {
          logger.error("[SW] Registration failed:", error);
        });
    });
  }
}

export function unregister(): void {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        return registration.unregister();
      })
      .then(() => {
        logger.log("[SW] Unregistered successfully");
      })
      .catch((error) => {
        logger.error("[SW] Unregistration failed:", error);
      });
  }
}

export function skipWaiting(): void {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.controller?.postMessage({ type: "SKIP_WAITING" });
  }
}
