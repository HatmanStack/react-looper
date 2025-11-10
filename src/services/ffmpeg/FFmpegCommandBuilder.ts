/**
 * FFmpeg Command Builder
 *
 * Builds FFmpeg commands for audio processing operations.
 * Shared between web and native platforms.
 */

import type { MixTrack } from './types';

export interface FFmpegCommandOptions {
  inputFiles: string[];
  outputFile: string;
  tracks: MixTrack[];
}

/**
 * FFmpeg Command Builder for audio mixing
 */
export class FFmpegCommandBuilder {
  /**
   * Build complete FFmpeg command for mixing audio tracks
   */
  public static buildMixCommand(options: FFmpegCommandOptions): string[] {
    const { inputFiles, outputFile, tracks } = options;

    const command: string[] = [];

    // Add input files
    for (const file of inputFiles) {
      command.push('-i', file);
    }

    // Build filter complex for speed and volume adjustments
    const filters: string[] = [];
    const mixInputs: string[] = [];

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      const inputLabel = `${i}:a`;
      let filterChain = `[${inputLabel}]`;

      // Apply speed adjustment using atempo filter
      const atempoFilters = this.buildAtempoFilter(track.speed);
      if (atempoFilters.length > 0) {
        filterChain += atempoFilters.join(',');
        filterChain += ',';
      }

      // Apply volume adjustment
      const volumeMultiplier = this.calculateVolumeMultiplier(track.volume);
      filterChain += `volume=${volumeMultiplier}`;

      // Output label for this processed stream
      const outputLabel = `a${i}`;
      filterChain += `[${outputLabel}]`;

      filters.push(filterChain);
      mixInputs.push(`[${outputLabel}]`);
    }

    // Add amix filter to combine all processed streams
    const amixFilter = `${mixInputs.join('')}amix=inputs=${tracks.length}:duration=longest:normalize=0[out]`;
    filters.push(amixFilter);

    // Join all filters into filter_complex
    command.push('-filter_complex', filters.join(';'));

    // Map output
    command.push('-map', '[out]');

    // Output encoding settings (MP3 @ 128kbps, 44.1kHz)
    command.push(
      '-codec:a',
      'libmp3lame',
      '-b:a',
      '128k',
      '-ar',
      '44100',
      '-y' // Overwrite output file
    );

    // Output file (must be last)
    command.push(outputFile);

    return command;
  }

  /**
   * Build atempo filter chain for speed adjustment
   *
   * atempo filter only supports 0.5-2.0 range, so we chain multiple
   * filters for extreme speed values outside this range.
   *
   * Examples:
   * - 0.25x = atempo=0.5,atempo=0.5
   * - 4.0x = atempo=2.0,atempo=2.0
   * - 0.75x = atempo=0.75
   */
  public static buildAtempoFilter(speed: number): string[] {
    const filters: string[] = [];

    if (speed === 1.0) {
      return filters; // No speed change needed
    }

    let remainingSpeed = speed;

    // Chain atempo filters to reach desired speed
    while (Math.abs(remainingSpeed - 1.0) > 0.01) {
      if (remainingSpeed > 2.0) {
        // Speed too high, apply 2.0x and continue
        filters.push('atempo=2.0');
        remainingSpeed /= 2.0;
      } else if (remainingSpeed < 0.5) {
        // Speed too low, apply 0.5x and continue
        filters.push('atempo=0.5');
        remainingSpeed /= 0.5;
      } else {
        // Within range, apply final atempo
        filters.push(`atempo=${remainingSpeed.toFixed(2)}`);
        break;
      }
    }

    return filters;
  }

  /**
   * Calculate volume multiplier from 0-100 range
   *
   * Uses logarithmic scaling matching Android implementation:
   * 1 - (log(100 - volume) / log(100))
   *
   * This provides more natural volume control where:
   * - 0 = silence (0.0)
   * - 50 = ~0.5 multiplier
   * - 100 = full volume (1.0)
   */
  public static calculateVolumeMultiplier(volume: number): number {
    if (volume === 0) return 0;
    if (volume === 100) return 1.0;

    // Logarithmic scaling for natural volume perception
    const scaledVolume = 1 - Math.log(100 - volume) / Math.log(100);
    return Math.max(0, Math.min(1, scaledVolume));
  }

  /**
   * Validate speed value is within supported range
   */
  public static isValidSpeed(speed: number): boolean {
    return speed >= 0.05 && speed <= 2.5;
  }

  /**
   * Validate volume value is within supported range
   */
  public static isValidVolume(volume: number): boolean {
    return volume >= 0 && volume <= 100;
  }
}
