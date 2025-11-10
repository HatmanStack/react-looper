# Cross-Platform Testing Guide

## Overview

The Looper application runs on three platforms: **Web**, **iOS**, and **Android**. This guide ensures consistent functionality and user experience across all platforms.

## Platform Matrix

### Target Platforms

| Platform    | Minimum Version                     | Target Version         | Notes                                 |
| ----------- | ----------------------------------- | ---------------------- | ------------------------------------- |
| **Web**     | Chrome 90+, Firefox 88+, Safari 14+ | Latest stable browsers | Requires Web Audio API, MediaRecorder |
| **iOS**     | iOS 13.0+                           | iOS 17.0+              | Requires AVFoundation framework       |
| **Android** | Android 7.0 (API 24)+               | Android 14 (API 34)+   | Requires MediaRecorder, AudioTrack    |

### Device Categories

#### Web

- Desktop (1920x1080+)
- Tablet (768x1024)
- Mobile (375x667+)

#### iOS

- iPhone SE (small screen)
- iPhone 14/15 (standard)
- iPhone 14/15 Pro Max (large screen)
- iPad (tablet form factor)

#### Android

- Small phone (< 5.5")
- Standard phone (5.5" - 6.5")
- Large phone (> 6.5")
- Tablet (7"+ )

## Platform-Specific Features

### Web

**Unique Features:**

- Browser audio context
- MediaRecorder API
- File download via blob URLs
- FFmpeg.wasm for audio mixing

**Limitations:**

- Audio latency higher than native
- File system access limited
- Background playback restricted
- No native file picker (uses HTML input)

**Testing Focus:**

- Browser compatibility (Chrome, Firefox, Safari)
- Audio context initialization
- MediaRecorder permissions
- FFmpeg loading and mixing
- File download functionality

### iOS

**Unique Features:**

- AVFoundation audio
- Native file picker
- Background audio playback
- AirPlay support
- FFmpeg Kit for native mixing

**Limitations:**

- App Store restrictions
- Sandbox file access
- Background limits (unless using background modes)

**Testing Focus:**

- Permissions (microphone, media library)
- Background audio behavior
- App lifecycle (foreground/background)
- VoiceOver accessibility
- Different screen sizes (iPhone, iPad)

### Android

**Unique Features:**

- MediaRecorder for recording
- AudioTrack for playback
- Native file picker
- Background services
- FFmpeg Kit for native mixing

**Limitations:**

- Device fragmentation
- Manufacturer customizations
- Permission model variations

**Testing Focus:**

- Permissions (microphone, storage)
- Background playback
- App lifecycle
- TalkBack accessibility
- Device fragmentation (Samsung, Pixel, etc.)

## Cross-Platform Testing Checklist

### Audio Recording

| Test Case                     | Web | iOS | Android | Notes                        |
| ----------------------------- | --- | --- | ------- | ---------------------------- |
| Request microphone permission | ✓   | ✓   | ✓       | Different permission UIs     |
| Start recording               | ✓   | ✓   | ✓       | Verify audio capture         |
| Stop recording                | ✓   | ✓   | ✓       | Return valid URI/blob        |
| Recording duration accurate   | ✓   | ✓   | ✓       | Match expected duration      |
| Audio quality acceptable      | ✓   | ✓   | ✓       | Sample rate, bit rate        |
| Handle permission denied      | ✓   | ✓   | ✓       | Show error message           |
| Handle concurrent recording   | ✓   | ✓   | ✓       | Only one recording at a time |

### Audio Playback

| Test Case            | Web | iOS | Android | Notes                    |
| -------------------- | --- | --- | ------- | ------------------------ |
| Load audio file      | ✓   | ✓   | ✓       | From local URI           |
| Play audio           | ✓   | ✓   | ✓       | Audio starts playing     |
| Pause audio          | ✓   | ✓   | ✓       | Audio pauses             |
| Adjust volume        | ✓   | ✓   | ✓       | 0-100 range              |
| Adjust speed         | ✓   | ✓   | ✓       | 0.05x-2.50x range        |
| Loop playback        | ✓   | ✓   | ✓       | Audio loops continuously |
| Play multiple tracks | ✓   | ✓   | ✓       | Up to 20 simultaneous    |
| Background playback  | ✗   | ✓   | ✓       | Web has limitations      |

### File Operations

| Test Case               | Web | iOS | Android | Notes              |
| ----------------------- | --- | --- | ------- | ------------------ |
| Import audio file       | ✓   | ✓   | ✓       | Different pickers  |
| Supported formats (MP3) | ✓   | ✓   | ✓       | Universal support  |
| Supported formats (WAV) | ✓   | ✓   | ✓       | Universal support  |
| Supported formats (AAC) | ✓   | ✓   | ✓       | Platform dependent |
| Large file (>100MB)     | ✓   | ✓   | ✓       | Performance test   |
| Cancel import           | ✓   | ✓   | ✓       | Handle gracefully  |

### Audio Mixing

| Test Case                  | Web | iOS | Android | Notes                       |
| -------------------------- | --- | --- | ------- | --------------------------- |
| Mix 2 tracks               | ✓   | ✓   | ✓       | Basic mixing                |
| Mix 10 tracks              | ✓   | ✓   | ✓       | Performance test            |
| Mix with different speeds  | ✓   | ✓   | ✓       | Speed adjustments           |
| Mix with different volumes | ✓   | ✓   | ✓       | Volume normalization        |
| Progress updates           | ✓   | ✓   | ✓       | 0-100% progress             |
| Save/download mixed file   | ✓   | ✓   | ✓       | Web downloads, native saves |
| Handle mixing errors       | ✓   | ✓   | ✓       | Show error message          |

### UI/UX

| Test Case                 | Web | iOS | Android | Notes                  |
| ------------------------- | --- | --- | ------- | ---------------------- |
| Responsive layout         | ✓   | ✓   | ✓       | Different screen sizes |
| Touch targets (min 44x44) | ✓   | ✓   | ✓       | Accessibility          |
| Keyboard navigation       | ✓   | N/A | N/A     | Web only               |
| Screen reader support     | ✓   | ✓   | ✓       | VoiceOver, TalkBack    |
| Dark/light theme          | ✓   | ✓   | ✓       | System theme           |
| Landscape orientation     | ✓   | ✓   | ✓       | Layout adapts          |
| Tablet layout             | ✓   | ✓   | ✓       | Larger screens         |

### Performance

| Test Case               | Web | iOS | Android | Target     |
| ----------------------- | --- | --- | ------- | ---------- |
| Cold start time         | ✓   | ✓   | ✓       | < 3s       |
| Interaction latency     | ✓   | ✓   | ✓       | < 100ms    |
| List scrolling (60 FPS) | ✓   | ✓   | ✓       | Smooth     |
| Memory usage            | ✓   | ✓   | ✓       | < 150MB    |
| Large file handling     | ✓   | ✓   | ✓       | No crashes |

### Error Handling

| Test Case                         | Web | iOS | Android | Notes             |
| --------------------------------- | --- | --- | ------- | ----------------- |
| No microphone permission          | ✓   | ✓   | ✓       | Show error        |
| No storage permission             | N/A | ✓   | ✓       | Show error        |
| Corrupted audio file              | ✓   | ✓   | ✓       | Handle gracefully |
| Network error (FFmpeg)            | ✓   | N/A | N/A     | Web only          |
| Out of memory                     | ✓   | ✓   | ✓       | Handle gracefully |
| App backgrounded during operation | N/A | ✓   | ✓       | Resume or cancel  |

## Platform-Specific Test Procedures

### Web Testing

#### Browser Testing Matrix

```bash
# Chrome
npm run web
# Open http://localhost:8081 in Chrome

# Firefox
npm run web
# Open http://localhost:8081 in Firefox

# Safari
npm run web
# Open http://localhost:8081 in Safari
```

#### Browser-Specific Tests

**Chrome:**

- ✓ MediaRecorder API support
- ✓ Web Audio API support
- ✓ FFmpeg.wasm loading
- ✓ File download functionality

**Firefox:**

- ✓ MediaRecorder format (webm vs mp4)
- ✓ Audio context initialization
- ✓ Blob URL handling

**Safari:**

- ✓ MediaRecorder polyfill (if needed)
- ✓ Audio context user activation requirement
- ✓ Download behavior differences

#### Responsive Design Testing

```bash
# Test different viewport sizes
1. Mobile: 375x667 (iPhone SE)
2. Tablet: 768x1024 (iPad)
3. Desktop: 1920x1080
```

Use Chrome DevTools Device Mode:

1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select device or enter custom dimensions
4. Test all features at each size

### iOS Testing

#### Simulator Testing

```bash
# Start iOS simulator
npm run ios

# Or specify device
npx react-native run-ios --simulator="iPhone 15 Pro"
```

#### Physical Device Testing

1. Connect iPhone via USB
2. Trust computer on device
3. Run: `npm run ios --device`
4. Test on actual hardware for:
   - Audio latency
   - Performance
   - Permissions
   - Background behavior

#### iOS-Specific Tests

**Permissions:**

```
Settings → Looper → Microphone → Allow
Settings → Looper → Photos → Read and Write
```

**Background Audio:**

```
1. Play audio
2. Press Home button
3. Verify audio continues
4. Check Control Center shows playback controls
```

**VoiceOver:**

```
Settings → Accessibility → VoiceOver → ON
Navigate app with screen reader
Verify all elements are announced
```

#### iOS Version Testing

Test on multiple iOS versions:

- iOS 13 (minimum supported)
- iOS 15 (common version)
- iOS 17 (latest)

### Android Testing

#### Emulator Testing

```bash
# Start Android emulator
npm run android

# Or specify device
npx react-native run-android --deviceId emulator-5554
```

#### Physical Device Testing

1. Enable Developer Options
2. Enable USB Debugging
3. Connect via USB
4. Run: `npm run android`

#### Android-Specific Tests

**Permissions:**

```
Settings → Apps → Looper → Permissions
- Microphone → Allow
- Storage → Allow
```

**Background Playback:**

```
1. Play audio
2. Press Home button
3. Verify audio continues
4. Check notification shows playback controls
```

**TalkBack:**

```
Settings → Accessibility → TalkBack → ON
Navigate app with screen reader
Verify all elements are announced
```

#### Android Version Testing

Test on multiple Android versions:

- Android 7.0 (minimum supported)
- Android 12 (common version)
- Android 14 (latest)

#### Device Manufacturer Testing

Test on devices from different manufacturers:

- **Samsung**: OneUI customizations
- **Google Pixel**: Stock Android
- **OnePlus**: OxygenOS
- **Xiaomi**: MIUI

## Automated Cross-Platform Testing

### GitHub Actions Matrix

```yaml
# .github/workflows/test.yml
name: Cross-Platform Tests

on: [push, pull_request]

jobs:
  test-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
      - run: npm run lint

  test-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: cd ios && pod install
      - run: npm run test:ios

  test-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '17'
      - run: npm install
      - run: npm run test:android
```

## Platform-Specific Bug Tracking

### Known Platform Differences

#### Web

- **Audio latency**: Higher than native (50-150ms vs 10-30ms)
- **File download**: Uses blob URLs instead of native save dialog
- **FFmpeg**: Loads asynchronously, requires progress indication

#### iOS

- **Audio session**: Must configure AVAudioSession category
- **Background**: Requires background modes capability
- **Permissions**: Must request in Info.plist

#### Android

- **Permissions**: Runtime permissions required (API 23+)
- **Audio focus**: Must request audio focus for playback
- **Background**: Foreground service notification required

### Platform-Specific Workarounds

```typescript
// Platform-specific code example
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // Web-specific code
} else if (Platform.OS === 'ios') {
  // iOS-specific code
} else if (Platform.OS === 'android') {
  // Android-specific code
}
```

## Testing Tools Comparison

| Tool                    | Web | iOS | Android | Purpose                |
| ----------------------- | --- | --- | ------- | ---------------------- |
| Chrome DevTools         | ✓   | ✗   | ✗       | Debugging, performance |
| React DevTools          | ✓   | ✓   | ✓       | Component inspection   |
| Flipper                 | ✗   | ✓   | ✓       | Native debugging       |
| Xcode Instruments       | ✗   | ✓   | ✗       | iOS profiling          |
| Android Studio Profiler | ✗   | ✗   | ✓       | Android profiling      |
| Playwright              | ✓   | ✗   | ✗       | E2E testing (web)      |
| Detox                   | ✗   | ✓   | ✓       | E2E testing (native)   |

## Manual Testing Checklist

### Pre-Release Testing

For each platform, verify:

- [ ] All features work as expected
- [ ] No crashes or freezes
- [ ] Acceptable performance
- [ ] Accessibility support
- [ ] Error handling works
- [ ] Permissions handled correctly
- [ ] Background behavior correct (if applicable)
- [ ] UI looks good on all screen sizes
- [ ] Dark/light theme support
- [ ] Audio quality acceptable
- [ ] File operations work
- [ ] Mixing produces correct output

### Regression Testing

After each significant change:

- [ ] Run automated tests
- [ ] Manual smoke test on all platforms
- [ ] Check critical user flows
- [ ] Verify no new crashes
- [ ] Check performance hasn't degraded

## Resources

- [React Native Platform Specific Code](https://reactnative.dev/docs/platform-specific-code)
- [Expo Platform Differences](https://docs.expo.dev/workflow/platform-differences/)
- [Web Audio API Compatibility](https://caniuse.com/audio-api)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Design Guidelines](https://developer.android.com/design)
