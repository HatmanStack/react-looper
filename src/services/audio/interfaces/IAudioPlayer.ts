/**
 * IAudioPlayer Interface
 *
 * Defines the contract for audio playback implementations.
 * Platform-specific implementations (web and native) must implement this interface.
 *
 * Each player instance handles a single audio track. For multi-track playback,
 * create multiple player instances.
 */

import { PlaybackOptions, AudioMetadata } from "../../../types/audio";

export interface IAudioPlayer {
  /**
   * Load an audio file for playback
   *
   * Loads the audio file at the given URI and prepares it for playback.
   * Must be called before play().
   *
   * @param uri - URI/path to the audio file
   * @param options - Optional playback configuration
   * @throws {AudioError} FILE_NOT_FOUND if audio file doesn't exist
   * @throws {AudioError} INVALID_FORMAT if audio format is not supported
   * @throws {AudioError} PLAYBACK_FAILED if loading fails
   */
  load(uri: string, options?: PlaybackOptions): Promise<void>;

  /**
   * Start or resume playback
   *
   * @throws {AudioError} PLAYBACK_FAILED if playback cannot start
   */
  play(): Promise<void>;

  /**
   * Pause playback
   *
   * Preserves playback position. Use play() to resume.
   */
  pause(): Promise<void>;

  /**
   * Stop playback and reset position to beginning
   */
  stop(): Promise<void>;

  /**
   * Set playback speed
   *
   * @param speed - Speed multiplier (0.05 - 2.50)
   *                Matches Android: seekbar 3-102 divided by 41
   *                0.05 = slowest, 1.0 = normal, 2.50 = fastest
   * @throws {AudioError} PLAYBACK_FAILED if speed change fails
   */
  setSpeed(speed: number): Promise<void>;

  /**
   * Set playback volume
   *
   * Uses logarithmic scaling for natural volume perception:
   * volume_linear = 1 - (log(100 - volume) / log(100))
   *
   * @param volume - Volume level (0 - 100)
   *                 0 = muted, 100 = maximum
   * @throws {AudioError} PLAYBACK_FAILED if volume change fails
   */
  setVolume(volume: number): Promise<void>;

  /**
   * Enable or disable looping
   *
   * When enabled, playback automatically restarts when it reaches the end.
   *
   * @param loop - true to enable looping, false to disable
   */
  setLooping(loop: boolean): Promise<void>;

  /**
   * Get total duration of loaded audio
   *
   * @returns Duration in milliseconds, or 0 if no audio loaded
   */
  getDuration(): Promise<number>;

  /**
   * Get current playback position
   *
   * @returns Current position in milliseconds
   */
  getPosition(): Promise<number>;

  /**
   * Seek to a specific position
   *
   * @param position - Position in milliseconds
   */
  setPosition(position: number): Promise<void>;

  /**
   * Check if audio is currently playing
   *
   * @returns true if playing, false if paused/stopped
   */
  isPlaying(): boolean;

  /**
   * Check if audio is loaded
   *
   * @returns true if audio file is loaded, false otherwise
   */
  isLoaded(): boolean;

  /**
   * Get metadata about the loaded audio
   *
   * @returns Audio metadata or null if no audio loaded
   */
  getMetadata(): Promise<AudioMetadata | null>;

  /**
   * Unload the current audio and release resources
   *
   * Should be called when switching tracks or when the player is no longer needed.
   */
  unload(): Promise<void>;

  /**
   * Set a callback to be called when playback completes
   *
   * @param callback - Function to call when audio finishes playing
   */
  onPlaybackComplete(callback: () => void): void;

  /**
   * Set a callback for playback position updates
   *
   * Useful for implementing progress bars.
   *
   * @param callback - Function to call with current position in ms
   * @param interval - Update interval in milliseconds (default: 100ms)
   */
  onPositionUpdate(
    callback: (position: number) => void,
    interval?: number,
  ): void;
}
