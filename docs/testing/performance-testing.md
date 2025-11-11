# Performance Testing Guide

## Overview

This guide covers performance testing strategies for the Looper application to ensure smooth user experience across all platforms (web, iOS, Android).

## Performance Targets

### Loading Performance

- **Cold start time**: < 3 seconds
- **Hot start time**: < 1 second
- **Screen transitions**: < 300ms
- **Audio file loading**: < 2 seconds for files up to 100MB

### Runtime Performance

- **Interaction latency**: < 100ms for all user interactions
- **Scrolling**: 60 fps (16.67ms per frame)
- **Audio playback**: < 50ms latency
- **Memory usage**: < 150MB for typical session (5-10 tracks)

### Scalability

- **Maximum tracks**: Support 20+ simultaneous tracks
- **Large files**: Handle audio files up to 500MB
- **Long sessions**: Stable performance for 1+ hour sessions
- **Mixing**: Complete mixing 10 tracks in < 60 seconds

## Performance Testing Tools

### React Native Performance Monitor

Built-in performance monitor accessible via Dev Menu:

```javascript
// Enable performance monitor in development
// Shake device or Cmd+D (iOS) / Cmd+M (Android) → "Show Perf Monitor"
```

Metrics shown:

- **RAM**: Memory usage
- **JSC/Hermes**: JavaScript heap size
- **Views**: Number of views in hierarchy
- **UI/JS**: Frame rate for UI and JavaScript threads

### React DevTools Profiler

Profile component render performance:

```bash
# Install React DevTools
npm install -g react-devtools

# Start React DevTools
react-devtools
```

Usage:

1. Click "Profiler" tab
2. Click "Record" button
3. Perform actions in app
4. Stop recording
5. Analyze flame graph and ranked chart

### Flipper

Comprehensive debugging and profiling tool:

```bash
# Install Flipper
# Download from https://fbflipper.com/

# Install Flipper plugins
# - Layout Inspector
# - Network Inspector
# - React DevTools
# - Performance
```

Key features:

- Layout inspection
- Network traffic monitoring
- Memory profiling
- Database inspection
- Log viewing

### Chrome DevTools (Web)

For web performance profiling:

1. Open Chrome DevTools (F12)
2. Go to "Performance" tab
3. Click "Record" button
4. Perform actions
5. Stop recording
6. Analyze timeline, main thread activity, and bottlenecks

### Platform-Specific Tools

#### iOS - Instruments

```bash
# Launch from Xcode
# Product → Profile (Cmd+I)
```

Key instruments:

- **Time Profiler**: CPU usage and hot code paths
- **Allocations**: Memory allocation tracking
- **Leaks**: Memory leak detection
- **Energy Log**: Battery usage
- **System Trace**: System-wide performance

#### Android - Android Studio Profiler

```bash
# Open Android Studio
# View → Tool Windows → Profiler
```

Features:

- CPU profiler (method tracing, sampling)
- Memory profiler (heap dumps, allocation tracking)
- Network profiler
- Energy profiler

## Performance Metrics Collection

### Manual Performance Testing

Create a performance test checklist:

```typescript
// Migration/docs/testing/performance-checklist.md
```

#### Cold Start Test

1. Force quit app
2. Clear app from memory
3. Start timer
4. Launch app
5. Record time to interactive (first paint + ready for input)
6. **Target**: < 3 seconds

#### Interaction Latency Test

Test each interaction:

- Button press → visual feedback: < 100ms
- Slider drag → value update: < 100ms
- Track play → audio start: < 200ms
- Track pause → audio stop: < 100ms

#### Memory Leak Test

1. Start app with no tracks
2. Record baseline memory
3. Import 10 tracks
4. Play all tracks
5. Delete all tracks
6. Record memory usage
7. **Expected**: Return to baseline ± 10MB

#### Scrolling Performance Test

1. Import 20 tracks
2. Enable "Show Perf Monitor"
3. Scroll track list rapidly
4. Record FPS
5. **Target**: 60 FPS consistently

### Automated Performance Testing

#### Performance Test Suite

