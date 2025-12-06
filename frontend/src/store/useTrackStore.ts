/**
 * Track State Store
 *
 * Zustand store for managing track data.
 * Handles CRUD operations for tracks and provides derived state.
 * Persists track data to storage for app restarts.
 *
 * LOOPER FEATURE: Tracks master loop duration based on first track
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { Track } from "../types";
import {
  calculateMasterLoopDuration,
  getMasterTrack as getFirstTrack,
  isMasterTrack as isFirstTrack,
} from "../utils/loopUtils";
import { createStorage } from "./storage";
import { logger } from "../utils/logger";

const STORAGE_KEY = "looper-tracks";
const storage = createStorage();

interface TrackStore {
  // State
  tracks: Track[];

  // Actions
  addTrack: (track: Track) => void;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, updates: Partial<Track>) => void;
  getTrack: (id: string) => Track | undefined;
  clearTracks: () => void;

  // Derived state getters
  getTrackCount: () => number;
  hasPlayableTracks: () => boolean;
  getPlayingTracks: () => Track[];

  // LOOPER FEATURE: Master loop tracking
  getMasterTrack: () => Track | null;
  isMasterTrack: (id: string) => boolean;
  hasMasterTrack: () => boolean;
  getMasterLoopDuration: () => number;
}

export const useTrackStore = create<TrackStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    tracks: [],

    // Add a new track
    addTrack: (track: Track) =>
      set((state) => ({
        tracks: [...state.tracks, track],
      })),

    // Remove a track by ID
    // LOOPER FEATURE: If removing master track (first), clear all tracks
    removeTrack: (id: string) =>
      set((state) => {
        const isMaster = state.tracks.length > 0 && state.tracks[0].id === id;

        // If removing master track, clear all tracks
        if (isMaster) {
          return { tracks: [] };
        }

        // Otherwise, remove just the specified track
        return {
          tracks: state.tracks.filter((track) => track.id !== id),
        };
      }),

    // Update track properties
    updateTrack: (id: string, updates: Partial<Track>) =>
      set((state) => ({
        tracks: state.tracks.map((track) =>
          track.id === id ? { ...track, ...updates } : track,
        ),
      })),

    // Get a specific track by ID
    getTrack: (id: string) => {
      return get().tracks.find((track) => track.id === id);
    },

    // Clear all tracks
    clearTracks: () =>
      set({
        tracks: [],
      }),

    // Derived state: Get track count
    getTrackCount: () => {
      return get().tracks.length;
    },

    // Derived state: Check if there are playable tracks
    hasPlayableTracks: () => {
      return get().tracks.length > 0;
    },

    // Derived state: Get all currently playing tracks
    getPlayingTracks: () => {
      return get().tracks.filter((track) => track.isPlaying);
    },

    // LOOPER FEATURE: Get master track (first track)
    getMasterTrack: () => {
      return getFirstTrack(get().tracks);
    },

    // LOOPER FEATURE: Check if given track ID is the master track
    isMasterTrack: (id: string) => {
      return isFirstTrack(get().tracks, id);
    },

    // LOOPER FEATURE: Check if any tracks exist (has master)
    hasMasterTrack: () => {
      return get().tracks.length > 0;
    },

    // LOOPER FEATURE: Get master loop duration (speed-adjusted duration of first track)
    getMasterLoopDuration: () => {
      return calculateMasterLoopDuration(get().tracks);
    },
  })),
);

/**
 * Initialize store from persisted storage
 * Call this on app startup
 */
export async function initializeTrackStore(): Promise<void> {
  try {
    const stored = await storage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed.tracks)) {
        // Reset isPlaying state on load (tracks shouldn't auto-play on restart)
        const tracks = parsed.tracks.map((track: Track) => ({
          ...track,
          isPlaying: false,
        }));
        useTrackStore.setState({ tracks });
        logger.info(`[TrackStore] Loaded ${tracks.length} tracks from storage`);
      }
    }
  } catch (error) {
    logger.error("[TrackStore] Failed to load from storage:", error);
  }
}

// Subscribe to track changes and persist
useTrackStore.subscribe(
  (state) => state.tracks,
  async (tracks) => {
    try {
      await storage.setItem(STORAGE_KEY, JSON.stringify({ tracks }));
    } catch (error) {
      logger.error("[TrackStore] Failed to persist tracks:", error);
    }
  },
);
