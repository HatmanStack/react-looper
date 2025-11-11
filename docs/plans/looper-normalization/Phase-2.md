# Phase 2: UI Components & Visual Indicators

## Phase Goal

Build user-facing UI components that make the looping functionality visible and controllable. Add master track visual styling, a global loop mode toggle, confirmation dialogs for destructive actions, and per-track playback indicators. This phase makes Phase 1's logic accessible to users.

**Success Criteria**:
- Master track has distinct visual styling
- Loop mode toggle button functional and accessible
- Confirmation dialogs prevent accidental destructive actions
- Per-track playback indicators show loop progress
- All components tested with React Native Testing Library
- UI works on web and mobile platforms

**Estimated tokens**: ~90,000

---

## Prerequisites

- Phase 0 reviewed
- Phase 1 complete and all tests passing
- Familiarity with React Native Paper components
- Understanding of React Native Testing Library

---

## Tasks

### Task 1: Update Track List Item Styling for Master Track

**Goal**: Apply distinct visual styling to the master track so users can immediately identify which track sets the loop length.

**Files to Modify**:
- `src/components/TrackListItem/TrackListItem.tsx` - Add master track detection and conditional styling
- `src/components/TrackListItem/TrackListItem.styles.ts` - Add master track styles
- `src/components/TrackListItem/__tests__/TrackListItem.test.tsx` - Create if missing, add tests

**Prerequisites**: Phase 1 Task 3 (track store with master track methods)

**Implementation Steps**:

1. In `TrackListItem.tsx`:
   - Import `useTrackStore` and `isMasterTrack` helper
   - Detect if current track is master: `const isMaster = useTrackStore(state => state.isMasterTrack(track.id))`
   - Apply conditional styles based on `isMaster` flag

2. In `TrackListItem.styles.ts`:
   - Define `masterTrackContainer` style:
     - Border: 3px solid primary color
     - Background: primaryContainer (subtle tint)
     - Optional: subtle shadow or elevation
   - Ensure styles work with both light and dark themes
   - Use theme colors from React Native Paper

3. Add accessibility properties:
   - `accessibilityLabel`: Include "Master loop track" in label when applicable
   - `accessibilityHint`: "This track sets the loop length for all tracks"

4. Test that styling doesn't break existing layout:
   - Check on different screen sizes
   - Verify spacing and alignment maintained
   - Ensure other track controls (sliders, buttons) still accessible

5. Write component tests:
   - Test master track renders with correct styles
   - Test non-master track renders without special styles
   - Test accessibility labels
   - Test theme compatibility (if theme switching exists)

**Verification Checklist**:
- [ ] Master track has visible distinct styling
- [ ] Styling works in light and dark themes
- [ ] Layout not broken on small screens
- [ ] All interactive elements still accessible
- [ ] Accessibility labels correct
- [ ] Tests verify conditional styling

**Testing Instructions**:

```typescript
describe('TrackListItem - master track styling', () => {
  it('applies master track styling when track is first', () => {
    const tracks = [
      createMockTrack({ id: 'track-1', name: 'Master Track' }),
      createMockTrack({ id: 'track-2', name: 'Track 2' }),
    ];

    // Mock store to return tracks
    useTrackStore.setState({ tracks });

    const { getByTestId } = render(<TrackListItem track={tracks[0]} />);

    const container = getByTestId('track-list-item-track-1');

    // Verify master track styles applied
    expect(container.props.style).toMatchObject({
      borderWidth: 3,
      borderColor: expect.any(String), // Primary color
    });
  });

  it('does not apply master track styling to non-master tracks', () => {
    const tracks = [
      createMockTrack({ id: 'track-1', name: 'Master Track' }),
      createMockTrack({ id: 'track-2', name: 'Track 2' }),
    ];

    useTrackStore.setState({ tracks });

    const { getByTestId } = render(<TrackListItem track={tracks[1]} />);

    const container = getByTestId('track-list-item-track-2');

    // Verify standard styling
    expect(container.props.style.borderWidth).not.toBe(3);
  });

  it('includes accessibility label for master track', () => {
    const tracks = [createMockTrack({ id: 'track-1', name: 'Master Track' })];
    useTrackStore.setState({ tracks });

    const { getByLabelText } = render(<TrackListItem track={tracks[0]} />);

    expect(getByLabelText(/Master loop track/i)).toBeTruthy();
  });
});
```

