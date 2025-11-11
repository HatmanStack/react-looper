/**
 * Audio Utilities - Web Implementation
 *
 * Web-specific audio utility functions using HTML5 Audio API.
 */

import { AudioError } from "../services/audio/AudioError";
import { AudioErrorCode } from "../types/audio";

// Re-export utility functions from base file (avoiding circular dependency)
export {
  getFileExtension,
  generateUniqueFilename,
  sanitizeFilename,
  formatDuration,
  formatFileSize,
  isBlobUrl,
  isFileUri,
} from "./audioUtils";

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

    const cleanup = () => {
      audio.remove();
    };

    audio.onloadedmetadata = () => {
      const metadata: AudioMetadata = {
        duration: audio.duration * 1000, // Convert to milliseconds
      };

      cleanup();
      resolve(metadata);
    };

    audio.onerror = () => {
      cleanup();
      reject(
        new AudioError(
          AudioErrorCode.INVALID_FORMAT,
          "Failed to load audio metadata",
          "Could not read audio file information.",
        ),
      );
    };

    // Set timeout to avoid hanging
    setTimeout(() => {
      cleanup();
      reject(
        new AudioError(
          AudioErrorCode.INVALID_FORMAT,
          "Metadata loading timeout",
          "Audio file took too long to load.",
        ),
      );
    }, 10000);

    audio.src = uri;
  });
}

/**
 * Validate if a file is a playable audio file
 */
export async function validateAudioFile(uri: string): Promise<boolean> {
  try {
    await getAudioMetadata(uri);
    return true;
  } catch (_error) {
    return false;
  }
}
