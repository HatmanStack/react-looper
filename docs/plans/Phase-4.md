# Phase 4: Save/Export Enhancements

## Phase Goal

Enhance the save/export functionality to support loop repetition and fadeout. Update the save dialog to allow users to configure how many loop cycles to export and whether to apply a fadeout. Modify the audio mixing logic to duplicate tracks according to loop boundaries and apply fadeout to the final mix. This phase delivers the core export functionality that makes the looper feature complete.

**Success Criteria**:

- Save dialog includes loop count and fadeout configuration
- Audio mixer correctly repeats tracks to fill loop cycles
- Fadeout applied smoothly to final export
- Settings defaults loaded into save dialog
- Export duration calculation includes loop repetitions and fadeout
- All mixer platforms (web, native) handle repetition correctly
- Tests cover various loop configurations

**Estimated tokens**: ~80,000

---

## Prerequisites

- Phase 0 reviewed
- Phase 1 complete (loop engine)
- Phase 2 complete (UI components)
- Phase 3 complete (settings store)
- Understanding of audio mixing concepts
- Familiarity with FFmpeg (web) and expo-av (native)

---

## Tasks

### Task 1: Enhance Save Modal UI

**Goal**: Update the save modal to include loop count and fadeout configuration options, loading defaults from settings.

**Files to Modify**:

- `src/components/SaveModal/SaveModal.tsx` - Add loop count and fadeout inputs
- `src/components/SaveModal/SaveModal.styles.ts` - Add styles for new inputs
- `src/components/SaveModal/__tests__/SaveModal.test.tsx` - Add tests

**Prerequisites**: Phase 3 complete (settings store with defaults)

**Implementation Steps**:

1. Add state for loop count and fadeout to SaveModal:
   - Initialize from settings store defaults
   - Track user changes separately from defaults
   - Pass these values to mixer when saving

2. Add Loop Count selector:
   - Radio buttons or segmented control: 1, 2, 4, 8, Custom
   - If Custom selected, show number input (1-100 range)
   - Display estimated total duration: `masterLoopDuration × loopCount + fadeout`
   - Label: "Loop Repetitions"

3. Add Fadeout selector:
   - Radio buttons or segmented control: None, 1s, 2s, 5s, Custom
   - If Custom selected, show number input (0-10s range, in seconds or milliseconds)
   - Label: "Fadeout Duration"

4. Update file name suggestion:
   - Include loop count in suggested name if not default
   - Example: "mix_4loops_2024-01-15.mp3"

5. Update progress estimation:
   - Factor in loop count and fadeout for mixing time estimate
   - Display: "Mixing 4 loop cycles with 2s fadeout..."

6. Maintain existing functionality:
   - Format selection
   - Quality selection
   - File name input
   - Save/cancel buttons

7. Add validation:
   - Loop count must be ≥ 1
   - Fadeout cannot be negative
   - Warn if export duration exceeds reasonable limit (e.g., 10 minutes)

8. Write tests:
   - Test default values loaded from settings
   - Test changing loop count updates duration estimate
   - Test changing fadeout updates duration estimate
   - Test custom input validation
   - Test save action passes correct parameters

**Verification Checklist**:

- [ ] Loop count selector functional
- [ ] Fadeout selector functional
- [ ] Custom inputs validated correctly
- [ ] Duration estimate accurate
- [ ] Defaults loaded from settings
- [ ] UI clear and intuitive
- [ ] Tests cover all scenarios

**Testing Instructions**:

