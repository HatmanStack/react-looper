# Phase 3 [IMPLEMENTER]: Test Quality and MainScreen Architecture

## Phase Goal

Fix placeholder and skipped tests to restore trust in the test suite, decouple service-layer classes from Zustand stores, and extract MainScreen (770+ lines) into focused custom hooks. This phase addresses the lowest-scoring eval pillar (Test Value: 6/10) and the most impactful architectural debt (god-component MainScreen, service-store coupling).

**Success criteria:**
- Zero `expect(true).toBe(true)` placeholder assertions remain
- All `it.skip` / `it.todo` stubs are either implemented or deleted
- WebAudioMixer no longer imports useSettingsStore
- LoopEngine no longer imports useTrackStore or usePlaybackStore
- MainScreen is under 250 lines, with logic extracted to 3 custom hooks
- Each extracted hook has its own test file
- WebAudioPlayer, WebAudioRecorder, and WebAudioMixer have unit tests
- All existing tests still pass (`npm run check`)

**Estimated tokens:** ~30k

## Prerequisites

- Phase 2 complete (shared AudioContextManager exists, volume utility extracted, onerror fixed, blob URL revocation in place, platform-safe downloadFile utility exists)
- `npm run check` passes

## Tasks

---

### Task 1: Fix Placeholder Tests

**Goal:** Replace all `expect(true).toBe(true)` placeholders with meaningful assertions, and either implement or delete skipped/todo test stubs. This is prerequisite work -- the test suite must be trustworthy before we add new tests. Addresses ADR-4 and eval Test Value remediation (6/10 to 9/10).

**Files to Modify:**
- `frontend/__tests__/unit/services/MockAudioServices.test.ts` — Lines 125, 142, 159, 199 (4 placeholders) and lines 229, 239, 249 (3 `it.skip`)
- `frontend/__tests__/unit/services/AudioService.test.ts` — Lines 124, 287 (2 placeholders)
- `frontend/__tests__/unit/components/SpeedSlider.test.tsx` — Line 200 (1 placeholder)
- `frontend/src/screens/SettingsScreen/__tests__/crossfadePlaceholder.test.tsx` — Lines 67, 70, 71, 72 (4 `it.todo`) and the entire `describe.skip` block
- `frontend/__tests__/setup.test.ts` — Line 7 (1 placeholder -- infrastructure smoke test, see step 4)
- `frontend/__tests__/unit/services/WebAudioMixer.test.ts` — Line 506 (`it.skip`)
- `frontend/src/store/__tests__/settingsPersistence.test.ts` — Line 15 (`it.skip`)

**Prerequisites:**
- None

**Implementation Steps:**
1. For each `expect(true).toBe(true)` placeholder, determine what the test SHOULD assert:

   **MockAudioServices.test.ts:125** ("sets playback speed"):
   - After `player.setSpeed(1.5)`, the protected field `_speed` from `BaseAudioPlayer` should be 1.5. Assert using bracket notation: `expect((player as any)['_speed']).toBe(1.5)`. Alternatively, if MockAudioPlayer exposes a getter, use that. Read MockAudioPlayer to confirm the best approach.

   **MockAudioServices.test.ts:142** ("sets volume"):
   - After `player.setVolume(50)`, assert `expect((player as any)['_volume']).toBe(50)`.

   **MockAudioServices.test.ts:159** ("sets looping"):
   - After `player.setLooping(false)`, assert `expect((player as any)['_looping']).toBe(false)`.

   **MockAudioServices.test.ts:199** ("sets playback complete callback"):
   - Assert that `player.onPlaybackComplete` registers the callback. Set a mock callback, then verify the internal `_onPlaybackComplete` field is set, or verify the callback fires when playback completes on the mock.

   **AudioService.test.ts:124** ("sets track looping"):
   - After `audioService.setTrackLooping(trackId, false)`, verify looping state changed. Check `audioService.getTrackInfo(trackId)` for a looping field, or access the underlying player's `_looping` property.

   **AudioService.test.ts:287** ("cleans up temp files"):
   - After `audioService.cleanupTempFiles()`, verify the file list is empty by calling `audioService.listAudioFiles()` and asserting length is 0.

   **SpeedSlider.test.tsx:200** ("should preserve pitch by setting shouldCorrectPitch"):
   - This test describes player behavior, not SpeedSlider behavior. Delete this test entirely -- pitch preservation is a concern of the player implementations, not the UI slider component.

2. For each `it.skip`:

   **MockAudioServices.test.ts:229-257** (3 validation tests):
   - The comment says "validation is tested in BaseAudioMixer tests." Verify that `BaseAudioMixer` tests cover empty URI, invalid speed, and invalid volume cases. If they do, delete the skipped tests with a comment explaining coverage exists elsewhere. If they do not, unskip and fix the async issue (likely needs the `await expect(...).rejects.toThrow()` pattern correctly applied).

   **WebAudioMixer.test.ts:506** ("throws error when no tracks provided"):
   - The comment says the error is not caught properly by Jest. Read `WebAudioMixer._mixTracks()` -- line 33 throws `AudioError` when `tracks.length === 0`. The public method `mixTracks()` from `BaseAudioMixer` likely wraps this. Diagnose: if `BaseAudioMixer.mixTracks()` catches the error and re-throws, the `rejects.toThrow()` pattern should work. Unskip and fix the assertion, or update to match actual error propagation behavior.

   **settingsPersistence.test.ts:15** ("has persist middleware configured"):
   - Persistence is intentionally disabled per health-audit finding #15. Delete this skipped test entirely since it describes aspirational behavior, not current behavior.

