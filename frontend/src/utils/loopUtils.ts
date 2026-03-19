/**
 * Loop Utilities
 *
 * Core calculation utilities for looper functionality.
 * These utilities handle master loop duration calculation, track repetition
 * counts, and loop boundary determination.
 */

import type { Track } from "../types";

/**
 * Default speed when track speed is missing or invalid
 */
const DEFAULT_SPEED = 1.0;

/**
 * Minimum valid speed (matches Android app minimum)
 */
export const MIN_SPEED = 0.05;

/**
 * Maximum valid speed (matches Android app maximum)
 */
export const MAX_SPEED = 2.5;

/**
 * Calculate the master loop duration based on the first track's speed-adjusted duration.
 *
 * The master loop duration is the reference duration that all other tracks will loop to fill.
 * It's calculated as: first_track_duration / first_track_speed
 *
 * @param tracks - Array of tracks (first track becomes master)
 * @returns Speed-adjusted duration of first track in milliseconds, or 0 if no tracks exist
 *
 * @example
 * // 10 second track at 0.5x speed = 20 second loop
 * calculateMasterLoopDuration([{ duration: 10000, speed: 0.5, ... }]) // => 20000
 */
export function calculateMasterLoopDuration(tracks: Track[]): number {
  if (tracks.length === 0) {
    return 0;
  }

  const masterTrack = tracks[0];
  return calculateSpeedAdjustedDuration(
    masterTrack.duration,
    masterTrack.speed ?? DEFAULT_SPEED,
  );
}

/**
 * Calculate how many times a track needs to loop to fill the master loop duration.
 *
 * Formula: Math.ceil(masterDuration / trackDuration)
 *
 * - If track equals master duration: loops 1 time
 * - If track is half master duration: loops 2 times
 * - If track is longer than master: loops 1 time (plays partially)
 *
 * @param trackDuration - Duration of the track in milliseconds
 * @param masterDuration - Master loop duration in milliseconds
 * @returns Number of times track should loop (minimum 1)
 *
 * @example
 * calculateLoopCount(4000, 10000) // => 3 (4s track loops 3 times in 10s)
 * calculateLoopCount(15000, 10000) // => 1 (longer track plays once, partially)
 */
export function calculateLoopCount(
  trackDuration: number,
  masterDuration: number,
): number {
  // Handle edge cases to avoid division by zero or invalid results
  if (
    masterDuration <= 0 ||
    trackDuration <= 0 ||
    !isFinite(masterDuration) ||
    !isFinite(trackDuration)
  ) {
    return 1;
  }

  return Math.ceil(masterDuration / trackDuration);
}

/**
 * Calculate the speed-adjusted duration of an audio track.
 *
 * When playback speed changes, the effective duration changes:
 * - Speed 0.5x (half speed) = duration doubles
 * - Speed 2.0x (double speed) = duration halves
 *
 * Formula: duration / speed
 *
 * @param duration - Original track duration in milliseconds
 * @param speed - Playback speed multiplier (0.05 - 2.5)
 * @returns Speed-adjusted duration in milliseconds
 *
 * @example
 * calculateSpeedAdjustedDuration(10000, 0.5) // => 20000 (slowed down)
 * calculateSpeedAdjustedDuration(10000, 2.0) // => 5000 (sped up)
 */
export function calculateSpeedAdjustedDuration(
  duration: number,
  speed: number,
): number {
  // Handle negative or zero duration
  if (duration <= 0 || !isFinite(duration)) {
    return 0;
  }

  // Validate speed is within acceptable range
  const validSpeed =
    speed > 0 && speed >= MIN_SPEED && speed <= MAX_SPEED
      ? speed
      : DEFAULT_SPEED;

  return Math.round(duration / validSpeed);
}

/**
 * Check if a given track ID represents the master track (first track).
 *
 * The master track is always the first track in the array and defines the loop duration.
 *
 * @param tracks - Array of tracks
 * @param trackId - ID of track to check
 * @returns true if track is the master track (first in array)
 *
 * @example
 * isMasterTrack([{ id: 'track-1' }, { id: 'track-2' }], 'track-1') // => true
 * isMasterTrack([{ id: 'track-1' }, { id: 'track-2' }], 'track-2') // => false
 */
export function isMasterTrack(tracks: Track[], trackId: string): boolean {
  if (tracks.length === 0) {
    return false;
  }

  return tracks[0].id === trackId;
}