```typescript
describe('SaveModal - Loop and Fadeout', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      defaultLoopCount: 4,
      defaultFadeoutDuration: 2000,
    });
  });

  it('loads default values from settings', () => {
    const { getByTestId } = render(<SaveModal visible={true} onClose={jest.fn()} />);

    expect(getByTestId('loop-count-input').props.value).toBe('4');
    expect(getByTestId('fadeout-input').props.value).toBe('2');
  });

  it('calculates estimated duration correctly', () => {
    // Mock master loop duration of 10 seconds
    jest.spyOn(useTrackStore.getState(), 'getMasterLoopDuration').mockReturnValue(10000);

    const { getByText } = render(<SaveModal visible={true} onClose={jest.fn()} />);

    // 4 loops × 10s + 2s fadeout = 42s total
    expect(getByText(/42 seconds/i)).toBeTruthy();
  });

  it('updates duration when loop count changed', () => {
    jest.spyOn(useTrackStore.getState(), 'getMasterLoopDuration').mockReturnValue(10000);

    const { getByTestId, getByText } = render(<SaveModal visible={true} onClose={jest.fn()} />);

    // Change to 8 loops
    fireEvent.press(getByTestId('loop-count-8'));

    // 8 loops × 10s + 2s fadeout = 82s total
    expect(getByText(/82 seconds/i)).toBeTruthy();
  });

  it('validates custom loop count input', () => {
    const { getByTestId, getByText } = render(<SaveModal visible={true} onClose={jest.fn()} />);

    fireEvent.press(getByTestId('loop-count-custom'));

    const input = getByTestId('loop-count-custom-input');

    // Try invalid value
    fireEvent.changeText(input, '0');

    expect(getByText(/must be at least 1/i)).toBeTruthy();
  });

  it('warns if export duration exceeds limit', () => {
    jest.spyOn(useTrackStore.getState(), 'getMasterLoopDuration').mockReturnValue(120000); // 2 minutes

    const { getByTestId, getByText } = render(<SaveModal visible={true} onClose={jest.fn()} />);

    // Set to 10 loops (20 minutes total)
    fireEvent.press(getByTestId('loop-count-custom'));
    fireEvent.changeText(getByTestId('loop-count-custom-input'), '10');

    expect(getByText(/export duration is very long/i)).toBeTruthy();
  });

  it('passes loop count and fadeout to mixer on save', async () => {
    const mockMixer = { mixTracks: jest.fn() };
    const { getByTestId } = render(<SaveModal visible={true} onClose={jest.fn()} />);

    // Set values
    fireEvent.press(getByTestId('loop-count-8'));
    fireEvent.press(getByTestId('fadeout-5s'));

    // Save
    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(mockMixer.mixTracks).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          loopCount: 8,
          fadeoutDuration: 5000,
        })
      );
    });
  });
});
```

Run tests: `npm test -- SaveModal.test.tsx`

**Commit Message Template**:

```
feat(export): enhance save modal with loop count and fadeout

- Add loop count selector (1, 2, 4, 8, custom)
- Add fadeout duration selector (None, 1s, 2s, 5s, custom)
- Calculate and display estimated export duration
- Load defaults from settings store
- Add input validation and warnings
- Include comprehensive tests
```

**Estimated tokens**: ~18,000

---

### Task 2: Update Mixer Options Interface

**Goal**: Extend the MixingOptions interface to include loop count and fadeout parameters that will be used by all mixer implementations.

**Files to Modify**:

- `src/types/audio.ts` - Add fields to MixingOptions interface
- `src/services/audio/BaseAudioMixer.ts` - Update documentation

**Prerequisites**: None (type definition)

**Implementation Steps**:

1. Update `MixingOptions` interface in `audio.ts`:

   ```typescript
   export interface MixingOptions {
     // ... existing fields ...

     /**
      * Number of master loop cycles to export
      * Default: 1 (single loop)
      */
     loopCount?: number;

     /**
      * Fadeout duration in milliseconds
      * Applied to the very end of the mixed output
      * Default: 0 (no fadeout)
      */
     fadeoutDuration?: number;
   }
   ```

2. Update JSDoc comments in BaseAudioMixer to reference these new options

3. Add validation in BaseAudioMixer.validateTracks() or create new validation method:
   - Loop count must be ≥ 1
   - Fadeout duration must be ≥ 0
   - Optional: Maximum export duration check

4. No breaking changes: make fields optional with sensible defaults

**Verification Checklist**:

- [ ] Interface updated correctly
- [ ] TypeScript compilation succeeds
- [ ] Documentation clear
- [ ] No breaking changes to existing code