Run tests: `npm test -- TrackListItem.test.tsx`

**Commit Message Template**:
```
feat(ui): add master track visual styling

- Apply distinct border and background to master track
- Add accessibility labels for master track
- Include theme-aware styling
- Add component tests for conditional styling
```

**Estimated tokens**: ~12,000

---

### Task 2: Create Loop Mode Toggle Component

**Goal**: Build a toggle button that controls the global loop mode, positioned near the main playback controls.

**Files to Create**:
- `src/components/LoopModeToggle/LoopModeToggle.tsx` - Toggle component
- `src/components/LoopModeToggle/LoopModeToggle.styles.ts` - Styles
- `src/components/LoopModeToggle/__tests__/LoopModeToggle.test.tsx` - Tests
- `src/components/LoopModeToggle/index.ts` - Re-export

**Files to Modify**:
- `src/screens/MainScreen/MainScreen.tsx` - Add toggle to playback controls
- `src/components/index.ts` - Export new component

**Prerequisites**: Phase 1 Task 4 (playback store with loop mode)

**Implementation Steps**:

1. Create `LoopModeToggle` component:
   - Use React Native Paper's `IconButton` or `ToggleButton`
   - Connect to playback store: `const { loopMode, toggleLoopMode } = usePlaybackStore()`
   - Icon: Loop icon when ON, crossed-out loop when OFF (or use color to indicate state)
   - Label: "Loop Mode" with status (ON/OFF)

2. Visual design:
   - Active state: Primary color
   - Inactive state: Neutral/gray color
   - Clear visual distinction between states
   - Tooltip/label visible on hover (web) or long press (mobile)

3. Add to MainScreen:
   - Position near play/pause button
   - Ensure proper spacing and alignment
   - Responsive layout (adjust for different screen sizes)

4. Accessibility:
   - `accessibilityRole="switch"`
   - `accessibilityState={{ checked: loopMode }}`
   - `accessibilityLabel="Loop mode toggle"`
   - `accessibilityHint="When enabled, tracks will loop to match the master loop duration"`

5. Add visual feedback:
   - Ripple effect on press (Android)
   - Haptic feedback on toggle (mobile)
   - Animation on state change (optional, but nice)

6. Write component tests:
   - Test rendering in both states
   - Test toggle action
   - Test store integration
   - Test accessibility properties

**Verification Checklist**:
- [ ] Toggle button visible and clearly indicates state
- [ ] Clicking/tapping toggles loop mode in store
- [ ] Visual feedback on interaction
- [ ] Accessibility properties correct
- [ ] Works on web and mobile
- [ ] Tests cover functionality and accessibility

**Testing Instructions**:

```typescript
describe('LoopModeToggle', () => {
  beforeEach(() => {
    usePlaybackStore.getState().reset();
  });

  it('renders with correct initial state', () => {
    usePlaybackStore.setState({ loopMode: true });

    const { getByTestId } = render(<LoopModeToggle />);
    const toggle = getByTestId('loop-mode-toggle');

    expect(toggle.props.accessibilityState.checked).toBe(true);
  });

  it('toggles loop mode when pressed', () => {
    usePlaybackStore.setState({ loopMode: false });

    const { getByTestId } = render(<LoopModeToggle />);
    const toggle = getByTestId('loop-mode-toggle');

    fireEvent.press(toggle);

    expect(usePlaybackStore.getState().loopMode).toBe(true);
  });

  it('has correct accessibility properties', () => {
    const { getByTestId } = render(<LoopModeToggle />);
    const toggle = getByTestId('loop-mode-toggle');

    expect(toggle.props.accessibilityRole).toBe('switch');
    expect(toggle.props.accessibilityLabel).toContain('Loop mode');
  });

  it('updates visual state when loop mode changes externally', () => {
    const { getByTestId, rerender } = render(<LoopModeToggle />);

    // Change loop mode via store (not via UI)
    usePlaybackStore.getState().setLoopMode(true);
    rerender(<LoopModeToggle />);

    const toggle = getByTestId('loop-mode-toggle');
    expect(toggle.props.accessibilityState.checked).toBe(true);
  });
});
```

