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
      console.log(`[WebAudioMixer] Mixing ${tracks.length} tracks...`);

      // Load all audio buffers
      const audioBuffers = await Promise.all(
        tracks.map((track) => this.loadAudioBuffer(track.uri)),
      );

      // Find the longest duration
      const maxDuration = Math.max(
        ...audioBuffers.map((buffer) => buffer.duration),
      );
      const sampleRate = audioBuffers[0].sampleRate;

      console.log(
        `[WebAudioMixer] Max duration: ${maxDuration}s, Sample rate: ${sampleRate}Hz`,
      );

      // Create offline context for rendering
      const offlineContext = new OfflineAudioContext({
        numberOfChannels: 2,
        length: maxDuration * sampleRate,
        sampleRate,
      });

      // TODO (Phase 4): Apply crossfade from settings when looping tracks
      // const crossfadeDuration = useSettingsStore.getState().loopCrossfadeDuration;
      // Apply crossfade at loop boundaries if crossfadeDuration > 0

      // Create and connect source nodes for each track
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        const buffer = audioBuffers[i];

        // Create source node
        const source = offlineContext.createBufferSource();
        source.buffer = buffer;

        // Apply speed (playback rate)
        source.playbackRate.value = track.speed;

        // Create gain node for volume
        const gainNode = offlineContext.createGain();
        const scaledVolume = this.scaleVolume(track.volume);
        gainNode.gain.value = scaledVolume;

        // Connect: source -> gain -> destination
        source.connect(gainNode);
        gainNode.connect(offlineContext.destination);

        // Start playback
        source.start(0);

        console.log(
          `[WebAudioMixer] Track ${i + 1}: speed=${track.speed}, volume=${track.volume} (scaled=${scaledVolume.toFixed(3)})`,
        );
      }

      // Render the mixed audio
      console.log("[WebAudioMixer] Rendering mixed audio...");
      const renderedBuffer = await offlineContext.startRendering();

      console.log(
        `[WebAudioMixer] Rendered ${renderedBuffer.duration}s of audio at ${renderedBuffer.sampleRate}Hz`,
      );

      // Convert to WAV blob
      const wavBlob = this.audioBufferToWav(renderedBuffer);

      console.log(
        `[WebAudioMixer] Mix complete, output size: ${wavBlob.size} bytes`,
      );

      // Store blob for retrieval
      this.cachedBlob = wavBlob;

      // Return dummy path (actual blob accessed via getBlob())
      return "blob://mixed-audio.wav";
    } catch (error) {
      console.error("[WebAudioMixer] Mixing failed:", error);
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
    console.log("[WebAudioMixer] Cancel requested but not supported");
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
