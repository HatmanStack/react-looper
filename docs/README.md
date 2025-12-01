<div align="center">

# Looper - Audio Mixing App

[![](https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![](https://img.shields.io/badge/FFmpeg-00780B?style=for-the-badge&logo=ffmpeg&logoColor=white)](https://ffmpeg.org/)

**Professional multi-track audio mixing for everyone.**

A cross-platform audio mixing application that lets you record, import, and mix audio tracks with independent speed and volume controls.

[Try It](https://looper.hatstack.fun)

---

![Looper App Banner](../assets/banner.png)

---

</div>

## Features

* 🎙️ **Multi-Track Recording** - Record audio directly with your device's microphone.
* 📁 **Audio Import** - Import existing audio files from your device.
* ⚡ **Independent Speed Control** - Adjust playback speed from 0.05x to 2.50x for each track.
* 🔊 **Independent Volume Control** - Control the volume from 0-100 for each track.
* 💾 **High-Quality Export** - Mix and export your creation as a high-quality MP3.
* 🌐 **Cross-Platform** - Runs on Web, Android, and iOS from a single TypeScript codebase.
* 📴 **Works Offline** - All processing, including FFmpeg mixing, happens locally.
* 🎛️ **Configurable Quality** - Customize recording and export quality (low/medium/high) and format (MP3/WAV/M4A).

## Technologies Used

- **Expo**: Universal React Native framework
- **React Native Paper**: Material Design 3 UI components
- **Zustand**: Lightweight state management
- **Web Audio API**: Browser-based audio processing
- **lamejs**: MP3 encoding in the browser
- **expo-av**: Native audio playback and recording
- **Jest**: Testing framework

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
   - Scan the QR code from the terminal using the **Expo Go** app.
   - Or, press `a` for Android Emulator / `i` for iOS Simulator.
   - Or, press `w` for web browser.

## Usage

### Recording Audio

1. Tap the **Record** button to start recording.
2. Tap **Stop** when finished.
3. Your recording appears as a new track.

### Importing Audio

1. Tap the **Import** button.
2. Select an audio file from your device.
3. The imported file appears as a new track.

### Mixing Tracks

1. Add multiple tracks via recording or importing.
2. Adjust **speed** (0.05x - 2.50x) and **volume** (0-100) for each track.
3. Use the playback controls to preview.
4. Tap **Save** to export your mix as MP3.

### Export Settings

Configure export options in the Save modal:
- **Loop Count**: Number of times to repeat the mix (1-10, or custom)
- **Fadeout Duration**: Gradual volume decrease at the end (0-10 seconds)

## Architecture

```
src/
├── components/     # UI components (TrackItem, SaveModal, etc.)
├── screens/        # Screen components (MainScreen, SettingsScreen)
├── services/       # Audio services (player, recorder, mixer)
├── store/          # Zustand state management
├── utils/          # Utilities (logger, permissions, audio helpers)
└── types/          # TypeScript type definitions
```

**Audio Pipeline**:
- Web: Web Audio API → lamejs MP3 encoding
- Native: expo-av → ffmpeg-kit for mixing

## Testing

```bash
npm run check        # Run lint, typecheck, and tests
npm test             # Run Jest tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
npm run lint         # ESLint
npm run typecheck    # TypeScript check
```

## Recent Improvements

### Export Functionality (v1.1.0)
- **Fixed MP3/WAV Export**: Rewrote `convertToMP3()` using official lamejs API
- Proper WAV parsing with `lamejs.WavHeader.readHeader()`
- `Int16Array.subarray()` for correct audio data handling

### Recording Settings Integration
- Recording format and quality settings now apply to recordings
- Quality levels: High (192kbps), Medium (128kbps), Low (96kbps)

See [CHANGELOG.md](CHANGELOG.md) for full version history.

## License

This project is licensed under the MIT License.
