# Phase 1: Track Sync Speed Implementation

## Phase Goal

Implement the complete track sync speed feature: type changes, utility functions, store/hook integration, UI components, and tests. At the end of this phase, users can sync non-master tracks to the master loop duration at chosen multipliers, and synced tracks auto-update when master speed changes.

**Success criteria:**
- Sync button visible on non-master tracks, hidden on master track
- Popover menu shows valid multipliers (those producing speeds within 0.05-2.50)
- Selecting a multiplier sets the track speed and persists `syncMultiplier`
- Master speed changes trigger auto-resync of all synced tracks
- Manually dragging the speed slider clears sync state
- Confirmation dialog text updated to mention synced tracks
- All new code covered by tests
- `npm run check` passes (lint + typecheck + tests)

**Estimated tokens: ~45,000**

## Prerequisites

- Phase 0 read and understood
- Dependencies installed (`npm install`)
- Codebase accessible

---

## Task 1: Add `syncMultiplier` to Track type

**Goal:** Extend the Track interface so tracks can store their sync multiplier.

**Files to Modify:**
- `frontend/src/types/Track.ts` - Add optional `syncMultiplier` field

**Implementation Steps:**
- Add `syncMultiplier?: number | null` to the `Track` interface with a JSDoc comment explaining that `null`/`undefined` means manual mode and a number means the track is synced at that multiplier

**Verification Checklist:**
- [x] `npm run typecheck` passes
- [x] No existing tests broken (`npm test`)

**Commit Message Template:**
```
feat(sync): add syncMultiplier field to Track type

- Optional number | null field for sync binding state
```

---

## Task 2: Add sync calculation utilities to loopUtils

**Goal:** Add pure functions for calculating sync speed and filtering valid multipliers.

**Files to Modify:**
- `frontend/src/utils/loopUtils.ts` - Add `calculateSyncSpeed` and `getValidSyncMultipliers`
- `frontend/src/utils/__tests__/loopUtils.test.ts` - Add tests for new functions

**Implementation Steps:**

Add two exported functions to `loopUtils.ts`:

1. `calculateSyncSpeed(trackDuration: number, masterLoopDuration: number, multiplier: number): number`
   - Formula: `(trackDuration / masterLoopDuration) * multiplier`
   - Round to nearest slider step: `Math.round(result * 41) / 41`
   - Return the rounded speed
   - Handle edge cases: if `masterLoopDuration <= 0`, return the track's current speed (or 1.0 as fallback)

2. `getValidSyncMultipliers(trackDuration: number, masterLoopDuration: number): { label: string, value: number }[]`
   - The full set of multipliers is: `[1/4, 1/3, 1/2, 1, 2, 3, 4]`
   - Labels: `["1/4x", "1/3x", "1/2x", "1x", "2x", "3x", "4x"]`
   - For each multiplier, calculate the sync speed via `calculateSyncSpeed`
   - Filter out multipliers where the resulting speed is outside `MIN_SPEED` (0.05) to `MAX_SPEED` (2.5) range
   - Return the filtered array of `{ label, value }` objects
   - Note: `MIN_SPEED` and `MAX_SPEED` constants already exist in `loopUtils.ts`

Also export `MIN_SPEED` and `MAX_SPEED` (currently module-private constants) since they'll be useful in tests.

**Testing Instructions:**

Add a new `describe("sync speed calculations")` block in `frontend/src/utils/__tests__/loopUtils.test.ts`:

- `calculateSyncSpeed` tests:
  - Track of 10s, master loop of 10s, multiplier 1 => speed ~1.0
  - Track of 5s, master loop of 10s, multiplier 1 => speed ~0.5
  - Track of 20s, master loop of 10s, multiplier 1 => speed ~2.0
  - Track of 10s, master loop of 10s, multiplier 2 => speed ~2.0
  - Track of 10s, master loop of 10s, multiplier 0.5 => speed ~0.5
  - Result is rounded to nearest 1/41 step
  - Edge case: masterLoopDuration of 0 returns 1.0

- `getValidSyncMultipliers` tests:
  - Returns only multipliers whose calculated speed falls within 0.05-2.50
  - With a track and master that make all multipliers valid, returns all 7
  - With a track that would produce out-of-range speeds for some multipliers, those are excluded
  - Returns empty array when no multipliers are valid (edge case)

Run: `npm test -- frontend/src/utils/__tests__/loopUtils.test.ts`

**Verification Checklist:**
- [x] Both functions exported from `loopUtils.ts`
- [x] All new tests pass
- [x] Existing `loopUtils` tests still pass
- [x] `npm run typecheck` passes

**Commit Message Template:**
```
feat(sync): add sync speed calculation utilities

- calculateSyncSpeed with slider-step rounding
- getValidSyncMultipliers filters by valid speed range
- Tests for all sync calculation scenarios
```