**Testing Instructions**:

No tests needed for type definitions, but verify TypeScript compilation:

```bash
npm run type-check
# or
tsc --noEmit
```

**Commit Message Template**:

```
feat(types): add loopCount and fadeoutDuration to MixingOptions

- Extend MixingOptions interface for export configuration
- Add JSDoc documentation for new fields
- Ensure backward compatibility with optional fields
```

**Estimated tokens**: ~5,000

---

### Task 3: Implement Track Repetition in Web Audio Mixer

**Goal**: Update WebAudioMixer to duplicate tracks according to loop count and apply fadeout to the final mixed output.

**Files to Modify**:

- `src/services/audio/WebAudioMixer.ts` - Add repetition and fadeout logic
- `src/services/audio/__tests__/WebAudioMixer.test.ts` - Create or update tests

**Prerequisites**: Tasks 1 and 2 complete, Phase 1 complete

**Implementation Steps**:

1. Calculate total export duration:

   ```typescript
   const masterLoopDuration = calculateMasterLoopDuration(tracks);
   const loopCount = options?.loopCount || 1;
   const fadeoutDuration = options?.fadeoutDuration || 0;
   const totalDuration =
     masterLoopDuration * loopCount + fadeoutDuration / 1000; // in seconds
   ```

2. Modify OfflineAudioContext creation:
   - Use `totalDuration` instead of `maxDuration` for context length

3. For each track, calculate repetition strategy:
   - Track speed-adjusted duration
   - Number of repetitions needed to fill `loopCount` master loops
   - Use loop engine utilities from Phase 1

4. Create looping sources:
   - **Option A**: Use AudioBufferSourceNode with `loop=true` and stop at calculated time
   - **Option B**: Manually duplicate audio buffer data
   - Recommend Option A for simplicity

5. Apply fadeout to master output:
   - Create GainNode on context destination
   - Use `gainNode.gain.linearRampToValueAtTime()` for fadeout
   - Fadeout starts at `(totalDuration - fadeoutDuration)` and ends at `totalDuration`
   - Ramp from 1.0 to 0.0

6. Handle edge cases:
   - Loop count = 1: No repetition needed (existing behavior)
   - Fadeout = 0: No fadeout applied
   - Very short loops: Ensure no audio glitches

7. Update progress reporting:
   - Factor in longer render time for multiple loops

8. Write tests:
   - Test single loop (no repetition)
   - Test multiple loops (2, 4, 8)
   - Test fadeout applied correctly
   - Test combined loops + fadeout
   - Test edge cases (0 fadeout, 1 loop, etc.)

**Verification Checklist**:

- [ ] Tracks repeat correctly for multiple loops
- [ ] Fadeout applied smoothly to final output
- [ ] No audio glitches at loop boundaries
- [ ] Export duration matches calculation
- [ ] Performance acceptable for up to 10 loops
- [ ] Tests cover various configurations

**Testing Instructions**:

