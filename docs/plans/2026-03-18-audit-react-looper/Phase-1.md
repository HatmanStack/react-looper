# Phase 1 [HYGIENIST]: Dead Code Removal, Unused Deps, Simplification

## Phase Goal

Remove dead modules, unused dependencies, and duplicated code. Extract a shared utility. Replace unsafe ID generation. Consolidate logging. This is primarily subtractive work — the codebase should be smaller and cleaner when this phase is complete.

**Success criteria:**
- All identified dead modules are deleted
- Unused `uuid` dependency is removed; track IDs use `crypto.randomUUID()`
- Duplicated `scaleVolume()` is extracted to a shared utility
- All `console.*` calls in source files use the `logger` utility
- All existing tests still pass (`npm run check`)

**Estimated tokens:** ~15k

## Prerequisites

- Phase 0 read and understood
- `npm ci` from repo root
- `npm run check` passes (baseline green)

## Audit Findings Addressed

| Finding | Source | ID |
|---------|--------|----|
| Dead modules: selectors.ts, devtools.ts, useAppLifecycle.ts, LifecycleManager.ts | health-audit.md | #11, #12 |
| Dead useUIStore.ts (duplicated by MainScreen local state) | health-audit.md | #6 |
| Unused uuid dependency | health-audit.md | #13 |
| Date.now() track IDs (collision risk) | health-audit.md | #13 |
| Duplicated scaleVolume() in WebAudioPlayer and WebAudioMixer | health-audit.md | #10 |
| 148 console.* calls across 25 source files | health-audit.md | #18 |

---

## Task 1: Delete dead module — `selectors.ts`

### Goal

Remove `selectors.ts` (178 lines, 15+ selectors) that is never imported by any component or service. Components use inline selectors instead.

### Files to Modify

- **DELETE** `frontend/src/store/selectors.ts`

### Prerequisites

None.

### Implementation Steps

1. Run `npm run check` to confirm baseline passes.
2. Search the entire `frontend/src/` directory for any import of `selectors` or any of its exported symbols (`selectTracks`, `selectTrackCount`, `selectTrackById`, `selectTrackIds`, `selectPlayingTracks`, `selectHasTracksBoolean`, `selectTrackState`, `selectIsTrackPlaying`, `selectTrackSpeed`, `selectTrackVolume`, `selectIsAnyPlaying`, `selectPlayingTrackCount`, `selectSaveModalVisible`, `selectMixingModalVisible`, `selectIsRecording`, `selectIsMixing`, `selectMixingProgress`, `selectIsAnyLoading`, `selectErrorMessage`, `getTrackWithPlaybackState`, `getAllTracksWithPlaybackState`).
3. Confirm zero imports exist outside the file itself and `devtools.ts` (which is also being deleted in Task 2).
4. Delete `frontend/src/store/selectors.ts`.
5. Run `npm run check`.

### Verification Checklist

- [ ] `frontend/src/store/selectors.ts` does not exist
- [ ] No import statements reference `selectors.ts` or its exports (excluding plan docs)
- [ ] `npm run check` passes

### Testing Instructions

```bash
npm run check
```

No new tests needed — this is a deletion.

### Commit Message Template

```
refactor(store): remove dead selectors module

- Delete frontend/src/store/selectors.ts (178 lines, 15+ selectors)
- Module was never imported by any component or service
- Components use inline selectors (e.g., useTrackStore(state => state.tracks))
```

---

## Task 2: Delete dead module — `devtools.ts`

### Goal

Remove `devtools.ts` (207 lines) — state debugging infrastructure that is never imported by application code.

### Files to Modify

- **DELETE** `frontend/src/store/devtools.ts`

### Prerequisites

Task 1 completed (selectors.ts deleted, since devtools.ts imports useUIStore which also imports are cleaned).

### Implementation Steps

1. Search the codebase for any imports of `devtools.ts` or its exported symbols (`isDevelopment`, `enableStateLogging`, `exportState`, `importState`, `resetAllStores`, `getStoreStats`).
2. Confirm zero imports exist outside the file itself.
3. Delete `frontend/src/store/devtools.ts`.
4. Run `npm run check`.

### Verification Checklist

- [ ] `frontend/src/store/devtools.ts` does not exist
- [ ] No imports of `devtools` remain in the codebase
- [ ] `npm run check` passes

### Testing Instructions

```bash
npm run check
```

### Commit Message Template

