<div align="center">

# Looper

<h4>
<a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React%20Native-0.81-blue" alt="React Native" /></a>
<a href="https://expo.dev/"><img src="https://img.shields.io/badge/Expo-54-orange" alt="Expo" /></a>
<a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-blue" alt="TypeScript" /></a>
<a href="https://ffmpeg.org/"><img src="https://img.shields.io/badge/FFmpeg-green" alt="FFmpeg" /></a>
</h4>

**Professional multi-track audio mixing for everyone.**

A cross-platform audio mixing app that lets you record, import, and mix audio tracks with independent speed and volume controls.

[Try It](https://looper.hatstack.fun)

<img width="400" src="../frontend/assets/banner.png" alt="Looper App">

</div>

## Features

- **Multi-Track Recording**: Record audio directly with your device microphone
- **Audio Import**: Import existing audio files from your device
- **Master Loop Sync**: First track sets the loop length, subsequent tracks loop to match
- **Independent Speed Control**: Adjust playback speed (0.05x - 2.50x) per track
- **Independent Volume Control**: Control volume (0-100) per track
- **Loop Export**: Export with configurable loop count and fadeout
- **High-Quality Export**: MP3, WAV, or M4A output
- **Cross-Platform**: Web, Android, and iOS from a single codebase
- **Works Offline**: All processing happens locally

## Technologies

- **Core**: React Native, Expo SDK 54, TypeScript
- **State**: Zustand
- **UI**: React Native Paper (Material Design 3)
- **Audio**: Web Audio API, expo-av, lamejs (MP3 encoding)
- **Mixing**: FFmpeg.wasm (web), FFmpeg Kit (native)
- **Testing**: Jest, React Native Testing Library

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/HatmanStack/react-looper.git
   cd react-looper
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Open the app**:
   - Scan QR code with Expo Go app
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Press `w` for web browser

## Usage

### Recording Your First Loop

1. Click the **Record** button (microphone icon)
2. Perform your loop - drums, vocals, melody
3. Click **Stop** when finished
4. This becomes your **master loop** - it sets the loop length for all other tracks

### Adding Overdubs

1. Click **Record** again
2. Recording auto-stops at the end of one loop cycle
3. New track loops automatically to match master loop
4. Shorter tracks repeat, longer tracks are trimmed

### Adjusting Tracks

- **Speed**: 0.05x (very slow) to 2.50x (double speed)
- **Volume**: 0 (silent) to 100 (full)
- **Warning**: Changing master track speed affects all tracks

### Exporting

1. Click the **Save** button
2. Configure options:
   - **Loop Count**: 1, 2, 4, 8, or custom
   - **Fadeout**: None, 1s, 2s, 5s, or custom
   - **Format**: MP3 or WAV
   - **Quality**: Low, Medium, or High
3. Click **Confirm** and wait for processing

## Architecture

```text
frontend/
├── app/                    # Expo Router screens
├── src/
│   ├── components/         # Reusable UI components
│   ├── screens/            # Screen components
│   ├── services/           # Audio services (platform-specific)
│   │   ├── audio/          # Recording, playback, mixing
│   │   ├── ffmpeg/         # FFmpeg integration
│   │   └── loop/           # Loop engine
│   ├── store/              # Zustand stores
│   ├── utils/              # Utilities
│   └── types/              # TypeScript types
└── __tests__/              # Test suites
```

### Audio Services

- **Web**: Web Audio API + FFmpeg.wasm
- **Native**: expo-av + FFmpeg Kit
- Factory pattern provides platform-appropriate implementations

### State Management

- `useTrackStore`: Track list, master loop, CRUD operations
- `usePlaybackStore`: Playback state, loop mode
- `useSettingsStore`: User preferences, export defaults
- `useUIStore`: Modal visibility, UI state

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
npm run check         # Lint + typecheck + tests
```

**Test Coverage**:
- 525+ tests passing
- Unit tests for services, stores, utilities
- Component tests with React Native Testing Library

## Building

### Web

```bash
npm run build:web
```

### Mobile (EAS Build)

```bash
npm run --prefix frontend eas:build:prod
```

## Troubleshooting

### No sound when recording
- Check microphone permissions
- Ensure mic volume is up in system settings

### Clicks at loop boundaries
- Increase Loop Crossfade Duration in settings (10-20ms)

### Export takes a long time
- Web mixing is slower than native
- Reduce loop count or track count for faster exports

## License

Apache 2.0 - See [LICENSE](../LICENSE) for details.
