/**
 * WebAudioPlayer
 *
 * Web-specific audio playback using Web Audio API.
 * Provides multi-track playback with independent speed and volume controls.
 */

import { BaseAudioPlayer } from "./BaseAudioPlayer";
import {
  PlaybackOptions,
  AudioMetadata,
  AudioErrorCode,
} from "../../types/audio";
import { AudioError } from "./AudioError";

export class WebAudioPlayer extends BaseAudioPlayer {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private startTime: number = 0;
  private pauseTime: number = 0;
  private positionUpdateTimer: number | null = null;

  constructor() {
    super();
  }

  /**
   * Load audio file from URI
   */
  protected async _load(uri: string, options?: PlaybackOptions): Promise<void> {
    try {
      // Create AudioContext if needed
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      // Resume context if suspended (autoplay policy)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      // Fetch audio data
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      // Decode audio data
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);

      // Apply initial volume if provided
      if (options?.volume !== undefined) {
        this._applyVolumeToGainNode(options.volume);
      } else {
        this._applyVolumeToGainNode(this._volume);
      }
    } catch (error) {
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        `Failed to load audio: ${(error as Error).message}`,
        "Unable to load audio file",
        { uri, originalError: error },
      );
    }
  }

  /**
   * Start playback
   */
  protected async _play(): Promise<void> {
    if (!this.audioContext || !this.audioBuffer || !this.gainNode) {
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        "Audio not loaded",
        "Please load an audio file first",
      );
    }

    try {
      // Resume context if suspended
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      // Create new source node
      this.sourceNode = this.audioContext.createBufferSource();
      this.sourceNode.buffer = this.audioBuffer;

      // Apply playback rate (speed)
      this.sourceNode.playbackRate.value = this._speed;

      // Apply looping
      this.sourceNode.loop = this._looping;

      // Connect to gain node
      this.sourceNode.connect(this.gainNode);

      // Set up playback completion handler
      this.sourceNode.onended = () => {
        if (!this._looping && this._isPlaying) {
          this.triggerPlaybackComplete();
        }
      };

      // Calculate start offset based on pause position
      const offset = this.pauseTime;
      this.sourceNode.start(0, offset);
      this.startTime = this.audioContext.currentTime - offset;

      // Start position update timer
      this.startPositionUpdateTimer();
    } catch (error) {
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        `Failed to start playback: ${(error as Error).message}`,
        "Unable to play audio",
        { originalError: error },
      );
    }
  }

  /**
   * Pause playback
   */
  protected async _pause(): Promise<void> {
    if (!this.sourceNode || !this.audioContext) {
      return;
    }

    try {
      // Store current position
      this.pauseTime = this.audioContext.currentTime - this.startTime;

      // Stop source node
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;

      // Stop position updates
      this.stopPositionUpdateTimer();
    } catch (error) {
      // Ignore errors if already stopped
    }
  }

  /**
   * Stop playback
   */
  protected async _stop(): Promise<void> {
    if (!this.sourceNode) {
      return;
    }

    try {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    } catch (error) {
      // Ignore errors if already stopped
    }

    // Reset position
    this.startTime = 0;
    this.pauseTime = 0;

    // Stop position updates
    this.stopPositionUpdateTimer();
  }

  /**
   * Set playback speed
   */
  protected async _setSpeed(speed: number): Promise<void> {
    if (this.sourceNode) {
      this.sourceNode.playbackRate.value = speed;
    }
  }

  /**
   * Set volume
   */
  protected async _setVolume(volume: number): Promise<void> {
    this._applyVolumeToGainNode(volume);
  }

  /**
   * Apply volume to gain node with logarithmic scaling
   */
  private _applyVolumeToGainNode(volume: number): void {
    if (!this.gainNode) {
      return;
    }

    // Logarithmic scaling for natural volume perception
    // Matches Android: 1 - (Math.log(MAX_VOLUME - progress) / Math.log(MAX_VOLUME))
    let scaledVolume: number;
    if (volume === 0) {
      scaledVolume = 0;
    } else if (volume === 100) {
      scaledVolume = 1;
    } else {
      scaledVolume = 1 - Math.log(100 - volume) / Math.log(100);
    }

    this.gainNode.gain.value = scaledVolume;
  }

  /**
   * Set looping
   */
  protected async _setLooping(loop: boolean): Promise<void> {
    if (this.sourceNode) {
      this.sourceNode.loop = loop;
    }
  }

  /**
   * Get duration
   */
  protected async _getDuration(): Promise<number> {
    if (!this.audioBuffer) {
      return 0;
    }
    // Return duration in milliseconds
    return this.audioBuffer.duration * 1000;
  }

  /**
   * Get current position
   */
  protected async _getPosition(): Promise<number> {
    if (!this.audioContext || !this.audioBuffer) {
      return 0;
    }

    if (this._isPlaying && this.sourceNode) {
      // Calculate current position while playing
      const currentPosition = this.audioContext.currentTime - this.startTime;

      // Handle looping
      if (this._looping && this.audioBuffer) {
        const position = currentPosition % this.audioBuffer.duration;
        return position * 1000;
      }

      return currentPosition * 1000;
    }

    // Return pause position when paused
    return this.pauseTime * 1000;
  }

  /**
   * Set playback position
   */
  protected async _setPosition(position: number): Promise<void> {
    const positionSeconds = position / 1000;

    if (this._isPlaying) {
      // If playing, restart from new position
      const wasPlaying = this._isPlaying;
      await this.pause();
      this.pauseTime = positionSeconds;
      if (wasPlaying) {
        await this.play();
      }
    } else {
      // Just update pause position
      this.pauseTime = positionSeconds;
    }
  }

  /**
   * Get metadata
   */
  protected async _getMetadata(): Promise<AudioMetadata | null> {
    if (!this.audioBuffer) {
      return null;
    }

    return {
      duration: this.audioBuffer.duration * 1000,
      sampleRate: this.audioBuffer.sampleRate,
      channels: this.audioBuffer.numberOfChannels,
    };
  }

  /**
   * Unload audio
   */
  protected async _unload(): Promise<void> {
    // Stop position updates
    this.stopPositionUpdateTimer();

    // Stop and disconnect source
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch {
        // Ignore if already stopped
      }
      this.sourceNode = null;
    }

    // Disconnect and cleanup gain node
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    // Release audio buffer
    this.audioBuffer = null;

    // Reset timers
    this.startTime = 0;
    this.pauseTime = 0;
  }

  /**
   * Start position update timer
   */
  private startPositionUpdateTimer(): void {
    this.stopPositionUpdateTimer();

    if (this._onPositionUpdate) {
      this.positionUpdateTimer = window.setInterval(() => {
        this.triggerPositionUpdate();
      }, this._updateInterval);
    }
  }

  /**
   * Stop position update timer
   */
  private stopPositionUpdateTimer(): void {
    if (this.positionUpdateTimer !== null) {
      clearInterval(this.positionUpdateTimer);
      this.positionUpdateTimer = null;
    }
  }

  /**
   * Cleanup on destroy
   */
  public async cleanup(): Promise<void> {
    await this.unload();

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }
}
