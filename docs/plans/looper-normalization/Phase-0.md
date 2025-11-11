# Phase 0: Foundation - Architecture & Design Decisions

This document contains architecture decisions, design patterns, and conventions that apply to ALL phases of the looper normalization feature. Read this carefully before starting any phase.

---

## Architecture Decision Records (ADRs)

### ADR-001: Master Loop Track Model

**Decision**: The first track in the tracks array is always the master loop track.

**Rationale**:
- Simple and predictable: position-based selection eliminates ambiguity
- Matches typical looper machine behavior (first recording sets the loop)
- No need for complex track reordering or manual master selection
- Easy to implement and test

**Implications**:
- Tracks array must maintain insertion order
- Deleting first track requires clearing all tracks (with confirmation)
- No drag-and-drop reordering needed
- Master track determined by `tracks[0]`

**Implementation Notes**:
- Use `tracks[0]?.id` to get master track ID
- Always check `tracks.length > 0` before accessing master track
- Master track duration = `tracks[0].duration * tracks[0].speed`

---

### ADR-002: Speed-Adjusted Loop Duration

**Decision**: Master loop duration is calculated using the track's speed-adjusted playback duration, not original file duration.

**Rationale**:
- Matches user expectation: what you hear is what you get
- Aligns with hardware looper behavior
- Allows musical manipulation (slow down a phrase to create a longer loop)
- More intuitive than hidden "original" duration

**Formula**:
```typescript
masterLoopDuration = tracks[0].duration / tracks[0].speed
```

**Example**:
- Track 1: 10 seconds original, speed 0.5x
- Master loop duration: 10 / 0.5 = 20 seconds
- Track 2: 15 seconds original, speed 1.0x
- Track 2 plays: 15s, then loops for 5s (total 20s)

---

### ADR-003: Seamless Loop Repetition

**Decision**: Shorter tracks loop continuously (seamless repetition) without regard to master loop boundaries.

**Rationale**:
- Standard looper machine behavior
- Enables musical patterns (4-bar bass over 8-bar drums)
- Simpler implementation than time-stretching or quantization
- No pitch/tempo artifacts

**Example**:
- Master loop: 12 seconds
- Track 2: 5 seconds (speed-adjusted)
- Playback: 5s → 5s → 2s → (loop boundary) → 5s → 5s → 2s...

**Implementation**: Audio players handle native looping, mixer duplicates audio data as needed for export.

---

### ADR-004: Loop Mode Toggle (Global)

**Decision**: Single global toggle for loop preview mode, not per-track toggles.

**Rationale**:
- Simpler UX: one button near play controls
- Matches looper behavior (all tracks loop together or not at all)
- Avoids complex per-track state management
- Clear mental model for users

**States**:
- **Loop Mode ON**: Tracks loop during playback (preview of exported audio)
- **Loop Mode OFF**: Tracks play once then stop (inspection mode)

**Default**: Loop Mode ON (typical looper behavior)

---

### ADR-005: Confirmation Dialogs for Destructive Actions

**Decision**: Show confirmation dialogs before:
1. Changing master track speed (when other tracks exist)
2. Deleting master track

**Rationale**:
- Prevents accidental loss of work
- Changing master speed recalculates all loop boundaries (potentially destructive)
- Deleting master track clears entire session (highly destructive)

**Dialog Pattern**:
```
Title: [Action] will affect all tracks
Message: This will [consequence]. Continue?
Buttons: Cancel | Confirm
```

**No confirmation needed for**:
- Changing non-master track properties
- Deleting non-master tracks
- Adding tracks

---

### ADR-006: Settings Page Organization

**Decision**: Create a dedicated Settings screen accessible from main screen, organized into logical sections.

**Sections**:
1. **Looping Behavior**
   - Crossfade duration (0-50ms slider, default: 0ms = gapless)
   - Default loop mode (ON/OFF, default: ON)

2. **Export Settings**
   - Default loop count (1, 2, 4, 8, custom)
   - Default fadeout duration (None, 1s, 2s, 5s, custom)
   - Default format (MP3/WAV)
   - Default quality (Low/Medium/High)

3. **Recording Settings**
   - Default format
   - Default quality
   - Sample rate
   - Bit rate

4. **UI Preferences** (future expansion)
   - Theme
   - Track display options

**Storage**: Use Zustand persist middleware (platform-specific implementation)

---

### ADR-007: Master Track Visual Styling

**Decision**: Master track has distinct border and background styling, no icon/badge needed.

