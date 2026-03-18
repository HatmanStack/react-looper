# Phase 5 [DOC-ENGINEER]: Documentation Fixes

## Phase Goal

Fix documentation drift identified in the doc audit. CLAUDE.md has version numbers, build commands, and path aliases that don't match the actual codebase. ~15k tokens.

**Success criteria:**
- All version references in CLAUDE.md match package.json
- All build commands in CLAUDE.md match actual scripts
- All path aliases in CLAUDE.md match tsconfig.json
- .env.example exists documenting environment variables
- npm run check passes

**Estimated tokens:** ~15k

## Prerequisites

- Phases 1-4 complete
- npm run check passes

## Audit Findings Addressed

| Finding | Source | ID |
|---------|--------|----|
| React Native version imprecise (0.81 vs 0.81.5) | doc-audit.md | DRIFT |
| Expo version imprecise (54 vs ~54.0.23) | doc-audit.md | DRIFT |
| TypeScript version imprecise (5.9 vs ~5.9.2) | doc-audit.md | DRIFT |
| `expo export:web` comment in CLAUDE.md | doc-audit.md | DRIFT |
| `@screens/*` alias missing from CLAUDE.md | doc-audit.md | DRIFT #3 |
| No `.env.example` for 7+ env vars | doc-audit.md | CONFIG DRIFT #1-3 |
| Test count reference (525+) may be stale | doc-audit.md | DRIFT |

---

## Task 1: Fix CLAUDE.md Version Drift

### Goal

Update framework version references in CLAUDE.md to match the actual versions declared in `frontend/package.json`. The architecture line currently says "React Native 0.81 + Expo 54 + TypeScript 5.9" but the precise versions are React Native 0.81.5, Expo ~54.0.23, and TypeScript ~5.9.2.

### Files to Modify

- `CLAUDE.md` -- Architecture section (line 37)

### Prerequisites

None.

### Implementation Steps

1. Read `frontend/package.json` to confirm actual dependency versions:
   - `react-native`: `0.81.5`
   - `expo`: `~54.0.23`
   - `typescript`: `~5.9.2`
2. Open `CLAUDE.md`.
3. Update line 37 from:
   ```
   **Cross-platform audio looper** built with React Native 0.81 + Expo 54 + TypeScript 5.9.
   ```
   to:
   ```
   **Cross-platform audio looper** built with React Native 0.81.5 + Expo 54.0 + TypeScript 5.9.2.
   ```
   Use the major.minor.patch from `dependencies` (drop the `~` prefix which is a semver range specifier, not part of the version number). For Expo, use `54.0` since the patch version changes frequently.
4. Run `npm run check`.

### Verification Checklist

- [ ] CLAUDE.md React Native version matches `frontend/package.json` (`0.81.5`)
- [ ] CLAUDE.md Expo version matches `frontend/package.json` (`54.0`)
- [ ] CLAUDE.md TypeScript version matches `frontend/package.json` (`5.9.2`)
- [ ] `npm run check` passes

### Testing Instructions

```bash
npm run check
```

No new tests needed -- this is a documentation-only change.

### Commit Message Template

```
docs(claude): fix framework version references to match package.json

- React Native 0.81 -> 0.81.5
- Expo 54 -> 54.0
- TypeScript 5.9 -> 5.9.2
- Versions now match frontend/package.json declarations
```

---

## Task 2: Fix CLAUDE.md Build Commands

### Goal

Verify all build/dev commands documented in CLAUDE.md match the actual scripts in both root and frontend `package.json`. The `build:web` command comment says `expo export:web` -- confirm this matches the actual script. Update any commands or comments that don't match.

### Files to Modify

- `CLAUDE.md` -- Build & Development Commands section (lines 9-16)

### Prerequisites

None.

### Implementation Steps

1. Read root `package.json` scripts section. Actual scripts:
   - `start`: `cd frontend && expo start`
   - `android`: `cd frontend && expo start --android`
   - `ios`: `cd frontend && expo start --ios`
   - `web`: `cd frontend && expo start --web`
   - `build:web`: `cd frontend && expo export:web`
2. Read `frontend/package.json` scripts section. Actual scripts:
   - `build:web`: `expo export:web`
