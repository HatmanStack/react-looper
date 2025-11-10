# Developer Guide

Welcome to the Looper development guide! This document covers everything you need to know to contribute to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Structure](#code-structure)
- [Testing](#testing)
- [Building](#building)
- [Contributing Guidelines](#contributing-guidelines)
- [Code Style](#code-style)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

**Required:**
- Node.js 18+ and npm
- Git
- Code editor (VS Code recommended)

**Platform-Specific:**
- **Android Development**: Android Studio, Android SDK, Java 11+
- **iOS Development**: macOS, Xcode 14+, CocoaPods
- **Web Development**: Modern browser (Chrome/Firefox/Safari)

### Initial Setup

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

   This opens Expo Dev Tools in your browser.

4. **Run on a platform:**

   ```bash
   npm run web      # Web browser
   npm run android  # Android (emulator or device)
   npm run ios      # iOS (simulator or device - macOS only)
   ```

### VS Code Setup

**Recommended Extensions:**
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- React Native Tools
- Jest
- GitLens

**Settings:**

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "jest.autoRun": "off"
}
```

---

## Development Workflow

### Branch Strategy

We use Git Flow:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Creating a Feature

1. **Create feature branch:**

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/amazing-feature
   ```

2. **Make changes:**
   - Write code
   - Add tests
   - Update documentation

3. **Test changes:**

   ```bash
   npm test
   npm run lint
   npm run format:check
   ```

4. **Commit changes:**

   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/).

5. **Push and create PR:**

   ```bash
   git push origin feature/amazing-feature
   ```

   Open Pull Request on GitHub targeting `develop`.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

**Examples:**

```
feat(audio): add speed control to playback

Implement independent speed control for each track using
playback rate adjustment. Speed range is 0.05x to 2.50x.

Closes #123
```

```
fix(recording): resolve microphone permission issue on Android

Permission was not being requested correctly on Android 13+.
Updated permission handling to use new runtime permissions API.

Fixes #456
```

---

## Code Structure

### Directory Overview

```
Migration/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ActionButton/
│   │   ├── TrackList/
│   │   └── ...
│   ├── screens/          # Screen components
│   │   └── MainScreen/
│   ├── services/         # Business logic
│   │   ├── audio/        # Audio recording, playback, mixing
│   │   ├── ffmpeg/       # FFmpeg integration
│   │   └── storage/      # File storage
│   ├── store/            # Zustand state management
│   │   ├── useTrackStore.ts
│   │   └── useUIStore.ts
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript types
│   ├── constants/        # Constants
│   └── theme/            # Theme configuration
├── __tests__/            # Tests
│   ├── unit/
│   ├── integration/
│   └── accessibility/
├── e2e/                  # End-to-end tests
├── assets/               # Static assets
└── docs/                 # Documentation
```

### Key Patterns

**Platform-Specific Code:**

Use file extensions for platform-specific implementations:

```
AudioService.ts           # Shared types/interfaces
AudioService.web.ts       # Web implementation
AudioService.native.ts    # iOS/Android implementation
AudioService.ios.ts       # iOS-only (if needed)
AudioService.android.ts   # Android-only (if needed)
```

Import without extension - bundler selects correct file:

```typescript
import AudioService from './services/audio/AudioService';
// Automatically loads AudioService.web.ts on web,
// AudioService.native.ts on native platforms
```

**State Management:**

We use Zustand for state:

```typescript
// Create store
const useTrackStore = create<TrackStore>((set, get) => ({
  tracks: [],
  addTrack: (track) => set((state) => ({
    tracks: [...state.tracks, track]
  })),
  removeTrack: (id) => set((state) => ({
    tracks: state.tracks.filter(t => t.id !== id)
  })),
}));

// Use in components
const tracks = useTrackStore((state) => state.tracks);
const addTrack = useTrackStore((state) => state.addTrack);
```

**Error Handling:**

Always use try-catch for async operations:

```typescript
try {
  await audioService.record();
} catch (error) {
  console.error('[Recording]', error);
  // Show user-friendly error
  Alert.alert('Error', 'Failed to start recording');
}
```

---

## Testing

### Running Tests

```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

### Test Organization

- `__tests__/unit/` - Unit tests for functions, services
- `__tests__/integration/` - Integration tests for flows
- `__tests__/accessibility/` - Accessibility compliance
- `__tests__/performance/` - Performance benchmarks
- `e2e/` - End-to-end tests

### Writing Tests

**Unit Test Example:**

```typescript
// __tests__/unit/utils/formatTime.test.ts
import { formatTime } from '@utils/formatTime';

describe('formatTime', () => {
  it('should format milliseconds as mm:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(1000)).toBe('0:01');
    expect(formatTime(60000)).toBe('1:00');
    expect(formatTime(90500)).toBe('1:30');
  });
});
```

**Component Test Example:**

```typescript
// __tests__/unit/components/ActionButton.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { ActionButton } from '@components/ActionButton/ActionButton';

describe('ActionButton', () => {
  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <ActionButton label="Test" onPress={onPress} />
    );

    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Tests

**Playwright (Web):**

```typescript
// e2e/web/recording.spec.ts
import { test, expect } from '@playwright/test';

test('should record audio', async ({ page }) => {
  await page.goto('http://localhost:8081');
  await page.getByRole('button', { name: /record/i }).click();
  await page.getByText(/recording/i).waitFor();
  // ...
});
```

Run with: `npx playwright test`

**Detox (Native):**

```typescript
// e2e/native/recording.e2e.ts
describe('Recording', () => {
  it('should record audio', async () => {
    await element(by.text('Record')).tap();
    await expect(element(by.text('Recording...'))).toBeVisible();
    // ...
  });
});
```

Run with: `detox test`

---

## Building

### Web

```bash
# Development
npm run web

# Production build
npm run build:web

# Test production build locally
npm run serve:web
```

Output: `web-build/` directory

### Mobile (EAS Build)

**Prerequisites:**
- EAS CLI: `npm install -g eas-cli`
- Expo account: `eas login`

**Configure:**

```bash
eas build:configure
```

**Build:**

```bash
# Android APK
eas build --platform android --profile production-apk

# Android AAB (for Play Store)
eas build --platform android --profile production

# iOS IPA
eas build --platform ios --profile production
```

**Monitor:**

```bash
eas build:list
eas build:view BUILD_ID
```

See [Build & Deploy Guide](./BUILD_AND_DEPLOY.md) for details.

---

## Contributing Guidelines

### Code Review

All PRs require:
- ✅ Passing tests
- ✅ Passing linter
- ✅ Passing TypeScript checks
- ✅ Code review approval
- ✅ Up-to-date with target branch

### Pull Request Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex logic
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Tests pass locally
```

### Review Process

1. **Automated Checks**: CI runs tests, lint, type-check
2. **Code Review**: Reviewer checks code quality, logic, tests
3. **Feedback**: Address comments, make changes
4. **Approval**: Reviewer approves PR
5. **Merge**: Maintainer merges to target branch

---

## Code Style

### TypeScript

**Strict mode enabled:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Type everything:**

```typescript
// ✅ Good
interface Track {
  id: string;
  name: string;
  uri: string;
  duration: number;
}

function formatDuration(ms: number): string {
  // ...
}

// ❌ Bad
function formatDuration(ms) {  // No type
  // ...
}
```

### Formatting

We use Prettier:

```bash
npm run format        # Format all files
npm run format:check  # Check formatting
```

**Key rules:**
- 2 spaces indentation
- Single quotes for strings
- Trailing commas
- 100 character line length

### Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `ActionButton.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatTime.ts`)
- Types: `PascalCase.ts` (e.g., `Track.ts`)
- Tests: `*.test.ts` or `*.spec.ts`

**Variables/Functions:**
- `camelCase` for variables and functions
- `PascalCase` for components and classes
- `UPPER_SNAKE_CASE` for constants

**Examples:**

```typescript
// Constants
export const MAX_TRACKS = 20;

// Functions
function calculateDuration(start: number, end: number): number {
  return end - start;
}

// Components
export const ActionButton: React.FC<ActionButtonProps> = ({ label, onPress }) => {
  return <Button onPress={onPress}>{label}</Button>;
};
```

### Comments

**JSDoc for public APIs:**

```typescript
/**
 * Formats milliseconds as mm:ss
 * @param ms - Time in milliseconds
 * @returns Formatted time string
 * @example
 * formatTime(90000) // "1:30"
 */
export function formatTime(ms: number): string {
  // ...
}
```

**Inline for complex logic:**

```typescript
// Calculate remaining time based on current progress
const remaining = (elapsed / progress) - elapsed;
```

---

## Common Tasks

### Adding a New Component

1. **Create component directory:**

   ```bash
   mkdir -p src/components/NewComponent
   ```

2. **Create files:**

   ```
   src/components/NewComponent/
   ├── NewComponent.tsx       # Component
   ├── NewComponent.test.tsx  # Tests
   ├── NewComponent.styles.ts # Styles (if complex)
   └── index.ts               # Export
   ```

3. **Implement component:**

   ```typescript
   // NewComponent.tsx
   import React from 'react';
   import { View, StyleSheet } from 'react-native';

   export interface NewComponentProps {
     // Props
   }

   export const NewComponent: React.FC<NewComponentProps> = (props) => {
     return <View style={styles.container}>{/* ... */}</View>;
   };

   const styles = StyleSheet.create({
     container: {
       // ...
     },
   });
   ```

4. **Write tests:**

   ```typescript
   // NewComponent.test.tsx
   import { render } from '@testing-library/react-native';
   import { NewComponent } from './NewComponent';

   describe('NewComponent', () => {
     it('should render', () => {
       const { getByTestId } = render(<NewComponent />);
       expect(getByTestId('new-component')).toBeDefined();
     });
   });
   ```

5. **Export:**

   ```typescript
   // index.ts
   export { NewComponent } from './NewComponent';
   export type { NewComponentProps } from './NewComponent';
   ```

### Adding a New Service

1. **Create service files:**

   ```
   src/services/myService/
   ├── MyService.ts           # Interface
   ├── MyService.web.ts       # Web implementation
   ├── MyService.native.ts    # Native implementation
   ├── MyService.test.ts      # Tests
   └── index.ts               # Export
   ```

2. **Define interface:**

   ```typescript
   // MyService.ts
   export interface MyService {
     doSomething(): Promise<void>;
   }
   ```

3. **Implement for each platform:**

   ```typescript
   // MyService.web.ts
   import { MyService } from './MyService';

   class WebMyService implements MyService {
     async doSomething(): Promise<void> {
       // Web implementation
     }
   }

   export default new WebMyService();
   ```

4. **Write tests:**

   ```typescript
   // MyService.test.ts
   import MyService from './MyService';

   describe('MyService', () => {
     it('should do something', async () => {
       await expect(MyService.doSomething()).resolves.not.toThrow();
     });
   });
   ```

### Adding a New Store

1. **Create store file:**

   ```typescript
   // src/store/useMyStore.ts
   import { create } from 'zustand';

   interface MyStore {
     value: number;
     increment: () => void;
     decrement: () => void;
   }

   export const useMyStore = create<MyStore>((set) => ({
     value: 0,
     increment: () => set((state) => ({ value: state.value + 1 })),
     decrement: () => set((state) => ({ value: state.value - 1 })),
   }));
   ```

2. **Use in components:**

   ```typescript
   import { useMyStore } from '@store/useMyStore';

   const MyComponent = () => {
     const value = useMyStore((state) => state.value);
     const increment = useMyStore((state) => state.increment);

     return <Button onPress={increment}>Count: {value}</Button>;
   };
   ```

---

## Troubleshooting

### Metro Bundler Issues

**Issue**: "Module not found" or stale cache

**Solution**:

```bash
# Clear Metro cache
npx react-native start --reset-cache

# Or
rm -rf node_modules
npm install
```

### TypeScript Errors

**Issue**: Type errors after updating dependencies

**Solution**:

```bash
# Regenerate TypeScript cache
rm -rf node_modules/.cache
npm run type-check
```

### Test Failures

**Issue**: Tests fail locally but pass in CI

**Solution**:

```bash
# Clear Jest cache
npm test -- --clearCache

# Run with fresh environment
npm run test:coverage
```

### iOS Build Issues

**Issue**: CocoaPods errors

**Solution**:

```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Android Build Issues

**Issue**: Gradle build fails

**Solution**:

```bash
cd android
./gradlew clean
cd ..
```

---

## Resources

- **React Native Docs**: https://reactnative.dev/docs/getting-started
- **Expo Docs**: https://docs.expo.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **React Native Paper**: https://callstack.github.io/react-native-paper/
- **Zustand**: https://github.com/pmndrs/zustand
- **FFmpeg**: https://ffmpeg.org/documentation.html
- **Testing Library**: https://testing-library.com/docs/react-native-testing-library/intro/

---

## Getting Help

- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions in GitHub Discussions
- **Email**: dev@looper.app
- **Documentation**: Check [docs/](../docs/)

---

**Happy coding! 🚀**
