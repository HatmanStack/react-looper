/**
 * Track Store Migrations
 *
 * Defines schema migrations for the track store.
 */

import type { Track } from "../../types";
import type { MigrationConfig } from "./types";

/**
 * Current schema version for tracks
 */
export const TRACK_STORE_VERSION = 2;

/**
 * Track store state interface
 */
interface TrackStoreState {
  tracks: Track[];
}

/**
 * Validate track store state
 */
function validateTrackState(state: any): boolean {
  if (!state || typeof state !== "object") {
    return false;
  }

  if (!Array.isArray(state.tracks)) {
    return false;
  }

  // Validate each track has required fields
  return state.tracks.every(
    (track: any) =>
      track &&
      typeof track.id === "string" &&
      typeof track.name === "string" &&
      typeof track.uri === "string" &&
      typeof track.duration === "number" &&
      typeof track.speed === "number" &&
      typeof track.volume === "number" &&
      typeof track.isPlaying === "boolean" &&
      typeof track.createdAt === "number",
  );
}

/**
 * Migration configuration for track store
 */
export const trackMigrationConfig: MigrationConfig<TrackStoreState> = {
  currentVersion: TRACK_STORE_VERSION,

  migrations: {
    // Version 1: Initial schema (no migration needed, just establish baseline)
    1: (state: any) => {
      // Ensure state has tracks array
      if (!state || !Array.isArray(state.tracks)) {
        return { tracks: [] };
      }

      // Clean up any invalid tracks
      const validTracks = state.tracks.filter((track: any) => {
        return (
          track &&
          track.id &&
          track.uri &&
          typeof track.speed === "number" &&
          typeof track.volume === "number"
        );
      });

      return { tracks: validTracks };
    },

    // Version 2: Looper Normalization - Remove 'selected' property
    2: migration_v2_removeSelected,
  },

  validate: validateTrackState,

  defaultState: {
    tracks: [],
  },
};

/**
 * Migration V2: Remove 'selected' property from tracks
 *
 * The looper normalization removes the 'selected' property as track selection
 * is now handled differently. This migration:
 * 1. Removes the 'selected' property from all tracks
 * 2. Validates track integrity
 * 3. Filters out invalid tracks
 *
 * @param state - Old state with potentially 'selected' property
 * @returns Migrated state without 'selected' property
 */
export function migration_v2_removeSelected(state: any): TrackStoreState {
  // Handle empty or invalid state
  if (!state || typeof state !== "object") {
    return { tracks: [] };
  }

  // Handle missing or invalid tracks array
  if (!Array.isArray(state.tracks)) {
    return { tracks: [] };
  }

  // Process each track: remove 'selected' and validate
  const migratedTracks = state.tracks
    .map((track: any) => {
      if (!track || typeof track !== "object") {
        return null;
      }

      // Destructure to remove 'selected' property
      const { selected, ...trackWithoutSelected } = track;

      return trackWithoutSelected;
    })
    .filter((track: any) => {
      // Filter out null entries and validate required fields
      return (
        track &&
        typeof track.id === "string" &&
        typeof track.uri === "string" &&
        typeof track.speed === "number" &&
        typeof track.volume === "number"
      );
    });

  return {
    tracks: migratedTracks,
  };
}
