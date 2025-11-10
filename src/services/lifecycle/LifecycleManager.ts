/**
 * Lifecycle Manager
 *
 * Manages app lifecycle events and coordinates state/audio cleanup.
 * Integrates with Zustand stores to pause playback and save state.
 */

import { AppState, AppStateStatus } from 'react-native';
import { usePlaybackStore } from '../../store/usePlaybackStore';

export class LifecycleManager {
  private static instance: LifecycleManager | null = null;
  private subscription: ReturnType<typeof AppState.addEventListener> | null = null;
  private audioCleanupCallback: (() => void) | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): LifecycleManager {
    if (!LifecycleManager.instance) {
      LifecycleManager.instance = new LifecycleManager();
    }
    return LifecycleManager.instance;
  }

  /**
   * Initialize lifecycle monitoring
   */
  initialize(options?: { onAudioCleanup?: () => void }) {
    if (this.subscription) {
      console.warn('[LifecycleManager] Already initialized');
      return;
    }

    this.audioCleanupCallback = options?.onAudioCleanup || null;

    // Listen to app state changes
    this.subscription = AppState.addEventListener('change', this.handleStateChange);

    console.log('[LifecycleManager] Initialized');
  }

  /**
   * Handle app state changes
   */
  private handleStateChange = (nextAppState: AppStateStatus) => {
    console.log('[LifecycleManager] App state changed to:', nextAppState);

    if (nextAppState === 'background' || nextAppState === 'inactive') {
      this.handleBackground();
    } else if (nextAppState === 'active') {
      this.handleForeground();
    }
  };

  /**
   * Handle app going to background
   */
  private handleBackground() {
    console.log('[LifecycleManager] App going to background');

    try {
      // Pause all playing tracks
      const playbackStore = usePlaybackStore.getState();
      playbackStore.pauseAll();

      // Call audio cleanup if provided
      if (this.audioCleanupCallback) {
        this.audioCleanupCallback();
      }

      // State persistence happens automatically via Zustand middleware
      console.log('[LifecycleManager] Background handling complete');
    } catch (error) {
      console.error('[LifecycleManager] Error handling background:', error);
    }
  }

  /**
   * Handle app coming to foreground
   */
  private handleForeground() {
    console.log('[LifecycleManager] App coming to foreground');

    // State is automatically restored via Zustand persistence
    // Audio can be manually resumed by user if desired
  }

  /**
   * Cleanup and remove listeners
   */
  cleanup() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }

    this.audioCleanupCallback = null;

    console.log('[LifecycleManager] Cleaned up');
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  static reset() {
    if (LifecycleManager.instance) {
      LifecycleManager.instance.cleanup();
      LifecycleManager.instance = null;
    }
  }
}
