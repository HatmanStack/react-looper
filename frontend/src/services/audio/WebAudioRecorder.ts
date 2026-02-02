/**
 * WebAudioRecorder
 *
 * Web-specific audio recording implementation using MediaRecorder API.
 * Records audio from the user's microphone using getUserMedia.
 */

import { BaseAudioRecorder } from "./BaseAudioRecorder";
import {
  RecordingOptions,
  AudioFormat,
  AudioErrorCode,
} from "../../types/audio";
import { AudioError } from "./AudioError";
import { logger } from "../../utils/logger";

export class WebAudioRecorder extends BaseAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;
  private autoStopTimer: NodeJS.Timeout | null = null;
  /** Track if permissions have been granted to avoid redundant getUserMedia calls */
  private permissionsGranted: boolean = false;

  /**
   * Start recording implementation for web
   */
  protected async _startRecording(options?: RecordingOptions): Promise<void> {
    try {
      // Ensure clean state before starting
      if (this.mediaRecorder) {
        logger.log(
          "[WebAudioRecorder] Cleaning up previous MediaRecorder before starting new recording",
        );
        this.mediaRecorder = null;
      }
      this.audioChunks = [];

      // Request microphone access
      logger.log("[WebAudioRecorder] Requesting microphone access...");
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: options?.sampleRate || 44100,
          channelCount: options?.channels || 2,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Log stream and track info for debugging
      const audioTracks = this.mediaStream.getAudioTracks();
      logger.log(
        `[WebAudioRecorder] Got media stream with ${audioTracks.length} audio track(s)`,
      );
      audioTracks.forEach((track, i) => {
        logger.log(
          `[WebAudioRecorder] Track ${i}: label="${track.label}", enabled=${track.enabled}, readyState=${track.readyState}, muted=${track.muted}`,
        );
      });

      // Determine MIME type based on format option or browser support
      const mimeType = this.getPreferredMimeType(options?.format);

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType,
        audioBitsPerSecond: (options?.bitRate || 128) * 1000,
      });

      logger.log(
        `[WebAudioRecorder] MediaRecorder created, state: ${this.mediaRecorder.state}`,
      );

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        logger.log(
          `[WebAudioRecorder] ondataavailable fired, data size: ${event.data?.size ?? "null"}`,
        );
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstart = () => {
        logger.log(
          `[WebAudioRecorder] MediaRecorder onstart fired, state: ${this.mediaRecorder?.state}`,
        );
      };

      // Handle errors
      this.mediaRecorder.onerror = (event: Event) => {
        logger.error("[WebAudioRecorder] MediaRecorder error:", event);
        throw new AudioError(
          AudioErrorCode.RECORDING_FAILED,
          "MediaRecorder error occurred",
          "Recording failed. Please try again.",
        );
      };

      // Start recording
      // Request data every 100ms for better progress tracking
      this.mediaRecorder.start(100);

      // Set up auto-stop timer if maxDuration is specified
      if (options?.maxDuration && options.maxDuration > 0) {
        logger.log(
          `[WebAudioRecorder] Auto-stop timer set for ${options.maxDuration}ms`,
        );
        this.autoStopTimer = setTimeout(() => {
          logger.log(
            "[WebAudioRecorder] Auto-stopping recording at maxDuration",
          );
          this.stopRecording().catch((error) => {
            logger.error("[WebAudioRecorder] Auto-stop failed:", error);
          });
        }, options.maxDuration);
      }

      logger.log(
        `[WebAudioRecorder] Recording started with MIME type: ${mimeType}`,
      );
    } catch (error) {
      // Cleanup on error
      this.cleanupMediaStream();

      if (error instanceof AudioError) {
        throw error;
      }

      // Check for specific errors
      if ((error as Error).name === "NotAllowedError") {
        throw new AudioError(
          AudioErrorCode.PERMISSION_DENIED,
          "Microphone access denied",
          "Please allow microphone access to record audio.",
        );
      }

      if ((error as Error).name === "NotFoundError") {
        throw new AudioError(
          AudioErrorCode.RESOURCE_UNAVAILABLE,
          "No microphone found",
          "No microphone detected. Please connect a microphone and try again.",
        );
      }

      throw new AudioError(
        AudioErrorCode.RECORDING_FAILED,
        `Failed to start recording: ${(error as Error).message}`,
        "Failed to start recording. Please check your microphone and try again.",
      );
    }
  }

  /**
   * Stop recording and return audio blob URL
   */
  protected async _stopRecording(): Promise<string> {
    logger.log(
      `[WebAudioRecorder] _stopRecording called, mediaRecorder state: ${this.mediaRecorder?.state}, chunks collected: ${this.audioChunks.length}`,
    );

    // Clear auto-stop timer if it exists
    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
      logger.log("[WebAudioRecorder] Auto-stop timer cleared");
    }

    if (!this.mediaRecorder) {
      throw new AudioError(
        AudioErrorCode.RECORDING_FAILED,
        "MediaRecorder not initialized",
        "Recording session not found.",
      );
    }

    // Log track states before stopping
    if (this.mediaStream) {
      const tracks = this.mediaStream.getAudioTracks();
      tracks.forEach((track, i) => {
        logger.log(
          `[WebAudioRecorder] Before stop - Track ${i}: readyState=${track.readyState}, enabled=${track.enabled}`,
        );
      });
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(
          new AudioError(
            AudioErrorCode.RECORDING_FAILED,
            "MediaRecorder lost during stop",
            "Recording session was interrupted.",
          ),
        );
        return;
      }

      // Handle recording stop
      this.mediaRecorder.onstop = () => {
        try {
          logger.log(
            `[WebAudioRecorder] onstop handler called, chunks: ${this.audioChunks.length}`,
          );
          // Create blob from chunks
          const mimeType = this.mediaRecorder?.mimeType || "audio/webm";
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });

          // Create blob URL
          const blobUrl = URL.createObjectURL(audioBlob);

          logger.log(
            `[WebAudioRecorder] Recording stopped. Blob size: ${audioBlob.size} bytes, URL: ${blobUrl}`,
          );

          // Cleanup media stream
          this.cleanupMediaStream();

          resolve(blobUrl);
        } catch (error) {
          this.cleanupMediaStream();
          reject(
            new AudioError(
              AudioErrorCode.RECORDING_FAILED,
              `Failed to create blob: ${(error as Error).message}`,
              "Failed to save recording.",
            ),
          );
        }
      };

      // Stop the recorder
      if (this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      } else {
        // Already stopped, resolve immediately
        this.mediaRecorder.onstop?.(new Event("stop"));
      }
    });
  }

  /**
   * Cancel recording without saving
   */
  protected async _cancelRecording(): Promise<void> {
    logger.log("[WebAudioRecorder] Cancelling recording");

    // Clear auto-stop timer if it exists
    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
      logger.log("[WebAudioRecorder] Auto-stop timer cleared (cancel)");
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }

    // Clear chunks
    this.audioChunks = [];

    // Cleanup media stream
    this.cleanupMediaStream();
  }

  /**
   * Request microphone permissions
   */
  protected async _getPermissions(): Promise<boolean> {
    // If we've already successfully recorded, permissions are granted
    if (this.permissionsGranted) {
      return true;
    }

    try {
      // Try permissions API first (not supported in all browsers)
      if ("permissions" in navigator) {
        try {
          const result = await navigator.permissions.query({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name: "microphone" as any,
          });

          if (result.state === "granted") {
            this.permissionsGranted = true;
            return true;
          }

          if (result.state === "denied") {
            return false;
          }

          // State is 'prompt' - will be requested when getUserMedia is called
        } catch (permError) {
          // Permissions API not fully supported, fall through
          logger.warn(
            "[WebAudioRecorder] Permissions API not available:",
            permError,
          );
        }
      }

      // Request actual media access to trigger permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Immediately stop the stream since this is just a permission check
      stream.getTracks().forEach((track) => track.stop());

      // Add a small delay to ensure the audio device is fully released
      await new Promise((resolve) => setTimeout(resolve, 100));

      this.permissionsGranted = true;
      return true;
    } catch (error) {
      if ((error as Error).name === "NotAllowedError") {
        this.permissionsGranted = false;
        return false;
      }

      // Other errors (no microphone, etc.)
      logger.error("[WebAudioRecorder] Permission check error:", error);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  protected async _cleanup(): Promise<void> {
    logger.log("[WebAudioRecorder] Cleaning up resources");

    // Clear auto-stop timer if it exists
    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
      logger.log("[WebAudioRecorder] Auto-stop timer cleared (cleanup)");
    }

    // Stop and clear media recorder
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    this.mediaRecorder = null;

    // Clear chunks
    this.audioChunks = [];

    // Stop media stream
    this.cleanupMediaStream();
  }

  /**
   * Get preferred MIME type based on format and browser support
   */
  private getPreferredMimeType(format?: AudioFormat): string {
    const mimeTypes: Record<AudioFormat, string[]> = {
      [AudioFormat.MP3]: ["audio/mpeg", "audio/mp3"],
      [AudioFormat.M4A]: ["audio/mp4", "audio/aac"],
      [AudioFormat.WAV]: ["audio/wav", "audio/wave"],
      [AudioFormat.THREE_GPP]: ["audio/3gpp"],
    };

    // If format is specified, try to find supported MIME type for it
    if (format) {
      const types = mimeTypes[format];
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          return type;
        }
      }
    }

    // Fallback: try common formats in order of preference
    const preferredFormats = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
      "audio/wav",
    ];

    for (const type of preferredFormats) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    // Last resort: use whatever the browser's default is
    return "";
  }

  /**
   * Stop and cleanup media stream
   */
  private cleanupMediaStream(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        track.stop();
        logger.log(`[WebAudioRecorder] Stopped track: ${track.label}`);
      });
      this.mediaStream = null;
    }
  }
}
