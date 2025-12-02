/**
 * Platform-agnostic storage adapter for Zustand persistence
 *
 * Provides a unified interface for storage across web and native platforms.
 * - Web: Uses localStorage
 * - Native: Uses in-memory storage (AsyncStorage can be added as dependency)
 */

import { Platform } from "react-native";
import { logger } from "../utils/logger";

// Define StateStorage interface locally to avoid importing zustand/middleware
interface StateStorage {
  getItem: (name: string) => string | null | Promise<string | null>;
  setItem: (name: string, value: string) => void | Promise<void>;
  removeItem: (name: string) => void | Promise<void>;
}

// In-memory fallback storage for native platforms
const memoryStorage: Record<string, string> = {};

/**
 * Create a storage adapter for the current platform
 */
export function createStorage(): StateStorage {
  // Web platform: use localStorage
  if (Platform.OS === "web") {
    return {
      getItem: async (name: string): Promise<string | null> => {
        try {
          return localStorage.getItem(name);
        } catch (error) {
          logger.error(
            "[Storage] Failed to get item from localStorage:",
            error,
          );
          return null;
        }
      },
      setItem: async (name: string, value: string): Promise<void> => {
        try {
          localStorage.setItem(name, value);
        } catch (error) {
          logger.error("[Storage] Failed to set item in localStorage:", error);
        }
      },
      removeItem: async (name: string): Promise<void> => {
        try {
          localStorage.removeItem(name);
        } catch (error) {
          logger.error(
            "[Storage] Failed to remove item from localStorage:",
            error,
          );
        }
      },
    };
  }

  // Native platform: use in-memory storage
  // Note: For production native apps, install @react-native-async-storage/async-storage
  logger.warn(
    "[Storage] Using in-memory storage for native platform. Install @react-native-async-storage/async-storage for persistence.",
  );

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
