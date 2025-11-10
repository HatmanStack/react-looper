/**
 * Store Performance Tests
 *
 * Tests Zustand store performance for state updates and subscriptions
 */

import { useTrackStore } from '../../src/store/useTrackStore';
import { usePlaybackStore } from '../../src/store/usePlaybackStore';
import { useUIStore } from '../../src/store/useUIStore';
import type { Track } from '../../src/types';
import {
  measureDuration,
  assertPerformance,
  runBenchmark,
  calculateAverage,
} from '../../src/test-utils/performanceUtils';

// Mock track generator
function generateMockTrack(id: number): Track {
  return {
    id: `track-${id}`,
    name: `Track ${id}`,
    uri: `file://track${id}.mp3`,
    duration: 30000,
    speed: 1.0,
    volume: 75,
    isPlaying: false,
    createdAt: Date.now() - id * 1000,
  };
}

describe('Performance - TrackStore', () => {
  beforeEach(() => {
    useTrackStore.getState().clearTracks();
  });

  it('should add track in < 10ms', async () => {
    const track = generateMockTrack(1);

    const { duration } = await measureDuration(async () => {
      useTrackStore.getState().addTrack(track);
    });

    const benchmark = assertPerformance('Add track', duration, 10);
    expect(benchmark.passed).toBe(true);
  });

  it('should add 100 tracks in < 500ms', async () => {
    const tracks = Array.from({ length: 100 }, (_, i) => generateMockTrack(i));

    const { duration } = await measureDuration(async () => {
      tracks.forEach((track) => {
        useTrackStore.getState().addTrack(track);
      });
    });

    const benchmark = assertPerformance('Add 100 tracks', duration, 500);
    expect(benchmark.passed).toBe(true);
  });

  it('should update track quickly', async () => {
    const track = generateMockTrack(1);
    useTrackStore.getState().addTrack(track);

    const { duration } = await measureDuration(async () => {
      useTrackStore.getState().updateTrack(track.id, { volume: 50 });
    });

    const benchmark = assertPerformance('Update track', duration, 10);
    expect(benchmark.passed).toBe(true);
  });

  it('should delete track quickly', async () => {
    const track = generateMockTrack(1);
    useTrackStore.getState().addTrack(track);

    const { duration } = await measureDuration(async () => {
      useTrackStore.getState().removeTrack(track.id);
    });

    const benchmark = assertPerformance('Delete track', duration, 10);
    expect(benchmark.passed).toBe(true);
  });

  it('should get track by ID quickly from large list', async () => {
    // Add 1000 tracks
    const tracks = Array.from({ length: 1000 }, (_, i) => generateMockTrack(i));
    tracks.forEach((track) => useTrackStore.getState().addTrack(track));

    const targetTrackId = 'track-500';

    const { duration } = await measureDuration(async () => {
      useTrackStore.getState().getTrack(targetTrackId);
    });

    const benchmark = assertPerformance('Get track from 1000 tracks', duration, 5);
    expect(benchmark.passed).toBe(true);
  });

  it('should handle rapid updates efficiently', async () => {
    const track = generateMockTrack(1);
    useTrackStore.getState().addTrack(track);

    const updateDurations: number[] = [];

    for (let i = 0; i < 100; i++) {
      const { duration } = await measureDuration(async () => {
        useTrackStore.getState().updateTrack(track.id, { volume: i });
      });
      updateDurations.push(duration);
    }

    const avgDuration = calculateAverage(updateDurations);

    const benchmark = assertPerformance('Average update (100 updates)', avgDuration, 10);
    expect(benchmark.passed).toBe(true);
  });
});

describe('Performance - PlaybackStore', () => {
  beforeEach(() => {
    usePlaybackStore.getState().reset();
  });

  it('should add track state quickly', async () => {
    const { duration } = await measureDuration(async () => {
      usePlaybackStore.getState().addTrack('track-1', {
        speed: 1.0,
        volume: 75,
        isLooping: true,
        isPlaying: false,
      });
    });

    const benchmark = assertPerformance('Add track state', duration, 10);
    expect(benchmark.passed).toBe(true);
  });

  it('should update track state quickly', async () => {
    usePlaybackStore.getState().addTrack('track-1', {
      speed: 1.0,
      volume: 75,
      isLooping: true,
      isPlaying: false,
    });

    const { duration } = await measureDuration(async () => {
      usePlaybackStore.getState().updateTrackState('track-1', { volume: 50 });
    });

    const benchmark = assertPerformance('Update track state', duration, 10);
    expect(benchmark.passed).toBe(true);
  });

  it('should handle 100 simultaneous tracks efficiently', async () => {
    const { duration } = await measureDuration(async () => {
      for (let i = 0; i < 100; i++) {
        usePlaybackStore.getState().addTrack(`track-${i}`, {
          speed: 1.0,
          volume: 75,
          isLooping: true,
          isPlaying: false,
        });
      }
    });

    const benchmark = assertPerformance('Add 100 track states', duration, 500);
    expect(benchmark.passed).toBe(true);
  });

  it('should start playing track quickly', async () => {
    usePlaybackStore.getState().addTrack('track-1', {
      speed: 1.0,
      volume: 75,
      isLooping: true,
      isPlaying: false,
    });

    const { duration } = await measureDuration(async () => {
      usePlaybackStore.getState().setPlaying('track-1', true);
    });

    const benchmark = assertPerformance('Set track playing', duration, 10);
    expect(benchmark.passed).toBe(true);
  });

  it('should pause all tracks quickly', async () => {
    // Add 20 playing tracks
    for (let i = 0; i < 20; i++) {
      usePlaybackStore.getState().addTrack(`track-${i}`, {
        speed: 1.0,
        volume: 75,
        isLooping: true,
        isPlaying: true,
      });
    }

    const { duration } = await measureDuration(async () => {
      usePlaybackStore.getState().pauseAll();
    });

    const benchmark = assertPerformance('Pause all 20 tracks', duration, 50);
    expect(benchmark.passed).toBe(true);
  });
});

