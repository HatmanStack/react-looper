/**
 * FFmpegService for Web Platform
 *
 * Uses Web Audio API for mixing instead of FFmpeg to avoid import.meta issues.
 * Provides audio mixing capabilities using OfflineAudioContext.
 */

import { AudioError } from "../audio/AudioError";
import { AudioErrorCode } from "../../types/audio";
import type { MixOptions, IFFmpegService } from "./types";
import { WebAudioMixer } from "../audio/WebAudioMixer";

/**
 * Web FFmpeg Service using Web Audio API
 * (Named FFmpegService for API compatibility, but uses WebAudioMixer internally)
 */
export class FFmpegService implements IFFmpegService {
  private mixer: WebAudioMixer;
  private isLoaded: boolean = false;

  constructor() {
    this.mixer = new WebAudioMixer();
    console.log("[FFmpegService.web] Created using Web Audio API mixer");
  }

  /**
   * Load is a no-op for Web Audio API (no external dependencies to load)
   */
  public async load(onProgress?: (ratio: number) => void): Promise<void> {
    if (this.isLoaded) {
      console.log("[FFmpegService.web] Already loaded");
      return;
    }

    // Simulate loading progress for UI consistency
    if (onProgress) {
      onProgress(0.5);
      await new Promise((resolve) => setTimeout(resolve, 100));
      onProgress(1.0);
    }

    this.isLoaded = true;
    console.log("[FFmpegService.web] Web Audio API mixer ready");
  }

  /**
   * Check if ready (always true for Web Audio API)
   */
  public isReady(): boolean {
    return this.isLoaded;
  }

  /**
   * Mix multiple audio tracks into a single output
   */
  public async mix(options: MixOptions): Promise<Blob> {
    const { tracks, onProgress } = options;

    if (!tracks || tracks.length === 0) {
      throw new AudioError(
        AudioErrorCode.MIXING_FAILED,
        "No tracks provided for mixing",
        "Please select at least one track to mix",
      );
    }

    console.log(
      `[FFmpegService.web] Mixing ${tracks.length} tracks using Web Audio API...`,
    );

    try {
      // Simulate progress updates for UI
      if (onProgress) {
        onProgress({ ratio: 0.1, time: 0, duration: 0 });
      }

      // Use WebAudioMixer to mix tracks (outputPath is ignored on web)
      await this.mixer.mixTracks(tracks, "output.wav");

      if (onProgress) {
        onProgress({ ratio: 0.9, time: 0, duration: 0 });
      }

      // Get the blob result
      const blob = this.mixer.getBlob();

      if (!blob) {
        throw new Error("Mix completed but no blob was created");
      }

      if (onProgress) {
        onProgress({ ratio: 1.0, time: 0, duration: 0 });
      }

      console.log(
        `[FFmpegService.web] Mix complete, output size: ${blob.size} bytes`,
      );

      return blob;
    } catch (error) {
      console.error("[FFmpegService.web] Mixing failed:", error);

      throw new AudioError(
        AudioErrorCode.MIXING_FAILED,
        `Failed to mix audio: ${(error as Error).message}`,
        "Audio mixing encountered an error",
        { tracks: tracks.length, originalError: error },
      );
    }
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
