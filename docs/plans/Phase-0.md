# Phase 0: Foundation & Architecture Decisions

## Overview

This phase establishes the architectural foundation, design decisions, and technical standards that will guide all subsequent implementation phases. These decisions are based on analysis of the existing Android (Java) codebase and the requirements for the React Native (Expo) migration.

**This is not an implementation phase** - it's a reference document for all future phases.

---

## Source Code Analysis Summary

### Android Implementation (Current State)

**Location:** `../app/src/main/java/gemenie/looper/`

**Files Analyzed:**

- `MainActivity.java` (489 lines) - Main activity, audio recording, file management
- `SoundControlsAdapter.java` (174 lines) - RecyclerView adapter, playback controls

**Audio Technologies Used:**

1. **Recording** (MainActivity.java:150-159)
   - `MediaRecorder` with MIC audio source
   - Output Format: `THREE_GPP`
   - Audio Encoder: `AMR_NB` (Adaptive Multi-Rate Narrowband)
   - Output: `.mp3` files (despite THREE_GPP format)

2. **Playback** (MainActivity.java:194-221, SoundControlsAdapter.java:106-125)
   - Multiple `MediaPlayer` instances running simultaneously
   - Each track has its own MediaPlayer instance
   - Looping enabled via `setLooping(true)`
   - **CRITICAL**: No actual audio mixing - Android's audio system mixes at output level

3. **Speed Control** (SoundControlsAdapter.java:145-159)
   - `MediaPlayer.setPlaybackParams(new PlaybackParams().setSpeed(float))`
   - Range: 0.05x to 2.50x (seekbar 3-102, divided by 41)
   - Requires API 23+ (Android M), hidden on older devices
   - Preserves pitch automatically

4. **Volume Control** (SoundControlsAdapter.java:134-143)
   - `MediaPlayer.setVolume(float, float)` for left/right channels
   - Logarithmic scaling: `1 - (Math.log(MAX_VOLUME - progress) / Math.log(MAX_VOLUME))`
   - Range: 0-100 (seekbar)

5. **File Management** (MainActivity.java:186-191, 236-280)
   - Internal storage: `context.getFilesDir()` for recordings
   - External storage: `Environment.DIRECTORY_DOWNLOADS/Looper` for exports
   - File format: `.mp3` extension
   - Save operation: Simple file copy (no mixing/rendering)

**UI Structure:**

- RecyclerView with custom adapter for track list
- Each track item: Play/Pause/Delete buttons, Volume/Speed sliders
- Top controls: Record/Stop buttons
- Bottom controls: Audio import, Save buttons
- Material Design theme with dark mode

**Dependencies:**

- Standard Android SDK only (no external audio libraries)
- AndroidX: AppCompat, Material, RecyclerView, ConstraintLayout

**Key Limitations Identified:**

- ❌ No true audio mixing (just simultaneous playback)
- ❌ Cannot export mixed audio file
- ❌ Speed control requires API 23+
- ❌ Limited to Android platform only

---

## Architecture Decision Records (ADRs)

### ADR-001: Expo Dev Client vs Bare Workflow

**Status:** Accepted

**Context:**
True audio mixing requires custom native modules that aren't available in standard Expo Go. We need to choose between Expo Dev Client (custom development builds with native modules) and Bare Workflow (full ejection).

**Decision:** Use **Expo Dev Client** with custom development builds.

**Rationale:**

- Maintains Expo ecosystem benefits (EAS Build, OTA updates, unified configuration)
- Allows native modules via config plugins or custom native code
- Easier to maintain than bare workflow
- Better developer experience than pure bare React Native
- Can still use all Expo libraries and services

**Consequences:**

- Need to create custom development client builds (cannot use Expo Go)
- Requires EAS Build or local builds with expo-dev-client
- Slightly more complex setup than managed workflow
- Still much simpler than bare workflow maintenance

**Implementation:**

```json
// app.json
{
  "expo": {
    "plugins": ["expo-av", ["react-native-ffmpeg", { "package": "min" }]]
  }
}
```

---

### ADR-002: Audio Processing Library

**Status:** Accepted

**Context:**
We need true audio mixing capabilities with speed/pitch control and volume adjustment. Options considered:

