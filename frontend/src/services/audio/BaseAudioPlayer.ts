/**
 * BaseAudioPlayer Abstract Class
 *
 * Provides common functionality for audio playback implementations.
 * Platform-specific implementations should extend this class.
 */

import { IAudioPlayer } from "./interfaces/IAudioPlayer";
import {
  PlaybackOptions,
  AudioMetadata,
  AudioErrorCode,
} from "../../types/audio";
import { AudioError } from "./AudioError";

export abstract class BaseAudioPlayer implements IAudioPlayer {
  /**
   * Currently loaded audio URI
   */
  protected _currentUri: string | null = null;

  /**
   * Whether audio is currently playing
   */
  protected _isPlaying: boolean = false;

  /**
   * Whether audio is loaded and ready
   */
  protected _isLoaded: boolean = false;

  /**
   * Current playback speed
   */
  protected _speed: number = 1.0;

  /**
   * Current volume (0-100)
   */
  protected _volume: number = 100;

  /**
   * Whether looping is enabled
   */
  protected _looping: boolean = true; // Default to loop (matches Android)

  /**
   * Playback complete callback
   */
  protected _onComplete?: () => void;

  /**
   * Position update callback
   */
  protected _onPositionUpdate?: (position: number) => void;

  /**
   * Position update interval in ms
   */
  protected _updateInterval: number = 100;

  // Abstract methods - must be implemented by platform-specific classes

  protected abstract _load(
    uri: string,
    options?: PlaybackOptions,
  ): Promise<void>;
  protected abstract _play(): Promise<void>;
  protected abstract _pause(): Promise<void>;
  protected abstract _stop(): Promise<void>;
  protected abstract _setSpeed(speed: number): Promise<void>;
  protected abstract _setVolume(volume: number): Promise<void>;
  protected abstract _setLooping(loop: boolean): Promise<void>;
  protected abstract _getDuration(): Promise<number>;
  protected abstract _getPosition(): Promise<number>;
  protected abstract _setPosition(position: number): Promise<void>;
  protected abstract _getMetadata(): Promise<AudioMetadata | null>;
  protected abstract _unload(): Promise<void>;

