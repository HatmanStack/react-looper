# Load and Stress Testing Guide

## Overview

Load and stress testing ensures the Looper application can handle realistic and extreme usage scenarios without degrading performance or crashing.

## Testing Objectives

### Load Testing

**Purpose**: Verify app performs well under expected usage
**Focus**: Realistic scenarios with typical data volumes

### Stress Testing

**Purpose**: Find breaking points and failure modes
**Focus**: Push limits beyond normal usage

### Endurance Testing

**Purpose**: Verify stability over extended periods
**Focus**: Long-running sessions without memory leaks

## Load Testing Scenarios

### Scenario 1: Many Tracks

**Objective**: Test app with maximum expected track count

**Test Cases:**

#### 10 Tracks (Typical)

```
Setup:
- Import 10 audio files
- Mix of different lengths (30s - 2min)
- Total size: ~50MB

Actions:
- Play all tracks simultaneously
- Adjust volume/speed on all tracks
- Mix all tracks
- Verify playback smooth (60 FPS)
- Verify mixing completes in < 60s

Success Criteria:
✓ No frame drops
✓ All tracks play correctly
✓ Mixing completes successfully
✓ Memory usage < 150MB
```

#### 20 Tracks (Heavy)

```
Setup:
- Import 20 audio files
- Mix of different lengths
- Total size: ~100MB

Actions:
- Play all tracks simultaneously
- Scroll through track list
- Adjust controls
- Mix all tracks

Success Criteria:
✓ Frame rate > 50 FPS
✓ All tracks play correctly
✓ Mixing completes in < 120s
✓ Memory usage < 250MB
```

#### 50 Tracks (Stress)

```
Setup:
- Import 50 audio files
- Total size: ~250MB

Actions:
- Attempt to play all
- Scroll track list
- Attempt to mix all

Success Criteria:
✓ App doesn't crash
✓ Graceful degradation if needed
✓ Clear error messages if limits reached
```

### Scenario 2: Large Files

**Objective**: Test handling of large audio files

#### 100MB File

```
Setup:
- Import single 100MB audio file (1+ hour)

Actions:
- Load file
- Play file
- Adjust speed/volume
- Mix with other tracks

Success Criteria:
✓ File loads in < 5s
✓ Playback starts in < 2s
✓ No memory issues
✓ Mixing works correctly
```

#### 500MB File (Stress)

```
Setup:
- Import 500MB audio file

Actions:
- Attempt to load
- Monitor memory usage

Success Criteria:
✓ Graceful handling (error message if too large)
✓ No crash
✓ Memory doesn't exceed device limits
```

### Scenario 3: Long Session

**Objective**: Test app stability over extended use

```
Duration: 1 hour

Actions:
- Record 10 tracks (1 min each)
- Import 10 tracks
- Play tracks repeatedly
- Mix tracks
- Delete tracks
- Repeat cycle

Success Criteria:
✓ No crashes
✓ No memory leaks (memory stable over time)
✓ Performance doesn't degrade
✓ All features continue working
```

### Scenario 4: Rapid Operations

**Objective**: Test handling of rapid user interactions

```
Actions:
- Rapidly press play/pause (100 times)
- Rapidly adjust sliders (100 times)
- Quickly add/remove tracks (50 times)
- Spam record/stop buttons (20 times)

Success Criteria:
✓ No crashes
✓ Operations queue correctly
✓ UI remains responsive
✓ No race conditions
```

## Stress Testing Scenarios

### Memory Stress

**Test**: Push memory limits

```
Setup:
- Load maximum tracks
- Load large files
- Start mixing operations

Monitor:
- Memory usage
- Garbage collection
- App stability

Success Criteria:
✓ Graceful degradation before crash
✓ Warning messages when limits approached
✓ Ability to free memory (delete tracks)
```

### CPU Stress

**Test**: High CPU usage scenarios

```
Actions:
- Mix 20 tracks simultaneously
- Apply different speeds to each
- Monitor CPU usage

Success Criteria:
✓ CPU usage reasonable (< 80%)
✓ UI thread remains responsive
✓ Background processing doesn't block UI
```

### Storage Stress

**Test**: Fill device storage

```
Setup:
- Record until storage nearly full
- Attempt to save mixed tracks

Success Criteria:
✓ Check available storage before operations
✓ Clear error if storage full
✓ Don't corrupt existing files
```

### Network Stress (Web)

**Test**: Slow/unreliable network

```
Setup:
- Throttle network to 3G speeds
- Introduce packet loss

Actions:
- Load FFmpeg over network
- Import files

Success Criteria:
✓ Loading indicators shown
✓ Timeout handling
✓ Retry logic
```

## Load Testing Tools

### Manual Load Testing

```bash
# Generate test data
node scripts/generateTestData.js --tracks 20 --size large

# Run app with test data
npm run start

# Monitor performance
- Use DevTools Performance tab (web)
- Use Instruments (iOS)
- Use Android Profiler (Android)
```

### Automated Load Testing

#### Track Generation Script

```javascript
// scripts/generateTestTracks.js

const fs = require('fs');
const crypto = require('crypto');

function generateTrack(id, sizeKB) {
  return {
    id: `track-${id}`,
    name: `Generated Track ${id}`,
    uri: `file://test-data/track-${id}.mp3`,
    duration: Math.random() * 180000 + 30000, // 30s - 3min
    speed: 1.0,
    volume: 75,
    isPlaying: false,
    createdAt: Date.now() - id * 1000,
  };
}

function generateTracks(count, sizeKB) {
  const tracks = [];
  for (let i = 0; i < count; i++) {
    tracks.push(generateTrack(i, sizeKB));
  }
  return tracks;
}

