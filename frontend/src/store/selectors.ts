/**
 * Zustand Selectors
 *
 * Optimized selectors for preventing unnecessary re-renders.
 * Use these with useStore hooks to select only needed state slices.
 */

import { useTrackStore } from "./useTrackStore";
import { usePlaybackStore } from "./usePlaybackStore";
import { useUIStore } from "./useUIStore";
import type { Track } from "../types";
import type { TrackState } from "./usePlaybackStore";

/**
 * Store state type aliases for cleaner selector signatures
 */
type TrackStoreState = ReturnType<typeof useTrackStore.getState>;
type PlaybackStoreState = ReturnType<typeof usePlaybackStore.getState>;
type UIStoreState = ReturnType<typeof useUIStore.getState>;

// ============================================================================
// Track Store Selectors
// ============================================================================

/**
 * Select all tracks
 */
export const selectTracks = (state: TrackStoreState) => state.tracks;

/**
 * Select track count
 */
export const selectTrackCount = (state: TrackStoreState) => state.tracks.length;

/**
 * Select specific track by ID
 */
export const selectTrackById = (id: string) => (state: TrackStoreState) =>
  state.tracks.find((track) => track.id === id);

/**
 * Select track IDs only (useful for lists to prevent re-renders)
 */
export const selectTrackIds = (state: TrackStoreState) =>
  state.tracks.map((track) => track.id);

/**
 * Select playing tracks
 */
export const selectPlayingTracks = (state: TrackStoreState) =>
  state.tracks.filter((track) => track.isPlaying);

/**
 * Check if has any tracks
 */
export const selectHasTracksBoolean = (state: TrackStoreState) =>
  state.tracks.length > 0;

// ============================================================================
// Playback Store Selectors
// ============================================================================

/**
 * Select track state by ID
 */
export const selectTrackState =
  (trackId: string) => (state: PlaybackStoreState) =>
    state.trackStates.get(trackId);

/**
 * Select if track is playing
 */
export const selectIsTrackPlaying =
  (trackId: string) => (state: PlaybackStoreState) =>
    state.trackStates.get(trackId)?.isPlaying ?? false;

/**
 * Select track speed
 */
export const selectTrackSpeed =
  (trackId: string) => (state: PlaybackStoreState) =>
    state.trackStates.get(trackId)?.speed ?? 1.0;

/**
 * Select track volume
 */
export const selectTrackVolume =
  (trackId: string) => (state: PlaybackStoreState) =>
    state.trackStates.get(trackId)?.volume ?? 75;

/**
 * Select if any track is playing
 */
export const selectIsAnyPlaying = (state: PlaybackStoreState) =>
  state.isAnyPlaying;

/**
 * Select count of playing tracks
 */
export const selectPlayingTrackCount = (state: PlaybackStoreState) =>
  state.playingTracks.size;

// ============================================================================
// UI Store Selectors
// ============================================================================

/**
 * Select save modal visibility
 */
export const selectSaveModalVisible = (state: UIStoreState) =>
  state.saveModalVisible;

/**
 * Select mixing modal visibility
 */
export const selectMixingModalVisible = (state: UIStoreState) =>
  state.mixingModalVisible;

/**
 * Select if recording
 */
export const selectIsRecording = (state: UIStoreState) => state.isRecording;

/**
 * Select if mixing
 */
export const selectIsMixing = (state: UIStoreState) => state.isMixing;

/**
 * Select mixing progress
 */
export const selectMixingProgress = (state: UIStoreState) =>
  state.mixingProgress;

/**
 * Select if any loading operation is active
 */
export const selectIsAnyLoading = (state: UIStoreState) =>
  state.isLoading || state.isRecording || state.isMixing;

/**
 * Select error message
 */
export const selectErrorMessage = (state: UIStoreState) => state.errorMessage;

// ============================================================================
// Compound Selectors (combine multiple stores)
// ============================================================================

/**
 * Get track with its playback state
 */
export function getTrackWithPlaybackState(trackId: string): {
  track: Track | undefined;
  playbackState: TrackState | undefined;
} {
  return {
    track: useTrackStore.getState().getTrack(trackId),
    playbackState: usePlaybackStore.getState().getTrackState(trackId),
  };
}

/**
 * Get all tracks with their playback states
 */
export function getAllTracksWithPlaybackState(): Array<{
  track: Track;
  playbackState: TrackState | undefined;
}> {
  const tracks = useTrackStore.getState().tracks;
  const playbackStore = usePlaybackStore.getState();

  return tracks.map((track) => ({
    track,
    playbackState: playbackStore.getTrackState(track.id),
  }));
}
