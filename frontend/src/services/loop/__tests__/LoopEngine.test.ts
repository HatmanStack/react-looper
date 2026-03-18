/**
 * Tests for Loop Engine Service
 *
 * Tests pass data directly to LoopEngine methods - no Zustand store setup needed.
 */

import { LoopEngine } from "../LoopEngine";
import type { Track } from "../../../types";

// Helper to create mock tracks
const createMockTrack = (overrides: Partial<Track> = {}): Track => ({
  id: crypto.randomUUID(),
  name: "Test Track",
  uri: "file:///test.mp3",
  duration: 10000,
  speed: 1.0,
  volume: 100,
  isPlaying: false,
  createdAt: Date.now(),
  ...overrides,
});

describe("LoopEngine", () => {
  let loopEngine: LoopEngine;

  beforeEach(() => {
    loopEngine = new LoopEngine();
  });

  describe("getMasterLoopInfo", () => {
    it("returns null info when no tracks exist", () => {
      const info = loopEngine.getMasterLoopInfo([], 0);

      expect(info.duration).toBe(0);
      expect(info.trackId).toBeNull();
      expect(info.track).toBeNull();
    });

    it("returns master track info when tracks exist", () => {
      const track = createMockTrack({
        id: "track-1",
        duration: 10000,
        speed: 1.0,
      });

      const info = loopEngine.getMasterLoopInfo([track], 10000);

      expect(info.duration).toBe(10000);
      expect(info.trackId).toBe("track-1");
      expect(info.track).toMatchObject({
        id: "track-1",
        duration: 10000,
        speed: 1.0,
      });
    });

    it("applies speed adjustment to duration", () => {
      const track = createMockTrack({
        id: "track-1",
        duration: 10000,
        speed: 0.5, // Half speed
      });

      // Master loop duration is pre-calculated: 10000 / 0.5 = 20000
      const info = loopEngine.getMasterLoopInfo([track], 20000);

      expect(info.duration).toBe(20000); // 10s / 0.5 = 20s
    });
  });

  describe("getTrackLoopInfo", () => {
    it("returns default values when track not found", () => {
      const info = loopEngine.getTrackLoopInfo("non-existent", [], 0);

      expect(info.loopCount).toBe(1);
      expect(info.boundaries).toEqual([]);
      expect(info.totalDuration).toBe(0);
    });

    it("calculates loop info for shorter track", () => {
      const track1 = createMockTrack({
        id: "track-1",
        duration: 10000,
        speed: 1.0,
      });
      const track2 = createMockTrack({
        id: "track-2",
        duration: 4000,
        speed: 1.0,
      });

      const tracks = [track1, track2];
      const masterLoopDuration = 10000;

      const info = loopEngine.getTrackLoopInfo("track-2", tracks, masterLoopDuration);

      expect(info.loopCount).toBe(3); // 4s track loops 3 times in 10s
      expect(info.boundaries).toHaveLength(3);
      expect(info.boundaries).toEqual([0, 4000, 8000]);
      expect(info.totalDuration).toBe(10000);
    });

    it("calculates loop info for track equal to master", () => {
      const track = createMockTrack({
        id: "track-1",
        duration: 10000,
        speed: 1.0,
      });

      const info = loopEngine.getTrackLoopInfo("track-1", [track], 10000);

      expect(info.loopCount).toBe(1);
      expect(info.boundaries).toEqual([0]);
      expect(info.totalDuration).toBe(10000);
    });

    it("calculates loop info for track longer than master", () => {
      const track1 = createMockTrack({
        id: "track-1",
        duration: 10000,
        speed: 1.0,
      });
      const track2 = createMockTrack({
        id: "track-2",
        duration: 15000,
        speed: 1.0,
      });

      const tracks = [track1, track2];
      const masterLoopDuration = 10000;

      const info = loopEngine.getTrackLoopInfo("track-2", tracks, masterLoopDuration);

      expect(info.loopCount).toBe(1); // Plays once (partially)
      expect(info.boundaries).toEqual([0]);
      expect(info.totalDuration).toBe(10000);
    });
  });

  describe("shouldTrackLoop", () => {
    it("returns true when loop mode enabled and track shorter than master", () => {
      const track1 = createMockTrack({
        id: "track-1",
        duration: 10000,
        speed: 1.0,
      });
      const track2 = createMockTrack({
        id: "track-2",
        duration: 5000,
        speed: 1.0,
      });

      const tracks = [track1, track2];

      expect(loopEngine.shouldTrackLoop("track-2", tracks, 10000, true)).toBe(true);
    });

    it("returns false when loop mode disabled", () => {
      const track1 = createMockTrack({
        id: "track-1",
        duration: 10000,
        speed: 1.0,
      });
      const track2 = createMockTrack({
        id: "track-2",
        duration: 5000,
        speed: 1.0,
      });

      const tracks = [track1, track2];

      expect(loopEngine.shouldTrackLoop("track-2", tracks, 10000, false)).toBe(false);
    });

    it("returns false when track equals master duration", () => {
      const track = createMockTrack({
        id: "track-1",
        duration: 10000,
        speed: 1.0,
      });

      expect(loopEngine.shouldTrackLoop("track-1", [track], 10000, true)).toBe(false); // Master doesn't loop
    });

    it("returns false when track not found", () => {
      expect(loopEngine.shouldTrackLoop("non-existent", [], 10000, true)).toBe(false);
    });
  });

  describe("calculateExportDuration", () => {
    it("calculates export duration with master loop", () => {
      const duration = loopEngine.calculateExportDuration(10000, 4, 2000);

      // 4 loops of 10s = 40s + 2s fadeout = 42s
      expect(duration).toBe(42000);
    });

    it("uses master loop duration for calculation", () => {
      // Master loop duration is pre-calculated: 10000 / 0.5 = 20000
      const duration = loopEngine.calculateExportDuration(20000, 2, 1000);

      // 2 loops of 20s = 40s + 1s fadeout = 41s
      expect(duration).toBe(41000);
    });

    it("returns fadeout only when master duration is zero", () => {
      const duration = loopEngine.calculateExportDuration(0, 4, 2000);

      expect(duration).toBe(2000); // Only fadeout
    });

    it("handles zero loop count", () => {
      const duration = loopEngine.calculateExportDuration(10000, 0, 2000);

      expect(duration).toBe(2000); // Only fadeout
    });

    it("handles zero fadeout", () => {
      const duration = loopEngine.calculateExportDuration(10000, 3, 0);

      expect(duration).toBe(30000); // 3 loops, no fadeout
    });
  });

  describe("isLoopModeEnabled", () => {
    it("returns true when loop mode enabled", () => {
      expect(loopEngine.isLoopModeEnabled(true)).toBe(true);
    });

    it("returns false when loop mode disabled", () => {
      expect(loopEngine.isLoopModeEnabled(false)).toBe(false);
    });
  });
});
