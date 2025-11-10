# Audio Services Architecture

This document describes the audio abstraction layer that provides platform-agnostic audio operations for the Looper application.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Components](#components)
- [Platform Strategy](#platform-strategy)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [Future Development](#future-development)

## Overview

The audio services layer provides a unified API for recording, playing, and mixing audio across web and native platforms (iOS, Android). It uses the Factory pattern for platform-specific implementations and abstract base classes for shared logic.

### Key Features

- **Platform Agnostic**: Single API works across web, iOS, and Android
- **Type Safe**: Full TypeScript support with comprehensive interfaces
- **Testable**: Mock implementations for UI development and testing
- **Error Handling**: Structured error handling with user-friendly messages
- **Progress Tracking**: Real-time progress updates for long operations
- **Resource Management**: Automatic cleanup and lifecycle management

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   UI Layer      │  MainScreen, Components
│  (React Native) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AudioService   │  High-level orchestration
│   (Singleton)   │  Multi-track management
└────────┬────────┘
         │
         ├──────────┬──────────┬────────────┐
         ▼          ▼          ▼            ▼
    ┌────────┐ ┌────────┐ ┌────────┐  ┌────────┐
    │Recorder│ │ Player │ │ Mixer  │  │  File  │
    │        │ │(Multi) │ │        │  │ Manager│
    └───┬────┘ └───┬────┘ └───┬────┘  └───┬────┘
        │          │          │            │
        ▼          ▼          ▼            ▼
   ┌──────────────────────────────────────────┐
   │        Platform-Specific Layer           │
   ├──────────────┬───────────────────────────┤
   │  Web Impl    │    Native Impl            │
   │ (WebAssembly)│  (iOS/Android)            │
   └──────────────┴───────────────────────────┘
```

### Class Hierarchy

```
Interfaces (contracts)
├── IAudioRecorder
├── IAudioPlayer
├── IAudioMixer
└── IFileManager

Abstract Base Classes (shared logic)
├── BaseAudioRecorder → IAudioRecorder
├── BaseAudioPlayer → IAudioPlayer
└── BaseAudioMixer → IAudioMixer

Platform Implementations (future)
├── WebAudioRecorder → BaseAudioRecorder
├── NativeAudioRecorder → BaseAudioRecorder
├── WebAudioPlayer → BaseAudioPlayer
├── NativeAudioPlayer → BaseAudioPlayer
├── WebAudioMixer → BaseAudioMixer
├── NativeAudioMixer → BaseAudioMixer
├── WebFileManager → IFileManager
└── NativeFileManager → IFileManager

Mock Implementations (testing)
├── MockAudioRecorder → BaseAudioRecorder
├── MockAudioPlayer → BaseAudioPlayer
├── MockAudioMixer → BaseAudioMixer
└── MockFileManager → IFileManager
```

## Components

### 1. AudioService (Orchestrator)

The main entry point for all audio operations. Manages instances of recorder, players, and mixer.

**Responsibilities:**

- Coordinate multiple audio operations
- Manage player instances (up to 10 concurrent)
- Provide high-level API for UI
- Handle resource lifecycle

**Key Methods:**

```typescript
// Recording
startRecording(options?: RecordingOptions): Promise<void>
stopRecording(): Promise<string>

// Playback
loadTrack(trackId: string, uri: string): Promise<void>
playTrack(trackId: string): Promise<void>
pauseTrack(trackId: string): Promise<void>
setTrackSpeed(trackId: string, speed: number): Promise<void>
setTrackVolume(trackId: string, volume: number): Promise<void>

// Mixing
mixTracks(tracks: MixerTrackInput[], outputPath: string): Promise<string>
```

### 2. IAudioRecorder

Interface for audio recording operations.

**State Management:**

- `isRecording(): boolean` - Check recording state
- `getRecordingDuration(): number` - Get current duration

**Operations:**

- `startRecording()` - Begin recording
- `stopRecording()` - Stop and save recording
- `cancelRecording()` - Cancel without saving
- `getPermissions()` - Check/request microphone permissions

### 3. IAudioPlayer

Interface for audio playback with speed and volume control.

**Capabilities:**

- Load/unload audio files
- Play/pause/stop control
- Speed adjustment (0.05x - 2.50x)
- Volume control (0 - 100)
- Position seeking
- Looping support
- Metadata extraction

**Speed Calculation:**
Matches Android implementation where seekbar value 3-102 maps to speed:

```typescript
speed = seekbarValue / 41;
```

### 4. IAudioMixer

Interface for mixing multiple audio tracks with FFmpeg.

**Features:**

- Mix unlimited tracks (memory permitting)
- Per-track speed and volume adjustment
- Progress reporting (0-100%)
- Cancellation support
- Duration estimation

**Platform Performance:**

- Web (FFmpeg WebAssembly): ~5x slower than native
- Native (FFmpeg with hardware acceleration): Baseline performance

### 5. AudioServiceFactory

Factory for creating platform-specific service instances.

**Pattern:**

```typescript
// Register platform services during app initialization
registerAudioServices('native', {
  recorder: NativeAudioRecorder,
  player: NativeAudioPlayer,
  mixer: NativeAudioMixer,
  fileManager: NativeFileManager,
});

// Get singleton AudioService instance
const audioService = getAudioService();
```

### 6. Error Handling

**AudioError Class:**

- Error codes for categorization
- User-friendly messages
- Platform information
- Recovery hints

**Error Codes:**

```typescript
enum AudioErrorCode {
  PERMISSION_DENIED,
  RECORDING_FAILED,
  PLAYBACK_FAILED,
  MIXING_FAILED,
  FILE_NOT_FOUND,
  INVALID_FORMAT,
  RESOURCE_UNAVAILABLE,
  UNKNOWN_ERROR,
}
```

## Platform Strategy

### Why Platform-Specific Implementations?

1. **Different Audio APIs:**
   - Web: MediaRecorder, Web Audio API, FFmpeg.wasm
   - iOS: AVFoundation, AVAudioEngine
   - Android: MediaRecorder, MediaPlayer, AudioTrack

2. **Performance Characteristics:**
   - Web: Limited to browser capabilities
   - Native: Hardware acceleration, lower latency

3. **File System Access:**
   - Web: Browser storage limitations
   - Native: Full file system access

### Platform Detection

Uses `Platform.select()` from React Native:

```typescript
const platform = Platform.select({
  web: 'web',
  default: 'native', // iOS or Android
});
```

### Configuration

Platform-specific settings in `PlatformAudioConfig.ts`:

```typescript
// Web Configuration
{
  defaultFormat: AudioFormat.MP3,
  sampleRate: 44100,
  maxConcurrentPlayers: 5,
  hardwareAcceleration: false,
  performanceMultiplier: 5.0  // Slower mixing
}

// Native Configuration
{
  defaultFormat: AudioFormat.M4A,
  sampleRate: 44100,
  maxConcurrentPlayers: 10,
  hardwareAcceleration: true,
  performanceMultiplier: 1.0  // Baseline
}
```

## Usage Examples

### Basic Recording and Playback

```typescript
import { getAudioService } from '@services/audio/AudioServiceFactory';
import { registerMockServices } from '@services/audio/mock';

// Initialize (in App.tsx or similar)
if (__DEV__) {
  registerMockServices(); // Use mocks in development
}

const audioService = getAudioService();

// Record audio
await audioService.startRecording();
// ... user records ...
const uri = await audioService.stopRecording();

// Play recorded audio
await audioService.loadTrack('track-1', uri, {
  speed: 1.0,
  volume: 75,
  loop: true,
});

await audioService.playTrack('track-1');
```

### Multi-Track Mixing

```typescript
const tracks = [
  { uri: 'recording1.m4a', speed: 1.0, volume: 75 },
  { uri: 'recording2.m4a', speed: 1.25, volume: 100 },
  { uri: 'recording3.m4a', speed: 0.75, volume: 50 },
];

// Set progress callback
audioService.mixTracks(tracks, 'output.mp3', { format: AudioFormat.MP3 }, (progress) => {
  console.log(`Mixing: ${progress}%`);
});
```

### Error Handling

```typescript
try {
  await audioService.startRecording();
} catch (error) {
  if (error instanceof AudioError) {
    if (error.isPermissionError()) {
      Alert.alert('Permission Required', error.userMessage);
    } else {
      Alert.alert('Recording Error', error.userMessage);
    }
  }
}
```

### Cleanup

```typescript
// On component unmount
useEffect(() => {
  return () => {
    audioService.cleanup();
  };
}, []);
```

## Testing

### Mock Services

Mock implementations simulate audio operations without actual audio processing:

```typescript
import { registerMockServices } from '@services/audio/mock';

// In test setup or development mode
registerMockServices();

// Now audioService uses mocks
const audioService = getAudioService();
```

### Unit Tests

Tests cover:

- Service factory registration and lifecycle
- Mock service interface compliance
- State management (recording, playing, mixing)
- Validation (speed, volume ranges)
- Error handling

Run tests:

```bash
npm test __tests__/unit/services/
```

### Integration Tests

UI integration tests verify:

- Record button starts/stops recording
- Track list updates with new recordings
- Play/pause buttons work correctly
- Sliders update speed and volume
- Error messages show to users

## Future Development

### Phase 4: Recording Implementation

Implement platform-specific recorders:

- `WebAudioRecorder` using MediaRecorder API
- `NativeAudioRecorder` using expo-av

### Phase 5: Playback Implementation

Implement platform-specific players:

- `WebAudioPlayer` using expo-av for web
- `NativeAudioPlayer` using expo-av for native

### Phase 6: Mixing Implementation

Implement platform-specific mixers:

- `WebAudioMixer` using @ffmpeg/ffmpeg (WebAssembly)
- `NativeAudioMixer` using react-native-ffmpeg

### Phase 7: File Management

Implement platform-specific file managers:

- `WebFileManager` using browser storage APIs
- `NativeFileManager` using expo-file-system

### Potential Enhancements

1. **Waveform Visualization**: Add waveform rendering for tracks
2. **Audio Effects**: Apply filters, reverb, echo, etc.
3. **Cloud Storage**: Sync recordings to cloud
4. **Format Conversion**: Convert between audio formats
5. **Compression**: Reduce file sizes
6. **Streaming**: Stream long recordings
7. **Background Recording**: Continue recording when app backgrounded

## API Reference

See individual files for detailed API documentation:

- [IAudioRecorder](./interfaces/IAudioRecorder.ts)
- [IAudioPlayer](./interfaces/IAudioPlayer.ts)
- [IAudioMixer](./interfaces/IAudioMixer.ts)
- [IFileManager](./interfaces/IFileManager.ts)
- [AudioService](./AudioService.ts)
- [AudioError](./AudioError.ts)

## Contributing

When adding new platform implementations:

1. Extend the appropriate base class
2. Implement all abstract methods
3. Register with AudioServiceFactory
4. Add platform-specific tests
5. Update this documentation

## License

See project root LICENSE file.
