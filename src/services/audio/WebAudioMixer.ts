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
   * Convert AudioBuffer to WAV Blob
   */
  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const wavBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(wavBuffer);

    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const sampleRate = buffer.sampleRate;
    const numChannels = buffer.numberOfChannels;

    // RIFF header
    writeString(0, "RIFF");
    view.setUint32(4, 36 + length, true);
    writeString(8, "WAVE");

    // fmt chunk
    writeString(12, "fmt ");
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true); // byte rate
    view.setUint16(32, numChannels * 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample

    // data chunk
    writeString(36, "data");
    view.setUint32(40, length, true);

    // Write audio data
    const offset = 44;
    const channels = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    let pos = 0;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        view.setInt16(
          offset + pos,
          sample < 0 ? sample * 0x8000 : sample * 0x7fff,
          true,
        );
        pos += 2;
      }
    }

    return new Blob([wavBuffer], { type: "audio/wav" });
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
