/**
 * Platform-agnostic storage adapter for Zustand persistence
 *
 * Provides a unified interface for storage across web and native platforms.
 * - Web: Uses localStorage
 * - Native: Uses AsyncStorage (when installed)
 */

import { StateStorage } from 'zustand/middleware';
import { Platform } from 'react-native';

/**
 * Create a storage adapter for the current platform
 */
export function createStorage(): StateStorage {
  // Web platform: use localStorage
  if (Platform.OS === 'web') {
    return {
      getItem: async (name: string): Promise<string | null> => {
        try {
          return localStorage.getItem(name);
        } catch (error) {
          console.error('[Storage] Failed to get item from localStorage:', error);
          return null;
        }
      },
      setItem: async (name: string, value: string): Promise<void> => {
        try {
          localStorage.setItem(name, value);
        } catch (error) {
          console.error('[Storage] Failed to set item in localStorage:', error);
        }
      },
      removeItem: async (name: string): Promise<void> => {
        try {
          localStorage.removeItem(name);
        } catch (error) {
          console.error('[Storage] Failed to remove item from localStorage:', error);
        }
      },
    };
  }

  // Native platform: use AsyncStorage
  // Note: AsyncStorage should be installed separately
  // For now, we'll provide a fallback in-memory storage for testing
  try {
    // Try to load AsyncStorage
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;

    return {
      getItem: async (name: string): Promise<string | null> => {
        try {
          return await AsyncStorage.getItem(name);
        } catch (error) {
          console.error('[Storage] Failed to get item from AsyncStorage:', error);
          return null;
        }
      },
      setItem: async (name: string, value: string): Promise<void> => {
        try {
          await AsyncStorage.setItem(name, value);
        } catch (error) {
          console.error('[Storage] Failed to set item in AsyncStorage:', error);
        }
      },
      removeItem: async (name: string): Promise<void> => {
        try {
          await AsyncStorage.removeItem(name);
        } catch (error) {
          console.error('[Storage] Failed to remove item from AsyncStorage:', error);
        }
      },
    };
  } catch (error) {
    // AsyncStorage not available - use in-memory storage as fallback
    console.warn('[Storage] AsyncStorage not available, using in-memory storage');

    const memoryStorage: Record<string, string> = {};

    return {
      getItem: async (name: string): Promise<string | null> => {
        return memoryStorage[name] || null;
      },
      setItem: async (name: string, value: string): Promise<void> => {
        memoryStorage[name] = value;
      },
      removeItem: async (name: string): Promise<void> => {
        delete memoryStorage[name];
      },
    };
  }
}

/**
 * Serialization helpers for complex data types
 */
export const serializers = {
  /**
   * Serialize Map to JSON-compatible array
   */
  serializeMap: <K, V>(map: Map<K, V>): Array<[K, V]> => {
    return Array.from(map.entries());
  },

  /**
   * Deserialize array back to Map
   */
  deserializeMap: <K, V>(array: Array<[K, V]>): Map<K, V> => {
    return new Map(array);
  },

  /**
   * Serialize Set to JSON-compatible array
   */
  serializeSet: <T>(set: Set<T>): T[] => {
    return Array.from(set);
  },

  /**
   * Deserialize array back to Set
   */
  deserializeSet: <T>(array: T[]): Set<T> => {
    return new Set(array);
  },
};
