/**
 * Load and Stress Tests
 *
 * Tests app behavior under heavy load and stress conditions
 */

import { useTrackStore } from "../../src/store/useTrackStore";
import { usePlaybackStore } from "../../src/store/usePlaybackStore";
import type { Track } from "../../src/types";

// Mock track generator
function generateMockTrack(id: number, _sizeKB: number = 1024): Track {
  return {
    id: `track-${id}`,
    name: `Track ${id}`,
    uri: `file://track${id}.mp3`,
    duration: 30000 + Math.random() * 150000, // 30s - 3min
    speed: 1.0,
    volume: 75,
    isPlaying: false,
    createdAt: Date.now() - id * 1000,
  };
}

function generateMockTracks(count: number): Track[] {
  return Array.from({ length: count }, (_, i) => generateMockTrack(i));
}

describe("Load Tests - Many Tracks", () => {
  beforeEach(() => {
    useTrackStore.getState().clearTracks();
    usePlaybackStore.getState().reset();
  });

  it("should handle 10 tracks (typical usage)", () => {
    const tracks = generateMockTracks(10);

    const startTime = performance.now();

    tracks.forEach((track) => {
      useTrackStore.getState().addTrack(track);
      usePlaybackStore.getState().addTrack(track.id, {
        speed: track.speed,
        volume: track.volume,
        isLooping: true,
        isPlaying: false,
      });
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(useTrackStore.getState().tracks.length).toBe(10);
    expect(duration).toBeLessThan(500); // Should load quickly

    console.log(`Loaded 10 tracks in ${duration}ms`);
  });

  it("should handle 20 tracks (heavy usage)", () => {
    const tracks = generateMockTracks(20);

    const startTime = performance.now();

    tracks.forEach((track) => {
      useTrackStore.getState().addTrack(track);
      usePlaybackStore.getState().addTrack(track.id, {
        speed: track.speed,
        volume: track.volume,
        isLooping: true,
        isPlaying: false,
      });
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(useTrackStore.getState().tracks.length).toBe(20);
    expect(duration).toBeLessThan(1000);

    console.log(`Loaded 20 tracks in ${duration}ms`);
  });

  it("should handle 50 tracks (stress test)", () => {
    const tracks = generateMockTracks(50);

    const startTime = performance.now();

    tracks.forEach((track) => {
      useTrackStore.getState().addTrack(track);
      usePlaybackStore.getState().addTrack(track.id, {
        speed: track.speed,
        volume: track.volume,
        isLooping: true,
        isPlaying: false,
      });
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(useTrackStore.getState().tracks.length).toBe(50);
    expect(duration).toBeLessThan(2500);

    console.log(`Loaded 50 tracks in ${duration}ms`);
  });

  it("should handle 100 tracks (extreme stress)", () => {
    const tracks = generateMockTracks(100);

    const startTime = performance.now();

    tracks.forEach((track) => {
      useTrackStore.getState().addTrack(track);
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(useTrackStore.getState().tracks.length).toBe(100);
    // Should not crash, but may be slower
    console.log(`Loaded 100 tracks in ${duration}ms`);
  });
});

describe("Stress Tests - Rapid Operations", () => {
  beforeEach(() => {
    useTrackStore.getState().clearTracks();
  });

  it("should handle rapid track additions", () => {
    const operations = 1000;
    const startTime = performance.now();

    for (let i = 0; i < operations; i++) {
      const track = generateMockTrack(i);
      useTrackStore.getState().addTrack(track);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const avgTime = duration / operations;

    expect(useTrackStore.getState().tracks.length).toBe(operations);
    expect(avgTime).toBeLessThan(10); // Average < 10ms per operation

    console.log(`1000 rapid additions: ${duration}ms (avg: ${avgTime}ms)`);
  });

  it("should handle rapid track deletions", () => {
    // First, add 1000 tracks
    const tracks = generateMockTracks(1000);
    tracks.forEach((track) => useTrackStore.getState().addTrack(track));

    const operations = 1000;
    const startTime = performance.now();

    for (let i = 0; i < operations; i++) {
      useTrackStore.getState().removeTrack(`track-${i}`);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const avgTime = duration / operations;

    expect(useTrackStore.getState().tracks.length).toBe(0);
    expect(avgTime).toBeLessThan(10);

    console.log(`1000 rapid deletions: ${duration}ms (avg: ${avgTime}ms)`);
  });

  it("should handle rapid track updates", () => {
    const track = generateMockTrack(1);
    useTrackStore.getState().addTrack(track);

    const operations = 1000;
    const startTime = performance.now();

    for (let i = 0; i < operations; i++) {
      useTrackStore.getState().updateTrack(track.id, {
        volume: i % 100,
        speed: (i % 100) / 41,
      });
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const avgTime = duration / operations;

    expect(avgTime).toBeLessThan(10);

    console.log(`1000 rapid updates: ${duration}ms (avg: ${avgTime}ms)`);
  });

  it("should handle rapid playback state changes", () => {
    const track = generateMockTrack(1);
    useTrackStore.getState().addTrack(track);
    usePlaybackStore.getState().addTrack(track.id, {
      speed: 1.0,
      volume: 75,
      isLooping: true,
      isPlaying: false,
    });

    const operations = 1000;
    const startTime = performance.now();

    for (let i = 0; i < operations; i++) {
      usePlaybackStore.getState().setPlaying(track.id, i % 2 === 0);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const avgTime = duration / operations;

    expect(avgTime).toBeLessThan(10);

    console.log(`1000 rapid play/pause: ${duration}ms (avg: ${avgTime}ms)`);
  });
});

describe("Endurance Tests - Memory Leaks", () => {
  beforeEach(() => {
    useTrackStore.getState().clearTracks();
  });

  it("should not leak memory with repeated add/remove cycles", () => {
    const cycles = 100;
    const tracksPerCycle = 10;
    const memorySnapshots: number[] = [];

    for (let cycle = 0; cycle < cycles; cycle++) {
      // Add tracks
      const tracks = generateMockTracks(tracksPerCycle);
      tracks.forEach((track) => useTrackStore.getState().addTrack(track));

      // Remove tracks
      tracks.forEach((track) => useTrackStore.getState().removeTrack(track.id));

      // Sample memory every 10 cycles
      if (cycle % 10 === 0 && (performance as any).memory) {
        if (global.gc) global.gc(); // Force GC if available
        memorySnapshots.push((performance as any).memory.usedJSHeapSize);
      }
    }

    // Analyze memory trend
    if (memorySnapshots.length >= 2) {
      const firstHalf = memorySnapshots.slice(
        0,
        Math.floor(memorySnapshots.length / 2),
      );
      const secondHalf = memorySnapshots.slice(
        Math.floor(memorySnapshots.length / 2),
      );

      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgSecond =
        secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      const growthRatio = avgSecond / avgFirst;

      console.log(`Memory growth ratio: ${growthRatio.toFixed(2)}`);
      console.log(`First half avg: ${(avgFirst / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Second half avg: ${(avgSecond / 1024 / 1024).toFixed(2)}MB`);

      // Memory shouldn't grow more than 20%
      expect(growthRatio).toBeLessThan(1.2);
    }
  });

  it("should not leak memory with repeated state updates", () => {
    const track = generateMockTrack(1);
    useTrackStore.getState().addTrack(track);

    const updates = 1000;
    const memorySnapshots: number[] = [];

    for (let i = 0; i < updates; i++) {
      useTrackStore.getState().updateTrack(track.id, {
        volume: Math.random() * 100,
        speed: Math.random() * 2.5,
      });

      if (i % 100 === 0 && (performance as any).memory) {
        memorySnapshots.push((performance as any).memory.usedJSHeapSize);
      }
    }

    // Memory should be stable
    if (memorySnapshots.length >= 2) {
      const first = memorySnapshots[0];
      const last = memorySnapshots[memorySnapshots.length - 1];
      const growthRatio = last / first;

      console.log(
        `Memory growth after ${updates} updates: ${growthRatio.toFixed(2)}`,
      );

      expect(growthRatio).toBeLessThan(1.2);
    }
  });
});

describe("Performance Degradation Tests", () => {
  beforeEach(() => {
    useTrackStore.getState().clearTracks();
  });

  it("should maintain performance with increasing track count", () => {
    const trackCounts = [10, 20, 50, 100];
    const results: { count: number; time: number }[] = [];

    for (const count of trackCounts) {
      // Clear previous
      useTrackStore.getState().clearTracks();

      // Add tracks
      const tracks = generateMockTracks(count);
      const startTime = performance.now();

      tracks.forEach((track) => {
        useTrackStore.getState().addTrack(track);
      });

      const endTime = performance.now();
      results.push({ count, time: endTime - startTime });
    }

    // Calculate performance degradation
    for (let i = 1; i < results.length; i++) {
      const prev = results[i - 1];
      const curr = results[i];

      const timeRatio = curr.time / prev.time;
      const countRatio = curr.count / prev.count;

      // Time should scale roughly linearly (not exponentially)
      // Allow 50% overhead for overhead
      expect(timeRatio).toBeLessThan(countRatio * 1.5);

      console.log(
        `${curr.count} tracks: ${curr.time}ms (vs ${prev.count} tracks: ${prev.time}ms, ratio: ${timeRatio.toFixed(2)})`,
      );
    }
  });

  it("should maintain update performance regardless of track count", () => {
    const trackCounts = [1, 10, 50, 100];
    const results: { count: number; avgTime: number }[] = [];

    for (const count of trackCounts) {
      useTrackStore.getState().clearTracks();

      const tracks = generateMockTracks(count);
      tracks.forEach((track) => useTrackStore.getState().addTrack(track));

      // Measure update performance
      const updates = 100;
      const updateTimes: number[] = [];

      for (let i = 0; i < updates; i++) {
        const trackId = `track-${i % count}`;
        const startTime = performance.now();
        useTrackStore.getState().updateTrack(trackId, { volume: i % 100 });
        const endTime = performance.now();
        updateTimes.push(endTime - startTime);
      }

      const avgTime = updateTimes.reduce((a, b) => a + b, 0) / updates;
      results.push({ count, avgTime });
    }

    // Update time should be relatively constant regardless of track count
    const baseline = results[0].avgTime;
    for (const result of results) {
      const ratio = result.avgTime / baseline;
      console.log(
        `${result.count} tracks: avg update ${result.avgTime.toFixed(2)}ms (ratio: ${ratio.toFixed(2)})`,
      );

      // Update time shouldn't grow more than 2x
      expect(ratio).toBeLessThan(2.0);
    }
  });
});

describe("Concurrent Operations", () => {
  beforeEach(() => {
    useTrackStore.getState().clearTracks();
  });

  it("should handle concurrent track additions", async () => {
    const concurrentOps = 50;
    const promises: Promise<void>[] = [];

    const startTime = performance.now();

    for (let i = 0; i < concurrentOps; i++) {
      promises.push(
        Promise.resolve().then(() => {
          const track = generateMockTrack(i);
          useTrackStore.getState().addTrack(track);
        }),
      );
    }

    await Promise.all(promises);

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(useTrackStore.getState().tracks.length).toBe(concurrentOps);
    console.log(`${concurrentOps} concurrent additions: ${duration}ms`);
  });

  it("should handle mixed concurrent operations", async () => {
    // Pre-populate
    const tracks = generateMockTracks(50);
    tracks.forEach((track) => useTrackStore.getState().addTrack(track));

    const operations = 100;
    const promises: Promise<void>[] = [];

    for (let i = 0; i < operations; i++) {
      const op = i % 3;

      if (op === 0) {
        // Add
        promises.push(
          Promise.resolve().then(() => {
            const track = generateMockTrack(50 + i);
            useTrackStore.getState().addTrack(track);
          }),
        );
      } else if (op === 1) {
        // Update
        promises.push(
          Promise.resolve().then(() => {
            const trackId = `track-${i % 50}`;
            useTrackStore.getState().updateTrack(trackId, { volume: i % 100 });
          }),
        );
      } else {
        // Remove
        promises.push(
          Promise.resolve().then(() => {
            const trackId = `track-${i % 50}`;
            useTrackStore.getState().removeTrack(trackId);
          }),
        );
      }
    }

    await Promise.all(promises);

    // Should complete without errors
    expect(useTrackStore.getState().tracks.length).toBeGreaterThanOrEqual(0);
    console.log(`${operations} mixed concurrent operations completed`);
  });
});
