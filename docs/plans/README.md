# Looper: Android to React Native (Expo) Migration Plan

## Overview

This document outlines the comprehensive migration plan for porting the **Looper** audio looping application from Android (Java) to React Native using Expo. The migration adds significant new functionality—**true audio mixing**—while maintaining feature parity with the existing Android app and expanding to web and iOS platforms.

### What is Looper?

Looper is an audio manipulation application that allows users to:

- Record audio or import audio files from their device
- Play multiple audio tracks simultaneously with independent controls
- Adjust playback speed (0.05x - 2.50x) and volume (0-100) for each track independently
- Loop all tracks continuously
- **[NEW]** Mix multiple tracks into a single audio file (accounting for speed/volume adjustments)
- Save individual tracks and mixed outputs

### Current State (Android)

**Technology:** Native Android app built with Java and Android SDK

- **Recording:** MediaRecorder (THREE_GPP format, AMR_NB codec)
- **Playback:** Multiple MediaPlayer instances running simultaneously
- **Audio Processing:** MediaPlayer.setPlaybackParams() for speed, setVolume() for volume
- **UI:** Material Design with RecyclerView for track list
- **Limitation:** No true audio mixing—only simultaneous playback, cannot export mixed audio

**Source Code:** `../app/src/main/java/gemenie/looper/`

- `MainActivity.java` (489 lines)
- `SoundControlsAdapter.java` (174 lines)

### Target State (React Native + Expo)

**Technology:** React Native with Expo Dev Client

- **Platforms:** Web (primary), Android, iOS
- **Audio Processing:** FFmpeg for true audio mixing and processing
- **Playback:** Platform-specific (Web Audio API for web, expo-av for native)
- **UI:** React Native Paper (Material Design)
- **State:** Zustand for global state management
- **New Feature:** Export mixed audio files combining all tracks with their adjustments

### Key Migration Challenges

