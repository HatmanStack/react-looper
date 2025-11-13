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
// Note: Persist middleware removed to avoid import.meta errors on web
// See: react-vocabulary/TS_RENDER.md for details
// TODO: Re-implement persistence with platform-specific approach
import type { Track } from "../types";
import {
  calculateMasterLoopDuration,
  getMasterTrack as getFirstTrack,
  isMasterTrack as isFirstTrack,
} from "../utils/loopUtils";

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

export const useTrackStore = create<TrackStore>()((set, get) => ({
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
}));