```
refactor(store): remove dead devtools module

- Delete frontend/src/store/devtools.ts (207 lines)
- State logging infrastructure was defined but never imported
```

---

## Task 3: Delete dead module — `useAppLifecycle.ts`

### Goal

Remove `useAppLifecycle.ts` (160 lines) — lifecycle hook that is never imported by any component.

### Files to Modify

- **DELETE** `frontend/src/hooks/useAppLifecycle.ts`

### Prerequisites

None.

### Implementation Steps

1. Search the codebase for any imports of `useAppLifecycle` or `useBackgroundHandler`.
2. Confirm zero imports exist.
3. Delete `frontend/src/hooks/useAppLifecycle.ts`.
4. Run `npm run check`.

### Verification Checklist

- [ ] `frontend/src/hooks/useAppLifecycle.ts` does not exist
- [ ] No imports of `useAppLifecycle` or `useBackgroundHandler` remain
- [ ] `npm run check` passes

### Testing Instructions

```bash
npm run check
```

### Commit Message Template

```
refactor(hooks): remove dead useAppLifecycle hook

- Delete frontend/src/hooks/useAppLifecycle.ts (160 lines)
- Hook was never imported by any component
```

---

## Task 4: Delete dead module — `LifecycleManager.ts` and its test

### Goal

Remove `LifecycleManager.ts` (122 lines) — singleton lifecycle manager that is only referenced by its own test file, never imported by application code.

### Files to Modify

- **DELETE** `frontend/src/services/lifecycle/LifecycleManager.ts`
- **DELETE** `frontend/__tests__/unit/services/LifecycleManager.test.ts`

### Prerequisites

None.

### Implementation Steps

1. Search the codebase for any imports of `LifecycleManager`. Confirm the only import is from `LifecycleManager.test.ts`.
2. Check if `frontend/src/services/lifecycle/` directory has any other files. If `LifecycleManager.ts` is the only file, delete the entire `frontend/src/services/lifecycle/` directory.
3. Delete `frontend/__tests__/unit/services/LifecycleManager.test.ts`.
4. Run `npm run check`.

### Verification Checklist

- [ ] `frontend/src/services/lifecycle/LifecycleManager.ts` does not exist
- [ ] `frontend/__tests__/unit/services/LifecycleManager.test.ts` does not exist
- [ ] `frontend/src/services/lifecycle/` directory is removed if empty
- [ ] No imports of `LifecycleManager` remain (excluding plan docs)
- [ ] `npm run check` passes

### Testing Instructions

```bash
npm run check
```

### Commit Message Template

```
refactor(services): remove dead LifecycleManager and its test

- Delete frontend/src/services/lifecycle/LifecycleManager.ts (122 lines)
- Delete frontend/__tests__/unit/services/LifecycleManager.test.ts
- LifecycleManager was only referenced by its own test file
```

---

## Task 5: Delete dead module — `useUIStore.ts`

### Goal

Remove `useUIStore.ts` (88 lines) — Zustand store that duplicates state managed locally in MainScreen via `useState` (`isRecording`, `isLoading`). The store is never consumed by any screen or component.

### Files to Modify

- **DELETE** `frontend/src/store/useUIStore.ts`
- `CLAUDE.md` — Update State Management section

### Prerequisites

Tasks 1 and 2 completed (selectors.ts and devtools.ts deleted, since both import useUIStore).

### Implementation Steps

1. Search the codebase for any imports of `useUIStore`. After Tasks 1 and 2, confirm zero imports remain in `frontend/src/` (excluding already-deleted files).
2. Also search test files for `useUIStore` imports. If any test files import it, check whether those tests can be deleted or updated.
3. Delete `frontend/src/store/useUIStore.ts`.
4. Update `CLAUDE.md`:
   - Line 45: Change "Four stores in `frontend/src/store/`:" to "Three stores in `frontend/src/store/`:"
   - Remove the bullet point: `- **useUIStore** — Modal visibility, recording/mixing state, errors`
   - Line 51: Remove the sentence "Optimized selectors in `selectors.ts` prevent unnecessary re-renders." (selectors.ts was deleted in Task 1)
5. Run `npm run check`.

### Verification Checklist

- [ ] `frontend/src/store/useUIStore.ts` does not exist
- [ ] No imports of `useUIStore` remain in the codebase
- [ ] `CLAUDE.md` says "Three stores" and does not reference `useUIStore` or `selectors.ts`
- [ ] `npm run check` passes

