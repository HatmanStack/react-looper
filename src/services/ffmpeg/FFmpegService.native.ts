/**
 * FFmpegService for Native Platforms (iOS/Android)
 *
 * Handles FFmpeg operations using ffmpeg-kit-react-native for native platforms.
 * Provides audio mixing, conversion, and processing capabilities.
 */

import { FFmpegKit, FFmpegKitConfig, ReturnCode, Statistics } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';
import { AudioError, AudioErrorCode } from '../audio/AudioError';
import type { MixOptions, MixingProgress, IFFmpegService } from './types';
import { FFmpegCommandBuilder } from './FFmpegCommandBuilder';

/**
 * Native FFmpeg Service using ffmpeg-kit-react-native
 */
export class FFmpegService implements IFFmpegService {
  private currentSessionId: number | null = null;
  private totalDuration: number = 0;

  constructor() {
    this.log('FFmpegService created for native platform');
  }

  /**
   * Load FFmpeg (no-op for native, FFmpeg is included in the binary)
   */
  public async load(onProgress?: (ratio: number) => void): Promise<void> {
    this.log('FFmpeg ready (native binary)');
    onProgress?.(1);
  }

  /**
   * Check if FFmpeg is ready (always true on native)
   */
  public isReady(): boolean {
    return true;
  }

  /**
   * Mix multiple audio tracks into a single output file
   */
  public async mix(options: MixOptions): Promise<string> {
    const { tracks, onProgress } = options;

    if (!tracks || tracks.length === 0) {
      throw new AudioError(
        AudioErrorCode.MIXING_FAILED,
        'No tracks provided for mixing',
        'Please select at least one track to mix'
      );
    }

    this.log(`Mixing ${tracks.length} tracks...`);

    try {
      // Prepare output path
      const outputPath = `${FileSystem.cacheDirectory}mixed_${Date.now()}.mp3`;

      // Convert file URIs to absolute paths
      const inputPaths = await Promise.all(
        tracks.map(async (track, i) => {
          const path = this.uriToPath(track.uri);
          this.log(`Input ${i}: ${path}`);
          return path;
        })
      );

      // Build FFmpeg command using shared builder
      const commandArgs = FFmpegCommandBuilder.buildMixCommand({
        tracks,
        inputFiles: inputPaths,
        outputFile: this.uriToPath(outputPath),
      });
      const command = commandArgs.join(' ');
      this.log(`Executing FFmpeg command: ${command}`);

      // Set up progress callback
      if (onProgress) {
        // Estimate total duration from all tracks
        this.totalDuration = 0; // Will be updated from statistics

        FFmpegKitConfig.enableStatisticsCallback((statistics: Statistics) => {
          const time = statistics.getTime(); // in milliseconds

          // Update total duration if we have it
          if (this.totalDuration === 0 && time > 0) {
            // Estimate based on longest track (this is approximate)
            this.totalDuration = time * 2; // Rough estimate
          }

          const ratio = this.totalDuration > 0 ? Math.min(time / this.totalDuration, 1) : 0;

          onProgress({
            ratio,
            time,
            duration: this.totalDuration,
          });
        });
      }

      // Execute FFmpeg command
      const session = await FFmpegKit.execute(command);
      this.currentSessionId = session.getSessionId();

      // Check return code
      const returnCode = await session.getReturnCode();

      if (!ReturnCode.isSuccess(returnCode)) {
        const output = await session.getOutput();
        const failStackTrace = await session.getFailStackTrace();

        this.error(
          'FFmpeg execution failed',
          new Error(failStackTrace || output || 'Unknown error')
        );

        throw new AudioError(
          AudioErrorCode.MIXING_FAILED,
          'FFmpeg execution failed',
          'Audio mixing encountered an error',
          { returnCode: returnCode?.getValue(), output, failStackTrace }
        );
      }

      // Verify output file exists
      const fileInfo = await FileSystem.getInfoAsync(outputPath);
      if (!fileInfo.exists) {
        throw new AudioError(
          AudioErrorCode.MIXING_FAILED,
          'Output file was not created',
          'Mixed audio file not found'
        );
      }

      this.log(`Mixing complete, output: ${outputPath}`);
      return outputPath;
    } catch (error) {
      if (error instanceof AudioError) {
        throw error;
      }

      this.error('Mixing failed', error as Error);
      throw new AudioError(
        AudioErrorCode.MIXING_FAILED,
        `Failed to mix audio: ${(error as Error).message}`,
        'Audio mixing encountered an error',
        { tracks: tracks.length, originalError: error }
      );
    } finally {
      // Clean up statistics callback
      FFmpegKitConfig.enableStatisticsCallback(null);
    }
  }

  /**
   * Cancel current mixing operation
   */
  public async cancel(): Promise<void> {
    if (this.currentSessionId !== null) {
      this.log(`Cancelling session ${this.currentSessionId}`);
      await FFmpegKit.cancel(this.currentSessionId);
      this.currentSessionId = null;
    }
  }

  /**
   * Convert URI to file system path
   */
  private uriToPath(uri: string): string {
    // Remove file:// prefix if present
    if (uri.startsWith('file://')) {
      return uri.substring(7);
    }
    return uri;
  }

  /**
   * Log message
   */
  private log(message: string, ...args: unknown[]): void {
    if (__DEV__) {
      console.log('[FFmpegService.native]', message, ...args);
    }
  }

  /**
   * Log error
   */
  private error(message: string, error: Error): void {
    console.error('[FFmpegService.native]', message, error);
  }
}

// Export singleton instance
let ffmpegServiceInstance: FFmpegService | null = null;

export function getFFmpegService(): FFmpegService {
  if (!ffmpegServiceInstance) {
    ffmpegServiceInstance = new FFmpegService();
  }
  return ffmpegServiceInstance;
}
