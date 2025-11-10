/**
 * FFmpeg Loader Utility for Web Platform
 *
 * Handles FFmpeg WebAssembly loading with progress tracking and error handling.
 */

import { getFFmpegService } from '../services/ffmpeg/FFmpegService.web';

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
    const ffmpegService = getFFmpegService();

    // Check if already loaded
    if (ffmpegService.isReady()) {
      console.log('[FFmpegLoader] FFmpeg already loaded');
      onSuccess?.();
      return;
    }

    console.log('[FFmpegLoader] Starting FFmpeg load...');

    await ffmpegService.load((ratio) => {
      onProgress?.(ratio);
    });

    console.log('[FFmpegLoader] FFmpeg loaded successfully');
    onSuccess?.();
  } catch (error) {
    console.error('[FFmpegLoader] Failed to load FFmpeg:', error);
    onError?.(error as Error);
    throw error;
  }
}

/**
 * Check if FFmpeg is supported in the current browser
 */
export function isFFmpegSupported(): boolean {
  // Check for WebAssembly support
  if (typeof WebAssembly === 'undefined') {
    console.warn('[FFmpegLoader] WebAssembly not supported');
    return false;
  }

  // Check for SharedArrayBuffer (required for multithreading)
  // Note: Some features work without it, but performance is better with it
  if (typeof SharedArrayBuffer === 'undefined') {
    console.warn('[FFmpegLoader] SharedArrayBuffer not available (limited performance)');
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
  const hasWebAssembly = typeof WebAssembly !== 'undefined';
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  const supported = hasWebAssembly;

  let message: string | undefined;

  if (!hasWebAssembly) {
    message = 'Your browser does not support WebAssembly. Please update your browser.';
  } else if (!hasSharedArrayBuffer) {
    message = 'Your browser has limited FFmpeg support. Some features may be slower.';
  }

  return {
    supported,
    hasWebAssembly,
    hasSharedArrayBuffer,
    message,
  };
}
