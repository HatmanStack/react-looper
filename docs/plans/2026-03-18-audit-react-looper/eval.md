---
type: repo-eval
target: 9
role_level: senior
date: 2026-03-18
pillar_overrides:
  git_hygiene: accept
---

# Repo Evaluation: react-looper

## Configuration
- **Role Level:** Senior Developer — production: defensive coding, observability, performance awareness, type rigor
- **Focus Areas:** Balanced evaluation across all pillars
- **Exclusions:** Standard exclusions (vendor, generated, node_modules, __pycache__)

## Combined Scorecard

| # | Lens | Pillar | Score | Target | Status |
|---|------|--------|-------|--------|--------|
| 1 | Hire | Problem-Solution Fit | 8/10 | 9 | NEEDS WORK |
| 2 | Hire | Architecture | 8/10 | 9 | NEEDS WORK |
| 3 | Hire | Code Quality | 7/10 | 9 | NEEDS WORK |
| 4 | Hire | Creativity | 7/10 | 9 | NEEDS WORK |
| 5 | Stress | Pragmatism | 8/10 | 9 | NEEDS WORK |
| 6 | Stress | Defensiveness | 8/10 | 9 | NEEDS WORK |
| 7 | Stress | Performance | 7/10 | 9 | NEEDS WORK |
| 8 | Stress | Type Rigor | 7/10 | 9 | NEEDS WORK |
| 9 | Day 2 | Test Value | 6/10 | 9 | NEEDS WORK |
| 10 | Day 2 | Reproducibility | 7/10 | 9 | NEEDS WORK |
| 11 | Day 2 | Git Hygiene | 7/10 | — | ACCEPTED |
| 12 | Day 2 | Onboarding | 7/10 | 9 | NEEDS WORK |

**Pillars at target (>=9):** 0/12
**Pillars needing work (<9):** 11/12 (1 accepted)

---

## Hire Evaluation — The Pragmatist

### VERDICT
- **Decision:** HIRE
- **Overall Grade:** B+
- **One-Line:** "Solves the right problem with appropriate technology, and the architecture would hold up under real-world feature growth."

### SCORECARD
| Pillar | Score | Evidence |
|--------|-------|----------|
| Problem-Solution Fit | 8/10 | `frontend/package.json:19-48` — Expo + React Native is the right call for a cross-platform audio looper; dependencies (zustand, expo-av, lamejs, ffmpeg-kit) are all justified. `frontend/src/services/ffmpeg/WebAudioExportService.ts:1-6` — Pragmatic decision to avoid FFmpeg.wasm's Metro bundler issues and use Web Audio API directly instead. |
| Architecture | 8/10 | `frontend/src/services/audio/AudioServiceFactory.ts:40-74` — Clean factory + registry pattern for platform abstraction; swappable without cascading changes. `frontend/src/services/audio/BaseAudioPlayer.ts:16-78` — Template method pattern in BaseAudioPlayer provides contract enforcement while allowing platform divergence. |
| Code Quality | 7/10 | `frontend/src/services/audio/AudioError.ts:60-81` — Exhaustive switch with `assertNever` and typed error codes is excellent. `frontend/src/store/usePlaybackStore.ts:68-85` — The `updateTrackState` helper with early-exit optimization shows performance awareness. However, `frontend/src/screens/MainScreen/MainScreen.tsx:791-812` has inline styles, and persistence is disabled with TODO comments in 3 store files. |
| Creativity | 7/10 | `frontend/src/services/ffmpeg/FFmpegCommandBuilder.ts:99-126` — Clever atempo filter chaining to work around FFmpeg's 0.5-2.0x limitation. `frontend/src/services/audio/WebAudioMixer.ts:109-161` — Crossfade implementation at loop boundaries using Web Audio API scheduling is well-thought-out. |

### HIGHLIGHTS
- **Brilliance:**
  - `frontend/src/services/audio/AudioServiceFactory.ts` — The service registry with factory pattern is exactly the right abstraction for cross-platform audio. Platform services are registered at init time, and the rest of the codebase is platform-agnostic. This is the kind of architecture that survives 10x feature growth.
  - `frontend/src/utils/loopUtils.ts` — Pure functions with thorough edge case handling (`isFinite` checks, fallback speeds, division-by-zero guards). Every function is well-documented with JSDoc examples. The test file (`frontend/src/utils/__tests__/loopUtils.test.ts`) follows TDD discipline.
  - `frontend/src/services/audio/AudioError.ts` — Custom error class with error codes, user-friendly messages, recoverability classification, platform tagging, `toJSON()` for logging, and `assertNever` for exhaustive handling. This is production-grade error infrastructure.
  - `frontend/src/store/usePlaybackStore.ts:68-85` — The `updateTrackState` helper that returns the original Map reference when nothing changed is a subtle but important optimization for Zustand re-render prevention.