```typescript
describe("WebAudioMixer - Track Repetition", () => {
  it("renders single loop when loopCount=1", async () => {
    const tracks = [
      { uri: "track1.mp3", duration: 10000, speed: 1.0, volume: 100 },
    ];

    const mixer = new WebAudioMixer();
    await mixer.mixTracks(tracks, "output.wav", { loopCount: 1 });

    const blob = mixer.getBlob();
    const buffer = await audioContextMock.decodeAudioData(
      await blob.arrayBuffer(),
    );

    expect(buffer.duration).toBeCloseTo(10, 1); // 10 seconds ± 1
  });

  it("renders multiple loops when loopCount > 1", async () => {
    const tracks = [
      { uri: "track1.mp3", duration: 10000, speed: 1.0, volume: 100 },
    ];

    const mixer = new WebAudioMixer();
    await mixer.mixTracks(tracks, "output.wav", { loopCount: 4 });

    const blob = mixer.getBlob();
    const buffer = await audioContextMock.decodeAudioData(
      await blob.arrayBuffer(),
    );

    expect(buffer.duration).toBeCloseTo(40, 1); // 40 seconds ± 1
  });

  it("applies fadeout to final output", async () => {
    const tracks = [
      { uri: "track1.mp3", duration: 10000, speed: 1.0, volume: 100 },
    ];

    const mixer = new WebAudioMixer();
    await mixer.mixTracks(tracks, "output.wav", {
      loopCount: 1,
      fadeoutDuration: 2000, // 2 seconds
    });

    const blob = mixer.getBlob();
    const buffer = await audioContextMock.decodeAudioData(
      await blob.arrayBuffer(),
    );

    // Verify fadeout in audio data (check amplitude decreases at end)
    const channelData = buffer.getChannelData(0);
    const endSamples = channelData.slice(-1000); // Last 1000 samples

    // Verify amplitude approaches zero
    const avgAmplitude =
      endSamples.reduce((sum, val) => sum + Math.abs(val), 0) /
      endSamples.length;
    expect(avgAmplitude).toBeLessThan(0.1); // Very quiet at end
  });

  it("handles shorter tracks looping within master loop", async () => {
    const tracks = [
      { uri: "track1.mp3", duration: 10000, speed: 1.0, volume: 100 }, // Master: 10s
      { uri: "track2.mp3", duration: 4000, speed: 1.0, volume: 100 }, // Loops 3 times in 10s
    ];

    const mixer = new WebAudioMixer();
    await mixer.mixTracks(tracks, "output.wav", { loopCount: 2 });

    const blob = mixer.getBlob();
    const buffer = await audioContextMock.decodeAudioData(
      await blob.arrayBuffer(),
    );

    // Total: 2 master loops × 10s = 20s
    expect(buffer.duration).toBeCloseTo(20, 1);

    // Verify both tracks audible throughout
    // (This requires more sophisticated audio analysis)
  });
});
```

Run tests: `npm test -- WebAudioMixer.test.ts`

**Commit Message Template**:

```
feat(mixer): implement track repetition and fadeout in web mixer

- Calculate total export duration from loop count and fadeout
- Implement track looping for multiple cycles
- Apply fadeout to master output using gain ramping
- Handle shorter tracks repeating within master loop
- Add comprehensive tests for repetition and fadeout
```

**Estimated tokens**: ~20,000

---

### Task 4: Implement Track Repetition in Native Audio Mixer (Placeholder)

**Goal**: Document approach for implementing track repetition and fadeout in native mixer using FFmpeg. Actual implementation may require platform-specific audio engineering.

**Files to Modify/Document**:

- `src/services/audio/NativeAudioMixer.ts` - Add TODO comments or placeholder implementation
- Create implementation notes document

**Prerequisites**: Task 3 complete (web implementation as reference)

**Implementation Steps**:

1. **If time and expertise allow**, implement similar to web:
   - Use FFmpeg filters to loop tracks: `aloop=loop=<count>`
   - Use FFmpeg fadeout filter: `afade=out:st=<start_time>:d=<duration>`
   - Combine filters in FFmpeg command

2. **Otherwise**, add comprehensive TODO comments:

   ```typescript
   // TODO: Implement track repetition for native mixer
   // Approach:
   // 1. Calculate total duration: masterLoopDuration × loopCount + fadeout
   // 2. For each track:
   //    a. Calculate repetitions needed
   //    b. Use FFmpeg aloop filter: -filter:a "aloop=loop=X:size=Y"
   // 3. Apply fadeout to master mix:
   //    - Use afade filter: -af "afade=t=out:st=START:d=DURATION"
   // 4. See WebAudioMixer implementation for calculation logic
   //
   // FFmpeg command example:
   // ffmpeg -i track1.mp3 -af "aloop=loop=3:size=SAMPLES, afade=t=out:st=30:d=2" output.mp3
   ```

3. Create `docs/plans/looper-normalization/NATIVE_MIXER_IMPLEMENTATION.md`:
   - Detailed implementation plan
   - FFmpeg filter documentation
   - Example commands
   - Testing strategy

