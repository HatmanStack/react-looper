/**
 * BaseAudioMixer Abstract Class
 *
 * Provides common functionality for audio mixing implementations.
 * Platform-specific implementations should extend this class.
 */

import { IAudioMixer } from "./interfaces/IAudioMixer";
import {
  MixerTrackInput,
  MixingOptions,
  ProgressCallback,
  AudioErrorCode,
} from "../../types/audio";
import { AudioError } from "./AudioError";

export abstract class BaseAudioMixer implements IAudioMixer {
  /**
   * Whether a mixing operation is currently in progress
   */
  protected _isMixing: boolean = false;

  /**
   * Progress callback function
   */
  protected _progressCallback?: ProgressCallback;

  /**
   * Cancellation flag
   */
  protected _cancelled: boolean = false;

  /**
   * Mix tracks (abstract - must be implemented by platform)
   */
  protected abstract _mixTracks(
    tracks: MixerTrackInput[],
    outputPath: string,
    options?: MixingOptions,
  ): Promise<string>;

  /**
   * Cancel mixing (abstract - must be implemented by platform)
   */
  protected abstract _cancel(): Promise<void>;

  /**
   * Mix multiple tracks with validation
   */
  public async mixTracks(
    tracks: MixerTrackInput[],
    outputPath: string,
    options?: MixingOptions,
  ): Promise<string> {
    // Validate state
    if (this._isMixing) {
      throw new AudioError(
        AudioErrorCode.MIXING_FAILED,
        "Cannot start mixing: operation already in progress",
        "A mixing operation is already in progress",
      );
    }

    // Validate inputs
    this.validateTracks(tracks);
    this.validateOutputPath(outputPath);

    try {
      this._isMixing = true;
      this._cancelled = false;

      const result = await this._mixTracks(tracks, outputPath, options);

      return result;
    } catch (error) {
      if (error instanceof AudioError) {
        throw error;
      }
      throw new AudioError(
        AudioErrorCode.MIXING_FAILED,
        `Failed to mix tracks: ${(error as Error).message}`,
        undefined,
        { trackCount: tracks.length, outputPath, originalError: error },
      );
    } finally {
      this._isMixing = false;
      this._cancelled = false;
    }
  }

  /**
   * Set progress callback
   */
  public setProgressCallback(callback: ProgressCallback): void {
    this._progressCallback = callback;
  }

  /**
   * Cancel ongoing mixing operation
   */
  public async cancel(): Promise<void> {
    if (!this._isMixing) {
      return; // Nothing to cancel
    }

    this._cancelled = true;

    try {
      await this._cancel();
    } finally {
      this._isMixing = false;
      this._cancelled = false;
    }
  }

  /**
   * Check if mixing is in progress
   */
  public isMixing(): boolean {
    return this._isMixing;
  }

  /**
   * Estimate mixing duration
   *
   * Rough estimate based on track count and platform.
   * Web is significantly slower than native due to WebAssembly FFmpeg.
   */
  public estimateMixingDuration(tracks: MixerTrackInput[]): number {
    // Base time per track (ms)
    const baseTimePerTrack = 1000;

    // Platform multiplier (web is ~5x slower)
    const platformMultiplier = this.getPlatformMultiplier();

    return tracks.length * baseTimePerTrack * platformMultiplier;
  }

  /**
   * Validate tracks before mixing
   */
  public async validateTracks(tracks: MixerTrackInput[]): Promise<boolean> {
    // Check minimum number of tracks
    if (!tracks || tracks.length === 0) {
      throw new AudioError(
        AudioErrorCode.MIXING_FAILED,
        "Cannot mix: no tracks provided",
        "Please add at least one track to mix",
      );
    }

    // Validate each track
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];

      // Validate URI
      if (!track.uri || typeof track.uri !== "string") {
        throw new AudioError(
          AudioErrorCode.FILE_NOT_FOUND,
          `Track ${i}: invalid URI`,
          "Invalid track file",
        );
      }

      // Validate speed
      if (track.speed < 0.05 || track.speed > 2.5) {
        throw new AudioError(
          AudioErrorCode.MIXING_FAILED,
          `Track ${i}: speed must be between 0.05 and 2.50`,
          "Invalid track speed setting",
        );
      }

      // Validate volume
      if (track.volume < 0 || track.volume > 100) {
        throw new AudioError(
          AudioErrorCode.MIXING_FAILED,
          `Track ${i}: volume must be between 0 and 100`,
          "Invalid track volume setting",
        );
      }

      // Validate optional parameters
      if (track.startTime !== undefined && track.startTime < 0) {
        throw new AudioError(
          AudioErrorCode.MIXING_FAILED,
          `Track ${i}: startTime cannot be negative`,
          "Invalid track start time",
        );
      }

      if (track.duration !== undefined && track.duration <= 0) {
        throw new AudioError(
          AudioErrorCode.MIXING_FAILED,
          `Track ${i}: duration must be positive`,
          "Invalid track duration",
        );
      }
    }

    return true;
  }

  /**
   * Validate output path
   */
  protected validateOutputPath(outputPath: string): void {
    if (!outputPath || typeof outputPath !== "string") {
      throw new AudioError(
        AudioErrorCode.MIXING_FAILED,
        "Invalid output path",
        "Invalid output file path",
      );
    }

    // Check for invalid characters (basic validation)
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(outputPath)) {
      throw new AudioError(
        AudioErrorCode.MIXING_FAILED,
        "Output path contains invalid characters",
        "Invalid output file name",
      );
    }
  }

  /**
   * Update progress and call callback if set
   */
  protected updateProgress(progress: number): void {
    // Clamp progress to 0-100
    const clampedProgress = Math.max(0, Math.min(100, progress));

    if (this._progressCallback) {
      this._progressCallback(clampedProgress);
    }
  }

  /**
   * Check if operation was cancelled
   */
  protected checkCancelled(): void {
    if (this._cancelled) {
      throw new AudioError(
        AudioErrorCode.MIXING_FAILED,
        "Mixing operation was cancelled",
        "Mixing cancelled",
      );
    }
  }

  /**
   * Get platform-specific performance multiplier
   * Override in platform-specific implementations if needed
   */
  protected getPlatformMultiplier(): number {
    return 1.0; // Default, override in subclasses
  }
}
