/**
 * Migration System
 *
 * Handles state versioning and migrations between schema versions.
 */

import type {
  MigrationConfig,
  MigrationResult,
  VersionedState,
  VersionHistoryEntry,
} from "./types";

/**
 * Run migrations on a persisted state
 *
 * @param persistedData - Raw data from storage
 * @param config - Migration configuration
 * @returns Migration result with migrated state
 */
export function runMigrations<TState>(
  persistedData: unknown,
  config: MigrationConfig<TState>,
): MigrationResult<TState> {
  const errors: string[] = [];

  try {
    // Parse versioned state
    // Check for 'version' property to distinguish versioned from non-versioned data
    const versionedState: VersionedState<TState> =
      typeof persistedData === "object" &&
      persistedData !== null &&
      "version" in persistedData
        ? persistedData
        : { version: 0, state: persistedData };

    const fromVersion = versionedState.version || 0;
    const toVersion = config.currentVersion;

    // No migration needed
    if (fromVersion === toVersion) {
      return {
        success: true,
        state: versionedState.state,
        fromVersion,
        toVersion,
      };
    }

    // Run migrations sequentially
    let currentState = versionedState.state;

    console.log(`[Migration] Migrating from v${fromVersion} to v${toVersion}`);

    for (let version = fromVersion + 1; version <= toVersion; version++) {
      const migration = config.migrations[version];

      if (migration) {
        try {
          console.log(`[Migration] Running migration to v${version}`);
          currentState = migration(currentState);
        } catch (error) {
          const errorMsg = `Failed to migrate to v${version}: ${error}`;
          console.error(`[Migration] ${errorMsg}`);
          errors.push(errorMsg);

          // If we have a default state, use it
          if (config.defaultState) {
            return {
              success: false,
              state: config.defaultState,
              fromVersion,
              toVersion: config.currentVersion,
              errors,
            };
          }

          throw new Error(errorMsg);
        }
      } else {
        console.warn(
          `[Migration] No migration found for v${version}, skipping`,
        );
      }
    }

    // Validate final state
    if (config.validate && !config.validate(currentState)) {
      const errorMsg = "State validation failed after migration";
      console.error(`[Migration] ${errorMsg}`);
      errors.push(errorMsg);

      if (config.defaultState) {
        return {
          success: false,
          state: config.defaultState,
          fromVersion,
          toVersion: config.currentVersion,
          errors,
        };
      }

      throw new Error(errorMsg);
    }

    console.log(`[Migration] Successfully migrated to v${toVersion}`);

    return {
      success: true,
      state: currentState,
      fromVersion,
      toVersion,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error("[Migration] Critical migration error:", error);

    // Return default state if available
    if (config.defaultState) {
      return {
        success: false,
        state: config.defaultState,
        toVersion: config.currentVersion,
        errors: [...errors, String(error)],
      };
    }

    throw error;
  }
}

/**
 * Create a versioned state wrapper
 *
 * @param state - Current state
 * @param version - Current version
 * @param previousHistory - Previous version history
 * @returns Versioned state with history
 */
export function createVersionedState<TState>(
  state: TState,
  version: number,
  previousHistory?: VersionHistoryEntry[],
): VersionedState<TState> {
  const history: VersionHistoryEntry[] = previousHistory || [];

  // Add current version to history if not already present
  if (!history.find((entry) => entry.version === version)) {
    history.push({
      version,
      timestamp: Date.now(),
    });
  }

  return {
    version,
    state,
    versionHistory: history,
  };
}

/**
 * Helper to create a Zustand persist storage with migrations
 */
export function createMigratedStorage<TState>(
  config: MigrationConfig<TState>,
  baseStorage: {
    getItem: (name: string) => Promise<string | null>;
    setItem: (name: string, value: string) => Promise<void>;
    removeItem: (name: string) => Promise<void>;
  },
) {
  return {
    getItem: async (name: string): Promise<string | null> => {
      const item = await baseStorage.getItem(name);
      if (!item) return null;

      try {
        const parsed = JSON.parse(item);
        const migrationResult = runMigrations(parsed, config);

        if (!migrationResult.success && migrationResult.errors) {
          console.error(
            "[Migration] Migration had errors:",
            migrationResult.errors,
          );
        }

        // Return migrated state as versioned state
        const versionedState = createVersionedState(
          migrationResult.state,
          config.currentVersion,
        );

        return JSON.stringify(versionedState);
      } catch (error) {
        console.error(
          "[Migration] Failed to parse/migrate stored data:",
          error,
        );

        if (config.defaultState) {
          const versionedState = createVersionedState(
            config.defaultState,
            config.currentVersion,
          );
          return JSON.stringify(versionedState);
        }

        return null;
      }
    },

    setItem: async (name: string, value: string): Promise<void> => {
      try {
        const parsed = JSON.parse(value);

        // Wrap in versioned state if not already
        const versionedState: VersionedState<TState> =
          typeof parsed.version === "number"
            ? parsed
            : createVersionedState(parsed, config.currentVersion);

        await baseStorage.setItem(name, JSON.stringify(versionedState));
      } catch (error) {
        console.error("[Migration] Failed to save versioned state:", error);
        throw error;
      }
    },

    removeItem: async (name: string): Promise<void> => {
      await baseStorage.removeItem(name);
    },
  };
}
