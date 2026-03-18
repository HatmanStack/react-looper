# Phase 2 [IMPLEMENTER]: Critical Bug Fixes and Audio Architecture

## Phase Goal

Fix critical and high-severity bugs in the audio service layer: AudioContext leaks, unhandled exceptions, platform-unsafe code, module-scope side effects, blob URL leaks, and missing fetch timeouts. These are the highest-risk findings from the health audit and evaluation. (Duplicated logic and weak ID generation were already addressed in Phase 1.)

**Success criteria:**
- WebAudioPlayer and WebAudioMixer share a single AudioContext via a new singleton manager
- MediaRecorder onerror no longer throws an unhandled exception
- MainScreen export code is platform-safe (no bare `document` references on native)
- `initializeAudioServices()` is no longer called at module scope
- Blob URLs from recordings are revoked on track unload
- Audio fetch calls have a timeout via AbortController

**Estimated tokens:** ~25k

## Prerequisites

- Phase 0 read and understood
- Phase 1 complete (dead code removed, silent catch blocks have logging)
- `npm ci` from repo root
- `npm run check` passes (baseline green)

## Tasks

---

### Task 1: Fix AudioContext Leak on Track Unload

**Goal:** When `AudioService.unloadTrack()` is called, the underlying `WebAudioPlayer._unload()` releases the buffer and disconnects nodes but does NOT close its `AudioContext`. Only `cleanup()` closes it, and `cleanup()` is never called on individual players. This leaks one AudioContext per unloaded track, hitting Chrome's ~6 context limit after a few record-delete cycles. Addresses health-audit finding #1 (CRITICAL).

**Files to Modify:**
- `frontend/src/services/audio/WebAudioPlayer.ts` -- Add `audioContext.close()` to `_unload()`

