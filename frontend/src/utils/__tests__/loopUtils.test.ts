/**
 * Tests for Loop Utilities
 *
 * Following TDD approach - tests written first before implementation
 */

import type { Track } from "../../types";
import {
  calculateMasterLoopDuration,
  calculateLoopCount,
  calculateSpeedAdjustedDuration,
  isMasterTrack,
  getMasterTrack,
  calculateTrackLoopBoundaries,
  calculateSyncSpeed,
  getValidSyncMultipliers,
  MIN_SPEED,
  MAX_SPEED,
} from "../loopUtils";

// Helper to create mock tracks for testing
const createMockTrack = (overrides: Partial<Track> = {}): Track => ({
  id: "test-id",
  name: "Test Track",
  uri: "file:///test.mp3",
  duration: 10000, // 10 seconds default
  speed: 1.0,
  volume: 100,
  isPlaying: false,
  createdAt: Date.now(),
  ...overrides,
});

describe("calculateMasterLoopDuration", () => {
  describe("normal cases", () => {
    it("returns 0 for empty array", () => {
      expect(calculateMasterLoopDuration([])).toBe(0);
    });

    it("returns correct duration for single track at normal speed", () => {
      const track = createMockTrack({ duration: 10000, speed: 1.0 });
      expect(calculateMasterLoopDuration([track])).toBe(10000);
    });

    it("applies speed adjustment correctly for half speed", () => {
      const track = createMockTrack({ duration: 10000, speed: 0.5 });
      // Duration / speed = 10000 / 0.5 = 20000
      expect(calculateMasterLoopDuration([track])).toBe(20000);
    });

    it("applies speed adjustment correctly for double speed", () => {
      const track = createMockTrack({ duration: 10000, speed: 2.0 });
      // Duration / speed = 10000 / 2.0 = 5000
      expect(calculateMasterLoopDuration([track])).toBe(5000);
    });

    it("only considers first track in array", () => {
      const track1 = createMockTrack({
        id: "1",
        duration: 10000,
        speed: 1.0,
      });
      const track2 = createMockTrack({
        id: "2",
        duration: 20000,
        speed: 1.0,
      });
      expect(calculateMasterLoopDuration([track1, track2])).toBe(10000);
    });
  });

  describe("edge cases", () => {
    it("handles speed at minimum (0.05)", () => {
      const track = createMockTrack({ duration: 1000, speed: 0.05 });
      // 1000 / 0.05 = 20000
      expect(calculateMasterLoopDuration([track])).toBe(20000);
    });

    it("handles speed at maximum (2.5)", () => {
      const track = createMockTrack({ duration: 1000, speed: 2.5 });
      // 1000 / 2.5 = 400
      expect(calculateMasterLoopDuration([track])).toBe(400);
    });

    it("handles zero duration track", () => {
      const track = createMockTrack({ duration: 0, speed: 1.0 });
      expect(calculateMasterLoopDuration([track])).toBe(0);
    });

    it("handles missing speed property by defaulting to 1.0", () => {
      const track = createMockTrack({ duration: 10000 });
      // @ts-expect-error - intentionally removing speed to test default
      delete track.speed;
      expect(calculateMasterLoopDuration([track])).toBe(10000);
    });

    it("handles negative duration by returning 0", () => {
      const track = createMockTrack({ duration: -1000, speed: 1.0 });
      expect(calculateMasterLoopDuration([track])).toBe(0);
    });
  });
});

