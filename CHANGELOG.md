# Changelog

All notable changes to Looper will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.2.0] - 2026-03-18

### Added

- Extracted useRecordingSession, useTrackPlayback, useExportFlow hooks from MainScreen (~435 lines reduced)
- fetchWithTimeout utility with AbortController for audio service network calls
- HTTP response.ok validation in fetchWithTimeout to surface HTTP errors explicitly
- Platform-specific downloadFile utility (web/native split)
- WebAudioRecorder unit tests covering start, stop, permissions, onerror, and duration
- audioContextManager unit tests for singleton lifecycle
- .env.example documenting all environment variables
- Type declaration for @breezystack/lamejs
- ESLint no-console rule enforcing logger utility usage
- Re-entrancy guard on recording stop to prevent concurrent auto-stop and manual stop

### Changed

- Replaced Date.now() track IDs with crypto.randomUUID() to avoid collisions
- Consolidated console.* calls to logger utility across all services
- Removed useUIStore (dead module) and consolidated into existing stores
- Removed dead modules: selectors.ts, devtools.ts, useAppLifecycle, LifecycleManager
- Removed unused audioContextManager ref counting (contextRefCount, releaseAudioContext)
- Decoupled LoopEngine and WebAudioMixer from store dependencies (pure parameter passing)
- Moved scaleVolume to shared audioUtils with input clamping to [0, 100]
- LoopEngine now uses speed-adjusted durations for loop count and boundary calculations
- WebAudioMixer re-acquires AudioContext if existing one is closed
- Replaced hardcoded colors in ErrorBoundary and MainScreen with looperTheme references
- Moved inline loading overlay style to MainScreen.styles.ts
- Native export success alert now shows actual file path instead of user-supplied filename

### Fixed

- Memory leak: blob URL revocation in WebAudioPlayer._unload()
- Memory leak: AudioContext close on player unload
- Silent catch blocks now log errors via logger.debug
- WebAudioRecorder.onerror now rejects pending promise instead of throwing
- Recording UI state (isRecording, duration) resets in finally block on stop failure
- MainScreen buttons disabled when audio service initialization fails
- Typed AudioError preserved through catch chains in WebAudioMixer, WebAudioExportService
- Floating promise in useTrackPlayback.handleSpeedChangeConfirm marked with void
- onTrackRecorded guards against null audio service before adding track to store
- AudioFileManager.native.ts concurrent init() race prevented via stored promise
- Raw URI removed from fetchWithTimeout and loadAudioBuffer error messages

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