---

## Task 3: Create SyncMenu component

**Goal:** Build the sync button + popover menu component that will be embedded in TrackListItem.

**Files to Create:**
- `frontend/src/components/SyncMenu/SyncMenu.tsx` - Component implementation
- `frontend/src/components/SyncMenu/SyncMenu.styles.ts` - Styles (follow existing pattern from other components)
- `frontend/src/components/SyncMenu/index.ts` - Barrel export
- `frontend/src/components/SyncMenu/__tests__/SyncMenu.test.tsx` - Component tests

**Prerequisites:**
- Task 2 complete (sync utils available)

**Implementation Steps:**

Create a `SyncMenu` component with the following interface:

```typescript
interface SyncMenuProps {
  trackDuration: number;
  masterLoopDuration: number;
  syncMultiplier: number | null | undefined;
  onSyncSelect: (multiplier: number) => void;
  onSyncClear: () => void;
}
```

The component renders:
1. An `IconButton` (anchor) with:
   - Icon: `"link"` when synced (syncMultiplier is a number), `"link-off"` when not synced
   - Color: accent color (`"#3F51B5"`) when synced, default (`"#E1E1E1"`) when not
   - `onPress` opens the menu
   - Size 24 (slightly smaller than play/pause buttons)

2. A `Menu` from `react-native-paper` anchored to the IconButton:
   - Call `getValidSyncMultipliers(trackDuration, masterLoopDuration)` to get available options
   - Render a `Menu.Item` for each valid multiplier with its label
   - If the track is currently synced, show an "Unsync" option at the bottom (calls `onSyncClear`)
   - Highlight the currently active multiplier (if synced) by using a distinct text color or leading icon
   - Close the menu after any selection

Wrap the component in `React.memo`.

Follow the style patterns from existing components (dark theme colors, consistent spacing). Keep styles minimal -- the component is small.

**Testing Instructions:**

Create `frontend/src/components/SyncMenu/__tests__/SyncMenu.test.tsx`:

- Renders the sync button
- When not synced, shows "link-off" icon appearance
- When synced (syncMultiplier = 1), shows "link" icon appearance
- Pressing the button opens the menu with multiplier options
- Only valid multipliers appear (mock a scenario where some are out of range)
- Selecting a multiplier calls `onSyncSelect` with the multiplier value
- Selecting "Unsync" calls `onSyncClear`
- Menu closes after selection

Mock `getValidSyncMultipliers` if needed, or provide trackDuration/masterLoopDuration values that produce known results.

Run: `npm test -- frontend/src/components/SyncMenu/__tests__/SyncMenu.test.tsx`

**Verification Checklist:**
- [x] Component renders without errors
- [x] Menu opens and shows correct multipliers
- [x] Callbacks fire with correct values
- [x] All tests pass
- [x] `npm run typecheck` passes

**Commit Message Template:**
```
feat(sync): add SyncMenu component with popover multiplier selection

- IconButton toggles link/link-off based on sync state
- Menu filters multipliers by valid speed range
- Unsync option when track is synced
```

---

## Task 4: Integrate SyncMenu into TrackListItem

**Goal:** Add the sync button to each non-master track's control row.

**Files to Modify:**
- `frontend/src/components/TrackListItem/TrackListItem.tsx` - Add SyncMenu to controls row
- `frontend/__tests__/unit/components/TrackListItem.test.tsx` - Add tests for sync integration

**Prerequisites:**
- Task 1 (syncMultiplier on Track type)
- Task 3 (SyncMenu component)

**Implementation Steps:**

1. Add new props to `TrackListItemProps`:
   - `onSyncSelect?: (trackId: string, multiplier: number) => void`
   - `onSyncClear?: (trackId: string) => void`

2. Add handler functions in the component:
   - `handleSyncSelect = (multiplier: number) => onSyncSelect?.(track.id, multiplier)`
   - `handleSyncClear = () => onSyncClear?.(track.id)`

3. In the controls row JSX, add `SyncMenu` between the sliders section and the pause button, but only when `!isMaster`:
   - Pass `trackDuration={track.duration}`, `masterLoopDuration={masterLoopDuration}`, `syncMultiplier={track.syncMultiplier}`, `onSyncSelect={handleSyncSelect}`, `onSyncClear={handleSyncClear}`
   - When `isMaster` is true, do not render the SyncMenu at all

4. The `TrackListItem` is already wrapped in `React.memo` with default shallow comparison. Since we're adding new props (`onSyncSelect`, `onSyncClear`) and the track object includes the new `syncMultiplier` field, the default `React.memo` shallow comparison will work correctly -- `track` is a new object reference when `syncMultiplier` changes.

