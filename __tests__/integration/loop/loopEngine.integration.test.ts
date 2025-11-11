/**
 * Integration Tests for Loop Engine (Phase 1)
 *
 * Tests all Phase 1 components working together:
 * - Loop utilities
 * - Settings store
 * - Track store
 * - Playback store
 * - Loop engine service
 */

import { LoopEngine } from "../../../src/services/loop/LoopEngine";
import { useTrackStore } from "../../../src/store/useTrackStore";
import { usePlaybackStore } from "../../../src/store/usePlaybackStore";
import { useSettingsStore } from "../../../src/store/useSettingsStore";
import type { Track } from "../../../src/types";

// Helper to create mock tracks
const createMockTrack = (overrides: Partial<Track> = {}): Track => ({
  id: `track-${Date.now()}-${Math.random()}`,
  name: "Test Track",
  uri: "file:///test.mp3",
  duration: 10000,
  speed: 1.0,
  volume: 100,
  isPlaying: false,
  createdAt: Date.now(),
  ...overrides,
});

describe("Loop Engine Integration", () => {
  let loopEngine: LoopEngine;

  beforeEach(() => {
    // Reset all stores
    useTrackStore.getState().clearTracks();
    usePlaybackStore.getState().reset();
    useSettingsStore.getState().resetToDefaults();

    loopEngine = new LoopEngine();
  });

  describe("master loop and track repetitions", () => {
    it("calculates master loop and track repetitions correctly", () => {
      // Add master track (10s at 1.0x = 10s loop)
      const track1 = createMockTrack({
        id: "track-1",
        duration: 10000,
        speed: 1.0,
      });
      useTrackStore.getState().addTrack(track1);

      // Verify master loop
      const masterInfo = loopEngine.getMasterLoopInfo();
      expect(masterInfo.duration).toBe(10000);
      expect(masterInfo.trackId).toBe("track-1");
      expect(masterInfo.track).toMatchObject({
        id: "track-1",
        duration: 10000,
      });

      // Add second track (4s at 1.0x)
      const track2 = createMockTrack({
        id: "track-2",
        duration: 4000,
        speed: 1.0,
      });
      useTrackStore.getState().addTrack(track2);

      // Verify loop count (4s loops 3 times in 10s)
      const track2Info = loopEngine.getTrackLoopInfo("track-2");
      expect(track2Info.loopCount).toBe(3);
      expect(track2Info.boundaries).toEqual([0, 4000, 8000]);
      expect(track2Info.totalDuration).toBe(10000);
    });
  });

  describe("master track speed changes", () => {
    it("updates loop duration when master track speed changes", () => {
      // Add master track (10s at 1.0x = 10s loop)
      const track1 = createMockTrack({
        id: "track-1",
        duration: 10000,
        speed: 1.0,
      });
      useTrackStore.getState().addTrack(track1);

      expect(loopEngine.getMasterLoopInfo().duration).toBe(10000);

      // Change speed to 0.5x (10s / 0.5 = 20s loop)
      useTrackStore.getState().updateTrack("track-1", { speed: 0.5 });

      // Verify master loop duration updated
      const masterInfo = loopEngine.getMasterLoopInfo();
      expect(masterInfo.duration).toBe(20000);

      // Add second track and verify it loops correctly in new master duration
      const track2 = createMockTrack({
        id: "track-2",
        duration: 5000,
        speed: 1.0,
      });
      useTrackStore.getState().addTrack(track2);

      const track2Info = loopEngine.getTrackLoopInfo("track-2");
      expect(track2Info.loopCount).toBe(4); // 5s loops 4 times in 20s
    });
  });

  describe("loop mode integration", () => {
    it("respects loop mode setting from settings store", () => {
      // Settings default is loop mode ON
      expect(useSettingsStore.getState().defaultLoopMode).toBe(true);
      expect(usePlaybackStore.getState().loopMode).toBe(true);

      // Add tracks
      useTrackStore
        .getState()
        .addTrack(
          createMockTrack({ id: "track-1", duration: 10000, speed: 1.0 }),
        );
      useTrackStore
        .getState()
        .addTrack(createMockTrack({ id: "track-2", duration: 5000, speed: 1.0 }));

      // Loop mode ON - track should loop
      expect(loopEngine.shouldTrackLoop("track-2")).toBe(true);

      // Toggle loop mode OFF
      usePlaybackStore.getState().setLoopMode(false);
      expect(loopEngine.shouldTrackLoop("track-2")).toBe(false);

      // Toggle back ON
      usePlaybackStore.getState().toggleLoopMode();
      expect(loopEngine.shouldTrackLoop("track-2")).toBe(true);
    });
  });

  describe("master track removal", () => {
    it("clears all tracks when master is removed", () => {
      // Add multiple tracks
      useTrackStore
        .getState()
        .addTrack(
          createMockTrack({ id: "track-1", duration: 10000, speed: 1.0 }),
        );
      useTrackStore
        .getState()
        .addTrack(createMockTrack({ id: "track-2", duration: 5000, speed: 1.0 }));
      useTrackStore
        .getState()
        .addTrack(createMockTrack({ id: "track-3", duration: 3000, speed: 1.0 }));

      expect(useTrackStore.getState().tracks).toHaveLength(3);
      expect(loopEngine.getMasterLoopInfo().duration).toBe(10000);

      // Remove master track
      useTrackStore.getState().removeTrack("track-1");

      // All tracks should be cleared
      expect(useTrackStore.getState().tracks).toHaveLength(0);
      expect(loopEngine.getMasterLoopInfo().duration).toBe(0);
      expect(loopEngine.getMasterLoopInfo().track).toBeNull();
    });
  });

  describe("export duration calculations", () => {
    it("calculates export duration using settings and master loop", () => {
      const settings = useSettingsStore.getState();

      // Add master track (10s)
      useTrackStore
        .getState()
        .addTrack(
          createMockTrack({ id: "track-1", duration: 10000, speed: 1.0 }),
        );

      // Calculate export with default settings (4 loops, 2s fadeout)
      const exportDuration = loopEngine.calculateExportDuration(
        settings.defaultLoopCount,
        settings.defaultFadeout,
      );

      // 4 * 10s + 2s = 42s
      expect(exportDuration).toBe(42000);

      // Update settings
      useSettingsStore.getState().updateSettings({
        defaultLoopCount: 2,
        defaultFadeout: 1000,
      });

      const newExportDuration = loopEngine.calculateExportDuration(
        useSettingsStore.getState().defaultLoopCount,
        useSettingsStore.getState().defaultFadeout,
      );

      // 2 * 10s + 1s = 21s
      expect(newExportDuration).toBe(21000);
    });
  });

  describe("complex scenarios", () => {
    it("handles multiple tracks with various durations and speeds", () => {
      // Master track: 12s at 0.5x = 24s loop
      useTrackStore
        .getState()
        .addTrack(
          createMockTrack({ id: "track-1", duration: 12000, speed: 0.5 }),
        );

      // Track 2: 6s (loops 4 times in 24s)
      useTrackStore
        .getState()
        .addTrack(createMockTrack({ id: "track-2", duration: 6000, speed: 1.0 }));

      // Track 3: 8s (loops 3 times in 24s)
      useTrackStore
        .getState()
        .addTrack(createMockTrack({ id: "track-3", duration: 8000, speed: 1.0 }));

      // Track 4: 30s (plays once, partially)
      useTrackStore
        .getState()
        .addTrack(
          createMockTrack({ id: "track-4", duration: 30000, speed: 1.0 }),
        );

      const masterInfo = loopEngine.getMasterLoopInfo();
      expect(masterInfo.duration).toBe(24000);

      const track2Info = loopEngine.getTrackLoopInfo("track-2");
      expect(track2Info.loopCount).toBe(4);
      expect(track2Info.boundaries).toEqual([0, 6000, 12000, 18000]);

      const track3Info = loopEngine.getTrackLoopInfo("track-3");
      expect(track3Info.loopCount).toBe(3);
      expect(track3Info.boundaries).toEqual([0, 8000, 16000]);

      const track4Info = loopEngine.getTrackLoopInfo("track-4");
      expect(track4Info.loopCount).toBe(1);
      expect(track4Info.boundaries).toEqual([0]);
    });

    it("handles rapid state changes", () => {
      // Add master track
      useTrackStore
        .getState()
        .addTrack(
          createMockTrack({ id: "track-1", duration: 10000, speed: 1.0 }),
        );

      // Rapid speed changes
      for (let i = 0; i < 10; i++) {
        const speed = 0.5 + i * 0.1;
        useTrackStore.getState().updateTrack("track-1", { speed });
        const info = loopEngine.getMasterLoopInfo();
        expect(info.duration).toBeCloseTo(10000 / speed, 0);
      }

      // Rapid loop mode toggles
      const initialLoopMode = usePlaybackStore.getState().loopMode; // true by default
      for (let i = 0; i < 10; i++) {
        usePlaybackStore.getState().toggleLoopMode();
        // After toggle: if i is even, we've toggled an odd number of times (opposite of initial)
        expect(loopEngine.isLoopModeEnabled()).toBe((i + 1) % 2 === 0 ? initialLoopMode : !initialLoopMode);
      }
    });
  });

  describe("settings store integration", () => {
    it("playback store reflects settings changes on reset", () => {
      // Change settings default
      useSettingsStore.getState().updateSettings({ defaultLoopMode: false });

      // Reset playback store (should pick up new default)
      usePlaybackStore.getState().reset();

      expect(usePlaybackStore.getState().loopMode).toBe(false);
      expect(loopEngine.isLoopModeEnabled()).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles empty tracks gracefully", () => {
      const masterInfo = loopEngine.getMasterLoopInfo();
      expect(masterInfo.duration).toBe(0);
      expect(masterInfo.track).toBeNull();

      const trackInfo = loopEngine.getTrackLoopInfo("non-existent");
      expect(trackInfo.loopCount).toBe(1);
      expect(trackInfo.boundaries).toEqual([]);
    });

    it("handles single track (master only)", () => {
      useTrackStore
        .getState()
        .addTrack(
          createMockTrack({ id: "track-1", duration: 10000, speed: 1.0 }),
        );

      const masterInfo = loopEngine.getMasterLoopInfo();
      expect(masterInfo.duration).toBe(10000);

      // Master track doesn't loop
      expect(loopEngine.shouldTrackLoop("track-1")).toBe(false);

      const trackInfo = loopEngine.getTrackLoopInfo("track-1");
      expect(trackInfo.loopCount).toBe(1);
    });
  });
});
