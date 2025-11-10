# Looper - Audio Mixing App

![CI](https://github.com/USERNAME/android-looper/workflows/CI/badge.svg)
![Deploy](https://github.com/USERNAME/android-looper/workflows/Deploy%20Web/badge.svg)

**Professional multi-track audio mixing for everyone.**

Looper is a powerful cross-platform audio mixing application that lets you record, import, and mix audio tracks with independent speed and volume controls. Built with React Native and Expo, it runs on Web, Android, and iOS.

## ✨ Features

- 🎙️ **Multi-Track Recording** - Record audio directly with your device's microphone
- 📁 **Audio Import** - Import audio files from your device
- ▶️ **Simultaneous Playback** - Play up to 20 tracks at the same time
- ⚡ **Independent Speed Control** - Adjust playback speed from 0.05x to 2.50x per track
- 🔊 **Independent Volume Control** - Control volume from 0-100 per track
- 🔄 **Continuous Looping** - All tracks loop automatically
- 🎵 **True Audio Mixing** - Professional FFmpeg-powered audio mixing
- 💾 **High-Quality Export** - Export mixed audio as MP3 (44.1kHz, 128kbps)
- 🎨 **Beautiful UI** - Modern Material Design interface with dark mode
- 🌐 **Cross-Platform** - Web, Android, and iOS from a single codebase
- 📴 **Works Offline** - All processing happens locally on your device

## 🚀 Quick Start

### Try the Web App

Visit [looper.app](https://looper.app) (replace with actual URL)

No installation required - works in any modern browser!

### Install on Mobile

**Android:**
- [Download from Google Play](https://play.google.com/store/apps/details?id=com.looper.app)
- Or download APK from [Releases](https://github.com/USERNAME/android-looper/releases)

**iOS:**
- [Download from App Store](https://apps.apple.com/app/looper/id000000000)
- Or install via TestFlight (beta)

## 📖 Documentation

- [User Guide](./docs/USER_GUIDE.md) - How to use Looper
- [Developer Guide](./docs/DEVELOPER_GUIDE.md) - Contributing and development
- [Build & Deploy](./docs/BUILD_AND_DEPLOY.md) - Building and deploying the app
- [Architecture](./docs/plans/Phase-0.md) - Technical architecture and decisions
- [Testing](./docs/testing/README.md) - Testing strategy and guides
- [Changelog](./CHANGELOG.md) - Version history

## 🛠️ Development

### Prerequisites

- Node.js 18+ and npm
- Git
- Expo CLI: `npm install -g expo-cli`

### Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/USERNAME/android-looper.git
   cd android-looper/Migration
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start development server:**

   ```bash
   npm start
   ```

4. **Run on different platforms:**

   ```bash
   npm run web      # Web browser
   npm run android  # Android emulator/device
   npm run ios      # iOS simulator/device
   ```

### Testing

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### Building

```bash
# Web
npm run build:web

# Mobile (requires EAS CLI)
eas build --platform android
eas build --platform ios
```

See [Build & Deploy Guide](./docs/BUILD_AND_DEPLOY.md) for detailed instructions.

## 🏗️ Tech Stack

### Core

- **React Native** - Cross-platform mobile framework
- **Expo** - Development and build platform
- **TypeScript** - Type-safe JavaScript
- **Zustand** - State management
- **React Native Paper** - Material Design components

### Audio Processing

- **FFmpeg** - Professional audio mixing
  - Web: `@ffmpeg/ffmpeg` (WebAssembly)
  - Native: `ffmpeg-kit-react-native`
- **expo-av** - Native audio recording and playback (iOS/Android)
- **Web Audio API** - Browser audio (Web)

### Testing

- **Jest** - Unit and integration testing
- **React Native Testing Library** - Component testing
- **Playwright** - E2E testing (web)
- **Detox** - E2E testing (native)

### CI/CD

- **GitHub Actions** - Automated testing and deployment
- **EAS Build** - Cloud builds for iOS and Android
- **Vercel/Netlify** - Web hosting and deployment

## 📂 Project Structure

```
Migration/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # Screen components
│   ├── services/        # Business logic (audio, storage)
│   ├── store/           # Zustand state management
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   ├── constants/       # App constants
│   └── theme/           # Theme configuration
├── assets/              # Images, sounds, icons
├── __tests__/           # Test files
├── e2e/                 # End-to-end tests
├── docs/                # Documentation
├── app.config.ts        # Expo configuration
├── eas.json             # EAS Build configuration
└── package.json         # Dependencies and scripts
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'feat: add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

See [Developer Guide](./docs/DEVELOPER_GUIDE.md) for detailed contribution guidelines.

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test changes
- `chore:` - Build/tooling changes
- `refactor:` - Code refactoring
- `style:` - Code style changes
- `perf:` - Performance improvements

## 📋 Roadmap

### Version 1.1 (Planned)

- [ ] Waveform visualization
- [ ] Real-time mixing preview
- [ ] Additional export formats (WAV, AAC)
- [ ] Trim and edit audio clips
- [ ] Audio effects (reverb, EQ, compression)

### Version 1.2 (Future)

- [ ] MIDI support
- [ ] Cloud backup and sync
- [ ] Collaboration features
- [ ] Custom themes
- [ ] Playlist management

See [Issues](https://github.com/USERNAME/android-looper/issues) for current feature requests and bugs.

## 🐛 Bug Reports

Found a bug? Please [open an issue](https://github.com/USERNAME/android-looper/issues/new) with:

- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Platform (Web/Android/iOS) and version
- Screenshots or screen recordings (if applicable)

## 💬 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/USERNAME/android-looper/issues)
- **Email**: support@looper.app
- **Website**: [looper.app](https://looper.app)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- Original Android app by [Original Author]
- FFmpeg team for audio processing capabilities
- Expo team for excellent development tools
- React Native community for ecosystem and support
- All contributors and users of Looper

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/USERNAME/android-looper?style=social)
![GitHub forks](https://img.shields.io/github/forks/USERNAME/android-looper?style=social)
![GitHub issues](https://img.shields.io/github/issues/USERNAME/android-looper)
![GitHub pull requests](https://img.shields.io/github/issues-pr/USERNAME/android-looper)

---

**Made with ❤️ by the Looper team**

[Website](https://looper.app) • [Documentation](./docs/) • [Report Bug](https://github.com/USERNAME/android-looper/issues) • [Request Feature](https://github.com/USERNAME/android-looper/issues)
