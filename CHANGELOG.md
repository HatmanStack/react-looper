# Changelog

All notable changes to Looper will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.1.0] - 2026-02-05

### Added

- ErrorBoundary component for graceful React tree crash recovery
- Global error handlers for uncaught exceptions and unhandled promise rejections (web + native)
- Retry utility with exponential backoff for recoverable audio operations
- Store initialization module for cross-store synchronization (settings → playback)
- Skeleton loader for top controls to prevent layout shift
- SEO meta tags and Open Graph static files for web
- CLAUDE.md for Claude Code onboarding

### Changed

- Memoized SpeedSlider, VolumeSlider, TrackProgressBar, TrackListItem with React.memo
- Wrapped MainScreen handlers in useCallback to stabilize references
- Optimized FlatList with getItemLayout and memoized keyExtractor
- Added updateTrackState helper with early-exit when values unchanged
- Lifted getMasterLoopDuration selector from per-item to TrackList level
- Converted AudioErrorCode from enum to string union with exhaustive switch via assertNever
- Centralized QualityLevel type in audio.ts (re-exported from settings and ffmpeg)
- Added store state type aliases in selectors.ts for cleaner signatures
- Replaced `any` with proper MigratedTrack type in migration test
- Replaced console.* calls with logger utility in LifecycleManager and MainScreen
- Restructured project to frontend/ workspace pattern

### Fixed

- Recording duration capture and UI flash on stop
- Infinity duration handling in imported tracks
- Silenced production log noise
- Lint errors in skeleton and other files

### Removed

- Stale documentation: TEST_FAILURES_ANALYSIS.md, NATIVE_MIXER_LOOP_IMPLEMENTATION.md, USER_GUIDE.md
- Keyboard shortcuts section from docs (not implemented in code)
- "Zustand with persistence" claim from docs (middleware disabled)

## [1.0.0] - 2025-12-02

### Added

- Multi-track audio recording with device microphone
- Audio file import from device storage
- Master loop synchronization (first track sets loop length)
- Independent speed control (0.05x - 2.50x) per track
- Independent volume control (0-100) per track
- Loop mode toggle for continuous playback
- Export with loop count and fadeout options
- High-quality MP3/WAV export
- Cross-platform support: Web, Android, iOS
- Offline capability (all processing local)
- Dark mode Material Design interface
- Progress indicators for mixing operations

### Technical

- React Native 0.81, Expo SDK 54
- TypeScript strict mode
- Zustand for state management
- FFmpeg.wasm (web), FFmpeg Kit (native)
- 525+ passing tests
