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

<img width="400" src="frontend/assets/banner.png" alt="Looper App">

</div>

## Structure

```text
├── frontend/   # Expo/React Native client
└── docs/       # Documentation
```

## Prerequisites

- **Node.js** v18+ (v24 LTS recommended)
- **npm** or **yarn**

## Quick Start

```bash
npm install     # Install dependencies
npm start       # Start Expo dev server
npm run check   # Run lint, typecheck, and tests
```

## Features

- Multi-track audio recording with device microphone
- Audio file import from device storage
- Independent speed control (0.05x - 2.50x) per track
- Independent volume control (0-100) per track
- Master loop synchronization
- High-quality MP3/WAV export with loop count and fadeout
- Cross-platform: Web, Android, iOS
- Offline support - all processing happens locally

## Available Scripts

```bash
npm start           # Start Expo dev server
npm run android     # Run on Android
npm run ios         # Run on iOS
npm run web         # Run on Web

npm test            # Run tests
npm run lint        # Run ESLint
npm run typecheck   # Run TypeScript check
npm run check       # Run all checks (lint + typecheck + test)
```

See [docs/README.md](docs/README.md) for full documentation.

## License

MIT
</div>