4. Add integration test (may be skipped on native if not implemented):
   ```typescript
   it.skip("renders multiple loops on native (not yet implemented)", async () => {
     // Test will be enabled when native implementation complete
   });
   ```

**Verification Checklist**:

- [ ] Web implementation working as reference
- [ ] Native approach documented clearly
- [ ] TODO comments added to code
- [ ] Implementation guide created
- [ ] Tests marked as skipped with clear reasoning

**Testing Instructions**:

If native implementation completed:

- Run same tests as web mixer
- Verify FFmpeg commands generate correct output
- Test on actual device

If not implemented:

- Document testing approach
- Skip native-specific tests with `.skip`

**Commit Message Template**:

```
docs(mixer): document native mixer repetition implementation

- Add TODO comments for track repetition in native mixer
- Document FFmpeg filter approach
- Create implementation guide for future work
- Skip native mixer tests until implementation complete
```

**Estimated tokens**: ~12,000

---

### Task 5: Update Save Workflow to Pass Loop Options

**Goal**: Connect the save modal UI to the mixer implementations, passing loop count and fadeout parameters through the entire save workflow.

**Files to Modify**:

- `src/screens/MainScreen/MainScreen.tsx` - Update save handler
- `src/services/audio/AudioService.ts` - Pass options through service layer
- Any intermediate layers between UI and mixer

**Prerequisites**: Tasks 1-4 complete

**Implementation Steps**:

1. In save handler (MainScreen or wherever save is triggered):
   - Collect loop count and fadeout from SaveModal state
   - Construct MixingOptions object
   - Pass to audio service mix method

2. Update AudioService or equivalent:
   - Accept MixingOptions in mix/export methods
   - Pass options through to platform-specific mixer
   - Ensure no options are dropped in the chain

3. Update progress callbacks:
   - Adjust estimated time based on loop count
   - Update progress messages: "Mixing 4 loops..." instead of "Mixing..."

4. Handle errors gracefully:
   - Very large exports may timeout or fail
   - Show helpful error messages
   - Suggest reducing loop count or fadeout if export fails

5. Test end-to-end:
   - Add tracks
   - Open save modal
   - Configure loop count and fadeout
   - Save
   - Verify output file has correct duration and fadeout

6. Write integration tests:
   - Test full save workflow with various loop counts
   - Test with and without fadeout
   - Test error handling for oversized exports

**Verification Checklist**:

- [ ] Save modal values passed to mixer
- [ ] Options propagate through all layers
- [ ] Progress updates reflect loop count
- [ ] Errors handled gracefully
- [ ] End-to-end workflow tested
- [ ] Integration tests pass

**Testing Instructions**:

```typescript
describe('Save Workflow - Loop Options', () => {
  it('passes loop count and fadeout to mixer', async () => {
    const mockMixer = {
      mixTracks: jest.fn().mockResolvedValue('output.mp3'),
    };

    // Add tracks
    useTrackStore.getState().addTrack(createMockTrack());
    useTrackStore.getState().addTrack(createMockTrack());

    // Open save modal, configure options
    const { getByTestId } = render(<MainScreen />);
    fireEvent.press(getByTestId('save-button'));

    fireEvent.press(getByTestId('loop-count-4'));
    fireEvent.press(getByTestId('fadeout-2s'));

    // Save
    fireEvent.press(getByTestId('save-confirm-button'));

    await waitFor(() => {
      expect(mockMixer.mixTracks).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          loopCount: 4,
          fadeoutDuration: 2000,
        })
      );
    });
  });

  it('updates progress message with loop count', async () => {
    // Similar test verifying progress callback receives correct message
  });

  it('handles export failure gracefully', async () => {
    const mockMixer = {
      mixTracks: jest.fn().mockRejectedValue(new Error('Export timeout')),
    };

    // Trigger save with large loop count
    // Verify error message displayed
    // Verify suggested action (reduce loop count)
  });
});
```

Run tests: `npm test -- MainScreen.test.tsx` or appropriate integration test file

**Commit Message Template**:

```
feat(export): connect save modal options to mixer workflow

- Pass loop count and fadeout from UI to mixer
- Update progress messages for loop export
- Add error handling for oversized exports
- Include end-to-end integration tests
```

