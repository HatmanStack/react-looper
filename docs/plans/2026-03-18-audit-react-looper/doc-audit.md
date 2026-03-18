---
type: doc-health
date: 2026-03-18
prevention_scope: markdownlint + lychee
language_stack: both
---

# Documentation Audit: react-looper

## Configuration
- **Prevention Scope:** Markdown linting (markdownlint) + link checking (lychee)
- **Language Stack:** Both JS/TS and Python
- **Constraints:** None

## Summary
- Docs scanned: 4 files (README.md, CLAUDE.md, CHANGELOG.md, docs/README.md)
- Code modules scanned: ~40 service/store/util files across `frontend/src/`
- Findings: 5 drift, 5 gaps, 0 stale, 0 broken links, 2 stale code examples, 3 config drift, 3 structure issues

## Findings

### DRIFT (doc exists, doesn't match code)

1. **`CLAUDE.md:59`** — Audio Service Platform-Split Pattern
   - Doc says: "Platform-specific files use extensions: `.web.ts` and `.native.ts`"
   - Context implies this applies to `frontend/src/services/audio/`, but no `.web.ts` or `.native.ts` files exist in that directory. The audio service uses a factory/registration pattern with subdirectories (`web/`, `native/`, `mock/`) containing `index.ts` files that register platform-specific class implementations (e.g., `WebAudioPlayer`, `NativeAudioRecorder`). The `.web.ts`/`.native.ts` extension pattern is used in `services/ffmpeg/`, `services/storage/`, and `utils/`, but not in `services/audio/`.

2. **`CLAUDE.md:59`** — Audio Service Hierarchy
   - Doc says: "`AudioService` -> `IAudioPlayer`/`IAudioRecorder`/`IAudioMixer` -> platform implementations"
   - Code reality: The interfaces live in `frontend/src/services/audio/interfaces/` (a subdirectory not mentioned). There is also `IFileManager` in that directory, which is missing from the documented hierarchy. The actual pattern is: `AudioServiceFactory` registers platform implementations via `registerAudioServices()`, not a direct `AudioService ->` chain.

3. **`CLAUDE.md:77-86`** — Path Aliases
   - Doc lists 7 aliases: `@components`, `@services`, `@store`, `@utils`, `@types`, `@constants`, `@theme`
   - Code has 8 aliases: the `@screens/*` alias exists in both `frontend/tsconfig.json:11` and root `package.json:48` (`moduleNameMapper`) but is missing from CLAUDE.md's documented list.

4. **`docs/README.md:101`** — Troubleshooting: Crossfade Setting Name
   - Doc says: "Increase Loop Crossfade Duration in settings (10-20ms)"
   - The actual UI label in `SettingsScreen.tsx:96` is "Loop Crossfade" (not "Loop Crossfade Duration"). The slider maximum is 50ms, and the description says "Smooth transition at loop boundaries (0ms = gapless)". The "10-20ms" recommendation is plausible but is not surfaced anywhere in the app itself.

5. **`CHANGELOG.md:7` / `package.json:3` / `frontend/package.json:3` / `frontend/app.config.ts:12`** — Version Mismatch
   - CHANGELOG documents release `[1.1.0] - 2026-02-05` as the latest version
   - All three version sources still say `"version": "1.0.0"`: root `package.json`, `frontend/package.json`, and `frontend/app.config.ts`
   - The version was never bumped to match the CHANGELOG entry.

### GAPS (code exists, no doc)

1. **`frontend/src/services/lifecycle/LifecycleManager.ts`** — `LifecycleManager` class exported, not documented in any README or CLAUDE.md. Manages app lifecycle but has zero documentation mentions.

2. **`frontend/src/services/storage/AudioFileManager.ts`** (+ `.web.ts`, `.native.ts`) — Storage service with platform-split `AudioFileManager` is not mentioned in any documentation. CLAUDE.md describes `services/audio/` and `services/ffmpeg/` but omits `services/storage/`.

