/**
 * Shared types for FFmpeg Service (all platforms)
 */

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
}

export interface IFFmpegService {
  /**
   * Load FFmpeg (may be async for web WASM loading)
   */
  load(onProgress?: (ratio: number) => void): Promise<void>;

  /**
   * Check if FFmpeg is ready to use
   */
  isReady(): boolean;

  /**
   * Mix multiple audio tracks
   * @returns Blob (web) or file URI (native)
   */
  mix(options: MixOptions): Promise<Blob | string>;
}