**Styling**:
```typescript
masterTrackStyle = {
  borderColor: theme.colors.primary, // Distinct primary color border
  borderWidth: 3, // Thicker than normal tracks (2px)
  backgroundColor: theme.colors.primaryContainer, // Subtle tint
}
```

**Rationale**:
- Clean, professional appearance
- No additional UI elements needed
- Works across all screen sizes
- Leverages existing Material Design 3 theme colors

---

### ADR-008: Per-Track Playback Indicators

**Decision**: Each track displays a progress bar showing its current playback position within its own duration.

**Rationale**:
- Helps users understand loop restart points
- Useful for debugging sync issues
- Provides visual feedback during playback

**Implementation**:
- Linear progress bar beneath each track
- Updates at 60fps during playback
- Shows position relative to track's speed-adjusted duration
- Visual indicator when loop restarts (brief flash or color change)

---

### ADR-009: Track Selection Removal

**Decision**: Remove the `selected` property and related UI from Track interface.

**Context**: The `selected` property was previously used for selective mixing, where only selected tracks would be included in the exported mix. Users could toggle tracks on/off for export.

**Rationale**:
- Not needed for looper workflow (all tracks always mix together)
- Looper paradigm expects all recorded layers to play simultaneously
- Simplifies UI and reduces confusion
- Aligns with hardware looper behavior (no track selection concept)

**Migration**: Store migration to remove `selected` from existing tracks

---

### ADR-010: Save Dialog Enhancements

**Decision**: Save dialog includes two new configuration options:
1. Number of loop repetitions (1, 2, 4, 8, custom input)
2. Fadeout duration (None, 1s, 2s, 5s, custom input)

**Default Values**: Load from settings, fall back to:
- Loop count: 4
- Fadeout: 2s

**Behavior**:
- Total export duration = masterLoopDuration × loopCount + fadeoutDuration
- Fadeout applies to final mixed output (all tracks)
- Fadeout is linear volume reduction from 100% to 0%

---

## Design Patterns & Conventions

### Pattern 1: Loop Duration Calculation

All loop duration calculations should use this utility:

```typescript
// src/utils/loopUtils.ts
export function calculateMasterLoopDuration(tracks: Track[]): number {
  if (tracks.length === 0) return 0;
  const masterTrack = tracks[0];
  return masterTrack.duration / masterTrack.speed;
}

export function calculateLoopCount(trackDuration: number, masterDuration: number): number {
  if (masterDuration === 0) return 1;
  return Math.ceil(trackDuration / masterDuration);
}
```

**Usage**: Import and use these functions consistently across all code

---

### Pattern 2: Master Track Identification

Use this pattern to safely identify the master track:

```typescript
const masterTrack = tracks[0];
const hasMasterTrack = tracks.length > 0;
const isMasterTrack = (trackId: string) => tracks[0]?.id === trackId;
```

**Never**: Search for master track by ID in array (position is source of truth)

---

### Pattern 3: Confirmation Dialog Component

Create a reusable confirmation dialog component:

```typescript
// src/components/ConfirmationDialog/ConfirmationDialog.tsx
interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean; // Colors confirm button red
}
```

**Usage**: Reuse for all confirmation scenarios

---

### Pattern 4: Settings Store Structure

```typescript
// src/store/useSettingsStore.ts
interface SettingsStore {
  // Looping
  loopCrossfadeDuration: number; // milliseconds, 0-50
  defaultLoopMode: boolean; // true = ON

  // Export
  defaultLoopCount: number;
  defaultFadeoutDuration: number; // milliseconds
  defaultExportFormat: AudioFormat;
  defaultExportQuality: AudioQuality;

  // Recording
  defaultRecordingFormat: AudioFormat;
  defaultRecordingQuality: AudioQuality;

  // Actions
  updateSettings: (partial: Partial<SettingsStore>) => void;
  resetToDefaults: () => void;
}
```

---

### Pattern 5: Store State Updates

When updating related state across multiple stores, use this pattern:

```typescript
// ✅ Good: Synchronous updates in correct order
useTrackStore.getState().updateTrack(id, updates);
usePlaybackStore.getState().setTrackSpeed(id, updates.speed);

// ❌ Bad: Async updates that may race
await someAsyncFunction();
updateTrack(id, updates); // State might be stale
```

**Rule**: State updates should be synchronous and atomic when possible

---

## Tech Stack & Libraries

### Existing (No Changes)
- **React Native**: 0.81.5
- **Expo**: ~54.0.23
- **Zustand**: 5.0.8 (state management)
- **React Native Paper**: 5.14.5 (UI components)
- **TypeScript**: 5.9.2