describe("calculateLoopCount", () => {
  describe("normal cases", () => {
    it("returns 1 when track equals master duration", () => {
      expect(calculateLoopCount(10000, 10000)).toBe(1);
    });

    it("returns 2 when track is half master duration", () => {
      expect(calculateLoopCount(5000, 10000)).toBe(2);
    });

    it("returns correct count for partial loops", () => {
      // 7s track in 10s loop should loop 2 times (7s + 3s partial)
      expect(calculateLoopCount(7000, 10000)).toBe(2);
    });

    it("returns correct count when track is much shorter", () => {
      // 2s track in 10s loop should loop 5 times
      expect(calculateLoopCount(2000, 10000)).toBe(5);
    });

    it("returns 1 when track is longer than master", () => {
      // Track longer than master plays once (partially)
      expect(calculateLoopCount(15000, 10000)).toBe(1);
    });
  });

  describe("edge cases", () => {
    it("returns 1 for zero master duration (avoid division by zero)", () => {
      expect(calculateLoopCount(5000, 0)).toBe(1);
    });

    it("returns 1 for negative master duration", () => {
      expect(calculateLoopCount(5000, -10000)).toBe(1);
    });

    it("returns 1 for zero track duration", () => {
      expect(calculateLoopCount(0, 10000)).toBe(1);
    });

    it("returns 1 for negative track duration", () => {
      expect(calculateLoopCount(-5000, 10000)).toBe(1);
    });

    it("handles very large ratios", () => {
      // 0.1s (100ms) track in 60s loop = 600 loops
      expect(calculateLoopCount(100, 60000)).toBe(600);
    });

    it("handles very small ratios", () => {
      // 1ms track in 10s loop = 10000 loops
      expect(calculateLoopCount(1, 10000)).toBe(10000);
    });
  });
});

describe("calculateSpeedAdjustedDuration", () => {
  it("returns same duration for speed 1.0", () => {
    expect(calculateSpeedAdjustedDuration(10000, 1.0)).toBe(10000);
  });

  it("doubles duration for speed 0.5", () => {
    expect(calculateSpeedAdjustedDuration(10000, 0.5)).toBe(20000);
  });

  it("halves duration for speed 2.0", () => {
    expect(calculateSpeedAdjustedDuration(10000, 2.0)).toBe(5000);
  });

  it("handles speed at minimum (0.05)", () => {
    expect(calculateSpeedAdjustedDuration(1000, 0.05)).toBe(20000);
  });

  it("handles speed at maximum (2.5)", () => {
    expect(calculateSpeedAdjustedDuration(1000, 2.5)).toBe(400);
  });

  it("returns 0 for zero duration", () => {
    expect(calculateSpeedAdjustedDuration(0, 1.0)).toBe(0);
  });

  it("handles negative duration by returning 0", () => {
    expect(calculateSpeedAdjustedDuration(-1000, 1.0)).toBe(0);
  });

  it("defaults to speed 1.0 for invalid speed", () => {
    expect(calculateSpeedAdjustedDuration(10000, 0)).toBe(10000);
    expect(calculateSpeedAdjustedDuration(10000, -1)).toBe(10000);
  });
});

describe("isMasterTrack", () => {
  it("returns true for first track in array", () => {
    const track1 = createMockTrack({ id: "track-1" });
    const track2 = createMockTrack({ id: "track-2" });
    expect(isMasterTrack([track1, track2], "track-1")).toBe(true);
  });

  it("returns false for non-first track", () => {
    const track1 = createMockTrack({ id: "track-1" });
    const track2 = createMockTrack({ id: "track-2" });
    expect(isMasterTrack([track1, track2], "track-2")).toBe(false);
  });

  it("returns false for empty array", () => {
    expect(isMasterTrack([], "any-id")).toBe(false);
  });

  it("returns false for non-existent track id", () => {
    const track1 = createMockTrack({ id: "track-1" });
    expect(isMasterTrack([track1], "non-existent")).toBe(false);
  });

  it("returns true when single track matches", () => {
    const track = createMockTrack({ id: "only-track" });
    expect(isMasterTrack([track], "only-track")).toBe(true);
  });
});