3. For `it.todo` stubs in `crossfadePlaceholder.test.tsx`:
   - The crossfade feature IS implemented in `WebAudioMixer.ts`. These stubs were for "Phase 4 implementation" but crossfade already works. The entire file is wrapped in `describe.skip`. Since Task 2 of this phase removes the store import from WebAudioMixer (changing the integration point), delete the stubs.
   - Evaluate the 3 concrete tests in the `describe.skip` block: try unskipping by removing `describe.skip` and running. If they fail due to react-native-paper rendering issues, delete the file entirely.

4. For `setup.test.ts:7` -- this is a legitimate Jest infrastructure smoke test that validates the test runner works. Keep it as-is. It is not inflating coverage of real behavior.

5. Run `npm run check` after all changes.

**Verification Checklist:**
- [ ] `grep -r "expect(true).toBe(true)" frontend/` returns only `setup.test.ts` or nothing
- [ ] `grep -r "it\.skip\|it\.todo\|test\.skip\|test\.todo" frontend/` returns zero results (or only intentional skips with justifying comments)
- [ ] No test count inflation -- placeholder tests that were deleted reduce the count, but no previously-passing tests now fail
- [ ] `npm run check` passes

**Testing Instructions:**
- Run `npm test -- --verbose` to confirm all tests pass with meaningful names and no skip/todo output.

**Commit Message Template:**
```
test(services): replace placeholder tests with real assertions, remove dead stubs

- Replace 7 expect(true).toBe(true) with meaningful assertions
- Delete or implement 4 it.skip and 4 it.todo stubs
- Delete crossfadePlaceholder.test.tsx (crossfade tested via WebAudioMixer tests)
- Delete skipped persistence test (persistence intentionally disabled)
```

---

### Task 2: Remove Service-Store Coupling in WebAudioMixer

**Goal:** `WebAudioMixer` directly imports `useSettingsStore` (a Zustand React hook) at line 13 to read `loopCrossfadeDuration` at lines 79-80. This couples a service-layer class to UI state management, making it untestable without Zustand and unusable outside React context. Refactor to accept `loopCrossfadeDuration` as a parameter. Addresses HIGH health-audit finding #4.

**Files to Modify:**
- `frontend/src/services/audio/WebAudioMixer.ts` — Remove `useSettingsStore` import, accept crossfade as parameter
- `frontend/src/types/audio.ts` — Add `crossfadeDuration` to `MixingOptions` interface (if not already present)
- Any callers of `WebAudioMixer.mixTracks()` or `BaseAudioMixer.mixTracks()` — Pass the crossfade duration through

**Prerequisites:**
- None

**Implementation Steps:**
1. Read `frontend/src/types/audio.ts` to find the `MixingOptions` interface. Check if it already has a `crossfadeDuration` field.
2. If `MixingOptions` does not have `crossfadeDuration`, add it as an optional field:
   ```typescript
   crossfadeDuration?: number; // Crossfade duration in milliseconds at loop boundaries
   ```
3. In `WebAudioMixer.ts`:
   - Remove `import { useSettingsStore } from "../../store/useSettingsStore";` (line 13).
   - Replace lines 79-80 where `useSettingsStore.getState().loopCrossfadeDuration` is read:
     ```typescript
     // Before:
     const crossfadeDurationMs = useSettingsStore.getState().loopCrossfadeDuration;
     // After:
     const crossfadeDurationMs = options?.crossfadeDuration ?? 0;
     ```
4. Trace the call chain to find where `MixingOptions` is constructed. The caller in the app is likely `handleSaveModalSave` in MainScreen (or the `AudioExportService`). Read the chain:
   - MainScreen calls `audioExportService.mix({ tracks, loopCount, fadeoutDuration, format, quality })`
   - `AudioExportService.mix()` delegates to the platform mixer
   - The mixer receives `MixingOptions`
5. Update the caller to read `loopCrossfadeDuration` from `useSettingsStore` and pass it as `crossfadeDuration` in the options object. This moves the store access to the UI layer where it belongs. In MainScreen's `handleSaveModalSave` (or in the export hook once extracted in Task 6):
   ```typescript
   const loopCrossfadeDuration = useSettingsStore.getState().loopCrossfadeDuration;
   const result = await audioExportService.mix({
     tracks: mixTracks,
     loopCount,
     fadeoutDuration,
     format: exportFormat,
     quality: exportQuality,
     crossfadeDuration: loopCrossfadeDuration,
   });
   ```
6. Update existing `WebAudioMixer.test.ts` tests: if they set up `useSettingsStore` state for crossfade, update them to pass `crossfadeDuration` in the options object instead.
7. Run `npm run check`.

**Verification Checklist:**
- [ ] `WebAudioMixer.ts` has no import of `useSettingsStore`
- [ ] `grep "useSettingsStore" frontend/src/services/` returns zero results
- [ ] `crossfadeDuration` is part of `MixingOptions` (or a parameter of `_mixTracks`)
- [ ] The crossfade value flows from the settings store through the caller, not read inside the mixer
- [ ] Existing WebAudioMixer tests pass without Zustand store setup for crossfade
- [ ] `npm run check` passes

