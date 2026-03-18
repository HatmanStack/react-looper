# Phase 4 [FORTIFIER]: CI Hardening, Type Safety, Gitignore

## Phase Goal

Add guardrails that prevent regression of fixes made in earlier phases. Harden ESLint rules, replace `as any` casts with proper type declarations, expand `.gitignore` coverage, make ErrorBoundary theme-aware, and ensure silent catch blocks have diagnostic logging. This phase is primarily additive — introducing lint rules, type declarations, and theme consistency.

**Success criteria:**
- ESLint `no-console` rule is `error` level (not just `warn`), blocking CI on new `console.log` additions
- The `lamejs as any` cast is replaced with a proper type declaration file
- `.gitignore` covers `.env`, OS artifacts, IDE files, and build artifacts
- ErrorBoundary uses theme colors instead of hardcoded hex values
- All silent catch blocks have at minimum a `logger.warn()` call
- All existing tests pass (`npm run check`)

**Estimated tokens:** ~15k

## Prerequisites

- Phases 1-3 complete (dead code removed, critical fixes applied, console.* replaced with logger, test quality improved, MainScreen extracted)
- `npm run check` passes

## Audit Findings Addressed

| Finding | Source | ID |
|---------|--------|----|
| ESLint no-console only warns (should error) | eval.md | Code Quality |
| lamejs `as any` cast | health-audit.md | #19 |
| .gitignore missing .env, OS files, IDE files | health-audit.md | #20 |
| ErrorBoundary hardcoded colors | health-audit.md | #24 |
| Silent catch blocks with no logging | health-audit.md | #22 |

---

## Task 1: Escalate ESLint `no-console` Rule to Error

### Goal

The `no-console` rule in `eslint.config.mjs` is currently set to `'warn'` (line 60). After Phase 1 consolidated all `console.*` calls to use the `logger` utility, escalate to `error` level to prevent regression. Allow `console.warn` and `console.error` since the logger implementation itself uses them. Implements ADR-5 from Phase 0.

### Files to Modify

- `frontend/eslint.config.mjs` — line 60
- `frontend/src/utils/logger.ts` — add `eslint-disable-next-line no-console` for internal `console.log` and `console.info`
- `frontend/src/utils/logger.web.ts` — add `eslint-disable-next-line` if it has internal `console.log`/`console.info`
- `frontend/src/utils/logger.native.ts` — add `eslint-disable-next-line` if it has internal `console.log`/`console.info`

### Prerequisites

Phase 1 Task 9 completed (all source files now use logger instead of console.*).

### Implementation Steps

1. Read `frontend/eslint.config.mjs`. Note:
   - Line 60: `'no-console': 'warn'` in the main TypeScript files block
   - Line 80: `'no-console': 'off'` in test files override (already exempt)
   - Lines 100, 113: `'no-console': 'off'` in e2e overrides (already exempt)

2. Change line 60 from:
   ```js
   'no-console': 'warn',
   ```
   to:
   ```js
   'no-console': ['error', { allow: ['warn', 'error'] }],
   ```
   This makes `console.log`, `console.info`, `console.debug`, `console.trace`, and `console.dir` CI-blocking errors. `console.warn` and `console.error` remain allowed.

3. Read `frontend/src/utils/logger.ts`. The `log()` method uses `console.log(...)` (line 29) and `info()` uses `console.info(...)` (line 43). Add `// eslint-disable-next-line no-console` above each of these two lines. The `console.warn` and `console.error` calls are allowed by the rule and need no comments.

4. Read `frontend/src/utils/logger.web.ts` and `frontend/src/utils/logger.native.ts`. If they contain `console.log` or `console.info` calls, add the same eslint-disable comments.

5. Run `npm run lint` to verify zero violations in production code.
6. Run `npm run check`.

### Verification Checklist

- [ ] `no-console` rule is `['error', { allow: ['warn', 'error'] }]` in main config block
- [ ] Test file overrides still have `'no-console': 'off'` (unchanged)
- [ ] Logger utility files have `eslint-disable-next-line no-console` on `console.log` and `console.info` calls
- [ ] `npm run lint` produces zero no-console errors
- [ ] `npm run check` passes

