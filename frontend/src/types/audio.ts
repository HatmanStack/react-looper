/**
 * Audio-related TypeScript types
 *
 * Defines types for audio operations including formats, quality settings,
 * mixer inputs, and configuration options.
 */

/**
 * Supported audio formats
 */
export enum AudioFormat {
  MP3 = "mp3",
  WAV = "wav",
  M4A = "m4a",
  THREE_GPP = "3gpp",
}

/**
 * Audio quality presets
 */
export enum AudioQuality {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

/**
 * String literal union types derived from enums
 * Use these when you need to assign string values directly (e.g., in settings)
 */
export type AudioFormatValue = `${AudioFormat}`;
export type QualityLevelValue = `${AudioQuality}`;

/**
 * Input track for audio mixing
 */
export interface MixerTrackInput {
  /**
   * URI/path to the audio file
   */
  uri: string;

  /**
   * Playback speed multiplier (0.05 - 2.50)
   * Matches Android implementation: seekbar 3-102 divided by 41
   */
  speed: number;

  /**
   * Volume level (0 - 100)
   * Uses logarithmic scaling for natural volume perception
   */
  volume: number;

  /**
   * Optional start time offset in milliseconds
   */
  startTime?: number;

  /**
   * Optional duration limit in milliseconds
   */
  duration?: number;
}

/**
 * Recording configuration options
 */
export interface RecordingOptions {
  /**
   * Output audio format
   */
  format?: AudioFormat;

  /**
   * Recording quality preset
   */
  quality?: AudioQuality;

  /**
   * Sample rate in Hz (e.g., 44100, 48000)
   */
  sampleRate?: number;

  /**
   * Bit rate in kbps (e.g., 128, 192, 320)
   */
  bitRate?: number;

  /**
   * Number of audio channels (1 = mono, 2 = stereo)
   */
  channels?: number;

  /**
   * Maximum recording duration in milliseconds
   */
  maxDuration?: number;
}

/**
 * Playback configuration options
 */
export interface PlaybackOptions {
  /**
   * Whether to loop playback
   */
  loop?: boolean;

  /**
   * Initial playback speed (0.05 - 2.50)
   */
  speed?: number;

  /**
   * Initial volume (0 - 100)
   */
  volume?: number;

  /**
   * Whether to preserve pitch when changing speed
   */
  preservePitch?: boolean;
}

/**
 * Audio metadata information
 */
export interface AudioMetadata {
  /**
   * Duration in milliseconds
   */
  duration: number;

  /**
   * Sample rate in Hz
   */
  sampleRate?: number;

  /**
   * Number of channels
   */
  channels?: number;

  /**
   * Bit rate in kbps
   */
  bitRate?: number;

  /**
   * Audio format/codec
   */
  format?: string;
}

/**
 * Progress callback for long-running audio operations
 */
export type ProgressCallback = (progress: number) => void;

/**
 * Mixing configuration options
 */
export interface MixingOptions {
  /**
   * Output audio format
   */
  format?: AudioFormat;

  /**
   * Sample rate for output (Hz)
   */
  sampleRate?: number;

  /**
   * Bit rate for output (kbps)
   */
  bitRate?: number;

  /**
   * Number of channels (1 = mono, 2 = stereo)
   */
  channels?: number;

  /**
   * Whether to normalize volume across all tracks
   */
  normalize?: boolean;

  /**
   * Apply fade in at the beginning (ms)
   */
  fadeIn?: number;

  /**
   * Apply fade out at the end (ms)
   */
  fadeOut?: number;

  /**
   * Number of master loop cycles to export
   * Default: 1 (single loop)
   * Used to repeat all tracks for the specified number of master loop iterations
   */
  loopCount?: number;

  /**
   * Fadeout duration in milliseconds
   * Applied to the very end of the mixed output (after all loop repetitions)
   * Default: 0 (no fadeout)
   */
  fadeoutDuration?: number;
}

/**
 * Audio error codes as string literal union
 * Provides exhaustive type checking in switch statements
 */
export type AudioErrorCode =
  | "PERMISSION_DENIED"
  | "RECORDING_FAILED"
  | "PLAYBACK_FAILED"
  | "MIXING_FAILED"
  | "FILE_NOT_FOUND"
  | "INVALID_FORMAT"
  | "RESOURCE_UNAVAILABLE"
  | "UNKNOWN_ERROR";

/**
 * Audio error code constants for runtime use
 * Maintains backwards compatibility with enum-style access
 */
// eslint-disable-next-line no-redeclare -- Intentional: type + const with same name is valid TS pattern
export const AudioErrorCode = {
  PERMISSION_DENIED: "PERMISSION_DENIED",
  RECORDING_FAILED: "RECORDING_FAILED",
  PLAYBACK_FAILED: "PLAYBACK_FAILED",
  MIXING_FAILED: "MIXING_FAILED",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  INVALID_FORMAT: "INVALID_FORMAT",
  RESOURCE_UNAVAILABLE: "RESOURCE_UNAVAILABLE",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

/**
 * Helper for exhaustive type checking in switch statements.
 * TypeScript will error if any AudioErrorCode case is unhandled.
 */
export const assertNever = (x: never): never => {
  throw new Error(`Unhandled error code: ${x}`);
};