### New Dependencies (None Required)
All features can be implemented with existing dependencies.

---

## Testing Strategy

### Unit Tests
- Test all utility functions in isolation
- Test store actions and selectors
- Use Jest for all unit tests
- Mock external dependencies (Audio APIs, file system)

**Example**:
```typescript
// src/utils/__tests__/loopUtils.test.ts
describe('calculateMasterLoopDuration', () => {
  it('returns 0 for empty track array', () => {
    expect(calculateMasterLoopDuration([])).toBe(0);
  });

  it('calculates speed-adjusted duration', () => {
    const tracks = [{ duration: 10000, speed: 0.5, /* ... */ }];
    expect(calculateMasterLoopDuration(tracks)).toBe(20000);
  });
});
```

---

### Component Tests
- Use React Native Testing Library
- Test user interactions (button presses, slider changes)
- Test rendering of different states
- Mock Zustand stores with initial state

**Example**:
```typescript
// src/components/LoopModeToggle/__tests__/LoopModeToggle.test.tsx
describe('LoopModeToggle', () => {
  it('toggles loop mode when pressed', () => {
    const { getByTestId } = render(<LoopModeToggle />);
    const toggle = getByTestId('loop-mode-toggle');

    fireEvent.press(toggle);

    expect(usePlaybackStore.getState().loopMode).toBe(true);
  });
});
```

---

### Integration Tests
- Test workflows across multiple components
- Test store interactions
- Test audio service integration

**Example**: Test recording workflow
```typescript
it('records first track and sets master loop', async () => {
  // Start recording
  // Stop recording
  // Verify track added
  // Verify master loop duration set
});
```

---

### E2E Scenarios (Manual Testing)
Each phase includes manual test scenarios. Critical paths:

1. **Master Loop Creation**
   - Record/import first track
   - Verify master styling applied
   - Change speed, verify loop duration updates

2. **Adding Subsequent Tracks**
   - Add second track
   - Verify looping behavior in playback
   - Verify save output includes repetitions

3. **Confirmation Dialogs**
   - Change master track speed with other tracks present
   - Delete master track
   - Verify warnings appear and actions complete correctly

4. **Settings Persistence**
   - Change settings
   - Close app (web: refresh, mobile: background/foreground)
   - Verify settings retained

---

## Common Pitfalls to Avoid

### Pitfall 1: Off-by-One Errors with Master Track
**Problem**: Checking `tracks[1]` instead of `tracks[0]` for master track
**Solution**: Always use `tracks[0]`, double-check all array access

### Pitfall 2: Forgetting Speed Adjustment
**Problem**: Using `track.duration` directly instead of `track.duration / track.speed`
**Solution**: Use `calculateMasterLoopDuration()` utility everywhere

### Pitfall 3: State Update Race Conditions
**Problem**: Async updates to multiple stores may race or leave inconsistent state
**Solution**: Update stores synchronously in a single function, avoid await between updates

### Pitfall 4: Breaking Existing Playback
**Problem**: Looping logic interferes with normal playback when loop mode is OFF
**Solution**: Check loop mode flag before applying looping behavior, maintain separate code paths

### Pitfall 5: Platform-Specific Audio API Differences
**Problem**: Web Audio API and expo-av have different looping capabilities
**Solution**: Abstract looping logic in BaseAudioPlayer, implement platform-specific solutions

### Pitfall 6: Confirmation Dialog Memory Leaks
**Problem**: Closures in dialog callbacks hold stale state references
**Solution**: Use latest state inside callbacks, not captured variables

### Pitfall 7: Performance Issues with Short Loops
**Problem**: Calculating repetitions for 0.1s track in 60s loop creates massive data
**Solution**: Set reasonable limits (max 1000 repetitions), warn user, or pre-calculate and cache

### Pitfall 8: Not Testing Edge Cases
**Problem**: Code works for normal cases but fails on edge cases (0 duration, very fast speed)
**Solution**: Write tests for edge cases first:
- Empty track array
- Single track
- Zero duration
- Speed at min/max bounds (0.05, 2.5)
- Very short tracks (<100ms)
- Very long tracks (>10 minutes)

---

## File Structure Conventions

New files should follow this structure:

