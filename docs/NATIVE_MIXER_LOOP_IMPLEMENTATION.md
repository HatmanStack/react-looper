# Native Audio Mixer - Loop Repetition and Fadeout Implementation Guide

## Overview

This document provides a detailed implementation guide for adding loop repetition and fadeout functionality to the native audio mixer (iOS/Android). The web implementation in `WebAudioMixer.ts` serves as a reference.

**Status**: Not yet implemented (placeholder/documentation phase)

**Priority**: Medium (web implementation functional, native can follow)

## Implementation Approach

### Technology: FFmpeg Filters

The native mixer should use FFmpeg's audio filters to achieve loop repetition and fadeout:

1. **Loop Repetition**: `aloop` filter
2. **Fadeout**: `afade` filter

### Required Changes

#### 1. Update `NativeAudio Mixer.ts` Interface

The mixer already receives `MixingOptions` which now includes:
- `loopCount?: number` - Number of master loop cycles
- `fadeoutDuration?: number` - Fadeout duration in milliseconds

No interface changes needed.

#### 2. Calculate Loop Parameters

```typescript
// In NativeAudioMixer._mixTracks()

// Calculate master loop duration (longest speed-adjusted track)
const masterLoopDuration = Math.max(
  ...tracks.map((track) => track.duration / track.speed)
);

const loopCount = options?.loopCount || 1;
const fadeoutDuration = (options?.fadeoutDuration || 0) / 1000; // Convert to seconds
const totalDuration = masterLoopDuration * loopCount + fadeoutDuration;
```

####  3. Apply FFmpeg Filters

For each track that needs to loop:

```bash
# Track loops to fill master loop duration
# Example: 4-second track in 10-second master loop
ffmpeg -i track.mp3 -filter:a "aloop=loop=2:size=SAMPLES" output.mp3
```

Calculate loop parameters:
```typescript
const trackDuration = track.duration / track.speed; // Speed-adjusted
const repetitionsNeeded = Math.ceil((masterLoopDuration * loopCount) / trackDuration);

// aloop filter uses number of additional loops (original + N loops)
const additionalLoops = repetitionsNeeded - 1;

// Size parameter is number of samples per loop
const sampleSize = trackDuration * sampleRate;
```

#### 4. Apply Fadeout to Master Mix

After mixing all tracks together, apply fadeout filter:

```bash
# Apply 2-second fadeout starting at 38 seconds in a 40-second mix
ffmpeg -i mixed.wav -af "afade=t=out:st=38:d=2" output.wav
```

Calculate fadeout parameters:
```typescript
const fadeoutStartTime = totalDuration - fadeoutDuration;

// FFmpeg fadeout filter parameters:
// t=out: fadeout (vs fadein)
// st=START_TIME: when to start fadeout (in seconds)
// d=DURATION: duration of fadeout (in seconds)
```

### Complete FFmpeg Command Example

```bash
# Step 1: Process each track with speed and looping
ffmpeg -i track1.mp3 \\
  -filter:a "atempo=0.5,aloop=loop=3:size=441000" \\
  track1_processed.wav

# Step 2: Mix all processed tracks
ffmpeg -i track1_processed.wav \\
       -i track2_processed.wav \\
       -i track3_processed.wav \\
  -filter_complex "[0:a][1:a][2:a]amix=inputs=3:duration=longest" \\
  mixed.wav

# Step 3: Apply fadeout to mixed output
ffmpeg -i mixed.wav \\
  -af "afade=t=out:st=38:d=2" \\
  final_output.mp3
```

### Implementation Code Structure

```typescript
protected async _mixTracks(
  tracks: MixerTrackInput[],
  outputPath: string,
  options?: MixingOptions,
): Promise<string> {
  // 1. Calculate loop parameters
  const masterLoopDuration = this.calculateMasterLoopDuration(tracks);
  const loopCount = options?.loopCount || 1;
  const fadeoutDuration = (options?.fadeoutDuration || 0) / 1000;
  const totalDuration = masterLoopDuration * loopCount + fadeoutDuration;

  // 2. Process each track with speed and looping
  const processedTracks: string[] = [];
  for (const track of tracks) {
    const processed = await this.processTrackWithLooping(
      track,
      masterLoopDuration,
      loopCount,
    );
    processedTracks.push(processed);
  }

  // 3. Mix all processed tracks
  const mixedPath = await this.mixProcessedTracks(processedTracks);

  // 4. Apply fadeout if specified
  if (fadeoutDuration > 0) {
    return await this.applyFadeout(
      mixedPath,
      outputPath,
      totalDuration - fadeoutDuration,
      fadeoutDuration,
    );
  }

  return mixedPath;
}

private async processTrackWithLooping(
  track: MixerTrackInput,
  masterLoopDuration: number,
  loopCount: number,
): Promise<string> {
  const trackDuration = track.duration / track.speed;
  const targetDuration = masterLoopDuration * loopCount;
  const repetitions = Math.ceil(targetDuration / trackDuration);
  const additionalLoops = repetitions - 1;

  // Build FFmpeg filter complex
  let filters: string[] = [];

  // Apply speed (using atempo)
  if (track.speed !== 1.0) {
    filters.push(`atempo=${track.speed}`);
  }

  // Apply looping if needed
  if (additionalLoops > 0) {
    const sampleSize = Math.floor(trackDuration * SAMPLE_RATE);
    filters.push(`aloop=loop=${additionalLoops}:size=${sampleSize}`);
  }

  // Apply volume
  if (track.volume !== 100) {
    const volumeScale = this.scaleVolume(track.volume);
    filters.push(`volume=${volumeScale}`);
  }

  const filterString = filters.join(',');

  // Execute FFmpeg command
  // Implementation depends on FFmpeg kit/library used
  return await this.executeFFmpegFilter(track.uri, filterString);
}

private async applyFadeout(
  inputPath: string,
  outputPath: string,
  fadeoutStart: number,
  fadeoutDuration: number,
): Promise<string> {
  const filterString = `afade=t=out:st=${fadeoutStart}:d=${fadeoutDuration}`;
  return await this.executeFFmpegFilter(inputPath, filterString, outputPath);
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('NativeAudioMixer - Loop Repetition', () => {
  it('calculates master loop duration correctly', () => {
    // Test calculation logic
  });

  it('calculates loop repetitions for shorter tracks', () => {
    // Test repetition math
  });

  it('builds correct FFmpeg filter string for looping', () => {
    // Test filter construction
  });

  it('builds correct FFmpeg filter string for fadeout', () => {
    // Test fadeout parameters
  });
});
```