  /**
   * Load audio file with validation
   */
  public async load(uri: string, options?: PlaybackOptions): Promise<void> {
    // Validate URI
    if (!uri || typeof uri !== "string") {
      throw new AudioError(
        AudioErrorCode.FILE_NOT_FOUND,
        "Invalid URI provided",
        "Invalid audio file",
      );
    }

    // Unload previous audio if any
    if (this._isLoaded) {
      await this.unload();
    }

    try {
      await this._load(uri, options);

      this._currentUri = uri;
      this._isLoaded = true;

      // Apply options if provided
      if (options) {
        if (options.speed !== undefined) {
          await this.setSpeed(options.speed);
        }
        if (options.volume !== undefined) {
          await this.setVolume(options.volume);
        }
        if (options.loop !== undefined) {
          await this.setLooping(options.loop);
        }
      }
    } catch (error) {
      this._currentUri = null;
      this._isLoaded = false;

      if (error instanceof AudioError) {
        throw error;
      }
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        `Failed to load audio: ${(error as Error).message}`,
        undefined,
        { uri, originalError: error },
      );
    }
  }

  /**
   * Play audio with validation
   */
  public async play(): Promise<void> {
    if (!this._isLoaded) {
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        "Cannot play: no audio loaded",
        "Please load an audio file first",
      );
    }

    try {
      await this._play();
      this._isPlaying = true;
    } catch (error) {
      this._isPlaying = false;

      if (error instanceof AudioError) {
        throw error;
      }
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        `Failed to play audio: ${(error as Error).message}`,
        undefined,
        { uri: this._currentUri, originalError: error },
      );
    }
  }

  /**
   * Pause playback
   */
  public async pause(): Promise<void> {
    if (!this._isLoaded) {
      return; // Nothing to pause
    }

    try {
      await this._pause();
      this._isPlaying = false;
    } catch (error) {
      if (error instanceof AudioError) {
        throw error;
      }
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        `Failed to pause audio: ${(error as Error).message}`,
        undefined,
        { originalError: error },
      );
    }
  }

  /**
   * Stop playback
   */
  public async stop(): Promise<void> {
    if (!this._isLoaded) {
      return; // Nothing to stop
    }

    try {
      await this._stop();
      this._isPlaying = false;
    } catch (error) {
      if (error instanceof AudioError) {
        throw error;
      }
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        `Failed to stop audio: ${(error as Error).message}`,
        undefined,
        { originalError: error },
      );
    }
  }

  /**
   * Set playback speed with validation
   */
  public async setSpeed(speed: number): Promise<void> {
    // Validate speed range (matches Android: 0.05 - 2.50)
    if (speed < 0.05 || speed > 2.5) {
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        `Speed must be between 0.05 and 2.50, got ${speed}`,
        "Invalid playback speed",
      );
    }

    if (!this._isLoaded) {
      // Store for later if no audio loaded
      this._speed = speed;
      return;
    }

    try {
      await this._setSpeed(speed);
      this._speed = speed;
    } catch (error) {
      if (error instanceof AudioError) {
        throw error;
      }
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        `Failed to set speed: ${(error as Error).message}`,
        undefined,
        { speed, originalError: error },
      );
    }
  }

  /**
   * Set volume with validation
   */
  public async setVolume(volume: number): Promise<void> {
    // Validate volume range
    if (volume < 0 || volume > 100) {
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        `Volume must be between 0 and 100, got ${volume}`,
        "Invalid volume level",
      );
    }

    if (!this._isLoaded) {
      // Store for later if no audio loaded
      this._volume = volume;
      return;
    }

    try {
      await this._setVolume(volume);
      this._volume = volume;
    } catch (error) {
      if (error instanceof AudioError) {
        throw error;
      }
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        `Failed to set volume: ${(error as Error).message}`,
        undefined,
        { volume, originalError: error },
      );
    }
  }

  /**
   * Enable or disable looping
   */
  public async setLooping(loop: boolean): Promise<void> {
    if (!this._isLoaded) {
      // Store for later if no audio loaded
      this._looping = loop;
      return;
    }

    try {
      await this._setLooping(loop);
      this._looping = loop;
    } catch (error) {
      if (error instanceof AudioError) {
        throw error;
      }
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        `Failed to set looping: ${(error as Error).message}`,
        undefined,
        { loop, originalError: error },
      );
    }
  }

  /**
   * Get duration
   */
  public async getDuration(): Promise<number> {
    if (!this._isLoaded) {
      return 0;
    }
    return this._getDuration();
  }

  /**
   * Get current position
   */
  public async getPosition(): Promise<number> {
    if (!this._isLoaded) {
      return 0;
    }
    return this._getPosition();
  }

  /**
   * Set playback position
   */
  public async setPosition(position: number): Promise<void> {
    if (!this._isLoaded) {
      return;
    }

    if (position < 0) {
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        "Position cannot be negative",
        "Invalid position",
      );
    }

    await this._setPosition(position);
  }

  /**
   * Check if playing
   */
  public isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * Check if loaded
   */
  public isLoaded(): boolean {
    return this._isLoaded;
  }

  /**
   * Get metadata
   */
  public async getMetadata(): Promise<AudioMetadata | null> {
    if (!this._isLoaded) {
      return null;
    }
    return this._getMetadata();
  }

  /**
   * Unload audio
   */
  public async unload(): Promise<void> {
    try {
      // Stop playback if playing
      if (this._isPlaying) {
        await this.stop();
      }

      await this._unload();
    } finally {
      // Always reset state
      this._currentUri = null;
      this._isLoaded = false;
      this._isPlaying = false;
    }
  }

  /**
   * Set playback complete callback
   */
  public onPlaybackComplete(callback: () => void): void {
    this._onComplete = callback;
  }

  /**
   * Set position update callback
   */
  public onPositionUpdate(
    callback: (position: number) => void,
    interval: number = 100,
  ): void {
    this._onPositionUpdate = callback;
    this._updateInterval = interval;
  }

  /**
   * Trigger playback complete callback
   */
  protected triggerPlaybackComplete(): void {
    this._isPlaying = false;
    if (this._onComplete) {
      this._onComplete();
    }
  }

  /**
   * Trigger position update callback
   */
  protected async triggerPositionUpdate(): Promise<void> {
    if (this._onPositionUpdate && this._isLoaded) {
      const position = await this.getPosition();
      this._onPositionUpdate(position);
    }
  }
}