### Testing Instructions

```bash
npm run lint
npm run check
```

### Commit Message Template

```
ci(lint): escalate no-console ESLint rule to error level

- Change no-console from warn to error for production code
- Allow console.warn and console.error (used by logger internals)
- Add eslint-disable comments to logger utility files
- Test/e2e overrides remain at 'off' (unchanged)
- Implements ADR-5 from Phase 0
```

---

## Task 2: Fix lamejs `as any` Cast with Proper Type Declaration

### Goal

Replace `const LameJS = lamejs as any` in `WebAudioExportService.ts` with a proper type declaration file for `@breezystack/lamejs`. This eliminates an `as any` that disables all type checking for MP3 encoding operations.

### Files to Create

- `frontend/src/types/lamejs.d.ts` — type declaration for `@breezystack/lamejs`

### Files to Modify

- `frontend/src/services/ffmpeg/WebAudioExportService.ts` — remove `as any` cast and inline `WavHeaderResult` interface

### Prerequisites

None.

### Implementation Steps

1. Read `frontend/src/services/ffmpeg/WebAudioExportService.ts`. The lamejs APIs used are:
   - `import lamejs from "@breezystack/lamejs"` (line 18) — default import
   - `LameJS.WavHeader.readHeader(new DataView(arrayBuffer))` — returns `{ channels, sampleRate, dataLen, dataOffset }`
   - `new LameJS.Mp3Encoder(channels, sampleRate, bitrate)` — constructor
   - `mp3encoder.encodeBuffer(leftChunk, rightChunk)` — accepts `Int16Array`, returns `Int8Array`
   - `mp3encoder.flush()` — returns `Int8Array`
   - Lines 20-26: inline `WavHeaderResult` interface that duplicates what the declaration should provide

2. Create `frontend/src/types/lamejs.d.ts`:

```typescript
declare module "@breezystack/lamejs" {
  export interface WavHeaderResult {
    channels: number;
    sampleRate: number;
    dataLen: number;
    dataOffset: number;
  }

  export class Mp3Encoder {
    constructor(channels: number, sampleRate: number, kbps: number);
    encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
    flush(): Int8Array;
  }

  export const WavHeader: {
    readHeader(dataView: DataView): WavHeaderResult;
  };

  const lamejs: {
    Mp3Encoder: typeof Mp3Encoder;
    WavHeader: typeof WavHeader;
  };

  export default lamejs;
}
```

3. Verify that `frontend/tsconfig.json` will pick up the declaration. The `baseUrl` is `.` and `src/types/` is not in the `exclude` list.

4. In `WebAudioExportService.ts`:
   a. Remove the inline `WavHeaderResult` interface (lines 20-26).
   b. Remove the `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comment (line 27).
   c. Remove `const LameJS = lamejs as any;` (line 28).
   d. Combine imports: `import lamejs, { type WavHeaderResult } from "@breezystack/lamejs";`
   e. Replace all `LameJS.` references with `lamejs.` throughout the file.
   f. Check if the `mp3Data as any[]` cast can be removed (try `npm run typecheck`).

5. Run `npm run typecheck`.
6. Run `npm run check`.

### Verification Checklist

- [ ] `frontend/src/types/lamejs.d.ts` exists with types for `Mp3Encoder`, `WavHeader`, `WavHeaderResult`
- [ ] `WebAudioExportService.ts` has no `as any` cast for lamejs
- [ ] `WebAudioExportService.ts` has no inline `WavHeaderResult` interface
- [ ] `WebAudioExportService.ts` uses `lamejs.WavHeader` and `lamejs.Mp3Encoder` directly
- [ ] `npm run typecheck` passes
- [ ] `npm run check` passes

### Testing Instructions

```bash
npm run typecheck
npm run check
```

### Commit Message Template

```
fix(types): add type declaration for @breezystack/lamejs