3. Compare with CLAUDE.md Build & Development Commands:
   - `npm install` -- correct (standard npm command)
   - `npm start` -- correct (maps to `expo start`)
   - `npm run web` -- correct (maps to `expo start --web`)
   - `npm run android` -- correct (maps to `expo start --android`)
   - `npm run ios` -- correct (maps to `expo start --ios`)
   - `npm run build:web` -- comment says `(expo export:web)` -- this matches the actual script
4. The doc-audit suggested the command should be `npx expo export --platform web`, but the actual `package.json` script IS `expo export:web`. The documentation comment matches the script. If the script itself is wrong, that is a code fix, not a doc fix. Leave the CLAUDE.md comment as-is since it accurately describes the script.
5. Verify Testing & Quality commands (lines 20-31) match root `package.json`:
   - `npm test` -- correct (maps to `jest`)
   - `npm run lint` -- correct
   - `npm run lint:fix` -- correct
   - `npm run typecheck` -- correct
   - `npm run check` -- correct
   - `npm run format` -- correct
   - `npm run format:check` -- correct
6. If all commands are accurate, no changes needed for this task. Document the verification.
7. Run `npm run check`.

### Verification Checklist

- [ ] Every `npm` command in CLAUDE.md Build & Development section corresponds to a real script in root `package.json`
- [ ] Every `npm` command in CLAUDE.md Testing & Quality section corresponds to a real script in root `package.json`
- [ ] Comments beside commands accurately describe what the script does
- [ ] `npm run check` passes

### Testing Instructions

```bash
npm run check
```

No new tests needed -- this is a documentation verification/fix.

### Commit Message Template

```
docs(claude): verify and fix build commands against package.json scripts

- Audit all documented npm commands against actual package.json scripts
- Fix any commands or comments that don't match
```

---

## Task 3: Fix CLAUDE.md Path Aliases

### Goal

The `@screens/*` alias exists in both `frontend/tsconfig.json` (line 11) and root `package.json` moduleNameMapper (line 46) but is missing from CLAUDE.md's documented path aliases list. Update CLAUDE.md to include all 8 aliases.

### Files to Modify

- `CLAUDE.md` -- Path Aliases section (lines 75-86)

### Prerequisites

None.

### Implementation Steps

1. Read `frontend/tsconfig.json` `compilerOptions.paths` to get the full alias list:
   ```
   @components/* -> src/components/*
   @screens/*    -> src/screens/*
   @services/*   -> src/services/*
   @store/*      -> src/store/*
   @utils/*      -> src/utils/*
   @types/*      -> src/types/*
   @constants/*  -> src/constants/*
   @theme/*      -> src/theme/*
   ```
2. Read root `package.json` `jest.moduleNameMapper` to confirm the same 8 aliases are mapped there.
3. Compare with CLAUDE.md -- currently lists 7 aliases, missing `@screens/*`.
4. Update CLAUDE.md Path Aliases code block to include all 8 aliases:
   ```
   @components/* -> frontend/src/components/*
   @screens/*    -> frontend/src/screens/*
   @services/*   -> frontend/src/services/*
   @store/*      -> frontend/src/store/*
   @utils/*      -> frontend/src/utils/*
   @types/*      -> frontend/src/types/*
   @constants/*  -> frontend/src/constants/*
   @theme/*      -> frontend/src/theme/*
   ```
5. Run `npm run check`.

### Verification Checklist

- [ ] CLAUDE.md lists exactly 8 path aliases
- [ ] `@screens/*` is present in the documented list
- [ ] Every alias in `frontend/tsconfig.json` paths is documented in CLAUDE.md
- [ ] Every alias in root `package.json` moduleNameMapper is documented in CLAUDE.md
- [ ] `npm run check` passes

### Testing Instructions

```bash
npm run check
```

No new tests needed -- this is a documentation-only change.

### Commit Message Template

```
docs(claude): add missing @screens path alias

- Add @screens/* -> frontend/src/screens/* to path aliases list
- CLAUDE.md now documents all 8 aliases matching tsconfig.json
```

---

## Task 4: Create .env.example

### Goal

The project reads 7+ environment variables across `frontend/app.config.ts`, `frontend/src/store/devtools.ts`, and `frontend/src/utils/serviceWorkerRegistration.ts`, but provides no `.env.example` or environment variable documentation. Create `.env.example` at the repo root with all discovered variables documented. Addresses doc-audit CONFIG DRIFT findings #1, #2, #3.

