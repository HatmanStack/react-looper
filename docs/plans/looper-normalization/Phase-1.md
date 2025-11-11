# Phase 1: Core Looping Engine & State Management

## Phase Goal

Build the foundational looping engine that calculates master loop duration, determines track repetition counts, and updates the state management layer to track loop mode and master track status. This phase establishes the core business logic without any UI changes, making it easy to test in isolation.

**Success Criteria**:

- Loop duration calculations working correctly
- Track store tracks master loop duration
- Playback store tracks global loop mode
- Settings store created with default values
- All utility functions tested with 80%+ coverage
- No breaking changes to existing functionality

**Estimated tokens**: ~85,000

---

## Prerequisites

- Phase 0 reviewed and understood
- Development environment set up
- All existing tests passing
- Familiarity with Zustand store patterns in the codebase

---

## Tasks

### Task 1: Create Loop Utilities

**Goal**: Implement core loop calculation utilities that will be used throughout the application for determining loop durations and repetition counts.

**Files to Create**:

- `src/utils/loopUtils.ts` - Loop calculation utilities
- `src/utils/__tests__/loopUtils.test.ts` - Comprehensive tests

**Prerequisites**: None

**Implementation Steps**:

1. Create the loop utilities file with these functions:
   - `calculateMasterLoopDuration(tracks: Track[]): number` - Returns speed-adjusted duration of first track
   - `calculateLoopCount(trackDuration: number, masterDuration: number): number` - Returns number of repetitions needed
   - `calculateSpeedAdjustedDuration(duration: number, speed: number): number` - Helper for duration calculation
   - `isMasterTrack(tracks: Track[], trackId: string): boolean` - Check if track is master
   - `getMasterTrack(tracks: Track[]): Track | null` - Safe getter for master track
   - `calculateTrackLoopBoundaries(trackDuration: number, masterDuration: number): number[]` - Returns array of loop restart timestamps

2. Handle edge cases:
   - Empty track arrays
   - Zero or negative durations
   - Speed at boundary values (0.05, 2.5)
   - Tracks longer than master loop (should play partially)
   - Very short tracks (<100ms) that loop many times

3. Add comprehensive JSDoc comments explaining calculation formulas and use cases

4. Write tests FIRST using TDD approach:
   - Test each function in isolation
   - Test edge cases thoroughly
   - Test mathematical accuracy (use specific examples)
   - Test with realistic track data

**Verification Checklist**:

- [ ] All functions have correct TypeScript types
- [ ] All functions handle edge cases without throwing
- [ ] Tests cover normal cases, edge cases, and error conditions
- [ ] Test coverage ≥ 95% for this file
- [ ] JSDoc comments explain parameters and return values
- [ ] No hardcoded "magic numbers" (use constants)

**Testing Instructions**:

Write tests covering these scenarios:

```typescript
describe('calculateMasterLoopDuration', () => {
  // Normal cases
  - Returns 0 for empty array
  - Returns correct duration for single track
  - Applies speed adjustment correctly (test with 0.5x, 1.0x, 2.0x)

  // Edge cases
  - Handles speed at minimum (0.05)
  - Handles speed at maximum (2.5)
  - Handles zero duration track
  - Handles missing speed property (defaults to 1.0)
});

describe('calculateLoopCount', () => {
  // Normal cases
  - Returns 1 when track equals master duration
  - Returns 2 when track is half master duration
  - Returns correct count for partial loops (e.g., 7s track in 10s loop = 2)

  // Edge cases
  - Returns 1 for zero master duration (avoid division by zero)
  - Returns 1 for negative values
  - Handles very large ratios (e.g., 0.1s track in 60s loop)
});

// Similar patterns for other functions
```

Run tests: `npm test -- loopUtils.test.ts`

**Commit Message Template**:

```
feat(loop-engine): add core loop calculation utilities

- Implement calculateMasterLoopDuration with speed adjustment
- Add calculateLoopCount for track repetition
- Include edge case handling for boundary conditions
- Add comprehensive test suite with 95%+ coverage
```

