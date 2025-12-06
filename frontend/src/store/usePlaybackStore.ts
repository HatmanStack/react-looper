/**
 * Playback State Store
 *
 * Zustand store for managing playback state across all tracks.
 * Tracks playing state, speed, and volume for each track.
 * Persists playback settings (speed, volume) to storage.
 *
 * LOOPER FEATURE: Tracks global loop mode for looping behavior
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { useSettingsStore } from "./useSettingsStore";
import { createStorage, serializers } from "./storage";
import { logger } from "../utils/logger";

const STORAGE_KEY = "looper-playback";
const storage = createStorage();

export interface TrackState {
  speed: number;
  volume: number;
  isPlaying: boolean;
  isLooping: boolean;
}

interface PlaybackState {
  // Track states by track ID
  trackStates: Map<string, TrackState>;

  // Set of currently playing track IDs
  playingTracks: Set<string>;

  // Whether any track is playing
  isAnyPlaying: boolean;

  // LOOPER FEATURE: Global loop mode
  // Controls whether tracks loop to fill master duration
  loopMode: boolean;

  // Actions
  setTrackPlaying: (trackId: string, isPlaying: boolean) => void;
  setTrackSpeed: (trackId: string, speed: number) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  setTrackLooping: (trackId: string, isLooping: boolean) => void;
  addTrack: (trackId: string, initialState?: Partial<TrackState>) => void;
  removeTrack: (trackId: string) => void;
  pauseAll: () => void;
  playAll: () => void;
  getTrackState: (trackId: string) => TrackState | undefined;
  reset: () => void;

  // LOOPER FEATURE: Loop mode actions
  setLoopMode: (enabled: boolean) => void;
  toggleLoopMode: () => void;
}

const DEFAULT_TRACK_STATE: TrackState = {
  speed: 1.0,
  volume: 75,
  isPlaying: false,
  isLooping: true,
};

// NOTE: Using Map and Set for trackStates/playingTracks is intentional for O(1) lookups.
// These are serialized to arrays for persistence (see subscribe handler below).
export const usePlaybackStore = create<PlaybackState>()(
  subscribeWithSelector((set, get) => ({
    trackStates: new Map(),
    playingTracks: new Set(),
    isAnyPlaying: false,
    // LOOPER FEATURE: Initialize loop mode from settings
    loopMode: useSettingsStore.getState().defaultLoopMode,

  setTrackPlaying: (trackId: string, isPlaying: boolean) =>
    set((state) => {
      const newTrackStates = new Map(state.trackStates);
      const trackState = newTrackStates.get(trackId);

      if (trackState) {
        newTrackStates.set(trackId, { ...trackState, isPlaying });
      }

      const newPlayingTracks = new Set(state.playingTracks);
      if (isPlaying) {
        newPlayingTracks.add(trackId);
      } else {
        newPlayingTracks.delete(trackId);
      }

      return {
        trackStates: newTrackStates,
        playingTracks: newPlayingTracks,
        isAnyPlaying: newPlayingTracks.size > 0,
      };
    }),

  setTrackSpeed: (trackId: string, speed: number) =>
    set((state) => {
      const newTrackStates = new Map(state.trackStates);
      const trackState = newTrackStates.get(trackId);

      if (trackState) {
        newTrackStates.set(trackId, { ...trackState, speed });
      }

      return { trackStates: newTrackStates };
    }),

  setTrackVolume: (trackId: string, volume: number) =>
    set((state) => {
      const newTrackStates = new Map(state.trackStates);
      const trackState = newTrackStates.get(trackId);

      if (trackState) {
        newTrackStates.set(trackId, { ...trackState, volume });
      }

      return { trackStates: newTrackStates };
    }),

  setTrackLooping: (trackId: string, isLooping: boolean) =>
    set((state) => {
      const newTrackStates = new Map(state.trackStates);
      const trackState = newTrackStates.get(trackId);

      if (trackState) {
        newTrackStates.set(trackId, { ...trackState, isLooping });
      }

      return { trackStates: newTrackStates };
    }),

  addTrack: (trackId: string, initialState?: Partial<TrackState>) =>
    set((state) => {
      const newTrackStates = new Map(state.trackStates);
      newTrackStates.set(trackId, {
        ...DEFAULT_TRACK_STATE,
        ...initialState,
      });

      return { trackStates: newTrackStates };
    }),

  removeTrack: (trackId: string) =>
    set((state) => {
      const newTrackStates = new Map(state.trackStates);
      newTrackStates.delete(trackId);

      const newPlayingTracks = new Set(state.playingTracks);
      newPlayingTracks.delete(trackId);

      return {
        trackStates: newTrackStates,
        playingTracks: newPlayingTracks,
        isAnyPlaying: newPlayingTracks.size > 0,
      };
    }),

  pauseAll: () =>
    set((state) => {
      const newTrackStates = new Map(state.trackStates);

      // Set all tracks to not playing
      newTrackStates.forEach((trackState, trackId) => {
        newTrackStates.set(trackId, { ...trackState, isPlaying: false });
      });

      return {
        trackStates: newTrackStates,
        playingTracks: new Set(),
        isAnyPlaying: false,
      };
    }),

  playAll: () =>
    set((state) => {
      const newTrackStates = new Map(state.trackStates);
      const newPlayingTracks = new Set<string>();

      // Set all tracks to playing
      newTrackStates.forEach((trackState, trackId) => {
        newTrackStates.set(trackId, { ...trackState, isPlaying: true });
        newPlayingTracks.add(trackId);
      });

      return {
        trackStates: newTrackStates,
        playingTracks: newPlayingTracks,
        isAnyPlaying: newPlayingTracks.size > 0,
      };
    }),

  getTrackState: (trackId: string) => {
    return get().trackStates.get(trackId);
  },

  reset: () =>
    set({
      trackStates: new Map(),
      playingTracks: new Set(),
      isAnyPlaying: false,
      // LOOPER FEATURE: Reset loop mode to settings default
      loopMode: useSettingsStore.getState().defaultLoopMode,
    }),

  // LOOPER FEATURE: Set loop mode
  setLoopMode: (enabled: boolean) =>
    set({
      loopMode: enabled,
    }),

  // LOOPER FEATURE: Toggle loop mode
  toggleLoopMode: () =>
    set((state) => ({
      loopMode: !state.loopMode,
    })),
})),
);

/**
 * Serialized playback state for storage
 */