- **Concerns:**
  - `frontend/src/store/useTrackStore.ts:14`, `usePlaybackStore.ts:15`, `useSettingsStore.ts:13` — Persistence is disabled across all three stores with TODO comments. This means users lose all state on app restart. For a production app, this is a significant gap.
  - `frontend/src/screens/MainScreen/MainScreen.tsx` — This 816-line component holds a lot of business logic (recording orchestration, auto-stop timers, confirmation dialogs, export flow). While callbacks are memoized, the component could benefit from custom hooks extraction (e.g., `useRecording`, `useExport`).
  - `frontend/src/services/audio/MultiTrackManager.ts:87-88` — Raw `console.error` calls instead of using the `logger` utility. The migration system (`migrationSystem.ts`) also uses raw `console.log/error/warn` throughout rather than the logger.
  - `frontend/src/screens/MainScreen/MainScreen.tsx:249` — Track IDs are generated with `Date.now()`, which can collide if two tracks are created within the same millisecond. The `uuid` package is in dependencies but unused here.

### REMEDIATION TARGETS

- **Problem-Solution Fit (current: 8/10 → target: 9/10)**
  - Re-enable state persistence across all Zustand stores. The persistence middleware was removed due to `import.meta` errors; the migration system is already built (`migrationSystem.ts`, `trackMigrations.ts`), it just needs platform-specific storage adapters connected. The `storage.ts` file and async-storage dependency are already in place.
  - Files: `frontend/src/store/useTrackStore.ts`, `usePlaybackStore.ts`, `useSettingsStore.ts`, `storage.ts`
  - What 9/10 looks like: User closes and reopens the app; tracks, playback settings, and preferences are all restored.
  - Estimated complexity: MEDIUM

- **Architecture (current: 8/10 → target: 9/10)**
  - Extract MainScreen business logic into custom hooks: `useRecordingSession` (record/stop/auto-stop timer), `useTrackPlayback` (play/pause/delete/speed/volume), `useExportFlow` (save modal + mixing). This would make MainScreen a pure layout component and make each concern independently testable.
  - Files: `frontend/src/screens/MainScreen/MainScreen.tsx` (currently 816 lines)
  - What 9/10 looks like: MainScreen under 200 lines, each hook under 100 lines, each with its own test file.
  - Estimated complexity: MEDIUM

- **Code Quality (current: 7/10 → target: 9/10)**
  - Replace all raw `console.*` calls with the `logger` utility. There are 145 occurrences across 25 files. The `logger.ts` already gates debug logs behind `__DEV__`, so this is a straightforward search-and-replace with appropriate log levels.
  - Files: `MultiTrackManager.ts`, `migrationSystem.ts`, `WebAudioExportService.ts`, `NativeAudioPlayer.ts`, `NativeAudioRecorder.ts`, and others.
  - Use `uuid` for track IDs instead of `Date.now()` (the dependency is already installed).
  - Remove inline styles from MainScreen loading overlay (line 791-812) and move to the styles file.
  - What 9/10 looks like: Zero raw console calls in `src/`, consistent logger usage, no inline styles, collision-proof IDs.
  - Estimated complexity: LOW

- **Creativity (current: 7/10 → target: 9/10)**
  - The WebAudioMixer crossfade and atempo chaining are good, but the `LoopEngine` service class is underutilized -- it exists but doesn't appear to be consumed by the UI layer (MainScreen reads directly from stores). Wiring LoopEngine into the recording and playback flows would centralize loop logic and enable features like quantized multi-bar recording and drift correction.
  - The `MultiTrackManager` has drift detection (`getDrift()`) and resync (`resyncTracks()`) but they appear to be unused. Activating these would demonstrate audio engineering sophistication.
  - Files: `frontend/src/services/loop/LoopEngine.ts`, `frontend/src/services/audio/MultiTrackManager.ts`
  - What 9/10 looks like: LoopEngine is the single source of truth for loop decisions; drift correction runs automatically during playback; quantized recording supports multi-bar lengths.
  - Estimated complexity: HIGH