**Estimated tokens**: ~12,000

---

### Task 2: Create Settings Store

**Goal**: Implement a Zustand store for persisting user settings related to looping behavior, export options, and recording preferences.

**Files to Create**:

- `src/store/useSettingsStore.ts` - Settings store implementation
- `src/store/__tests__/useSettingsStore.test.ts` - Store tests

**Prerequisites**: Task 1 complete (no dependencies, but good practice to work sequentially)

**Implementation Steps**:

1. Define the `SettingsStore` interface following the pattern in Phase-0:
   - Looping settings (crossfade duration, default loop mode)
   - Export settings (loop count, fadeout, format, quality)
   - Recording settings (format, quality)
   - Actions (update, reset)

2. Set reasonable default values:
   - Loop crossfade: 0ms (gapless)
   - Default loop mode: true (ON)
   - Loop count: 4
   - Fadeout: 2000ms (2 seconds)
   - Export format: MP3
   - Export quality: HIGH
   - Recording format: M4A (native) / WAV (web)
   - Recording quality: HIGH

3. Implement persistence using platform-specific approach (web: localStorage, native: AsyncStorage):
   - Create persistence utility if needed
   - Handle serialization/deserialization
   - Handle migration from non-existent settings (first launch)

4. Add action to update partial settings (merge semantics)

5. Add action to reset to defaults

6. Write comprehensive tests:
   - Test initial state matches defaults
   - Test update actions
   - Test reset action
   - Test persistence (mock storage layer)
   - Test partial updates (merge behavior)

**Verification Checklist**:

- [ ] Interface matches Phase-0 specification
- [ ] Default values are sensible and match requirements
- [ ] Persistence works on web and native (test both if possible)
- [ ] Partial updates merge correctly without overwriting unrelated settings
- [ ] Reset restores all defaults
- [ ] Tests cover all actions and state transitions
- [ ] Test coverage ≥ 90%

**Testing Instructions**:

```typescript
describe("useSettingsStore", () => {
  beforeEach(() => {
    // Reset store to defaults before each test
    useSettingsStore.getState().resetToDefaults();
  });

  it("initializes with default values", () => {
    const state = useSettingsStore.getState();
    expect(state.loopCrossfadeDuration).toBe(0);
    expect(state.defaultLoopMode).toBe(true);
    expect(state.defaultLoopCount).toBe(4);
    // ... test other defaults
  });

  it("updates partial settings without affecting others", () => {
    useSettingsStore.getState().updateSettings({
      defaultLoopCount: 8,
    });

    const state = useSettingsStore.getState();
    expect(state.defaultLoopCount).toBe(8);
    expect(state.defaultLoopMode).toBe(true); // Unchanged
  });

  it("persists settings across store recreations", () => {
    // This test may need to mock localStorage/AsyncStorage
    // depending on your persistence implementation
  });
});
```

Run tests: `npm test -- useSettingsStore.test.ts`

**Commit Message Template**:

```
feat(settings): create settings store with persistence

- Implement settings store with looping, export, and recording preferences
- Add platform-specific persistence layer
- Include default values for all settings
- Add update and reset actions
- Include comprehensive test suite
```

**Estimated tokens**: ~15,000

---

### Task 3: Update Track Store for Master Loop Tracking

**Goal**: Extend the track store to calculate and expose master loop duration, and add helper methods for identifying the master track.

**Files to Modify**:

- `src/store/useTrackStore.ts` - Add master loop tracking
- `src/store/__tests__/useTrackStore.test.ts` - Create if missing, add new tests

**Prerequisites**: Task 1 complete (uses loop utilities)

**Implementation Steps**:

1. Import loop utilities (`calculateMasterLoopDuration`, etc.)

2. Add derived state getters to the store interface:
   - `getMasterLoopDuration: () => number` - Returns calculated master loop duration
   - `getMasterTrack: () => Track | null` - Returns first track or null
   - `isMasterTrack: (id: string) => boolean` - Check if given ID is master
   - `hasMasterTrack: () => boolean` - Check if any tracks exist