### Integration Tests

```typescript
it('exports multiple loop cycles correctly', async () => {
  const tracks = [mockTrack1, mockTrack2];
  const options = { loopCount: 4, fadeoutDuration: 2000 };

  const result = await nativeMixer.mixTracks(tracks, 'output.mp3', options);

  // Verify output file exists
  // Verify duration is correct
  // Verify fadeout is applied
});
```

### Manual Testing

1. Create test tracks of different lengths (4s, 8s, 12s)
2. Export with various loop counts (1, 2, 4, 8)
3. Listen for:
   - Smooth loop transitions
   - Correct total duration
   - Proper fadeout application
   - No audio glitches or clicks

## FFmpeg Filter Reference

### aloop - Audio Looping

```
aloop=loop=LOOP_COUNT:size=SAMPLE_SIZE
```

- `loop`: Number of additional loops (0 = play once, 1 = play twice, etc.)
- `size`: Number of samples per loop (duration × sample_rate)

**Example**:
```bash
# Loop a 2-second audio clip 3 times (total 6 seconds)
-af "aloop=loop=2:size=88200" # 2s × 44100 Hz = 88200 samples
```

### afade - Audio Fade

```
afade=t=TYPE:st=START_TIME:d=DURATION
```

- `t`: Type (`in` for fade-in, `out` for fade-out)
- `st`: Start time in seconds
- `d`: Duration of fade in seconds

**Example**:
```bash
# 2-second fadeout starting at 38 seconds
-af "afade=t=out:st=38:d=2"
```

### atempo - Adjust Playback Speed

```
atempo=TEMPO
```

- `tempo`: Speed multiplier (0.5 = half speed, 2.0 = double speed)
- Range: 0.5 to 100.0
- For speeds outside this range, chain multiple atempo filters

**Example**:
```bash
# Half speed
-af "atempo=0.5"

# Quarter speed (chain two atempo filters)
-af "atempo=0.5,atempo=0.5"
```

## Known Limitations

1. **FFmpeg Availability**: Requires FFmpeg to be available on the device
   - iOS: Use FFmpeg kit
   - Android: Use ffmpeg-kit-react-native

2. **Performance**: Processing multiple loops of long tracks may be slow
   - Consider showing progress indicators
   - Implement cancellation support

3. **Temporary Files**: Processing requires intermediate files
   - Ensure proper cleanup
   - Handle storage permissions

4. **Sample Rate**: Ensure consistent sample rate across all tracks
   - FFmpeg can resample if needed
   - May impact quality

## Implementation Checklist

- [ ] Update `NativeAudioMixer.ts` with loop calculation logic
- [ ] Implement `processTrackWithLooping()` method
- [ ] Implement `applyFadeout()` method
- [ ] Add FFmpeg filter construction utilities
- [ ] Handle temporary file management
- [ ] Add error handling for FFmpeg failures
- [ ] Write unit tests for calculations
- [ ] Write integration tests for mixing
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Verify audio quality
- [ ] Verify loop transitions are smooth
- [ ] Document any platform-specific issues

## Resources

- [FFmpeg Audio Filters Documentation](https://ffmpeg.org/ffmpeg-filters.html#Audio-Filters)
- [ffmpeg-kit-react-native](https://github.com/arthenica/ffmpeg-kit)
- Web implementation: `src/services/audio/WebAudioMixer.ts` (reference)

## Next Steps

1. Review this implementation guide
2. Set up FFmpeg kit dependencies for React Native
3. Implement track processing with looping
4. Implement fadeout application
5. Test thoroughly on both platforms
6. Update documentation with any findings

---

**Note**: This is a documentation/planning phase deliverable. Actual implementation can be completed in a follow-up task when native mixer functionality is prioritized.
