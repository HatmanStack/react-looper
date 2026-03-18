# Phase 0: Foundation

This phase defines shared conventions, architecture decisions, and testing strategies used across all subsequent phases. Nothing is implemented here — this is reference material.

## Architecture Decisions

### ADR-1: Remove dead code before fixing live code
Dead modules (selectors.ts, devtools.ts, useAppLifecycle.ts, useUIStore.ts) are removed in Phase 1 before any structural changes. This prevents wasted effort modifying code that will be deleted.

### ADR-2: Share AudioContext via singleton pattern
All WebAudioPlayer instances will share a single AudioContext obtained from a module-level factory function, rather than each player creating its own. This addresses the Chrome ~6 context limit. The AudioContext will be created lazily on first use and closed only during full app cleanup.

### ADR-3: Extract MainScreen logic into custom hooks, not a service class
Business logic moves from MainScreen.tsx into custom hooks (useRecordingSession, useTrackPlayback, useExportFlow) rather than into service classes. Hooks can access React state and refs naturally, keeping the extraction simple.

### ADR-4: Fix existing tests before writing new ones
Placeholder tests (`expect(true).toBe(true)`) and skipped tests are fixed/removed before adding new test coverage. This establishes trust in the test suite.

### ADR-5: Consolidate logger usage via lint rule, not manual migration
After replacing console.* calls with logger in Phase 2, Phase 4 adds an ESLint rule (`no-console`) to prevent regression. This is more sustainable than relying on code review.

## Shared Patterns and Conventions

### Commit Format
All commits use conventional commits:
```
type(scope): brief description

- Detail 1
- Detail 2
```

Types: `fix`, `feat`, `refactor`, `test`, `chore`, `docs`, `ci`
Scopes: `audio`, `store`, `ui`, `tests`, `ci`, `docs`, `config`

### Testing Strategy

- **Test runner:** Jest via `npm test` from repo root
- **Component tests:** `@testing-library/react-native`
- **Mock setup:** `frontend/jest.mocks.js` runs first, then `frontend/jest.setup.js`
- **Manual mocks:** `frontend/__mocks__/` directory
- **Path aliases:** Configured in root `package.json` jest config (`moduleNameMapper`)
- **Run single file:** `npm test -- path/to/file`
- **All checks:** `npm run check` (lint + typecheck + tests)

### Mocking Approach
- Audio APIs (AudioContext, MediaRecorder) are mocked in `jest.mocks.js`
- Expo modules are mocked via manual mocks in `__mocks__/`
- Zustand stores can be tested directly via `getState()`/`setState()`
- No live audio or network resources in tests — all mocked

### File Organization
- New utility functions go in `frontend/src/utils/`
- New hooks go in `frontend/src/hooks/`
- Test files are co-located in `__tests__/` directories or in `frontend/__tests__/`
- Shared test fixtures go in `frontend/__tests__/__fixtures__/`

### Path Aliases (for imports)
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
