/**
 * Mock Audio Player
 *
 * Simulates audio playback for development and testing.
 * No actual audio is played - updates state and simulates progress.
 */

import { BaseAudioPlayer } from '../BaseAudioPlayer';
import { PlaybackOptions, AudioMetadata } from '../../../types/audio';
import { getMockMetadata } from '../../../../__tests__/__fixtures__/mockAudioData';

export class MockAudioPlayer extends BaseAudioPlayer {
  private playbackTimer: NodeJS.Timeout | null = null;
  private currentPosition: number = 0;
  private duration: number = 0;

  /**
   * Simulate loading audio
   */
  protected async _load(uri: string, options?: PlaybackOptions): Promise<void> {
    console.log('[MockAudioPlayer] Loading audio:', uri, options);

    // Simulate loading delay
    await this.delay(150);

    // Get mock metadata
    const metadata = getMockMetadata(uri);
    this.duration = metadata.duration;
    this.currentPosition = 0;

    console.log(`[MockAudioPlayer] Loaded ${uri}, duration: ${this.duration}ms`);
  }

  /**
   * Simulate playback start
   */
  protected async _play(): Promise<void> {
    console.log('[MockAudioPlayer] Starting playback');

    // Start playback timer
    this.startPlaybackTimer();
  }

  /**
   * Simulate playback pause
   */
  protected async _pause(): Promise<void> {
    console.log('[MockAudioPlayer] Pausing playback');

    // Stop playback timer
    this.stopPlaybackTimer();
  }

  /**
   * Simulate playback stop
   */
  protected async _stop(): Promise<void> {
    console.log('[MockAudioPlayer] Stopping playback');

    // Stop timer and reset position
    this.stopPlaybackTimer();
    this.currentPosition = 0;
  }

  /**
   * Simulate speed change
   */
  protected async _setSpeed(speed: number): Promise<void> {
    console.log('[MockAudioPlayer] Setting speed to:', speed);

    // If playing, restart timer with new speed
    if (this._isPlaying) {
      this.stopPlaybackTimer();
      this.startPlaybackTimer();
    }
  }

  /**
   * Simulate volume change
   */
  protected async _setVolume(volume: number): Promise<void> {
    console.log('[MockAudioPlayer] Setting volume to:', volume);
  }

  /**
   * Simulate looping setting
   */
  protected async _setLooping(loop: boolean): Promise<void> {
    console.log('[MockAudioPlayer] Setting looping to:', loop);
  }

  /**
   * Get duration
   */
  protected async _getDuration(): Promise<number> {
    return this.duration;
  }

  /**
   * Get current position
   */
  protected async _getPosition(): Promise<number> {
    return this.currentPosition;
  }

  /**
   * Set playback position
   */
  protected async _setPosition(position: number): Promise<void> {
    console.log('[MockAudioPlayer] Seeking to:', position);
    this.currentPosition = Math.max(0, Math.min(position, this.duration));

    // Notify position update callback
    if (this._onPositionUpdate) {
      this._onPositionUpdate(this.currentPosition);
    }
  }

  /**
   * Get audio metadata
   */
  protected async _getMetadata(): Promise<AudioMetadata | null> {
    if (!this._currentUri) {
      return null;
    }
    return getMockMetadata(this._currentUri);
  }

  /**
   * Simulate unload
   */
  protected async _unload(): Promise<void> {
    console.log('[MockAudioPlayer] Unloading audio');

    this.stopPlaybackTimer();
    this.currentPosition = 0;
    this.duration = 0;
  }

  /**
   * Start playback simulation timer
   */
  private startPlaybackTimer(): void {
    if (this.playbackTimer) {
      return; // Already running
    }

    this.playbackTimer = setInterval(() => {
      // Update position based on speed
      const increment = this._updateInterval * this._speed;
      this.currentPosition += increment;

      // Check if reached end
      if (this.currentPosition >= this.duration) {
        if (this._looping) {
          // Loop back to start
          this.currentPosition = 0;
        } else {
          // Stop playback
          this.currentPosition = this.duration;
          this.stopPlaybackTimer();
          this._isPlaying = false;

          // Call complete callback
          if (this._onComplete) {
            this._onComplete();
          }
        }
      }

      // Call position update callback
      if (this._onPositionUpdate) {
        this._onPositionUpdate(this.currentPosition);
      }
    }, this._updateInterval);
  }

  /**
   * Stop playback simulation timer
   */
  private stopPlaybackTimer(): void {
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }
  }

  /**
   * Helper to simulate async delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
