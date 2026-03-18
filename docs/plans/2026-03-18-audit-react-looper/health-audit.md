---
type: repo-health
date: 2026-03-18
goal: general-health-check
---

# Codebase Health Audit: react-looper

## Configuration
- **Goal:** General health check — scan all 4 vectors equally
- **Scope:** Full repo, no constraints
- **Existing Tooling:** Full setup — linters, CI pipeline, pre-commit hooks, type checking
- **Constraints:** None
- **Deployment Target:** Serverless (Lambda, Cloud Functions) + Static hosting / SPA (web) + Mobile (Android, iOS)

## Summary
- Overall health: FAIR
- Biggest structural risk: Service layer is directly coupled to Zustand stores (WebAudioMixer, LoopEngine), making services untestable without store setup and preventing reuse outside the React context.
- Biggest operational risk: WebAudioPlayer leaks one AudioContext per track unload, and browsers hard-limit AudioContexts (~6 in Chrome), meaning the app will silently fail after removing and re-adding several tracks.
- Total findings: 3 critical, 6 high, 8 medium, 7 low

## Tech Debt Ledger

### CRITICAL

1. **[Operational Debt]** `frontend/src/services/audio/WebAudioPlayer.ts:36` and `frontend/src/services/audio/AudioService.ts:283`
   - **The Debt:** Each `WebAudioPlayer` creates its own `AudioContext` (line 36). When `AudioService.unloadTrack()` is called (line 283), it invokes `player.unload()` which does NOT close the AudioContext. Only `player.cleanup()` (line 350-357) closes it, but `cleanup()` is never called on individual players -- only on the recorder. Browsers limit concurrent AudioContexts (Chrome: ~6).
   - **The Risk:** After a user records 6+ tracks and removes/re-adds them, audio playback will silently fail. Each page session accumulates orphaned AudioContexts with no recovery path short of a full page reload.

2. **[Operational Debt]** `frontend/src/services/audio/WebAudioRecorder.ts:91-98`
   - **The Debt:** The `MediaRecorder.onerror` handler throws an `AudioError` inside an asynchronous event callback. This `throw` is not inside a Promise chain or try/catch scope -- it becomes an unhandled exception.
   - **The Risk:** Recording errors will crash the app with an uncaught exception instead of being caught by the error handling infrastructure. The user sees a blank screen or unresponsive UI with no recovery path.

3. **[Architectural Debt]** `frontend/src/screens/MainScreen/MainScreen.tsx:403-409`
   - **The Debt:** Direct use of `document.createElement("a")`, `document.body.appendChild()`, and `document.body.removeChild()` in the MainScreen component with no `Platform.OS` check or `.web.ts` file split. This is a cross-platform app targeting Android, iOS, and web.
   - **The Risk:** The save/export flow will throw a fatal `ReferenceError: document is not defined` crash on Android and iOS when a user tries to export audio.

### HIGH

4. **[Architectural Debt]** `frontend/src/services/audio/WebAudioMixer.ts:13,80`
   - **The Debt:** A service-layer class directly imports and reads from `useSettingsStore` (a Zustand React hook store) to get `loopCrossfadeDuration`. Similarly, `frontend/src/services/loop/LoopEngine.ts:13-14,66,87,125-126` directly accesses `useTrackStore` and `usePlaybackStore`.
   - **The Risk:** Services are tightly coupled to UI state management. They cannot be unit-tested without initializing Zustand stores, cannot be reused in a worker thread or non-React context, and create a bidirectional dependency between service and store layers.

5. **[Structural Debt]** `frontend/src/screens/MainScreen/MainScreen.tsx:46-816` (770 lines of component logic)
   - **The Debt:** The MainScreen component is a god component containing recording logic, playback orchestration, import handling, export/save flow with FFmpeg, track CRUD, speed/volume control, confirmation dialogs, and timer management. It manages 8 `useState` hooks, 3 `useRef` timers, and 10+ event handlers with business logic.
   - **The Risk:** Untestable (no test exists for MainScreen), any change risks regressions across unrelated features, and logic is unreusable (e.g., recording flow cannot be triggered from a different screen).