3. Implement these getters using the loop utilities created in Task 1

4. Update `removeTrack` action to detect when master track is being removed:
   - If removing master track (tracks[0]), clear ALL tracks
   - This enforces the rule that removing master = start fresh
   - Note: Confirmation dialog will be added in Phase 2, this just implements the logic

5. Update `updateTrack` action to recalculate master loop duration when master track properties change (duration or speed)

6. Ensure existing functionality is not broken (all previous tests still pass)

7. Write tests for new functionality:
   - Test master track identification
   - Test master loop duration calculation
   - Test automatic track clearing when master removed
   - Test behavior with empty tracks array
   - Test behavior with single track
   - Test behavior with multiple tracks

**Verification Checklist**:

- [ ] All existing tests still pass
- [ ] New getters return correct values
- [ ] Master track removal clears all tracks
- [ ] Master loop duration updates when master track changes
- [ ] No performance regression (use Zustand selectors appropriately)
- [ ] Test coverage maintained or improved

**Testing Instructions**:

```typescript
describe("useTrackStore - master loop tracking", () => {
  beforeEach(() => {
    useTrackStore.getState().clearTracks();
  });

  it("identifies master track correctly", () => {
    const track1 = createMockTrack({ id: "track-1" });
    const track2 = createMockTrack({ id: "track-2" });

    useTrackStore.getState().addTrack(track1);
    useTrackStore.getState().addTrack(track2);

    expect(useTrackStore.getState().getMasterTrack()?.id).toBe("track-1");
    expect(useTrackStore.getState().isMasterTrack("track-1")).toBe(true);
    expect(useTrackStore.getState().isMasterTrack("track-2")).toBe(false);
  });

  it("calculates master loop duration with speed adjustment", () => {
    const track = createMockTrack({
      id: "track-1",
      duration: 10000, // 10 seconds
      speed: 0.5, // Half speed
    });

    useTrackStore.getState().addTrack(track);

    expect(useTrackStore.getState().getMasterLoopDuration()).toBe(20000); // 20 seconds
  });

  it("clears all tracks when master track is removed", () => {
    const track1 = createMockTrack({ id: "track-1" });
    const track2 = createMockTrack({ id: "track-2" });

    useTrackStore.getState().addTrack(track1);
    useTrackStore.getState().addTrack(track2);
    useTrackStore.getState().removeTrack("track-1"); // Remove master

    expect(useTrackStore.getState().tracks).toHaveLength(0);
  });
});
```

Run tests: `npm test -- useTrackStore.test.ts`

**Commit Message Template**:

```
feat(stores): add master loop tracking to track store

- Add getMasterLoopDuration derived state getter
- Add getMasterTrack and isMasterTrack helpers
- Implement auto-clear on master track removal
- Update tests for new functionality
```

**Estimated tokens**: ~10,000

---

### Task 4: Update Playback Store for Loop Mode

**Goal**: Add global loop mode state to the playback store so the application can track whether looping is enabled during playback.

**Files to Modify**:

- `src/store/usePlaybackStore.ts` - Add loop mode state
- `src/store/__tests__/usePlaybackStore.test.ts` - Create if missing, add new tests

**Prerequisites**: Task 2 complete (reads default from settings)

**Implementation Steps**:

1. Add `loopMode: boolean` to the PlaybackState interface

2. Initialize loop mode from settings store:

   ```typescript
   loopMode: useSettingsStore.getState().defaultLoopMode;
   ```

3. Add actions:
   - `setLoopMode: (enabled: boolean) => void` - Toggle loop mode
   - `toggleLoopMode: () => void` - Convenience toggle function

4. Update the state interface and implementation

5. Ensure loop mode state is independent of per-track looping (existing `isLooping` per track):
   - Global `loopMode`: Controls whether tracks loop to fill master duration
   - Per-track `isLooping`: Existing field, may be used for individual track loops (keep for backward compatibility)