3. **`frontend/src/services/audio/MultiTrackManager.ts`** — Exported `MultiTrackManager` class in the audio service layer, not documented anywhere.

4. **`frontend/src/services/audio/FileImporterFactory.ts`** — Exported `getFileImporter()` function, plus `NativeFileImporter.ts` and `WebFileImporter.ts`, none documented.

5. **`frontend/src/services/audio/PlatformAudioConfig.ts`** — Exports 6 public functions (`getAudioConfig`, `getPlatformName`, `isPlatformSupported`, `getRecommendedFormat`, `isFormatSupported`, `getPerformanceMultiplier`), none documented.

### STALE (doc exists, code doesn't)

No stale documentation found. The CHANGELOG v1.1.0 explicitly notes removal of stale docs (TEST_FAILURES_ANALYSIS.md, NATIVE_MIXER_LOOP_IMPLEMENTATION.md, USER_GUIDE.md), and these are confirmed absent from the repo.

### BROKEN LINKS

No broken links found. All internal references resolve correctly.

### STALE CODE EXAMPLES

1. **`docs/README.md:70-71`** — Test commands use `npm run test:watch` and `npm run test:coverage`
   - These scripts do exist in root `package.json` (lines 13-14), so they work.
   - However, CLAUDE.md documents the alternative forms `npm test -- --watch` and `npm test -- --coverage` (lines 22-23).
   - The inconsistency between docs is a maintenance risk though both forms function.

2. **`docs/README.md:91`** — Mobile build command `npm run --prefix frontend eas:build:prod`
   - The script `eas:build:prod` exists only in `frontend/package.json:16`, so the `--prefix frontend` approach works.
   - However, this is the only script in docs that uses `--prefix` instead of the workspace approach (all other commands run from root). This is inconsistent and not documented in CLAUDE.md which doesn't mention EAS build commands at all.

### CONFIG DRIFT

1. **Code reads `APP_ENV`** (`frontend/app.config.ts:5`) — not documented in any README, docs, or `.env.example` (no `.env.example` exists at all).

2. **Code reads `ENABLE_DEV_TOOLS`** (`frontend/app.config.ts:6`), **`ENABLE_ANALYTICS`** (`frontend/app.config.ts:7`), **`EAS_PROJECT_ID`** (`frontend/app.config.ts:112`), **`EXPO_ACCOUNT_OWNER`** (`frontend/app.config.ts:115`), **`ENABLE_STATE_LOGGING`** (`frontend/src/store/devtools.ts:207`), **`PUBLIC_URL`** (`frontend/src/utils/serviceWorkerRegistration.ts:9`) — none of these 6 env vars are documented anywhere. No `.env.example` file exists in the repository.

3. **Missing `.env.example`** — The project reads 7+ environment variables across `app.config.ts`, `devtools.ts`, and `serviceWorkerRegistration.ts`, but provides no `.env.example` or environment variable documentation for contributors.

### STRUCTURE ISSUES

1. **`docs/README.md` architecture tree (lines 37-50)** omits `services/lifecycle/` and `services/storage/` directories that exist in the codebase. The documented tree shows only `audio/`, `ffmpeg/`, and `loop/` under `services/`.

2. **`CLAUDE.md` Audio Service Layer section** describes only two platform categories (Web and Native) but the code also has a `mock/` subdirectory (`frontend/src/services/audio/mock/`) with `MockAudioPlayer`, `MockAudioRecorder`, `MockAudioMixer`, and `MockFileManager` that are actively used by native registration (native services currently use mock player, mixer, and file manager per `native/index.ts`). This means the native platform is partially non-functional (mock implementations), which is not disclosed in documentation.

3. **Native player/mixer status undisclosed** — `frontend/src/services/audio/native/index.ts` comments: "Player and Mixer use mocks for now (will be implemented in Phase 5 & 6)". No documentation mentions that native audio playback and mixing are not yet implemented, despite README and all docs presenting iOS/Android as fully supported platforms.