**Testing Instructions:**
- Run `npm test -- frontend/__tests__/unit/services/WebAudioMixer.test.ts`
- Add one test verifying that `_mixTracks` uses the provided crossfade duration (e.g., pass `crossfadeDuration: 50` and verify the crossfade gain scheduling logic executes by checking that multiple buffer sources are created).

**Commit Message Template:**
```
refactor(audio): remove useSettingsStore dependency from WebAudioMixer

- Accept crossfadeDuration via MixingOptions parameter
- Move store access to the caller (UI layer)
- Service is now pure: no Zustand imports
```

---

### Task 3: Remove Service-Store Coupling in LoopEngine

**Goal:** `LoopEngine` directly imports `useTrackStore` and `usePlaybackStore` (lines 13-14) and calls `.getState()` in every method (lines 66, 87, 125-126, 161). This makes it impossible to unit test without setting up Zustand stores and prevents reuse outside React context. Refactor to accept store data as parameters so LoopEngine becomes a pure calculation service. Addresses HIGH health-audit finding #4.

**Files to Modify:**
- `frontend/src/services/loop/LoopEngine.ts` — Remove store imports, accept data as parameters
- `frontend/src/services/loop/__tests__/LoopEngine.test.ts` — Update tests to pass data directly instead of setting up stores

**Prerequisites:**
- None

**Implementation Steps:**
1. Identify all store access in LoopEngine (5 methods, all use `getState()`):
   - `getMasterLoopInfo()` — reads `getMasterTrack()` and `getMasterLoopDuration()` from track store
   - `getTrackLoopInfo(trackId)` — reads `getTrack(trackId)` and `getMasterLoopDuration()` from track store
   - `shouldTrackLoop(trackId)` — reads `loopMode` from playback store, `getTrack(trackId)` and `getMasterLoopDuration()` from track store
   - `calculateExportDuration(loopCount, fadeout)` — reads `getMasterLoopDuration()` from track store
   - `isLoopModeEnabled()` — reads `loopMode` from playback store

2. Define a context interface to avoid long parameter lists:
   ```typescript
   export interface LoopContext {
     tracks: Track[];
     masterLoopDuration: number;
     loopMode: boolean;
   }
   ```
   The caller (a hook or component) constructs this from store state.

3. Refactor each method signature:
   - `getMasterLoopInfo(tracks: Track[], masterLoopDuration: number): MasterLoopInfo` — derive master track from the tracks array (first track)
   - `getTrackLoopInfo(trackId: string, tracks: Track[], masterLoopDuration: number): TrackLoopInfo` — find track in provided array
   - `shouldTrackLoop(trackId: string, context: LoopContext): boolean` — or accept individual params: `(track: Track, masterLoopDuration: number, loopMode: boolean)`
   - `calculateExportDuration(masterLoopDuration: number, loopCount: number, fadeout: number): number` — master duration is now a parameter
   - `isLoopModeEnabled(loopMode: boolean): boolean` — this becomes trivial (`return loopMode`). Consider removing it entirely or keeping for API consistency.

4. Remove all `import { useTrackStore }` and `import { usePlaybackStore }` statements.

5. Remove all `.getState()` calls. Each method uses only its parameters.

6. Consider making methods static or converting LoopEngine to a module of exported functions, since it has no instance state. Either approach is acceptable -- if the class remains, that is fine for API consistency with existing callers.

7. Update `LoopEngine.test.ts`:
   - Remove the store setup in `beforeEach` (`useTrackStore.getState().clearTracks()`, `usePlaybackStore.getState().reset()`, `useSettingsStore.getState().resetToDefaults()`).
   - Remove imports of `useTrackStore`, `usePlaybackStore`, `useSettingsStore`.
   - Pass track data and master loop duration directly to each method under test.
   - This makes the tests simpler, faster, and decoupled from Zustand.
   - Example change:
     ```typescript
     // Before:
     useTrackStore.getState().addTrack(track);
     const info = loopEngine.getMasterLoopInfo();
     // After:
     const info = loopEngine.getMasterLoopInfo([track], 10000);
     ```

8. Run `npm run check`.

**Verification Checklist:**
- [ ] `LoopEngine.ts` has no import of `useTrackStore` or `usePlaybackStore`
- [ ] `grep "useTrackStore\|usePlaybackStore" frontend/src/services/loop/` returns zero results
- [ ] All methods accept their data as parameters (no `.getState()` calls)
- [ ] `LoopEngine.test.ts` passes without setting up Zustand stores
- [ ] `npm run check` passes

**Testing Instructions:**
- Run `npm test -- frontend/src/services/loop/__tests__/LoopEngine.test.ts` to verify.
- Existing test logic is correct; only the setup mechanism changes (direct params instead of store setup).

**Commit Message Template:**
```
refactor(loop): remove store dependencies from LoopEngine

- Accept track data and loop mode as parameters instead of reading stores
- Define LoopContext interface for clean parameter passing
- LoopEngine is now a pure calculation service
- Update tests to pass data directly (no Zustand setup)
```

---

### Task 4: Extract useRecordingSession Hook from MainScreen