---

## Stress Evaluation — The Oncall Engineer

### VERDICT
- **Decision:** SENIOR HIRE
- **Seniority Alignment:** Yes — demonstrates senior-level defensive coding, resource lifecycle management, and architecture awareness. A few rough edges prevent Instant Lead.
- **One-Line:** Solid production-aware audio app with disciplined error handling, but AudioContext proliferation and blob URL leaks from recordings would eventually cause memory pressure on long sessions.

### SCORECARD
| Pillar | Score | Evidence |
|--------|-------|----------|
| Pragmatism | 8/10 | `frontend/src/services/audio/AudioService.ts:50-495` — Clean orchestrator pattern with DI, not over-engineered. `frontend/src/services/ffmpeg/FFmpegCommandBuilder.ts:99-126` — atempo chaining solves a real FFmpeg constraint elegantly. Minor over-engineering: `useUIStore.ts` duplicates state already in MainScreen local state (isRecording, isLoading). |
| Defensiveness | 8/10 | `frontend/src/services/audio/BaseAudioPlayer.ts:372-386` — `finally` block always resets state on unload. `frontend/src/services/audio/BaseAudioRecorder.ts:159-171` — cancelRecording uses `finally` to guarantee state reset. `frontend/src/utils/globalErrorHandler.ts:37-76` — catches unhandled rejections on both web and native. Deduction: `WebAudioRecorder.ts:91-98` throws inside onerror callback which won't propagate correctly. |
| Performance | 7/10 | `frontend/src/store/usePlaybackStore.ts:68-85` — `updateTrackState` early-exit avoids unnecessary re-renders. `frontend/src/services/audio/WebAudioMixer.ts:219` — MP3 encoding uses `subarray` views (no copying). Deductions: AudioContext created per-player (`WebAudioPlayer.ts:36`) and per-mixer (`WebAudioMixer.ts:240`), not shared — Chrome limits to ~6 before suspension. Blob URLs from recordings (`WebAudioRecorder.ts:211`) are never revoked on track deletion. |
| Type Rigor | 7/10 | `frontend/src/types/audio.ts:219-251` — AudioErrorCode as union type + const object + `assertNever` exhaustive check is production-grade pattern. `frontend/src/services/audio/AudioError.ts:60-79` — exhaustive switch on error codes with compile-time enforcement. Deductions: `WebAudioExportService.ts:28` casts entire lamejs library to `any`. `MainScreen.tsx:171` inline casts `recordingFormat as import(...)AudioFormat` instead of proper type narrowing. 5 `as any` in prod code. |

### CRITICAL FAILURE POINTS

- **WebAudioRecorder.ts:91-98 — `throw` inside MediaRecorder `onerror` callback**: Throwing inside an event handler creates an uncaught exception rather than propagating to the caller. This error would be swallowed on some platforms or trigger the global error handler unpredictably, but not inform the recording flow. Not a crash risk due to the global handler, but the recording would hang in an inconsistent state.

- **Blob URL memory leak on track lifecycle**: `WebAudioRecorder.ts:211` creates blob URLs via `URL.createObjectURL` for every recording. When tracks are deleted via `MainScreen.tsx:476-510` (performDelete), `audioServiceRef.current.unloadTrack()` is called but never `URL.revokeObjectURL`. The `WebAudioFileManager` has proper revocation in `deleteFile()`, but the MainScreen recording flow bypasses the file manager entirely. Over a long session with many record/delete cycles, blob URLs accumulate.

- **AudioContext proliferation**: `WebAudioPlayer.ts:36` creates a new `AudioContext` per player instance. With `maxConcurrentPlayers` defaulting to 10 (`AudioService.ts:71`), and the mixer also creating its own (`WebAudioMixer.ts:240`), Chrome's limit of ~6 active AudioContexts could be hit. The player does `close()` on cleanup (`WebAudioPlayer.ts:353-356`), but if contexts accumulate faster than cleanup, audio silently fails.

### HIGHLIGHTS

