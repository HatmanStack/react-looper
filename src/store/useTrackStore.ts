/**
 * Track State Store
 *
 * Zustand store for managing track data.
 * Handles CRUD operations for tracks and provides derived state.
 * Persists track data to storage for app restarts.
 */

import { create } from "zustand";
// Note: Persist middleware removed to avoid import.meta errors on web
// See: react-vocabulary/TS_RENDER.md for details
// TODO: Re-implement persistence with platform-specific approach
import type { Track } from "../types";

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
  removeTrack: (id: string) =>
    set((state) => ({
      tracks: state.tracks.filter((track) => track.id !== id),
    })),

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
}));