Run tests: `npm test -- LoopModeToggle.test.tsx`

**Commit Message Template**:
```
feat(ui): add loop mode toggle button

- Create toggle component for global loop mode
- Integrate with playback store
- Add to main screen playback controls
- Include accessibility support
- Add comprehensive component tests
```

**Estimated tokens**: ~15,000

---

### Task 3: Create Confirmation Dialog Component

**Goal**: Build a reusable confirmation dialog component for destructive actions (changing master track speed, deleting master track).

**Files to Create**:
- `src/components/ConfirmationDialog/ConfirmationDialog.tsx` - Dialog component
- `src/components/ConfirmationDialog/ConfirmationDialog.styles.ts` - Styles (if needed)
- `src/components/ConfirmationDialog/__tests__/ConfirmationDialog.test.tsx` - Tests
- `src/components/ConfirmationDialog/index.ts` - Re-export

**Files to Modify**:
- `src/components/index.ts` - Export new component

**Prerequisites**: None (standalone component)

**Implementation Steps**:

1. Create `ConfirmationDialog` component using React Native Paper's `Dialog`:
   - Props:
     - `visible: boolean` - Dialog visibility
     - `title: string` - Dialog title
     - `message: string` - Explanation message
     - `onConfirm: () => void` - Confirm callback
     - `onCancel: () => void` - Cancel callback
     - `confirmLabel?: string` - Confirm button text (default: "Confirm")
     - `cancelLabel?: string` - Cancel button text (default: "Cancel")
     - `destructive?: boolean` - If true, confirm button is red/warning color

2. Design:
   - Title: Bold, larger text
   - Message: Regular text, supports multiple lines
   - Buttons: Cancel (left/bottom), Confirm (right/top)
   - Destructive confirm button: Red/warning color
   - Non-destructive: Primary color
   - Cancel button: Secondary/neutral color

3. Behavior:
   - Clicking outside dialog dismisses it (calls onCancel)
   - Escape key cancels (web)
   - Confirm/Cancel buttons execute callbacks and close dialog
   - Support keyboard navigation (web)

4. Accessibility:
   - `accessibilityRole="alertdialog"`
   - Focus management: trap focus inside dialog when open
   - Screen reader announces title and message
   - Buttons have clear labels

5. Write component tests:
   - Test rendering with various prop combinations
   - Test confirm button callback
   - Test cancel button callback
   - Test destructive styling
   - Test accessibility properties

**Verification Checklist**:
- [ ] Dialog renders correctly with title and message
- [ ] Confirm and cancel buttons work
- [ ] Destructive styling applied when appropriate
- [ ] Dialog dismisses after action
- [ ] Accessibility properties correct
- [ ] Works on web and mobile
- [ ] Tests cover all prop variations

**Testing Instructions**:

