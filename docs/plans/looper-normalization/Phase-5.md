# Phase 5: Recording Workflow Integration

## Phase Goal

Integrate the looper normalization feature with the recording workflow. Implement auto-stop for subsequent track recordings at the master loop boundary, provide visual and audio feedback during recording to help users stay in time with the loop, and update the recording UI to show loop progress. This phase completes the looper feature by making recording behave like a true loop station.

**Success Criteria**:

- First recording sets master loop (manual stop)
- Subsequent recordings auto-stop at loop end
- Visual progress indicator shows loop duration while recording
- Optional: Metronome or count-in for subsequent recordings
- Recording UI updated with loop awareness
- All recording modes tested (record first, record subsequent, record with playback)
- Works on web and mobile platforms

**Estimated tokens**: ~70,000

---

## Prerequisites

- Phase 0 reviewed
- Phase 1-4 complete
- Understanding of recording workflow in app
- Familiarity with BaseAudioRecorder and platform implementations

---

## Tasks

### Task 1: Detect Recording Context (First vs. Subsequent)

**Goal**: Add logic to determine whether the current recording will be the first track (master) or a subsequent track (overdub), and store this context for use in recording workflow.

**Files to Modify**:

- `src/services/audio/AudioService.ts` - Add recording context detection
- `src/store/useTrackStore.ts` - Add helper to check if first track
- `src/screens/MainScreen/MainScreen.tsx` - Use recording context to adjust UI

**Prerequisites**: Phase 1 complete (track store with master track methods)

**Implementation Steps**:

1. In AudioService or where recording starts:
   - Check if tracks exist: `useTrackStore.getState().hasPlayableTracks()`
   - If no tracks: Recording will be FIRST (sets master loop)
   - If tracks exist: Recording will be SUBSEQUENT (auto-stop at loop end)

2. Store recording context:
   - Add to UI store or local state
   - `isFirstTrackRecording: boolean`
   - Use to adjust UI and behavior

3. Pass context to recording UI components:
   - Show different messages based on context
   - First track: "Recording... Press stop to set loop length"
   - Subsequent: "Recording... Auto-stop at loop end"

4. Prepare for auto-stop logic:
   - Calculate master loop duration
   - Set timer or monitor recording duration
   - Will be used in next task

5. Write tests:
   - Test detection with no existing tracks
   - Test detection with existing tracks
   - Test context passed to UI correctly

**Verification Checklist**:

- [ ] Recording context detected correctly
- [ ] Context accessible to recording UI
- [ ] Different messages shown for first vs. subsequent
- [ ] Tests verify detection logic

**Testing Instructions**:

```typescript
describe('Recording Context Detection', () => {
  beforeEach(() => {
    useTrackStore.getState().clearTracks();
  });

  it('detects first track recording when no tracks exist', () => {
    const context = detectRecordingContext();

    expect(context.isFirstTrack).toBe(true);
    expect(context.masterLoopDuration).toBe(0);
  });

  it('detects subsequent track recording when tracks exist', () => {
    const track = createMockTrack({ duration: 10000, speed: 1.0 });
    useTrackStore.getState().addTrack(track);

    const context = detectRecordingContext();

    expect(context.isFirstTrack).toBe(false);
    expect(context.masterLoopDuration).toBe(10000);
  });

  it('displays correct message for first track recording', () => {
    const { getByText } = render(<RecordingUI />);

    expect(getByText(/set loop length/i)).toBeTruthy();
  });

  it('displays correct message for subsequent track recording', () => {
    useTrackStore.getState().addTrack(createMockTrack());

    const { getByText } = render(<RecordingUI />);

    expect(getByText(/auto-stop at loop end/i)).toBeTruthy();
  });
});
```

Run tests: `npm test -- recording-context`

**Commit Message Template**:

```
feat(recording): detect first vs. subsequent track recording context

- Add logic to determine if recording is first track or overdub
- Store recording context for UI and behavior adjustments
- Update UI to show different messages based on context
- Add tests for context detection
```

