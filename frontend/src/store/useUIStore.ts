/**
 * UI State Store
 *
 * Zustand store for managing UI-specific state.
 * Handles modals, dialogs, loading states, and error messages.
 */

import { create } from "zustand";

interface UIStore {
  // Modal state
  saveModalVisible: boolean;
  mixingModalVisible: boolean;
  selectedTrackId: string | null;

  // Loading states
  isRecording: boolean;
  isMixing: boolean;
  isLoading: boolean;

  // Progress tracking
  mixingProgress: number; // 0-1 (percentage)

  // Error handling
  errorMessage: string | null;

  // Modal actions
  showSaveModal: () => void;
  hideSaveModal: () => void;
  showMixingModal: () => void;
  hideMixingModal: () => void;
  setSelectedTrack: (trackId: string | null) => void;

  // Loading state actions
  setRecording: (isRecording: boolean) => void;
  setMixing: (isMixing: boolean) => void;
  setLoading: (isLoading: boolean) => void;

  // Progress actions
  setMixingProgress: (progress: number) => void;

  // Error actions
  setError: (message: string | null) => void;
  clearError: () => void;

  // Reset all UI state
  reset: () => void;
}

const initialState = {
  saveModalVisible: false,
  mixingModalVisible: false,
  selectedTrackId: null,
  isRecording: false,
  isMixing: false,
  isLoading: false,
  mixingProgress: 0,
  errorMessage: null,
};

export const useUIStore = create<UIStore>((set) => ({
  ...initialState,

  // Modal actions
  showSaveModal: () => set({ saveModalVisible: true }),
  hideSaveModal: () => set({ saveModalVisible: false }),
  showMixingModal: () => set({ mixingModalVisible: true }),
  hideMixingModal: () => set({ mixingModalVisible: false }),
  setSelectedTrack: (trackId: string | null) =>
    set({ selectedTrackId: trackId }),

  // Loading state actions
  setRecording: (isRecording: boolean) => set({ isRecording }),
  setMixing: (isMixing: boolean) => set({ isMixing }),
  setLoading: (isLoading: boolean) => set({ isLoading }),

  // Progress actions
  setMixingProgress: (progress: number) =>
    set({ mixingProgress: Math.max(0, Math.min(1, progress)) }), // Clamp between 0-1

  // Error actions
  setError: (message: string | null) => set({ errorMessage: message }),
  clearError: () => set({ errorMessage: null }),

  // Reset all UI state
  reset: () => set(initialState),
}));