### Files to Create

- `.env.example` -- Template with all environment variables and comments

### Prerequisites

None.

### Implementation Steps

1. Search the codebase for all `process.env` references to collect the full list:
   - `APP_ENV` -- `frontend/app.config.ts:5` -- Controls app environment (`development` | `staging` | `production`)
   - `ENABLE_DEV_TOOLS` -- `frontend/app.config.ts:6` -- Enables dev tools overlay (`true` | `false`)
   - `ENABLE_ANALYTICS` -- `frontend/app.config.ts:7` -- Enables analytics (`true` | `false`)
   - `EAS_PROJECT_ID` -- `frontend/app.config.ts:112` -- Expo EAS project ID for mobile builds
   - `EXPO_ACCOUNT_OWNER` -- `frontend/app.config.ts:115` -- Expo account owner for mobile builds
   - `ENABLE_STATE_LOGGING` -- `frontend/src/store/devtools.ts:207` -- Enables Zustand state logging in dev mode (note: if devtools.ts was deleted in Phase 1, omit this variable)
   - `PUBLIC_URL` -- `frontend/src/utils/serviceWorkerRegistration.ts:9` -- Base URL for service worker registration (web only)
   - `NODE_ENV` -- `frontend/src/utils/serviceWorkerRegistration.ts:7` -- Standard Node environment variable (set by build tooling)
2. Check if `frontend/src/store/devtools.ts` still exists after Phase 1. If deleted, omit `ENABLE_STATE_LOGGING`.
3. Create `.env.example` at the repository root:
   ```env
   # =============================================================================
   # Environment Variables for react-looper
   # =============================================================================
   # Copy this file to .env and fill in values for your environment.
   # All variables are optional -- defaults are shown in comments.

   # -----------------------------------------------------------------------------
   # App Configuration (frontend/app.config.ts)
   # -----------------------------------------------------------------------------

   # Application environment: development | staging | production
   # Default: development
   APP_ENV=development

   # Enable developer tools panel in the app (true | false)
   # Default: false
   ENABLE_DEV_TOOLS=false

   # Enable analytics tracking (true | false)
   # Default: false
   ENABLE_ANALYTICS=false

   # State Logging - log Zustand state changes to console (development only)
   # Only relevant if frontend/src/store/devtools.ts exists
   # Default: false
   # ENABLE_STATE_LOGGING=false

   # -----------------------------------------------------------------------------
   # Expo EAS Build (required for mobile builds only)
   # -----------------------------------------------------------------------------

   # EAS project ID from your Expo dashboard (https://expo.dev)
   # EAS_PROJECT_ID=your-eas-project-id

   # Expo account owner name
   # EXPO_ACCOUNT_OWNER=your-expo-account

   # -----------------------------------------------------------------------------
   # Build & Runtime (set by build tools, rarely set manually)
   # -----------------------------------------------------------------------------

   # Node environment (typically set automatically by build tools)
   # NODE_ENV=development

   # Public URL prefix for static assets and service worker registration (web only)
   # Typically set automatically by the web bundler
   # PUBLIC_URL=https://looper.hatstack.fun
   ```
4. If `ENABLE_STATE_LOGGING` is no longer referenced (devtools.ts deleted in Phase 1), remove its entry from `.env.example`.
5. Verify `.env.example` is NOT listed in `.gitignore` (it should be committed to the repo).
6. Run `npm run check`.

### Verification Checklist

- [ ] `.env.example` exists at repo root
- [ ] All `process.env` variables from `app.config.ts` are documented (`APP_ENV`, `ENABLE_DEV_TOOLS`, `ENABLE_ANALYTICS`, `EAS_PROJECT_ID`, `EXPO_ACCOUNT_OWNER`)
- [ ] `PUBLIC_URL` from `serviceWorkerRegistration.ts` is documented
- [ ] `ENABLE_STATE_LOGGING` is included only if `devtools.ts` still exists
- [ ] Each variable has a comment explaining its purpose and valid values
- [ ] Optional/deployment-only variables are commented out with `#` prefix
- [ ] `.env.example` is not in `.gitignore`
- [ ] `npm run check` passes

### Testing Instructions

```bash
npm run check
```

No new tests needed -- this is a documentation file.