describe("getMasterTrack", () => {
  it("returns first track when tracks exist", () => {
    const track1 = createMockTrack({ id: "track-1", name: "First Track" });
    const track2 = createMockTrack({ id: "track-2", name: "Second Track" });

    const master = getMasterTrack([track1, track2]);
    expect(master).not.toBeNull();
    expect(master?.id).toBe("track-1");
    expect(master?.name).toBe("First Track");
  });

  it("returns null for empty array", () => {
    expect(getMasterTrack([])).toBeNull();
  });

  it("returns single track when only one exists", () => {
    const track = createMockTrack({ id: "only-track" });
    const master = getMasterTrack([track]);
    expect(master).not.toBeNull();
    expect(master?.id).toBe("only-track");
  });

  it("returns full track object with all properties", () => {
    const track = createMockTrack({
      id: "track-1",
      name: "Test Track",
      duration: 5000,
      speed: 1.5,
      volume: 80,
    });

    const master = getMasterTrack([track]);
    expect(master).toMatchObject({
      id: "track-1",
      name: "Test Track",
      duration: 5000,
      speed: 1.5,
      volume: 80,
    });
  });
});

describe("calculateTrackLoopBoundaries", () => {
  it("returns single boundary when track equals master duration", () => {
    const boundaries = calculateTrackLoopBoundaries(10000, 10000);
    expect(boundaries).toEqual([0]);
  });

  it("returns two boundaries when track is half master duration", () => {
    const boundaries = calculateTrackLoopBoundaries(5000, 10000);
    expect(boundaries).toEqual([0, 5000]);
  });

  it("returns correct boundaries for 4s track in 10s loop", () => {
    // Track loops at 0ms, 4000ms, 8000ms (partial to 10000ms)
    const boundaries = calculateTrackLoopBoundaries(4000, 10000);
    expect(boundaries).toEqual([0, 4000, 8000]);
  });

  it("returns correct boundaries for 3s track in 10s loop", () => {
    // Track loops at 0ms, 3000ms, 6000ms, 9000ms (partial to 10000ms)
    const boundaries = calculateTrackLoopBoundaries(3000, 10000);
    expect(boundaries).toEqual([0, 3000, 6000, 9000]);
  });

  it("returns single boundary when track is longer than master", () => {
    // Track plays once (partially) so only starts at 0
    const boundaries = calculateTrackLoopBoundaries(15000, 10000);
    expect(boundaries).toEqual([0]);
  });

  it("handles very short tracks with many loops", () => {
    // 1s track in 5s loop = 5 boundaries (0, 1000, 2000, 3000, 4000)
    const boundaries = calculateTrackLoopBoundaries(1000, 5000);
    expect(boundaries).toEqual([0, 1000, 2000, 3000, 4000]);
  });

  it("returns empty array for zero track duration", () => {
    expect(calculateTrackLoopBoundaries(0, 10000)).toEqual([]);
  });

  it("returns empty array for zero master duration", () => {
    expect(calculateTrackLoopBoundaries(5000, 0)).toEqual([]);
  });

  it("returns empty array for negative durations", () => {
    expect(calculateTrackLoopBoundaries(-5000, 10000)).toEqual([]);
    expect(calculateTrackLoopBoundaries(5000, -10000)).toEqual([]);
  });
});