**Testing Instructions:**

Add tests in `frontend/__tests__/unit/components/TrackListItem.test.tsx`:

- Sync button is NOT rendered for the master track (set up store with track as first track)
- Sync button IS rendered for non-master tracks
- `onSyncSelect` callback fires with trackId and multiplier when a menu item is selected
- `onSyncClear` callback fires with trackId when unsync is selected

Run: `npm test -- frontend/__tests__/unit/components/TrackListItem.test.tsx`

**Verification Checklist:**
- [x] Sync button visible on non-master tracks
- [x] Sync button hidden on master track
- [x] Callbacks propagate correctly
- [x] All TrackListItem tests pass (existing and new)
- [x] `npm run typecheck` passes

**Commit Message Template:**
```
feat(sync): integrate SyncMenu into TrackListItem controls row

- Show sync button on non-master tracks only
- Wire onSyncSelect and onSyncClear callbacks
```

---

## Task 5: Add sync logic to useTrackPlayback hook

**Goal:** Implement the core sync behaviors: applying sync speed, auto-resync on master speed change, and clearing sync on manual speed change.

**Files to Modify:**
- `frontend/src/hooks/useTrackPlayback.ts` - Add sync handlers and auto-resync logic
- `frontend/src/hooks/__tests__/useTrackPlayback.test.ts` - Add sync-related tests

**Prerequisites:**
- Task 1 (syncMultiplier on Track type)
- Task 2 (calculateSyncSpeed utility)

**Implementation Steps:**

1. Add new return values to `UseTrackPlaybackReturn`:
   - `handleSyncSelect: (trackId: string, multiplier: number) => void`
   - `handleSyncClear: (trackId: string) => void`

2. Implement `handleSyncSelect(trackId, multiplier)`:
   - Get the track from `tracks` array
   - Get the master loop duration: calculate it from tracks[0] using `calculateSpeedAdjustedDuration(tracks[0].duration, tracks[0].speed)`
   - Calculate the sync speed: `calculateSyncSpeed(track.duration, masterLoopDuration, multiplier)`
   - Call `applySpeedChange(trackId, syncSpeed)` to set the audio engine speed and update `track.speed`
   - Call `updateTrack(trackId, { syncMultiplier: multiplier })` to persist the sync binding

3. Implement `handleSyncClear(trackId)`:
   - Call `updateTrack(trackId, { syncMultiplier: null })`

4. Modify `handleSpeedChange` (the one that gates on master track):
   - When the speed change comes from a non-master track, clear its sync state: `updateTrack(trackId, { syncMultiplier: null })` before calling `applySpeedChange`
   - This handles the "manual slider drag breaks sync" behavior

5. Modify `handleSpeedChangeConfirm` (master speed confirmation):
   - After applying the master's speed change, iterate all non-master tracks
   - For each track that has a truthy `syncMultiplier` (number, not null/undefined):
     - Recalculate the new master loop duration using the new master speed
     - Calculate the new sync speed: `calculateSyncSpeed(track.duration, newMasterLoopDuration, track.syncMultiplier)`
     - Check if the new speed is within MIN_SPEED-MAX_SPEED range
     - If valid: call `applySpeedChange(track.id, newSyncSpeed)` (bypasses confirmation dialog)
     - If out of range: clear the sync binding via `updateTrack(track.id, { syncMultiplier: null })` (sync breaks gracefully)

**Important:** The auto-resync uses `applySpeedChange` directly, NOT `handleSpeedChange`. This avoids triggering the confirmation dialog recursively. The `pendingSpeedChange` state already holds the master's `trackId` and `speed`, so the new master loop duration can be derived from: `calculateSpeedAdjustedDuration(masterTrack.duration, pendingSpeedChange.speed)`.

**Testing Instructions:**

Add a new `describe("sync speed")` block in `frontend/src/hooks/__tests__/useTrackPlayback.test.ts`:

- `handleSyncSelect` sets track speed and syncMultiplier:
  - Create tracks: master (10s, speed 1.0), non-master (5s, speed 1.0)
  - Call `handleSyncSelect("track-2", 1)`
  - Verify `applySpeedChange` was called (mockAudioService.setTrackSpeed called with calculated speed)
  - Verify `updateTrack` was called with `{ syncMultiplier: 1 }`

- `handleSyncClear` removes sync binding:
  - Call `handleSyncClear("track-2")`
  - Verify `updateTrack` called with `{ syncMultiplier: null }`

- Manual speed change clears syncMultiplier:
  - Set up a non-master track with `syncMultiplier: 2`
  - Call `handleSpeedChange("track-2", 1.5)` (simulating slider drag)
  - Verify `updateTrack` called with `{ syncMultiplier: null }`