### Commit Message Template

```
docs(config): create .env.example documenting all environment variables

- Document APP_ENV, ENABLE_DEV_TOOLS, ENABLE_ANALYTICS from app.config.ts
- Document EAS_PROJECT_ID, EXPO_ACCOUNT_OWNER for mobile builds
- Document NODE_ENV, PUBLIC_URL for build/runtime
- Include ENABLE_STATE_LOGGING if devtools.ts is still present
- Addresses doc-audit CONFIG DRIFT findings (no .env.example existed)
```

---

## Task 5: Fix Test Count and Other Minor Drift

### Goal

CLAUDE.md references "525+ tests" in the Testing & Quality section (line 21). Verify the actual test count by running `npm test` and update if stale. Also fix any other minor inaccuracies discovered during Phases 1-4 (e.g., store count if Phase 1 deleted useUIStore, selectors.ts reference if deleted).

### Files to Modify

- `CLAUDE.md` -- Testing & Quality section (line 21), State Management section (lines 45-51)

### Prerequisites

- Phases 1-4 complete (test count may have changed due to deleted/added tests)

### Implementation Steps

1. Run `npm test` from the repo root and note the total test count from the Jest summary line (e.g., "Tests: X passed, X total").
2. Compare with the "525+ tests" reference in CLAUDE.md line 21.
3. If the count has changed, update the comment:
   - If the count is higher: update to the new floor (e.g., "540+ tests")
   - If the count is lower (due to deleted dead test files in Phase 1): update accordingly
   - Round down to the nearest multiple of 5 or 10 for the "X+" format
4. Check State Management section:
   - If Phase 1 Task 5 deleted `useUIStore`, verify CLAUDE.md now says "Three stores" (not "Four stores") and the `useUIStore` bullet is removed. Fix if Phase 1 missed this.
   - If Phase 1 Task 1 deleted `selectors.ts`, verify the "Optimized selectors in `selectors.ts`" line is removed. Fix if missed.
5. Check for any other stale references introduced or exposed by Phases 1-4 changes.
6. Run `npm run check`.

### Verification Checklist

- [ ] Test count in CLAUDE.md matches actual `npm test` output (within rounding)
- [ ] State Management section reflects actual number of stores
- [ ] No references to deleted modules (`selectors.ts`, `devtools.ts`, `useUIStore`, `useAppLifecycle`, `LifecycleManager`)
- [ ] `npm run check` passes

### Testing Instructions

```bash
npm test
npm run check
```

### Commit Message Template

```
docs(claude): update test count and fix stale references

- Update test count from 525+ to actual count
- Verify store count and removed module references are accurate
- Final documentation consistency pass
```

---

## Phase Verification

After all 5 tasks are complete:

1. **Run `npm run check`** -- all lint, typecheck, and tests must pass.
2. **Version check**: Confirm CLAUDE.md framework versions match `frontend/package.json`:
   - `react-native` version matches
   - `expo` version matches
   - `typescript` version matches
3. **Build commands check**: Confirm every `npm` command in CLAUDE.md exists in root `package.json` scripts.
4. **Path aliases check**: Confirm all 8 aliases from `frontend/tsconfig.json` are documented in CLAUDE.md.
5. **Environment variables check**: Confirm `.env.example` exists and covers all `process.env` references in the codebase:
   ```bash
   grep -rn "process\.env\." frontend/src/ frontend/app.config.ts
   ```
   Every variable found should have a corresponding entry in `.env.example`.
6. **Test count check**: Confirm the test count comment is accurate.
7. **Re-read doc-audit findings**: Walk through each DRIFT and CONFIG DRIFT finding in `doc-audit.md` and confirm it is either fixed or explicitly out of scope for this phase.

**Out of scope for this phase:**
- Audio service documentation restructuring (doc-audit DRIFT findings #1, #2) -- these are architectural description changes that should be handled after native audio implementation is complete
- docs/README.md architecture tree updates (STRUCTURE finding #1) -- separate from CLAUDE.md remediation
- docs/README.md troubleshooting label fix (DRIFT finding #4) -- minor, can be batched separately
- Version bump from 1.0.0 to 1.1.0 (DRIFT finding #5) -- this is a release management decision, not a documentation fix
- `CONTRIBUTING.md` creation -- additive documentation that can be written after remediation is complete
