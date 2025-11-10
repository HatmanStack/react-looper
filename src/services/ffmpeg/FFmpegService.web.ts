/**
 * FFmpegService for Web Platform
 *
 * Handles FFmpeg operations using @ffmpeg/ffmpeg (WebAssembly) for web browsers.
 * Provides audio mixing, conversion, and processing capabilities.
 */

import { createFFmpeg, FFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { AudioError, AudioErrorCode } from '../audio/AudioError';
import type { MixOptions, MixingProgress, IFFmpegService } from './types';
import { FFmpegCommandBuilder } from './FFmpegCommandBuilder';

/**
 * Web FFmpeg Service using WebAssembly
 */
export class FFmpegService implements IFFmpegService {
  private ffmpeg: FFmpeg | null = null;
  private isLoaded: boolean = false;
  private isLoading: boolean = false;

  /**
   * Initialize FFmpeg instance with logging
   */
  constructor() {
    this.log('FFmpegService created for web platform');
  }

  /**
   * Load FFmpeg WebAssembly module
   * This is lazy-loaded to avoid loading large WASM files unless needed
   */
  public async load(onProgress?: (ratio: number) => void): Promise<void> {
    if (this.isLoaded) {
      this.log('FFmpeg already loaded');
      return;
    }

    if (this.isLoading) {
      this.log('FFmpeg is already loading');
      throw new AudioError(
        AudioErrorCode.MIXING_FAILED,
        'FFmpeg is already loading',
        'Please wait for FFmpeg to finish loading'
      );
    }

    try {
      this.isLoading = true;
      this.log('Loading FFmpeg WebAssembly module...');

      this.ffmpeg = createFFmpeg({
        log: true,
        progress: ({ ratio }) => {
          this.log(`FFmpeg load progress: ${(ratio * 100).toFixed(1)}%`);
          onProgress?.(ratio);
        },
      });

      await this.ffmpeg.load();

      this.isLoaded = true;
      this.isLoading = false;
      this.log('FFmpeg loaded successfully');
    } catch (error) {
      this.isLoading = false;
      this.error('Failed to load FFmpeg', error as Error);

      throw new AudioError(
        AudioErrorCode.MIXING_FAILED,
        `Failed to load FFmpeg: ${(error as Error).message}`,
        'FFmpeg could not be initialized. Your browser may not support WebAssembly.',
        { originalError: error }
      );
    }
  }

  /**
   * Check if FFmpeg is loaded and ready
   */
  public isReady(): boolean {
    return this.isLoaded && this.ffmpeg !== null;
  }

  /**
   * Mix multiple audio tracks into a single output file
   * Applies speed and volume adjustments to each track
   */
  public async mix(options: MixOptions): Promise<Blob> {
    await this.ensureLoaded();

    const { tracks, onProgress } = options;

    if (!tracks || tracks.length === 0) {
      throw new AudioError(
        AudioErrorCode.MIXING_FAILED,
        'No tracks provided for mixing',
        'Please select at least one track to mix'
      );
    }

    if (!this.ffmpeg) {
      throw new AudioError(
        AudioErrorCode.MIXING_FAILED,
        'FFmpeg not initialized',
        'FFmpeg is not ready'
      );
    }

    this.log(`Mixing ${tracks.length} tracks...`);

    try {
      // Load audio files into FFmpeg virtual file system
      const inputFiles: string[] = [];
      for (let i = 0; i < tracks.length; i++) {
        const inputName = `input${i}.mp3`;
        this.log(`Loading ${inputName} from ${tracks[i].uri}`);

        const fileData = await fetchFile(tracks[i].uri);
        this.ffmpeg.FS('writeFile', inputName, fileData);
        inputFiles.push(inputName);
      }

      // Build FFmpeg command using shared builder
      const command = FFmpegCommandBuilder.buildMixCommand({
        tracks,
        inputFiles,
        outputFile: 'output.mp3',
      });
      this.log(`Executing FFmpeg command: ${command.join(' ')}`);

      // Set progress callback if provided
      if (onProgress) {
        this.ffmpeg.setProgress(({ ratio, time }) => {
          onProgress({
            ratio,
            time: time * 1000, // Convert to ms
            duration: 0, // We don't have total duration easily accessible
          });
        });
      }

      // Execute FFmpeg command
      await this.ffmpeg.run(...command);

      // Read output file
      const data = this.ffmpeg.FS('readFile', 'output.mp3');
      const blob = new Blob([data.buffer], { type: 'audio/mpeg' });

      // Clean up virtual file system
      for (const file of inputFiles) {
        this.ffmpeg.FS('unlink', file);
      }
      this.ffmpeg.FS('unlink', 'output.mp3');

      this.log(`Mixing complete, output size: ${blob.size} bytes`);
      return blob;
    } catch (error) {
      this.error('Mixing failed', error as Error);

      throw new AudioError(
        AudioErrorCode.MIXING_FAILED,
        `Failed to mix audio: ${(error as Error).message}`,
        'Audio mixing encountered an error',
        { tracks: tracks.length, originalError: error }
      );
    }
  }

  /**
   * Ensure FFmpeg is loaded before operations
   */
  private async ensureLoaded(): Promise<void> {
    if (!this.isLoaded) {
      await this.load();
    }
  }

  /**
   * Log message with tag
   */
  private log(message: string, ...args: unknown[]): void {
    if (__DEV__) {
      console.log('[FFmpegService.web]', message, ...args);
    }
  }

  /**
   * Log error with tag
   */
  private error(message: string, error: Error): void {
    console.error('[FFmpegService.web]', message, error);
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