### Testing Instructions

```bash
npm run check
```

### Commit Message Template

```
refactor(store): remove dead useUIStore and update CLAUDE.md

- Delete frontend/src/store/useUIStore.ts (88 lines)
- MainScreen uses local useState for identical state (isRecording, isLoading)
- Update CLAUDE.md: "Four stores" -> "Three stores", remove useUIStore bullet
- Remove selectors.ts reference from CLAUDE.md
```

---

## Task 6: Remove unused `uuid` dependency

### Goal

The `uuid` package is listed as a dependency but never imported anywhere in the source code. Remove it. Track IDs will be generated with `crypto.randomUUID()` in Task 7.

### Files to Modify

- `frontend/package.json` — remove `"uuid"` from `dependencies` (line 47) and `"@types/uuid"` from `devDependencies` (line 54)

### Prerequisites

None.

### Implementation Steps

1. Search the entire codebase for `import.*uuid` or `require.*uuid` to confirm `uuid` is never imported.
2. Open `frontend/package.json`.
3. Remove `"uuid": "^13.0.0"` from `dependencies`.
4. Remove `"@types/uuid": "^10.0.0"` from `devDependencies`.
5. Run `npm install` from the repo root to update `package-lock.json`.
6. Run `npm run check`.

### Verification Checklist

- [ ] `uuid` no longer appears in `frontend/package.json` dependencies
- [ ] `@types/uuid` no longer appears in `frontend/package.json` devDependencies
- [ ] `package-lock.json` is updated
- [ ] `npm run check` passes

### Testing Instructions

```bash
npm install && npm run check
```

### Commit Message Template

```
chore(config): remove unused uuid dependency

- Remove uuid and @types/uuid from frontend/package.json
- Package was listed as a dependency but never imported
```

---

## Task 7: Replace `Date.now()` track IDs with `crypto.randomUUID()`

### Goal

Track IDs are generated using `Date.now()` which can produce duplicates under rapid operations (e.g., fast import + record within same millisecond). Replace with `crypto.randomUUID()` which is available in all modern browsers and React Native (Hermes). No external dependency needed.

### Files to Modify

- `frontend/src/screens/MainScreen/MainScreen.tsx` — two locations

### Prerequisites

Task 6 completed (uuid removed from package.json).

### Implementation Steps

1. Open `frontend/src/screens/MainScreen/MainScreen.tsx`.
2. Find the two places where track IDs are generated:
   - Line ~250 (in `handleStop`): `` id: `track-${Date.now()}` ``
   - Line ~297 (in `handleImport`): `` id: `track-${Date.now()}` ``
3. Replace both occurrences with:
   ```typescript
   id: `track-${crypto.randomUUID()}`
   ```
4. No import is needed — `crypto.randomUUID()` is a global API available in all target environments (modern browsers, React Native with Hermes).
5. Run `npm run check`.

### Verification Checklist

- [ ] No remaining `Date.now()` used for track ID generation in MainScreen.tsx
- [ ] Both occurrences (handleStop and handleImport) are updated
- [ ] No new import needed
- [ ] `npm run check` passes

### Testing Instructions

```bash
npm run check
```

### Commit Message Template

```
fix(ui): replace Date.now() track IDs with crypto.randomUUID()

- Replace `track-${Date.now()}` with `track-${crypto.randomUUID()}`
- Prevents ID collisions under rapid operations (same-millisecond)
- crypto.randomUUID() available in all target environments
- No external dependency needed (uuid package removed in prior commit)
```

---

## Task 8: Extract shared `scaleVolume()` utility

### Goal

Identical logarithmic volume scaling formula is duplicated in `WebAudioPlayer._applyVolumeToGainNode()` (lines 193-210) and `WebAudioMixer.scaleVolume()` (lines 260-268). Extract to a single shared utility function with tests.

### Files to Modify

- `frontend/src/utils/audioUtils.shared.ts` — add `scaleVolume()` function (this file is explicitly designed for platform-agnostic utility functions and is re-exported by all platform variants via `export * from "./audioUtils.shared"`)
- `frontend/src/services/audio/WebAudioPlayer.ts` — import shared function, simplify `_applyVolumeToGainNode`
- `frontend/src/services/audio/WebAudioMixer.ts` — remove private `scaleVolume` method, import shared function

### Files to Create

- `frontend/src/utils/__tests__/scaleVolume.test.ts` — unit tests for `scaleVolume()`

