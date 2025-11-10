# End-to-End Testing Guide

## Overview

This guide describes the E2E testing strategy for the Looper application across web and native platforms.

## Testing Frameworks

### Web: Playwright

For web testing, we use Playwright which provides cross-browser testing capabilities.

**Installation:**

```bash
npm install -D @playwright/test
npx playwright install
```

**Configuration:** See `playwright.config.ts`

### Native: Detox (Future)

For native iOS and Android testing, Detox is recommended.

**Installation:**

```bash
npm install -D detox jest-circus
```

**Configuration:** See `.detoxrc.js`

## E2E Test Structure

```
e2e/
├── fixtures/           # Test data and fixtures
│   ├── audio/          # Sample audio files for testing
│   └── helpers.ts      # Shared test helpers
├── web/                # Web-specific E2E tests
│   ├── recording.spec.ts
│   ├── import.spec.ts
│   ├── playback.spec.ts
│   └── mixing.spec.ts
└── native/             # Native E2E tests (iOS/Android)
    ├── recording.e2e.ts
    ├── import.e2e.ts
    ├── playback.e2e.ts
    └── mixing.e2e.ts
```

## Critical Test Paths

### 1. Recording Flow

**Steps:**

1. Launch app
2. Grant microphone permissions (if needed)
3. Tap/click Record button
4. Wait 2-3 seconds
5. Tap/click Stop button
6. Verify track appears in list
7. Verify track is playable

**Assertions:**

- Record button changes to Stop
- Track added with correct name
- Track has duration
- Track can be played

### 2. Import Flow

**Steps:**

1. Tap/click Import button
2. Select test audio file from picker
3. Verify track added to list
4. Verify metadata loaded (name, duration)

**Assertions:**

- File picker opens
- Selected file appears in list
- Metadata is correct
- Track is playable

### 3. Playback Flow

**Steps:**

1. Add or create a track
2. Tap/click Play button
3. Verify playing indicator shows
4. Adjust speed slider
5. Adjust volume slider
6. Tap/click Pause button
7. Verify paused state

**Assertions:**

- Play button changes to Pause
- Playing indicator visible
- Speed/volume changes reflected
- Audio pauses correctly

### 4. Mixing Flow

**Steps:**

1. Add 2+ tracks to list
2. Tap/click Mix/Save button
3. Enter output filename
4. Tap/click Save/Export
5. Wait for mixing progress
6. Verify success message

**Assertions:**

- Mix button enabled with 2+ tracks
- Progress indicator shows
- Progress updates (0% to 100%)
- Success message displays
- Output file created

## Platform-Specific Considerations

### Web

**Browser Testing:**

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

**Permissions:**

- Mock navigator.mediaDevices.getUserMedia
- Handle permission prompts automatically

**File System:**

- Use blob URLs for audio
- Test File API interactions
- Verify download links

### iOS

**Permissions:**

- Microphone permission flow
- Media library access
- Notification handling

**Device Testing:**

- iPhone 12+ (various screen sizes)
- iPad (tablet layout)
- iOS 15+ versions

### Android

**Permissions:**

- Runtime permissions (microphone, storage)
- Permission denial handling
- Settings navigation

**Device Testing:**

- Various manufacturers (Pixel, Samsung)
- Different Android versions (11+)
- Different screen sizes/densities

## Test Fixtures

### Sample Audio Files

Located in `e2e/fixtures/audio/`:

- `test-short.mp3` - 5 second test file
- `test-medium.wav` - 30 second test file
- `test-long.m4a` - 2 minute test file

### Mock Data

```typescript
// e2e/fixtures/helpers.ts

export const mockTrack = {
  id: 'test-track-1',
  name: 'Test Track',
  uri: 'file://test-audio.mp3',
  duration: 5000,
  speed: 1.0,
  volume: 75,
  isPlaying: false,
  createdAt: Date.now(),
};

export const mockTracks = [mockTrack, { ...mockTrack, id: 'test-track-2', name: 'Test Track 2' }];
```

## Running E2E Tests

### Web Tests

```bash
# Run all web E2E tests
npm run test:e2e:web

# Run specific test file
npx playwright test e2e/web/recording.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

### Native Tests

```bash
# Build app for testing (iOS)
detox build --configuration ios.sim.debug

# Run tests (iOS)
detox test --configuration ios.sim.debug

# Build app for testing (Android)
detox build --configuration android.emu.debug

# Run tests (Android)
detox test --configuration android.emu.debug
```

## CI Integration

E2E tests should run in CI on:

- Pull requests to main branch
- Nightly builds
- Release candidates

**GitHub Actions Example:**

```yaml
name: E2E Tests

on:
  pull_request:
  push:
    branches: [main]

jobs:
  e2e-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e:web
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-screenshots
          path: test-results/
```

## Best Practices

1. **Test Independence:** Each test should be independent and not rely on other tests
2. **Cleanup:** Always clean up created data after tests
3. **Wait Strategies:** Use explicit waits, not fixed timeouts
4. **Selectors:** Use testID attributes, not implementation details
5. **Screenshots:** Capture screenshots on failure for debugging
6. **Parallel Execution:** Run tests in parallel when possible
7. **Retry Logic:** Implement retry for flaky tests (max 2 retries)

## Troubleshooting

### Flaky Tests

If tests are flaky:

- Add explicit waits for async operations
- Check for race conditions
- Increase timeouts for slow operations
- Use more specific selectors

### Permission Issues

- Ensure test devices/browsers have proper permissions
- Mock permission dialogs where possible
- Document manual setup steps

### Performance

- Use smaller test fixtures
- Run tests in parallel
- Clean up after each test
- Optimize asset loading

## Future Enhancements

1. **Visual Regression Testing:** Add screenshot comparison
2. **Accessibility Testing:** Integrate axe-core or similar
3. **Performance Testing:** Add Lighthouse integration
4. **Cross-Browser Cloud Testing:** Use BrowserStack or similar
5. **Device Farm:** Test on real devices via AWS Device Farm

## References

- [Playwright Documentation](https://playwright.dev/)
- [Detox Documentation](https://wix.github.io/Detox/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [E2E Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