6. Write tests:
   - Test initial state matches settings default
   - Test setLoopMode action
   - Test toggleLoopMode action
   - Test loop mode persists across state updates

**Verification Checklist**:

- [ ] Loop mode state added to interface
- [ ] Actions work correctly
- [ ] Initial state loads from settings
- [ ] All existing tests still pass
- [ ] New tests cover loop mode functionality
- [ ] No conflicts with existing per-track looping

**Testing Instructions**:

```typescript
describe("usePlaybackStore - loop mode", () => {
  beforeEach(() => {
    usePlaybackStore.getState().reset();
  });

  it("initializes loop mode from settings", () => {
    const defaultLoopMode = useSettingsStore.getState().defaultLoopMode;
    const loopMode = usePlaybackStore.getState().loopMode;

    expect(loopMode).toBe(defaultLoopMode);
  });

  it("sets loop mode", () => {
    usePlaybackStore.getState().setLoopMode(false);
    expect(usePlaybackStore.getState().loopMode).toBe(false);

    usePlaybackStore.getState().setLoopMode(true);
    expect(usePlaybackStore.getState().loopMode).toBe(true);
  });

  it("toggles loop mode", () => {
    const initialMode = usePlaybackStore.getState().loopMode;
    usePlaybackStore.getState().toggleLoopMode();
    expect(usePlaybackStore.getState().loopMode).toBe(!initialMode);
  });
});
```

Run tests: `npm test -- usePlaybackStore.test.ts`

**Commit Message Template**:

```
feat(stores): add global loop mode to playback store

- Add loopMode state and actions
- Initialize from settings default
- Add toggleLoopMode convenience action
- Include tests for loop mode functionality
```

**Estimated tokens**: ~8,000

---

### Task 5: Create Loop Engine Service

**Goal**: Create a service class that coordinates loop calculations and provides a high-level API for the UI and audio components to query loop information.

**Files to Create**:

- `src/services/loop/LoopEngine.ts` - Loop engine service
- `src/services/loop/__tests__/LoopEngine.test.ts` - Service tests
- `src/services/loop/index.ts` - Re-export

**Prerequisites**: Tasks 1, 3, and 4 complete (uses stores and utilities)

**Implementation Steps**:

1. Create `LoopEngine` class with these methods:
   - `getMasterLoopInfo(): { duration: number; trackId: string | null; track: Track | null }` - Get master loop details
   - `getTrackLoopInfo(trackId: string): { loopCount: number; boundaries: number[]; totalDuration: number }` - Get loop info for specific track
   - `shouldTrackLoop(trackId: string): boolean` - Check if track should loop based on mode and master duration
   - `calculateExportDuration(loopCount: number, fadeout: number): number` - Calculate total export duration
   - `isLoopModeEnabled(): boolean` - Check current loop mode state

2. Implement methods by composing utilities and store selectors:
   - Read from track store for track data
   - Read from playback store for loop mode
   - Use loop utilities for calculations

3. Design for testability:
   - Accept store instances via dependency injection OR
   - Use store selectors directly but mock in tests

4. Handle edge cases:
   - No tracks exist
   - Track not found
   - Loop mode disabled

5. Add caching if performance is a concern (optional optimization):
   - Cache master loop duration until tracks change
   - Use Zustand subscriptions to invalidate cache

6. Write comprehensive tests:
   - Test each method with various track configurations
   - Test edge cases
   - Test integration with stores
   - Mock store data for predictable tests

**Verification Checklist**:

- [ ] All methods return correct values
- [ ] Service integrates correctly with stores
- [ ] Edge cases handled gracefully (return safe defaults)
- [ ] Tests cover all methods and edge cases
- [ ] Test coverage ≥ 90%
- [ ] Performance is acceptable (no unnecessary recalculations)

**Testing Instructions**:

