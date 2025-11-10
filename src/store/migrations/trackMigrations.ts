/**
 * Track Store Migrations
 *
 * Defines schema migrations for the track store.
 */

import type { Track } from '../../types';
import type { MigrationConfig } from './types';

/**
 * Current schema version for tracks
 */
export const TRACK_STORE_VERSION = 1;

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
  if (!state || typeof state !== 'object') {
    return false;
  }

  if (!Array.isArray(state.tracks)) {
    return false;
  }

  // Validate each track has required fields
  return state.tracks.every(
    (track: any) =>
      track &&
      typeof track.id === 'string' &&
      typeof track.name === 'string' &&
      typeof track.uri === 'string' &&
      typeof track.duration === 'number' &&
      typeof track.speed === 'number' &&
      typeof track.volume === 'number' &&
      typeof track.isPlaying === 'boolean' &&
      typeof track.createdAt === 'number'
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
          typeof track.speed === 'number' &&
          typeof track.volume === 'number'
        );
      });

      return { tracks: validTracks };
    },

    // Future migrations would go here:
    // 2: (state) => {
    //   // Example: Add new field 'category' to tracks
    //   return {
    //     ...state,
    //     tracks: state.tracks.map(track => ({
    //       ...track,
    //       category: track.category || 'default',
    //     })),
    //   };
    // },
  },

  validate: validateTrackState,

  defaultState: {
    tracks: [],
  },
};

/**
 * Example migration: Add new field to tracks
 * (Commented out - template for future use)
 */
// export const migration_v2_addCategory = (state: TrackStoreState): TrackStoreState => {
//   return {
//     ...state,
//     tracks: state.tracks.map(track => ({
//       ...track,
//       category: 'default', // Add new field
//     })),
//   };
// };

/**
 * Example migration: Rename field
 * (Commented out - template for future use)
 */
// export const migration_v3_renameField = (state: any): TrackStoreState => {
//   return {
//     ...state,
//     tracks: state.tracks.map((track: any) => {
//       const { oldFieldName, ...rest } = track;
//       return {
//         ...rest,
//         newFieldName: oldFieldName, // Rename field
//       };
//     }),
//   };
// };
