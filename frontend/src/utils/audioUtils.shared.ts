/**
 * Shared Audio Utilities
 *
 * Platform-agnostic utility functions shared across all audio implementations.
 * Separated to avoid circular dependency issues with platform-specific files.
 */

import { AudioError } from "../services/audio/AudioError";
import { AudioErrorCode } from "../types/audio";

/**
 * Extract file extension from URI
 * Handles query parameters and fragments correctly (e.g., "file.mp3?token=abc" → "mp3")
 */
export function getFileExtension(uri: string): string {
  if (!uri) return "";

  // Strip query parameters and fragments
  const cleanUri = uri.split("?")[0].split("#")[0];

  // Extract filename from path (handle both / and \ separators)
  const pathParts = cleanUri.split(/[/\\]/);
  const filename = pathParts[pathParts.length - 1];

  // Handle filenames starting with dot (e.g., ".gitignore")
  if (filename.startsWith(".") && !filename.includes(".", 1)) {
    return "";
  }

  // Extract extension
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex > 0 ? filename.substring(dotIndex + 1).toLowerCase() : "";
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
 * Scale volume from 0-100 to gain value using logarithmic curve.
 * @param volume - Volume level from 0 to 100
 * @returns Gain value from 0.0 to 1.0
 */
export function scaleVolume(volume: number): number {
  const clamped = Math.max(0, Math.min(100, volume));
  if (clamped === 0) return 0;
  if (clamped === 100) return 1;
  return 1 - Math.log(100 - clamped) / Math.log(100);
}

/** Default timeout for audio fetch operations (30 seconds) */
export const AUDIO_FETCH_TIMEOUT_MS = 30_000;

/**
 * Fetch with timeout using AbortController.
 * Throws an AudioError if the request times out.
 *
 * @param uri - The URI to fetch
 * @param timeoutMs - Timeout in milliseconds (default: 30s)
 * @returns The fetch Response
 */
export async function fetchWithTimeout(
  uri: string,
  timeoutMs: number = AUDIO_FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(uri, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        `Audio fetch failed with HTTP ${response.status} ${response.statusText}`,
        "Failed to load audio file. Please try again.",
      );
    }
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === "AbortError") {
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        `Audio fetch timed out after ${timeoutMs}ms`,
        "Audio file took too long to load. Please check your connection and try again.",
      );
    }
    throw error;
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
