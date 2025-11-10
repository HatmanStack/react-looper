/**
 * App Lifecycle Hook
 *
 * Custom React hook for monitoring app state changes.
 * Handles transitions between active, background, and inactive states.
 *
 * Supports both native (AppState) and web (visibilitychange) platforms.
 */

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

export type LifecycleState = 'active' | 'background' | 'inactive';

export interface AppLifecycleCallbacks {
  /**
   * Called when app becomes active (foreground)
   */
  onActive?: () => void;

  /**
   * Called when app goes to background
   */
  onBackground?: () => void;

  /**
   * Called when app becomes inactive (transitioning)
   */
  onInactive?: () => void;

  /**
   * Called on any state change with previous and current state
   */
  onChange?: (currentState: LifecycleState, previousState: LifecycleState) => void;
}

/**
 * Hook to monitor app lifecycle state changes
 *
 * @param callbacks - Object with lifecycle event callbacks
 *
 * @example
 * ```tsx
 * useAppLifecycle({
 *   onBackground: () => {
 *     console.log('App went to background - pause audio');
 *     audioService.pauseAll();
 *   },
 *   onActive: () => {
 *     console.log('App became active - resume audio');
 *   },
 * });
 * ```
 */
export function useAppLifecycle(callbacks: AppLifecycleCallbacks = {}) {
  const { onActive, onBackground, onInactive, onChange } = callbacks;

  // Track previous state
  const previousStateRef = useRef<LifecycleState>(AppState.currentState as LifecycleState);

  const handleStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      const currentState = nextAppState as LifecycleState;
      const previousState = previousStateRef.current;

      // Only trigger callbacks if state actually changed
      if (currentState !== previousState) {
        // Call state-specific callbacks
        if (currentState === 'active' && onActive) {
          onActive();
        } else if (currentState === 'background' && onBackground) {
          onBackground();
        } else if (currentState === 'inactive' && onInactive) {
          onInactive();
        }

        // Call onChange with both states
        if (onChange) {
          onChange(currentState, previousState);
        }

        // Update ref for next change
        previousStateRef.current = currentState;
      }
    },
    [onActive, onBackground, onInactive, onChange]
  );

  useEffect(() => {
    // Native platforms: use AppState
    const subscription = AppState.addEventListener('change', handleStateChange);

    // Web platform: also listen to visibility changes
    if (Platform.OS === 'web') {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          handleStateChange('background');
        } else {
          handleStateChange('active');
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // beforeunload for cleanup before page closes
      const handleBeforeUnload = () => {
        if (onBackground) {
          onBackground();
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        subscription.remove();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }

    return () => {
      subscription.remove();
    };
  }, [handleStateChange, onBackground]);

  // Return current state
  return AppState.currentState as LifecycleState;
}

/**
 * Simplified hook for just background/foreground transitions
 *
 * @param onBackground - Called when app goes to background
 * @param onForeground - Called when app returns to foreground
 *
 * @example
 * ```tsx
 * useBackgroundHandler(
 *   () => audioService.pauseAll(),
 *   () => console.log('App foregrounded')
 * );
 * ```
 */
export function useBackgroundHandler(onBackground: () => void, onForeground?: () => void) {
  return useAppLifecycle({
    onBackground,
    onActive: onForeground,
  });
}