- Create lamejs.d.ts with Mp3Encoder, WavHeader, WavHeaderResult types
- Remove 'as any' cast in WebAudioExportService.ts
- Move inline WavHeaderResult interface to declaration file
- MP3 encoding operations now have compile-time type checking
```

---

## Task 3: Expand .gitignore

### Goal

The root `.gitignore` only covers `.expo/`, `node_modules/`, `dist/`, and `coverage/`. It does not exclude `.env` files, OS artifacts, or IDE configuration. This creates risk of accidentally committing secrets or polluting the repo with OS-specific files.

### Files to Modify

- `.gitignore` (repository root)

### Prerequisites

None.

### Implementation Steps

1. Read the current root `.gitignore`:
   ```
   .expo/
   node_modules/
   dist/
   coverage/
   ```

2. Check if `.vscode/` or `.idea/` directories are tracked by git: run `git ls-files .vscode .idea`. If tracked, adding them to `.gitignore` will not remove them (they will remain tracked). Note this in the commit message if so.

3. Append the following patterns to the root `.gitignore` (preserving existing entries):

```gitignore

# Environment files
.env
.env.local
.env.*.local

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# TypeScript build info
*.tsbuildinfo

# Build artifacts
build/
```

4. Run `npm run check`.
5. Run `git status` to verify no tracked files are affected.

### Verification Checklist

- [ ] `.gitignore` includes `.env`, `.env.local`, `.env.*.local`
- [ ] `.gitignore` includes `.DS_Store` and `Thumbs.db`
- [ ] `.gitignore` includes `.vscode/` and `.idea/`
- [ ] `.gitignore` includes `*.tsbuildinfo`
- [ ] Existing entries (`.expo/`, `node_modules/`, `dist/`, `coverage/`) are preserved
- [ ] `npm run check` passes

### Testing Instructions

```bash
npm run check
git status
```

### Commit Message Template

```
chore(config): expand .gitignore with env, OS, and IDE patterns

- Add .env, .env.local, .env.*.local (prevent secret commits)
- Add .DS_Store, Thumbs.db (OS artifacts)
- Add .vscode/, .idea/ (IDE configuration)
- Add *.tsbuildinfo (TypeScript build cache)
- Add build/ (build artifacts)
```

---

## Task 4: Replace ErrorBoundary Hardcoded Colors with Theme Values

### Goal

The ErrorBoundary fallback UI uses hardcoded color values (`#1A1A1A`, `#FFFFFF`, `#999999`, `#EF5555`) instead of the app's theme from `paperTheme.ts`. Replace with theme references for visual consistency.

### Files to Modify

- `frontend/src/components/ErrorBoundary/ErrorBoundary.tsx` — StyleSheet colors

### Prerequisites

None.

### Implementation Steps

1. Read `frontend/src/theme/paperTheme.ts` to identify matching theme colors:
   | Hardcoded | Theme property | Notes |
   |-----------|---------------|-------|
   | `#1A1A1A` (background) | `looperTheme.colors.background` | Matches app background |
   | `#FFFFFF` (title) | `looperTheme.colors.onBackground` | White text on dark background |
   | `#999999` (message) | `looperTheme.colors.onSurfaceVariant` | Secondary text |
   | `#EF5555` (button bg) | `looperTheme.colors.errorContainer` | Error action color |
   | `#FFFFFF` (button text) | `looperTheme.colors.onErrorContainer` | Text on error button |
   | `8` (border radius) | `looperTheme.roundness` | Consistent rounding |

2. Since `ErrorBoundary` is a class component, it cannot use the `useTheme()` hook. Import the theme object directly:
   ```typescript
   import { looperTheme } from "../../theme/paperTheme";
   ```

3. Replace the `StyleSheet.create()` block (lines 80-114):
   ```typescript
   const styles = StyleSheet.create({
     container: {
       flex: 1,
       justifyContent: "center",
       alignItems: "center",
       backgroundColor: looperTheme.colors.background,
       padding: 24,
     },
     title: {
       fontSize: 20,
       fontWeight: "bold",
       color: looperTheme.colors.onBackground,
       marginBottom: 12,
     },
     message: {
       fontSize: 14,
       color: looperTheme.colors.onSurfaceVariant,
       textAlign: "center",
       marginBottom: 24,
     },
     retryButton: {
       backgroundColor: looperTheme.colors.errorContainer,
       paddingHorizontal: 24,
       paddingVertical: 12,
       borderRadius: looperTheme.roundness,
     },
     retryButtonPressed: {
       opacity: 0.7,
     },
     retryButtonText: {
       color: looperTheme.colors.onErrorContainer,
       fontSize: 16,
       fontWeight: "600",
     },
   });
   ```