6. **[Structural Debt]** `frontend/src/screens/MainScreen/MainScreen.tsx:79-80` vs `frontend/src/store/useUIStore.ts:17-19`
   - **The Debt:** MainScreen maintains local `isRecording` and `isLoading` state via `useState` while `useUIStore` defines identical state fields (`isRecording`, `isMixing`, `isLoading`). The `useUIStore` is never consumed by any screen or component -- it is completely dead despite having full selectors defined in `selectors.ts`.
   - **The Risk:** Duplicated source of truth. If another screen or component needs to check recording state, it cannot access MainScreen's local state, forcing further duplication.

7. **[Operational Debt]** `frontend/src/services/audio/WebAudioPlayer.ts:45`, `frontend/src/services/audio/WebAudioMixer.ts:235`
   - **The Debt:** `fetch()` calls to load audio data have no timeout, no AbortController, and no retry logic. On slow connections or large files, the fetch will hang indefinitely.
   - **The Risk:** A single slow or stalled network request blocks the entire UI with no user feedback or escape mechanism. On mobile with intermittent connectivity, this creates a frozen-app experience.

8. **[Architectural Debt]** `frontend/src/screens/MainScreen/MainScreen.tsx:44`
   - **The Debt:** `initializeAudioServices()` is called at module scope (outside the component function), executing as an import side-effect. This runs during module evaluation, before any React lifecycle.
   - **The Risk:** Breaks testability (tests importing MainScreen trigger audio initialization), prevents tree-shaking, and causes issues with SSR/static export where platform APIs are unavailable. Also makes initialization order unpredictable.

9. **[Operational Debt]** `frontend/src/services/audio/WebAudioMixer.ts:334-338`
   - **The Debt:** The `_cancel()` method is a no-op that logs "Cancel requested but not supported." `OfflineAudioContext.startRendering()` cannot be cancelled once started.
   - **The Risk:** The cancel button in the mixing UI does nothing on web. For long mixes (multiple loops, many tracks), the user has no way to abort the operation, and the UI remains blocked until rendering completes.

### MEDIUM

10. **[Structural Debt]** `frontend/src/services/audio/WebAudioPlayer.ts:193-210` and `frontend/src/services/audio/WebAudioMixer.ts:260-268`
    - **The Debt:** Identical logarithmic volume scaling formula (`1 - Math.log(100 - volume) / Math.log(100)`) is duplicated in two separate classes, each as a private method (`_applyVolumeToGainNode` and `scaleVolume`).
    - **The Risk:** If the volume curve is adjusted in one location but not the other, playback and exported audio will have mismatched volumes, creating a confusing user experience where "what I hear" differs from "what I export."

11. **[Code Hygiene Debt]** `frontend/src/store/selectors.ts:1-178`
    - **The Debt:** The entire 178-line selectors module with 15+ optimized selectors is never imported by any component, screen, or service. Components use inline selectors instead (e.g., `MainScreen.tsx:55-74` uses `useTrackStore((state) => state.tracks)`).
    - **The Risk:** Dead code that creates maintenance burden -- developers may update selectors thinking they affect behavior when they do not.

12. **[Code Hygiene Debt]** `frontend/src/store/devtools.ts:1-207`, `frontend/src/hooks/useAppLifecycle.ts:1-160`, `frontend/src/services/lifecycle/LifecycleManager.ts`
    - **The Debt:** Three substantial modules (totaling ~530 lines) are defined but never imported or used by the application. `devtools.ts` is 207 lines of state logging infrastructure, `useAppLifecycle.ts` is 160 lines of lifecycle management, and `LifecycleManager.ts` is only referenced by its own test.
    - **The Risk:** Dead code increases bundle size and confuses developers about which utilities are active.

13. **[Code Hygiene Debt]** `frontend/src/screens/MainScreen/MainScreen.tsx:250,297`
    - **The Debt:** Track IDs are generated using `Date.now()` (`track-${Date.now()}`). The `uuid` package is listed as a dependency in `frontend/package.json:47` but never imported anywhere in the source code.
    - **The Risk:** `Date.now()` can produce duplicate IDs under rapid operations (e.g., fast import + record within same millisecond). The unused `uuid` dependency adds to bundle size for no benefit.

