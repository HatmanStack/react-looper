/**
 * FFmpegService for Native Platforms (iOS/Android)
 *
 * Handles FFmpeg operations using ffmpeg-kit-react-native for native platforms.
 * Provides audio mixing, conversion, and processing capabilities.
 */

import {
  FFmpegKit,
  FFmpegKitConfig,
  ReturnCode,
  Statistics,
  StatisticsCallback,
} from "ffmpeg-kit-react-native";
import { Paths, File } from "expo-file-system";
import { AudioError } from "../audio/AudioError";
import { AudioErrorCode } from "../../types/audio";
import type { MixOptions, IAudioExportService, MixResult } from "./exportTypes";
import { FFmpegCommandBuilder } from "./FFmpegCommandBuilder";

/**
 * Native FFmpeg Service using ffmpeg-kit-react-native
 */
export class FFmpegService implements IAudioExportService {
  private currentSessionId: number | null = null;
  private totalDuration: number = 0;

  constructor() {
    this.log("FFmpegService created for native platform");
  }

  /**
   * Load FFmpeg (no-op for native, FFmpeg is included in the binary)
   */
  public async load(onProgress?: (ratio: number) => void): Promise<void> {
    this.log("FFmpeg ready (native binary)");
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
  public async mix(options: MixOptions): Promise<MixResult> {
    const { tracks, onProgress, format = "mp3" } = options;

    if (!tracks || tracks.length === 0) {
      throw new AudioError(
        AudioErrorCode.MIXING_FAILED,
        "No tracks provided for mixing",
        "Please select at least one track to mix",
      );
    }

    this.log(`Mixing ${tracks.length} tracks...`);

    try {
      // Prepare output path using expo-file-system Paths API
      const extension =
        format === "wav" ? "wav" : format === "m4a" ? "m4a" : "mp3";
      const outputFile = new File(
        Paths.cache,
        `mixed_${Date.now()}.${extension}`,
      );
      const outputPath = outputFile.uri;

      // Convert file URIs to absolute paths
      const inputPaths = await Promise.all(
        tracks.map(async (track, i) => {
          const path = this.uriToPath(track.uri);
          this.log(`Input ${i}: ${path}`);
          return path;
        }),
      );

      // Build FFmpeg command using shared builder
      const commandArgs = FFmpegCommandBuilder.buildMixCommand({
        tracks,
        inputFiles: inputPaths,
        outputFile: this.uriToPath(outputPath),
      });
      const command = commandArgs.join(" ");
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

          const ratio =
            this.totalDuration > 0 ? Math.min(time / this.totalDuration, 1) : 0;

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
          "FFmpeg execution failed",
          new Error(failStackTrace || output || "Unknown error"),
        );

        throw new AudioError(
          AudioErrorCode.MIXING_FAILED,
          "FFmpeg execution failed",
          "Audio mixing encountered an error",
          { returnCode: returnCode?.getValue(), output, failStackTrace },
        );
      }

      // Verify output file exists
      if (!outputFile.exists) {
        throw new AudioError(
          AudioErrorCode.MIXING_FAILED,
          "Output file was not created",
          "Mixed audio file not found",
        );
      }

      this.log(`Mixing complete, output: ${outputPath}`);
      return { data: outputPath, actualFormat: format };
    } catch (error) {
      if (error instanceof AudioError) {
        throw error;
      }

      this.error("Mixing failed", error as Error);
      throw new AudioError(
        AudioErrorCode.MIXING_FAILED,
        `Failed to mix audio: ${(error as Error).message}`,
        "Audio mixing encountered an error",
        { tracks: tracks.length, originalError: error },
      );
    } finally {
      // Disable statistics callback (no dedicated disable method, pass undefined)
      FFmpegKitConfig.enableStatisticsCallback(
        undefined as unknown as StatisticsCallback,
      );
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
    if (uri.startsWith("file://")) {
      return uri.substring(7);
    }
    return uri;
  }

  /**
   * Log message
   */
  private log(message: string, ...args: unknown[]): void {
    if (__DEV__) {
      console.log("[FFmpegService.native]", message, ...args);
    }
  }

  /**
   * Log error
   */
  private error(message: string, error: Error): void {
    console.error("[FFmpegService.native]", message, error);
  }
}

// Export singleton instance
let ffmpegServiceInstance: FFmpegService | null = null;

export function getAudioExportService(): FFmpegService {
  if (!ffmpegServiceInstance) {
    ffmpegServiceInstance = new FFmpegService();
  }
  return ffmpegServiceInstance;
}
