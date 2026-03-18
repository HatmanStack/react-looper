# Feedback: 2026-03-18-audit-react-looper

## Verification

**VERIFIED** — All 11 audit findings confirmed addressed. Tests: 539 passing, 0 failures. Lint: clean.

## Active Feedback

<!-- Items currently requiring attention -->

(No open items.)

## Previously Active (moved to Resolved)

### Review 4 ISSUE 1 (ADVISORY): .gitignore missing entries from plan -- CODE_REVIEW

The Phase 4 plan (Task 3) specified adding `.vscode/`, `*.swp`, `*.swo`, and `build/` to `.gitignore`. The actual `.gitignore` is missing:
- `.vscode/` (IDE files section only has `.idea/`)
- `*.swp` and `*.swo` (vim swap files)
- `build/` (build artifacts section entirely absent)

These are low-risk omissions but deviate from the plan specification.

### Review 4 ISSUE 2 (ADVISORY): Non-atomic final commit -- CODE_REVIEW

The plan defined 5 separate tasks with individual commit message templates. The implementation produced only 3 commits, with the final commit `4094621` combining Task 1 (ESLint no-console), Task 3 (.gitignore), Task 5 (silent catch blocks), and additional unrelated changes (LoopEngine store decoupling, test file updates) into a single 24-file commit. This reduces bisectability and makes it harder to revert individual changes. The first two commits (`97b8f40` for lamejs types, `331bbd2` for ErrorBoundary theme) are properly atomic.

### Review 4 ISSUE 3 (INFO): Pre-existing lint errors from Phase 3 -- CODE_REVIEW

`npm run lint` reports 3 errors, all in files from Phase 3 (not introduced by Phase 4):
1. `useTrackPlayback.test.ts:67` -- unused variable `result` (`@typescript-eslint/no-unused-vars`)
2. `useRecordingSession.ts:113` -- ref update during render (`react-hooks/refs`)
3. `audioUtils.shared.test.ts:37` -- `RequestInit` not defined (`no-undef`)

These are not Phase 4 regressions but they do cause `npm run lint` to fail, which means the Phase 4 completion checklist item "npm run lint produces zero no-console errors in production code" is technically satisfied (no no-console errors), but `npm run check` would fail due to these other lint errors.

## Resolved Feedback

<!-- Items that have been addressed -->

### Review 3 ISSUE 1 (BLOCKING): scaleVolume extracted twice in Phase 1 and Phase 2 -- Resolved 2026-03-18
The redundant scaleVolume extraction task (formerly Phase 2 Task 6) and uuid-based Task 7 had already been removed in a prior revision, but the old Task 9 (fetchWithTimeout) still referenced the removed `audioUtils.ts` file and imported `scaleVolume` from it. Fixed by: renumbering old Task 9 to Task 7, updating it to add `fetchWithTimeout` to `frontend/src/utils/audioUtils.shared.ts` (created by Phase 1 Task 8) instead of a separate `audioUtils.ts`, and updating all import paths in WebAudioPlayer/WebAudioMixer to use `../../utils/audioUtils.shared`. Phase goal updated to note that duplicated logic was handled in Phase 1. Phase Verification step 8 updated to reference `audioUtils.shared.ts`.

### Review 3 ISSUE 2 (BLOCKING): Track ID strategy contradicts between Phase 1 and Phase 2 -- Resolved 2026-03-18
The uuid-based Task 7 had already been removed in a prior revision. Phase 2 no longer contains any task that imports or uses the `uuid` package. Phase Verification step 6 updated to note this is a regression check for work done in Phase 1 Tasks 6+7. The phase goal was updated to clarify that weak ID generation was addressed in Phase 1.

### Review 2 ISSUE 1 (BLOCKING): Duplicate console.* replacement work -- Resolved 2026-03-18
Phase 1 Task 9 is the comprehensive console replacement task. `audioUtils.web.ts` is included in its file list (1 occurrence). Phase 4 Task 4 has been converted to a verification-only task that runs `npm run lint` to confirm zero `no-console` violations remain after Phase 1 Task 9. No duplicate file modification work exists between the two tasks.

### Review 2 ISSUE 2 (ADVISORY): scaleVolume placement -- Resolved 2026-03-18
Phase 1 Task 8 targets `frontend/src/utils/audioUtils.shared.ts` (the platform-agnostic shared utility file) instead of `audioUtils.ts`. The file list, implementation steps, verification checklist, and commit message all reference `audioUtils.shared.ts`.

### Review 2 ISSUE 3 (ADVISORY): console.debug mapping -- Resolved 2026-03-18
Phase 1 Task 9 step 1f explicitly documents that `console.debug(...)` maps to `logger.log(...)` since the logger utility does not expose a `debug()` method. `audioUtils.web.ts` is included in the file list with its 1 occurrence. The verification checklist includes `console.debug` in the list of calls that should not remain.

### Prior Review Issue 2 (useUIStore contradiction) -- 2026-03-18
Flagged as BLOCKING in Review 1. Re-review confirms Phase 5 Task 1 does NOT contain the contradiction. The plan correctly references Phase 1's deletion of useUIStore without attempting to update documentation for it. Resolved.