```typescript
describe('ConfirmationDialog', () => {
  it('renders with title and message', () => {
    const { getByText } = render(
      <ConfirmationDialog
        visible={true}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(getByText('Confirm Action')).toBeTruthy();
    expect(getByText('Are you sure?')).toBeTruthy();
  });

  it('calls onConfirm when confirm button pressed', () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
      <ConfirmationDialog
        visible={true}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );

    fireEvent.press(getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button pressed', () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <ConfirmationDialog
        visible={true}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.press(getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('applies destructive styling when destructive prop is true', () => {
    const { getByText } = render(
      <ConfirmationDialog
        visible={true}
        title="Delete Item"
        message="This cannot be undone"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        destructive={true}
      />
    );

    const confirmButton = getByText('Confirm').parent;
    // Check that button has error/warning color
    expect(confirmButton.props.buttonColor).toMatch(/error|warning|danger/i);
  });

  it('uses custom button labels when provided', () => {
    const { getByText } = render(
      <ConfirmationDialog
        visible={true}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        confirmLabel="Yes, continue"
        cancelLabel="No, go back"
      />
    );

    expect(getByText('Yes, continue')).toBeTruthy();
    expect(getByText('No, go back')).toBeTruthy();
  });
});
```

Run tests: `npm test -- ConfirmationDialog.test.tsx`

**Commit Message Template**:
```
feat(ui): create reusable confirmation dialog component

- Implement dialog with title, message, and action buttons
- Support destructive and non-destructive variants
- Add accessibility support and focus management
- Include comprehensive component tests
```

**Estimated tokens**: ~14,000

---

### Task 4: Add Confirmation for Master Track Speed Changes

**Goal**: Show a confirmation dialog when the user changes the master track's speed while other tracks exist, warning that this will affect all tracks.

**Files to Modify**:
- `src/components/SpeedSlider/SpeedSlider.tsx` - Add confirmation logic
- `src/screens/MainScreen/MainScreen.tsx` - Manage confirmation dialog state
- `src/components/SpeedSlider/__tests__/SpeedSlider.test.tsx` - Add tests for confirmation

**Prerequisites**: Tasks 1 and 3 complete

**Implementation Steps**:

1. In MainScreen or appropriate parent component:
   - Add state for confirmation dialog visibility and pending speed change
   - Add state to track which track is having speed changed
   - Render ConfirmationDialog component

2. In SpeedSlider (or where speed changes are handled):
   - Before applying speed change, check if track is master
   - Check if other tracks exist
   - If both conditions true, show confirmation dialog instead of applying immediately
   - Store pending speed value

3. Confirmation dialog props:
   - Title: "Change Master Loop Speed?"
   - Message: "This track sets the loop length. Changing its speed will affect how all other tracks loop. Continue?"
   - Destructive: false (not truly destructive, just potentially disruptive)
   - Confirm label: "Change Speed"
   - Cancel label: "Cancel"

4. On confirm:
   - Apply the pending speed change
   - Close dialog

5. On cancel:
   - Revert speed slider to previous value (if needed)
   - Close dialog

6. Write tests:
   - Test that changing master speed with no other tracks applies immediately
   - Test that changing master speed with other tracks shows dialog
   - Test that changing non-master track speed never shows dialog
   - Test confirm applies speed change
   - Test cancel reverts speed change

**Verification Checklist**:
- [ ] Dialog appears when changing master speed with other tracks
- [ ] Dialog does not appear for non-master tracks
- [ ] Dialog does not appear if master is only track
- [ ] Confirm applies speed change correctly
- [ ] Cancel reverts UI to previous speed
- [ ] Tests cover all scenarios

**Testing Instructions**:

