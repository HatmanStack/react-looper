/**
 * FFmpeg Loader Utility for Web Platform
 *
 * Handles FFmpeg WebAssembly loading with progress tracking and error handling.
 */

import { getAudioExportService } from "../services/ffmpeg/WebAudioExportService";
import { logger } from "./logger";

export interface LoaderOptions {
  onProgress?: (ratio: number) => void;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

/**
 * Load FFmpeg WebAssembly module with progress tracking
 */
export async function loadFFmpeg(options: LoaderOptions = {}): Promise<void> {
  const { onProgress, onError, onSuccess } = options;

  try {
    const ffmpegService = getAudioExportService();

    // Check if already loaded
    if (ffmpegService.isReady()) {
      logger.log("[FFmpegLoader] FFmpeg already loaded");
      onSuccess?.();
      return;
    }

    logger.log("[FFmpegLoader] Starting FFmpeg load...");

    await ffmpegService.load((ratio: number) => {
      onProgress?.(ratio);
    });

    logger.log("[FFmpegLoader] FFmpeg loaded successfully");
    onSuccess?.();
  } catch (error) {
    logger.error("[FFmpegLoader] Failed to load FFmpeg:", error);
    onError?.(error as Error);
    throw error;
  }
}

/**
 * Check if FFmpeg is supported in the current browser
 */
export function isFFmpegSupported(): boolean {
  // Check for WebAssembly support
  if (typeof WebAssembly === "undefined") {
    logger.warn("[FFmpegLoader] WebAssembly not supported");
    return false;
  }

  // Check for SharedArrayBuffer (required for multithreading)
  // Note: Some features work without it, but performance is better with it
  if (typeof SharedArrayBuffer === "undefined") {
    logger.warn(
      "[FFmpegLoader] SharedArrayBuffer not available (limited performance)",
    );
    // Still return true as FFmpeg can work without it
  }

  return true;
}

/**
 * Get FFmpeg support status with details
 */
export function getFFmpegSupportInfo(): {
  supported: boolean;
  hasWebAssembly: boolean;
  hasSharedArrayBuffer: boolean;
  message?: string;
} {
  const hasWebAssembly = typeof WebAssembly !== "undefined";
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== "undefined";
  const supported = hasWebAssembly;

  let message: string | undefined;

  if (!hasWebAssembly) {
    message =
      "Your browser does not support WebAssembly. Please update your browser.";
  } else if (!hasSharedArrayBuffer) {
    message =
      "Your browser has limited FFmpeg support. Some features may be slower.";
  }

  return {
    supported,
    hasWebAssembly,
    hasSharedArrayBuffer,
    message,
  };
}