```typescript
describe("LoopEngine", () => {
  let loopEngine: LoopEngine;

  beforeEach(() => {
    // Reset stores
    useTrackStore.getState().clearTracks();
    usePlaybackStore.getState().reset();

    loopEngine = new LoopEngine();
  });

  describe("getMasterLoopInfo", () => {
    it("returns null info when no tracks exist", () => {
      const info = loopEngine.getMasterLoopInfo();
      expect(info.duration).toBe(0);
      expect(info.trackId).toBeNull();
      expect(info.track).toBeNull();
    });

    it("returns master track info when tracks exist", () => {
      const track = createMockTrack({
        id: "track-1",
        duration: 10000,
        speed: 1.0,
      });
      useTrackStore.getState().addTrack(track);

      const info = loopEngine.getMasterLoopInfo();
      expect(info.duration).toBe(10000);
      expect(info.trackId).toBe("track-1");
      expect(info.track).toEqual(track);
    });
  });

  describe("getTrackLoopInfo", () => {
    it("calculates loop info correctly for shorter track", () => {
      const track1 = createMockTrack({
        id: "track-1",
        duration: 10000,
        speed: 1.0,
      });
      const track2 = createMockTrack({
        id: "track-2",
        duration: 4000,
        speed: 1.0,
      });

      useTrackStore.getState().addTrack(track1);
      useTrackStore.getState().addTrack(track2);

      const info = loopEngine.getTrackLoopInfo("track-2");
      expect(info.loopCount).toBe(3); // 4s track loops 3 times in 10s master
      expect(info.boundaries).toHaveLength(3);
      expect(info.totalDuration).toBe(10000);
    });
  });

  describe("shouldTrackLoop", () => {
    it("returns true when loop mode enabled and track shorter than master", () => {
      usePlaybackStore.getState().setLoopMode(true);

      const track1 = createMockTrack({
        id: "track-1",
        duration: 10000,
        speed: 1.0,
      });
      const track2 = createMockTrack({
        id: "track-2",
        duration: 5000,
        speed: 1.0,
      });

      useTrackStore.getState().addTrack(track1);
      useTrackStore.getState().addTrack(track2);

      expect(loopEngine.shouldTrackLoop("track-2")).toBe(true);
    });

    it("returns false when loop mode disabled", () => {
      usePlaybackStore.getState().setLoopMode(false);

      const track1 = createMockTrack({
        id: "track-1",
        duration: 10000,
        speed: 1.0,
      });
      const track2 = createMockTrack({
        id: "track-2",
        duration: 5000,
        speed: 1.0,
      });

      useTrackStore.getState().addTrack(track1);
      useTrackStore.getState().addTrack(track2);

      expect(loopEngine.shouldTrackLoop("track-2")).toBe(false);
    });
  });

  // Additional tests for other methods...
});
```

Run tests: `npm test -- LoopEngine.test.ts`

**Commit Message Template**:

```
feat(loop-engine): create loop engine service

- Implement LoopEngine class with loop calculation methods
- Integrate with track and playback stores
- Add comprehensive test suite
- Include edge case handling
```

**Estimated tokens**: ~18,000

---

### Task 6: Update Store Migrations

**Goal**: Create a migration to remove the `selected` property from existing tracks and handle any other schema changes for existing users.

**Files to Modify/Create**:

- `src/store/migrations/looperNormalization.ts` - Create new migration
- `src/store/migrations/migrationSystem.ts` - Register new migration (if registry exists)
- `src/store/useTrackStore.ts` - Apply migration on initialization

**Prerequisites**: Task 3 complete

**Implementation Steps**:

1. Create migration function that:
   - Removes `selected` property from all tracks
   - Ensures all tracks have required properties (duration, speed, etc.)
   - Adds default values for any missing properties
   - Validates track data integrity

2. Implement migration versioning:
   - Assign version number (e.g., version 2)
   - Check current version before running migration
   - Store migrated version to avoid re-running

3. Apply migration on store initialization:
   - Run before any store operations
   - Handle migration errors gracefully (log and continue with defaults)

4. Test migration:
   - Test with old format data (with `selected` property)
   - Test with new format data (already migrated)
   - Test with empty/missing data
   - Test with corrupted data

5. Add logging for migration execution (helpful for debugging user issues)