**Estimated tokens**: ~12,000

---

### Task 2: Implement Auto-Stop for Subsequent Recordings

**Goal**: Automatically stop recording after one loop cycle when recording subsequent tracks, matching hardware looper behavior.

**Files to Modify**:

- `src/services/audio/BaseAudioRecorder.ts` - Add auto-stop capability
- `src/services/audio/WebAudioRecorder.ts` - Implement auto-stop
- `src/services/audio/NativeAudioRecorder.ts` - Implement auto-stop
- Recording handler in MainScreen or AudioService

**Prerequisites**: Task 1 complete

**Implementation Steps**:

1. In BaseAudioRecorder, add auto-stop support:
   - Add `maxDuration?: number` to recording options
   - If maxDuration set, auto-stop when reached
   - Call stop callback or listener

2. When starting subsequent recording:
   - Calculate master loop duration
   - Pass as maxDuration to recorder: `startRecording({ maxDuration: masterLoopDuration })`

3. Implement auto-stop in WebAudioRecorder:
   - Use `setTimeout` to trigger stop after maxDuration
   - Clean up timer on manual stop
   - Ensure recorded audio trimmed to maxDuration

4. Implement auto-stop in NativeAudioRecorder:
   - Use expo-av's `maxDuration` option if available
   - Or use similar timer-based approach
   - Platform-specific implementation

5. Handle edge cases:
   - User manually stops before loop end: Use actual recording
   - Recording fails before loop end: Handle error gracefully
   - Very short loops (<1 second): May need minimum duration check

6. Add callback for auto-stop event:
   - UI should indicate recording auto-stopped (not user-triggered)
   - Different message: "Recording complete (1 loop cycle)" vs. "Recording stopped"

7. Write tests:
   - Test first recording does NOT auto-stop
   - Test subsequent recording DOES auto-stop at loop end
   - Test manual stop before auto-stop
   - Test auto-stop callback triggered

**Verification Checklist**:

- [ ] Auto-stop implemented on web
- [ ] Auto-stop implemented on native
- [ ] First recordings unaffected (manual stop only)
- [ ] Subsequent recordings stop at loop end
- [ ] Manual stop before auto-stop works correctly
- [ ] Tests cover all scenarios

**Testing Instructions**:

```typescript
describe("Recording Auto-Stop", () => {
  it("does not auto-stop first track recording", async () => {
    // No tracks exist
    const recorder = new WebAudioRecorder();

    await recorder.startRecording();

    // Wait past arbitrary duration
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Verify still recording
    expect(recorder.isRecording()).toBe(true);

    // Manual stop
    await recorder.stopRecording();
  });

  it("auto-stops subsequent track at loop end", async () => {
    // Add master track (10s loop)
    useTrackStore
      .getState()
      .addTrack(createMockTrack({ duration: 10000, speed: 1.0 }));

    const masterLoopDuration = useTrackStore.getState().getMasterLoopDuration();
    const recorder = new WebAudioRecorder();
    const stopCallback = jest.fn();

    await recorder.startRecording({ maxDuration: masterLoopDuration });
    recorder.onStop = stopCallback;

    // Wait for auto-stop (with buffer time)
    await new Promise((resolve) =>
      setTimeout(resolve, masterLoopDuration + 500),
    );

    // Verify auto-stopped
    expect(recorder.isRecording()).toBe(false);
    expect(stopCallback).toHaveBeenCalled();
  });

  it("allows manual stop before auto-stop", async () => {
    useTrackStore
      .getState()
      .addTrack(createMockTrack({ duration: 10000, speed: 1.0 }));

    const recorder = new WebAudioRecorder();

    await recorder.startRecording({ maxDuration: 10000 });

    // Manual stop after 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const uri = await recorder.stopRecording();

    expect(uri).toBeTruthy();
    expect(recorder.isRecording()).toBe(false);

    // Verify auto-stop timer cleared (no error after waiting)
    await new Promise((resolve) => setTimeout(resolve, 6000));
  });

  it("handles recording shorter than loop when stopped manually", async () => {
    useTrackStore
      .getState()
      .addTrack(createMockTrack({ duration: 10000, speed: 1.0 }));

    const recorder = new WebAudioRecorder();

    await recorder.startRecording({ maxDuration: 10000 });
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const uri = await recorder.stopRecording();

    // Verify recording is 3s, not 10s
    // This track will loop multiple times to fill master loop
    const metadata = await getAudioMetadata(uri);
    expect(metadata.duration).toBeCloseTo(3000, 500);
  });
});
```

