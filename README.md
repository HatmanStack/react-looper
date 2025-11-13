<div align="center">

# Looper - Audio Mixing App (React Native)

[![](https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![](https://img.shields.io/badge/FFmpeg-00780B?style=for-the-badge&logo=ffmpeg&logoColor=white)](https://ffmpeg.org/)


**Professional multi-track audio mixing for everyone.**

A cross-platform audio mixing application that lets you record, import, and mix audio tracks with independent speed and volume controls.

[Try It](https://looper.hatstack.fun)

---

![Looper App Banner](assets/banner.png)

---

</div>

## ✨ Features

* 🎙️ **Multi-Track Recording** - Record audio directly with your device's microphone.
* 📁 **Audio Import** - Import existing audio files from your device.
* ⚡ **Independent Speed Control** - Adjust playback speed from 0.05x to 2.50x for each track.
* 🔊 **Independent Volume Control** - Control the volume from 0-100 for each track.
* 💾 **High-Quality Export** - Mix and export your creation as a high-quality MP3.
* 🌐 **Cross-Platform** - Runs on Web, Android, and iOS from a single TypeScript codebase.
* 📴 **Works Offline** - All processing, including FFmpeg mixing, happens locally.
* 🎛️ **Configurable Quality** - Customize recording and export quality (low/medium/high) and format (MP3/WAV/M4A).

---

## 🔧 Recent Improvements

### Export Functionality (v1.1.0)
- **Fixed MP3/WAV Export**: Completely rewrote `convertToMP3()` to use official lamejs API
  - Now uses `lamejs.WavHeader.readHeader()` for reliable WAV parsing
  - Switched from `number[]` arrays to `Int16Array.subarray()` for proper audio data handling
  - Eliminated type conversion errors that caused corrupted audio files
  - Added diagnostic logging for troubleshooting export issues

### Recording Settings Integration
- **Wired Up Recording Quality**: Recording format and quality settings now actually affect recordings
  - Format setting controls output file type (MP3/WAV/M4A)
  - Quality setting controls bitrate: High (192kbps), Medium (128kbps), Low (96kbps)
  - Settings are automatically applied when recording starts
  - Uses `getBitrate()` utility to convert quality levels to platform-specific bitrates

### Code Quality
- Fixed 43 ESLint errors (replaced `any` with `unknown`, removed unused variables, converted `require()` to dynamic imports)
- All changes maintain 0 TypeScript/ESLint errors (198 intentional console.log warnings)

---

## 💻 Tech Stack

* **Core:** React Native, Expo, TypeScript
* **State Management:** Zustand
* **UI:** React Native Paper (Material Design 3)
* **Audio Processing:** Web Audio API, lamejs (MP3 encoding)
* **Audio Playback:** `expo-av` (Native), Web Audio API
* **Format Conversion:** lamejs for browser-based MP3 encoding
* **Testing:** Jest & React Native Testing Library

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) v18.x or higher
* [npm](https://www.npmjs.com/) or [Yarn](https://classic.yarnpkg.com/en/docs/install)
* [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/USERNAME/android-looper.git](https://github.com/USERNAME/android-looper.git)
    cd android-looper/Migration
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm start
    ```

4.  **Open the app:**
    * Scan the QR code from the terminal using the **Expo Go** app.
    * Or, press `a` for an Android Emulator / `i` for an iOS Simulator in the terminal.

---

## Available Scripts

```bash
# Start the Expo development server
npm start

# Run on a specific platform
npm run android
npm run ios
npm run web

# Run tests
npm test

# Build for production
npm run build:web
eas build --platform android
eas build --platform ios

##📜 License

This project is licensed under the terms of the MIT License.