**Verification Checklist**:

- [ ] Migration runs successfully on old data format
- [ ] Migration is idempotent (can run multiple times safely)
- [ ] Migration doesn't break new installations
- [ ] Errors are handled gracefully
- [ ] Migration is logged for debugging
- [ ] Tests cover all migration scenarios

**Testing Instructions**:

```typescript
describe("looperNormalization migration", () => {
  it("removes selected property from tracks", () => {
    const oldState = {
      tracks: [
        {
          id: "1",
          name: "Track 1",
          selected: true,
          duration: 1000,
          speed: 1.0 /* ... */,
        },
        {
          id: "2",
          name: "Track 2",
          selected: false,
          duration: 2000,
          speed: 1.0 /* ... */,
        },
      ],
    };

    const newState = migrateToLooperNormalization(oldState);

    newState.tracks.forEach((track) => {
      expect(track).not.toHaveProperty("selected");
    });
  });

  it("handles empty state gracefully", () => {
    const oldState = {};
    const newState = migrateToLooperNormalization(oldState);

    expect(newState.tracks).toEqual([]);
  });

  it("preserves all other track properties", () => {
    const oldState = {
      tracks: [
        {
          id: "1",
          name: "Track 1",
          selected: true,
          duration: 1000,
          speed: 1.5,
          volume: 80 /* ... */,
        },
      ],
    };

    const newState = migrateToLooperNormalization(oldState);

    expect(newState.tracks[0]).toMatchObject({
      id: "1",
      name: "Track 1",
      duration: 1000,
      speed: 1.5,
      volume: 80,
    });
  });
});
```

Run tests: `npm test -- looperNormalization.test.ts`

**Commit Message Template**:

```
feat(stores): add migration for looper normalization

- Create migration to remove 'selected' property from tracks
- Implement version checking to avoid re-running migrations
- Add comprehensive tests for migration scenarios
- Include error handling and logging
```

**Estimated tokens**: ~10,000

---

### Task 7: Integration Testing

**Goal**: Write integration tests that verify all components of Phase 1 work together correctly.

**Files to Create**:

- `src/__tests__/integration/loopEngine.integration.test.ts` - Integration tests

**Prerequisites**: All previous tasks complete

**Implementation Steps**:

1. Write integration tests covering these workflows:
   - Add first track → verify master loop duration calculated
   - Add second track → verify loop count calculated
   - Change master track speed → verify loop duration updated
   - Remove master track → verify all tracks cleared
   - Toggle loop mode → verify state changes
   - Update settings → verify playback store reflects changes

2. Test edge cases in integrated environment:
   - Rapid track additions
   - Concurrent speed changes
   - Store resets and state recovery

3. Test cross-store interactions:
   - Settings store → Playback store (default loop mode)
   - Track store → Loop engine (master duration)
   - Playback store → Loop engine (loop mode enabled)

4. Verify performance:
   - No unnecessary recalculations
   - Store subscriptions work correctly
   - No memory leaks from store subscriptions

**Verification Checklist**:

- [ ] All integration workflows pass
- [ ] Cross-store interactions work correctly
- [ ] No race conditions or timing issues
- [ ] Performance is acceptable
- [ ] Tests are deterministic (no flakiness)

**Testing Instructions**:

