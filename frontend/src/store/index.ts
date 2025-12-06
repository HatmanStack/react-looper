/**
 * Store Initialization
 *
 * Exports all stores and provides a single initialization function
 * for loading persisted state on app startup.
 */

export { useTrackStore, initializeTrackStore } from "./useTrackStore";
export {
  usePlaybackStore,
  initializePlaybackStore,
} from "./usePlaybackStore";
export {
  useSettingsStore,
  initializeSettingsStore,
  getSettings,
} from "./useSettingsStore";
export { useUIStore } from "./useUIStore";

import { initializeTrackStore } from "./useTrackStore";
import { initializePlaybackStore } from "./usePlaybackStore";
import { initializeSettingsStore } from "./useSettingsStore";
import { logger } from "../utils/logger";

/**
 * Initialize all stores from persisted storage.
 * Should be called once on app startup before rendering.
 */
export async function initializeStores(): Promise<void> {
  logger.info("[Store] Initializing stores from storage...");

  try {
    // Initialize settings first as other stores may depend on it
    await initializeSettingsStore();

    // Initialize remaining stores in parallel
    await Promise.all([initializeTrackStore(), initializePlaybackStore()]);

    logger.info("[Store] All stores initialized successfully");
  } catch (error) {
    logger.error("[Store] Failed to initialize stores:", error);
  }
}