```typescript
// Migration/__tests__/performance/app.perf.test.ts

import { measurePerformance } from '../utils/performanceUtils';

describe('Performance Tests', () => {
  it('should load track list in < 500ms', async () => {
    const startTime = performance.now();

    // Render track list with 20 tracks
    const { getByTestId } = render(<TrackList tracks={mockTracks} />);

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(500);
  });

  it('should handle slider updates without lag', async () => {
    const updateTimes: number[] = [];

    const onVolumeChange = jest.fn((volume) => {
      updateTimes.push(performance.now());
    });

    const { getByTestId } = render(
      <VolumeSlider value={75} onValueChange={onVolumeChange} />
    );

    const slider = getByTestId('slider');

    // Simulate rapid slider updates
    for (let i = 0; i < 10; i++) {
      fireEvent(slider, 'valueChange', i * 10);
    }

    // Calculate average time between updates
    const avgInterval = calculateAverageInterval(updateTimes);

    expect(avgInterval).toBeLessThan(50); // < 50ms between updates
  });
});
```

## Performance Optimization Strategies

### Component Optimization

#### 1. Memoization

Use React.memo for expensive components:

```typescript
import React, { memo } from "react";

export const TrackListItem = memo<TrackListItemProps>(
  ({ track, onPlay }) => {
    // Component implementation
  },
  (prevProps, nextProps) => {
    // Custom comparison function
    return (
      prevProps.track.id === nextProps.track.id &&
      prevProps.track.isPlaying === nextProps.track.isPlaying
    );
  },
);
```

#### 2. useMemo for Expensive Calculations

```typescript
import { useMemo } from "react";

const expensiveValue = useMemo(() => {
  return calculateComplexValue(data);
}, [data]); // Only recalculate when data changes
```

#### 3. useCallback for Event Handlers

```typescript
import { useCallback } from "react";

const handlePlay = useCallback(
  (trackId: string) => {
    audioService.playTrack(trackId);
  },
  [audioService],
); // Stable reference
```

### List Optimization

#### FlatList Performance

```typescript
<FlatList
  data={tracks}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}

  // Performance optimizations
  windowSize={10}                    // Render 10 screens worth of items
  maxToRenderPerBatch={5}            // Render 5 items per batch
  updateCellsBatchingPeriod={50}     // Batch updates every 50ms
  removeClippedSubviews={true}       // Remove off-screen views (Android)
  initialNumToRender={10}            // Render 10 items initially

  // Item height optimization (if items are same height)
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### State Management Optimization

#### Zustand Selectors

Use granular selectors to prevent unnecessary re-renders:

```typescript
// ❌ Bad: Re-renders on any state change
const state = useTrackStore();

// ✅ Good: Only re-renders when tracks array changes
const tracks = useTrackStore((state) => state.tracks);

// ✅ Better: Only re-renders when specific track changes
const track = useTrackStore((state) =>
  state.tracks.find((t) => t.id === trackId),
);
```

#### Shallow Comparison

```typescript
import { shallow } from "zustand/shallow";

// Only re-render if trackIds array content changes
const trackIds = useTrackStore(
  (state) => state.tracks.map((t) => t.id),
  shallow,
);
```

### Audio Service Optimization

#### Audio Loading

```typescript
// Lazy load audio files
const loadAudioLazy = async (uri: string) => {
  // Don't load until user plays
  return () => audioService.loadTrack(uri);
};

