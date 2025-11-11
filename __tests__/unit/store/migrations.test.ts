/**
 * Migration System Tests
 */

import {
  runMigrations,
  createVersionedState,
} from "../../../src/store/migrations/migrationSystem";
import type { MigrationConfig } from "../../../src/store/migrations/types";

describe("Migration System", () => {
  describe("runMigrations", () => {
    it("should return state unchanged if version matches", () => {
      const config: MigrationConfig = {
        currentVersion: 1,
        migrations: {},
      };

      const persistedData = {
        version: 1,
        state: { data: "test" },
      };

      const result = runMigrations(persistedData, config);

      expect(result.success).toBe(true);
      expect(result.state).toEqual({ data: "test" });
      expect(result.fromVersion).toBe(1);
      expect(result.toVersion).toBe(1);
    });

    it("should run single migration", () => {
      const migration1 = jest.fn((state) => ({ ...state, migrated: true }));

      const config: MigrationConfig = {
        currentVersion: 1,
        migrations: {
          1: migration1,
        },
      };

      const persistedData = {
        version: 0,
        state: { data: "test" },
      };

      const result = runMigrations(persistedData, config);

      expect(result.success).toBe(true);
      expect(result.state).toEqual({ data: "test", migrated: true });
      expect(migration1).toHaveBeenCalledWith({ data: "test" });
    });

    it("should run multiple migrations sequentially", () => {
      const migration1 = jest.fn((state) => ({ ...state, v1: true }));
      const migration2 = jest.fn((state) => ({ ...state, v2: true }));
      const migration3 = jest.fn((state) => ({ ...state, v3: true }));

      const config: MigrationConfig = {
        currentVersion: 3,
        migrations: {
          1: migration1,
          2: migration2,
          3: migration3,
        },
      };

      const persistedData = {
        version: 0,
        state: { initial: true },
      };

      const result = runMigrations(persistedData, config);

      expect(result.success).toBe(true);
      expect(result.state).toEqual({
        initial: true,
        v1: true,
        v2: true,
        v3: true,
      });

      // Verify migrations ran in order
      expect(migration1).toHaveBeenCalledWith({ initial: true });
      expect(migration2).toHaveBeenCalledWith({ initial: true, v1: true });
      expect(migration3).toHaveBeenCalledWith({
        initial: true,
        v1: true,
        v2: true,
      });
    });

    it("should skip missing migrations", () => {
      const migration3 = jest.fn((state) => ({ ...state, v3: true }));

      const config: MigrationConfig = {
        currentVersion: 3,
        migrations: {
          // Missing migrations for v1 and v2
          3: migration3,
        },
      };

      const persistedData = {
        version: 0,
        state: { initial: true },
      };

      const result = runMigrations(persistedData, config);

      expect(result.success).toBe(true);
      expect(result.state).toEqual({ initial: true, v3: true });
    });

    it("should validate state after migration", () => {
      const validate = jest.fn((state) => state.valid === true);

      const config: MigrationConfig = {
        currentVersion: 1,
        migrations: {
          1: (state) => ({ ...state, valid: true }),
        },
        validate,
      };

      const persistedData = {
        version: 0,
        state: { data: "test" },
      };

      const result = runMigrations(persistedData, config);

      expect(result.success).toBe(true);
      expect(validate).toHaveBeenCalledWith({ data: "test", valid: true });
    });

    it("should return default state if validation fails", () => {
      const validate = jest.fn(() => false);
      const defaultState = { default: true };

      const config: MigrationConfig = {
        currentVersion: 1,
        migrations: {
          1: (state) => state,
        },
        validate,
        defaultState,
      };

      const persistedData = {
        version: 0,
        state: { invalid: true },
      };

      const result = runMigrations(persistedData, config);

      expect(result.success).toBe(false);
      expect(result.state).toEqual(defaultState);
      expect(result.errors).toBeDefined();
    });

    it("should return default state if migration throws", () => {
      const defaultState = { default: true };

      const config: MigrationConfig = {
        currentVersion: 1,
        migrations: {
          1: () => {
            throw new Error("Migration failed");
          },
        },
        defaultState,
      };

      const persistedData = {
        version: 0,
        state: { data: "test" },
      };

      const result = runMigrations(persistedData, config);

      expect(result.success).toBe(false);
      expect(result.state).toEqual(defaultState);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain("Migration failed");
    });

    it("should throw if migration fails and no default state", () => {
      const config: MigrationConfig = {
        currentVersion: 1,
        migrations: {
          1: () => {
            throw new Error("Migration failed");
          },
        },
      };

      const persistedData = {
        version: 0,
        state: { data: "test" },
      };

      expect(() => {
        runMigrations(persistedData, config);
      }).toThrow("Migration failed");
    });

    it("should handle non-versioned data", () => {
      const config: MigrationConfig = {
        currentVersion: 1,
        migrations: {
          1: (state) => ({ ...state, migrated: true }),
        },
      };

      const persistedData = { data: "test" }; // No version wrapper

      const result = runMigrations(persistedData, config);

      expect(result.success).toBe(true);
      expect(result.state).toEqual({ data: "test", migrated: true });
    });
  });

  describe("createVersionedState", () => {
    it("should create versioned state wrapper", () => {
      const state = { data: "test" };
      const version = 2;

      const versioned = createVersionedState(state, version);

      expect(versioned.version).toBe(2);
      expect(versioned.state).toEqual(state);
      expect(versioned.versionHistory).toBeDefined();
      expect(versioned.versionHistory!.length).toBe(1);
      expect(versioned.versionHistory![0].version).toBe(2);
      expect(versioned.versionHistory![0].timestamp).toBeLessThanOrEqual(
        Date.now(),
      );
    });

    it("should preserve version history", () => {
      const state = { data: "test" };
      const previousHistory = [
        { version: 1, timestamp: Date.now() - 1000 },
        { version: 2, timestamp: Date.now() - 500 },
      ];

      const versioned = createVersionedState(state, 3, previousHistory);

      expect(versioned.versionHistory!.length).toBe(3);
      expect(versioned.versionHistory![0].version).toBe(1);
      expect(versioned.versionHistory![1].version).toBe(2);
      expect(versioned.versionHistory![2].version).toBe(3);
    });

    it("should not duplicate version in history", () => {
      const state = { data: "test" };
      const previousHistory = [
        { version: 1, timestamp: Date.now() - 1000 },
        { version: 2, timestamp: Date.now() - 500 },
      ];

      const versioned = createVersionedState(state, 2, previousHistory);

      expect(versioned.versionHistory!.length).toBe(2);
      expect(
        versioned.versionHistory!.filter((h) => h.version === 2).length,
      ).toBe(1);
    });
  });

  describe("Integration scenarios", () => {
    it("should handle track store migration scenario", () => {
      const config: MigrationConfig = {
        currentVersion: 2,
        migrations: {
          1: (state) => {
            // v1: Ensure tracks array exists
            return {
              tracks: Array.isArray(state.tracks) ? state.tracks : [],
            };
          },
          2: (state) => {
            // v2: Add category field to all tracks
            return {
              ...state,
              tracks: state.tracks.map((track: any) => ({
                ...track,
                category: track.category || "default",
              })),
            };
          },
        },
        validate: (state) => Array.isArray(state.tracks),
        defaultState: { tracks: [] },
      };

      const oldData = {
        version: 0,
        state: {
          tracks: [
            { id: "1", name: "Track 1", speed: 1.0 },
            { id: "2", name: "Track 2", speed: 1.5 },
          ],
        },
      };

      const result = runMigrations(oldData, config);

      expect(result.success).toBe(true);
      expect(result.fromVersion).toBe(0);
      expect(result.toVersion).toBe(2);
      expect(result.state.tracks).toHaveLength(2);
      expect(result.state.tracks[0].category).toBe("default");
      expect(result.state.tracks[1].category).toBe("default");
    });

    it("should handle corrupted data gracefully", () => {
      const config: MigrationConfig = {
        currentVersion: 1,
        migrations: {
          1: (state) => state,
        },
        validate: (state) => typeof state === "object" && state !== null,
        defaultState: { tracks: [] },
      };

      const corruptedData = null;

      const result = runMigrations(corruptedData, config);

      expect(result.success).toBe(false);
      expect(result.state).toEqual({ tracks: [] });
    });
  });
});