```typescript
describe('SpeedSlider - master track confirmation', () => {
  it('shows confirmation when changing master track speed with other tracks', () => {
    const tracks = [
      createMockTrack({ id: 'track-1', speed: 1.0 }),
      createMockTrack({ id: 'track-2', speed: 1.0 }),
    ];
    useTrackStore.setState({ tracks });

    const { getByTestId, getByText } = render(
      <MainScreen /> // Or whatever component contains SpeedSlider
    );

    // Find speed slider for track-1 (master)
    const slider = getByTestId('speed-slider-track-1');

    // Change speed
    fireEvent(slider, 'valueChange', 1.5);

    // Verify confirmation dialog appeared
    expect(getByText('Change Master Loop Speed?')).toBeTruthy();
  });

  it('does not show confirmation when changing master speed with no other tracks', () => {
    const tracks = [createMockTrack({ id: 'track-1', speed: 1.0 })];
    useTrackStore.setState({ tracks });

    const { getByTestId, queryByText } = render(<MainScreen />);

    const slider = getByTestId('speed-slider-track-1');
    fireEvent(slider, 'valueChange', 1.5);

    // Speed applied immediately, no dialog
    expect(queryByText('Change Master Loop Speed?')).toBeNull();
    expect(useTrackStore.getState().tracks[0].speed).toBe(1.5);
  });

  it('applies speed change when confirmation accepted', () => {
    const tracks = [
      createMockTrack({ id: 'track-1', speed: 1.0 }),
      createMockTrack({ id: 'track-2', speed: 1.0 }),
    ];
    useTrackStore.setState({ tracks });

    const { getByTestId, getByText } = render(<MainScreen />);

    // Change master speed
    const slider = getByTestId('speed-slider-track-1');
    fireEvent(slider, 'valueChange', 1.5);

    // Confirm
    fireEvent.press(getByText('Change Speed'));

    // Verify speed applied
    expect(useTrackStore.getState().tracks[0].speed).toBe(1.5);
  });

  it('reverts speed change when confirmation cancelled', () => {
    const tracks = [
      createMockTrack({ id: 'track-1', speed: 1.0 }),
      createMockTrack({ id: 'track-2', speed: 1.0 }),
    ];
    useTrackStore.setState({ tracks });

    const { getByTestId, getByText } = render(<MainScreen />);

    // Change master speed
    const slider = getByTestId('speed-slider-track-1');
    fireEvent(slider, 'valueChange', 1.5);

    // Cancel
    fireEvent.press(getByText('Cancel'));

    // Verify speed NOT applied
    expect(useTrackStore.getState().tracks[0].speed).toBe(1.0);
  });
});
```

Run tests: `npm test -- SpeedSlider.test.tsx`

**Commit Message Template**:
```
feat(ui): add confirmation for master track speed changes

- Show dialog when changing master speed with other tracks present
- Implement confirm/cancel logic
- Add tests for confirmation workflow
- Improve UX by preventing accidental loop disruption
```

**Estimated tokens**: ~16,000

---

### Task 5: Add Confirmation for Master Track Deletion

**Goal**: Show a confirmation dialog when the user attempts to delete the master track, warning that all tracks will be cleared.

**Files to Modify**:
- `src/components/TrackListItem/TrackListItem.tsx` - Add confirmation logic for delete
- `src/screens/MainScreen/MainScreen.tsx` - Manage delete confirmation dialog
- `src/components/TrackListItem/__tests__/TrackListItem.test.tsx` - Add tests

**Prerequisites**: Task 3 complete

**Implementation Steps**:

1. In MainScreen or appropriate parent:
   - Add state for delete confirmation dialog
   - Add state to track which track is pending deletion
   - Render separate ConfirmationDialog for delete action

2. In TrackListItem delete handler (or wherever track deletion is triggered):
   - Before deleting, check if track is master
   - If true, show confirmation dialog instead of deleting immediately
   - Store pending track ID

3. Confirmation dialog props:
   - Title: "Delete Master Track?"
   - Message: "This track sets the loop length. Deleting it will clear all tracks and start fresh. This cannot be undone."
   - Destructive: true (this IS truly destructive)
   - Confirm label: "Delete All Tracks"
   - Cancel label: "Cancel"

4. On confirm:
   - Remove the master track (which triggers auto-clear in store from Phase 1)
   - Close dialog

5. On cancel:
   - Close dialog, no action

6. Write tests:
   - Test deleting master track shows confirmation
   - Test deleting non-master track deletes immediately without confirmation
   - Test confirm clears all tracks
   - Test cancel preserves all tracks

