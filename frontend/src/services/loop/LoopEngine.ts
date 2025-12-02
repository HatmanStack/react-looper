/**
 * Loop Engine Service
 *
 * Coordinates loop calculations and provides a high-level API for UI
 * and audio components to query loop information.
 *
 * Integrates:
 * - Loop utilities (calculations)
 * - Track store (master loop duration)
 * - Playback store (loop mode)
 */

import { useTrackStore } from "../../store/useTrackStore";
import { usePlaybackStore } from "../../store/usePlaybackStore";
import type { Track } from "../../types";
import {
  calculateLoopCount,
  calculateTrackLoopBoundaries,
} from "../../utils/loopUtils";

/**
 * Master loop information
 */
export interface MasterLoopInfo {
  /** Master loop duration in milliseconds */
  duration: number;
  /** ID of the master track (first track) */
  trackId: string | null;
  /** Master track object */
  track: Track | null;
}

/**
 * Track loop information
 */
export interface TrackLoopInfo {
  /** Number of times track loops within master duration */
  loopCount: number;
  /** Timestamps where track restarts (in ms) */
  boundaries: number[];
  /** Total duration (equals master loop duration) */
  totalDuration: number;
}

/**
 * Loop Engine
 *
 * Service class that coordinates loop calculations and provides
 * high-level API for querying loop information.
 *
 * @example
 * const engine = new LoopEngine();
 * const masterInfo = engine.getMasterLoopInfo();
 * const trackInfo = engine.getTrackLoopInfo('track-2');
 * const shouldLoop = engine.shouldTrackLoop('track-2');
 */
export class LoopEngine {
  /**
   * Get master loop information
   *
   * Returns details about the master loop (first track's speed-adjusted duration)
   *
   * @returns Master loop info with duration, track ID, and track object
   */
  getMasterLoopInfo(): MasterLoopInfo {
    const trackStore = useTrackStore.getState();
    const masterTrack = trackStore.getMasterTrack();
    const duration = trackStore.getMasterLoopDuration();

    return {
      duration,
      trackId: masterTrack?.id ?? null,
      track: masterTrack,
    };
  }

  /**
   * Get loop information for a specific track
   *
   * Calculates how many times the track loops and where it restarts
   * within the master loop duration.
   *
   * @param trackId - ID of the track to get loop info for
   * @returns Loop info with count, boundaries, and total duration
   */
  getTrackLoopInfo(trackId: string): TrackLoopInfo {
    const trackStore = useTrackStore.getState();
    const track = trackStore.getTrack(trackId);
    const masterDuration = trackStore.getMasterLoopDuration();

    // Handle track not found
    if (!track) {
      return {
        loopCount: 1,
        boundaries: [],
        totalDuration: 0,
      };
    }

    const loopCount = calculateLoopCount(track.duration, masterDuration);
    const boundaries = calculateTrackLoopBoundaries(
      track.duration,
      masterDuration,
    );

    return {
      loopCount,
      boundaries,
      totalDuration: masterDuration,
    };
  }

  /**
   * Check if a track should loop based on current mode and master duration
   *
   * A track should loop if:
   * - Loop mode is enabled
   * - Track is shorter than master loop duration
   * - Track exists
   *
   * @param trackId - ID of track to check
   * @returns true if track should loop
   */
  shouldTrackLoop(trackId: string): boolean {
    const playbackStore = usePlaybackStore.getState();
    const trackStore = useTrackStore.getState();

    // Check if loop mode is enabled
    if (!playbackStore.loopMode) {
      return false;
    }

    // Get track and master duration
    const track = trackStore.getTrack(trackId);
    if (!track) {
      return false;
    }

    const masterDuration = trackStore.getMasterLoopDuration();

    // Track should loop if it's shorter than master duration
    // (Master track itself doesn't loop)
    return track.duration < masterDuration;
  }

  /**
   * Calculate total export duration
   *
   * Calculates the total duration for export based on:
   * - Master loop duration
   * - Number of loop repetitions
   * - Fadeout duration
   *
   * Formula: (masterLoopDuration * loopCount) + fadeout
   *
   * @param loopCount - Number of times to repeat the master loop
   * @param fadeout - Fadeout duration in milliseconds
   * @returns Total export duration in milliseconds
   */
  calculateExportDuration(loopCount: number, fadeout: number): number {
    const trackStore = useTrackStore.getState();
    const masterDuration = trackStore.getMasterLoopDuration();

    // Handle edge cases
    if (loopCount <= 0) {
      return fadeout;
    }

    return masterDuration * loopCount + fadeout;
  }

  /**
   * Check if loop mode is currently enabled
   *
   * @returns true if loop mode is enabled
   */
  isLoopModeEnabled(): boolean {
    const playbackStore = usePlaybackStore.getState();
    return playbackStore.loopMode;
  }
}