**Estimated tokens**: ~15,000

---

### Task 6: Apply Crossfade Setting from Phase 3

**Goal**: Implement the crossfade functionality that was added to settings in Phase 3 but not yet used in audio mixing.

**Files to Modify**:

- `src/services/audio/WebAudioMixer.ts` - Apply crossfade at loop boundaries
- `src/services/audio/__tests__/WebAudioMixer.test.ts` - Add crossfade tests

**Prerequisites**: Task 3 complete, Phase 3 complete

**Implementation Steps**:

1. Read crossfade duration from settings:

   ```typescript
   const crossfadeDuration = useSettingsStore.getState().loopCrossfadeDuration;
   ```

2. Implement crossfade at loop boundaries:
   - When track loops (restarts), apply short crossfade
   - **Approach**: Create two overlapping source nodes
     - Node 1: Plays end of loop, fading out
     - Node 2: Plays beginning of loop, fading in
     - Overlap = crossfade duration

3. Apply only if crossfade > 0:
   - If crossfade = 0 (gapless), use existing behavior
   - If crossfade > 0, apply crossfade logic

4. Handle very short tracks:
   - If track duration < crossfade duration, skip crossfade (not applicable)

5. Performance considerations:
   - Crossfade adds complexity
   - May slightly increase mixing time
   - Should be imperceptible for durations < 50ms

6. Write tests:
   - Test gapless mode (crossfade = 0)
   - Test crossfade applied at loop boundaries
   - Test very short tracks handled correctly

**Verification Checklist**:

- [ ] Crossfade setting read from store
- [ ] Crossfade applied correctly at loop boundaries
- [ ] Gapless mode still works (crossfade = 0)
- [ ] No audio glitches or clicks
- [ ] Performance acceptable
- [ ] Tests verify crossfade behavior

**Testing Instructions**:

```typescript
describe("WebAudioMixer - Crossfade", () => {
  it("applies gapless looping when crossfade is 0", async () => {
    useSettingsStore.setState({ loopCrossfadeDuration: 0 });

    const tracks = [
      { uri: "track1.mp3", duration: 5000, speed: 1.0, volume: 100 },
    ];

    const mixer = new WebAudioMixer();
    await mixer.mixTracks(tracks, "output.wav", { loopCount: 2 });

    // Verify no crossfade artifacts (difficult to test programmatically)
    // May require manual audio inspection or advanced signal analysis
  });

  it("applies crossfade at loop boundaries when setting > 0", async () => {
    useSettingsStore.setState({ loopCrossfadeDuration: 20 }); // 20ms

    const tracks = [
      { uri: "track1.mp3", duration: 5000, speed: 1.0, volume: 100 },
    ];

    const mixer = new WebAudioMixer();
    await mixer.mixTracks(tracks, "output.wav", { loopCount: 2 });

    // Verify crossfade applied
    // This requires inspecting audio buffer at loop boundary
    // Check for smooth transition (no sudden amplitude change)
  });

  it("skips crossfade for very short tracks", async () => {
    useSettingsStore.setState({ loopCrossfadeDuration: 50 }); // 50ms

    const tracks = [
      { uri: "track1.mp3", duration: 30, speed: 1.0, volume: 100 }, // 30ms track
    ];

    const mixer = new WebAudioMixer();
    await mixer.mixTracks(tracks, "output.wav", { loopCount: 5 });

    // Verify no errors, track plays correctly
  });
});
```

Run tests: `npm test -- WebAudioMixer.test.ts`

**Commit Message Template**:

```
feat(mixer): implement crossfade at loop boundaries

- Read crossfade duration from settings store
- Apply crossfade using overlapping fade-out and fade-in
- Handle gapless mode (crossfade = 0)
- Skip crossfade for very short tracks
- Add tests for crossfade behavior
```

**Estimated tokens**: ~10,000

---

## Phase Verification

After completing all tasks, verify Phase 4 is complete:

### Automated Verification