**Verification Checklist**:
- [ ] Dialog appears when deleting master track
- [ ] Dialog does not appear for non-master tracks
- [ ] Confirm clears all tracks correctly
- [ ] Cancel preserves tracks
- [ ] Destructive styling applied to confirm button
- [ ] Tests cover all scenarios

**Testing Instructions**:

```typescript
describe('TrackListItem - master track deletion confirmation', () => {
  it('shows confirmation when deleting master track', () => {
    const tracks = [
      createMockTrack({ id: 'track-1' }),
      createMockTrack({ id: 'track-2' }),
    ];
    useTrackStore.setState({ tracks });

    const { getByTestId, getByText } = render(<MainScreen />);

    // Find and press delete button for master track
    const deleteButton = getByTestId('delete-button-track-1');
    fireEvent.press(deleteButton);

    // Verify confirmation dialog appeared
    expect(getByText('Delete Master Track?')).toBeTruthy();
    expect(getByText(/clear all tracks/i)).toBeTruthy();
  });

  it('does not show confirmation when deleting non-master track', () => {
    const tracks = [
      createMockTrack({ id: 'track-1' }),
      createMockTrack({ id: 'track-2' }),
    ];
    useTrackStore.setState({ tracks });

    const { getByTestId, queryByText } = render(<MainScreen />);

    // Delete non-master track
    const deleteButton = getByTestId('delete-button-track-2');
    fireEvent.press(deleteButton);

    // No dialog, track deleted immediately
    expect(queryByText('Delete Master Track?')).toBeNull();
    expect(useTrackStore.getState().tracks).toHaveLength(1);
    expect(useTrackStore.getState().tracks[0].id).toBe('track-1');
  });

  it('clears all tracks when deletion confirmed', () => {
    const tracks = [
      createMockTrack({ id: 'track-1' }),
      createMockTrack({ id: 'track-2' }),
    ];
    useTrackStore.setState({ tracks });

    const { getByTestId, getByText } = render(<MainScreen />);

    // Delete master track
    const deleteButton = getByTestId('delete-button-track-1');
    fireEvent.press(deleteButton);

    // Confirm deletion
    fireEvent.press(getByText('Delete All Tracks'));

    // Verify all tracks cleared
    expect(useTrackStore.getState().tracks).toHaveLength(0);
  });

  it('preserves tracks when deletion cancelled', () => {
    const tracks = [
      createMockTrack({ id: 'track-1' }),
      createMockTrack({ id: 'track-2' }),
    ];
    useTrackStore.setState({ tracks });

    const { getByTestId, getByText } = render(<MainScreen />);

    // Attempt to delete master track
    const deleteButton = getByTestId('delete-button-track-1');
    fireEvent.press(deleteButton);

    // Cancel
    fireEvent.press(getByText('Cancel'));

    // Verify tracks preserved
    expect(useTrackStore.getState().tracks).toHaveLength(2);
  });
});
```

Run tests: `npm test -- TrackListItem.test.tsx`

**Commit Message Template**:
```
feat(ui): add confirmation for master track deletion

- Show dialog warning that all tracks will be cleared
- Implement confirm/cancel logic
- Add destructive styling to confirm button
- Add tests for deletion workflow
```

**Estimated tokens**: ~15,000

---

### Task 6: Add Per-Track Playback Indicators

**Goal**: Display a progress bar on each track showing its current playback position, helping users visualize loop boundaries.

**Files to Create/Modify**:
- `src/components/TrackProgressBar/TrackProgressBar.tsx` - Create progress bar component
- `src/components/TrackProgressBar/TrackProgressBar.styles.ts` - Styles
- `src/components/TrackProgressBar/__tests__/TrackProgressBar.test.tsx` - Tests
- `src/components/TrackProgressBar/index.ts` - Re-export
- `src/components/TrackListItem/TrackListItem.tsx` - Integrate progress bar
- `src/components/index.ts` - Export new component

**Prerequisites**: Phase 1 complete (uses loop engine to calculate positions)