**Goal:** Extract recording logic from MainScreen into a `useRecordingSession` custom hook. MainScreen is a 770+ line god component (HIGH finding #5, eval Architecture 8/10 to 9/10). This is the first of three extraction tasks per ADR-3. The hook encapsulates: starting/stopping recording, recording timer management, recording duration tracking, and auto-stop logic for subsequent tracks.

**Files to Create:**
- `frontend/src/hooks/useRecordingSession.ts` — Custom hook for recording lifecycle
- `frontend/src/hooks/__tests__/useRecordingSession.test.ts` — Tests for the hook

**Files to Modify:**
- `frontend/src/screens/MainScreen/MainScreen.tsx` — Remove recording logic, use the new hook

**Prerequisites:**
- Phase 2 Task 1 complete (uuid for track IDs -- the hook generates track objects)
- Phase 2 Task 4 complete (onerror fix -- recording error handling is part of this hook)

**Implementation Steps:**
1. Identify all recording-related state and logic in MainScreen:
   - State: `isRecording` (line 79), `recordingDuration` (line 81)
   - Refs: `recordingTimerRef` (line 83), `recordingIntervalRef` (line 84)
   - Functions: `handleRecord` (lines 139-216), `handleStop` (lines 218-277), `calculateQuantizedDuration` (lines 130-137, already simplified in Phase 1)
   - Store access needed: `getMasterLoopDuration`, `hasMasterTrack`, `tracks.length`, `recordingFormat`, `recordingQuality`
   - Service access needed: `audioServiceRef.current` (AudioService instance)

2. Create `useRecordingSession.ts` with this interface:
   ```typescript
   interface UseRecordingSessionOptions {
     audioService: AudioService | null;
     tracks: Track[];
     getMasterLoopDuration: () => number;
     hasMasterTrack: () => boolean;
     recordingFormat: string;
     recordingQuality: string;
     onTrackRecorded: (track: Track) => Promise<void>;
   }

   interface UseRecordingSessionReturn {
     isRecording: boolean;
     recordingDuration: number;
     handleRecord: () => Promise<void>;
     handleStop: () => Promise<void>;
   }
   ```

3. Move the recording logic into the hook:
   - `isRecording` and `recordingDuration` as `useState`
   - `recordingTimerRef` and `recordingIntervalRef` as `useRef`
   - `handleRecord` function including auto-stop timer setup for subsequent tracks
   - `handleStop` function including track creation with `uuid` and calling `onTrackRecorded`
   - `calculateQuantizedDuration` as a local helper inside the hook (or inline it since Phase 1 simplified it to just `baseDuration * 1`)
   - Cleanup `useEffect` return that clears timers on unmount

4. The hook does NOT import store hooks directly -- it receives all needed data via its options parameter. This keeps the hook testable without Zustand.

5. In MainScreen.tsx:
   - Import and use the new hook
   - Remove the extracted state, refs, and functions
   - Pass the required options from existing store selectors and refs:
     ```typescript
     const { isRecording, recordingDuration, handleRecord, handleStop } = useRecordingSession({
       audioService: audioServiceRef.current,
       tracks,
       getMasterLoopDuration,
       hasMasterTrack,
       recordingFormat,
       recordingQuality,
       onTrackRecorded: async (track) => {
         await audioServiceRef.current?.loadTrack(track.id, track.uri, {
           speed: track.speed, volume: track.volume, loop: true,
         });
         addTrack(track);
       },
     });
     ```

6. Write tests for the hook in `useRecordingSession.test.ts`:
   - Use `renderHook` from `@testing-library/react-native`
   - Mock `AudioService` with jest mock functions for `startRecording`, `stopRecording`, `getRecordingDuration`
   - Test: initial state -- `isRecording` is false, `recordingDuration` is 0
   - Test: calling `handleRecord` calls `audioService.startRecording` and sets `isRecording` to true
   - Test: calling `handleStop` calls `audioService.stopRecording`, creates a track, calls `onTrackRecorded`, sets `isRecording` to false
   - Test: auto-stop timer fires for subsequent tracks -- use `jest.useFakeTimers()`, set up a master loop duration, call `handleRecord`, advance timers by that duration, verify `handleStop` was triggered
   - Test: cleanup clears timers on unmount -- `renderHook` unmount, verify no pending timers
   - Test: error during recording start shows Alert (mock `Alert.alert`)

7. Run `npm run check`.

**Verification Checklist:**
- [ ] `useRecordingSession.ts` exists in `frontend/src/hooks/`
- [ ] MainScreen no longer contains `handleRecord`, `handleStop`, `recordingTimerRef`, `recordingIntervalRef`, or `calculateQuantizedDuration`
- [ ] MainScreen uses the hook and passes extracted values to it
- [ ] Hook tests cover: initial state, record start, record stop, auto-stop timer, cleanup, error handling
- [ ] `npm run check` passes

**Testing Instructions:**
- Run `npm test -- frontend/src/hooks/__tests__/useRecordingSession.test.ts`
- Run `npm test` to verify no regressions

**Commit Message Template:**
```
refactor(ui): extract useRecordingSession hook from MainScreen

- Move recording start/stop, timer management, and auto-stop logic
- Hook accepts AudioService and store data as parameters (testable)
- Add tests for recording lifecycle, auto-stop, and cleanup
```

---

### Task 5: Extract useTrackPlayback Hook from MainScreen

**Goal:** Extract playback orchestration from MainScreen into a `useTrackPlayback` custom hook. This covers play/pause per track, volume changes, speed changes, track selection, track deletion, and the speed/delete confirmation dialog logic for the master track.

**Files to Create:**
- `frontend/src/hooks/useTrackPlayback.ts` — Custom hook for playback control
- `frontend/src/hooks/__tests__/useTrackPlayback.test.ts` — Tests for the hook

**Files to Modify:**
- `frontend/src/screens/MainScreen/MainScreen.tsx` — Remove playback logic, use the new hook

**Prerequisites:**
- Task 4 complete (recording logic already extracted, so MainScreen is partially simplified)

**Implementation Steps:**
1. Identify all playback-related state and logic in MainScreen:
   - State: `speedConfirmationVisible` (line 88), `pendingSpeedChange` (line 90), `deleteConfirmationVisible` (line 96), `pendingDeletion` (line 98)
   - Functions: `handlePlay` (lines 429-453), `handlePause` (lines 455-473), `performDelete` (lines 475-511), `handleDelete` (lines 513-533), `handleDeleteConfirm` (line 535), `handleDeleteCancel` (line 543), `handleVolumeChange` (lines 548-564), `applySpeedChange` (lines 566-582), `handleSpeedChange` (lines 584-605), `handleSpeedChangeConfirm` (line 607), `handleSpeedChangeCancel` (line 615), `handleSelect` (lines 620-629)
   - Store access needed: `tracks`, `updateTrack`, `removeTrack`
   - Service access needed: `audioServiceRef.current` (AudioService instance)

2. Create `useTrackPlayback.ts` with this interface:
   ```typescript
   interface UseTrackPlaybackOptions {
     audioService: AudioService | null;
     tracks: Track[];
     updateTrack: (id: string, updates: Partial<Track>) => void;
     removeTrack: (id: string) => void;
   }

   interface UseTrackPlaybackReturn {
     handlePlay: (trackId: string) => Promise<void>;
     handlePause: (trackId: string) => Promise<void>;
     handleDelete: (trackId: string) => Promise<void>;
     handleVolumeChange: (trackId: string, volume: number) => Promise<void>;
     handleSpeedChange: (trackId: string, speed: number) => Promise<void>;
     handleSelect: (trackId: string) => void;
     // Speed change confirmation dialog state
     speedConfirmationVisible: boolean;
     handleSpeedChangeConfirm: () => void;
     handleSpeedChangeCancel: () => void;
     // Delete confirmation dialog state
     deleteConfirmationVisible: boolean;
     handleDeleteConfirm: () => Promise<void>;
     handleDeleteCancel: () => void;
   }
   ```

3. Move all playback logic into the hook. All confirmation dialog state and handlers move too, since they are part of the playback/delete flow.

4. The hook does NOT import store hooks directly -- it receives `tracks`, `updateTrack`, and `removeTrack` via options. All `useCallback` memoizations stay inside the hook, with dependencies on the options.

5. Update MainScreen to use the hook. The `ConfirmationDialog` components in JSX read state from this hook's return values. The `TrackList` component receives handlers from this hook.

6. Write tests in `useTrackPlayback.test.ts`:
   - Use `renderHook` from `@testing-library/react-native`
   - Mock `AudioService` with jest mock functions for `playTrack`, `pauseTrack`, `unloadTrack`, `setTrackVolume`, `setTrackSpeed`
   - Test: `handlePlay` calls `audioService.playTrack(trackId)` and calls `updateTrack(trackId, { isPlaying: true })`
   - Test: `handlePause` calls `audioService.pauseTrack(trackId)` and calls `updateTrack(trackId, { isPlaying: false })`
   - Test: `handleDelete` on non-master track calls `unloadTrack(trackId)` and `removeTrack(trackId)`
   - Test: `handleDelete` on master track (first track, other tracks exist) sets `deleteConfirmationVisible` to true (does not delete immediately)
   - Test: `handleDeleteConfirm` after master track deletion confirmation calls `unloadTrack` for all tracks and `removeTrack`
   - Test: `handleSpeedChange` on master track with other tracks present sets `speedConfirmationVisible` to true
   - Test: `handleSpeedChange` on non-master track applies speed change immediately
   - Test: `handleVolumeChange` calls `audioService.setTrackVolume(trackId, volume)` and calls `updateTrack(trackId, { volume })`
   - Test: `handleSelect` toggles the track's `selected` state

7. Run `npm run check`.

**Verification Checklist:**
- [ ] `useTrackPlayback.ts` exists in `frontend/src/hooks/`
- [ ] MainScreen no longer contains `handlePlay`, `handlePause`, `handleDelete`, `handleVolumeChange`, `handleSpeedChange`, `handleSelect`, or confirmation dialog state
- [ ] Hook tests cover the key interaction flows (play, pause, delete, speed, volume, select, confirmations)
- [ ] `npm run check` passes

**Testing Instructions:**
- Run `npm test -- frontend/src/hooks/__tests__/useTrackPlayback.test.ts`
- Run `npm test` to verify no regressions

**Commit Message Template:**
```
refactor(ui): extract useTrackPlayback hook from MainScreen

- Move play/pause/delete/volume/speed/select handlers
- Move speed and delete confirmation dialog state
- Hook accepts AudioService and store callbacks as parameters
- Add tests for all playback interactions
```

---

### Task 6: Extract useExportFlow Hook from MainScreen

**Goal:** Extract the export/save flow from MainScreen into a `useExportFlow` custom hook. This covers the save modal lifecycle, FFmpeg mixing invocation, and platform-specific file download (using the `downloadBlob` utility from Phase 2 Task 5). Include the `crossfadeDuration` parameter in the mixer options, connecting to Task 2's refactor.

**Files to Create:**
- `frontend/src/hooks/useExportFlow.ts` — Custom hook for export lifecycle
- `frontend/src/hooks/__tests__/useExportFlow.test.ts` — Tests for the hook

**Files to Modify:**
- `frontend/src/screens/MainScreen/MainScreen.tsx` — Remove export logic, use the new hook

**Prerequisites:**
- Phase 2 Task 5 complete (platform-safe `downloadBlob` utility exists)
- Task 2 complete (WebAudioMixer accepts `crossfadeDuration` in options)
- Tasks 4 and 5 complete (MainScreen is already partially simplified)

**Implementation Steps:**
1. Identify all export-related state and logic in MainScreen:
   - State: `saveModalVisible` (line 76), `isLoading` (line 80 -- shared with import flow, needs splitting)
   - Functions: `handleSave` (line 328), `handleSaveModalDismiss` (line 332), `handleSaveModalSave` (lines 348-427)
   - Store access needed: `tracks`, `exportFormat`, `exportQuality`
   - External dependencies: `getAudioExportService`, `downloadBlob` (from Phase 2 Task 5)

2. Create `useExportFlow.ts` with this interface:
   ```typescript
   interface UseExportFlowOptions {
     tracks: Track[];
     exportFormat: string;
     exportQuality: string;
     loopCrossfadeDuration: number; // From useSettingsStore, passed by caller
   }

   interface UseExportFlowReturn {
     isExporting: boolean;
     saveModalVisible: boolean;
     handleSave: () => void;
     handleSaveModalDismiss: () => void;
     handleSaveModalSave: (filename: string, loopCount: number, fadeoutDuration: number) => Promise<void>;
   }
   ```

3. Move the export logic into the hook:
   - `saveModalVisible` state and its toggle handlers
   - `isExporting` state (rename from the shared `isLoading` -- specific to export)
   - `handleSaveModalSave` with the FFmpeg mixing flow:
     - Filter selected tracks
     - Call `getAudioExportService().load()` and `.mix()`
     - Pass `loopCrossfadeDuration` as `crossfadeDuration` in the `MixingOptions` (connecting to Task 2)
     - Handle web download via `downloadBlob` from `@utils/downloadFile`
     - Handle native via Alert
   - Error handling with `AudioError` detection

4. Handle the `isLoading` state split: MainScreen currently uses a single `isLoading` for both import and export. After extraction:
   - The export hook owns `isExporting`
   - The import flow in MainScreen keeps a local `isImporting` state
   - MainScreen combines them for the loading overlay: `const isLoading = isExporting || isImporting`

5. Update MainScreen to use the hook:
   ```typescript
   const { isExporting, saveModalVisible, handleSave, handleSaveModalDismiss, handleSaveModalSave } = useExportFlow({
     tracks,
     exportFormat,
     exportQuality,
     loopCrossfadeDuration: useSettingsStore((state) => state.loopCrossfadeDuration),
   });
   ```
   The `SaveModal` component props come from this hook.

6. Write tests in `useExportFlow.test.ts`:
   - Mock `getAudioExportService` to return a mock with `load()` and `mix()` methods
   - Mock `downloadBlob` from `@utils/downloadFile`
   - Test: initial state -- `saveModalVisible` is false, `isExporting` is false
   - Test: `handleSave` sets `saveModalVisible` to true
   - Test: `handleSaveModalDismiss` sets `saveModalVisible` to false
   - Test: `handleSaveModalSave` with selected tracks calls `audioExportService.mix()` with correct parameters including `crossfadeDuration`
   - Test: `handleSaveModalSave` sets `isExporting` true during mixing, false after
   - Test: `handleSaveModalSave` with no selected tracks shows error Alert
   - Test: mixing error is caught and shown via Alert

7. Run `npm run check`.

**Verification Checklist:**
- [ ] `useExportFlow.ts` exists in `frontend/src/hooks/`
- [ ] MainScreen no longer contains `handleSaveModalSave` or the FFmpeg mixing logic
- [ ] The `loopCrossfadeDuration` flows from settings store through the hook to the mixer (not read inside the mixer)
- [ ] `isLoading` in MainScreen is now a combination of `isExporting` and `isImporting`
- [ ] Hook tests cover success path, error path, and no-selected-tracks edge case
- [ ] `npm run check` passes

**Testing Instructions:**
- Run `npm test -- frontend/src/hooks/__tests__/useExportFlow.test.ts`
- Run `npm test` to verify no regressions

**Commit Message Template:**
```
refactor(ui): extract useExportFlow hook from MainScreen

- Move save modal state and FFmpeg mixing logic to hook
- Separate isExporting state from shared isLoading
- Pass crossfadeDuration through options (not read from store in mixer)
- Add tests for export lifecycle and error handling
```

---

### Task 7: Add Tests for Audio Services

**Goal:** `WebAudioPlayer`, `WebAudioRecorder`, and `WebAudioMixer` are critical service classes with insufficient test coverage (health-audit finding #23, eval Test Value 6/10). Write unit tests with mocked browser APIs (AudioContext, MediaRecorder, fetch). Test the shared `AudioContextManager` from Phase 2.

**Files to Create or Modify:**
- `frontend/src/services/audio/__tests__/WebAudioPlayer.test.ts` — New or supplement existing tests
- `frontend/src/services/audio/__tests__/WebAudioRecorder.test.ts` — New test file
- `frontend/src/services/audio/__tests__/WebAudioMixer.test.ts` — Supplement existing tests at `frontend/__tests__/unit/services/WebAudioMixer.test.ts`

**Files to Reference:**
- `frontend/__tests__/unit/services/WebAudioPlayer.test.ts` — Existing test file with mock patterns
- `frontend/__tests__/unit/services/WebAudioMixer.test.ts` — Existing test file with coverage
- `frontend/jest.mocks.js` — Global mock setup for AudioContext, MediaRecorder, fetch
- `frontend/src/services/audio/AudioContextManager.ts` — Shared context manager from Phase 2 Task 3

**Prerequisites:**
- Phase 2 Task 3 complete (AudioContextManager exists)
- Task 2 complete (WebAudioMixer no longer imports useSettingsStore, simplifying test setup)

**Implementation Steps:**

1. Read the existing `WebAudioPlayer.test.ts` at `frontend/__tests__/unit/services/` to understand current coverage and mock patterns. Also read `jest.mocks.js` to see what browser APIs are already mocked globally. Determine whether to supplement the existing file or create a new co-located file.

2. **WebAudioPlayer tests** -- ensure coverage of:
   - `_load(uri, options)` — calls `fetch(uri)`, decodes audio data via `audioContext.decodeAudioData`, creates gain node, connects to destination. After Phase 2, uses shared AudioContext from `AudioContextManager.getAudioContext()`.
   - `_play()` — creates `BufferSourceNode`, sets `playbackRate`, connects to gain node, calls `source.start()`. Verify `isPlaying()` returns true.
   - `_pause()` — calls `source.stop()`, stores pause position. Verify `isPlaying()` returns false.
   - `_stop()` — calls `source.stop()`, resets position to 0.
   - `_unload()` — disconnects gain node, revokes blob URLs (Phase 2 fix), nulls references. Verify `isLoaded()` returns false.
   - `setSpeed(speed)` — updates `playbackRate.value` on the active source node.
   - `setVolume(volume)` — updates gain node value using shared `scaleVolume` utility (from Phase 2 Task 6).
   - Error handling — `AudioError` thrown when loading fails (e.g., fetch rejects).

   Mock pattern:
   ```typescript
   const mockGainNode = { gain: { value: 1.0 }, connect: jest.fn(), disconnect: jest.fn() };
   const mockSource = { buffer: null, playbackRate: { value: 1.0 }, loop: false,
     start: jest.fn(), stop: jest.fn(), connect: jest.fn(), disconnect: jest.fn(), onended: null };
   const mockAudioContext = {
     createBufferSource: jest.fn(() => mockSource),
     createGain: jest.fn(() => mockGainNode),
     decodeAudioData: jest.fn(() => Promise.resolve(mockAudioBuffer)),
     destination: {}, currentTime: 0, state: 'running',
     resume: jest.fn(() => Promise.resolve()),
     close: jest.fn(() => Promise.resolve()),
   };
   ```

3. **WebAudioRecorder tests** -- new test file:
   - Mock `navigator.mediaDevices.getUserMedia` to return a mock `MediaStream` with `getTracks()` returning mock tracks with `stop()`.
   - Mock `MediaRecorder` constructor and its event handlers (`ondataavailable`, `onstop`, `onerror`).
   - Test `_startRecording()` — requests user media, creates MediaRecorder, calls `mediaRecorder.start()`. Verify `isRecording()` returns true.
   - Test `_stopRecording()` — calls `mediaRecorder.stop()`, waits for `onstop` event, assembles blob from chunks, creates blob URL via `URL.createObjectURL`. Returns the URI.
   - Test error propagation — simulate `onerror` event (per Phase 2 fix), verify the error is stored and propagated through `stopRecording()`.
   - Test `getPermissions()` — calls `getUserMedia` and immediately stops the stream tracks.
   - Test `cancelRecording()` — stops MediaRecorder without assembling output, resets state.
   - Test `getRecordingDuration()` — returns elapsed time since recording start.

   Mock pattern:
   ```typescript
   const mockMediaStream = { getTracks: () => [{ stop: jest.fn(), kind: 'audio' }] };
   global.navigator = { mediaDevices: { getUserMedia: jest.fn(() => Promise.resolve(mockMediaStream)) } };
   global.MediaRecorder = jest.fn().mockImplementation(() => ({
     start: jest.fn(), stop: jest.fn(), state: 'inactive',
     ondataavailable: null, onstop: null, onerror: null,
   }));
   ```

4. **WebAudioMixer tests** -- supplement existing file:
   - Fix the skipped test at line 506 ("throws error when no tracks provided"). The `_mixTracks` method throws `AudioError` at line 33 when `tracks.length === 0`. Diagnose why the test fails -- it may be that `BaseAudioMixer.mixTracks()` validates before calling `_mixTracks()`, or the error is wrapped. Adjust the assertion to match actual error propagation. Unskip the test.
   - Add test: crossfade logic executes when `crossfadeDuration` option is provided. Pass `{ crossfadeDuration: 50 }` in options and verify that multiple `BufferSourceNode`s are created (the crossfade code path creates one source per repetition, vs. the simple path creates one looping source).
   - Add test: `getBlob()` returns null before mixing and returns a `Blob` after successful mixing.
   - Add test: `cleanup()` closes the AudioContext and sets `cachedBlob` to null. After cleanup, `getBlob()` returns null.

5. **AudioContextManager tests** (if not already created in Phase 2 Task 3):
   - Place in `frontend/src/services/audio/__tests__/AudioContextManager.test.ts`
   - Test: `getAudioContext()` returns an AudioContext (mocked)
   - Test: calling `getAudioContext()` twice returns the same instance (singleton)
   - Test: `closeAudioContext()` closes the context and nullifies it
   - Test: `getAudioContext()` after `closeAudioContext()` creates a fresh instance
   - Test: `getAudioContext()` resumes a suspended context (for browser autoplay policy compliance)

6. Run `npm run check`.

**Verification Checklist:**
- [ ] WebAudioPlayer has tests covering load, play, pause, stop, unload, speed, volume, error handling
- [ ] WebAudioRecorder has tests covering start, stop, error propagation, permissions, cancel, duration
- [ ] WebAudioMixer has no skipped tests, and crossfade/cleanup logic is tested
- [ ] AudioContextManager has tests covering singleton behavior and lifecycle
- [ ] All mocks are properly set up -- no real browser APIs called in tests
- [ ] `npm run check` passes

**Testing Instructions:**
- Run all new audio service tests: `npm test -- frontend/src/services/audio/__tests__/`
- Run existing mixer tests: `npm test -- frontend/__tests__/unit/services/WebAudioMixer.test.ts`
- Run full suite: `npm test` to verify no regressions
- Check coverage improvement: `npm test -- --coverage --collectCoverageFrom='frontend/src/services/audio/*.ts'`

**Commit Message Template:**
```
test(audio): add unit tests for WebAudioPlayer, WebAudioRecorder, WebAudioMixer

- WebAudioPlayer: load, play, pause, stop, unload, speed, volume, errors
- WebAudioRecorder: start, stop, error propagation, permissions, cancel
- WebAudioMixer: fix skipped test, add crossfade and cleanup tests
- AudioContextManager: singleton behavior and lifecycle tests
- All tests use mocked AudioContext, MediaRecorder, and fetch
```

---

## Phase Verification

After all 7 tasks are complete:

1. Run `npm run check` -- all lint, typecheck, and tests must pass
2. Verify zero placeholder assertions: `grep -r "expect(true).toBe(true)" frontend/` (excluding `setup.test.ts` if kept)
3. Verify zero skipped/todo tests: `grep -r "it\.skip\|it\.todo\|test\.skip\|test\.todo" frontend/` returns zero results
4. Verify service decoupling:
   - `grep -r "useSettingsStore" frontend/src/services/` returns zero results
   - `grep -r "useTrackStore\|usePlaybackStore" frontend/src/services/loop/` returns zero results
5. Verify MainScreen size: `wc -l frontend/src/screens/MainScreen/MainScreen.tsx` should be under 250 lines
6. Verify hooks exist:
   ```
   ls frontend/src/hooks/useRecordingSession.ts \
      frontend/src/hooks/useTrackPlayback.ts \
      frontend/src/hooks/useExportFlow.ts
   ```
7. Verify hook tests exist:
   ```
   ls frontend/src/hooks/__tests__/useRecordingSession.test.ts \
      frontend/src/hooks/__tests__/useTrackPlayback.test.ts \
      frontend/src/hooks/__tests__/useExportFlow.test.ts
   ```
8. Verify audio service tests exist:
   ```
   ls frontend/src/services/audio/__tests__/WebAudioPlayer.test.ts \
      frontend/src/services/audio/__tests__/WebAudioRecorder.test.ts
   ```
9. Run `npm test -- --verbose` and verify test count has increased (new hook tests + audio service tests added, minus deleted placeholder/skipped tests)
10. Run `git diff --stat` to confirm the scope of changes

**Known limitations:**
- MainScreen still contains the import flow (`handleImport`) and the initialization `useEffect`. These could be extracted to further hooks but are out of scope for this phase to keep it focused.
- `initializeAudioServices()` at module scope (health-audit finding #8) is not addressed. Moving it into a React lifecycle (`useEffect`) would be a small follow-up task but risks changing initialization timing, so it is deferred.
- The `useUIStore` integration (Phase 1 Task 2 TODO) is not done in this phase. The extracted hooks manage their own local state via return values. A future phase could wire `useUIStore` as a bridge for cross-component state sharing if another screen needs access to recording/export state.
- LoopEngine is decoupled from stores but not yet wired into the UI layer as the "single source of truth" for loop decisions (eval Creativity target). That is a HIGH-complexity item deferred from this remediation cycle.
- State persistence (Zustand persist middleware) is deferred -- it requires platform-specific storage adapter work that is out of scope.