1. FFmpeg (command-line audio processing)
2. Native Audio APIs (AudioTrack/AVAudioEngine)
3. Web Audio API (web only)
4. Hybrid approaches

**Decision:** Use **FFmpeg for all platforms** with platform-specific binaries.

**Platform-Specific Implementations:**

- **Web:** `@ffmpeg/ffmpeg` (WebAssembly version)
- **Native:** `react-native-ffmpeg` via Expo config plugin (or ffmpeg-kit)

**Rationale:**

- FFmpeg provides complete audio processing pipeline (decode, process, mix, encode)
- Handles format conversion automatically
- Battle-tested for audio manipulation
- Same conceptual model across platforms (filter chains)
- Supports all required operations: speed (atempo), volume, mixing (amix)

**Consequences:**

- Large binary size (~30-50MB depending on build)
- Learning curve for FFmpeg filter syntax
- Processing is offline/batch (not real-time)
- Need separate real-time playback solution

**Trade-offs Accepted:**

- Size increase for reliability and feature completeness
- Batch processing acceptable since mixing only happens on export

---

### ADR-003: Platform-Specific Audio Implementations

**Status:** Accepted

**Context:**
The app must run on Web (primary), Android, and iOS. Each platform has different audio APIs and capabilities.

**Decision:** Implement **platform-specific audio layers** with unified interfaces.

**Architecture:**

```
┌─────────────────────────────────────┐
│   UI Layer (Shared)                 │
│   - React Components                │
│   - State Management                │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Audio Service Abstraction         │
│   - IAudioRecorder                  │
│   - IAudioPlayer                    │
│   - IAudioMixer                     │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼──────┐ ┌──────▼──────┐
│ Web Impl    │ │ Native Impl │
│ - MediaRec  │ │ - expo-av   │
│ - WebAudio  │ │ - FFmpeg    │
│ - @ffmpeg   │ │   native    │
└─────────────┘ └─────────────┘
```

**Platform Detection:**

```typescript
import { Platform } from "react-native";

const audioService = Platform.select({
  web: () => new WebAudioService(),
  default: () => new NativeAudioService(),
})();
```

**Rationale:**

- Optimized performance for each platform
- Leverage platform-specific strengths (Web Audio API vs native audio)
- Better user experience (faster processing on native)
- Flexibility to use best tools per platform

**Consequences:**

- More code to maintain (~15-20% duplication)
- Need comprehensive testing on all platforms
- Shared interfaces must accommodate all platform capabilities
- Core business logic remains shared (~80%)

---

### ADR-004: UI Framework Selection

**Status:** Accepted

**Context:**
Need cross-platform UI components that work on Web, Android, and iOS. Current Android app uses Material Design.

**Decision:** Use **React Native Paper** (Material Design for React Native).

**Rationale:**

- Material Design maintains visual consistency with current Android app
- Works across all platforms (Web via React Native Web, native)
- Comprehensive component library (buttons, sliders, cards, modals)
- Built-in theming system
- Active maintenance and good documentation
- Native feel on Android, acceptable on iOS/Web

**Components We'll Use:**

