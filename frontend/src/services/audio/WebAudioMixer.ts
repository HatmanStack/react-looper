/**
 * WebAudioMixer
 *
 * Web-specific audio mixing using Web Audio API.
 * Mixes multiple audio tracks with speed and volume adjustments.
 */

import { BaseAudioMixer } from "./BaseAudioMixer";
import { MixerTrackInput, MixingOptions } from "../../types/audio";
import { AudioError } from "./AudioError";
import { AudioErrorCode } from "../../types/audio";
import { logger } from "../../utils/logger";
import { useSettingsStore } from "../../store/useSettingsStore";

// Maximum recommended mix duration in seconds (to prevent memory exhaustion)
// 10 minutes at 44.1kHz stereo 16-bit = ~100MB of audio data.
// NOTE: OfflineAudioContext allocates the entire buffer upfront, so longer mixes
// may cause browser tab crashes on memory-constrained devices.
const MAX_RECOMMENDED_DURATION_SECONDS = 600;

// Chunk size for WAV conversion (process 1 second at a time)
// NOTE: Chunked processing reduces peak memory by not creating one giant ArrayBuffer.
// Trade-off: slightly slower but prevents out-of-memory for long audio exports.
const WAV_CHUNK_SECONDS = 1;

export class WebAudioMixer extends BaseAudioMixer {
  private audioContext: AudioContext | null = null;
  private cachedBlob: Blob | null = null;

  constructor() {
    super();
  }

