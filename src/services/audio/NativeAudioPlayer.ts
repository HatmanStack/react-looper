/**
 * NativeAudioPlayer
 *
 * Native (iOS/Android) audio playback using expo-av.
 * Provides multi-track playback with independent speed and volume controls.
 */

import { Audio } from "expo-av";
import { BaseAudioPlayer } from "./BaseAudioPlayer";
import {
  PlaybackOptions,
  AudioMetadata,
  AudioErrorCode,
} from "../../types/audio";
import { AudioError } from "./AudioError";

export class NativeAudioPlayer extends BaseAudioPlayer {
  private sound: Audio.Sound | null = null;
  private positionUpdateTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  /**
   * Load audio file from URI
   */
  protected async _load(
    uri: string,
    _options?: PlaybackOptions,
  ): Promise<void> {
    try {
      console.log(`[NativeAudioPlayer] Loading audio from ${uri}`);

      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Create sound instance
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: false,
          isLooping: this._looping,
          rate: this._speed,
          volume: this._calculateScaledVolume(this._volume),
          shouldCorrectPitch: true, // Preserve pitch when changing speed
        },
      );

      this.sound = sound;

      // Get status to verify loaded
      const status = await sound.getStatusAsync();
      if (!status.isLoaded) {
        throw new Error("Failed to load audio");
      }

      console.log(
        `[NativeAudioPlayer] Loaded audio: ${status.durationMillis}ms, ${status.uri}`,
      );

      // Set up playback status update callback
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          // Update internal state
          this._isPlaying = status.isPlaying;

          // Trigger position update callback
          if (status.isPlaying && this._onPositionUpdate) {
            this._onPositionUpdate(status.positionMillis);
          }

          // Trigger completion callback
          if (status.didJustFinish && !status.isLooping && this._onComplete) {
            this.triggerPlaybackComplete();
          }
        }
      });
    } catch (error) {
      this.sound = null;
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
    if (!this.sound) {
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        "Sound not loaded",
        "Please load an audio file first",
      );
    }

    try {
      await this.sound.playAsync();
      console.log("[NativeAudioPlayer] Playback started");
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
    if (!this.sound) {
      return;
    }

    try {
      await this.sound.pauseAsync();
      console.log("[NativeAudioPlayer] Paused");
    } catch (error) {
      console.warn("[NativeAudioPlayer] Pause error:", error);
    }
  }

  /**
   * Stop playback
   */
  protected async _stop(): Promise<void> {
    if (!this.sound) {
      return;
    }

    try {
      await this.sound.stopAsync();
      await this.sound.setPositionAsync(0); // Reset to beginning
      console.log("[NativeAudioPlayer] Stopped");
    } catch (error) {
      console.warn("[NativeAudioPlayer] Stop error:", error);
    }
  }

  /**
   * Set playback speed
   */
  protected async _setSpeed(speed: number): Promise<void> {
    if (!this.sound) {
      return;
    }

    try {
      // Set rate with pitch correction enabled
      await this.sound.setRateAsync(speed, true);
      console.log(`[NativeAudioPlayer] Speed set to ${speed}x`);
    } catch (error) {
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        `Failed to set speed: ${(error as Error).message}`,
        "Unable to change playback speed",
        { speed, originalError: error },
      );
    }
  }

  /**
   * Set volume
   */
  protected async _setVolume(volume: number): Promise<void> {
    if (!this.sound) {
      return;
    }

    try {
      const scaledVolume = this._calculateScaledVolume(volume);
      await this.sound.setVolumeAsync(scaledVolume);
      console.log(
        `[NativeAudioPlayer] Volume set to ${volume} (scaled: ${scaledVolume})`,
      );
    } catch (error) {
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        `Failed to set volume: ${(error as Error).message}`,
        "Unable to change volume",
        { volume, originalError: error },
      );
    }
  }

  /**
   * Calculate scaled volume with logarithmic scaling
   * Matches Android implementation for natural volume perception
   */
  private _calculateScaledVolume(volume: number): number {
    if (volume === 0) {
      return 0;
    } else if (volume === 100) {
      return 1;
    } else {
      // Logarithmic scaling: 1 - (log(100 - volume) / log(100))
      return 1 - Math.log(100 - volume) / Math.log(100);
    }
  }

  /**
   * Set looping
   */
  protected async _setLooping(loop: boolean): Promise<void> {
    if (!this.sound) {
      return;
    }

    try {
      await this.sound.setIsLoopingAsync(loop);
      console.log(
        `[NativeAudioPlayer] Looping ${loop ? "enabled" : "disabled"}`,
      );
    } catch (error) {
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        `Failed to set looping: ${(error as Error).message}`,
        "Unable to change looping",
        { loop, originalError: error },
      );
    }
  }

  /**
   * Get duration
   */
  protected async _getDuration(): Promise<number> {
    if (!this.sound) {
      return 0;
    }

    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        return status.durationMillis || 0;
      }
      return 0;
    } catch (error) {
      console.warn("[NativeAudioPlayer] Get duration error:", error);
      return 0;
    }
  }

  /**
   * Get current position
   */
  protected async _getPosition(): Promise<number> {
    if (!this.sound) {
      return 0;
    }

    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        return status.positionMillis || 0;
      }
      return 0;
    } catch (error) {
      console.warn("[NativeAudioPlayer] Get position error:", error);
      return 0;
    }
  }

  /**
   * Set playback position
   */
  protected async _setPosition(position: number): Promise<void> {
    if (!this.sound) {
      return;
    }

    try {
      await this.sound.setPositionAsync(position);
      console.log(`[NativeAudioPlayer] Position set to ${position}ms`);
    } catch (error) {
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        `Failed to set position: ${(error as Error).message}`,
        "Unable to seek",
        { position, originalError: error },
      );
    }
  }

  /**
   * Get metadata
   */
  protected async _getMetadata(): Promise<AudioMetadata | null> {
    if (!this.sound) {
      return null;
    }

    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        return {
          duration: status.durationMillis || 0,
        };
      }
      return null;
    } catch (error) {
      console.warn("[NativeAudioPlayer] Get metadata error:", error);
      return null;
    }
  }

  /**
   * Unload audio
   */
  protected async _unload(): Promise<void> {
    if (!this.sound) {
      return;
    }

    try {
      await this.sound.unloadAsync();
      this.sound = null;
      console.log("[NativeAudioPlayer] Unloaded");
    } catch (error) {
      console.warn("[NativeAudioPlayer] Unload error:", error);
      this.sound = null;
    }
  }

  /**
   * Cleanup on destroy
   */
  public async cleanup(): Promise<void> {
    await this.unload();
  }
}
