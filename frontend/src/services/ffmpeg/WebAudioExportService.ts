/**
 * FFmpegService for Web Platform
 *
 * Uses Web Audio API for mixing with format conversion support via lamejs.
 * Avoids FFmpeg.wasm to prevent import.meta issues with Metro bundler.
 */

import { AudioError } from "../audio/AudioError";
import { AudioErrorCode } from "../../types/audio";
import type {
  MixOptions,
  IAudioExportService,
  MixResult,
  AudioFormat,
} from "./exportTypes";
import { WebAudioMixer } from "../audio/WebAudioMixer";
import { getBitrate } from "./audioQuality";
import lamejs from "@breezystack/lamejs";

// Type augmentation for lamejs - the package types are incomplete
interface WavHeaderResult {
  channels: number;
  sampleRate: number;
  dataLen: number;
  dataOffset: number;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LameJS = lamejs as any;

/**
 * Web FFmpeg Service using Web Audio API + lamejs for format conversion
 */
export class FFmpegService implements IAudioExportService {
  private mixer: WebAudioMixer;
  private isLoaded: boolean = false;

  constructor() {
    this.mixer = new WebAudioMixer();
  }

  /**
   * Load (no-op for Web Audio API)
   */
  public async load(onProgress?: (ratio: number) => void): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    // Simulate loading for UI consistency
    if (onProgress) {
      onProgress(0.5);
      await new Promise((resolve) => setTimeout(resolve, 100));
      onProgress(1.0);
    }

    this.isLoaded = true;
  }

  /**
   * Check if ready
   */
  public isReady(): boolean {
    return this.isLoaded;
  }

  /**
   * Mix multiple audio tracks into a single output
   */
  public async mix(options: MixOptions): Promise<MixResult> {
    const {
      tracks,
      onProgress,
      loopCount = 1,
      fadeoutDuration = 0,
      format = "wav",
      quality = "high",
    } = options;

    if (!tracks || tracks.length === 0) {
      throw new AudioError(
        AudioErrorCode.MIXING_FAILED,
        "No tracks provided for mixing",
        "Please select at least one track to mix",
      );
    }

    try {
      if (onProgress) {
        onProgress({ ratio: 0.1, time: 0, duration: 0 });
      }

      // Use WebAudioMixer to mix tracks
      await this.mixer.mixTracks(tracks, "output.wav", {
        loopCount,
        fadeoutDuration,
      });

      if (onProgress) {
        onProgress({ ratio: 0.7, time: 0, duration: 0 });
      }

      // Get the WAV blob
      const wavBlob = this.mixer.getBlob();

      if (!wavBlob) {
        throw new Error("Mix completed but no blob was created");
      }

      // Convert format if not WAV
      let outputBlob: Blob;
      let actualFormat: AudioFormat = format;

      if (format === "mp3") {
        const result = await this.convertToMP3(wavBlob, quality);
        outputBlob = result.blob;
        actualFormat = result.format;
      } else if (format === "m4a") {
        // M4A not supported without FFmpeg, fallback to WAV
        console.warn("[FFmpegService.web] M4A format not supported, using WAV");
        outputBlob = wavBlob;
        actualFormat = "wav";
      } else {
        outputBlob = wavBlob;
        actualFormat = "wav";
      }

      if (onProgress) {
        onProgress({ ratio: 1.0, time: 0, duration: 0 });
      }

      return { data: outputBlob, actualFormat };
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

  /**
   * Convert WAV blob to MP3 using lamejs
   * Returns both blob and actual format (in case of fallback)
   */
  private async convertToMP3(
    wavBlob: Blob,
    quality: string,
  ): Promise<{ blob: Blob; format: AudioFormat }> {
    try {
      // Read WAV file
      const arrayBuffer = await wavBlob.arrayBuffer();

      // Use lamejs WavHeader to parse WAV file (official API)
      const wav: WavHeaderResult = LameJS.WavHeader.readHeader(
        new DataView(arrayBuffer),
      );

      if (!wav) {
        throw new Error("Invalid WAV file format");
      }

      console.log("[FFmpegService.web] WAV parsed:", {
        channels: wav.channels,
        sampleRate: wav.sampleRate,
        dataLen: wav.dataLen,
        dataOffset: wav.dataOffset,
      });

      // Get audio data using offset from WAV header
      const audioData = new Int16Array(
        arrayBuffer,
        wav.dataOffset,
        wav.dataLen / 2,
      );

      // Split into channels (create separate Int16Array for each channel)
      const samplesLeft =
        wav.channels === 1
          ? audioData
          : new Int16Array(wav.dataLen / (2 * wav.channels));

      const samplesRight =
        wav.channels === 2
          ? new Int16Array(wav.dataLen / (2 * wav.channels))
          : undefined;

      // For stereo, de-interleave samples
      if (wav.channels > 1 && samplesRight) {
        for (let i = 0; i < samplesLeft.length; i++) {
          samplesLeft[i] = audioData[i * 2];
          samplesRight[i] = audioData[i * 2 + 1];
        }
      }

      // Get bitrate from quality
      const bitrate = getBitrate("mp3", quality as "low" | "medium" | "high");

      console.log(
        `[FFmpegService.web] Encoding MP3: ${wav.channels}ch, ${wav.sampleRate}Hz, ${bitrate}kbps`,
      );

      // Create MP3 encoder
      const mp3encoder = new LameJS.Mp3Encoder(
        wav.channels,
        wav.sampleRate,
        bitrate,
      );

      // Encode in chunks using subarray (no copying)
      const mp3Data: Int8Array[] = [];
      const sampleBlockSize = 1152;
      const remaining = samplesLeft.length;

      for (let i = 0; i < remaining; i += sampleBlockSize) {
        // Use subarray to create views (no data copying)
        const leftChunk = samplesLeft.subarray(i, i + sampleBlockSize);
        const rightChunk = samplesRight
          ? samplesRight.subarray(i, i + sampleBlockSize)
          : undefined;

        const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
        if (mp3buf.length > 0) {
          mp3Data.push(new Int8Array(mp3buf));
        }
      }

      // Flush remaining data
      const mp3buf = mp3encoder.flush();
      if (mp3buf.length > 0) {
        mp3Data.push(new Int8Array(mp3buf));
      }

      console.log(
        `[FFmpegService.web] MP3 encoding complete: ${mp3Data.length} chunks`,
      );

      // Create blob (cast to any[] for TypeScript compatibility)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mp3Blob = new Blob(mp3Data as any[], { type: "audio/mpeg" });
      return { blob: mp3Blob, format: "mp3" };
    } catch (error) {
      console.error("[FFmpegService.web] MP3 conversion failed:", error);
      console.warn("[FFmpegService.web] Falling back to WAV format");
      return { blob: wavBlob, format: "wav" }; // Fallback to WAV if conversion fails
    }
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
