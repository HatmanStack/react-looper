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
function validateTrackState(state: unknown): boolean {
  if (!state || typeof state !== "object") {
    return false;
  }

  const stateObj = state as Record<string, unknown>;
  if (!Array.isArray(stateObj.tracks)) {
    return false;
  }

  // Validate each track has required fields
  return stateObj.tracks.every(
    (track: unknown) =>
      track &&
      typeof track === "object" &&
      typeof (track as Record<string, unknown>).id === "string" &&
      typeof (track as Record<string, unknown>).name === "string" &&
      typeof (track as Record<string, unknown>).uri === "string" &&
      typeof (track as Record<string, unknown>).duration === "number" &&
      typeof (track as Record<string, unknown>).speed === "number" &&
      typeof (track as Record<string, unknown>).volume === "number" &&
      typeof (track as Record<string, unknown>).isPlaying === "boolean" &&
      typeof (track as Record<string, unknown>).createdAt === "number",
  );
}

/**
 * Migration configuration for track store
 */
export const trackMigrationConfig: MigrationConfig<TrackStoreState> = {
  currentVersion: TRACK_STORE_VERSION,

  migrations: {
    // Version 1: Initial schema (no migration needed, just establish baseline)
    1: (state: unknown) => {
      const stateObj = state as Record<string, unknown>;
      // Ensure state has tracks array
      if (!state || !Array.isArray(stateObj.tracks)) {
        return { tracks: [] };
      }

      // Clean up any invalid tracks
      const validTracks = stateObj.tracks.filter((track: unknown) => {
        const trackObj = track as Record<string, unknown>;
        return (
          track &&
          trackObj.id &&
          trackObj.uri &&
          typeof trackObj.speed === "number" &&
          typeof trackObj.volume === "number"
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
export function migration_v2_removeSelected(state: unknown): TrackStoreState {
  // Handle empty or invalid state
  if (!state || typeof state !== "object") {
    return { tracks: [] };
  }

  const stateObj = state as Record<string, unknown>;
  // Handle missing or invalid tracks array
  if (!Array.isArray(stateObj.tracks)) {
    return { tracks: [] };
  }

  // Process each track: remove 'selected' and validate
  const migratedTracks: Track[] = [];

  for (const track of stateObj.tracks) {
    if (!track || typeof track !== "object") {
      continue;
    }

    // Destructure to remove 'selected' property
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { selected, ...trackWithoutSelected } = track as Record<
      string,
      unknown
    > & { selected?: unknown };

    // Validate required fields
    if (
      typeof trackWithoutSelected.id === "string" &&
      typeof trackWithoutSelected.uri === "string" &&
      typeof trackWithoutSelected.speed === "number" &&
      typeof trackWithoutSelected.volume === "number"
    ) {
      migratedTracks.push(trackWithoutSelected as unknown as Track);
    }
  }

  return {
    tracks: migratedTracks,
  };
}
