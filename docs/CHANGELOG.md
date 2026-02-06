# Changelog

All notable changes to Looper will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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

---

## Versioning

- **MAJOR**: Breaking changes
- **MINOR**: New features, backwards compatible
- **PATCH**: Bug fixes
