/**
 * Shared types for Audio Export Service (all platforms)
 *
 * Platform implementations:
 * - Web: Uses Web Audio API + lamejs for mixing and MP3 encoding
 * - Native: Uses FFmpeg via ffmpeg-kit-react-native
 */

import type { QualityLevelValue } from "../../types/audio";

/**
 * Audio formats supported by the export service
 * Note: 3gpp is not supported for export, only these three formats
 */
export type AudioFormat = "mp3" | "wav" | "m4a";

/**
 * Re-export quality type from central location
 */
export type QualityLevel = QualityLevelValue;

export interface MixingProgress {
  ratio: number; // 0-1
  time: number; // Current time in ms
  duration: number; // Total duration in ms
}

export interface MixTrack {
  uri: string;
  speed: number; // 0.05 - 2.50
  volume: number; // 0 - 100
}

export interface MixOptions {
  tracks: MixTrack[];
  onProgress?: (progress: MixingProgress) => void;

  /**
   * Number of master loop cycles to export
   * Default: 1 (single loop)
   */
  loopCount?: number;

  /**
   * Fadeout duration in milliseconds
   * Applied to the very end of the mixed output
   * Default: 0 (no fadeout)
   */
  fadeoutDuration?: number;

  /**
   * Output audio format
   * Default: "wav"
   */
  format?: AudioFormat;

  /**
   * Output quality level
   * Default: "high"
   */
  quality?: QualityLevel;
}

export interface MixResult {
  /** The mixed audio data - Blob for web, file URI string for native */
  data: Blob | string;
  /** The actual format of the output (may differ from requested if fallback occurred) */
  actualFormat: AudioFormat;
}

export interface IAudioExportService {
  /**
   * Load/initialize the service (may be async for platform-specific setup)
   */
  load(onProgress?: (ratio: number) => void): Promise<void>;

  /**
   * Check if the service is ready to use
   */
  isReady(): boolean;

  /**
   * Mix multiple audio tracks and export to specified format
   * @returns MixResult with data and actual format used
   */
  mix(options: MixOptions): Promise<MixResult>;
}
