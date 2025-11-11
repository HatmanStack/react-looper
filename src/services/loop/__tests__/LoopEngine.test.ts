/**
 * Tests for Loop Engine Service
 *
 * Following TDD approach - tests written first before implementation
 */

import { LoopEngine } from "../LoopEngine";
import { useTrackStore } from "../../../store/useTrackStore";
import { usePlaybackStore } from "../../../store/usePlaybackStore";
import { useSettingsStore } from "../../../store/useSettingsStore";
import type { Track } from "../../../types";

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

describe("LoopEngine", () => {
  let loopEngine: LoopEngine;

  beforeEach(() => {
    // Reset all stores
    useTrackStore.getState().clearTracks();
    usePlaybackStore.getState().reset();
    useSettingsStore.getState().resetToDefaults();

    loopEngine = new LoopEngine();
  });

  describe("getMasterLoopInfo", () => {
    it("returns null info when no tracks exist", () => {
      const info = loopEngine.getMasterLoopInfo();

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
      useTrackStore.getState().addTrack(track);

      const info = loopEngine.getMasterLoopInfo();

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
      useTrackStore.getState().addTrack(track);

      const info = loopEngine.getMasterLoopInfo();

      expect(info.duration).toBe(20000); // 10s / 0.5 = 20s
    });
  });

  describe("getTrackLoopInfo", () => {
    it("returns default values when track not found", () => {
      const info = loopEngine.getTrackLoopInfo("non-existent");

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

      useTrackStore.getState().addTrack(track1);
      useTrackStore.getState().addTrack(track2);

      const info = loopEngine.getTrackLoopInfo("track-2");

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

      useTrackStore.getState().addTrack(track);

      const info = loopEngine.getTrackLoopInfo("track-1");

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

      useTrackStore.getState().addTrack(track1);
      useTrackStore.getState().addTrack(track2);

      const info = loopEngine.getTrackLoopInfo("track-2");

      expect(info.loopCount).toBe(1); // Plays once (partially)
      expect(info.boundaries).toEqual([0]);
      expect(info.totalDuration).toBe(10000);
    });
  });

  describe("shouldTrackLoop", () => {
    it("returns true when loop mode enabled and track shorter than master", () => {
      usePlaybackStore.getState().setLoopMode(true);

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

      useTrackStore.getState().addTrack(track1);
      useTrackStore.getState().addTrack(track2);

      expect(loopEngine.shouldTrackLoop("track-2")).toBe(true);
    });

    it("returns false when loop mode disabled", () => {
      usePlaybackStore.getState().setLoopMode(false);

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

      useTrackStore.getState().addTrack(track1);
      useTrackStore.getState().addTrack(track2);

      expect(loopEngine.shouldTrackLoop("track-2")).toBe(false);
    });

    it("returns false when track equals master duration", () => {
      usePlaybackStore.getState().setLoopMode(true);

      const track = createMockTrack({
        id: "track-1",
        duration: 10000,
        speed: 1.0,
      });

      useTrackStore.getState().addTrack(track);

      expect(loopEngine.shouldTrackLoop("track-1")).toBe(false); // Master doesn't loop
    });

    it("returns false when track not found", () => {
      usePlaybackStore.getState().setLoopMode(true);

      expect(loopEngine.shouldTrackLoop("non-existent")).toBe(false);
    });
  });

  describe("calculateExportDuration", () => {
    it("calculates export duration without master loop", () => {
      const track = createMockTrack({
        id: "track-1",
        duration: 10000,
        speed: 1.0,
      });
      useTrackStore.getState().addTrack(track);

      const duration = loopEngine.calculateExportDuration(4, 2000);

      // 4 loops of 10s = 40s + 2s fadeout = 42s
      expect(duration).toBe(42000);
    });

    it("uses master loop duration for calculation", () => {
      const track = createMockTrack({
        id: "track-1",
        duration: 10000,
        speed: 0.5, // 20s at 0.5x speed
      });
      useTrackStore.getState().addTrack(track);

      const duration = loopEngine.calculateExportDuration(2, 1000);

      // 2 loops of 20s = 40s + 1s fadeout = 41s
      expect(duration).toBe(41000);
    });

    it("returns fadeout only when no tracks exist", () => {
      const duration = loopEngine.calculateExportDuration(4, 2000);

      expect(duration).toBe(2000); // Only fadeout
    });

    it("handles zero loop count", () => {
      const track = createMockTrack({
        id: "track-1",
        duration: 10000,
        speed: 1.0,
      });
      useTrackStore.getState().addTrack(track);

      const duration = loopEngine.calculateExportDuration(0, 2000);

      expect(duration).toBe(2000); // Only fadeout
    });

    it("handles zero fadeout", () => {
      const track = createMockTrack({
        id: "track-1",
        duration: 10000,
        speed: 1.0,
      });
      useTrackStore.getState().addTrack(track);

      const duration = loopEngine.calculateExportDuration(3, 0);

      expect(duration).toBe(30000); // 3 loops, no fadeout
    });
  });

  describe("isLoopModeEnabled", () => {
    it("returns true when loop mode enabled", () => {
      usePlaybackStore.getState().setLoopMode(true);

      expect(loopEngine.isLoopModeEnabled()).toBe(true);
    });

    it("returns false when loop mode disabled", () => {
      usePlaybackStore.getState().setLoopMode(false);

      expect(loopEngine.isLoopModeEnabled()).toBe(false);
    });

    it("reflects changes in loop mode", () => {
      usePlaybackStore.getState().setLoopMode(true);
      expect(loopEngine.isLoopModeEnabled()).toBe(true);

      usePlaybackStore.getState().setLoopMode(false);
      expect(loopEngine.isLoopModeEnabled()).toBe(false);
    });
  });
});