Run tests: `npm test -- recorder auto-stop`

**Commit Message Template**:

```
feat(recording): implement auto-stop for subsequent track recordings

- Add maxDuration option to recording options
- Implement auto-stop timer in web recorder
- Implement auto-stop in native recorder
- Allow manual stop before auto-stop
- Add comprehensive tests for auto-stop behavior
```

**Estimated tokens**: ~18,000

---

### Task 3: Add Recording Progress Indicator for Loop Duration

**Goal**: Show a visual progress indicator during recording that displays progress through the loop cycle, helping users time their recording.

**Files to Create**:

- `src/components/RecordingProgressIndicator/RecordingProgressIndicator.tsx` - Progress component
- `src/components/RecordingProgressIndicator/RecordingProgressIndicator.styles.ts` - Styles
- `src/components/RecordingProgressIndicator/__tests__/RecordingProgressIndicator.test.tsx` - Tests
- `src/components/RecordingProgressIndicator/index.ts` - Re-export

**Files to Modify**:

- `src/screens/MainScreen/MainScreen.tsx` - Add progress indicator to recording UI

**Prerequisites**: Task 1 complete

**Implementation Steps**:

1. Create RecordingProgressIndicator component:
   - Props:
     - `isFirstTrack: boolean` - Changes display mode
     - `recordingDuration: number` - Current recording time (ms)
     - `loopDuration: number` - Master loop duration (for subsequent tracks)
   - Use circular or linear progress bar

2. Display modes:
   - **First track**: Simple timer (no progress bar, just elapsed time)
     - Display: "00:05.2" (5.2 seconds elapsed)
     - No loop boundary indication
   - **Subsequent track**: Progress bar + timer
     - Progress: `recordingDuration / loopDuration`
     - Display: "00:05.2 / 00:10.0" (5.2s of 10s loop)
     - Visual progress bar fills as recording approaches loop end

3. Visual design:
   - Prominent display (user needs to see it while performing)
   - Large, readable numbers
   - Progress bar clearly indicates completion
   - Color changes as loop end approaches (e.g., yellow at 80%, red at 95%)

4. Update recording time:
   - Use interval or animation frame to update every 100ms
   - Read elapsed time from recorder or maintain local timer

5. Integration with MainScreen:
   - Show during recording
   - Hide when not recording
   - Position prominently (top of screen or near record button)

