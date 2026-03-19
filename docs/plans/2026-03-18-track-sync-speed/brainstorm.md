# Feature: Track Sync Speed

## Overview

Add a sync-to-master feature that lets users set a non-master track's playback speed so its effective duration aligns with the master loop duration, at a chosen multiplier. The base sync speed is `track.duration / masterLoopDuration`, and the user can pick from 7 multipliers: 1/4x, 1/3x, 1/2x, 1x, 2x, 3x, 4x — where 1x means "play at exactly the master loop duration," 2x means "fit twice in the master loop," etc.

Sync is a persistent binding: when the master track's speed changes (which changes the master loop duration), all synced tracks automatically recalculate their speeds. The binding breaks when the user manually adjusts the speed slider, reverting the track to manual mode.

The UI is a sync icon button on each non-master track that opens a popover menu with the available multipliers. Multipliers that would produce a speed outside the valid 0.05–2.50 range are hidden from the menu.

## Decisions

1. **Out-of-range multipliers**: Hidden from the menu (not clamped, not shown as disabled)
2. **UI pattern**: Sync icon button on track item → popover menu with multiplier options
3. **Multiplier set**: 1/4x, 1/3x, 1/2x, 1x, 2x, 3x, 4x (powers of 2 plus thirds)
4. **Manual override**: Dragging the speed slider clears sync state — track reverts to manual mode with no residual sync indicator
5. **Master track**: No sync button shown (syncing master to itself is meaningless)
6. **Sync persistence**: Auto-resync when master speed changes — synced tracks recalculate speeds automatically
7. **Sync state storage**: `syncMultiplier?: number | null` field on the `Track` type directly
8. **Master speed confirmation dialog**: Updated to mention that synced tracks will be automatically adjusted

## Scope: In

- Sync icon button on non-master `TrackListItem` components
- Popover menu with 7 multiplier options (filtered by valid speed range)
- Speed calculation: `(track.duration / masterLoopDuration) * multiplier`
- `syncMultiplier` field on `Track` type
- Auto-resync logic when master track speed changes
- Clear `syncMultiplier` when user manually changes speed via slider
- Updated master speed change confirmation dialog text
- Tests for sync calculation, auto-resync, and manual override clearing sync

## Scope: Out

- Configurable multiplier sets (fixed 7 options)
- Sync-to-arbitrary-track (only sync to master)
- Visual "desynced" state — manual override simply clears sync silently
- Sync button on master track
- Settings screen changes
- Persisting sync state across app restarts (sync state lives on Track which is already persisted by the store)

## Open Questions

None — all scope decisions resolved.

## Relevant Codebase Context

- `frontend/src/types/Track.ts` — Track interface; add `syncMultiplier?: number | null`
- `frontend/src/hooks/useTrackPlayback.ts` — `applySpeedChange()` and `handleSpeedChange()` are the speed change entry points; auto-resync logic hooks in after master speed confirmation
- `frontend/src/components/TrackListItem/TrackListItem.tsx` — Renders per-track controls; sync button goes in the controls row; already receives `masterLoopDuration` prop
- `frontend/src/components/SpeedSlider/SpeedSlider.tsx` — Speed slider with range 0.05–2.50 (internal 3–102 mapped via `/41`); manual drag here should clear `syncMultiplier`
- `frontend/src/store/useTrackStore.ts` — `updateTrack(id, updates)` for persisting `syncMultiplier`; `getMasterLoopDuration()` for the master duration
- `frontend/src/utils/loopUtils.ts` — `calculateSpeedAdjustedDuration()` already exists for the math
- `frontend/src/components/ConfirmationDialog/` — Existing dialog component used for master speed change warning; message text needs update
- Speed range constants: min 0.05, max 2.50 (defined in SpeedSlider as `SPEED_MIN=3, SPEED_MAX=102, SPEED_DIVISOR=41`)
- React Native Paper `Menu` component already used in MainScreen for the overflow menu — same pattern for the sync popover

## Technical Constraints

- Speed must stay within 0.05–2.50 range (hardware/API limitation from expo-av and Web Audio API)
- `SpeedSlider` uses integer steps internally (3–102), so calculated sync speeds should be rounded to the nearest valid step: `Math.round(speed * 41) / 41`
- Auto-resync must not trigger the master speed confirmation dialog recursively — it should use `applySpeedChange` directly, bypassing the confirmation flow
- The `TrackListItem` is memoized with `React.memo` — new `onSync` callback and `syncMultiplier` must be included in the comparison or props to avoid stale renders
