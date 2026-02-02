/**
 * Audio Utilities - Web Implementation
 *
 * Web-specific audio utility functions using HTML5 Audio API.
 */

import { AudioError } from "../services/audio/AudioError";
import { AudioErrorCode } from "../types/audio";

// Re-export shared utility functions (avoiding circular dependency with platform resolution)
export * from "./audioUtils.shared";

export interface AudioMetadata {
  duration: number; // in milliseconds
  format?: string;
  sampleRate?: number;
  channels?: number;
  bitRate?: number;
}

/**
 * Get audio metadata using HTML5 Audio element
 */
export async function getAudioMetadata(uri: string): Promise<AudioMetadata> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    let resolved = false;
    let metadataLoaded = false;

    const cleanup = () => {
      audio.onloadedmetadata = null;
      audio.ondurationchange = null;
      audio.onerror = null;
      audio.remove();
    };

    const doResolve = (duration: number) => {
      if (resolved) return;
      resolved = true;
      const metadata: AudioMetadata = {
        duration: duration * 1000, // Convert to milliseconds
      };
      cleanup();
      resolve(metadata);
    };

    const tryResolve = () => {
      // If we have a finite, positive duration, resolve immediately
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        doResolve(audio.duration);
      }
    };

    // Try to get duration on metadata load
    audio.onloadedmetadata = () => {
      metadataLoaded = true;
      tryResolve();

      // If duration is still Infinity after metadata loads, set a short timeout
      // to allow durationchange to fire, then accept whatever we have
      if (!resolved) {
        setTimeout(() => {
          if (!resolved && metadataLoaded) {
            // Accept the duration even if Infinity - UI will handle it
            doResolve(audio.duration);
          }
        }, 500);
      }
    };

    // Also listen for duration changes (for streaming formats)
    audio.ondurationchange = tryResolve;

    audio.onerror = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(
          new AudioError(
            AudioErrorCode.INVALID_FORMAT,
            "Failed to load audio metadata",
            "Could not read audio file information.",
          ),
        );
      }
    };

    // Set timeout to avoid hanging indefinitely
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(
          new AudioError(
            AudioErrorCode.INVALID_FORMAT,
            "Metadata loading timeout",
            "Audio file took too long to load.",
          ),
        );
      }
    }, 10000);

    audio.src = uri;
    audio.load(); // Explicitly start loading
  });
}

/**
 * Validate if a file is a playable audio file
 */
export async function validateAudioFile(uri: string): Promise<boolean> {
  try {
    await getAudioMetadata(uri);
    return true;
  } catch (error) {
    console.debug("[audioUtils.web] Audio validation failed:", error);
    return false;
  }
}