- **Brilliance:**
  - `frontend/src/services/audio/BaseAudioPlayer.ts` and `BaseAudioRecorder.ts` — Template Method pattern with validation in base class and platform-specific implementation in subclasses. Every public method validates state before delegating. Error wrapping preserves original errors in context. `finally` blocks guarantee state cleanup.
  - `frontend/src/utils/retry.ts:32-38` — Retry eligibility respects `AudioError.isRecoverable()`, meaning permission errors are never retried (correct). Exponential backoff is clean.
  - `frontend/src/store/usePlaybackStore.ts:68-85` — `updateTrackState` helper returns the same Map reference when nothing changed, preventing Zustand from triggering re-renders. This is a pattern many teams miss.
  - `frontend/src/store/migrations/migrationSystem.ts` — Migration system with fallback to default state, version history, and validation. This is forward-looking production infrastructure.
  - `frontend/src/services/audio/WebAudioRecorder.ts:309-314` — Permission check properly stops the stream immediately after checking, with a delay to release the device. Thoughtful.

- **Concerns:**
  - `frontend/src/screens/MainScreen/MainScreen.tsx` — At 816 lines, this component is a monolith. All audio orchestration logic lives here. A single re-render-triggering bug could cascade. The `handleRecord` function alone has three code paths with two timers. State synchronization between local state (`isRecording`) and the store (`useUIStore.isRecording`) is fragile.
  - Persistence is disabled: `useTrackStore.ts:12-14` and `usePlaybackStore.ts:12-14` both have TODOs noting persist middleware was removed. Users lose all tracks on page refresh. This is a known gap per the comments.
  - `WebAudioMixer.ts:334-337` — Cancel is a no-op on web. `OfflineAudioContext.startRendering()` cannot be cancelled. For large mixes, the user sees a "cancelling" state but the operation continues consuming CPU until completion.
  - `LifecycleManager.ts:12-30` — Singleton pattern with static mutable state. Not inherently bad, but the `reset()` static method (`line 116`) could cause issues if called while the instance is mid-lifecycle-handling.

### REMEDIATION TARGETS

- **Pragmatism (current: 8/10 → target: 9/10)**
  - Extract audio orchestration logic from `MainScreen.tsx` into a custom hook (e.g., `useAudioOrchestrator`). The screen component should only handle rendering.
  - Reconcile duplicated state between `MainScreen` local state and `useUIStore` — pick one source of truth.
  - Estimated complexity: MEDIUM

- **Defensiveness (current: 8/10 → target: 9/10)**
  - Fix `WebAudioRecorder.ts:91-98`: Replace `throw` in `onerror` with a stored error that the `_stopRecording` promise rejects with, or use an event emitter pattern.
  - Add blob URL revocation in the track deletion flow (`MainScreen.tsx:performDelete`) for recording-originated URIs.
  - Add a timeout on `_stopRecording`'s promise (`WebAudioRecorder.ts:188-240`) — if `onstop` never fires, the promise hangs forever.
  - Estimated complexity: LOW

- **Performance (current: 7/10 → target: 9/10)**
  - Share a single `AudioContext` across all `WebAudioPlayer` instances via the service factory or a context pool. Close contexts only on full cleanup.
  - Track and revoke blob URLs created during recording when tracks are deleted.
  - Consider using `OfflineAudioContext` rendering progress via `suspend()`/`resume()` to enable true mixing cancellation on web.
  - Estimated complexity: MEDIUM

- **Type Rigor (current: 7/10 → target: 9/10)**
  - Eliminate `as any` casts in production code. For `lamejs`, create a proper type declaration file (`@types/lamejs.d.ts`). For `recordingFormat`, use a type guard or zod validation at the settings boundary.
  - The `Track` type should use branded types for `id` (e.g., `type TrackId = string & { __brand: 'TrackId' }`) to prevent accidental string passing.
  - `AudioFormat` is both an enum and used as a string literal in `exportTypes.ts` — consolidate to one pattern.
  - Estimated complexity: LOW

---

## Day 2 Evaluation — The Team Lead

### VERDICT
- **Decision:** COLLABORATOR
- **Collaboration Score:** Med-High
- **One-Line:** "Writes behavioral tests and documents architecture, but leaves behind placeholder tests and skipped validations that erode trust in the suite."