  /**
   * Mix multiple audio tracks into a single output
   * Uses Web Audio API OfflineAudioContext for mixing
   * Note: outputPath is ignored on web, returns a Blob stored internally
   */
  protected async _mixTracks(
    tracks: MixerTrackInput[],
    outputPath: string,
    options?: MixingOptions,
  ): Promise<string> {
    if (tracks.length === 0) {
      throw new AudioError(
        AudioErrorCode.MIXING_FAILED,
        "No tracks provided",
        "Please add at least one track to mix",
      );
    }

    try {
      logger.log(`[WebAudioMixer] Mixing ${tracks.length} tracks...`);

      // Load all audio buffers
      const audioBuffers = await Promise.all(
        tracks.map((track) => this.loadAudioBuffer(track.uri)),
      );

      const sampleRate = audioBuffers[0].sampleRate;

      // Calculate total export duration
      const loopCount = options?.loopCount || 1;
      const fadeoutDuration = (options?.fadeoutDuration || 0) / 1000; // Convert ms to seconds

      // For loop repetition, use the longest speed-adjusted track duration as master loop
      const masterLoopDuration = Math.max(
        ...audioBuffers.map((buffer, i) => buffer.duration / tracks[i].speed),
      );

      const totalDuration = masterLoopDuration * loopCount + fadeoutDuration;

      logger.log(
        `[WebAudioMixer] Master loop: ${masterLoopDuration.toFixed(2)}s, Loops: ${loopCount}, Fadeout: ${fadeoutDuration.toFixed(2)}s, Total: ${totalDuration.toFixed(2)}s`,
      );

      // Check memory requirements and warn if too large
      const estimatedMemoryMB = this.estimateMemoryUsage(
        totalDuration,
        sampleRate,
        2, // stereo
      );
      logger.log(
        `[WebAudioMixer] Estimated memory usage: ${estimatedMemoryMB.toFixed(1)}MB`,
      );

      if (totalDuration > MAX_RECOMMENDED_DURATION_SECONDS) {
        logger.warn(
          `[WebAudioMixer] Mix duration (${totalDuration.toFixed(0)}s) exceeds recommended maximum (${MAX_RECOMMENDED_DURATION_SECONDS}s). This may cause memory issues.`,
        );
      }

      // Create offline context for rendering
      const offlineContext = new OfflineAudioContext({
        numberOfChannels: 2,
        length: Math.ceil(totalDuration * sampleRate),
        sampleRate,
      });

      // Create master gain node for fadeout
      const masterGain = offlineContext.createGain();
      masterGain.gain.value = 1.0;
      masterGain.connect(offlineContext.destination);

      // Read crossfade duration from settings
      const crossfadeDurationMs =
        useSettingsStore.getState().loopCrossfadeDuration;
      const crossfadeDuration = crossfadeDurationMs / 1000; // Convert to seconds

      logger.log(
        `[WebAudioMixer] Crossfade duration: ${crossfadeDurationMs}ms`,
      );

      // Create and connect source nodes for each track
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        const buffer = audioBuffers[i];

        // Calculate speed-adjusted duration for this track
        const trackDuration = buffer.duration / track.speed;

        // Create volume gain node
        const gainNode = offlineContext.createGain();
        const scaledVolume = this.scaleVolume(track.volume);
        gainNode.gain.value = scaledVolume;
        gainNode.connect(masterGain);

        // Apply crossfade at loop boundaries if enabled and track needs to loop
        const needsLooping =
          loopCount > 1 || trackDuration < masterLoopDuration * loopCount;
        const canCrossfade =
          crossfadeDuration > 0 &&
          needsLooping &&
          trackDuration > crossfadeDuration * 2;

        if (canCrossfade) {
          // Manual looping with crossfade
          const repetitionsNeeded = Math.ceil(
            (masterLoopDuration * loopCount) / trackDuration,
          );

          for (let rep = 0; rep < repetitionsNeeded; rep++) {
            const startTime = rep * trackDuration;
            if (startTime >= totalDuration) break;

            // Create source for this repetition
            const source = offlineContext.createBufferSource();
            source.buffer = buffer;
            source.playbackRate.value = track.speed;

            // Create gain for fade-in/fade-out
            const fadeGain = offlineContext.createGain();
            source.connect(fadeGain);
            fadeGain.connect(gainNode);

            // Calculate actual play duration (may be shorter for last rep)
            const playDuration = Math.min(
              trackDuration,
              totalDuration - startTime,
            );

            // Apply fade-in at start of each rep (except first)
            if (rep > 0 && crossfadeDuration < playDuration) {
              fadeGain.gain.setValueAtTime(0.0, startTime);
              fadeGain.gain.linearRampToValueAtTime(
                1.0,
                startTime + crossfadeDuration,
              );
            } else {
              fadeGain.gain.setValueAtTime(1.0, startTime);
            }

            // Apply fade-out at end of each rep (except last)
            const nextRepStartTime = startTime + trackDuration;
            if (
              nextRepStartTime < totalDuration &&
              crossfadeDuration < playDuration
            ) {
              const fadeOutStart =
                startTime + trackDuration - crossfadeDuration;
              fadeGain.gain.setValueAtTime(1.0, fadeOutStart);
              fadeGain.gain.linearRampToValueAtTime(0.0, nextRepStartTime);
            }

            // Start and stop source
            source.start(startTime);
            source.stop(Math.min(startTime + playDuration, totalDuration));
          }

          logger.log(
            `[WebAudioMixer] Track ${i + 1}: duration=${trackDuration.toFixed(2)}s, speed=${track.speed}, volume=${track.volume} (scaled=${scaledVolume.toFixed(3)}), crossfade=${crossfadeDurationMs}ms`,
          );
        } else {
          // Simple looping without crossfade (original behavior)
          const source = offlineContext.createBufferSource();
          source.buffer = buffer;
          source.loop = needsLooping;
          source.playbackRate.value = track.speed;

          source.connect(gainNode);

          source.start(0);
          source.stop(totalDuration);

          logger.log(
            `[WebAudioMixer] Track ${i + 1}: duration=${trackDuration.toFixed(2)}s, speed=${track.speed}, volume=${track.volume} (scaled=${scaledVolume.toFixed(3)}), loops=${source.loop}`,
          );
        }
      }

      // Apply fadeout to master gain if specified
      if (fadeoutDuration > 0) {
        const fadeoutStartTime = totalDuration - fadeoutDuration;
        logger.log(
          `[WebAudioMixer] Applying fadeout from ${fadeoutStartTime.toFixed(2)}s to ${totalDuration.toFixed(2)}s`,
        );

        // Set initial gain value
        masterGain.gain.setValueAtTime(1.0, fadeoutStartTime);

        // Linear ramp to 0
        masterGain.gain.linearRampToValueAtTime(0.0, totalDuration);
      }

      // Render the mixed audio
      logger.log("[WebAudioMixer] Rendering mixed audio...");
      const renderedBuffer = await offlineContext.startRendering();

      logger.log(
        `[WebAudioMixer] Rendered ${renderedBuffer.duration.toFixed(2)}s of audio at ${renderedBuffer.sampleRate}Hz`,
      );

      // Convert to WAV blob
      const wavBlob = this.audioBufferToWav(renderedBuffer);

      logger.log(
        `[WebAudioMixer] Mix complete, output size: ${wavBlob.size} bytes`,
      );

      // Store blob for retrieval
      this.cachedBlob = wavBlob;

      // Return dummy path (actual blob accessed via getBlob())
      return "blob://mixed-audio.wav";
    } catch (error) {
      logger.error("[WebAudioMixer] Mixing failed:", error);
      throw new AudioError(
        AudioErrorCode.MIXING_FAILED,
        `Failed to mix audio: ${(error as Error).message}`,
        "Audio mixing encountered an error",
        { tracks: tracks.length, originalError: error },
      );
    }
  }

  /**
   * Load audio file and decode to AudioBuffer
   */
  private async loadAudioBuffer(uri: string): Promise<AudioBuffer> {
    try {
      // Fetch audio data
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      // Create AudioContext if needed
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      // Decode audio data
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (error) {
      throw new AudioError(
        AudioErrorCode.MIXING_FAILED,
        `Failed to load audio from ${uri}: ${(error as Error).message}`,
        "Unable to load audio file for mixing",
        { uri, originalError: error },
      );
    }
  }

  /**
   * Scale volume from 0-100 to gain value with logarithmic curve
   * Matches Android implementation
   */
  private scaleVolume(volume: number): number {
    if (volume === 0) {
      return 0;
    } else if (volume === 100) {
      return 1;
    } else {
      // Logarithmic scaling: 1 - (Math.log(MAX_VOLUME - progress) / Math.log(MAX_VOLUME))
      return 1 - Math.log(100 - volume) / Math.log(100);
    }
  }

  /**
   * Estimate memory usage for a mix operation
   * Returns estimated memory in megabytes
   */
  private estimateMemoryUsage(
    durationSeconds: number,
    sampleRate: number,
    channels: number,
  ): number {
    // AudioBuffer uses Float32 (4 bytes per sample)
    // Plus WAV output uses Int16 (2 bytes per sample)
    const samplesPerChannel = durationSeconds * sampleRate;
    const audioBufferBytes = samplesPerChannel * channels * 4; // Float32
    const wavBytes = samplesPerChannel * channels * 2 + 44; // Int16 + header

    const totalBytes = audioBufferBytes + wavBytes;
    return totalBytes / (1024 * 1024);
  }

  /**
   * Convert AudioBuffer to WAV Blob using chunked processing
   * Processes audio data in chunks to reduce peak memory usage
   */
  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const sampleRate = buffer.sampleRate;
    const numChannels = buffer.numberOfChannels;
    const dataLength = buffer.length * numChannels * 2; // 16-bit samples

    // Create WAV header (44 bytes)
    const headerBuffer = new ArrayBuffer(44);
    const headerView = new DataView(headerBuffer);

    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // RIFF header
    writeString(headerView, 0, "RIFF");
    headerView.setUint32(4, 36 + dataLength, true);
    writeString(headerView, 8, "WAVE");

    // fmt chunk
    writeString(headerView, 12, "fmt ");
    headerView.setUint32(16, 16, true); // chunk size
    headerView.setUint16(20, 1, true); // PCM format
    headerView.setUint16(22, numChannels, true);
    headerView.setUint32(24, sampleRate, true);
    headerView.setUint32(28, sampleRate * numChannels * 2, true); // byte rate
    headerView.setUint16(32, numChannels * 2, true); // block align
    headerView.setUint16(34, 16, true); // bits per sample

    // data chunk header
    writeString(headerView, 36, "data");
    headerView.setUint32(40, dataLength, true);

    // Process audio data in chunks to reduce memory pressure
    const samplesPerChunk = Math.floor(sampleRate * WAV_CHUNK_SECONDS);
    const chunks: ArrayBuffer[] = [headerBuffer];

    // Get all channel data references once
    const channelData: Float32Array[] = [];
    for (let c = 0; c < numChannels; c++) {
      channelData.push(buffer.getChannelData(c));
    }

    // Process in chunks
    for (
      let chunkStart = 0;
      chunkStart < buffer.length;
      chunkStart += samplesPerChunk
    ) {
      const chunkEnd = Math.min(chunkStart + samplesPerChunk, buffer.length);
      const chunkSamples = chunkEnd - chunkStart;
      const chunkBytes = chunkSamples * numChannels * 2;

      const chunkBuffer = new ArrayBuffer(chunkBytes);
      const chunkView = new DataView(chunkBuffer);

      let pos = 0;
      for (let i = chunkStart; i < chunkEnd; i++) {
        for (let channel = 0; channel < numChannels; channel++) {
          const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
          const int16Sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
          chunkView.setInt16(pos, int16Sample, true);
          pos += 2;
        }
      }

      chunks.push(chunkBuffer);
    }

    logger.log(
      `[WebAudioMixer] WAV conversion: ${chunks.length - 1} chunks processed`,
    );

    return new Blob(chunks, { type: "audio/wav" });
  }

  /**
   * Cancel mixing (no-op for web since OfflineAudioContext cannot be cancelled)
   */
  protected async _cancel(): Promise<void> {
    // Web Audio API's OfflineAudioContext.startRendering() cannot be cancelled
    // Once started, it must complete
    logger.log("[WebAudioMixer] Cancel requested but not supported");
  }

  /**
   * Get the cached blob from the last mix operation
   */
  public getBlob(): Blob | null {
    return this.cachedBlob;
  }

  /**
   * Cleanup
   */
  public async cleanup(): Promise<void> {
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    this.cachedBlob = null;
  }
}
