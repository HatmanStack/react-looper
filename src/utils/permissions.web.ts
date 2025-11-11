/**
 * Permission Utilities - Web Implementation
 *
 * Web-specific permission handling using navigator.permissions and getUserMedia.
 */

import {
  PermissionType,
  PermissionStatus,
  PermissionResult,
} from "./permissions";

/**
 * Request microphone permission
 */
export async function requestMicrophonePermission(): Promise<PermissionResult> {
  try {
    // Try to get microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Stop the stream immediately since we just need permission
    stream.getTracks().forEach((track) => track.stop());

    return {
      status: PermissionStatus.GRANTED,
      canAskAgain: true,
    };
  } catch (error) {
    const err = error as Error;

    if (
      err.name === "NotAllowedError" ||
      err.name === "PermissionDeniedError"
    ) {
      return {
        status: PermissionStatus.DENIED,
        canAskAgain: true, // Web always allows asking again
      };
    }

    if (err.name === "NotFoundError") {
      // No microphone found
      return {
        status: PermissionStatus.DENIED,
        canAskAgain: false,
      };
    }

    // Other errors
    console.error("[Permissions] Microphone permission error:", error);
    return {
      status: PermissionStatus.DENIED,
      canAskAgain: true,
    };
  }
}

/**
 * Request storage permission (no-op on web)
 */
export async function requestStoragePermission(): Promise<PermissionResult> {
  // Web doesn't need explicit storage permission
  return {
    status: PermissionStatus.GRANTED,
    canAskAgain: true,
  };
}

/**
 * Check current permission status without requesting
 */
export async function checkPermission(
  type: PermissionType,
): Promise<PermissionStatus> {
  if (type === PermissionType.STORAGE) {
    // Web doesn't need storage permission
    return PermissionStatus.GRANTED;
  }

  if (type === PermissionType.MICROPHONE) {
    try {
      // Try permissions API first (not supported in all browsers)
      if ("permissions" in navigator) {
        const result = await navigator.permissions.query({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name: "microphone" as any,
        });

        if (result.state === "granted") {
          return PermissionStatus.GRANTED;
        }

        if (result.state === "denied") {
          return PermissionStatus.DENIED;
        }

        if (result.state === "prompt") {
          return PermissionStatus.PENDING;
        }
      }
    } catch (error) {
      // Permissions API not supported, fall through
      console.warn("[Permissions] Permissions API not available:", error);
    }

    // If we can't check, return undetermined
    return PermissionStatus.UNDETERMINED;
  }

  return PermissionStatus.UNDETERMINED;
}

/**
 * Open device settings (no-op on web)
 */
export async function openSettings(): Promise<void> {
  // Web doesn't have a settings page we can open programmatically
  console.warn("[Permissions] Opening settings not supported on web");
}