14. **[Operational Debt]** `frontend/src/services/audio/WebAudioRecorder.ts:211`
    - **The Debt:** Blob URLs created via `URL.createObjectURL(audioBlob)` during recording are never explicitly revoked when tracks are removed from the store (the unload path in `WebAudioPlayer._unload()` does not handle blob URLs).
    - **The Risk:** Each recording creates a blob URL that persists in browser memory until page unload. Repeated record-delete cycles accumulate memory usage with no reclamation.

15. **[Architectural Debt]** `frontend/src/store/useTrackStore.ts:14`, `frontend/src/store/usePlaybackStore.ts:15`, `frontend/src/store/useSettingsStore.ts:13`
    - **The Debt:** All three Zustand stores have persistence disabled with `// TODO: Re-implement persistence with platform-specific approach`. No persistence middleware is active.
    - **The Risk:** All user data (tracks, settings, playback state) is lost on every app restart or page refresh. For a creative tool where users build loop compositions, this is a significant UX gap.

16. **[Structural Debt]** `frontend/src/screens/MainScreen/MainScreen.tsx:130-137`
    - **The Debt:** The `calculateQuantizedDuration` function contains a `multiples` array `[1, 2, 4, 8]` but hardcodes `multiples[0]` (always 1x). The function signature suggests dynamic quantization but the implementation is static.
    - **The Risk:** Misleading code that suggests an unfinished feature. Future developers may misunderstand the intent.

