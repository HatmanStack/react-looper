/**
 * Migration System Types
 *
 * Types for state versioning and migration system.
 */

/**
 * Migration function type
 * Takes old state and returns migrated state
 */
export type MigrationFn<TState = unknown> = (state: TState) => TState;

/**
 * Version history entry
 */
export interface VersionHistoryEntry {
  version: number;
  timestamp: number;
  description?: string;
}

/**
 * Versioned state wrapper
 */
export interface VersionedState<TState = unknown> {
  version: number;
  state: TState;
  versionHistory?: VersionHistoryEntry[];
}

/**
 * Migration configuration
 */
export interface MigrationConfig<TState = unknown> {
  /**
   * Current version number
   */
  currentVersion: number;

  /**
   * Map of version to migration function
   * Key is the version number to migrate TO
   */
  migrations: Record<number, MigrationFn<TState>>;

  /**
   * Optional validation function
   */
  validate?: (state: TState) => boolean;

  /**
   * Optional default state if validation fails
   */
  defaultState?: TState;
}

/**
 * Migration result
 */
export interface MigrationResult<TState = unknown> {
  success: boolean;
  state: TState;
  fromVersion?: number;
  toVersion: number;
  errors?: string[];
}