// Generate 50 tracks
const tracks = generateTracks(50, 1024);
fs.writeFileSync('test-data/tracks.json', JSON.stringify(tracks, null, 2));

console.log(`Generated ${tracks.length} test tracks`);
```

### Load Testing Script

```javascript
// scripts/loadTest.js

async function loadTest() {
  console.log('Starting load test...');

  // Test 1: Many tracks
  console.log('\n=== Test 1: 20 Simultaneous Tracks ===');
  const tracks = require('../test-data/tracks.json').slice(0, 20);

  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  // Simulate loading tracks
  for (const track of tracks) {
    // Load track logic
  }

  const endTime = Date.now();
  const endMemory = process.memoryUsage().heapUsed;

  console.log(`Duration: ${endTime - startTime}ms`);
  console.log(`Memory used: ${(endMemory - startMemory) / 1024 / 1024}MB`);

  // Test 2: Rapid operations
  console.log('\n=== Test 2: Rapid Operations ===');

  const operations = 100;
  const operationTimes = [];

  for (let i = 0; i < operations; i++) {
    const start = Date.now();
    // Perform operation
    const end = Date.now();
    operationTimes.push(end - start);
  }

  const avgTime = operationTimes.reduce((a, b) => a + b, 0) / operations;
  console.log(`Average operation time: ${avgTime}ms`);
  console.log(`Max operation time: ${Math.max(...operationTimes)}ms`);

  console.log('\nLoad test complete!');
}

loadTest().catch(console.error);
```

## Endurance Testing

### Setup

```
Duration: 2-4 hours
Environment: Production build on real device
```

### Test Procedure

```
1. Start app
2. Record baseline metrics:
   - Memory usage
   - CPU usage
   - Battery level

3. Run automated user simulation:
   - Record audio (5 min intervals)
   - Import files (10 min intervals)
   - Play/pause tracks (continuous)
   - Adjust sliders (frequent)
   - Mix tracks (30 min intervals)
   - Delete old tracks (60 min intervals)

4. Monitor every 15 minutes:
   - Memory usage (should be stable)
   - CPU usage (should be reasonable)
   - Frame rate (should stay 60 FPS)
   - Battery drain (should be predictable)

5. After test completion:
   - Check for crashes
   - Verify all features still work
   - Check memory returned to baseline
```

### Success Criteria

```
✓ No crashes during test period
✓ Memory usage stable (no increasing trend)
✓ Performance consistent throughout
✓ All features functional after test
✓ No zombie processes or leaks
```

## Memory Leak Detection

### Manual Detection

```
1. Start app with performance monitor
2. Note baseline memory usage
3. Perform action (e.g., add track)
4. Undo action (e.g., delete track)
5. Force garbage collection (if available)
6. Check memory usage

Expected: Memory returns to baseline ± 10%
Leak: Memory remains significantly higher
```

### Automated Detection

```javascript
// Memory leak test
describe('Memory Leaks', () => {
  it('should not leak memory when adding/removing tracks', () => {
    const iterations = 100;
    const memorySnapshots = [];

    for (let i = 0; i < iterations; i++) {
      // Add track
      const track = generateTrack(i);
      useTrackStore.getState().addTrack(track);

      // Remove track
      useTrackStore.getState().removeTrack(track.id);

      // Record memory
      if (i % 10 === 0) {
        if (global.gc) global.gc(); // Force GC if available
        memorySnapshots.push(process.memoryUsage().heapUsed);
      }
    }

    // Analyze trend
    const firstHalf = memorySnapshots.slice(0, memorySnapshots.length / 2);
    const secondHalf = memorySnapshots.slice(memorySnapshots.length / 2);

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    // Memory shouldn't grow more than 20% between halves
    const growthRatio = avgSecond / avgFirst;
    expect(growthRatio).toBeLessThan(1.2);
  });
});
```

## Performance Degradation Testing

### Baseline Benchmarks

```
Cold start: < 3s
Button press: < 100ms
Slider update: < 50ms
Track load: < 2s
Mix 10 tracks: < 60s
```

### Degradation Test

```
For each benchmark:
1. Run under normal conditions → baseline
2. Run with 20 tracks loaded → check degradation
3. Run after 1 hour session → check degradation
4. Run with low memory → check degradation

Acceptable degradation: < 20% slower
Warning threshold: 20-50% slower
Unacceptable: > 50% slower or fails
```

## Test Results Documentation

### Load Test Report Template

```markdown
# Load Test Report

## Test Information

- Date: [date]
- Platform: [Web/iOS/Android]
- Version: [version]
- Device: [device info]

## Test Scenarios

### Scenario 1: 20 Tracks

- Load time: [X]ms
- Play time: [X]ms
- Mix time: [X]s
- Memory peak: [X]MB
- FPS: [X]
- Result: [PASS/FAIL]

### Scenario 2: Large File (100MB)

- Load time: [X]s
- Playback latency: [X]ms
- Memory usage: [X]MB
- Result: [PASS/FAIL]

### Scenario 3: 1 Hour Session

- Crashes: [X]
- Memory start: [X]MB
- Memory end: [X]MB
- Memory trend: [stable/increasing]
- Result: [PASS/FAIL]

## Issues Found

1. [Issue description]
   - Severity: [Critical/High/Medium/Low]
   - Reproducible: [Yes/No]

## Recommendations

- [Recommendation 1]
- [Recommendation 2]

## Conclusion

[Overall assessment]
```

## Resources

- [Chrome DevTools Memory Profiling](https://developer.chrome.com/docs/devtools/memory-problems/)
- [iOS Instruments](https://help.apple.com/instruments/mac/current/)
- [Android Profiler](https://developer.android.com/studio/profile)
- [React Native Performance](https://reactnative.dev/docs/performance)
