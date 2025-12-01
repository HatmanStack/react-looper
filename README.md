<div align="center">

# Looper

[![](https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**Professional multi-track audio mixing for everyone.**

[Try It](https://looper.hatstack.fun)

<img width="400" src="assets/banner.png" alt="Looper App">

Record, import, and mix audio tracks with independent speed and volume controls. Export your creation as a high-quality MP3.

</div>

## Structure

```
├── src/       # Application source code
├── config/    # Jest, ESLint, Playwright configs
├── docs/      # Documentation
└── assets/    # Images and static files
```

## Prerequisites

- **Node.js** v18+ (v24 LTS recommended)
- **Expo CLI**: `npm install -g expo-cli`

## Quick Start

```bash
npm install     # Install dependencies
npm start       # Start Expo dev server
npm run check   # Run lint, typecheck, and tests
```

## Build

```bash
npm run web              # Development web
npm run build:web        # Production web build
eas build --platform android  # Android APK
eas build --platform ios      # iOS build
```

See [docs/README.md](docs/README.md) for full documentation.

## License

MIT
