/**
 * Loop Engine Service
 *
 * Coordinates loop calculations and provides a high-level API for UI
 * and audio components to query loop information.
 *
 * Pure calculation service - accepts data as parameters instead of
 * reading from stores directly.
 *
 * Integrates:
 * - Loop utilities (calculations)
 */

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
 * All methods accept data as parameters, making the engine a pure
 * calculation service with no store dependencies.
 *
 * @example
 * const engine = new LoopEngine();
 * const masterInfo = engine.getMasterLoopInfo(tracks, masterLoopDuration);
 * const trackInfo = engine.getTrackLoopInfo('track-2', tracks, masterLoopDuration);
 * const shouldLoop = engine.shouldTrackLoop('track-2', tracks, masterLoopDuration, true);
 */
export class LoopEngine {
  /**
   * Get master loop information
   *
   * Returns details about the master loop (first track's speed-adjusted duration)
   *
   * @param tracks - Array of all tracks
   * @param masterLoopDuration - Pre-calculated master loop duration in ms
   * @returns Master loop info with duration, track ID, and track object
   */
  getMasterLoopInfo(
    tracks: Track[],
    masterLoopDuration: number,
  ): MasterLoopInfo {
    const masterTrack = tracks.length > 0 ? tracks[0] : null;

    return {
      duration: masterLoopDuration,
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
   * @param tracks - Array of all tracks
   * @param masterLoopDuration - Pre-calculated master loop duration in ms
   * @returns Loop info with count, boundaries, and total duration
   */
  getTrackLoopInfo(
    trackId: string,
    tracks: Track[],
    masterLoopDuration: number,
  ): TrackLoopInfo {
    const track = tracks.find((t) => t.id === trackId);

    // Handle track not found
    if (!track) {
      return {
        loopCount: 1,
        boundaries: [],
        totalDuration: 0,
      };
    }

    const loopCount = calculateLoopCount(track.duration, masterLoopDuration);
    const boundaries = calculateTrackLoopBoundaries(
      track.duration,
      masterLoopDuration,
    );

    return {
      loopCount,
      boundaries,
      totalDuration: masterLoopDuration,
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
   * @param tracks - Array of all tracks
   * @param masterLoopDuration - Pre-calculated master loop duration in ms
   * @param loopMode - Whether loop mode is enabled
   * @returns true if track should loop
   */
  shouldTrackLoop(
    trackId: string,
    tracks: Track[],
    masterLoopDuration: number,
    loopMode: boolean,
  ): boolean {
    // Check if loop mode is enabled
    if (!loopMode) {
      return false;
    }

    // Get track
    const track = tracks.find((t) => t.id === trackId);
    if (!track) {
      return false;
    }

    // Track should loop if it's shorter than master duration
    // (Master track itself doesn't loop)
    return track.duration < masterLoopDuration;
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
   * @param masterLoopDuration - Master loop duration in ms
   * @param loopCount - Number of times to repeat the master loop
   * @param fadeout - Fadeout duration in milliseconds
   * @returns Total export duration in milliseconds
   */
  calculateExportDuration(
    masterLoopDuration: number,
    loopCount: number,
    fadeout: number,
  ): number {
    // Handle edge cases
    if (loopCount <= 0) {
      return fadeout;
    }

    return masterLoopDuration * loopCount + fadeout;
  }

  /**
   * Check if loop mode is currently enabled
   *
   * @param loopMode - Whether loop mode is enabled
   * @returns true if loop mode is enabled
   */
  isLoopModeEnabled(loopMode: boolean): boolean {
    return loopMode;
  }
}
