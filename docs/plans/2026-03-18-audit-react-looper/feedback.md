# Feedback: 2026-03-18-audit-react-looper

## Active Feedback

<!-- Items currently requiring attention -->

(No open items.)

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