### Prerequisites

None.

### Implementation Steps

1. Open `frontend/src/utils/audioUtils.shared.ts` (the platform-agnostic shared utility file, re-exported by all platform variants).
2. Add the following function:

```typescript
/**
 * Scale volume from 0-100 to gain value using logarithmic curve.
 * Matches the Android implementation for natural volume perception.
 *
 * Formula: 1 - (Math.log(MAX_VOLUME - volume) / Math.log(MAX_VOLUME))
 *
 * @param volume - Volume level from 0 to 100
 * @returns Gain value from 0.0 to 1.0
 */
export function scaleVolume(volume: number): number {
  if (volume === 0) {
    return 0;
  }
  if (volume === 100) {
    return 1;
  }
  return 1 - Math.log(100 - volume) / Math.log(100);
}
```

3. In `frontend/src/services/audio/WebAudioPlayer.ts`:
   - Add import: `import { scaleVolume } from "../../utils/audioUtils";`
   - Replace the body of `_applyVolumeToGainNode` (lines 193-210) to use the shared utility:
     ```typescript
     private _applyVolumeToGainNode(volume: number): void {
       if (!this.gainNode) {
         return;
       }
       this.gainNode.gain.value = scaleVolume(volume);
     }
     ```

4. In `frontend/src/services/audio/WebAudioMixer.ts`:
   - Add import: `import { scaleVolume } from "../../utils/audioUtils";`
   - Delete the private `scaleVolume` method entirely (lines 260-269).
   - Update the call site at line ~97 from `this.scaleVolume(track.volume)` to `scaleVolume(track.volume)`.

5. Create `frontend/src/utils/__tests__/scaleVolume.test.ts`:

```typescript
import { scaleVolume } from "../audioUtils";

describe("scaleVolume", () => {
  it("returns 0 for volume 0", () => {
    expect(scaleVolume(0)).toBe(0);
  });

  it("returns 1 for volume 100", () => {
    expect(scaleVolume(100)).toBe(1);
  });

  it("returns a value between 0 and 1 for mid-range volume", () => {
    const result = scaleVolume(50);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
  });

  it("follows logarithmic curve (higher volumes compress)", () => {
    const low = scaleVolume(25);
    const mid = scaleVolume(50);
    const high = scaleVolume(75);
    // Logarithmic: gain increases faster at lower volumes
    expect(mid - low).toBeGreaterThan(high - mid);
  });

  it("matches the expected formula", () => {
    const volume = 60;
    const expected = 1 - Math.log(100 - volume) / Math.log(100);
    expect(scaleVolume(volume)).toBeCloseTo(expected);
  });
});
```

6. Run `npm test -- frontend/src/utils/__tests__/scaleVolume.test.ts` to verify tests pass.
7. Run `npm run check`.

### Verification Checklist

- [ ] `scaleVolume` is defined exactly once in `frontend/src/utils/audioUtils.shared.ts`
- [ ] `WebAudioPlayer.ts` imports and uses `scaleVolume` from the utility
- [ ] `WebAudioMixer.ts` imports and uses `scaleVolume` from the utility (no private method)
- [ ] No duplicate volume scaling logic remains in either class
- [ ] Unit test passes: `npm test -- frontend/src/utils/__tests__/scaleVolume.test.ts`
- [ ] `npm run check` passes

### Testing Instructions

```bash
npm test -- frontend/src/utils/__tests__/scaleVolume.test.ts
npm run check
```

### Commit Message Template

```
refactor(audio): extract shared scaleVolume() utility

- Move logarithmic volume scaling to frontend/src/utils/audioUtils.shared.ts
- WebAudioPlayer and WebAudioMixer now import shared function
- Add unit tests for scaleVolume()
- Eliminates duplicated volume math (health-audit finding #10)
```

---

## Task 9: Consolidate `console.*` calls to use logger utility

### Goal

Replace 148 direct `console.*` calls across 20+ source files with the existing `logger` utility. The logger gates debug logs behind `__DEV__` and provides consistent prefixed output.

### Files to Modify

Replace `console.*` with `logger.*` in all of the following source files (do NOT modify the logger implementation files or test files):

