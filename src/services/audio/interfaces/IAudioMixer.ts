/**
 * IAudioMixer Interface
 *
 * Defines the contract for audio mixing implementations.
 * Combines multiple audio tracks with individual speed/volume adjustments
 * into a single output file.
 *
 * This is a new feature not present in the Android app.
 */

import { MixerTrackInput, ProgressCallback, MixingOptions } from '../../../types/audio';

export interface IAudioMixer {
  /**
   * Mix multiple audio tracks into a single output file
   *
   * Combines all input tracks, applying their individual speed and volume settings.
   * The operation is asynchronous and may take several seconds depending on:
   * - Number of tracks
   * - Duration of audio
   * - Output format
   * - Platform (web is slower than native)
   *
   * Progress updates are provided via the callback set with setProgressCallback().
   *
   * @param tracks - Array of input tracks with speed/volume settings
   * @param outputPath - Desired path for the output file (or filename for web)
   * @param options - Optional mixing configuration
   * @returns Promise resolving to the URI of the mixed audio file
   * @throws {AudioError} MIXING_FAILED if mixing operation fails
   * @throws {AudioError} FILE_NOT_FOUND if any input file doesn't exist
   * @throws {AudioError} INVALID_FORMAT if input formats are incompatible
   */
  mixTracks(
    tracks: MixerTrackInput[],
    outputPath: string,
    options?: MixingOptions
  ): Promise<string>;

  /**
   * Set a callback for progress updates during mixing
   *
   * The callback receives a number between 0 and 100 indicating percentage complete.
   * Useful for showing progress bars during long mixing operations.
   *
   * @param callback - Function to call with progress percentage (0-100)
   */
  setProgressCallback(callback: ProgressCallback): void;

  /**
   * Cancel an in-progress mixing operation
   *
   * Stops the mixing process and cleans up any temporary files.
   * The Promise from mixTracks() will reject with a cancellation error.
   */
  cancel(): Promise<void>;

  /**
   * Check if a mixing operation is currently in progress
   *
   * @returns true if mixing, false otherwise
   */
  isMixing(): boolean;

  /**
   * Get estimated duration for mixing operation
   *
   * Provides a rough estimate based on input track count and duration.
   * Actual time may vary based on system performance.
   *
   * @param tracks - Input tracks to estimate
   * @returns Estimated duration in milliseconds
   */
  estimateMixingDuration(tracks: MixerTrackInput[]): number;

  /**
   * Validate that all input tracks can be mixed
   *
   * Checks that files exist, formats are compatible, and settings are valid.
   *
   * @param tracks - Input tracks to validate
   * @returns Promise resolving to true if valid, false otherwise
   */
  validateTracks(tracks: MixerTrackInput[]): Promise<boolean>;
}