```bash
# Run all tests
npm test

# Run only Phase 4 tests
npm test -- SaveModal.test.tsx
npm test -- WebAudioMixer.test.ts
npm test -- MainScreen.test.tsx

# Check test coverage
npm test -- --coverage
```

**Expected Results**:

- All tests pass
- Code coverage ≥ 80% for new code
- No existing tests broken

### Manual Testing Scenarios

#### Scenario 1: Single Loop Export (Baseline)

1. Add 2-3 tracks
2. Open save modal
3. Set loop count to 1, fadeout to None
4. Save with default name
5. **Verify**: Export completes
6. Play exported file
7. **Verify**: File duration = master loop duration
8. **Verify**: No fadeout at end

#### Scenario 2: Multiple Loop Export

1. Add tracks (master loop ~10 seconds)
2. Open save modal
3. Set loop count to 4
4. Fadeout: None
5. Save
6. **Verify**: Export progress shows "Mixing 4 loops..."
7. Play exported file
8. **Verify**: File duration ≈ 40 seconds
9. **Verify**: Tracks loop correctly throughout
10. **Verify**: No fadeout at end

#### Scenario 3: Export with Fadeout

1. Add tracks
2. Open save modal
3. Set loop count to 2, fadeout to 2s
4. Save
5. Play exported file
6. **Verify**: File duration = (master loop × 2) + 2s
7. **Verify**: Fadeout applied smoothly at end
8. **Verify**: No sudden cutoff

#### Scenario 4: Custom Loop Count and Fadeout

1. Add tracks
2. Open save modal
3. Select "Custom" for loop count, enter 6
4. Select "Custom" for fadeout, enter 3.5s
5. **Verify**: Duration estimate updates
6. Save
7. **Verify**: Export completes
8. **Verify**: File matches expected duration and has fadeout

#### Scenario 5: Settings Defaults Applied

1. Navigate to settings
2. Set default loop count to 8
3. Set default fadeout to 5s
4. Return to main screen
5. Open save modal
6. **Verify**: Loop count preset to 8
7. **Verify**: Fadeout preset to 5s
8. Save
9. **Verify**: Export uses these values

#### Scenario 6: Crossfade Setting

1. Navigate to settings
2. Set crossfade to 30ms
3. Return to main screen
4. Add tracks with one short track (loops multiple times)
5. Save with loop count 2
6. Play exported file
7. **Verify**: Loop transitions are smooth (no clicks)
8. Go to settings, set crossfade to 0
9. Export again
10. Compare: gapless version may have slight click (acceptable)

#### Scenario 7: Error Handling

1. Add tracks
2. Open save modal
3. Set loop count to 100 (very large)
4. **Verify**: Warning message displayed
5. Attempt to save
6. If export fails, **Verify**: Helpful error message
7. **Verify**: App doesn't crash

### Integration Points Tested

- ✅ Save modal loads defaults from settings
- ✅ Save modal passes options to mixer
- ✅ Web mixer repeats tracks for multiple loops
- ✅ Web mixer applies fadeout to final output
- ✅ Crossfade setting applied to loop boundaries
- ✅ Progress tracking reflects loop count
- ✅ Error handling for oversized exports

### Audio Quality Manual Checks

**Important**: Automated tests verify API behavior but cannot catch audio quality issues. Perform these manual checks:

1. **Loop Boundary Quality**
   - Export 4 loops of a track with distinct ending/beginning
   - Listen at loop boundaries (e.g., 10s, 20s, 30s marks)
   - **Verify**: No clicks, pops, or gaps
   - **Verify**: Seamless transition (gapless mode) or smooth crossfade

2. **Fadeout Quality**
   - Export with 2-second fadeout
   - Listen to final 3 seconds
   - **Verify**: Volume decreases smoothly and linearly
   - **Verify**: No abrupt cutoff or distortion
   - **Verify**: Fadeout reaches complete silence

3. **Crossfade Quality** (if crossfade > 0)
   - Set crossfade to 20-30ms in settings
   - Export track with loops
   - Listen carefully at loop boundaries
   - **Verify**: No audible seam or phase cancellation
   - **Verify**: Smooth transition without artifacts

