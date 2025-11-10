/**
 * State DevTools Integration
 *
 * Provides development tools for debugging Zustand stores.
 * Only active in development mode.
 */

import { useTrackStore } from './useTrackStore';
import { usePlaybackStore, type TrackState } from './usePlaybackStore';
import { useUIStore } from './useUIStore';

/**
 * Check if running in development mode
 */
export const isDevelopment = __DEV__;

/**
 * Log state changes (dev only)
 */
export function enableStateLogging() {
  if (!isDevelopment) {
    console.warn('[DevTools] State logging only available in development');
    return;
  }

  console.log('[DevTools] Enabling state logging');

  // Subscribe to track store changes
  useTrackStore.subscribe((state, prevState) => {
    if (state.tracks !== prevState.tracks) {
      console.log('[TrackStore]', {
        trackCount: state.tracks.length,
        tracks: state.tracks,
      });
    }
  });

  // Subscribe to playback store changes
  usePlaybackStore.subscribe((state, prevState) => {
    if (state.trackStates !== prevState.trackStates) {
      console.log('[PlaybackStore]', {
        trackStates: Array.from(state.trackStates.entries()),
        playingTracks: Array.from(state.playingTracks),
        isAnyPlaying: state.isAnyPlaying,
      });
    }
  });

  // Subscribe to UI store changes
  useUIStore.subscribe((state, prevState) => {
    const changes: Record<string, any> = {};

    if (state.saveModalVisible !== prevState.saveModalVisible) {
      changes.saveModalVisible = state.saveModalVisible;
    }
    if (state.isMixing !== prevState.isMixing) {
      changes.isMixing = state.isMixing;
    }
    if (state.isRecording !== prevState.isRecording) {
      changes.isRecording = state.isRecording;
    }

    if (Object.keys(changes).length > 0) {
      console.log('[UIStore]', changes);
    }
  });
}

/**
 * Export current state snapshot
 */
export function exportState() {
  const state = {
    tracks: useTrackStore.getState().tracks,
    playback: {
      trackStates: Array.from(usePlaybackStore.getState().trackStates.entries()),
      playingTracks: Array.from(usePlaybackStore.getState().playingTracks),
    },
    ui: {
      saveModalVisible: useUIStore.getState().saveModalVisible,
      mixingModalVisible: useUIStore.getState().mixingModalVisible,
      isRecording: useUIStore.getState().isRecording,
      isMixing: useUIStore.getState().isMixing,
      mixingProgress: useUIStore.getState().mixingProgress,
    },
    timestamp: new Date().toISOString(),
  };

  console.log('[DevTools] State snapshot:', JSON.stringify(state, null, 2));

  return state;
}

/**
 * Import state (for testing/debugging)
 */
export function importState(stateSnapshot: any) {
  if (!isDevelopment) {
    console.warn('[DevTools] State import only available in development');
    return;
  }

  try {
    // Import tracks
    if (stateSnapshot.tracks) {
      useTrackStore.setState({ tracks: stateSnapshot.tracks });
    }

    // Import playback state
    if (stateSnapshot.playback) {
      const playbackStore = usePlaybackStore.getState();
      playbackStore.reset();

      if (stateSnapshot.playback.trackStates) {
        const trackStatesMap: Map<string, TrackState> = new Map(stateSnapshot.playback.trackStates);
        usePlaybackStore.setState({
          trackStates: trackStatesMap,
          playingTracks: new Set(stateSnapshot.playback.playingTracks || []),
        });
      }
    }

    // Import UI state
    if (stateSnapshot.ui) {
      useUIStore.setState({
        saveModalVisible: stateSnapshot.ui.saveModalVisible ?? false,
        mixingModalVisible: stateSnapshot.ui.mixingModalVisible ?? false,
        isRecording: stateSnapshot.ui.isRecording ?? false,
        isMixing: stateSnapshot.ui.isMixing ?? false,
        mixingProgress: stateSnapshot.ui.mixingProgress ?? 0,
      });
    }

    console.log('[DevTools] State imported successfully');
  } catch (error) {
    console.error('[DevTools] Failed to import state:', error);
  }
}

/**
 * Reset all stores to initial state
 */
export function resetAllStores() {
  if (!isDevelopment) {
    console.warn('[DevTools] Store reset only available in development');
    return;
  }

  useTrackStore.getState().clearTracks();
  usePlaybackStore.getState().reset();
  useUIStore.getState().reset();

  console.log('[DevTools] All stores reset to initial state');
}

/**
 * Get store statistics
 */
export function getStoreStats() {
  const trackStore = useTrackStore.getState();
  const playbackStore = usePlaybackStore.getState();
  const uiStore = useUIStore.getState();

  return {
    tracks: {
      count: trackStore.tracks.length,
      playingCount: trackStore.tracks.filter((t) => t.isPlaying).length,
    },
    playback: {
      trackedCount: playbackStore.trackStates.size,
      playingCount: playbackStore.playingTracks.size,
    },
    ui: {
      modalsOpen: (uiStore.saveModalVisible ? 1 : 0) + (uiStore.mixingModalVisible ? 1 : 0),
      activeOperations:
        (uiStore.isRecording ? 1 : 0) + (uiStore.isMixing ? 1 : 0) + (uiStore.isLoading ? 1 : 0),
    },
  };
}

// Auto-enable logging in development if env var is set
if (isDevelopment && process.env.ENABLE_STATE_LOGGING === 'true') {
  enableStateLogging();
}