### SCORECARD
| Pillar | Score | Evidence |
|--------|-------|----------|
| Test Value | 6/10 | `loopUtils.test.ts` excellent behavioral coverage with edge cases; but `MockAudioServices.test.ts:125,142,159,199` uses `expect(true).toBe(true)` placeholders, 4 `it.skip` tests, 4 `it.todo` stubs in `crossfadePlaceholder.test.tsx` |
| Reproducibility | 7/10 | `.github/workflows/ci.yml` runs lint+typecheck+test in parallel with status gate; `package-lock.json` committed; no Docker/devcontainer, no pre-commit hooks, no `.env.example` |
| Git Hygiene | 7/10 | Mostly conventional commits (`fix:`, `feat:`, `refactor:`); one mega-commit `5b17330` at 21 files/813 insertions; a few non-conventional messages like `README`, `READ*`, `updated image`, `restructure` |
| Onboarding | 7/10 | `README.md` has quick-start in 3 lines; `CLAUDE.md` is an excellent architecture guide; `docs/README.md` covers usage; no `CONTRIBUTING.md`, no `.env.example`, no "why" documentation for architectural decisions |

### RED FLAGS
- **Placeholder tests masquerading as coverage:** `frontend/__tests__/unit/services/MockAudioServices.test.ts` lines 125, 142, 159, 199 all contain `expect(true).toBe(true)` — these tests pass but assert nothing about behavior. Same pattern in `AudioService.test.ts:124,287` and `SpeedSlider.test.tsx:200`. This inflates the "525+ tests" count and gives false confidence.
- **Skipped validation tests:** `MockAudioServices.test.ts` has 3 skipped tests for input validation (empty URI, invalid speed, invalid volume) with a comment "Skipping problematic async validation tests." These are important edge cases left untested.
- **Mega-commit:** `5b17330` ("refactor: improve code quality across performance, defensiveness, and type rigor") touches 21 files with 813 insertions. This is unreviable as a single unit and makes `git bisect` less useful.
- **No e2e in CI:** The `frontend/e2e/` directory has Playwright tests but they are not wired into the CI pipeline (`ci.yml` only runs jest). They exist as documentation of intent, not as a safety net.
- **No pre-commit hooks or formatting gate in CI:** `prettier` is configured but `format:check` is not in the CI pipeline. Code style enforcement relies entirely on developer discipline.

### HIGHLIGHTS
- **Process Win:** `frontend/src/utils/__tests__/loopUtils.test.ts` is exemplary — it tests behaviors with edge cases (zero duration, negative values, boundary values), includes inline comments explaining math (`// 10s / 0.5 = 20s`), and covers the full API surface. This is the gold standard for tests-as-documentation. Same quality in `frontend/src/services/loop/__tests__/LoopEngine.test.ts` which tests the core domain logic with clear arrange-act-assert patterns.
- **Process Win:** `CLAUDE.md` at `/home/user/react-looper/CLAUDE.md` is one of the most thorough project-level architecture guides I have seen. It explains the master loop concept, store responsibilities, platform-split pattern, path aliases, and the test setup. A junior could read this and understand the system in 30 minutes.
- **Process Win:** CI (`ci.yml`) parallelizes lint, typecheck, and test jobs with a proper status-check gate that blocks merge if any fail.
- **Maintenance Drag:** The `createMockTrack` helper is duplicated across at least 3 test files (`loopUtils.test.ts`, `useTrackStore.test.ts`, `LoopEngine.test.ts`) instead of being shared from `__fixtures__/mockAudioData.ts` which already exists at `frontend/__tests__/__fixtures__/mockAudioData.ts`.

### REMEDIATION TARGETS

- **Test Value (current: 6/10 → target: 9/10)**
  - Replace all `expect(true).toBe(true)` with meaningful assertions. In `MockAudioServices.test.ts:125` ("sets playback speed"), assert `player.getSpeed() === 1.5` or equivalent. In `AudioService.test.ts:124` ("sets track looping"), verify the looping state changed.
  - Unskip the 3 validation tests in `MockAudioServices.test.ts:229-257` — either fix the async issue or rewrite them to test validation at a different layer.
  - Resolve or delete the 4 `it.todo` stubs in `crossfadePlaceholder.test.tsx` — if crossfade is not implemented, remove the stubs to avoid misleading test output.
  - Consolidate `createMockTrack` into `frontend/__tests__/__fixtures__/mockAudioData.ts` and import from there.
  - Add `format:check` to CI so Prettier enforcement is not optional.
  - Files involved: `frontend/__tests__/unit/services/MockAudioServices.test.ts`, `frontend/__tests__/unit/services/AudioService.test.ts`, `frontend/__tests__/unit/components/SpeedSlider.test.tsx`, `frontend/src/screens/SettingsScreen/__tests__/crossfadePlaceholder.test.tsx`
  - Estimated complexity: LOW