1. **True Audio Mixing** - Implementing FFmpeg-based audio mixing (doesn't exist in current app)
2. **Platform-Specific Audio** - Different APIs for web (Web Audio API) vs native (expo-av)
3. **Cross-Platform Compatibility** - Same codebase running on web, Android, and iOS
4. **FFmpeg Integration** - Custom native modules requiring Expo Dev Client
5. **Performance** - Ensuring responsive UI during audio processing operations

---

## Prerequisites

Before starting this migration, ensure you have:

### Development Environment

**Required:**

- Node.js 18+ and npm/yarn
- Git (for version control)
- Code editor (VS Code recommended)
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`

**For Native Development:**

- **Android:** Android Studio, Android SDK, Java 11+
- **iOS:** macOS with Xcode 14+, CocoaPods
- Physical devices or emulators for testing

**For Web Development:**

- Modern web browsers (Chrome, Firefox, Safari)
- Web debugging tools

### Accounts & Services

- Expo account (free tier sufficient for development)
- EAS Build account (for custom dev client builds)
- Apple Developer account (for iOS builds)
- Google Play Developer account (for Android builds)

### Knowledge Requirements

**Essential:**

- React and React Hooks
- TypeScript basics
- Async/await and Promises
- Git version control

**Helpful:**

- React Native fundamentals
- Expo ecosystem
- Audio processing concepts
- FFmpeg basics
- Testing (Jest, React Testing Library)

---

## Migration Phases

The migration is divided into 9 sequential phases, each designed to fit within a ~100,000 token context window for efficient implementation.

| Phase                   | Goal                                        | Estimated Tokens | Dependencies         |
| ----------------------- | ------------------------------------------- | ---------------- | -------------------- |
| [Phase 0](./Phase-0.md) | **Foundation & Architecture Decisions**     | ~10,000          | None (reference doc) |
| [Phase 1](./Phase-1.md) | **Project Setup & Tooling**                 | ~80,000          | Phase 0              |
| [Phase 2](./Phase-2.md) | **Core UI Components**                      | ~100,000         | Phase 1              |
| [Phase 3](./Phase-3.md) | **Audio Abstraction Layer**                 | ~90,000          | Phase 2              |
| [Phase 4](./Phase-4.md) | **Recording & Import (Platform-Specific)**  | ~105,000         | Phase 3              |
| [Phase 5](./Phase-5.md) | **Playback & Controls (Platform-Specific)** | ~110,000         | Phase 3              |
| [Phase 6](./Phase-6.md) | **FFmpeg Integration & Mixing Engine**      | ~120,000         | Phases 4 & 5         |
| [Phase 7](./Phase-7.md) | **State Management & Persistence**          | ~95,000          | Phase 6              |
| [Phase 8](./Phase-8.md) | **Testing & Quality Assurance**             | ~105,000         | Phase 7              |
| [Phase 9](./Phase-9.md) | **Build Configuration & Deployment**        | ~85,000          | Phase 8              |
| **Total**               |                                             | **~900,000**     |                      |

### Phase Descriptions

**Phase 0: Foundation & Architecture Decisions**

- Analysis of current Android implementation
- Architecture Decision Records (ADRs) for key technical choices
- Technology stack selection
- Patterns, conventions, and standards
- Not an implementation phase—reference document for all other phases

**Phase 1: Project Setup & Tooling**

- Initialize Expo project with TypeScript
- Configure Expo Dev Client for custom native modules
- Set up development tools (ESLint, Prettier, TypeScript)
- Configure Metro bundler for platform-specific files
- Install core dependencies (React Native Paper, navigation)
- Project structure creation

**Phase 2: Core UI Components**

- Implement main screen layout
- Build reusable UI components (buttons, cards, modals)
- Create track list with FlatList
- Implement track control component (play/pause/delete, sliders)
- Set up React Native Paper theming (dark mode, colors)
- Responsive layout for web and mobile

**Phase 3: Audio Abstraction Layer**

- Define TypeScript interfaces for audio services
- Create abstract base classes for platform-specific implementations
- Set up platform detection and dependency injection
- Implement mock audio services for UI development
- Establish error handling patterns for audio operations

**Phase 4: Recording & Import (Platform-Specific)**

- **Web:** MediaRecorder API integration for recording
- **Native:** expo-av Audio.Recording implementation
- File picker integration (expo-document-picker for native, File API for web)
- Permission handling (microphone, storage)
- Audio format standardization (convert to MP3)
- File system management (expo-file-system)

**Phase 5: Playback & Controls (Platform-Specific)**

- **Web:** Web Audio API for multi-track playback with speed/volume control
- **Native:** expo-av Audio.Sound for multi-track playback
- Speed control implementation (0.05x - 2.50x range)
- Volume control with logarithmic scaling
- Looping functionality
- Synchronized playback of multiple tracks

**Phase 6: FFmpeg Integration & Mixing Engine**

- **Web:** @ffmpeg/ffmpeg (WebAssembly) integration
- **Native:** react-native-ffmpeg or ffmpeg-kit integration via Expo config plugin
- FFmpeg command builder for audio processing
- Audio mixing implementation (amix filter)
- Speed adjustment (atempo filter)
- Volume adjustment (volume filter)
- Progress tracking and UI feedback during processing
- Export mixed audio to file

**Phase 7: State Management & Persistence**

- Zustand store implementation for tracks, playback state, UI state
- Track CRUD operations (create, read, update, delete)
- Persistent storage (AsyncStorage with zustand/middleware)
- State synchronization with audio services
- Handle app lifecycle (pause, resume, background)
- Migration of state from old storage formats if applicable

**Phase 8: Testing & Quality Assurance**

- Unit tests for audio services, utilities, state management
- Integration tests for component-service interactions
- E2E tests for critical user flows (record, play, mix, save)
- Platform-specific test configurations
- Test fixtures (small audio files for testing)
- Performance testing and optimization
- Accessibility testing

**Phase 9: Build Configuration & Deployment**

- EAS Build configuration for Android and iOS
- Expo config plugin setup for FFmpeg
- Web build optimization (code splitting, lazy loading)
- App store metadata and assets (icons, splash screens, screenshots)
- Environment configuration (production vs development)
- CI/CD pipeline setup (optional)
- Release builds and deployment to app stores and web hosting

---

## Phase Execution Guidelines

### How to Use This Plan

1. **Start with Phase 0** - Read the entire foundation document to understand architectural decisions
2. **Execute phases sequentially** - Each phase builds on the previous one
3. **Complete all tasks in a phase** before moving to the next
4. **Follow the verification checklists** to ensure quality
5. **Commit frequently** using conventional commit messages
6. **Test as you go** - Don't wait until Phase 8 to start testing

### Parallelization Opportunities

While phases are generally sequential, some work can be parallelized:

- **Phase 4 & 5** - Recording and playback can be developed by separate developers
- **Within phases** - Web and native implementations can be developed in parallel
- **UI & Tests** - Component tests can be written alongside component development

### Estimation & Timeline

**Token estimates** are approximate and based on:

- Complexity of implementation
- Amount of platform-specific code
- Testing requirements
- Documentation needs

**Timeline estimation** depends on:

- Team size (1 developer vs multiple)
- Developer experience with React Native/Expo
- Availability of testing devices/environments
- Parallelization of tasks

**Rough timeline for a solo developer:**

- Phase 1: 2-3 days
- Phase 2: 4-5 days
- Phase 3: 3-4 days
- Phase 4: 5-6 days
- Phase 5: 6-7 days
- Phase 6: 7-8 days
- Phase 7: 3-4 days
- Phase 8: 5-6 days
- Phase 9: 3-4 days
- **Total: 6-8 weeks** (single developer, full-time)

---

## Success Criteria

The migration will be considered complete when:

### Functional Requirements

- ✅ All features from Android app work in React Native version
- ✅ Audio recording with quality matching or exceeding Android app
- ✅ Multi-track simultaneous playback
- ✅ Independent speed and volume controls per track
- ✅ **True audio mixing and export** (new feature)
- ✅ Import audio from device/file system
- ✅ Save individual and mixed tracks

### Platform Requirements

- ✅ Runs in web browsers (Chrome, Firefox, Safari latest versions)
- ✅ Builds successfully for Android (APK/AAB)
- ✅ Builds successfully for iOS (IPA)
- ✅ Responsive UI on mobile and desktop web

### Quality Requirements

- ✅ TypeScript strict mode with no errors
- ✅ 80%+ code coverage for core logic
- ✅ All E2E test flows passing
- ✅ No critical accessibility violations (WCAG 2.1 Level AA)
- ✅ Performance: <3 second cold start, <100ms UI interactions
- ✅ No memory leaks (audio resources properly released)

### User Experience Requirements

- ✅ Material Design aesthetic matching Android app
- ✅ Intuitive controls and workflows
- ✅ Clear error messages and user feedback
- ✅ State persists across app restarts
- ✅ Graceful handling of edge cases (no audio files, low storage, etc.)

---

## Risk Mitigation

### High-Risk Areas

1. **FFmpeg Integration Complexity**
   - **Risk:** Platform-specific FFmpeg setup is complex and error-prone
   - **Mitigation:** Phase 6 includes detailed FFmpeg setup instructions, use tested libraries
   - **Fallback:** Start with web-only FFmpeg (wasm), add native later

2. **Audio Synchronization**
   - **Risk:** Multiple tracks may drift out of sync during playback
   - **Risk:** Speed-adjusted tracks may not align correctly in mix
   - **Mitigation:** Phase 5 includes synchronization testing, use single audio context
   - **Fallback:** Limit simultaneous tracks, add manual sync controls

3. **Cross-Platform Differences**
   - **Risk:** Audio behaves differently on web vs native vs iOS vs Android
   - **Mitigation:** Platform-specific implementations, comprehensive testing on all platforms
   - **Fallback:** Document platform limitations, prioritize web experience

4. **Performance on Web**
   - **Risk:** FFmpeg WebAssembly is slow, may block UI
   - **Mitigation:** Web Workers for FFmpeg processing, progress indicators
   - **Fallback:** Limit track count or duration on web, recommend native apps for heavy use

5. **App Store Approval**
   - **Risk:** FFmpeg binary size may cause App Store rejection
   - **Mitigation:** Use minimal FFmpeg build (audio-only, no video codecs)
   - **Fallback:** Remove non-essential codecs, optimize binary

### De-risking Strategy

- **Phase 3** validates platform abstraction pattern early
- **Phase 4 & 5** prove audio recording/playback before mixing complexity
- **Phase 6** tackles highest-risk FFmpeg integration after basics are solid
- **Phase 8** catches integration issues before deployment
- **Incremental testing** throughout prevents big-bang integration failures

---

## File Organization

```
Migration/
├── docs/
│   └── plans/
│       ├── README.md          ← You are here
│       ├── Phase-0.md         ← Foundation & ADRs
│       ├── Phase-1.md         ← Project Setup
│       ├── Phase-2.md         ← Core UI
│       ├── Phase-3.md         ← Audio Abstraction
│       ├── Phase-4.md         ← Recording & Import
│       ├── Phase-5.md         ← Playback & Controls
│       ├── Phase-6.md         ← FFmpeg & Mixing
│       ├── Phase-7.md         ← State Management
│       ├── Phase-8.md         ← Testing
│       └── Phase-9.md         ← Build & Deployment
├── src/                       ← React Native source code (created in Phase 1)
├── assets/                    ← Images, sounds, etc.
├── __tests__/                 ← Test files
├── app.json                   ← Expo configuration
├── package.json               ← Dependencies
└── README.md                  ← Project README (created in Phase 1)
```

---

## Navigation

**Start Here:**

1. Read [Phase 0: Foundation & Architecture Decisions](./Phase-0.md)
2. Understand all ADRs and technology choices
3. Proceed to [Phase 1: Project Setup & Tooling](./Phase-1.md)

**Reference Documents:**

- [Phase 0](./Phase-0.md) - Architecture decisions, patterns, technology stack
- Android Source Code - `../app/src/main/java/gemenie/looper/` (for reference)

**Implementation Phases:**

- [Phase 1: Project Setup & Tooling](./Phase-1.md)
- [Phase 2: Core UI Components](./Phase-2.md)
- [Phase 3: Audio Abstraction Layer](./Phase-3.md)
- [Phase 4: Recording & Import](./Phase-4.md)
- [Phase 5: Playback & Controls](./Phase-5.md)
- [Phase 6: FFmpeg Integration & Mixing](./Phase-6.md)
- [Phase 7: State Management & Persistence](./Phase-7.md)
- [Phase 8: Testing & Quality Assurance](./Phase-8.md)
- [Phase 9: Build Configuration & Deployment](./Phase-9.md)

---

## Questions or Issues?

If you encounter ambiguities or need clarification while implementing:

1. Check [Phase 0](./Phase-0.md) for architectural guidance
2. Review the original Android source code for reference
3. Use the **QUESTION:** or **CLARIFICATION:** keywords in your implementation notes
4. Consult Expo documentation: https://docs.expo.dev/
5. Check React Native Paper docs: https://callstack.github.io/react-native-paper/

---

## Version History

- **v1.0** - Initial migration plan created
- Platform targets: Web (primary), Android, iOS
- Feature addition: True audio mixing via FFmpeg
- Technology: React Native + Expo Dev Client

---

**Ready to begin? Start with [Phase 0: Foundation & Architecture Decisions](./Phase-0.md)**