```
src/
  components/
    ComponentName/
      ComponentName.tsx         # Component implementation
      ComponentName.styles.ts   # Styles (if complex)
      ComponentName.test.tsx    # Component tests
      index.ts                  # Re-export

  services/
    ServiceName/
      ServiceName.ts            # Service implementation
      ServiceName.test.ts       # Service tests
      index.ts                  # Re-export

  utils/
    utilName.ts                 # Utility functions
    utilName.test.ts            # Utility tests

  store/
    useStoreName.ts             # Zustand store
    useStoreName.test.ts        # Store tests
```

**Naming**:
- Components: PascalCase
- Files: PascalCase for components, camelCase for utilities
- Test files: Same name as source with `.test.ts(x)` extension
- Use index.ts for clean re-exports

---

## Git Commit Conventions

Use Conventional Commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring without behavior change
- `test`: Adding or updating tests
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `chore`: Build, dependencies, tooling

**Scopes**:
- `loop-engine`: Core looping logic
- `stores`: State management
- `ui`: User interface components
- `settings`: Settings page
- `recording`: Recording workflow
- `export`: Save/export functionality
- `tests`: Test infrastructure

**Examples**:
```
feat(loop-engine): add master loop duration calculation

- Implement calculateMasterLoopDuration utility
- Add speed adjustment to duration calculation
- Include edge case handling for empty tracks

Closes #123
```

```
test(stores): add tests for track store loop behavior

- Test master track identification
- Test loop duration updates
- Mock playback store interactions
```

---

## Performance Considerations

### Memory Usage
- **Problem**: Duplicating audio data for looping can increase memory usage
- **Solution**: Stream/loop in audio players when possible, only duplicate for final export

### Calculation Caching
- **Problem**: Recalculating loop durations on every render
- **Solution**: Use Zustand selectors with memoization, calculate once on track changes

### Playback Synchronization
- **Problem**: Multiple looping tracks may drift over time
- **Solution**: Use existing MultiTrackManager drift detection, resync periodically

### Large Loop Counts
- **Problem**: Exporting 1000 loops of a 1-second track = massive audio file
- **Solution**: Set reasonable limits (e.g., max export duration 10 minutes or 100 loops)

---

## Accessibility Considerations

- All interactive elements must have accessibility labels
- Screen reader support for master track indication
- High contrast mode support for master track styling
- Keyboard navigation for settings page (web)
- Voice control compatibility (mobile)

**Example**:
```tsx
<Button
  accessibilityLabel="Toggle loop mode"
  accessibilityHint="When enabled, tracks will loop during playback"
  accessibilityRole="switch"
  accessibilityState={{ checked: loopMode }}
>
  Loop Mode
</Button>
```

---

## Migration Strategy

### Store Migration
Implement migration to handle existing user data:

```typescript
// src/store/migrations/looperNormalization.ts
export function migrateToLooperNormalization(state: any) {
  return {
    ...state,
    tracks: state.tracks?.map((track: any) => {
      const { selected, ...rest } = track; // Remove 'selected' property
      return rest;
    }) || [],
  };
}
```

Run migration on store initialization.

---

## Documentation Updates

After implementation, update:

1. **README.md**: Add looper mode to features list
2. **USER_GUIDE.md**: Document master loop concept, loop mode toggle, save options
3. **DEVELOPER_GUIDE.md**: Architecture decisions, new patterns, testing strategies
4. **In-app Help**: Update HelpModal with looper workflow explanation

---

## Questions to Ask During Implementation

If you encounter any of these situations, STOP and ask for clarification:

1. **Ambiguous Requirements**: "Should X happen when Y condition?"
2. **Technical Trade-offs**: "Approach A is faster but less accurate, which is preferred?"
3. **Edge Cases**: "What should happen if user does Z?"
4. **Scope Boundaries**: "Does this feature include W or is that out of scope?"
5. **Priority Conflicts**: "Feature X breaks feature Y, which takes precedence?"

**Format**:
```
QUESTION: [Concise question]
Context: [Relevant details]
Options: [If applicable]
```

---

## Success Metrics

After completing all phases, verify these metrics:

- ✅ All unit tests pass (80%+ coverage on new code)
- ✅ All integration tests pass
- ✅ Manual E2E scenarios complete successfully
- ✅ No performance regression (measure mixing time before/after)
- ✅ No memory leaks (profile app with React DevTools)
- ✅ Accessibility audit passes
- ✅ Works on web, Android, iOS
- ✅ Documentation complete and accurate

---

## Ready to Start?

You've reviewed Phase 0. Proceed to **Phase 1: Core Looping Engine** to begin implementation.

**Remember**:
- Write tests first (TDD)
- Commit frequently
- Follow the patterns defined here
- Ask questions when uncertain
- Reference this document throughout all phases