| Directory | Files (occurrence count) |
|-----------|-------------------------|
| `services/audio/` | `NativeAudioPlayer.ts` (16), `NativeAudioRecorder.ts` (16), `MultiTrackManager.ts` (4), `BaseAudioRecorder.ts` (1), `NativeFileImporter.ts` (5) |
| `services/audio/mock/` | `MockAudioPlayer.ts` (10), `MockAudioRecorder.ts` (6), `MockAudioMixer.ts` (6), `index.ts` (1) |
| `services/audio/native/` | `index.ts` (1) |
| `services/storage/` | `AudioFileManager.native.ts` (12), `AudioFileManager.web.ts` (5) |
| `services/ffmpeg/` | `WebAudioExportService.ts` (7), `FFmpegService.native.ts` (2) |
| `store/migrations/` | `migrationSystem.ts` (10) |
| `utils/` | `audioUtils.web.ts` (1), `permissions.web.ts` (3), `permissions.native.ts` (4), `ffmpegLoader.web.ts` (6), `serviceWorkerRegistration.ts` (5) |
| `test-utils/` | `performanceUtils.ts` (2) |

**Do NOT modify:**
- `frontend/src/utils/logger.ts` — this IS the logger (uses `console.*` internally by design)
- `frontend/src/utils/logger.web.ts` — platform-specific logger implementation
- `frontend/src/utils/logger.native.ts` — platform-specific logger implementation
- Any test files (`*.test.ts`, `*.test.tsx`) or mock setup files

### Prerequisites

Tasks 1-5 completed (dead modules deleted, so we skip `devtools.ts` with 11 occurrences and `useAppLifecycle.ts` with 3 occurrences).

### Implementation Steps

1. For each file listed above:
   a. Add `import { logger } from "../../utils/logger";` (adjust relative path based on file location) if not already imported.
   b. Replace `console.log(...)` with `logger.log(...)`.
   c. Replace `console.warn(...)` with `logger.warn(...)`.
   d. Replace `console.error(...)` with `logger.error(...)`.
   e. Replace `console.info(...)` with `logger.info(...)`.
   f. Replace `console.debug(...)` with `logger.log(...)` — the logger utility does not expose a `debug()` method; `console.debug` is functionally equivalent to dev-only debug output, which maps to `logger.log` (gated behind `__DEV__`). This applies to `audioUtils.web.ts` (line 116).
2. Keep domain-specific tags in the message strings (e.g., `[WebAudioRecorder]`, `[NativeAudioPlayer]`) — they provide useful context.
3. Work through files in batches by directory. After each batch, run `npm run check` to catch issues early.
4. After all files are done, verify zero `console.*` warnings from ESLint (the `no-console` rule is already set to `warn` in `eslint.config.mjs` line 60).

### Verification Checklist

- [ ] Zero `console.log`, `console.warn`, `console.error`, `console.info`, or `console.debug` calls in `frontend/src/` (excluding `logger.ts`, `logger.web.ts`, `logger.native.ts`)
- [ ] Every file that previously had `console.*` calls now imports and uses `logger`
- [ ] `npm run check` passes
- [ ] `npm run lint` produces zero `no-console` warnings for source files

### Testing Instructions

```bash
npm run check
```

### Commit Message Template

```
refactor(logging): consolidate console.* calls to use logger utility

- Replace 148+ direct console.* calls across 21 source files with logger.*
- Map console.debug to logger.log (no debug() method in logger)
- Logger gates debug output behind __DEV__ flag
- No behavior change in production (logger.warn/error always log)
- Prepares for Phase 4 ESLint no-console error enforcement
```

---

## Phase 1 Completion Checklist

After all tasks are complete:

- [ ] `frontend/src/store/selectors.ts` — deleted
- [ ] `frontend/src/store/devtools.ts` — deleted
- [ ] `frontend/src/hooks/useAppLifecycle.ts` — deleted
- [ ] `frontend/src/services/lifecycle/LifecycleManager.ts` — deleted
- [ ] `frontend/__tests__/unit/services/LifecycleManager.test.ts` — deleted
- [ ] `frontend/src/store/useUIStore.ts` — deleted
- [ ] `CLAUDE.md` updated (no references to useUIStore or selectors.ts)
- [ ] `uuid` and `@types/uuid` removed from `frontend/package.json`
- [ ] Track IDs use `crypto.randomUUID()` instead of `Date.now()`
- [ ] `scaleVolume()` extracted to `frontend/src/utils/audioUtils.shared.ts` with unit tests
- [ ] Zero direct `console.*` calls in source files (excluding logger implementation)
- [ ] `npm run check` passes
- [ ] Net reduction: ~700+ lines of dead code removed
