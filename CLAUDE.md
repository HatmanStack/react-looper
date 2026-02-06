# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

All commands run from root (npm workspaces with `frontend/` package):

```bash
npm install              # Install all dependencies
npm start                # Expo dev server
npm run web              # Run in browser
npm run android          # Run on Android
npm run ios              # Run on iOS
npm run build:web        # Static web export (expo export:web)
```

## Testing & Quality

```bash
npm test                 # Run Jest tests (525+ tests)
npm test -- --watch      # Watch mode
npm test -- --coverage   # Coverage report
npm test -- path/to/file # Run single test file
npm run lint             # ESLint (from frontend/)
npm run lint:fix         # ESLint with auto-fix
npm run typecheck        # TypeScript check (tsc --noEmit)
npm run check            # All checks: lint + typecheck + tests
npm run format           # Prettier format
npm run format:check     # Prettier check
```

Jest config is in root `package.json` (not a separate jest.config). Test roots point to `frontend/`. Path aliases (`@components/*`, `@services/*`, etc.) are mapped in `moduleNameMapper`.

## Architecture

**Cross-platform audio looper** built with React Native 0.81 + Expo 54 + TypeScript 5.9. Runs on web, Android, and iOS from a single codebase. Live at https://looper.hatstack.fun.

### Core Concept: Master Loop

The first recorded track becomes the **master track** and defines the loop duration. Subsequent tracks loop/truncate to match. Speed changes affect loop timing (duration / speed). All loop math lives in `frontend/src/utils/loopUtils.ts`.

### State Management (Zustand)

Four stores in `frontend/src/store/`:
- **useTrackStore** — Track CRUD, master loop tracking
- **usePlaybackStore** — Per-track speed/volume/playing/looping state (uses `Map<string, TrackState>`)
- **useSettingsStore** — Export format, recording quality, loop preferences
- **useUIStore** — Modal visibility, recording/mixing state, errors

Optimized selectors in `selectors.ts` prevent unnecessary re-renders. Store migrations in `store/migrations/`.

### Audio Service Layer (Platform-Split)

`frontend/src/services/audio/` uses a factory pattern:
- **Web**: Web Audio API + FFmpeg.wasm (`@ffmpeg/ffmpeg`) + lamejs for MP3 encoding
- **Native**: expo-av + ffmpeg-kit-react-native

Platform-specific files use extensions: `.web.ts` and `.native.ts`. The service hierarchy: `AudioService` → `IAudioPlayer`/`IAudioRecorder`/`IAudioMixer` → platform implementations.

### Export Pipeline

`frontend/src/services/ffmpeg/`:
- **FFmpegCommandBuilder** constructs CLI commands with speed/volume/loop/fadeout parameters
- Quality presets in `audioQuality.ts` (low/medium/high bitrate per format)
- Supports MP3, WAV, M4A output

### UI Layer

- **React Native Paper** (Material Design 3) with custom dark theme in `frontend/src/theme/paperTheme.ts`
- **Expo Router** for file-based navigation (`frontend/app/`)
- Screens: MainScreen (recording/mixing), SettingsScreen (preferences)
- Responsive layout via `frontend/src/utils/responsive.ts` (mobile/tablet/desktop breakpoints)

### Path Aliases

Configured in both `frontend/tsconfig.json` and root `package.json` (Jest moduleNameMapper):
```
@components/* → frontend/src/components/*
@services/*   → frontend/src/services/*
@store/*      → frontend/src/store/*
@utils/*      → frontend/src/utils/*
@types/*      → frontend/src/types/*
@constants/*  → frontend/src/constants/*
@theme/*      → frontend/src/theme/*
```

### Testing Setup

- Preset: `jest-expo`
- Mock setup: `frontend/jest.mocks.js` (all Expo/native modules) runs first, then `frontend/jest.setup.js`
- Manual mocks in `frontend/__mocks__/`
- Tests in `frontend/__tests__/` and co-located `__tests__` directories
- Uses `@testing-library/react-native` for component tests

### Error Handling

- `AudioError` class with typed error codes and user-friendly messages (`frontend/src/services/audio/AudioError.ts`)
- `ErrorBoundary` component for React tree crashes
- Global error handler in `frontend/src/utils/globalErrorHandler.ts`
