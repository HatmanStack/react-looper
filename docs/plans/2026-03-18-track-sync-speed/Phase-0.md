# Phase 0: Foundation

## Architecture Decisions

### ADR-1: Sync state stored on the Track type

The `syncMultiplier` field lives on the `Track` interface (`syncMultiplier?: number | null`). When set to a number, the track is synced at that multiplier. When `null` or `undefined`, the track is in manual mode. This leverages existing `useTrackStore.updateTrack()` for persistence and keeps sync state co-located with the track it belongs to.

### ADR-2: Sync speed calculation in loopUtils

All sync math goes into `frontend/src/utils/loopUtils.ts` as pure functions. This keeps calculations testable without UI or store dependencies. The core formula:

```
syncSpeed = (track.duration / masterLoopDuration) * multiplier
```

Rounded to the nearest valid slider step: `Math.round(speed * 41) / 41`

### ADR-3: Auto-resync via useTrackPlayback hook

When the master track's speed change is confirmed, `useTrackPlayback` iterates all tracks with a non-null `syncMultiplier` and calls `applySpeedChange` directly (bypassing the confirmation dialog) to recalculate their speeds. This reuses existing speed-change infrastructure.

### ADR-4: Manual override clears sync silently

When `SpeedSlider.onValueChange` fires from a user drag, the handler clears `syncMultiplier` on that track via `updateTrack(id, { syncMultiplier: null })`. No visual "desynced" state -- the sync button simply returns to its default appearance.

### ADR-5: UI uses React Native Paper Menu

The sync popover reuses the `Menu` component from `react-native-paper`, already used in MainScreen for the overflow menu. The sync button is an `IconButton` with the "link" icon (or similar sync icon from MaterialCommunityIcons). The `Menu` anchors to this button.

## Design Patterns

- **Pure utility functions** for all sync calculations (testable, no side effects)
- **Existing `updateTrack` pattern** for persisting sync state
- **Existing `Menu` component pattern** from MainScreen overflow menu for the popover
- **Existing `React.memo` pattern** on TrackListItem -- new props (`syncMultiplier`, `onSyncSelect`) must be accounted for in the memo comparison

## Tech Stack

No new dependencies. Uses existing:
- `react-native-paper` (Menu, IconButton)
- `zustand` (store updates)
- `@testing-library/react-native` (tests)
- `jest` / `jest-expo` (test runner)

## Testing Strategy

- **Unit tests for sync utils** in `frontend/src/utils/__tests__/loopUtils.test.ts` (add new describe block)
- **Unit tests for auto-resync hook logic** in `frontend/src/hooks/__tests__/useTrackPlayback.test.ts` (add new describe block)
- **Component tests for SyncMenu** as a new test file `frontend/src/components/SyncMenu/__tests__/SyncMenu.test.tsx`
- **Component tests for TrackListItem** additions in `frontend/__tests__/unit/components/TrackListItem.test.tsx`
- Mocking: use existing patterns from the codebase (mock AudioService, mock stores via `setState`)
- No live audio or network calls in tests

## Commit Format

```
feat(sync): description of change

- detail 1
- detail 2
```

Use conventional commits: `feat`, `test`, `refactor`, `fix` prefixes with `(sync)` scope.