// Preload next track
const preloadNextTrack = async (currentIndex: number) => {
  if (currentIndex + 1 < tracks.length) {
    const nextTrack = tracks[currentIndex + 1];
    await audioService.loadTrack(nextTrack.id, nextTrack.uri);
  }
};
```

#### Memory Management

```typescript
// Unload tracks not in use
const unloadInactiveTracks = async () => {
  const playingTrackIds = new Set(
    tracks.filter((t) => t.isPlaying).map((t) => t.id),
  );

  for (const track of tracks) {
    if (!playingTrackIds.has(track.id)) {
      await audioService.unloadTrack(track.id);
    }
  }
};
```

### FFmpeg Optimization

#### Web Worker for Mixing

```typescript
// Offload FFmpeg processing to Web Worker
const mixInWorker = async (tracks: Track[]) => {
  const worker = new Worker("./ffmpeg.worker.js");

  return new Promise((resolve, reject) => {
    worker.onmessage = (e) => {
      if (e.data.type === "complete") {
        resolve(e.data.result);
      }
    };

    worker.onerror = (error) => {
      reject(error);
    };

    worker.postMessage({ tracks });
  });
};
```

#### Progressive Loading

```typescript
// Load FFmpeg core progressively
const loadFFmpegCore = async (onProgress: (progress: number) => void) => {
  const coreURL = "https://unpkg.com/@ffmpeg/core@0.12.4/dist/ffmpeg-core.js";

  const response = await fetch(coreURL);
  const reader = response.body?.getReader();
  const contentLength = response.headers.get("Content-Length");

  let receivedLength = 0;
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader!.read();

    if (done) break;

    chunks.push(value);
    receivedLength += value.length;

    onProgress(receivedLength / parseInt(contentLength || "0"));
  }

  // Process chunks...
};
```

## Performance Monitoring in Production

### Error Boundaries with Performance Tracking

```typescript
class PerformanceErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log performance metrics at time of error
    console.error("Error occurred with performance state:", {
      error,
      errorInfo,
      memory: (performance as any).memory?.usedJSHeapSize,
      timing: performance.timing,
    });
  }
}
```

### Custom Performance Marks

```typescript
// Mark important operations
performance.mark("track-load-start");
await audioService.loadTrack(trackId, uri);
performance.mark("track-load-end");

// Measure duration
performance.measure("track-load", "track-load-start", "track-load-end");

// Get measurement
const measure = performance.getEntriesByName("track-load")[0];
console.log(`Track loaded in ${measure.duration}ms`);
```

## Performance Regression Testing

### Lighthouse CI

For web builds:

```yaml
# .github/workflows/lighthouse-ci.yml
name: Lighthouse CI

on: [push]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:8081
          uploadArtifacts: true
```

### Benchmarking Script

```typescript
// scripts/benchmark.ts

import { performance } from "perf_hooks";

interface BenchmarkResult {
  name: string;
  duration: number;
  memory: number;
}

async function benchmark(
  name: string,
  fn: () => Promise<void>,
): Promise<BenchmarkResult> {
  const startMemory = process.memoryUsage().heapUsed;
  const startTime = performance.now();

  await fn();

  const endTime = performance.now();
  const endMemory = process.memoryUsage().heapUsed;

  return {
    name,
    duration: endTime - startTime,
    memory: endMemory - startMemory,
  };
}

// Usage
const result = await benchmark("Load 10 tracks", async () => {
  for (let i = 0; i < 10; i++) {
    await loadTrack(i);
  }
});

console.log(`${result.name}: ${result.duration}ms, ${result.memory} bytes`);
```

## Common Performance Issues

### Issue: Slow Initial Render

**Symptoms**: App takes > 3s to show first screen

**Solutions**:

- Lazy load heavy components
- Reduce initial bundle size
- Use React.lazy() for route-based code splitting
- Optimize image assets

### Issue: Janky Scrolling

**Symptoms**: FPS drops below 60 during scroll

**Solutions**:

- Use FlatList instead of ScrollView for long lists
- Enable removeClippedSubviews
- Optimize item rendering (memo, pure components)
- Reduce overdraw (minimize view nesting)

### Issue: Memory Leaks

**Symptoms**: Memory usage increases over time, never decreases

**Solutions**:

- Unsubscribe from event listeners
- Clean up timers and intervals
- Unload unused audio resources
- Clear references to large objects

### Issue: Slow Audio Playback

**Symptoms**: Delay between play button press and audio start

**Solutions**:

- Preload audio files
- Use native audio APIs (expo-av) instead of web APIs
- Reduce audio file size (compression)
- Cache decoded audio data

## Resources

- [React Native Performance](https://reactnative.dev/docs/performance)
- [Flipper](https://fbflipper.com/)
- [React DevTools Profiler](https://react.dev/reference/react/Profiler)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