/**
 * Get the master track (first track) from an array of tracks.
 *
 * @param tracks - Array of tracks
 * @returns First track or null if array is empty
 *
 * @example
 * getMasterTrack([track1, track2]) // => track1
 * getMasterTrack([]) // => null
 */
export function getMasterTrack(tracks: Track[]): Track | null {
  if (tracks.length === 0) {
    return null;
  }

  return tracks[0];
}

/**
 * Calculate the timestamps where a track should restart during a master loop.
 *
 * For a track that loops multiple times within the master duration, this returns
 * an array of millisecond timestamps where the track restarts from the beginning.
 *
 * @param trackDuration - Duration of the track in milliseconds
 * @param masterDuration - Master loop duration in milliseconds
 * @returns Array of restart timestamps in milliseconds
 *
 * @example
 * // 4s track in 10s loop restarts at 0ms, 4000ms, 8000ms
 * calculateTrackLoopBoundaries(4000, 10000) // => [0, 4000, 8000]
 *
 * // 15s track in 10s loop only plays once (partially)
 * calculateTrackLoopBoundaries(15000, 10000) // => [0]
 */
export function calculateTrackLoopBoundaries(
  trackDuration: number,
  masterDuration: number,
): number[] {
  // Handle invalid inputs
  if (
    trackDuration <= 0 ||
    masterDuration <= 0 ||
    !isFinite(trackDuration) ||
    !isFinite(masterDuration)
  ) {
    return [];
  }

  const loopCount = calculateLoopCount(trackDuration, masterDuration);
  const boundaries: number[] = [];

  // Generate boundary timestamps
  for (let i = 0; i < loopCount; i++) {
    const boundary = i * trackDuration;
    // Only include boundaries that fall within master duration
    if (boundary < masterDuration) {
      boundaries.push(boundary);
    }
  }

  return boundaries;
}

/**
 * Calculate the sync speed for a track given the master loop duration and a multiplier.
 *
 * Formula: (trackDuration / masterLoopDuration) * multiplier
 * Result is rounded to the nearest slider step (1/41).
 *
 * @param trackDuration - Original track duration in milliseconds
 * @param masterLoopDuration - Current master loop duration in milliseconds
 * @param multiplier - Sync multiplier (e.g., 0.25, 0.5, 1, 2, 3, 4)
 * @returns Calculated speed rounded to the nearest 1/41 step, or 1.0 if masterLoopDuration is invalid
 */
export function calculateSyncSpeed(
  trackDuration: number,
  masterLoopDuration: number,
  multiplier: number,
): number {
  if (
    !isFinite(trackDuration) ||
    trackDuration <= 0 ||
    !isFinite(masterLoopDuration) ||
    masterLoopDuration <= 0 ||
    !isFinite(multiplier) ||
    multiplier <= 0
  ) {
    return DEFAULT_SPEED;
  }

  const speed = (trackDuration / masterLoopDuration) * multiplier;
  if (!isFinite(speed) || speed <= 0) return DEFAULT_SPEED;
  return Math.round(speed * 41) / 41;
}

/**
 * All available sync multipliers with their display labels.
 */
const SYNC_MULTIPLIERS: { label: string; value: number }[] = [
  { label: "1/4x", value: 1 / 4 },
  { label: "1/3x", value: 1 / 3 },
  { label: "1/2x", value: 1 / 2 },
  { label: "1x", value: 1 },
  { label: "2x", value: 2 },
  { label: "3x", value: 3 },
  { label: "4x", value: 4 },
];

/**
 * Get the sync multipliers that produce valid speeds for a given track/master combination.
 *
 * Filters out multipliers whose calculated speed falls outside the MIN_SPEED-MAX_SPEED range.
 *
 * @param trackDuration - Original track duration in milliseconds
 * @param masterLoopDuration - Current master loop duration in milliseconds
 * @returns Array of { label, value } objects for valid multipliers
 */
export function getValidSyncMultipliers(
  trackDuration: number,
  masterLoopDuration: number,
): { label: string; value: number }[] {
  if (
    !isFinite(trackDuration) ||
    trackDuration <= 0 ||
    !isFinite(masterLoopDuration) ||
    masterLoopDuration <= 0
  ) {
    return [];
  }

  return SYNC_MULTIPLIERS.filter(({ value }) => {
    const speed = calculateSyncSpeed(trackDuration, masterLoopDuration, value);
    return speed >= MIN_SPEED && speed <= MAX_SPEED;
  });
}
