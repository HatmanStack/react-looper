/**
 * Component Performance Tests
 *
 * Tests component rendering performance and interaction latency
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TrackList } from "../../src/components/TrackList/TrackList";
import { TrackListItem } from "../../src/components/TrackListItem/TrackListItem";
import { VolumeSlider } from "../../src/components/VolumeSlider/VolumeSlider";
import { SpeedSlider } from "../../src/components/SpeedSlider/SpeedSlider";
import type { Track } from "../../src/types";
import {
  measureDuration,
  assertPerformance,
  calculateAverageInterval,
  runBenchmark,
} from "../../src/test-utils/performanceUtils";

// Mock track data generator
function generateMockTrack(id: number): Track {
  return {
    id: `track-${id}`,
    name: `Track ${id}`,
    uri: `file://track${id}.mp3`,
    duration: 30000 + Math.random() * 60000,
    speed: 1.0,
    volume: 75,
    isPlaying: false,
    createdAt: Date.now() - id * 1000,
  };
}

function generateMockTracks(count: number): Track[] {
  return Array.from({ length: count }, (_, i) => generateMockTrack(i));
}

describe("Performance - TrackList Rendering", () => {
  it("should render 10 tracks within reasonable time", async () => {
    const tracks = generateMockTracks(10);

    const { duration } = await measureDuration(async () => {
      render(<TrackList tracks={tracks} />);
    });

    // Note: Jest runs in Node.js, not real RN environment
    // This is a baseline benchmark, not a strict performance test
    // Real performance should be tested with E2E tests or React DevTools Profiler
    console.log(`Rendered 10 tracks in ${duration}ms (Jest environment)`);

    // Use a lenient threshold for Jest environment (2000ms instead of 500ms)
    const benchmark = assertPerformance(
      "Render 10 tracks (Jest)",
      duration,
      2000,
    );
    expect(benchmark.passed).toBe(true);
  });

  it("should render 20 tracks within reasonable time", async () => {
    const tracks = generateMockTracks(20);

    const { duration } = await measureDuration(async () => {
      render(<TrackList tracks={tracks} />);
    });

    console.log(`Rendered 20 tracks in ${duration}ms (Jest environment)`);

    // Lenient threshold for Jest environment
    const benchmark = assertPerformance(
      "Render 20 tracks (Jest)",
      duration,
      3000,
    );
    expect(benchmark.passed).toBe(true);
  });

  it("should update single track without re-rendering all tracks", async () => {
    const tracks = generateMockTracks(10);
    const { rerender } = render(<TrackList tracks={tracks} />);

    // Update only one track
    const updatedTracks = tracks.map((track, index) =>
      index === 0 ? { ...track, isPlaying: true } : track,
    );

    const { duration } = await measureDuration(async () => {
      rerender(<TrackList tracks={updatedTracks} />);
    });

    // Re-render should be fast since only one track changed
    const benchmark = assertPerformance("Update single track", duration, 100);
    expect(benchmark.passed).toBe(true);
  });
});

describe("Performance - TrackListItem Rendering", () => {
  const mockTrack = generateMockTrack(1);

  it("should render single track item in < 50ms", async () => {
    const { duration } = await measureDuration(async () => {
      render(<TrackListItem track={mockTrack} />);
    });

    const benchmark = assertPerformance("Render track item", duration, 50);
    expect(benchmark.passed).toBe(true);
  });

  it("should handle rapid play/pause updates", async () => {
    const mockOnPlay = jest.fn();
    const { getByLabelText } = render(
      <TrackListItem track={mockTrack} onPlay={mockOnPlay} />,
    );

    const playButton = getByLabelText(`Play ${mockTrack.name}`);
    const updateTimes: number[] = [];

    // Simulate 10 rapid play button presses
    for (let i = 0; i < 10; i++) {
      const startTime = performance.now();
      fireEvent.press(playButton);
      updateTimes.push(performance.now() - startTime);
    }

    const avgUpdateTime =
      updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;

    const benchmark = assertPerformance(
      "Play button update",
      avgUpdateTime,
      50,
    );
    expect(benchmark.passed).toBe(true);
  });
});

describe("Performance - Slider Interaction", () => {
  it("should handle volume slider updates in < 50ms", async () => {
    const updateTimes: number[] = [];
    const onVolumeChange = jest.fn(() => {
      updateTimes.push(performance.now());
    });

    const { getByTestId } = render(
      <VolumeSlider value={75} onValueChange={onVolumeChange} />,
    );

    const slider = getByTestId("slider");

    // Simulate 20 rapid slider updates
    for (let i = 0; i < 20; i++) {
      fireEvent(slider, "valueChange", i * 5);
    }

    // Calculate average interval between updates
    const avgInterval = calculateAverageInterval(updateTimes);

    const benchmark = assertPerformance(
      "Volume slider update interval",
      avgInterval,
      50,
    );
    expect(benchmark.passed).toBe(true);
  });

  it("should handle speed slider updates in < 50ms", async () => {
    const updateTimes: number[] = [];
    const onSpeedChange = jest.fn(() => {
      updateTimes.push(performance.now());
    });

    const { getByTestId } = render(
      <SpeedSlider value={1.0} onValueChange={onSpeedChange} />,
    );

    const slider = getByTestId("slider");

    // Simulate 20 rapid slider updates
    for (let i = 0; i < 20; i++) {
      const sliderValue = 3 + i * 5; // 3-102 range
      fireEvent(slider, "valueChange", sliderValue);
    }

    const avgInterval = calculateAverageInterval(updateTimes);

    const benchmark = assertPerformance(
      "Speed slider update interval",
      avgInterval,
      50,
    );
    expect(benchmark.passed).toBe(true);
  });
});

describe("Performance - Component Mounting", () => {
  it("should mount TrackListItem quickly", async () => {
    const track = generateMockTrack(1);

    const stats = await runBenchmark(
      "Mount TrackListItem",
      async () => {
        const { unmount } = render(<TrackListItem track={track} />);
        unmount();
      },
      20,
    );

    console.log(`TrackListItem mount stats:`, stats);

    const benchmark = assertPerformance(
      "TrackListItem mount (avg)",
      stats.avg,
      50,
    );
    expect(benchmark.passed).toBe(true);

    const p95Benchmark = assertPerformance(
      "TrackListItem mount (p95)",
      stats.p95,
      100,
    );
    expect(p95Benchmark.passed).toBe(true);
  });

  it("should mount VolumeSlider quickly", async () => {
    const stats = await runBenchmark(
      "Mount VolumeSlider",
      async () => {
        const { unmount } = render(
          <VolumeSlider value={75} onValueChange={jest.fn()} />,
        );
        unmount();
      },
      20,
    );

    console.log(`VolumeSlider mount stats:`, stats);

    const benchmark = assertPerformance(
      "VolumeSlider mount (avg)",
      stats.avg,
      30,
    );
    expect(benchmark.passed).toBe(true);
  });
});

describe("Performance - List Scrolling Simulation", () => {
  it("should handle rapid track list updates", async () => {
    const initialTracks = generateMockTracks(20);
    const { rerender } = render(<TrackList tracks={initialTracks} />);

    const updateDurations: number[] = [];

    // Simulate 10 rapid updates (like scrolling)
    for (let i = 0; i < 10; i++) {
      const updatedTracks = initialTracks.map((track) => ({
        ...track,
        volume: Math.random() * 100,
      }));

      const { duration } = await measureDuration(async () => {
        rerender(<TrackList tracks={updatedTracks} />);
      });

      updateDurations.push(duration);
    }

    const avgDuration =
      updateDurations.reduce((a, b) => a + b, 0) / updateDurations.length;

    const benchmark = assertPerformance(
      "List update (scrolling simulation)",
      avgDuration,
      100,
    );
    expect(benchmark.passed).toBe(true);
  });
});

describe("Performance - Stress Tests", () => {
  it("should handle 50 tracks without significant performance degradation", async () => {
    const tracks = generateMockTracks(50);

    const { duration } = await measureDuration(async () => {
      render(<TrackList tracks={tracks} />);
    });

    // Should still render in reasonable time even with 50 tracks
    const benchmark = assertPerformance("Render 50 tracks", duration, 2000);
    expect(benchmark.passed).toBe(true);
  });

  it("should handle 100 slider updates efficiently", async () => {
    const updateTimes: number[] = [];
    const onVolumeChange = jest.fn(() => {
      updateTimes.push(performance.now());
    });

    const { getByTestId } = render(
      <VolumeSlider value={75} onValueChange={onVolumeChange} />,
    );

    const slider = getByTestId("slider");

    const { duration } = await measureDuration(async () => {
      for (let i = 0; i < 100; i++) {
        fireEvent(slider, "valueChange", i % 100);
      }
    });

    const benchmark = assertPerformance("100 slider updates", duration, 500);
    expect(benchmark.passed).toBe(true);
  });
});