- `Button` - Action buttons (Record, Stop, Save, Import)
- `IconButton` - Track controls (Play, Pause, Delete)
- `Card` - Track list items
- `Portal` + `Modal` - Save dialog
- `TextInput` - File naming
- Custom slider components (Paper's Slider may not meet needs)

**Theming:**

```typescript
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#BB86FC",
    background: "#121212",
    surface: "#1E1E1E",
  },
};
```

**Consequences:**

- Dependency on React Native Paper library
- Bundle size increase (~200KB)
- May need custom components for sliders (volume/speed)
- Learning curve for Paper's theming system

---

### ADR-005: State Management Strategy

**Status:** Accepted

**Context:**
Need to manage complex state:

- List of audio tracks (URIs, metadata)
- Playback states (playing, paused, stopped)
- Track settings (speed, volume)
- Recording state
- UI state (modals, dialogs)

**Decision:** Use **Zustand** for global state management.

**Rationale:**

- Simpler than Redux, less boilerplate
- TypeScript-first design
- No Provider wrapping needed
- Good performance (subscription-based)
- Easy to persist state
- Small bundle size (~3KB)
- Works well with React hooks

**Store Structure:**

```typescript
interface LooperStore {
  // Track management
  tracks: Track[];
  addTrack: (track: Track) => void;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, updates: Partial<Track>) => void;

  // Playback state
  playingTracks: Set<string>;
  togglePlayback: (id: string) => void;

  // Recording state
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;

  // UI state
  saveModalVisible: boolean;
  selectedTrackId: string | null;
}
```

**Persistence:**

```typescript
import { persist } from "zustand/middleware";

const useStore = create(
  persist(
    (set) => ({
      /* store */
    }),
    { name: "looper-storage" },
  ),
);
```

**Consequences:**

- Need to learn Zustand API
- State serialization requirements for persistence
- Must handle platform-specific storage backends

**Alternative Considered:** React Context API

- Rejected: Too many re-renders for frequently changing audio state
- Rejected: More complex to persist

---

### ADR-006: Testing Strategy

**Status:** Accepted

**Context:**
Complex audio processing logic, platform-specific implementations, and critical user workflows require comprehensive testing.

**Decision:** Multi-layered testing approach with **Jest + React Native Testing Library + Detox**.

**Test Layers:**

1. **Unit Tests** (Jest)
   - Audio service abstractions
   - State management (Zustand stores)
   - Utility functions (audio format conversion, time formatting)
   - FFmpeg command builders
   - Coverage target: 80%+

2. **Integration Tests** (Jest + React Native Testing Library)
   - Component interactions with audio services
   - State updates triggering UI changes
   - Platform-specific audio service implementations
   - Mock audio APIs (MediaRecorder, expo-av)

3. **E2E Tests** (Detox - Native only, Playwright - Web)
   - Critical user flows:
     - Record → Play → Adjust speed/volume → Save
     - Import → Play → Mix with recording → Export
     - Multi-track playback and mixing
   - Platform-specific: Run on iOS Simulator, Android Emulator, Chrome/Firefox

**Mock Strategy:**

```typescript
// __mocks__/expo-av.ts
export const Audio = {
  Recording: jest.fn().mockImplementation(() => ({
    prepareToRecordAsync: jest.fn(),
    startAsync: jest.fn(),
    stopAndUnloadAsync: jest.fn(),
  })),
};
```

**FFmpeg Testing:**

- Unit test command generation (don't run actual FFmpeg)
- Integration tests with small audio fixtures
- E2E tests verify actual mixed output

**Rationale:**

- Jest: Standard React Native testing, fast, good mocking
- RTL: Best practices for component testing, accessible queries
- Detox: Most mature E2E for React Native
- Playwright: Better web E2E than Selenium/Cypress for RN Web

**Consequences:**

- Significant test setup time (Phase 8)
- Need test fixtures (small audio files)
- E2E tests slower, run on CI only
- Platform-specific test infrastructure

---

### ADR-007: File Format & Audio Codec Standards

**Status:** Accepted

**Context:**
Need consistent audio formats for recording, playback, and export. Current Android app uses THREE_GPP/AMR_NB for recording but saves as .mp3.

**Decision:** Standardize on **MP3 (MPEG-1 Audio Layer 3)** for all audio operations.

**Specifications:**

- **Format:** MP3
- **Sample Rate:** 44.1 kHz (CD quality)
- **Bit Rate:** 128 kbps (good quality/size balance)
- **Channels:** Stereo (2 channels)

**Rationale:**

- Universal browser support (Web Audio API)
- Native support on all platforms
- Good compression (smaller files than WAV)
- FFmpeg handles MP3 encoding/decoding natively
- User familiarity (widely recognized format)

**Platform-Specific Recording:**

- **Web:** MediaRecorder API with `audio/webm` or `audio/mp4`, convert to MP3 via FFmpeg
- **Native:** expo-av with MP3 output directly

**FFmpeg Encoding Parameters:**

```bash
-codec:a libmp3lame -b:a 128k -ar 44100
```

**Consequences:**

- Potential conversion step for web recordings
- Lossy compression (acceptable for looper use case)
- Slightly larger than AMR-NB but better quality
- Need FFmpeg build with libmp3lame support

**Alternative Considered:** AAC

- Rejected: Better quality but less universal support in older browsers

---

### ADR-008: Project Structure & Code Organization

**Status:** Accepted

**Context:**
Need clear, scalable project structure for React Native + Expo project with platform-specific code.

**Decision:** Feature-based structure with platform folders.

**Directory Structure:**

```
Migration/
├── src/
│   ├── components/           # Shared UI components
│   │   ├── TrackControl/
│   │   ├── TrackList/
│   │   └── SaveModal/
│   ├── screens/              # Screen components
│   │   └── MainScreen/
│   ├── services/             # Business logic services
│   │   ├── audio/
│   │   │   ├── AudioService.ts         # Abstract interface
│   │   │   ├── AudioService.web.ts     # Web implementation
│   │   │   ├── AudioService.native.ts  # Native implementation
│   │   │   ├── FFmpegService.ts
│   │   │   ├── FFmpegService.web.ts
│   │   │   └── FFmpegService.native.ts
│   │   └── storage/
│   ├── store/                # Zustand stores
│   │   ├── useTrackStore.ts
│   │   └── useUIStore.ts
│   ├── utils/                # Utility functions
│   │   ├── audioUtils.ts
│   │   └── formatters.ts
│   ├── types/                # TypeScript types
│   │   └── index.ts
│   ├── constants/            # App constants
│   │   └── audio.ts
│   └── theme/                # Theme configuration
│       └── paperTheme.ts
├── assets/                   # Static assets
│   ├── sounds/              # Sample sound effects
│   └── images/
├── __tests__/               # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── app.json                 # Expo configuration
├── App.tsx                  # Root component
├── package.json
└── tsconfig.json
```

**Platform-Specific File Extensions:**

- `.web.ts` - Web-only implementation
- `.native.ts` - iOS/Android implementation
- `.ios.ts` / `.android.ts` - Platform-specific overrides
- `.ts` - Shared across all platforms

**Import Resolution:**

```typescript
// Automatically resolves to correct platform file
import AudioService from "./services/audio/AudioService";
// Loads AudioService.web.ts on web, AudioService.native.ts on native
```

**Rationale:**

- Clear separation of concerns
- Easy to find related code (feature-based)
- Platform-specific code isolated but discoverable
- Scalable as features grow
- Standard React Native/Expo patterns

**Consequences:**

- More files (platform-specific duplicates)
- Need to maintain parallel implementations
- Import resolution requires proper bundler config

---

## Shared Patterns & Conventions

### 1. TypeScript Usage

**Strict Mode Enabled:**

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Type Definitions:**

```typescript
// src/types/index.ts
export interface Track {
  id: string;
  uri: string;
  name: string;
  duration: number;
  speed: number; // 0.05 - 2.50
  volume: number; // 0 - 100
  isPlaying: boolean;
  createdAt: number;
}

export interface AudioServiceInterface {
  record(): Promise<void>;
  stopRecording(): Promise<string>; // Returns URI
  play(uri: string, options: PlaybackOptions): Promise<void>;
  pause(uri: string): Promise<void>;
  setSpeed(uri: string, speed: number): Promise<void>;
  setVolume(uri: string, volume: number): Promise<void>;
}

export interface MixerOptions {
  tracks: Array<{
    uri: string;
    speed: number;
    volume: number;
  }>;
  outputPath: string;
}
```

### 2. Error Handling Pattern

**Consistent Error Boundaries:**

```typescript
// All async operations use try-catch
try {
  await audioService.record();
} catch (error) {
  // Log to error tracking service
  console.error("[AudioService]", error);
  // Show user-friendly message
  Alert.alert("Recording Error", "Could not start recording");
  // Rethrow for store/component handling
  throw error;
}
```

**Error Types:**

```typescript
class AudioError extends Error {
  constructor(
    message: string,
    public code: AudioErrorCode,
    public platform: Platform,
  ) {
    super(message);
  }
}

enum AudioErrorCode {
  PERMISSION_DENIED = "PERMISSION_DENIED",
  RECORDING_FAILED = "RECORDING_FAILED",
  PLAYBACK_FAILED = "PLAYBACK_FAILED",
  MIXING_FAILED = "MIXING_FAILED",
}
```

### 3. Logging & Debugging

**Console Logging Pattern:**

```typescript
const DEBUG = __DEV__;

const log = {
  debug: (tag: string, ...args: any[]) => {
    if (DEBUG) console.log(`[${tag}]`, ...args);
  },
  error: (tag: string, error: Error) => {
    console.error(`[${tag}]`, error);
    // Send to error tracking (Sentry, etc.)
  },
};

// Usage
log.debug("AudioService", "Starting recording", { uri });
```

### 4. Async/Await Standards

**Always use async/await over promises:**

```typescript
// ✅ Good
async function loadTrack(uri: string) {
  const metadata = await fetchMetadata(uri);
  const duration = await getDuration(uri);
  return { metadata, duration };
}

// ❌ Avoid
function loadTrack(uri: string) {
  return fetchMetadata(uri).then((metadata) => {
    return getDuration(uri).then((duration) => {
      return { metadata, duration };
    });
  });
}
```

### 5. Component Composition

**Small, focused components:**

```typescript
// ✅ Good - Single responsibility
const PlayButton = ({ trackId, onPlay }) => (
  <IconButton icon="play" onPress={() => onPlay(trackId)} />
);

const TrackControl = ({ track }) => (
  <View>
    <PlayButton trackId={track.id} onPlay={handlePlay} />
    <PauseButton trackId={track.id} onPause={handlePause} />
    <DeleteButton trackId={track.id} onDelete={handleDelete} />
  </View>
);
```

### 6. Performance Optimization

**Memoization for expensive operations:**

```typescript
import { useMemo, useCallback } from 'react';

const TrackList = ({ tracks }) => {
  // Memoize filtered/sorted lists
  const sortedTracks = useMemo(
    () => tracks.sort((a, b) => a.createdAt - b.createdAt),
    [tracks]
  );

  // Memoize callbacks to prevent re-renders
  const handleDelete = useCallback((id: string) => {
    deleteTrack(id);
  }, []);

  return <FlatList data={sortedTracks} />;
};
```

---

## Common Pitfalls to Avoid

### 1. Platform Detection Anti-Patterns

**❌ Don't check Platform.OS repeatedly:**

```typescript
// Bad
function playAudio() {
  if (Platform.OS === "web") {
    // web logic
  } else {
    // native logic
  }
}
```

**✅ Use platform-specific files:**

```typescript
// AudioService.web.ts
export class AudioService {
  /* web implementation */
}

// AudioService.native.ts
export class AudioService {
  /* native implementation */
}
```

### 2. FFmpeg Command Building

**❌ Don't concatenate strings:**

```typescript
// Bad
const cmd = "-i " + input + " -filter:a atempo=" + speed;
```

**✅ Use array and join:**

```typescript
// Good
const buildCommand = (input: string, speed: number) => {
  const args = [
    "-i",
    input,
    "-filter:a",
    `atempo=${speed}`,
    "-y", // Overwrite output
    output,
  ];
  return args;
};
```

### 3. State Management

**❌ Don't mutate state directly:**

```typescript
// Bad
const addTrack = (track) => {
  state.tracks.push(track); // Mutation!
};
```

**✅ Use immutable updates:**

```typescript
// Good
const addTrack = (track) => {
  set((state) => ({
    tracks: [...state.tracks, track],
  }));
};
```

### 4. Audio Resource Cleanup

**❌ Don't forget to release resources:**

```typescript
// Bad
async function playTrack(uri) {
  const sound = new Audio.Sound();
  await sound.loadAsync({ uri });
  await sound.playAsync();
  // Missing: await sound.unloadAsync();
}
```

**✅ Always cleanup in finally or effect cleanup:**

```typescript
// Good
useEffect(() => {
  let sound: Audio.Sound | null = null;

  const play = async () => {
    sound = new Audio.Sound();
    await sound.loadAsync({ uri });
    await sound.playAsync();
  };

  play();

  return () => {
    sound?.unloadAsync();
  };
}, [uri]);
```

### 5. FFmpeg Processing

**❌ Don't block UI thread:**

```typescript
// Bad
const mixTracks = async () => {
  setLoading(true);
  await ffmpeg.execute(longCommand); // Blocks for minutes!
  setLoading(false);
};
```

**✅ Show progress, use background processing:**

```typescript
// Good
const mixTracks = async () => {
  setProgress(0);
  ffmpeg.setProgressCallback((progress) => {
    setProgress(progress.time / totalDuration);
  });
  await ffmpeg.execute(longCommand);
  setProgress(1);
};
```

---

## Technology Stack Summary

### Core Framework

- **React Native:** 0.72+
- **Expo SDK:** 49+
- **Expo Dev Client:** For custom native modules
- **TypeScript:** 5.x

### UI Framework

- **React Native Paper:** Material Design components
- **React Native Reanimated:** Smooth animations (sliders)
- **React Native Gesture Handler:** Touch interactions

### Audio Libraries

**Web:**

- `@ffmpeg/ffmpeg` - WebAssembly FFmpeg
- `@ffmpeg/core` - FFmpeg core
- Native Web APIs: MediaRecorder, Web Audio API

**Native:**

- `expo-av` - Recording and playback
- `react-native-ffmpeg` or `ffmpeg-kit-react-native` - Audio processing
- `expo-file-system` - File management

### State Management

- **Zustand** - Global state
- **zustand/middleware** - Persistence

### File & Permissions

- `expo-file-system` - File operations
- `expo-document-picker` - Import audio
- `expo-media-library` - Save to device
- `expo-permissions` - Runtime permissions

### Development Tools

- **ESLint** - Linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **Jest** - Unit/integration testing
- **React Native Testing Library** - Component testing
- **Detox** - E2E testing (native)
- **Playwright** - E2E testing (web)

### Build & Deployment

- **EAS Build** - Cloud builds
- **EAS Submit** - App store submission
- **expo-dev-client** - Custom development builds

---

## Success Criteria for Migration

The migration will be considered successful when:

1. **Feature Parity:**
   - ✅ Record audio (matching or better quality than Android AMR-NB)
   - ✅ Import audio files from device
   - ✅ Multiple simultaneous track playback
   - ✅ Independent speed control per track (0.05x - 2.50x)
   - ✅ Independent volume control per track (0-100)
   - ✅ Loop playback for all tracks

2. **New Capabilities:**
   - ✅ **True audio mixing** (export combined tracks)
   - ✅ Mix accounts for speed and volume adjustments
   - ✅ Export mixed audio as MP3

3. **Platform Support:**
   - ✅ Runs on web browsers (Chrome, Firefox, Safari)
   - ✅ Builds for Android (APK/AAB)
   - ✅ Builds for iOS (IPA)

4. **Quality Standards:**
   - ✅ TypeScript strict mode, no type errors
   - ✅ 80%+ test coverage for core logic
   - ✅ All E2E workflows passing
   - ✅ No critical accessibility violations
   - ✅ Performance: <3s cold start, <100ms UI interactions

5. **User Experience:**
   - ✅ Material Design matching Android app aesthetic
   - ✅ Responsive layout (mobile and desktop web)
   - ✅ Proper error handling and user feedback
   - ✅ Persistent state (tracks survive app restart)

---

## Phase Dependencies

```
Phase 0: Foundation (this document)
    ↓
Phase 1: Project Setup & Tooling
    ↓
Phase 2: Core UI Components
    ↓
Phase 3: Audio Abstraction Layer
    ↓
    ├─→ Phase 4: Recording & Import
    └─→ Phase 5: Playback & Controls
          ↓
      Phase 6: FFmpeg Integration & Mixing
          ↓
      Phase 7: State Management & Persistence
          ↓
      Phase 8: Testing & Quality Assurance
          ↓
      Phase 9: Build & Deployment
```

**Parallelization Opportunities:**

- Phases 4 and 5 can be developed in parallel after Phase 3
- Platform-specific implementations within each phase can be parallel
- UI work (Phase 2) can overlap with audio abstraction (Phase 3)

---

## Next Steps

Proceed to **Phase 1: Project Setup & Tooling** to initialize the React Native (Expo) project and configure the development environment.

**Estimated Total Effort:** 9 phases, ~900,000 tokens (900k)
