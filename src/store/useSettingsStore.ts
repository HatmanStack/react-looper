/**
 * Settings Store
 *
 * Manages user settings for looping, export, and recording preferences.
 * Includes persistence across app restarts using platform-specific storage.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createStorage } from "./storage";

/**
 * Audio format options for export and recording
 */
export type AudioFormat = "mp3" | "wav" | "m4a";

/**
 * Quality level options
 */
export type QualityLevel = "low" | "medium" | "high";

/**
 * Settings state interface
 */
interface SettingsState {
  // Looping Settings
  /**
   * Crossfade duration between loop iterations in milliseconds
   * 0 = gapless looping
   */
  loopCrossfadeDuration: number;

  /**
   * Default loop mode (on/off) for new sessions
   */
  defaultLoopMode: boolean;

  // Export Settings
  /**
   * Default number of loop iterations to export
   */
  defaultLoopCount: number;

  /**
   * Fadeout duration at end of export in milliseconds
   */
  defaultFadeout: number;

  /**
   * Default audio format for exports
   */
  exportFormat: AudioFormat;

  /**
   * Default quality level for exports
   */
  exportQuality: QualityLevel;

  // Recording Settings
  /**
   * Default audio format for recordings
   * Platform-specific defaults: m4a (native), wav (web)
   */
  recordingFormat: AudioFormat;

  /**
   * Default quality level for recordings
   */
  recordingQuality: QualityLevel;
}

/**
 * Settings store actions
 */
interface SettingsActions {
  /**
   * Update partial settings (merge semantics)
   * Only updates provided fields, leaves others unchanged
   */
  updateSettings: (settings: Partial<SettingsState>) => void;

  /**
   * Reset all settings to default values
   */
  resetToDefaults: () => void;
}

/**
 * Complete settings store interface
 */
interface SettingsStore extends SettingsState, SettingsActions {}

/**
 * Default settings values
 *
 * These are reasonable defaults based on common use cases:
 * - Looping enabled by default for looper functionality
 * - 4 loop repetitions provides good preview without excessive length
 * - 2 second fadeout prevents abrupt ending
 * - MP3 format provides good quality/size balance
 * - High quality for professional output
 * - M4A for native recording (better compression than WAV)
 */
const DEFAULT_SETTINGS: SettingsState = {
  // Looping
  loopCrossfadeDuration: 0, // Gapless
  defaultLoopMode: true, // ON

  // Export
  defaultLoopCount: 4,
  defaultFadeout: 2000, // 2 seconds
  exportFormat: "mp3",
  exportQuality: "high",

  // Recording
  recordingFormat: "m4a", // Native default (web can override)
  recordingQuality: "high",
};

/**
 * Settings Store
 *
 * Manages persistent user settings for looping, export, and recording.
 * Settings are automatically saved to platform-specific storage and loaded on app start.
 *
 * @example
 * // Update loop count
 * useSettingsStore.getState().updateSettings({ defaultLoopCount: 8 });
 *
 * // Reset to defaults
 * useSettingsStore.getState().resetToDefaults();
 *
 * // Access settings
 * const loopMode = useSettingsStore((state) => state.defaultLoopMode);
 */
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // Initialize with default values
      ...DEFAULT_SETTINGS,

      // Update partial settings (merge semantics)
      updateSettings: (updates: Partial<SettingsState>) =>
        set((state) => ({
          ...state,
          ...updates,
        })),

      // Reset all settings to defaults
      resetToDefaults: () =>
        set({
          ...DEFAULT_SETTINGS,
        }),
    }),
    {
      name: "settings-storage", // Storage key
      storage: createJSONStorage(() => createStorage()),
      // Only persist the state values, not the actions
      partialize: (state) => ({
        loopCrossfadeDuration: state.loopCrossfadeDuration,
        defaultLoopMode: state.defaultLoopMode,
        defaultLoopCount: state.defaultLoopCount,
        defaultFadeout: state.defaultFadeout,
        exportFormat: state.exportFormat,
        exportQuality: state.exportQuality,
        recordingFormat: state.recordingFormat,
        recordingQuality: state.recordingQuality,
      }),
    },
  ),
);

/**
 * Helper to get current settings snapshot
 * Useful for passing settings to functions without reactivity
 */
export const getSettings = (): SettingsState => {
  const state = useSettingsStore.getState();
  return {
    loopCrossfadeDuration: state.loopCrossfadeDuration,
    defaultLoopMode: state.defaultLoopMode,
    defaultLoopCount: state.defaultLoopCount,
    defaultFadeout: state.defaultFadeout,
    exportFormat: state.exportFormat,
    exportQuality: state.exportQuality,
    recordingFormat: state.recordingFormat,
    recordingQuality: state.recordingQuality,
  };
};
