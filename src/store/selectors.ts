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

// ============================================================================
// Track Store Selectors
// ============================================================================

/**
 * Select all tracks
 */
export const selectTracks = (
  state: ReturnType<typeof useTrackStore.getState>,
) => state.tracks;

/**
 * Select track count
 */
export const selectTrackCount = (
  state: ReturnType<typeof useTrackStore.getState>,
) => state.tracks.length;

/**
 * Select specific track by ID
 */
export const selectTrackById =
  (id: string) => (state: ReturnType<typeof useTrackStore.getState>) =>
    state.tracks.find((track) => track.id === id);

/**
 * Select track IDs only (useful for lists to prevent re-renders)
 */
export const selectTrackIds = (
  state: ReturnType<typeof useTrackStore.getState>,
) => state.tracks.map((track) => track.id);

/**
 * Select playing tracks
 */
export const selectPlayingTracks = (
  state: ReturnType<typeof useTrackStore.getState>,
) => state.tracks.filter((track) => track.isPlaying);

/**
 * Check if has any tracks
 */
export const selectHasTracksBoolean = (
  state: ReturnType<typeof useTrackStore.getState>,
) => state.tracks.length > 0;

// ============================================================================
// Playback Store Selectors
// ============================================================================

/**
 * Select track state by ID
 */
export const selectTrackState =
  (trackId: string) => (state: ReturnType<typeof usePlaybackStore.getState>) =>
    state.trackStates.get(trackId);

/**
 * Select if track is playing
 */
export const selectIsTrackPlaying =
  (trackId: string) => (state: ReturnType<typeof usePlaybackStore.getState>) =>
    state.trackStates.get(trackId)?.isPlaying ?? false;

/**
 * Select track speed
 */
export const selectTrackSpeed =
  (trackId: string) => (state: ReturnType<typeof usePlaybackStore.getState>) =>
    state.trackStates.get(trackId)?.speed ?? 1.0;

/**
 * Select track volume
 */
export const selectTrackVolume =
  (trackId: string) => (state: ReturnType<typeof usePlaybackStore.getState>) =>
    state.trackStates.get(trackId)?.volume ?? 75;

/**
 * Select if any track is playing
 */
export const selectIsAnyPlaying = (
  state: ReturnType<typeof usePlaybackStore.getState>,
) => state.isAnyPlaying;

/**
 * Select count of playing tracks
 */
export const selectPlayingTrackCount = (
  state: ReturnType<typeof usePlaybackStore.getState>,
) => state.playingTracks.size;

// ============================================================================
// UI Store Selectors
// ============================================================================

/**
 * Select save modal visibility
 */
export const selectSaveModalVisible = (
  state: ReturnType<typeof useUIStore.getState>,
) => state.saveModalVisible;

/**
 * Select mixing modal visibility
 */
export const selectMixingModalVisible = (
  state: ReturnType<typeof useUIStore.getState>,
) => state.mixingModalVisible;

/**
 * Select if recording
 */
export const selectIsRecording = (
  state: ReturnType<typeof useUIStore.getState>,
) => state.isRecording;

/**
 * Select if mixing
 */
export const selectIsMixing = (state: ReturnType<typeof useUIStore.getState>) =>
  state.isMixing;

/**
 * Select mixing progress
 */
export const selectMixingProgress = (
  state: ReturnType<typeof useUIStore.getState>,
) => state.mixingProgress;

/**
 * Select if any loading operation is active
 */
export const selectIsAnyLoading = (
  state: ReturnType<typeof useUIStore.getState>,
) => state.isLoading || state.isRecording || state.isMixing;

/**
 * Select error message
 */
export const selectErrorMessage = (
  state: ReturnType<typeof useUIStore.getState>,
) => state.errorMessage;

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