describe('Performance - UIStore', () => {
  beforeEach(() => {
    useUIStore.getState().reset();
  });

  it('should toggle modal visibility quickly', async () => {
    const { duration } = await measureDuration(async () => {
      useUIStore.getState().showSaveModal();
    });

    const benchmark = assertPerformance('Show modal', duration, 5);
    expect(benchmark.passed).toBe(true);
  });

  it('should update mixing progress quickly', async () => {
    const { duration } = await measureDuration(async () => {
      useUIStore.getState().setMixingProgress(0.5);
    });

    const benchmark = assertPerformance('Update mixing progress', duration, 5);
    expect(benchmark.passed).toBe(true);
  });

  it('should handle rapid progress updates', async () => {
    const updateDurations: number[] = [];

    for (let i = 0; i <= 100; i++) {
      const { duration } = await measureDuration(async () => {
        useUIStore.getState().setMixingProgress(i / 100);
      });
      updateDurations.push(duration);
    }

    const avgDuration = calculateAverage(updateDurations);

    const benchmark = assertPerformance('Average progress update (100 updates)', avgDuration, 5);
    expect(benchmark.passed).toBe(true);
  });
});

describe('Performance - Store Subscriptions', () => {
  beforeEach(() => {
    useTrackStore.getState().clearTracks();
  });

  it('should notify subscribers quickly', async () => {
    let notificationCount = 0;
    const notificationTimes: number[] = [];

    const unsubscribe = useTrackStore.subscribe((state) => {
      notificationCount++;
      notificationTimes.push(performance.now());
    });

    const track = generateMockTrack(1);

    const { duration } = await measureDuration(async () => {
      useTrackStore.getState().addTrack(track);
    });

    // Wait for notification
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(notificationCount).toBe(1);

    const benchmark = assertPerformance('Notify subscribers', duration, 10);
    expect(benchmark.passed).toBe(true);

    unsubscribe();
  });

  it('should handle multiple subscribers efficiently', async () => {
    const subscriberCount = 10;
    const unsubscribers: (() => void)[] = [];

    // Add 10 subscribers
    for (let i = 0; i < subscriberCount; i++) {
      const unsubscribe = useTrackStore.subscribe(() => {
        // Subscriber callback
      });
      unsubscribers.push(unsubscribe);
    }

    const track = generateMockTrack(1);

    const { duration } = await measureDuration(async () => {
      useTrackStore.getState().addTrack(track);
    });

    const benchmark = assertPerformance('Notify 10 subscribers', duration, 20);
    expect(benchmark.passed).toBe(true);

    // Clean up
    unsubscribers.forEach((unsub) => unsub());
  });
});

describe('Performance - Store Selectors', () => {
  beforeEach(() => {
    useTrackStore.getState().clearTracks();
  });

  it('should select tracks quickly from large store', async () => {
    // Add 1000 tracks
    const tracks = Array.from({ length: 1000 }, (_, i) => generateMockTrack(i));
    tracks.forEach((track) => useTrackStore.getState().addTrack(track));

    const { duration } = await measureDuration(async () => {
      const allTracks = useTrackStore.getState().tracks;
      expect(allTracks.length).toBe(1000);
    });

    const benchmark = assertPerformance('Select 1000 tracks', duration, 5);
    expect(benchmark.passed).toBe(true);
  });

  it('should filter playing tracks quickly', async () => {
    // Add 100 tracks, 10 playing
    const tracks = Array.from({ length: 100 }, (_, i) => ({
      ...generateMockTrack(i),
      isPlaying: i % 10 === 0,
    }));
    tracks.forEach((track) => useTrackStore.getState().addTrack(track));

    const { duration } = await measureDuration(async () => {
      const playingTracks = useTrackStore.getState().tracks.filter((t) => t.isPlaying);
      expect(playingTracks.length).toBe(10);
    });

    const benchmark = assertPerformance('Filter playing tracks', duration, 10);
    expect(benchmark.passed).toBe(true);
  });
});

describe('Performance - Stress Tests', () => {
  it('should benchmark rapid track additions', async () => {
    const stats = await runBenchmark(
      'Add track',
      async () => {
        const track = generateMockTrack(Math.random() * 10000);
        useTrackStore.getState().addTrack(track);
      },
      100
    );

    console.log('Rapid track additions stats:', stats);

    expect(stats.avg).toBeLessThan(10);
    expect(stats.p95).toBeLessThan(20);
  });

  it('should benchmark rapid state updates', async () => {
    const track = generateMockTrack(1);
    useTrackStore.getState().addTrack(track);

    const stats = await runBenchmark(
      'Update track',
      async () => {
        useTrackStore.getState().updateTrack(track.id, {
          volume: Math.random() * 100,
        });
      },
      100
    );

    console.log('Rapid state updates stats:', stats);

    expect(stats.avg).toBeLessThan(10);
    expect(stats.p95).toBeLessThan(20);
  });
});