**Implementation Steps**:

1. Create `TrackProgressBar` component:
   - Props:
     - `trackId: string` - Track to show progress for
     - `isPlaying: boolean` - Whether playback is active
   - Use React Native Paper's `ProgressBar` or custom view
   - Update progress at 60fps during playback using `requestAnimationFrame` or interval

2. Progress calculation:
   - Get current playback position from audio player service
   - Calculate progress: `(currentPosition % trackDuration) / trackDuration`
   - Handle looping: progress resets to 0 when track loops

3. Update mechanism:
   - **Web**: Use `requestAnimationFrame` for smooth 60fps updates
   - **Native**: Use React Native Reanimated for native 60fps animations
   - **Fallback**: `setInterval` with 16ms interval (~60fps) if Reanimated unavailable
   - Clean up animation loop on unmount or when playback stops

4. Visual design:
   - Thin horizontal bar (2-4px height)
   - Progress color: Primary or accent color
   - Background: Light gray or transparent
   - Optional: Flash/pulse animation on loop restart

5. Performance optimization:
   - Only update when playing
   - Use `useCallback` for update function
   - Clean up interval/animation frame on unmount
   - Throttle updates if needed (60fps should be fine)

6. Integrate into TrackListItem:
   - Add progress bar below track controls
   - Ensure it doesn't interfere with layout
   - Test on various screen sizes

7. Accessibility:
   - `accessibilityLabel`: "Playback progress" (updates not necessary, visual indicator only)
   - Consider adding percentage for screen readers (optional)

8. Write tests:
   - Test progress updates during playback
   - Test progress resets on loop
   - Test no updates when paused
   - Test cleanup on unmount

**Verification Checklist**:
- [ ] Progress bar visible on all tracks
- [ ] Progress updates smoothly during playback
- [ ] Progress resets correctly at loop boundaries
- [ ] No performance issues or memory leaks
- [ ] Works on web and mobile
- [ ] Tests cover playback and loop scenarios

**Testing Instructions**:

```typescript
describe('TrackProgressBar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders progress bar with initial progress', () => {
    const { getByTestId } = render(
      <TrackProgressBar trackId="track-1" isPlaying={false} />
    );

    const progressBar = getByTestId('track-progress-bar-track-1');
    expect(progressBar).toBeTruthy();
  });

  it('updates progress during playback', async () => {
    // Mock audio player to return increasing position
    const mockPlayer = {
      getPosition: jest.fn()
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(2000),
    };

    const { getByTestId } = render(
      <TrackProgressBar trackId="track-1" isPlaying={true} />
    );

    // Fast-forward time
    jest.advanceTimersByTime(100);

    // Verify progress updated
    // Note: actual assertion depends on your implementation
    // You may need to check internal state or mock the ProgressBar component
  });

  it('stops updating when playback paused', () => {
    const { rerender } = render(
      <TrackProgressBar trackId="track-1" isPlaying={true} />
    );

    // Initially playing
    expect(/* some timer/interval to be set */).toBeTruthy();

    // Pause
    rerender(<TrackProgressBar trackId="track-1" isPlaying={false} />);

    // Verify updates stopped
    expect(/* timer/interval to be cleared */).toBeTruthy();
  });

  it('cleans up on unmount', () => {
    const { unmount } = render(
      <TrackProgressBar trackId="track-1" isPlaying={true} />
    );

    unmount();

    // Verify no memory leaks (timers cleared, listeners removed)
    expect(/* timers cleared */).toBeTruthy();
  });
});
```

Run tests: `npm test -- TrackProgressBar.test.tsx`

**Commit Message Template**:
```
feat(ui): add per-track playback progress indicators

- Create progress bar component showing playback position
- Update progress at 60fps during playback
- Handle loop boundary resets
- Integrate into track list items
- Add performance optimizations and cleanup
- Include component tests
```

**Estimated tokens**: ~18,000

---

## Phase Verification