```typescript
describe("Loop Engine Integration", () => {
  beforeEach(() => {
    // Reset all stores
    useTrackStore.getState().clearTracks();
    usePlaybackStore.getState().reset();
    useSettingsStore.getState().resetToDefaults();
  });

  it("calculates master loop and track repetitions correctly", () => {
    const loopEngine = new LoopEngine();

    // Add master track (10s at 1.0x = 10s loop)
    const track1 = createMockTrack({
      id: "track-1",
      duration: 10000,
      speed: 1.0,
    });
    useTrackStore.getState().addTrack(track1);

    // Verify master loop
    const masterInfo = loopEngine.getMasterLoopInfo();
    expect(masterInfo.duration).toBe(10000);
    expect(masterInfo.trackId).toBe("track-1");

    // Add second track (4s at 1.0x)
    const track2 = createMockTrack({
      id: "track-2",
      duration: 4000,
      speed: 1.0,
    });
    useTrackStore.getState().addTrack(track2);

    // Verify loop count (4s loops 3 times in 10s)
    const track2Info = loopEngine.getTrackLoopInfo("track-2");
    expect(track2Info.loopCount).toBe(3);
  });

  it("updates loop duration when master track speed changes", () => {
    const loopEngine = new LoopEngine();

    // Add master track (10s at 1.0x = 10s loop)
    const track1 = createMockTrack({
      id: "track-1",
      duration: 10000,
      speed: 1.0,
    });
    useTrackStore.getState().addTrack(track1);

    // Change speed to 0.5x (10s / 0.5 = 20s loop)
    useTrackStore.getState().updateTrack("track-1", { speed: 0.5 });

    // Verify master loop duration updated
    const masterInfo = loopEngine.getMasterLoopInfo();
    expect(masterInfo.duration).toBe(20000);
  });

  it("respects loop mode setting", () => {
    const loopEngine = new LoopEngine();

    // Add tracks
    useTrackStore
      .getState()
      .addTrack(
        createMockTrack({ id: "track-1", duration: 10000, speed: 1.0 }),
      );
    useTrackStore
      .getState()
      .addTrack(createMockTrack({ id: "track-2", duration: 5000, speed: 1.0 }));

    // Loop mode ON
    usePlaybackStore.getState().setLoopMode(true);
    expect(loopEngine.shouldTrackLoop("track-2")).toBe(true);

    // Loop mode OFF
    usePlaybackStore.getState().setLoopMode(false);
    expect(loopEngine.shouldTrackLoop("track-2")).toBe(false);
  });

  it("clears all tracks when master is removed", () => {
    const loopEngine = new LoopEngine();

    // Add multiple tracks
    useTrackStore
      .getState()
      .addTrack(
        createMockTrack({ id: "track-1", duration: 10000, speed: 1.0 }),
      );
    useTrackStore
      .getState()
      .addTrack(createMockTrack({ id: "track-2", duration: 5000, speed: 1.0 }));

    // Remove master track
    useTrackStore.getState().removeTrack("track-1");

    // Verify all tracks cleared
    expect(useTrackStore.getState().tracks).toHaveLength(0);
    expect(loopEngine.getMasterLoopInfo().duration).toBe(0);
  });
});
```

Run tests: `npm test -- loopEngine.integration.test.ts`

**Commit Message Template**:

```
test(loop-engine): add integration tests for phase 1

- Test cross-store interactions
- Verify loop calculations in integrated environment
- Test edge cases and rapid state changes
- Ensure no performance regressions
```

**Estimated tokens**: ~12,000

---

## Review Feedback (Iteration 1)

### Critical Issue: No Implementation Files Created

> **Consider:** The plan specifies creating `src/utils/loopUtils.ts` in Task 1. Have you run `ls src/utils/loopUtils.ts` to verify this file exists?
>
> **Think about:** What's the difference between fixing linting/formatting issues and implementing new features? Which one does Phase 1 require?
>
> **Reflect:** If you run `find src -name "*loop*"`, what output do you expect for a completed Phase 1? What does no output mean?

### Task 1: Loop Utilities Not Created

> **Consider:** Task 1 requires a file `src/utils/loopUtils.ts` with 6 functions. Does this file exist in your working directory?
>
> **Think about:** If you run `npm test -- loopUtils.test.ts`, what happens? Does this indicate the tests (and implementation) exist?
>
> **Reflect:** The plan shows test examples starting at line 80. Have you created these tests following TDD approach (tests first, then implementation)?

### Task 2: Settings Store Not Created

> **Consider:** Where is `src/store/useSettingsStore.ts`? Can you import it in your code?
>
> **Think about:** The plan specifies persistence using localStorage/AsyncStorage. Have you implemented this store with all the default settings listed (lines 145-153)?

### Task 3-7: Remaining Tasks Not Started