4. **Multi-Track Loop Quality**
   - Add 3-4 tracks with different lengths
   - Export with 4 loops
   - **Verify**: All tracks loop correctly throughout
   - **Verify**: Shorter tracks restart seamlessly
   - **Verify**: No drift or sync issues

5. **Audio Type Testing**
   - Test with various audio: music, voice, percussion, white noise
   - **Verify**: Quality consistent across audio types
   - **Verify**: No format-specific artifacts

**Test on multiple platforms**: Web audio processing may differ from native. Verify quality on both if both mixers implemented.

### Known Limitations

- Native mixer implementation may be incomplete (documented approach provided)
- Very large loop counts (>50) may cause performance issues
- Crossfade implementation may not be perfect for all audio types
- Progress tracking for longer exports may not be perfectly linear

---

---

## Review Feedback (Iteration 1) - ✅ RESOLVED

### Task 3: WebAudioMixer Tests - ✅ COMPLETE

**Status:** Implemented in commit `c92bbca`

**Resolution:**
- Created `__tests__/unit/services/WebAudioMixer.test.ts` with comprehensive test coverage
- **23 tests passing**, covering:
  - Single loop (loopCount=1)
  - Multiple loops (2, 4, 8)
  - Fadeout applied correctly
  - Combined loops + fadeout
  - Edge cases (speed-adjusted, short tracks, large loop counts)
  - Blob output validation

**Verification:**
```bash
npm test -- WebAudioMixer.test.ts
# Result: 23 passed, 1 skipped, 1 test suite
```

### Task 6: Crossfade Implementation - ✅ COMPLETE

**Status:** Implemented in commit `bb62af8`

**Resolution:**
- Implemented crossfade at loop boundaries in `WebAudioMixer.ts` (lines 78-161)
- Reads `loopCrossfadeDuration` from settings store
- Creates multiple source nodes for each loop repetition
- Applies fade-in at start of each repetition (except first)
- Applies fade-out at end of each repetition (except last)
- Falls back to simple looping when crossfade is 0 or track too short

**Implementation highlights:**
```typescript
// Line 78: Read from settings
const crossfadeDurationMs = useSettingsStore.getState().loopCrossfadeDuration;

// Lines 123-128: Fade-in
if (rep > 0 && crossfadeDuration < playDuration) {
  fadeGain.gain.setValueAtTime(0.0, startTime);
  fadeGain.gain.linearRampToValueAtTime(1.0, startTime + crossfadeDuration);
}

// Lines 131-136: Fade-out
const fadeOutStart = startTime + trackDuration - crossfadeDuration;
fadeGain.gain.linearRampToValueAtTime(0.0, nextRepStartTime);
```

**Test coverage:**
- ✅ Gapless looping when crossfade is 0
- ✅ Crossfade at loop boundaries when setting > 0
- ✅ Skip crossfade for very short tracks
- ✅ Handle crossfade with multiple loop cycles
- ✅ Apply crossfade to multiple tracks

### Overall Phase Status - ✅ ALL COMPLETE

**Completed:**
- ✅ Task 1: SaveModal UI (9 tests passing)
- ✅ Task 2: MixingOptions types
- ✅ Task 3: WebAudioMixer implementation + tests (23 tests passing)
- ✅ Task 4: Native mixer documentation
- ✅ Task 5: Save workflow integration
- ✅ Task 6: Crossfade implementation + tests

**Phase 4 is complete and ready for Phase 5.**

---

## Next Steps

✅ **Phase 4 Complete** - All tasks implemented and tested

Proceed to **Phase 5: Recording Workflow Integration** to update the recording functionality to respect loop boundaries and auto-stop at loop end for subsequent tracks.

**Phase 5 Preview**:

- Detect if recording is first track or subsequent track
- Auto-stop subsequent recordings at loop boundary
- Show recording progress relative to loop duration
- Add visual/audio cues for loop length while recording
- Update recording UI with loop indicators
- Test recording workflow with various scenarios