4. Run `npm run check`.

### Verification Checklist

- [ ] `ErrorBoundary.tsx` imports `looperTheme` from `../../theme/paperTheme`
- [ ] No hardcoded hex color values remain in the `styles` object
- [ ] All colors reference `looperTheme.colors.*`
- [ ] `borderRadius` uses `looperTheme.roundness`
- [ ] `npm run check` passes

### Testing Instructions

```bash
npm test -- ErrorBoundary
npm run check
```

### Commit Message Template

```
fix(ui): replace hardcoded colors in ErrorBoundary with theme values

- Import looperTheme from paperTheme.ts
- Replace #1A1A1A, #FFFFFF, #999999, #EF5555 with theme color references
- Use looperTheme.roundness for button border radius
- Ensures visual consistency with app-wide dark theme
```

---

## Task 5: Add Logging to Silent Catch Blocks

### Goal

Several catch blocks silently swallow errors with no logging, making debugging impossible. Add at minimum a `logger.warn()` call to each silent catch block so errors are visible during development.

### Files to Modify

- `frontend/src/services/audio/WebAudioPlayer.ts` — catch blocks at lines ~145, 162, 304
- `frontend/src/services/audio/NativeFileImporter.ts` — catch blocks at lines ~76, 217
- `frontend/src/utils/audioUtils.native.ts` — catch blocks at lines ~63, 87

### Prerequisites

Phase 1 Task 9 completed (logger is already imported in these files).

### Implementation Steps

1. In each file, find catch blocks that have only comments (e.g., `// Ignore errors if already stopped`) and no logging.

2. For each silent catch block, add a `logger.warn()` call:

   Example transformation:
   ```typescript
   // BEFORE
   } catch {
     // Ignore errors if already stopped
   }

   // AFTER
   } catch (error) {
     // Expected if source node was already stopped
     logger.warn("[WebAudioPlayer] Error during pause (may be expected):", error);
   }
   ```

3. Keep the existing comments explaining why the error is non-fatal.

4. Do NOT change the control flow — errors should still be caught and swallowed.

5. If `logger` is not already imported in a file, add the import.

6. Run `npm run check`.

### Verification Checklist

- [ ] All identified silent catch blocks now have `logger.warn()` calls
- [ ] No control flow changes — errors are still caught and swallowed
- [ ] Existing explanatory comments are preserved
- [ ] Each catch block has the `error` parameter (not a bare `catch`)
- [ ] `npm run check` passes

### Testing Instructions

```bash
npm run check
```

### Commit Message Template

```
fix(audio): add diagnostic logging to silent catch blocks

- WebAudioPlayer: log errors in pause, stop, and unload catch blocks
- NativeFileImporter: log errors in catch blocks
- audioUtils.native: log errors in catch blocks
- Preserves non-fatal error handling while enabling debugging
```

---

## Phase 4 Completion Checklist

After all tasks are complete:

- [ ] `no-console` ESLint rule is `error` level with `allow: ['warn', 'error']`
- [ ] Logger utility files have eslint-disable comments on internal console.log/info
- [ ] `npm run lint` produces zero no-console errors in production code
- [ ] `lamejs.d.ts` type declaration exists; no `as any` cast in WebAudioExportService
- [ ] `.gitignore` covers .env, OS files, IDE files, tsbuildinfo, build/
- [ ] ErrorBoundary uses theme colors from `looperTheme`
- [ ] All silent catch blocks have `logger.warn()` calls
- [ ] `npm run check` passes

**Known limitations:**
- Other `as any` casts beyond lamejs (e.g., `permissions.web.ts` for microphone PermissionName) remain. These have narrower blast radius and lower priority.
- npm audit vulnerabilities (finding #21) are not addressed — `npm audit fix` may introduce breaking changes and should be done as a separate maintenance task.
- The loading overlay inline styles in MainScreen (lines 791-812) were not addressed since MainScreen was refactored in Phase 3.
