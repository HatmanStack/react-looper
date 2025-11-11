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

/**
 * Extract file extension from URI
 */
export function getFileExtension(uri: string): string {
  const parts = uri.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(
  prefix: string,
  extension: string,
): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}_${timestamp}_${random}.${extension}`;
}

/**
 * Sanitize filename to remove invalid characters
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Format duration in milliseconds to human-readable string (MM:SS)
 */
export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

/**
 * Check if URI is a blob URL (web)
 */
export function isBlobUrl(uri: string): boolean {
  return uri.startsWith("blob:");
}

/**
 * Check if URI is a file URI (native)
 */
export function isFileUri(uri: string): boolean {
  return uri.startsWith("file://");
}
