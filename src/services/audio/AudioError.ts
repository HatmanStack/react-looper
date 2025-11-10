/**
 * AudioError Class
 *
 * Custom error class for audio-related errors with error codes and context.
 */

import { Platform } from 'react-native';
import { AudioErrorCode } from '../../types/audio';

export class AudioError extends Error {
  /**
   * Error code for categorizing the error
   */
  public readonly code: AudioErrorCode;

  /**
   * Platform where the error occurred
   */
  public readonly platform: string;

  /**
   * Timestamp when error occurred
   */
  public readonly timestamp: number;

  /**
   * Additional context information
   */
  public readonly context?: Record<string, unknown>;

  /**
   * User-friendly error message
   */
  public readonly userMessage: string;

  constructor(
    code: AudioErrorCode,
    message: string,
    userMessage?: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AudioError';
    this.code = code;
    this.platform = Platform.OS;
    this.timestamp = Date.now();
    this.context = context;
    this.userMessage = userMessage || this.getDefaultUserMessage(code);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AudioError);
    }
  }

  /**
   * Get a user-friendly message based on error code
   */
  private getDefaultUserMessage(code: AudioErrorCode): string {
    switch (code) {
      case AudioErrorCode.PERMISSION_DENIED:
        return 'Microphone permission is required to record audio. Please grant permission in your device settings.';
      case AudioErrorCode.RECORDING_FAILED:
        return 'Failed to record audio. Please try again.';
      case AudioErrorCode.PLAYBACK_FAILED:
        return 'Failed to play audio. The file may be corrupted.';
      case AudioErrorCode.MIXING_FAILED:
        return 'Failed to mix audio tracks. Please try again.';
      case AudioErrorCode.FILE_NOT_FOUND:
        return 'Audio file not found. It may have been deleted.';
      case AudioErrorCode.INVALID_FORMAT:
        return 'Unsupported audio format. Please use MP3, WAV, or M4A files.';
      case AudioErrorCode.RESOURCE_UNAVAILABLE:
        return 'Audio resource is currently unavailable. Please try again later.';
      case AudioErrorCode.UNKNOWN_ERROR:
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Convert error to JSON for logging/reporting
   */
  toJSON(): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      platform: this.platform,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
    };
  }

  /**
   * Check if error is a permission error
   */
  isPermissionError(): boolean {
    return this.code === AudioErrorCode.PERMISSION_DENIED;
  }

  /**
   * Check if error is recoverable (user can retry)
   */
  isRecoverable(): boolean {
    return [
      AudioErrorCode.RECORDING_FAILED,
      AudioErrorCode.PLAYBACK_FAILED,
      AudioErrorCode.MIXING_FAILED,
      AudioErrorCode.RESOURCE_UNAVAILABLE,
    ].includes(this.code);
  }

  /**
   * Convert error to string
   */
  toString(): string {
    return `AudioError [${this.code}]: ${this.message}`;
  }
}
