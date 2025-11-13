/**
 * Audio Utilities
 *
 * Platform-agnostic audio utility functions for metadata extraction and validation.
 */

import type { AudioError } from "../services/audio/AudioError";
import type { AudioErrorCode } from "../types/audio";

// Prevent unused import errors (these types are used by platform-specific files)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _AudioError = AudioError;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _AudioErrorCode = AudioErrorCode;

// Re-export shared utilities
export * from "./audioUtils.shared";

export interface AudioMetadata {
  duration: number; // in milliseconds
  format?: string;
  sampleRate?: number;
  channels?: number;
  bitRate?: number;
}

/**
 * Get audio metadata from a file URI (platform-specific implementation in .web.ts and .native.ts)
 */
export async function getAudioMetadata(_uri: string): Promise<AudioMetadata> {
  throw new Error("Not implemented. Use platform-specific file.");
}

/**
 * Validate if a file is a playable audio file
 */
export async function validateAudioFile(_uri: string): Promise<boolean> {
  throw new Error("Not implemented. Use platform-specific file.");
}