After completing all tasks, verify Phase 2 is complete:

### Automated Verification
```bash
# Run all tests
npm test

# Run only Phase 2 tests
npm test -- TrackListItem.test.tsx
npm test -- LoopModeToggle.test.tsx
npm test -- ConfirmationDialog.test.tsx
npm test -- SpeedSlider.test.tsx
npm test -- TrackProgressBar.test.tsx

# Check test coverage
npm test -- --coverage
```

**Expected Results**:
- All tests pass
- Code coverage ≥ 80% for new code
- No existing tests broken

### Manual Testing Scenarios

#### Scenario 1: Master Track Visual Indication
1. Open app
2. Record or import first track
3. **Verify**: Track has distinct border/background (master styling)
4. Add second track
5. **Verify**: First track still has master styling, second track has normal styling
6. **Verify**: Accessibility labels include "Master loop track" for first track

#### Scenario 2: Loop Mode Toggle
1. Open app with tracks loaded
2. Press play
3. **Verify**: Loop mode toggle button visible near play controls
4. **Verify**: Toggle indicates current state (ON by default)
5. Tap toggle to turn OFF
6. **Verify**: Visual state changes
7. **Verify**: Store state updated (check in dev tools or console)
8. Tap toggle to turn ON again
9. **Verify**: State reverts correctly

#### Scenario 3: Master Speed Change Confirmation
1. Add first track (master)
2. Add second track
3. Adjust master track speed slider
4. **Verify**: Confirmation dialog appears
5. **Verify**: Dialog message mentions affecting all tracks
6. Cancel dialog
7. **Verify**: Speed reverts to original value
8. Adjust master speed again
9. Confirm dialog
10. **Verify**: Speed change applied
11. **Verify**: Loop duration recalculated (visible in dev tools)
12. Adjust second track speed (non-master)
13. **Verify**: No confirmation dialog, speed changes immediately

#### Scenario 4: Master Track Deletion Confirmation
1. Add multiple tracks
2. Tap delete button on first track (master)
3. **Verify**: Confirmation dialog appears
4. **Verify**: Dialog message warns all tracks will be cleared
5. **Verify**: Confirm button has destructive styling (red)
6. Cancel dialog
7. **Verify**: All tracks preserved
8. Tap delete on first track again
9. Confirm dialog
10. **Verify**: All tracks cleared
11. Add multiple tracks again
12. Tap delete on second track (non-master)
13. **Verify**: No confirmation dialog
14. **Verify**: Only that track deleted

#### Scenario 5: Playback Progress Indicators
1. Add tracks
2. Press play
3. **Verify**: Progress bars visible on all tracks
4. **Verify**: Progress bars move smoothly during playback
5. Let tracks loop
6. **Verify**: Progress bars reset at loop boundaries
7. Pause playback
8. **Verify**: Progress bars stop updating
9. Resume playback
10. **Verify**: Progress bars resume from correct position

### Integration Points Tested

- ✅ Master track styling applied based on store state
- ✅ Loop mode toggle controls playback store
- ✅ Confirmation dialogs prevent destructive actions
- ✅ Speed changes integrate with master track detection
- ✅ Track deletion integrates with confirmation flow
- ✅ Progress indicators sync with audio playback

### Known Limitations (to be addressed in later phases)

- Loop mode toggle doesn't affect audio playback yet (audio engine update in Phase 5)
- Settings page doesn't exist to configure defaults (Phase 3)
- Save/export doesn't use loop repetitions yet (Phase 4)
- Recording doesn't respect loop boundaries yet (Phase 5)
- Progress indicators may not be perfectly accurate on mobile (platform-specific timing differences)

---

## Next Steps

Proceed to **Phase 3: Settings Page & Configuration** to build the settings screen where users can configure looping behavior and export options.

**Phase 3 Preview**:
- Settings screen navigation
- Looping behavior settings
- Export default settings
- Recording default settings
- Settings persistence and migration
- Settings page tests
