/**
 * Track Type Definition
 *
 * Represents an audio track in the Looper app
 */

export interface Track {
  /**
   * Unique identifier for the track
   */
  id: string;

  /**
   * Display name of the track
   */
  name: string;

  /**
   * URI/path to the audio file
   */
  uri: string;

  /**
   * Duration of the track in milliseconds
   */
  duration: number;

  /**
   * Playback speed multiplier (0.05 - 2.50)
   * Android uses range 3-102, mapped to 0.05-2.50 by dividing by 41
   */
  speed: number;

  /**
   * Volume level (0-100)
   */
  volume: number;

  /**
   * Whether the track is currently playing
   */
  isPlaying: boolean;

  /**
   * Whether the track is selected for saving
   * When selected, shows red highlight border
   */
  selected?: boolean;

  /**
   * Sync multiplier for locking playback speed to the master loop duration.
   * When set to a number, the track is synced at that multiplier (e.g., 1 = match master duration).
   * When null or undefined, the track is in manual speed mode.
   */
  syncMultiplier?: number | null;

  /**
   * Timestamp when the track was created
   */
  createdAt: number;
}
