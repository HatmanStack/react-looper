/**
 * Tests for Looper Normalization Migration
 *
 * Following TDD approach - tests written first before implementation
 */

import { migration_v2_removeSelected } from "../trackMigrations";
import type { Track } from "../../../types";

/** Track type after v2 migration (selected property removed) */
type MigratedTrack = Omit<Track, "selected">;

describe("looperNormalization migration (v2)", () => {
  describe("migration_v2_removeSelected", () => {
    it("removes selected property from tracks", () => {
      const oldState = {
        tracks: [
          {
            id: "1",
            name: "Track 1",
            uri: "file:///track1.mp3",
            duration: 10000,
            speed: 1.0,
            volume: 75,
            isPlaying: false,
            selected: true, // Should be removed
            createdAt: Date.now(),
          },
          {
            id: "2",
            name: "Track 2",
            uri: "file:///track2.mp3",
            duration: 5000,
            speed: 1.5,
            volume: 80,
            isPlaying: true,
            selected: false, // Should be removed
            createdAt: Date.now(),
          },
        ],
      };

      const newState = migration_v2_removeSelected(oldState);

      // Verify selected property removed from all tracks
      newState.tracks.forEach((track: MigratedTrack) => {
        expect(track).not.toHaveProperty("selected");
      });

      // Verify track count unchanged
      expect(newState.tracks).toHaveLength(2);
    });

    it("preserves all other track properties", () => {
      const oldState = {
        tracks: [
          {
            id: "1",
            name: "Track 1",
            uri: "file:///track1.mp3",
            duration: 10000,
            speed: 1.5,
            volume: 80,
            isPlaying: true,
            selected: true,
            createdAt: 123456789,
          },
        ],
      };

      const newState = migration_v2_removeSelected(oldState);

      // Verify all properties preserved except 'selected'
      expect(newState.tracks[0]).toMatchObject({
        id: "1",
        name: "Track 1",
        uri: "file:///track1.mp3",
        duration: 10000,
        speed: 1.5,
        volume: 80,
        isPlaying: true,
        createdAt: 123456789,
      });
    });

    it("handles empty state gracefully", () => {
      const oldState = {};

      const newState = migration_v2_removeSelected(oldState);

      expect(newState.tracks).toEqual([]);
    });

    it("handles missing tracks array", () => {
      const oldState = {
        someOtherProperty: "value",
      };

      const newState = migration_v2_removeSelected(oldState);

      expect(newState.tracks).toEqual([]);
    });

    it("handles tracks without selected property", () => {
      const oldState = {
        tracks: [
          {
            id: "1",
            name: "Track 1",
            uri: "file:///track1.mp3",
            duration: 10000,
            speed: 1.0,
            volume: 75,
            isPlaying: false,
            createdAt: Date.now(),
            // No 'selected' property
          },
        ],
      };

      const newState = migration_v2_removeSelected(oldState);

      expect(newState.tracks).toHaveLength(1);
      expect(newState.tracks[0]).not.toHaveProperty("selected");
      expect(newState.tracks[0].id).toBe("1");
    });

    it("handles null tracks gracefully", () => {
      const oldState = {
        tracks: null,
      };

      const newState = migration_v2_removeSelected(oldState);

      expect(newState.tracks).toEqual([]);
    });

    it("filters out invalid tracks", () => {
      const oldState = {
        tracks: [
          {
            id: "1",
            name: "Valid Track",
            uri: "file:///track1.mp3",
            duration: 10000,
            speed: 1.0,
            volume: 75,
            isPlaying: false,
            selected: true,
            createdAt: Date.now(),
          },
          {
            // Invalid: missing required fields
            id: "2",
            selected: false,
          },
          {
            id: "3",
            name: "Another Valid Track",
            uri: "file:///track3.mp3",
            duration: 5000,
            speed: 1.0,
            volume: 80,
            isPlaying: false,
            selected: true,
            createdAt: Date.now(),
          },
        ],
      };

      const newState = migration_v2_removeSelected(oldState);

      // Only valid tracks should remain
      expect(newState.tracks).toHaveLength(2);
      expect(newState.tracks[0].id).toBe("1");
      expect(newState.tracks[1].id).toBe("3");
    });

    it("is idempotent (can run multiple times safely)", () => {
      const oldState = {
        tracks: [
          {
            id: "1",
            name: "Track 1",
            uri: "file:///track1.mp3",
            duration: 10000,
            speed: 1.0,
            volume: 75,
            isPlaying: false,
            selected: true,
            createdAt: Date.now(),
          },
        ],
      };

      // Run migration once
      const newState1 = migration_v2_removeSelected(oldState);

      // Run migration again on migrated state
      const newState2 = migration_v2_removeSelected(newState1);

      // Should produce identical result
      expect(newState2).toEqual(newState1);
      expect(newState2.tracks[0]).not.toHaveProperty("selected");
    });
  });
});