17. **[Operational Debt]** `frontend/src/services/audio/WebAudioPlayer.ts:36` (separate from CRITICAL #1)
    - **The Debt:** Each `WebAudioPlayer` creates a new `AudioContext()` instead of sharing one across all players. With `maxConcurrentPlayers` defaulting to 10, a full session could attempt 10 simultaneous AudioContexts.
    - **The Risk:** Browser AudioContext limits are low. Even without the leak described in CRITICAL #1, having 10 active contexts simultaneously exceeds most browser limits.

### LOW

18. **[Code Hygiene Debt]** 149 `console.log/warn/error` calls across 26 files
    - **The Debt:** While a `logger` utility exists and is used in many places, direct `console.*` calls still appear extensively, particularly in `MultiTrackManager.ts:87,104,122,165` and `NativeAudioPlayer.ts` (16 occurrences) and `WebAudioExportService.ts` (7 occurrences).
    - **The Risk:** Inconsistent logging behavior between production and development, and no way to globally control log output.

19. **[Code Hygiene Debt]** `frontend/src/services/ffmpeg/WebAudioExportService.ts:28`
    - **The Debt:** `const LameJS = lamejs as any` casts the entire lamejs library to `any`, disabling all type checking for MP3 encoding operations.
    - **The Risk:** Type errors in MP3 encoding logic (e.g., passing wrong argument types to `Mp3Encoder`) will not be caught at compile time.

20. **[Code Hygiene Debt]** `frontend/.gitignore` (root `.gitignore`)
    - **The Debt:** The `.gitignore` only covers `.expo/`, `node_modules/`, `dist/`, and `coverage/`. It does not exclude `.env`, `.env.local`, OS files (`.DS_Store`, `Thumbs.db`), IDE files (`.vscode/`, `.idea/`), or build artifacts.
    - **The Risk:** Environment files with secrets or IDE-specific configuration could be accidentally committed.

21. **[Operational Debt]** npm audit: 15 vulnerabilities (1 critical, 6 high, 2 moderate, 6 low)
    - **The Debt:** Dependencies include known vulnerabilities: `braces` (CRITICAL - ReDoS), `tar` (HIGH - path traversal), `undici` (HIGH - multiple HTTP smuggling/decompression issues), `webpack` (HIGH - SSRF bypass).
    - **The Risk:** While most are in dev/build dependencies and not directly exploitable at runtime in a client-side app, the `undici` and `webpack` vulnerabilities could affect build pipelines or server-side rendering contexts.

22. **[Code Hygiene Debt]** Multiple catch blocks that silently swallow errors
    - **The Debt:** Silent catch blocks at `WebAudioPlayer.ts:145,162,304`, `NativeFileImporter.ts:76,217`, `audioUtils.native.ts:63,87` -- all catch errors with only comments like "Ignore errors if already stopped" and no logging.
    - **The Risk:** When these error paths are hit unexpectedly, there is zero diagnostic information available. Debugging playback issues becomes extremely difficult.

23. **[Code Hygiene Debt]** Missing test coverage for critical paths
    - **The Debt:** No tests exist for: `MainScreen` (the primary UI and orchestration layer), `WebAudioRecorder`, `NativeAudioRecorder`, `WebFileImporter`, `NativeFileImporter`, `WebAudioExportService` (MP3 encoding path), `AudioExportService` (platform routing), or any integration between audio service and stores.
    - **The Risk:** The most complex and user-facing code paths have zero automated test coverage. The 42 test files that exist cover stores, utilities, and simpler components, but the recording/playback/export pipeline -- where most bugs would occur -- is untested.

24. **[Code Hygiene Debt]** `frontend/src/components/ErrorBoundary/ErrorBoundary.tsx:80-113`
    - **The Debt:** The ErrorBoundary fallback UI uses hardcoded color values (`#1A1A1A`, `#FFFFFF`, `#999999`, `#EF5555`) instead of the app's theme from `paperTheme.ts`.
    - **The Risk:** Visual inconsistency if the theme changes, and the error screen may be inaccessible depending on OS dark/light mode settings.

## Quick Wins

1. `frontend/src/services/audio/AudioService.ts:283` — Change `track.player.unload()` to call a method that also closes the AudioContext (either call `cleanup()` or add `audioContext.close()` to `_unload()`). (Estimated effort: < 30 minutes)

2. `frontend/src/services/audio/WebAudioRecorder.ts:91-98` — Replace the `throw` in the `onerror` callback with proper error state handling (set an error flag, reject a pending promise, or emit an event). (Estimated effort: < 30 minutes)

3. `frontend/src/screens/MainScreen/MainScreen.tsx:250,297` — Replace `Date.now()` IDs with `uuid` (already in dependencies). Remove `uuid` from `package.json` if choosing a different approach. (Estimated effort: < 15 minutes)

4. Delete unused modules: `frontend/src/store/selectors.ts`, `frontend/src/store/devtools.ts`, `frontend/src/hooks/useAppLifecycle.ts` -- or integrate them. (Estimated effort: < 15 minutes)

5. `frontend/src/services/audio/WebAudioPlayer.ts:193-210` and `frontend/src/services/audio/WebAudioMixer.ts:260-268` — Extract shared `scaleVolume()` to a utility function in `audioUtils`. (Estimated effort: < 30 minutes)

## Automated Scan Results

**Dead code (knip):** Tool failed to load due to missing `@eslint/js` module in the frontend workspace. Manual analysis identified ~530 lines of dead code across 4 modules: `selectors.ts` (178 lines), `devtools.ts` (207 lines), `useAppLifecycle.ts` (160 lines), and `useUIStore.ts` (88 lines, plus its selectors). The `uuid` dependency is listed but never imported.

**Vulnerability scan (npm audit):** 15 vulnerabilities found -- 1 critical (braces ReDoS), 6 high (tar path traversal x3, undici HTTP smuggling/decompression x2, webpack SSRF x1), 2 moderate, 6 low. All are fixable via `npm audit fix`.

**Secrets scan:** No hardcoded secrets, API keys, or tokens found. Three `process.env` references are for standard build configuration (`NODE_ENV`, `PUBLIC_URL`, `ENABLE_STATE_LOGGING`). No `.env` files found in repo. However, `.gitignore` does not explicitly exclude `.env` files, creating risk of accidental future commit.

**Git hygiene:** 30 recent commits show active development with reasonable commit messages. No committed build artifacts or large binaries detected.