describe("sync speed calculations", () => {
  describe("calculateSyncSpeed", () => {
    it("returns ~1.0 for equal track and master durations at 1x", () => {
      const speed = calculateSyncSpeed(10000, 10000, 1);
      expect(speed).toBeCloseTo(1.0, 2);
    });

    it("returns ~0.5 for 5s track in 10s master at 1x", () => {
      const speed = calculateSyncSpeed(5000, 10000, 1);
      // 0.5 rounded to nearest 1/41 step
      expect(speed).toBe(Math.round(0.5 * 41) / 41);
    });

    it("returns ~2.0 for 20s track in 10s master at 1x", () => {
      const speed = calculateSyncSpeed(20000, 10000, 1);
      expect(speed).toBe(Math.round(2.0 * 41) / 41);
    });

    it("returns ~2.0 for equal durations at 2x multiplier", () => {
      const speed = calculateSyncSpeed(10000, 10000, 2);
      expect(speed).toBe(Math.round(2.0 * 41) / 41);
    });

    it("returns ~0.5 for equal durations at 0.5x multiplier", () => {
      const speed = calculateSyncSpeed(10000, 10000, 0.5);
      expect(speed).toBe(Math.round(0.5 * 41) / 41);
    });

    it("rounds result to nearest 1/41 step", () => {
      // 7s track, 10s master, 1x => 0.7 => rounded to nearest 1/41
      const speed = calculateSyncSpeed(7000, 10000, 1);
      const rounded = Math.round(0.7 * 41) / 41;
      expect(speed).toBe(rounded);
    });

    it("returns 1.0 when masterLoopDuration is 0", () => {
      expect(calculateSyncSpeed(10000, 0, 1)).toBe(1.0);
    });

    it("returns 1.0 when masterLoopDuration is negative", () => {
      expect(calculateSyncSpeed(10000, -5000, 1)).toBe(1.0);
    });
  });

  describe("getValidSyncMultipliers", () => {
    it("returns only multipliers whose speed falls within MIN_SPEED-MAX_SPEED", () => {
      const results = getValidSyncMultipliers(10000, 10000);
      // base ratio = 1.0, so speeds are: 0.25, 0.333, 0.5, 1.0, 2.0, 3.0, 4.0
      // 3.0 and 4.0 exceed MAX_SPEED (2.5), so they're excluded
      // 0.25 and 0.333 are above MIN_SPEED (0.05), so they're included
      for (const r of results) {
        const speed = calculateSyncSpeed(10000, 10000, r.value);
        expect(speed).toBeGreaterThanOrEqual(MIN_SPEED);
        expect(speed).toBeLessThanOrEqual(MAX_SPEED);
      }
    });

    it("returns all 7 multipliers when all produce valid speeds", () => {
      // Track of 10s, master of 10s: base ratio = 1.0
      // Speeds: 0.25, 0.33, 0.5, 1.0, 2.0, 3.0, 4.0
      // Only 1/4x (0.25), 1/3x (0.33), 1/2x (0.5), 1x (1.0), 2x (2.0) are valid
      // 3x (3.0) and 4x (4.0) exceed 2.5
      // So not all 7 are valid here. Use a ratio where all 7 work:
      // base ratio = 0.6 (e.g., track=6000, master=10000)
      // speeds after rounding: 0.146, 0.195, 0.293, 0.610, 1.195, 1.805, 2.390
      const results = getValidSyncMultipliers(6000, 10000);
      expect(results).toHaveLength(7);
    });

    it("excludes multipliers that produce speeds above MAX_SPEED", () => {
      // Track 20s, master 10s: base ratio = 2.0
      // 2x => 4.0 (exceeds 2.5), 3x => 6.0, 4x => 8.0
      const results = getValidSyncMultipliers(20000, 10000);
      const values = results.map((r) => r.value);
      expect(values).not.toContain(2);
      expect(values).not.toContain(3);
      expect(values).not.toContain(4);
    });

    it("excludes multipliers that produce speeds below MIN_SPEED", () => {
      // Track 0.5s (500ms), master 10s: base ratio = 0.05
      // 1/4x => 0.0125 (below MIN_SPEED), 1/3x => 0.0167
      const results = getValidSyncMultipliers(500, 10000);
      const values = results.map((r) => r.value);
      expect(values).not.toContain(1 / 4);
      expect(values).not.toContain(1 / 3);
    });

    it("returns empty array when no multipliers are valid", () => {
      // Track of 0.1s (100ms), master 10s: base ratio = 0.01
      // All multiplied values below 0.05 except maybe 4x => 0.04, still below
      const results = getValidSyncMultipliers(100, 10000);
      expect(results).toHaveLength(0);
    });

    it("returns objects with label and value properties", () => {
      const results = getValidSyncMultipliers(10000, 10000);
      for (const r of results) {
        expect(r).toHaveProperty("label");
        expect(r).toHaveProperty("value");
        expect(typeof r.label).toBe("string");
        expect(typeof r.value).toBe("number");
      }
    });
  });
});