6. Accessibility:
   - Announce progress for screen readers (sparingly, don't spam)
   - Consider audio cues at milestones (50%, 75%, 90% of loop)

7. Write tests:
   - Test first track mode (timer only)
   - Test subsequent track mode (progress bar + timer)
   - Test progress calculation accuracy
   - Test visual state changes (colors)

**Verification Checklist**:

- [ ] Progress indicator visible during recording
- [ ] Correct mode for first vs. subsequent tracks
- [ ] Progress updates smoothly
- [ ] Visual cues clear and helpful
- [ ] Doesn't interfere with recording controls
- [ ] Tests cover both modes and updates

**Testing Instructions**:

```typescript
describe('RecordingProgressIndicator', () => {
  it('renders timer mode for first track', () => {
    const { getByText, queryByTestId } = render(
      <RecordingProgressIndicator
        isFirstTrack={true}
        recordingDuration={5200}
        loopDuration={0}
      />
    );

    expect(getByText('00:05.2')).toBeTruthy();
    expect(queryByTestId('progress-bar')).toBeNull(); // No progress bar
  });

  it('renders progress mode for subsequent track', () => {
    const { getByText, getByTestId } = render(
      <RecordingProgressIndicator
        isFirstTrack={false}
        recordingDuration={5200}
        loopDuration={10000}
      />
    );

    expect(getByText(/00:05.2.*00:10.0/)).toBeTruthy(); // Shows both times
    expect(getByTestId('progress-bar')).toBeTruthy();

    const progressBar = getByTestId('progress-bar');
    expect(progressBar.props.progress).toBeCloseTo(0.52, 2); // 52% progress
  });

  it('changes color as loop end approaches', () => {
    const { getByTestId, rerender } = render(
      <RecordingProgressIndicator
        isFirstTrack={false}
        recordingDuration={5000}
        loopDuration={10000}
      />
    );

    // At 50%, normal color
    let progressBar = getByTestId('progress-bar');
    expect(progressBar.props.color).toBe('primary');

    // At 85%, warning color
    rerender(
      <RecordingProgressIndicator
        isFirstTrack={false}
        recordingDuration={8500}
        loopDuration={10000}
      />
    );

    progressBar = getByTestId('progress-bar');
    expect(progressBar.props.color).toBe('warning');

    // At 95%, danger color
    rerender(
      <RecordingProgressIndicator
        isFirstTrack={false}
        recordingDuration={9500}
        loopDuration={10000}
      />
    );

    progressBar = getByTestId('progress-bar');
    expect(progressBar.props.color).toBe('error');
  });

  it('updates smoothly during recording', async () => {
    jest.useFakeTimers();

    const { getByText } = render(
      <RecordingProgressIndicator
        isFirstTrack={true}
        recordingDuration={0}
        loopDuration={0}
      />
    );

    // Initial state
    expect(getByText('00:00.0')).toBeTruthy();

    // Simulate time passing (this test may need adjustment based on actual implementation)
    jest.advanceTimersByTime(1000);

    // Verify time updated
    expect(getByText(/00:01.0/)).toBeTruthy();

    jest.useRealTimers();
  });
});
```

Run tests: `npm test -- RecordingProgressIndicator.test.tsx`

**Commit Message Template**:

```
feat(recording): add progress indicator for loop duration

- Create progress indicator component with timer and progress bar
- Support first track (timer only) and subsequent track (progress + timer) modes
- Add visual cues as loop end approaches (color changes)
- Integrate into recording UI
- Include comprehensive tests
```

**Estimated tokens**: ~15,000

---

### Task 4: Add Optional Count-In or Metronome (OPTIONAL TASK)

**Goal**: Provide optional audio cues (count-in or metronome) to help users record in time with the master loop. This is a nice-to-have feature that enhances usability.

**Note**: This task is **optional**. The core looper workflow functions without metronome support. If skipped, update Task 5 to omit all metronome-related UI and tests.

**Files to Create**:

- `src/services/audio/MetronomeService.ts` - Metronome audio generation and playback
- `src/services/audio/__tests__/MetronomeService.test.ts` - Tests

**Files to Modify**:

- `src/screens/MainScreen/MainScreen.tsx` - Add metronome toggle
- `src/store/useSettingsStore.ts` - Add metronome preference

**Prerequisites**: Tasks 1-3 complete

**Implementation Steps**:

1. Add metronome setting to settings store:
   - `enableMetronome: boolean` (default: false)
   - `metronomeBPM: number` (default: 120 BPM, or calculated from loop)
   - Add to settings screen (Phase 3 settings)

2. Create MetronomeService:
   - Generate click sound (simple beep or tone)
   - Play click at regular intervals based on BPM or loop divisions
   - Start metronome with recording, stop when recording stops
   - Option: Count-in before recording starts (1-2-3-4)

3. Calculate metronome timing:
   - For subsequent tracks, derive BPM from loop duration
   - `BPM = 60000 / (loopDuration / 4)` (assuming 4 beats per loop)
   - Or let user configure beats per loop in settings

4. Implement audio generation:
   - Web: Use OscillatorNode for click sound
   - Native: Use pre-recorded click sound file or synthesize
   - Keep volume adjustable (settings option)

5. Add metronome toggle to recording UI:
   - Small toggle or checkbox near record button
   - Label: "Metronome" or "Click"
   - Only visible for subsequent recordings (not needed for first)

6. Integration:
   - Start metronome when subsequent recording starts
   - Optional: 1-bar count-in before recording
   - Stop metronome when recording stops

7. Write tests:
   - Test metronome starts/stops with recording
   - Test BPM calculation from loop duration
   - Test metronome respects settings
   - Test count-in functionality

**Verification Checklist**:

- [ ] Metronome setting added to settings store
- [ ] MetronomeService generates click sounds
- [ ] Metronome timing calculated from loop duration
- [ ] Metronome toggle visible during subsequent recordings
- [ ] Metronome starts/stops correctly
- [ ] Count-in option works (if implemented)
- [ ] Tests verify functionality

**Testing Instructions**:

```typescript
describe("MetronomeService", () => {
  it("calculates BPM from loop duration", () => {
    const loopDuration = 2400; // 2.4 seconds = 100 BPM (4/4 time)

    const bpm = MetronomeService.calculateBPM(loopDuration, 4);

    expect(bpm).toBeCloseTo(100, 1);
  });

  it("starts metronome when recording subsequent track", async () => {
    useSettingsStore.setState({ enableMetronome: true });
    useTrackStore
      .getState()
      .addTrack(createMockTrack({ duration: 2400, speed: 1.0 }));

    const metronome = new MetronomeService();
    const clickCallback = jest.fn();
    metronome.onClick = clickCallback;

    await metronome.start({ bpm: 100 });

    // Wait for a few clicks
    await new Promise((resolve) => setTimeout(resolve, 1300)); // ~2 clicks at 100 BPM

    expect(clickCallback).toHaveBeenCalledTimes(2);

    metronome.stop();
  });

  it("provides count-in before recording", async () => {
    const metronome = new MetronomeService();
    const countInCallback = jest.fn();

    await metronome.countIn(4, 120, countInCallback); // 4 beats at 120 BPM

    expect(countInCallback).toHaveBeenCalledTimes(4);
  });

  it("respects metronome enabled setting", async () => {
    useSettingsStore.setState({ enableMetronome: false });

    const metronome = new MetronomeService();

    // Attempt to start
    await metronome.start({ bpm: 100 });

    // Should not start
    expect(metronome.isRunning()).toBe(false);
  });
});
```

Run tests: `npm test -- MetronomeService.test.ts`

**Commit Message Template**:

```
feat(recording): add optional metronome for recording in time

- Create metronome service with click generation
- Calculate BPM from loop duration
- Add metronome toggle to recording UI
- Support optional count-in before recording
- Add metronome settings to settings store
- Include comprehensive tests
```

**Estimated tokens**: ~15,000

---

### Task 5: Update Recording UI with Loop Awareness

**Goal**: Refine the overall recording UI to clearly communicate loop behavior and provide all necessary controls and feedback.

**Files to Modify**:

- `src/screens/MainScreen/MainScreen.tsx` - Update recording UI section
- `src/components/ActionButton/ActionButton.tsx` - Update record button states
- Any recording-related components

**Prerequisites**: Tasks 1-3 complete (Task 4 optional - see note below)

**Note**: If Task 4 (Metronome) was skipped, omit all metronome-related UI elements and tests in this task. The core recording workflow does not depend on the metronome feature.

**Implementation Steps**:

1. Update record button states:
   - **Ready to record first track**: Default state, "Record First Loop"
   - **Recording first track**: Animated, "Recording... Stop to set loop length"
   - **Ready to record subsequent**: "Record Overdub"
   - **Recording subsequent**: Animated, "Recording... Auto-stop at loop end"

2. Add instructional text based on context:
   - First track: "Record your first loop. The length you record will be the master loop duration."
   - Subsequent: "Recording will auto-stop after one loop cycle (10.0 seconds)."
   - Make text dynamic based on actual loop duration

3. Ensure progress indicator visible:
   - Positioned prominently
   - Doesn't obscure other controls
   - Clear visual hierarchy

4. Add metronome toggle (from Task 4):
   - Only visible when recording subsequent tracks
   - Positioned near record button or in settings dropdown

5. Handle playback during recording:
   - Option: Auto-play existing tracks when recording subsequent track
   - Helps user stay in sync
   - Add toggle: "Play tracks while recording"

6. Visual polish:
   - Smooth transitions between states
   - Clear affordances for all actions
   - Consistent with app theme
   - Accessible on all screen sizes

7. Write tests:
   - Test UI updates for first track recording
   - Test UI updates for subsequent track recording
   - Test instructional text accuracy
   - Test playback-while-recording toggle

**Verification Checklist**:

- [ ] Record button states clear for all contexts
- [ ] Instructional text helpful and accurate
- [ ] Progress indicator integrated smoothly
- [ ] Metronome toggle accessible
- [ ] Playback-while-recording option available
- [ ] UI polished and accessible
- [ ] Tests verify UI updates correctly

**Testing Instructions**:

```typescript
describe('Recording UI - Loop Awareness', () => {
  it('displays first track recording UI when no tracks exist', () => {
    const { getByText, getByTestId } = render(<MainScreen />);

    expect(getByText(/Record First Loop/i)).toBeTruthy();
    expect(getByText(/will be the master loop duration/i)).toBeTruthy();

    const recordButton = getByTestId('record-button');
    expect(recordButton).toBeTruthy();
  });

  it('displays subsequent track recording UI when tracks exist', () => {
    useTrackStore.getState().addTrack(createMockTrack({ duration: 10000, speed: 1.0 }));

    const { getByText } = render(<MainScreen />);

    expect(getByText(/Record Overdub/i)).toBeTruthy();
    expect(getByText(/auto-stop after one loop cycle/i)).toBeTruthy();
    expect(getByText(/10.0 seconds/i)).toBeTruthy();
  });

  it('shows metronome toggle for subsequent recordings', () => {
    useTrackStore.getState().addTrack(createMockTrack());

    const { getByTestId } = render(<MainScreen />);

    expect(getByTestId('metronome-toggle')).toBeTruthy();
  });

  it('updates UI during recording', async () => {
    const { getByTestId, getByText } = render(<MainScreen />);

    // Start recording
    fireEvent.press(getByTestId('record-button'));

    await waitFor(() => {
      expect(getByText(/Recording.../i)).toBeTruthy();
    });

    // Stop recording
    fireEvent.press(getByTestId('record-button'));

    await waitFor(() => {
      expect(getByText(/Record/i)).toBeTruthy();
    });
  });

  it('auto-plays tracks when recording subsequent track (if enabled)', async () => {
    useTrackStore.getState().addTrack(createMockTrack());
    useSettingsStore.setState({ playWhileRecording: true }); // Hypothetical setting

    const { getByTestId } = render(<MainScreen />);

    fireEvent.press(getByTestId('record-button'));

    await waitFor(() => {
      expect(usePlaybackStore.getState().isAnyPlaying).toBe(true);
    });
  });
});
```

Run tests: `npm test -- MainScreen.test.tsx` (recording sections)

**Commit Message Template**:

```
feat(recording): update UI with comprehensive loop awareness

- Update record button states and labels for context
- Add dynamic instructional text based on recording context
- Integrate progress indicator into recording UI
- Add play-while-recording toggle option
- Polish UI with smooth transitions and clear hierarchy
- Include comprehensive UI tests
```

**Estimated tokens**: ~10,000

---

## Phase Verification

After completing all tasks, verify Phase 5 is complete:

### Automated Verification

```bash
# Run all tests
npm test

# Run only Phase 5 tests
npm test -- recording
npm test -- RecordingProgressIndicator.test.tsx
npm test -- MetronomeService.test.ts

# Check test coverage
npm test -- --coverage
```

**Expected Results**:

- All tests pass
- Code coverage ≥ 80% for new code
- No existing tests broken

### Manual Testing Scenarios

#### Scenario 1: First Track Recording (Master Loop)

1. Open app with no tracks
2. **Verify**: Record button says "Record First Loop"
3. **Verify**: Instructional text explains master loop concept
4. Press record button
5. **Verify**: Recording starts, timer visible (no progress bar)
6. **Verify**: Button says "Recording... Stop to set loop length"
7. Record for ~10 seconds
8. Press stop
9. **Verify**: Track added, master track styling applied
10. **Verify**: Master loop duration = ~10 seconds

#### Scenario 2: Subsequent Track Recording (Auto-Stop)

1. With master track loaded (10 seconds)
2. **Verify**: Record button says "Record Overdub"
3. **Verify**: Instructional text mentions auto-stop and shows loop duration
4. Press record button
5. **Verify**: Progress indicator shows progress through loop (0-10s)
6. **Verify**: Visual cues as loop end approaches (color changes)
7. Wait for auto-stop
8. **Verify**: Recording stops automatically at 10 seconds
9. **Verify**: Message: "Recording complete (1 loop cycle)"
10. **Verify**: New track added

#### Scenario 3: Manual Stop Before Auto-Stop

1. With master track loaded (10 seconds)
2. Start recording subsequent track
3. After 5 seconds, press stop manually
4. **Verify**: Recording stops at ~5 seconds
5. **Verify**: New track added with 5-second duration
6. Press play
7. **Verify**: Short track loops twice during one master loop cycle

#### Scenario 4: Metronome During Recording

1. Navigate to settings
2. Enable metronome
3. Return to main screen
4. With master track loaded
5. **Verify**: Metronome toggle visible
6. Enable metronome toggle
7. Start recording subsequent track
8. **Verify**: Hear metronome clicks in time with loop
9. **Verify**: Progress indicator synced with metronome
10. Stop recording
11. **Verify**: Metronome stops

#### Scenario 5: Count-In Before Recording (Optional)

1. With metronome enabled
2. Enable count-in option (in settings or recording UI)
3. Start recording subsequent track
4. **Verify**: Hear count-in clicks (1-2-3-4)
5. **Verify**: Recording starts after count-in completes
6. **Verify**: Progress indicator shows accurate position

#### Scenario 6: Play While Recording

1. Add multiple tracks
2. Enable "Play while recording" option
3. Start recording subsequent track
4. **Verify**: Existing tracks play during recording
5. **Verify**: Can hear playback mixed with recording input (monitor)
6. **Verify**: Recording captures only new input, not playback (no feedback loop)

#### Scenario 7: Very Short Loop

1. Record first track with 2-second duration
2. Attempt to record subsequent track
3. **Verify**: Progress indicator updates very quickly
4. **Verify**: Auto-stop triggers at 2 seconds
5. **Verify**: Recording successful despite short duration

#### Scenario 8: Recording Workflow Across App Restart

1. Record first track
2. Close app
3. Reopen app
4. **Verify**: Master track restored
5. **Verify**: Master loop styling applied
6. Record subsequent track
7. **Verify**: Auto-stop behavior works correctly

### Integration Points Tested

- ✅ Recording context detection (first vs. subsequent)
- ✅ Auto-stop triggered at loop boundary
- ✅ Progress indicator shows accurate loop progress
- ✅ Metronome synced with loop timing
- ✅ Count-in provides helpful timing cue
- ✅ Recording UI updates based on context
- ✅ Play-while-recording option functional
- ✅ Manual stop works correctly before auto-stop

### Performance Benchmarks

**Critical**: Verify no performance regressions from baseline (pre-looper implementation). Run these benchmarks before and after implementation:

1. **Mixing Performance**
   - **Test**: Mix 4 tracks with 4 loop cycles, each track 10 seconds
   - **Target**: Export completes in < 10 seconds (web), < 15 seconds (native)
   - **Measure**: Time from "Save" button to file written
   - **Verify**: No UI freezing during export

2. **UI Responsiveness During Playback**
   - **Test**: Play 5 tracks simultaneously with loop mode ON
   - **Target**: All progress indicators update at stable 60fps
   - **Measure**: Use browser DevTools Performance tab or React Native performance monitor
   - **Verify**: Frame rate does not drop below 55fps
   - **Verify**: No janky animations or stuttering

3. **Memory Usage**
   - **Test**: Typical session - 5 tracks loaded, 4 loop export, multiple playback cycles
   - **Target**: Memory increase < 50MB from baseline (empty session)
   - **Measure**: Browser DevTools Memory profiler or React Native memory monitor
   - **Verify**: No memory leaks after 10 record/playback/export cycles
   - **Verify**: Memory released after export completes

4. **Recording Auto-Stop Precision**
   - **Test**: Record subsequent track with 10-second loop, measure actual stop time
   - **Target**: Auto-stop within ±100ms of expected time
   - **Measure**: Compare recorded file duration to master loop duration
   - **Verify**: Precision consistent across 5 recordings

5. **Cold Start Time**
   - **Test**: App launch with saved session (5 tracks, settings restored)
   - **Target**: UI interactive in < 3 seconds
   - **Measure**: Time from app launch to first interaction
   - **Verify**: Settings and track state fully hydrated
   - **Verify**: No race conditions or flash of default state

**Comparison**: Run same benchmarks on baseline (pre-looper) build to identify any regressions. If any benchmark fails, investigate and optimize before considering phase complete.

### Known Limitations

- Metronome timing may not be perfectly accurate on all devices (timing limitations)
- Very short loops (<1 second) may not provide enough time for useful recording
- Count-in feature may be basic (could be enhanced with visual cues, accent on downbeat, etc.)
- Play-while-recording may have latency on some devices (monitor mix timing)

---

## Feature Complete!

After Phase 5, the looper normalization feature is complete. All planned functionality has been implemented:

### Implemented Features

✅ **Master Loop Concept**

- First track sets loop length (speed-adjusted)
- Visual indication of master track

✅ **Track Looping**

- Subsequent tracks loop to match master duration
- Seamless repetition with optional crossfade
- Loop mode toggle for preview

✅ **Confirmation Dialogs**

- Changing master speed warns and confirms
- Deleting master track clears all with confirmation

✅ **Settings Page**

- Comprehensive configuration options
- Settings persistence across restarts
- Default values for all looper features

✅ **Enhanced Export**

- Configurable loop count for export
- Configurable fadeout duration
- Progress tracking for longer exports

✅ **Recording Integration**

- First recording sets master loop
- Subsequent recordings auto-stop at loop end
- Progress indicator during recording
- Optional metronome for timing assistance

### Final Testing

Run full test suite:

```bash
npm test
npm test -- --coverage
```

Manual testing: Complete all scenarios from Phases 1-5

### Documentation Updates

Before considering feature complete, update:

1. `README.md` - Add looper feature to feature list
2. `USER_GUIDE.md` - Document looper workflow
3. `DEVELOPER_GUIDE.md` - Architecture and design decisions
4. In-app help (`HelpModal.tsx`) - Looper instructions

### Deployment Preparation

1. Version bump: Update version in `package.json`
2. Changelog: Document new feature and changes
3. Migration guide: Help existing users understand new behavior
4. Performance testing: Ensure no regressions
5. Cross-platform testing: Verify on web, Android, iOS

---

## Congratulations!

You've successfully implemented the looper normalization feature, transforming the audio mixing app into a true looper machine. The feature provides intuitive, professional-grade looping functionality that matches hardware loopers while leveraging the advantages of a software platform.

**Next possible enhancements** (out of scope, future work):

- MIDI clock sync for external timing
- Multiple loop layers with independent loop lengths
- Loop quantization (snap to beat)
- Advanced metronome (accent patterns, time signatures)
- Undo/redo for track operations
- Session templates (preset loop structures)
- Collaborative looping (multiple users)