> **Consider:** Have you modified `src/store/useTrackStore.ts` to add the master loop tracking methods (`getMasterLoopDuration`, `getMasterTrack`, etc.)?
>
> **Think about:** Each task has specific files to create or modify. Can you verify each file exists and contains the required functionality?
>
> **Reflect:** Running `git diff` - do you see changes to the store files, or only to documentation and formatting?

### Understanding the Difference

> **Think about:** Code quality fixes (ESLint, Prettier) are important but separate from feature implementation. Have you created any new functionality, or only cleaned up existing code?
>
> **Consider:** Re-read Phase-1.md from line 31 onwards. Each task specifies "Files to Create" or "Files to Modify". Have you created/modified these specific files?
>
> **Reflect:** The commit message says "fix(phase-1)" but Phase 1 is about building NEW features (loop engine, settings store, etc.), not fixing existing issues. Should the commit type be "feat" instead?

### Next Steps

> **Start here:** Begin with Task 1, line 31. Create `src/utils/loopUtils.ts` and `src/utils/__tests__/loopUtils.test.ts` following the TDD approach described.
>
> **Then:** Move sequentially through Tasks 2-7, creating each specified file and implementing the required functionality.
>
> **Verify:** After each task, run the tests specified in the "Testing Instructions" section to confirm your implementation works.

---

## Phase Verification

After completing all tasks, verify Phase 1 is complete:

### Automated Verification

```bash
# Run all tests
npm test

# Run only Phase 1 tests
npm test -- loopUtils
npm test -- useSettingsStore
npm test -- useTrackStore
npm test -- usePlaybackStore
npm test -- LoopEngine
npm test -- looperNormalization
npm test -- loopEngine.integration

# Check test coverage
npm test -- --coverage
```

**Expected Results**:

- All tests pass
- Code coverage ≥ 80% for new code
- No existing tests broken

### Manual Verification

1. **Inspect Stores in Dev Tools**:
   - Open React DevTools or Redux DevTools (if configured for Zustand)
   - Add a track via existing UI
   - Verify master loop duration appears in track store
   - Toggle loop mode (you'll need to do this via console for now):
     ```javascript
     usePlaybackStore.getState().toggleLoopMode();
     ```
   - Verify state updates

2. **Console Testing**:

   ```javascript
   // Import stores
   const { useTrackStore } = require("./src/store/useTrackStore");
   const { LoopEngine } = require("./src/services/loop/LoopEngine");

   // Add test tracks
   const track1 = { id: "1", duration: 10000, speed: 1.0 /* ... */ };
   useTrackStore.getState().addTrack(track1);

   // Check master loop
   const engine = new LoopEngine();
   console.log(engine.getMasterLoopInfo());

   // Should output: { duration: 10000, trackId: '1', track: {...} }
   ```

3. **Migration Testing**:
   - Manually create old-format data in localStorage/AsyncStorage
   - Reload app
   - Verify migration runs and removes `selected` property

### Integration Points Tested

- ✅ Loop utilities calculate correctly
- ✅ Settings store persists and loads
- ✅ Track store tracks master loop
- ✅ Playback store tracks loop mode
- ✅ Loop engine integrates all components
- ✅ Migrations handle old data format
- ✅ No breaking changes to existing functionality

### Known Limitations (to be addressed in later phases)

- No UI to toggle loop mode (Phase 2)
- No visual indicator of master track (Phase 2)
- No confirmation dialogs (Phase 2)
- Loop mode doesn't affect audio playback yet (Phase 2 & 5)
- Settings page doesn't exist yet (Phase 3)
- Save/export doesn't use loop repetitions yet (Phase 4)
- Recording doesn't auto-stop at loop boundary (Phase 5)

---

## Next Steps

Proceed to **Phase 2: UI Components & Visual Indicators** to build the user-facing components for looper functionality.

**Phase 2 Preview**:

- Master track visual styling
- Loop mode toggle button
- Confirmation dialogs
- Playback position indicators per track
- Integration with existing UI components