- Master speed confirm triggers auto-resync:
  - Set up: master track + non-master track with `syncMultiplier: 1`
  - Trigger master speed change flow (handleSpeedChange on master -> confirm)
  - Verify non-master track's speed was recalculated via `mockAudioService.setTrackSpeed`

- Auto-resync clears sync when new speed would be out of range:
  - Set up scenario where recalculated speed exceeds 2.50
  - Verify `updateTrack` called with `{ syncMultiplier: null }` for that track

Run: `npm test -- frontend/src/hooks/__tests__/useTrackPlayback.test.ts`

**Verification Checklist:**
- [x] `handleSyncSelect` correctly calculates and applies sync speed
- [x] `handleSyncClear` removes sync binding
- [x] Manual speed slider change clears sync
- [x] Master speed confirm auto-resyncs all synced tracks
- [x] Out-of-range auto-resync gracefully clears sync
- [x] All hook tests pass (existing and new)
- [x] `npm run typecheck` passes

**Commit Message Template:**
```
feat(sync): add sync logic to useTrackPlayback hook

- handleSyncSelect applies sync speed and persists multiplier
- handleSyncClear removes sync binding
- Manual speed change clears syncMultiplier
- Master speed confirm auto-resyncs all synced tracks
- Out-of-range resync gracefully clears binding
```

---

## Task 6: Wire sync handlers in MainScreen and update confirmation dialog text

**Goal:** Connect the sync callbacks from useTrackPlayback to TrackListItem via MainScreen, and update the master speed confirmation dialog text to mention synced tracks.

**Files to Modify:**
- `frontend/src/screens/MainScreen/MainScreen.tsx` - Pass sync handlers to TrackList/TrackListItem, update dialog text

**Prerequisites:**
- Task 4 (TrackListItem accepts sync props)
- Task 5 (useTrackPlayback returns sync handlers)

**Implementation Steps:**

1. In MainScreen, destructure `handleSyncSelect` and `handleSyncClear` from the `useTrackPlayback` return value (they were added in Task 5).

2. Pass these as props through the TrackList to TrackListItem. Check how `onSpeedChange`, `onVolumeChange`, etc. are currently passed -- follow the same pattern for `onSyncSelect` and `onSyncClear`.

   If TrackList is a separate component that forwards props, it will also need the new props added to its interface. Check `frontend/src/components/TrackList/TrackList.tsx` and add the new callback props there too.

3. Update the speed change confirmation dialog message (currently at line ~341 in MainScreen.tsx):
   - Change from: `"This track sets the loop length. Changing its speed will affect how all other tracks loop. Continue?"`
   - Change to: `"This track sets the loop length. Changing its speed will affect how all other tracks loop. Synced tracks will be automatically adjusted. Continue?"`

**Verification Checklist:**
- [x] Sync handlers flow from MainScreen through TrackList to TrackListItem
- [x] Confirmation dialog text mentions synced tracks
- [x] `npm run typecheck` passes
- [x] Existing MainScreen tests (if any) still pass

**Commit Message Template:**
```
feat(sync): wire sync handlers in MainScreen and update dialog text

- Pass handleSyncSelect and handleSyncClear to track list
- Update master speed confirmation to mention synced tracks
```

---

## Task 7: Final verification and cleanup

**Goal:** Run the full check suite and fix any issues.

**Files to Modify:**
- Any files that fail lint, typecheck, or tests

**Prerequisites:**
- Tasks 1-6 complete

**Implementation Steps:**

1. Run `npm run check` (lint + typecheck + tests)
2. Fix any failures
3. Run `npm run format` to ensure consistent formatting
4. Run `npm run format:check` to verify

**Verification Checklist:**
- [x] `npm run lint` passes
- [x] `npm run typecheck` passes
- [x] `npm test` passes (all 525+ existing tests plus new tests)
- [x] `npm run format:check` passes
- [x] No unintended file changes (review with `git diff`)

**Commit Message Template:**
```
refactor(sync): fix lint and format issues from sync feature

- Fix any lint/format/type issues
```

---

## Phase Verification

After all tasks are complete:

1. **Full suite:** `npm run check` passes
2. **Manual smoke test (optional):** `npm run web`, record 2 tracks, sync the second to 1x, change master speed, verify second track speed updates
3. **Feature completeness:**
   - Sync button appears on non-master tracks only
   - Menu shows filtered multipliers
   - Selecting a multiplier changes speed and shows "linked" icon
   - Changing master speed auto-updates synced tracks
   - Dragging speed slider manually clears sync
   - Confirmation dialog mentions synced tracks

### Known Limitations
- Sync multiplier set is fixed (7 options) -- not configurable
- Only syncs to master track, not arbitrary tracks
- No visual "desynced" warning when sync auto-clears due to out-of-range speed