- **Reproducibility (current: 7/10 → target: 9/10)**
  - Add `npm run format:check` to the CI lint job or as a separate job in `.github/workflows/ci.yml`.
  - Add a `.devcontainer/devcontainer.json` or document system dependencies beyond Node.js (e.g., FFmpeg for native builds) in the README.
  - Add `.env.example` if any environment variables are needed (currently none apparent, but this should be explicitly documented).
  - Consider adding a pre-commit hook via husky or lint-staged to catch formatting and lint issues before they reach CI.
  - Wire e2e tests into CI (even if only on a separate trigger) so the Playwright specs in `frontend/e2e/` are actually executed.
  - Files involved: `.github/workflows/ci.yml`, `package.json`
  - Estimated complexity: LOW

- **Git Hygiene (current: 7/10 → target: 9/10)** — ACCEPTED (user override, no remediation required)

- **Onboarding (current: 7/10 → target: 9/10)**
  - Add a `CONTRIBUTING.md` documenting: branch strategy, PR process, commit conventions, and how to add a new platform service.
  - Add architectural decision records (ADRs) or a section in docs explaining "why Zustand over Redux," "why factory pattern for audio services," and "why first track = master loop."
  - The `docs/README.md` covers user-facing features but not developer-facing decisions. Add a "Design Decisions" section or separate document.
  - Files involved: Create `CONTRIBUTING.md`, extend `docs/README.md`
  - Estimated complexity: LOW

---

## Consolidated Remediation Targets

Merged and deduplicated from all 3 evaluators, prioritized by lowest score first:

### Priority 1: Test Value (6/10 → 9/10) — LOW complexity
- Replace `expect(true).toBe(true)` placeholders with meaningful assertions
- Unskip/fix validation tests in `MockAudioServices.test.ts`
- Delete or implement `it.todo` stubs in `crossfadePlaceholder.test.tsx`
- Consolidate `createMockTrack` helper into shared fixtures
- Add `format:check` to CI pipeline

### Priority 2: Code Quality (7/10 → 9/10) — LOW complexity
- Replace 145+ raw `console.*` calls with `logger` utility
- Use `uuid` for track IDs instead of `Date.now()`
- Remove inline styles from MainScreen

### Priority 3: Performance (7/10 → 9/10) — MEDIUM complexity
- Share single AudioContext across all WebAudioPlayer instances
- Track and revoke blob URLs on track deletion
- Consider cancellable mixing via OfflineAudioContext suspend/resume

### Priority 4: Type Rigor (7/10 → 9/10) — LOW complexity
- Create proper type declarations for lamejs (eliminate `as any`)
- Use type guards instead of inline casts for `recordingFormat`
- Consider branded types for TrackId

### Priority 5: Reproducibility (7/10 → 9/10) — LOW complexity
- Add format:check to CI
- Add .env.example
- Wire e2e tests into CI
- Add devcontainer or document system deps

### Priority 6: Onboarding (7/10 → 9/10) — LOW complexity
- Add CONTRIBUTING.md
- Add ADRs for key architectural decisions
- Add "Design Decisions" section to docs

### Priority 7: Problem-Solution Fit (8/10 → 9/10) — MEDIUM complexity
- Re-enable Zustand store persistence with platform-specific storage adapters

### Priority 8: Architecture (8/10 → 9/10) — MEDIUM complexity
- Extract MainScreen into custom hooks (useRecordingSession, useTrackPlayback, useExportFlow)
- Reconcile duplicated state between MainScreen and useUIStore

### Priority 9: Pragmatism (8/10 → 9/10) — MEDIUM complexity
- Same as Architecture — extract orchestration from MainScreen
- Remove dead useUIStore or integrate it as single source of truth

### Priority 10: Defensiveness (8/10 → 9/10) — LOW complexity
- Fix throw in WebAudioRecorder onerror callback
- Add blob URL revocation in track deletion flow
- Add timeout on _stopRecording promise

### Priority 11: Creativity (7/10 → 9/10) — HIGH complexity
- Wire LoopEngine into UI layer as single source of truth for loop decisions
- Activate MultiTrackManager drift detection and resync
- Enable quantized multi-bar recording