interface SerializedPlaybackState {
  trackStates: Array<[string, TrackState]>;
  loopMode: boolean;
}

/**
 * Initialize store from persisted storage
 * Call this on app startup
 */
export async function initializePlaybackStore(): Promise<void> {
  try {
    const stored = await storage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: SerializedPlaybackState = JSON.parse(stored);

      // Deserialize Map from array and reset playing state
      const trackStates = new Map<string, TrackState>();
      if (Array.isArray(parsed.trackStates)) {
        for (const [id, state] of parsed.trackStates) {
          trackStates.set(id, {
            ...state,
            isPlaying: false, // Reset playing state on load
          });
        }
      }

      usePlaybackStore.setState({
        trackStates,
        playingTracks: new Set(), // Reset playing tracks
        isAnyPlaying: false,
        loopMode: parsed.loopMode ?? useSettingsStore.getState().defaultLoopMode,
      });

      logger.info(
        `[PlaybackStore] Loaded ${trackStates.size} track states from storage`,
      );
    }
  } catch (error) {
    logger.error("[PlaybackStore] Failed to load from storage:", error);
  }
}

// Subscribe to changes and persist (only speed/volume/looping settings, not playing state)
usePlaybackStore.subscribe(
  (state) => ({ trackStates: state.trackStates, loopMode: state.loopMode }),
  async ({ trackStates, loopMode }) => {
    try {
      // Serialize Map to array, excluding transient playing state
      const serializedStates: Array<[string, TrackState]> = [];
      trackStates.forEach((state, id) => {
        serializedStates.push([
          id,
          {
            speed: state.speed,
            volume: state.volume,
            isPlaying: false, // Don't persist playing state
            isLooping: state.isLooping,
          },
        ]);
      });

      const data: SerializedPlaybackState = {
        trackStates: serializedStates,
        loopMode,
      };

      await storage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      logger.error("[PlaybackStore] Failed to persist state:", error);
    }
  },
  // NOTE: equalityFn returning false ensures persistence runs on every state change.
  // This is intentional because Map mutations don't trigger reference equality checks.
  { equalityFn: () => false },
);