**Prerequisites:**
- None (standalone fix, but will be superseded by Task 2's singleton approach)

**Implementation Steps:**
1. Read `frontend/src/services/audio/WebAudioPlayer.ts`, specifically the `_unload()` method (lines 295-322) and `cleanup()` method (lines 350-357).
2. In `_unload()`, after releasing the audio buffer and resetting timers, add AudioContext closure:
   ```typescript
   // Close AudioContext to prevent resource leak
   if (this.audioContext) {
     try {
       await this.audioContext.close();
     } catch {
       // Context may already be closed
     }
     this.audioContext = null;
   }
   ```
3. This makes `_unload()` fully self-cleaning. The `cleanup()` method should still work (it calls `unload()` first, so `audioContext` will already be null).
4. Run `npm run check`.

**Verification Checklist:**
- [ ] `_unload()` closes and nullifies `this.audioContext`
- [ ] `cleanup()` still works correctly (no double-close error)
- [ ] `npm run check` passes

**Testing Instructions:**
- Run existing WebAudioPlayer tests: `npm test -- WebAudioPlayer`
- No new tests required for this task (Task 2 will restructure context management and include tests)

**Commit Message Template:**
```
fix(audio): close AudioContext in WebAudioPlayer._unload() to prevent leak

- Add audioContext.close() call in _unload() method
- Prevents orphaned AudioContexts when tracks are removed
- Addresses CRITICAL finding #1 from health audit
```

---

### Task 2: Share AudioContext via Singleton

**Goal:** Each `WebAudioPlayer` creates its own `AudioContext` (line 36), and `WebAudioMixer` creates another (line 240). With up to 10 concurrent players plus the mixer, this can exceed Chrome's ~6 context limit even without the leak from Task 1. Create a shared AudioContext manager so all web audio components use a single context. Implements ADR-2 from Phase 0. Addresses health-audit findings #1 (CRITICAL) and #17 (MEDIUM).

**Files to Create:**
- `frontend/src/services/audio/audioContextManager.ts` -- Singleton AudioContext factory

**Files to Modify:**
- `frontend/src/services/audio/WebAudioPlayer.ts` -- Use shared context instead of creating its own
- `frontend/src/services/audio/WebAudioMixer.ts` -- Use shared context instead of creating its own

**Prerequisites:**
- Task 1 complete (understand the unload/cleanup flow)

**Implementation Steps:**
1. Create `frontend/src/services/audio/audioContextManager.ts`:
   ```typescript
   /**
    * AudioContext Manager
    *
    * Provides a shared AudioContext singleton for all web audio components.
    * Lazily creates the context on first access and handles the suspended-state
    * resume required by browser autoplay policies.
    *
    * ADR-2: Share AudioContext via singleton pattern.
    */
   import { logger } from "../../utils/logger";

   let sharedContext: AudioContext | null = null;
   let contextRefCount = 0;

   /**
    * Get the shared AudioContext, creating it lazily on first call.
    * Each caller should pair this with releaseAudioContext() when done.
    */
   export function getSharedAudioContext(): AudioContext {
     if (!sharedContext || sharedContext.state === "closed") {
       sharedContext = new AudioContext();
       contextRefCount = 0;
       logger.log("[AudioContextManager] Created shared AudioContext");
     }
     contextRefCount++;
     return sharedContext;
   }

   /**
    * Resume the shared AudioContext if suspended (browser autoplay policy).
    */
   export async function ensureContextResumed(): Promise<void> {
     if (sharedContext && sharedContext.state === "suspended") {
       await sharedContext.resume();
     }
   }

   /**
    * Decrement reference count. Called during player/mixer unload.
    * Does NOT close the context -- it remains available for other users.
    */
   export function releaseAudioContext(): void {
     contextRefCount = Math.max(0, contextRefCount - 1);
     logger.log(
       `[AudioContextManager] Released context ref, remaining: ${contextRefCount}`
     );
   }

   /**
    * Force-close the shared AudioContext. Called during full app cleanup only.
    */
   export async function closeSharedAudioContext(): Promise<void> {
     if (sharedContext && sharedContext.state !== "closed") {
       try {
         await sharedContext.close();
         logger.log("[AudioContextManager] Closed shared AudioContext");
       } catch {
         // Already closed
       }
     }
     sharedContext = null;
     contextRefCount = 0;
   }

   /**
    * Reset for testing -- close and nullify the shared context.
    * @internal Only use in test setup/teardown.
    */
   export async function resetAudioContextForTesting(): Promise<void> {
     await closeSharedAudioContext();
   }
   ```

2. Update `frontend/src/services/audio/WebAudioPlayer.ts`:
   - Add imports: `import { getSharedAudioContext, ensureContextResumed, releaseAudioContext } from "./audioContextManager";`
   - In `_load()`, replace:
     ```typescript
     if (!this.audioContext) {
       this.audioContext = new AudioContext();
     }
     ```
     with:
     ```typescript
     this.audioContext = getSharedAudioContext();
     ```
   - In `_load()` and `_play()`, replace:
     ```typescript
     if (this.audioContext.state === "suspended") {
       await this.audioContext.resume();
     }
     ```
     with:
     ```typescript
     await ensureContextResumed();
     ```
   - In `_unload()`, replace the AudioContext close block (added in Task 1) with:
     ```typescript
     // Release shared AudioContext reference
     if (this.audioContext) {
       releaseAudioContext();
       this.audioContext = null;
     }
     ```
   - In `cleanup()`, remove the `audioContext.close()` block since the context is shared:
     ```typescript
     public async cleanup(): Promise<void> {
       await this.unload();
       // Context is shared via audioContextManager; do not close here.
     }
     ```

3. Update `frontend/src/services/audio/WebAudioMixer.ts`:
   - Add imports: `import { getSharedAudioContext, releaseAudioContext } from "./audioContextManager";`
   - In `loadAudioBuffer()`, replace:
     ```typescript
     if (!this.audioContext) {
       this.audioContext = new AudioContext();
     }
     ```
     with:
     ```typescript
     if (!this.audioContext) {
       this.audioContext = getSharedAudioContext();
     }
     ```
   - In `cleanup()`, replace `audioContext.close()` with `releaseAudioContext()`:
     ```typescript
     public async cleanup(): Promise<void> {
       if (this.audioContext) {
         releaseAudioContext();
         this.audioContext = null;
       }
       this.cachedBlob = null;
     }
     ```
   - The `OfflineAudioContext` used for rendering in `_mixTracks()` is separate and stays as-is.

4. Update `frontend/src/services/audio/AudioService.ts`:
   - Add import: `import { closeSharedAudioContext } from "./audioContextManager";`
   - In the `cleanup()` method, after `await this.unloadAllTracks()`, add:
     ```typescript
     await closeSharedAudioContext();
     ```
   - This ensures the shared context is closed only during full app cleanup.

5. Run `npm run check`.

**Verification Checklist:**
- [ ] `audioContextManager.ts` exists and exports `getSharedAudioContext`, `ensureContextResumed`, `releaseAudioContext`, `closeSharedAudioContext`
- [ ] `WebAudioPlayer` no longer calls `new AudioContext()` directly
- [ ] `WebAudioMixer` no longer calls `new AudioContext()` directly
- [ ] No `audioContext.close()` calls remain in WebAudioPlayer or WebAudioMixer (only in the manager)
- [ ] Only `AudioService.cleanup()` calls `closeSharedAudioContext()`
- [ ] `npm run check` passes

**Testing Instructions:**
- Run existing tests: `npm test -- WebAudioPlayer` and `npm test -- WebAudioMixer`
- Add a new test file `frontend/src/services/audio/__tests__/audioContextManager.test.ts`:
  - Test that `getSharedAudioContext()` returns the same instance on multiple calls
  - Test that `closeSharedAudioContext()` nullifies the context
  - Test that `getSharedAudioContext()` creates a new context after close
  - Test that `ensureContextResumed()` is a no-op when no context exists
  - Mock `AudioContext` using the existing mock in `jest.mocks.js`

**Commit Message Template:**
```
refactor(audio): share AudioContext via singleton manager

- Create audioContextManager.ts with lazy singleton pattern
- Update WebAudioPlayer to use shared context instead of creating its own
- Update WebAudioMixer to use shared context instead of creating its own
- Eliminates AudioContext proliferation (Chrome ~6 limit)
- Implements ADR-2 from Phase 0
```

---

### Task 3: Fix WebAudioRecorder.onerror Throw

**Goal:** The `MediaRecorder.onerror` handler at `WebAudioRecorder.ts:91-98` throws an `AudioError` inside an async event callback. This `throw` is not inside a Promise chain or try/catch -- it becomes an unhandled exception that crashes the app instead of being caught by the recording error flow. Addresses health-audit finding #2 (CRITICAL).

**Files to Modify:**
- `frontend/src/services/audio/WebAudioRecorder.ts` -- Fix onerror handler

**Prerequisites:**
- None

**Implementation Steps:**
1. Read `frontend/src/services/audio/WebAudioRecorder.ts` lines 90-98 (the `onerror` handler) and lines 188-241 (the `_stopRecording` Promise).
2. The fix: instead of throwing, store the error and reject the pending stop promise if one exists. Add an instance field to hold a pending reject function:
   ```typescript
   private pendingRecordingReject: ((error: AudioError) => void) | null = null;
   ```
3. In the `onerror` handler (lines 91-98), replace the `throw` with:
   ```typescript
   this.mediaRecorder.onerror = (event: Event) => {
     logger.error("[WebAudioRecorder] MediaRecorder error:", event);
     const error = new AudioError(
       AudioErrorCode.RECORDING_FAILED,
       "MediaRecorder error occurred",
       "Recording failed. Please try again.",
     );
     // If a stop operation is pending, reject its promise
     if (this.pendingRecordingReject) {
       this.pendingRecordingReject(error);
       this.pendingRecordingReject = null;
     }
     // Clean up the recording state
     this.cleanupMediaStream();
   };
   ```
4. In `_stopRecording()`, store the reject function when creating the Promise (line 188):
   ```typescript
   return new Promise((resolve, reject) => {
     this.pendingRecordingReject = reject;
     // ... rest of existing logic
   ```
5. In the `onstop` handler inside `_stopRecording`, clear the pending reject on success (at the top of the callback, before blob creation):
   ```typescript
   this.mediaRecorder.onstop = () => {
     this.pendingRecordingReject = null;
     // ... rest of existing onstop logic
   ```
6. In `_cancelRecording()`, clear the pending reject:
   ```typescript
   this.pendingRecordingReject = null;
   ```
7. In `_cleanup()`, clear the pending reject:
   ```typescript
   this.pendingRecordingReject = null;
   ```
8. Run `npm run check`.

**Verification Checklist:**
- [ ] No `throw` statement exists inside the `onerror` callback
- [ ] `pendingRecordingReject` field is declared on the class
- [ ] `onerror` rejects the pending promise if one exists
- [ ] `onerror` cleans up the media stream
- [ ] `_stopRecording` stores the reject callback
- [ ] `_cancelRecording` and `_cleanup` clear the reject callback
- [ ] `npm run check` passes

**Testing Instructions:**
- Add a test in `frontend/src/services/audio/__tests__/WebAudioRecorder.test.ts` (create if needed):
  - Mock `MediaRecorder` to fire `onerror` after `start()`
  - Verify that `stopRecording()` rejects with an `AudioError` (not an unhandled exception)
  - Verify that the media stream is cleaned up after an error

**Commit Message Template:**
```
fix(audio): replace throw in WebAudioRecorder.onerror with promise rejection

- Store pending reject callback from _stopRecording promise
- onerror now rejects the promise instead of throwing into void
- Clean up media stream on error
- Clear pending reject in cancel and cleanup paths
```

---

### Task 4: Fix Platform-Specific Export Code in MainScreen

**Goal:** `MainScreen.tsx` lines 403-409 use `document.createElement("a")`, `document.body.appendChild()`, and `document.body.removeChild()` directly without any `Platform.OS` check. On Android/iOS, `document` is undefined and this will throw a `ReferenceError`. Addresses health-audit finding #3 (CRITICAL).

**Files to Create:**
- `frontend/src/utils/downloadFile.web.ts` -- Web download implementation using DOM
- `frontend/src/utils/downloadFile.ts` -- Native implementation (no-op with warning log)

**Files to Modify:**
- `frontend/src/screens/MainScreen/MainScreen.tsx` -- Replace inline DOM code with platform-safe import

**Prerequisites:**
- None

**Implementation Steps:**
1. Create `frontend/src/utils/downloadFile.web.ts`:
   ```typescript
   /**
    * Download a Blob as a file (Web implementation)
    *
    * Uses the DOM anchor element trick to trigger a browser download.
    */
   export function downloadBlob(blob: Blob, filename: string): void {
     const url = URL.createObjectURL(blob);
     const link = document.createElement("a");
     link.href = url;
     link.download = filename;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     URL.revokeObjectURL(url);
   }
   ```

2. Create `frontend/src/utils/downloadFile.ts` (native fallback):
   ```typescript
   /**
    * Download a Blob as a file (Native implementation)
    *
    * On native platforms, Blob-based downloads are not applicable.
    * The native export flow uses file URIs handled by the AudioExportService.
    * This function exists to satisfy the cross-platform import and should
    * not be called in normal native flows.
    */
   import { logger } from "./logger";

   export function downloadBlob(_blob: Blob, _filename: string): void {
     logger.warn(
       "[downloadFile] downloadBlob called on native platform -- this is unexpected. Native exports use file URIs."
     );
   }
   ```

3. Update `frontend/src/screens/MainScreen/MainScreen.tsx`:
   - Add import: `import { downloadBlob } from "../../utils/downloadFile";`
   - Replace lines 403-410 (the `document.createElement` block through `URL.revokeObjectURL`) with:
     ```typescript
     downloadBlob(result.data as Blob, `${filename}.${actualFormat}`);
     ```
   - The `URL.createObjectURL` and `URL.revokeObjectURL` calls are now handled inside `downloadBlob`, so they should be removed from MainScreen.

4. The platform-split file extensions (`.web.ts` vs `.ts`) follow the existing pattern used by `audioUtils.web.ts`/`audioUtils.native.ts`, `alert.web.ts`/`alert.ts`, etc. Metro and Expo resolve `.web.ts` on web and `.ts` (or `.native.ts`) on native platforms.

5. Run `npm run check`.

**Verification Checklist:**
- [ ] `downloadFile.web.ts` exists with `downloadBlob` export
- [ ] `downloadFile.ts` exists with `downloadBlob` export (native fallback)
- [ ] MainScreen no longer references `document` directly
- [ ] No `document.createElement`, `document.body.appendChild`, or `document.body.removeChild` in MainScreen
- [ ] `npm run check` passes

**Testing Instructions:**
- Run `npm test -- MainScreen` to verify no regressions
- Verify the web export flow still works by running `npm run web` and testing the save/export feature (manual test)

**Commit Message Template:**
```
fix(ui): extract platform-specific download to downloadFile.web.ts

- Move document.createElement("a") download logic to downloadFile.web.ts
- Add native fallback in downloadFile.ts
- MainScreen now uses platform-safe downloadBlob() import
- Prevents ReferenceError on Android/iOS
```

---

### Task 5: Fix Module-Scope initializeAudioServices() Side-Effect

**Goal:** `MainScreen.tsx` line 44 calls `initializeAudioServices()` at module scope, outside the component function. This executes during module evaluation as an import side-effect, before any React lifecycle. This breaks testability (any test importing MainScreen triggers audio initialization), prevents tree-shaking, and causes issues with SSR. Addresses health-audit finding #8 (HIGH).

**Files to Modify:**
- `frontend/src/screens/MainScreen/MainScreen.tsx` -- Move initialization into a lazy/effect pattern

**Prerequisites:**
- None

**Implementation Steps:**
1. Read `frontend/src/screens/MainScreen/MainScreen.tsx` line 44 and the `useEffect` at lines 101-124.
2. Remove line 44: `initializeAudioServices();`
3. Move the `initializeAudioServices()` call into the existing `useEffect` at the top of the component, before `getAudioService()`. The initialization is idempotent -- it registers services into a `ServiceRegistry` via `registerAudioServices()`, and re-registration replaces existing entries (see `AudioServiceFactory.ts:105-120`), so calling it in the effect is safe:
   ```typescript
   useEffect(() => {
     try {
       initializeAudioServices();
       audioServiceRef.current = getAudioService();
       setIsInitialized(true);
     } catch (error) {
       if (error instanceof AudioError) {
         Alert.alert("Error", error.userMessage);
       }
       setIsInitialized(true); // Show UI even on error
     }

     return () => {
       // Cleanup on unmount
       if (audioServiceRef.current) {
         audioServiceRef.current.cleanup();
       }
       if (recordingTimerRef.current) {
         clearTimeout(recordingTimerRef.current);
       }
       if (recordingIntervalRef.current) {
         clearInterval(recordingIntervalRef.current);
       }
     };
   }, []);
   ```
4. Run `npm run check`.

**Verification Checklist:**
- [ ] No `initializeAudioServices()` call exists outside the component function
- [ ] `initializeAudioServices()` is called inside the `useEffect` before `getAudioService()`
- [ ] The initialization effect still has an empty dependency array `[]`
- [ ] `npm run check` passes

**Testing Instructions:**
- Run `npm test -- MainScreen` to verify no regressions
- Verify that importing MainScreen in a test file no longer triggers audio service initialization as a side-effect

**Commit Message Template:**
```
fix(ui): move initializeAudioServices() from module scope into useEffect

- Remove module-scope side-effect call at line 44
- Call initializeAudioServices() inside the existing initialization useEffect
- Prevents side-effects during module evaluation and test imports
```

---

### Task 6: Fix WebAudioRecorder Blob URL Memory Leak

**Goal:** Blob URLs created via `URL.createObjectURL(audioBlob)` in `WebAudioRecorder._stopRecording()` (line 211) are never revoked when tracks are removed. The `performDelete` flow in MainScreen calls `audioService.unloadTrack()`, which calls `WebAudioPlayer._unload()`, but `_unload()` does not handle blob URLs. Over many record-delete cycles, blob URLs accumulate in browser memory. Addresses health-audit finding #14 (MEDIUM).

**Files to Modify:**
- `frontend/src/services/audio/WebAudioPlayer.ts` -- Revoke blob URLs on unload

**Prerequisites:**
- Task 2 complete (WebAudioPlayer `_unload()` has already been modified)

**Implementation Steps:**
1. Read `frontend/src/services/audio/BaseAudioPlayer.ts` to confirm that the loaded URI is available to subclasses. The `_currentUri` field is declared as `protected _currentUri: string | null = null;` at line 20. The base class `unload()` method calls `await this._unload()` first and sets `this._currentUri = null` after, so `_currentUri` is still available during `_unload()`.
2. In `frontend/src/services/audio/WebAudioPlayer.ts`, update `_unload()` to revoke blob URLs. Add this block after disconnecting the gain node and before releasing the audio buffer:
   ```typescript
   // Revoke blob URL to free memory (recordings create blob: URIs)
   if (this._currentUri && this._currentUri.startsWith("blob:")) {
     try {
       URL.revokeObjectURL(this._currentUri);
     } catch {
       // Ignore if already revoked
     }
   }
   ```
3. The `blob:` prefix check ensures we only revoke blob URLs -- not `http:`, `https:`, or `file:` URIs which should not be revoked.
4. Run `npm run check`.

**Verification Checklist:**
- [ ] `_unload()` checks for blob URLs via `this._currentUri.startsWith("blob:")`
- [ ] `URL.revokeObjectURL()` is called only for blob URLs
- [ ] The revocation happens before `this.audioBuffer = null`
- [ ] `npm run check` passes

**Testing Instructions:**
- Add a test that mocks `URL.revokeObjectURL` and verifies it is called when unloading a track loaded with a `blob:` URI
- Add a test that verifies `URL.revokeObjectURL` is NOT called when unloading a track loaded with an `https:` URI

**Commit Message Template:**
```
fix(audio): revoke blob URLs in WebAudioPlayer._unload() to prevent memory leak

- Check for blob: URI prefix before revoking
- Prevents memory accumulation on record-delete cycles
```

---

### Task 7: Add Timeout/AbortController to Audio Fetch Calls

**Goal:** `fetch()` calls in `WebAudioPlayer._load()` (line 45) and `WebAudioMixer.loadAudioBuffer()` (line 235) have no timeout or AbortController. On slow connections or large files, the fetch hangs indefinitely with no user feedback or escape mechanism. Addresses health-audit finding #7 (HIGH).

**Files to Modify:**
- `frontend/src/utils/audioUtils.shared.ts` -- Add `fetchWithTimeout` utility (file created in Phase 1 Task 8)
- `frontend/src/services/audio/WebAudioPlayer.ts` -- Use `fetchWithTimeout`
- `frontend/src/services/audio/WebAudioMixer.ts` -- Use `fetchWithTimeout`

**Prerequisites:**
- Phase 1 Task 8 complete (`audioUtils.shared.ts` exists with `scaleVolume`)

**Implementation Steps:**
1. Add imports and the timeout utility to `frontend/src/utils/audioUtils.shared.ts`:
   ```typescript
   import { AudioError } from "../services/audio/AudioError";
   import { AudioErrorCode } from "../types/audio";

   /** Default timeout for audio fetch operations (30 seconds) */
   export const AUDIO_FETCH_TIMEOUT_MS = 30_000;

   /**
    * Fetch with timeout using AbortController.
    * Throws an AudioError if the request times out.
    *
    * @param uri - The URI to fetch
    * @param timeoutMs - Timeout in milliseconds (default: 30s)
    * @returns The fetch Response
    */
   export async function fetchWithTimeout(
     uri: string,
     timeoutMs: number = AUDIO_FETCH_TIMEOUT_MS,
   ): Promise<Response> {
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

     try {
       const response = await fetch(uri, { signal: controller.signal });
       clearTimeout(timeoutId);
       return response;
     } catch (error) {
       clearTimeout(timeoutId);
       if ((error as Error).name === "AbortError") {
         throw new AudioError(
           AudioErrorCode.PLAYBACK_FAILED,
           `Audio fetch timed out after ${timeoutMs}ms: ${uri}`,
           "Audio file took too long to load. Please check your connection and try again.",
         );
       }
       throw error;
     }
   }
   ```

2. Update `frontend/src/services/audio/WebAudioPlayer.ts`:
   - Add import: `import { fetchWithTimeout } from "../../utils/audioUtils.shared";`
   - In `_load()`, replace `const response = await fetch(uri);` with:
     ```typescript
     const response = await fetchWithTimeout(uri);
     ```

3. Update `frontend/src/services/audio/WebAudioMixer.ts`:
   - Add import: `import { fetchWithTimeout } from "../../utils/audioUtils.shared";`
   - In `loadAudioBuffer()`, replace `const response = await fetch(uri);` with:
     ```typescript
     const response = await fetchWithTimeout(uri);
     ```

4. Run `npm run check`.

**Verification Checklist:**
- [ ] `fetchWithTimeout` is exported from `audioUtils.shared.ts`
- [ ] `AUDIO_FETCH_TIMEOUT_MS` constant is exported (30000)
- [ ] `WebAudioPlayer._load()` uses `fetchWithTimeout` instead of bare `fetch`
- [ ] `WebAudioMixer.loadAudioBuffer()` uses `fetchWithTimeout` instead of bare `fetch`
- [ ] AbortError is caught and converted to a user-friendly AudioError
- [ ] The timeout ID is cleared on both success and error paths (no dangling timers)
- [ ] `npm run check` passes

**Testing Instructions:**
- Add tests in `frontend/src/utils/__tests__/audioUtils.shared.test.ts`:
  - Mock `global.fetch` to never resolve; use `jest.useFakeTimers()` and `jest.advanceTimersByTime(30_000)` to trigger timeout; verify `fetchWithTimeout` rejects with an AudioError containing "timed out"
  - Mock `global.fetch` to resolve normally; verify the Response is returned
  - Mock `global.fetch` to reject with a `TypeError` (network error); verify the original error propagates (not wrapped as timeout)
- Run: `npm test -- frontend/src/utils/__tests__/audioUtils.shared.test.ts`

**Commit Message Template:**
```
fix(audio): add AbortController timeout to audio fetch calls

- Create fetchWithTimeout utility with 30s default timeout
- Replace bare fetch() in WebAudioPlayer._load() and WebAudioMixer.loadAudioBuffer()
- Converts AbortError to user-friendly AudioError message
- Prevents indefinite hangs on slow or stalled connections
```

---

## Phase Verification

After all 7 tasks are complete:

1. **Run full check suite:** `npm run check` -- all lint, typecheck, and tests must pass
2. **Verify AudioContext singleton:**
   - Grep for `new AudioContext()` in `frontend/src/services/audio/` -- should only appear in `audioContextManager.ts`
   - Grep confirms `WebAudioPlayer.ts` and `WebAudioMixer.ts` import from `audioContextManager`
3. **Verify no unhandled throws:**
   - Grep for `throw` inside event handler callbacks in `WebAudioRecorder.ts` -- should find none in `onerror`
4. **Verify no bare document references in screens:**
   - Grep for `document\.createElement\|document\.body` in `frontend/src/screens/` -- should find none
5. **Verify no module-scope side-effects:**
   - Grep for `initializeAudioServices()` outside of `useEffect` or function bodies in `MainScreen.tsx` -- should find none
6. **Verify no Date.now() track IDs:** (handled in Phase 1 Tasks 6+7; verify as a regression check)
   - Grep for `Date.now()` in `MainScreen.tsx` -- should only appear in `createdAt` timestamps, not in `id` fields
7. **Verify no bare fetch():**
   - Grep for `await fetch(` in `WebAudioPlayer.ts` and `WebAudioMixer.ts` -- should find none (replaced with `fetchWithTimeout`)
8. **Verify no duplicated scaleVolume:** (handled in Phase 1 Task 8; verify as a regression check)
   - Grep for `Math.log(100 - volume)` in `frontend/src/` -- should only appear in `utils/audioUtils.shared.ts`
9. **Run test count comparison:** Test count should have increased (new test files for audioContextManager, audioUtils.shared fetchWithTimeout tests, and optionally WebAudioRecorder error handling)
10. **Run `git diff --stat`:** Phase should be net-positive in lines (new utilities + tests added)

**Known limitations:**
- WebAudioMixer still reads `useSettingsStore.getState()` directly (service-store coupling, deferred to Phase 3)
- MainScreen is still a god component (extraction deferred to Phase 3)
- `WebAudioMixer._cancel()` is still limited -- `OfflineAudioContext.startRendering()` cannot be interrupted mid-render; only post-render processing can be skipped
- Blob URL revocation only covers the WebAudioPlayer unload path; the WebAudioFileManager has its own revocation in `deleteFile()` which is not changed here
- State persistence (disabled Zustand persist middleware) is deferred from this remediation cycle per README (YAGNI)
