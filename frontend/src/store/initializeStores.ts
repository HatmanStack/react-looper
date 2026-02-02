/**
 * Store Initialization
 *
 * Sets up cross-store synchronization after all stores are created.
 * Call this once at app startup (in _layout.tsx).
 */

import { usePlaybackStore } from "./usePlaybackStore";
import { useSettingsStore } from "./useSettingsStore";

let initialized = false;

/**
 * Initialize store synchronization.
 * Syncs playback store's loopMode with settings store's defaultLoopMode.
 * Safe to call multiple times - only runs initialization once.
 */
export const initializeStores = (): void => {
  if (initialized) return;
  initialized = true;

  // Sync initial loopMode from settings
  const defaultLoopMode = useSettingsStore.getState().defaultLoopMode;
  usePlaybackStore.getState().syncLoopMode(defaultLoopMode);

  // Subscribe to settings changes to keep loopMode in sync
  useSettingsStore.subscribe((state, prevState) => {
    if (state.defaultLoopMode !== prevState.defaultLoopMode) {
      usePlaybackStore.getState().syncLoopMode(state.defaultLoopMode);
    }
  });
};
