# Phase 6: FFmpeg Integration & Mixing Engine

---

## ⚠️ CODE REVIEW STATUS: CRITICAL ISSUES FOUND

**Reviewed by:** Senior Code Reviewer
**Review Date:** 2025-11-09
**Status:** ❌ **PHASE 6 INCOMPLETE - TYPESCRIPT ERRORS & QUALITY ISSUES**

### Summary of Completion:

**All 10 Tasks Implemented:**

- ✅ Task 1: FFmpeg for Web (FFmpegService.web.ts - 203 lines)
- ✅ Task 2: FFmpeg for Native (FFmpegService.native.ts - 200 lines)
- ✅ Task 3: Command Builder (FFmpegCommandBuilder.ts - 161 lines)
- ✅ Task 4: Web Mixing Implementation
- ✅ Task 5: Native Mixing Implementation
- ✅ Task 6: Mixing UI (MixingProgress.tsx - 145 lines)
- ✅ Task 7: Export/Save Functionality
- ✅ Task 8: Performance Optimization
- ✅ Task 9: Unit Tests (2 new test files, 50 new tests)
- ✅ Task 10: Documentation (mixing.md created)

**Critical Issues:**

- ❌ **TypeScript compilation fails** - 26 errors (blocking)
- ❌ **FFmpeg API mismatch** - Using old v0.11 API with v0.12 package
- ❌ **Import errors** - AudioErrorCode import path incorrect
- ❌ **Circular import** - FFmpegService.ts
- ❌ **Test coverage**: 47.27% (below 80% threshold)
- ⚠️ **Linting**: 32 errors (jest globals, formatting, unused vars)
- ⚠️ **Formatting**: 7 files need formatting

### Verification Results:

- ✅ Tests pass: 21 suites, 337 tests (with mocks)
- ❌ TypeScript compilation: 26 errors
- ❌ Linting: 32 errors
- ❌ Formatting: 7 files fail prettier check
- ⚠️ Test coverage: 47.27% vs 80% target
- ✅ Commits: Follow conventional format

**Verdict:** Phase 6 cannot be approved until TypeScript compilation errors are fixed. The @ffmpeg/ffmpeg v0.12 API has breaking changes that need to be addressed.

---

## Phase Goal

Integrate FFmpeg for both web (@ffmpeg/ffmpeg) and native (react-native-ffmpeg or ffmpeg-kit) platforms to enable true audio mixing. Implement the mixing engine that combines multiple tracks with their speed and volume adjustments into a single output file. This is the core new feature that doesn't exist in the Android app.

**Success Criteria:**

- FFmpeg integrated on web (WebAssembly)
- FFmpeg integrated on native (Android/iOS)
- Mix multiple tracks into single MP3 file
- Apply speed adjustments using atempo filter
- Apply volume adjustments using volume filter
- Progress tracking during mixing
- Export mixed audio file

**Estimated tokens:** ~120,000

---

## Prerequisites

- Phases 4-5 completed (recording, import, playback working)
- Understanding of Phase 0 ADR-002 (FFmpeg as audio processing library)
- Basic FFmpeg filter knowledge (will be explained in tasks)

---

## Tasks

### Task 1: Install and Configure FFmpeg for Web

**Goal:** Set up @ffmpeg/ffmpeg (WebAssembly) for web platform.

**Files to Create:**

- `src/services/ffmpeg/FFmpegService.web.ts` - Web FFmpeg service
- `src/utils/ffmpegLoader.web.ts` - FFmpeg loader utility

**Implementation Steps:**

1. Install dependencies:
   - `@ffmpeg/ffmpeg` - Main FFmpeg package for web
   - `@ffmpeg/core` - FFmpeg core (wasm files)

2. Initialize FFmpeg:

   ```typescript
   import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
   const ffmpeg = createFFmpeg({ log: true });
   await ffmpeg.load();
   ```

3. Configure FFmpeg paths:
   - Load from CDN or local
   - Handle loading errors
   - Show loading progress

4. Create FFmpeg service wrapper:
   - Initialize singleton instance
   - Lazy load (only when needed)
   - Handle browser compatibility

5. Add error handling:
   - FFmpeg not supported (old browsers)
   - Loading failures
   - Memory limitations

**Verification Checklist:**

- [ ] FFmpeg loads in modern browsers
- [ ] Loading progress shown to user
- [ ] Errors handled gracefully
- [ ] Works in Chrome, Firefox, Safari

**Commit Message Template:**

```
feat(ffmpeg): integrate FFmpeg WebAssembly for web

- Install @ffmpeg/ffmpeg and @ffmpeg/core
- Create FFmpegService for web platform
- Implement lazy loading with progress
- Add browser compatibility checks
```

**Estimated tokens:** ~15,000

---

### Task 2: Install and Configure FFmpeg for Native

**Goal:** Set up react-native-ffmpeg or ffmpeg-kit for iOS/Android.

**Files to Create:**

- `src/services/ffmpeg/FFmpegService.native.ts` - Native FFmpeg service
- Expo config plugin configuration

**Implementation Steps:**

1. Choose FFmpeg library:
   - Option A: react-native-ffmpeg (older, stable)
   - Option B: ffmpeg-kit-react-native (newer, recommended)

2. Install via Expo config plugin:
   - Add to `app.json` plugins array
   - Configure FFmpeg package (use 'min' or 'audio' - no video codecs)

3. Create custom development build:
   - Run `eas build --profile development --platform android`
   - Run `eas build --profile development --platform ios`
   - This step creates builds with native FFmpeg module

4. Create native FFmpeg service:
   - Import FFmpegKit (or RNFFmpeg)
   - Execute commands
   - Get progress callbacks

5. Handle platform differences:
   - iOS vs Android file paths
   - Permission differences
   - Binary size optimization

**Verification Checklist:**

- [ ] FFmpeg builds successfully for Android
- [ ] FFmpeg builds successfully for iOS
- [ ] Custom dev client installs on devices
- [ ] FFmpeg commands can execute

**Commit Message Template:**

```
feat(ffmpeg): integrate FFmpeg for native platforms

- Install ffmpeg-kit-react-native
- Configure Expo plugin in app.json
- Create custom development builds
- Implement NativeFFmpegService
```

**Estimated tokens:** ~18,000

---

### Task 3: Build FFmpeg Command Generator

**Goal:** Create utility to build FFmpeg filter commands for audio mixing.

**Files to Create:**

- `src/services/ffmpeg/FFmpegCommandBuilder.ts` - Command builder
- `src/services/ffmpeg/filters/` - Filter utilities

**Implementation Steps:**

1. Understand FFmpeg filter syntax:

   ```bash
   ffmpeg -i input1.mp3 -i input2.mp3 \
     -filter_complex "[0:a]atempo=1.5[a0];[1:a]volume=0.5[a1];[a0][a1]amix=inputs=2" \
     -codec:a libmp3lame -b:a 128k output.mp3
   ```

2. Create command builder class:
   - Accept array of tracks with speed/volume settings
   - Generate filter_complex string
   - Handle 1-N tracks
   - Set output format/quality

3. Implement atempo filter (speed):
   - atempo range: 0.5 to 2.0
   - For speed <0.5 or >2.0, chain multiple atempo filters
   - Example: 0.25x = atempo=0.5,atempo=0.5
   - Example: 4.0x = atempo=2.0,atempo=2.0

4. Implement volume filter:
   - Apply logarithmic volume scaling
   - Convert 0-100 range to dB or linear multiplier
   - Formula: `volume=${scaledVolume}`

5. Implement amix filter (mixing):
   - Combine all processed audio streams
   - Set inputs count
   - Configure mixing algorithm (can use defaults)

6. Set output encoding:
   - `-codec:a libmp3lame` (MP3 encoder)
   - `-b:a 128k` (bit rate)
   - `-ar 44100` (sample rate)

7. Build complete command:
   - Input files
   - Filter complex
   - Output file
   - Overwrite flag `-y`

**Verification Checklist:**

- [ ] Commands generated correctly
- [ ] atempo handles full speed range
- [ ] volume applied correctly
- [ ] amix combines multiple inputs
- [ ] Output format is MP3

**Commit Message Template:**

```
feat(ffmpeg): create FFmpeg command builder

- Build FFmpegCommandBuilder for filter generation
- Implement atempo filter for speed (0.05x-2.50x)
- Add volume filter with scaling
- Use amix for multi-track mixing
- Generate complete FFmpeg commands
```

**Estimated tokens:** ~20,000

---

### Task 4: Implement Audio Mixing on Web

**Goal:** Use @ffmpeg/ffmpeg to mix audio tracks on web.

**Files to Modify:**

- `src/services/ffmpeg/FFmpegService.web.ts`

**Implementation Steps:**

1. Load audio files into FFmpeg virtual file system:

   ```typescript
   ffmpeg.FS('writeFile', 'input1.mp3', await fetchFile(uri1));
   ffmpeg.FS('writeFile', 'input2.mp3', await fetchFile(uri2));
   ```

2. Build FFmpeg command using CommandBuilder
3. Execute FFmpeg:

   ```typescript
   await ffmpeg.run(...commandArgs);
   ```

4. Monitor progress:
   - FFmpeg emits progress events
   - Calculate percentage based on time/duration
   - Update UI progress bar

5. Read output file:

   ```typescript
   const data = ffmpeg.FS('readFile', 'output.mp3');
   const blob = new Blob([data.buffer], { type: 'audio/mp3' });
   const url = URL.createObjectURL(blob);
   ```

6. Clean up:
   - Remove input files from virtual FS
   - Remove output file after reading
   - Free memory

7. Handle errors:
   - FFmpeg execution failures
   - Out of memory (large files)
   - Unsupported codecs

**Verification Checklist:**

- [ ] Mixing works with 2 tracks
- [ ] Mixing works with 5+ tracks
- [ ] Progress updates correctly
- [ ] Output is playable MP3
- [ ] Speed/volume applied correctly

**Commit Message Template:**

```
feat(ffmpeg): implement audio mixing on web

- Load audio into FFmpeg virtual file system
- Execute mixing commands
- Track progress and update UI
- Export mixed audio as blob URL
- Clean up resources after mixing
```

**Estimated tokens:** ~18,000

---

### Task 5: Implement Audio Mixing on Native

**Goal:** Use FFmpegKit to mix audio on iOS/Android.

**Files to Modify:**

- `src/services/ffmpeg/FFmpegService.native.ts`

**Implementation Steps:**

1. Copy audio files to accessible location:
   - Use expo-file-system to copy if needed
   - Get absolute file paths for FFmpeg

2. Build FFmpeg command using CommandBuilder
3. Execute FFmpegKit:

   ```typescript
   import { FFmpegKit } from 'ffmpeg-kit-react-native';
   const session = await FFmpegKit.execute(command);
   ```

4. Monitor progress:
   - Use statistics callback
   - Extract time from statistics
   - Calculate percentage

5. Check execution result:
   - Get return code
   - Get output/error logs
   - Handle failures

6. Return output file URI:
   - File saved to specified path
   - Return URI for playback/sharing

7. Clean up temporary files

**Verification Checklist:**

- [ ] Mixing works on Android
- [ ] Mixing works on iOS
- [ ] Progress tracking works
- [ ] Output file created correctly
- [ ] Speed/volume applied

**Commit Message Template:**

```
feat(ffmpeg): implement audio mixing on native

- Execute FFmpeg commands with FFmpegKit
- Track progress via statistics callback
- Handle execution results and errors
- Return output file URI
- Clean up temporary files
```

**Estimated tokens:** ~18,000

---

### Task 6: Create Mixing UI and Progress Indicator

**Goal:** Add UI for mixing operation with progress feedback.

**Files to Create:**

- `src/components/MixingProgress/MixingProgress.tsx` - Progress modal
- `src/screens/MainScreen/MixingController.tsx` - Mixing logic

**Implementation Steps:**

1. Create MixingProgress modal:
   - Show when mixing starts
   - Display progress bar (0-100%)
   - Show estimated time remaining
   - Cancel button
   - Success/error messages

2. Add Mix button to UI:
   - Bottom controls or menu
   - Disabled if <2 tracks
   - Opens mixing flow

3. Implement mixing flow:
   - Validate tracks (at least 2)
   - Show filename input dialog
   - Start mixing with progress modal
   - Handle completion (play or save)

4. Connect to FFmpegService:
   - Call mix() method
   - Subscribe to progress updates
   - Handle errors

5. Show results:
   - On success: show success message, offer playback
   - On error: show error message, allow retry
   - On cancel: clean up partial output

**Verification Checklist:**

- [ ] Mix button appears
- [ ] Progress modal shows during mixing
- [ ] Progress updates smoothly
- [ ] Cancel works correctly
- [ ] Success/error handled

**Commit Message Template:**

```
feat(ui): add mixing UI and progress indicator

- Create MixingProgress modal component
- Add Mix button to main screen
- Implement mixing flow with validation
- Show progress during FFmpeg execution
- Handle success, error, and cancellation
```

**Estimated tokens:** ~15,000

---

### Task 7: Implement Export and Save Functionality

**Goal:** Save mixed audio to device storage or downloads.

**Files to Create:**

- `src/services/export/AudioExporter.ts` - Export service
- `src/services/export/AudioExporter.web.ts` - Web export
- `src/services/export/AudioExporter.native.ts` - Native export

**Implementation Steps:**

1. Web export:
   - Create download link
   - Trigger browser download
   - Filename from user input
   - Use anchor tag with download attribute

2. Native export:
   - Use expo-media-library to save to device
   - Request permissions
   - Save to Music or Downloads folder
   - Return saved file URI

3. Add export options:
   - Save to device
   - Share via system share sheet (native)
   - Copy to clipboard (web)

4. Handle export success:
   - Show confirmation message
   - Offer to play exported file
   - Add to track list option

5. Handle export failure:
   - Show error message
   - Offer retry
   - Log for debugging

Reference Android save:

- `../app/src/main/java/gemenie/looper/MainActivity.java:225-247`

**Verification Checklist:**

- [ ] Export works on web (downloads file)
- [ ] Export works on native (saves to device)
- [ ] Permissions handled
- [ ] File saved with correct name
- [ ] Success/error messages shown

**Commit Message Template:**

```
feat(export): implement audio export and save

- Create AudioExporter for web and native
- Download file on web platform
- Save to device storage on native
- Handle permissions and errors
- Show export success/failure feedback
```

**Estimated tokens:** ~15,000

---

### Task 8: Optimize FFmpeg Performance

**Goal:** Improve mixing performance and handle large files.

**Files to Modify:**

- `src/services/ffmpeg/FFmpegService.web.ts`
- `src/services/ffmpeg/FFmpegService.native.ts`
- `src/services/ffmpeg/FFmpegCommandBuilder.ts`

**Implementation Steps:**

1. Optimize FFmpeg commands:
   - Use appropriate thread count
   - Optimize filter chains
   - Minimize re-encoding

2. Handle large files on web:
   - Check file sizes before loading
   - Warn if total size > 100MB
   - Consider using streaming if possible
   - Show memory usage warnings

3. Native optimizations:
   - Use hardware acceleration if available
   - Optimize for mobile CPUs
   - Limit concurrent operations

4. Add cancellation support:
   - Allow user to cancel long operations
   - Clean up partial outputs
   - Release resources

5. Cache optimization:
   - Avoid re-encoding if possible
   - Reuse processed tracks

6. Progress accuracy:
   - Estimate total duration
   - Calculate accurate percentage
   - Update frequently but not excessively

**Verification Checklist:**

- [ ] Mixing completes in reasonable time
- [ ] Large files handled gracefully
- [ ] Cancellation works
- [ ] Memory usage acceptable
- [ ] Progress is accurate

**Commit Message Template:**

```
perf(ffmpeg): optimize mixing performance

- Optimize FFmpeg command generation
- Handle large files on web platform
- Add cancellation support for long operations
- Improve progress calculation accuracy
- Optimize for mobile performance
```

**Estimated tokens:** ~14,000

---

### Task 9: Add Unit and Integration Tests

**Goal:** Test FFmpeg integration and mixing functionality.

**Files to Create:**

- `__tests__/unit/services/FFmpegCommandBuilder.test.ts`
- `__tests__/unit/services/FFmpegService.test.ts`
- `__tests__/integration/mixing.test.ts`

**Implementation Steps:**

1. Test FFmpegCommandBuilder:
   - Command generation for various track combinations
   - atempo filter chaining for extreme speeds
   - volume filter application
   - amix configuration

2. Mock FFmpeg execution:
   - Don't run actual FFmpeg in tests
   - Mock file system operations
   - Simulate progress updates

3. Test mixing flow:
   - Full mixing workflow
   - Progress tracking
   - Error handling
   - Cancellation

4. Test edge cases:
   - Single track "mix"
   - Very slow/fast speeds
   - Zero volume tracks
   - Large number of tracks

5. Integration tests:
   - Use small audio fixtures
   - Verify output is valid MP3
   - Check duration is correct
   - Verify speed/volume applied

**Verification Checklist:**

- [ ] Command builder tests pass
- [ ] FFmpeg service tests pass
- [ ] Integration tests cover main flows
- [ ] Edge cases tested
- [ ] Coverage >80%

**Commit Message Template:**

```
test(ffmpeg): add tests for mixing functionality

- Test FFmpegCommandBuilder generation
- Mock FFmpeg execution in unit tests
- Add integration tests with audio fixtures
- Test edge cases and error handling
- Achieve 80%+ coverage
```

**Estimated tokens:** ~12,000

---

### Task 10: Documentation and Phase Completion

**Goal:** Document FFmpeg integration and mixing feature.

**Files to Create:**

- `docs/features/mixing.md` - Mixing documentation
- `docs/architecture/ffmpeg-integration.md` - FFmpeg architecture
- `docs/guides/ffmpeg-commands.md` - FFmpeg command reference

**Implementation Steps:**

1. Document mixing feature:
   - How to mix tracks
   - What mixing does (combines audio)
   - Speed/volume application
   - Export process

2. Document FFmpeg integration:
   - Web vs native differences
   - Command generation
   - Performance considerations
   - Troubleshooting

3. Create FFmpeg command reference:
   - Example commands
   - Filter explanations
   - Common patterns
   - Debugging tips

4. User guide:
   - Step-by-step mixing workflow
   - Expected results
   - Limitations (file size, track count)

**Verification Checklist:**

- [ ] Documentation comprehensive
- [ ] Examples accurate
- [ ] Platform differences explained
- [ ] Troubleshooting helpful

**Commit Message Template:**

```
docs(ffmpeg): document mixing and FFmpeg integration

- Create mixing feature documentation
- Document FFmpeg architecture and integration
- Add FFmpeg command reference guide
- Include user guide for mixing workflow
```

**Estimated tokens:** ~8,000

---

## Phase Verification

**❌ CRITICAL ISSUES - MUST FIX:**

**1. TypeScript Compilation Errors (26 errors - BLOCKING)**

> **Consider:** When you run `npx tsc --noEmit`, why do you get errors about `@ffmpeg/ffmpeg` module exports?
>
> **Think about:** Looking at the package.json, you're using `@ffmpeg/ffmpeg@0.12.6`. But your code uses:
>
> ```typescript
> import { createFFmpeg, FFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
> this.ffmpeg = createFFmpeg({ log: true });
> await this.ffmpeg.load();
> this.ffmpeg.FS('writeFile', ...);
> this.ffmpeg.run(...);
> ```
>
> **Reflect:** The @ffmpeg/ffmpeg v0.12 API has breaking changes. The new API is:
>
> ```typescript
> import { FFmpeg } from '@ffmpeg/ffmpeg';
> import { fetchFile } from '@ffmpeg/util';
> this.ffmpeg = new FFmpeg();
> await this.ffmpeg.load();
> await this.ffmpeg.writeFile(...);
> await this.ffmpeg.exec(...);
> ```
>
> **Consider:** Should you either:
>
> - Update the code to use the v0.12 API, OR
> - Downgrade @ffmpeg/ffmpeg to v0.11.x which has the old API?

**Evidence:**

```bash
$ npx tsc --noEmit
src/services/ffmpeg/FFmpegService.web.ts(8,10): error TS2305: Module '"@ffmpeg/ffmpeg"' has no exported member 'createFFmpeg'.
src/services/ffmpeg/FFmpegService.web.ts(8,32): error TS2305: Module '"@ffmpeg/ffmpeg"' has no exported member 'fetchFile'.
src/services/ffmpeg/FFmpegService.web.ts(119,21): error TS2339: Property 'FS' does not exist on type 'FFmpeg'.
src/services/ffmpeg/FFmpegService.web.ts(143,25): error TS2339: Property 'run' does not exist on type 'FFmpeg'.
```

**2. AudioErrorCode Import Error**

> **Think about:** Looking at `src/services/ffmpeg/FFmpegService.web.ts:9` and `FFmpegService.native.ts:10`:
>
> ```typescript
> import { AudioError, AudioErrorCode } from '../audio/AudioError';
> ```
>
> **Consider:** When you check `src/services/audio/AudioError.ts`, does it export `AudioErrorCode`?
>
> **Reflect:** Looking at `src/types/audio.ts`, you see `export enum AudioErrorCode { ... }`. Should the import be:
>
> ```typescript
> import { AudioError } from '../audio/AudioError';
> import { AudioErrorCode } from '../../types/audio';
> ```

**3. Circular Import in FFmpegService.ts**

> **Consider:** The error says: `error TS2303: Circular definition of import alias 'getFFmpegService'`
>
> **Think about:** What does `src/services/ffmpeg/FFmpegService.ts` do? Is it trying to re-export `getFFmpegService` from itself?
>
> **Reflect:** Should this file use `Platform.select()` to dynamically import the correct platform-specific service?

**4. Implicit `any` Types**

> **Think about:** Phase 1 established strict TypeScript mode. The compiler errors show:
>
> ```
> src/screens/MainScreen/MainScreen.tsx(211,33): error TS7006: Parameter 'ratio' implicitly has an 'any' type.
> src/services/ffmpeg/FFmpegService.web.ts(53,22): error TS7031: Binding element 'ratio' implicitly has an 'any' type.
> ```
>
> **Consider:** Should you add explicit types to all function parameters?

**5. Missing FFmpeg API Methods**

> **Consider:** The native service tries to use:
>
> ```typescript
> import { FFmpegKit, FFmpegKitConfig, StatisticsCallback } from 'ffmpeg-kit-react-native';
> ```
>
> **Think about:** The errors show:
>
> - `Property 'cacheDirectory' does not exist on expo-file-system`
> - `Argument of type 'null' is not assignable to parameter of type 'StatisticsCallback'`
>
> **Reflect:** Are you using the ffmpeg-kit-react-native API correctly? Should you check the documentation for v6.0.2?

**⚠️ QUALITY ISSUES (Non-Blocking but Important):**

**6. Jest Globals in Mock Files**

> **Consider:** Files in `__mocks__/` have linting errors: `'jest' is not defined`
>
> **Think about:** Should you add `/* eslint-env jest */` at the top of mock files, or exclude `__mocks__/` from linting?

**7. Test Coverage (47.27% vs 80% target)**

> **Reflect:** Coverage dropped significantly. Which new files have low coverage?
>
> **Consider:** Should you add more tests for:
>
> - FFmpegCommandBuilder edge cases
> - FFmpegService error scenarios
> - MixingProgress component

**Evidence from tool verification:**

```bash
$ npm test
Test Suites: 21 passed, 21 total
Tests:       3 skipped, 337 passed, 340 total

$ npx tsc --noEmit
26 compilation errors

$ npm run lint
32 errors (14 jest globals, 4 prettier, 3 unused vars, 11 any types)

$ npm run format:check
7 files need formatting
```

---

### How to Verify Phase 6 is Complete

1. **FFmpeg Integration:**
   - FFmpeg loads on web
   - FFmpeg works on native (custom dev build)

2. **Mixing Works:**
   - Mix 2 tracks successfully
   - Mix 5+ tracks successfully
   - Speed and volume applied correctly
   - Output is playable MP3

3. **Platforms:**
   - Test on web browsers
   - Test on Android device
   - Test on iOS device

4. **UI:**
   - Progress shows during mixing
   - Can cancel mixing
   - Success/error messages shown

5. **Export:**
   - File downloads on web
   - File saves to device on native

6. **Tests:**
   - All tests pass
   - Coverage >80%

### Integration Points for Phase 7

Phase 6 provides mixing functionality that Phase 7 will integrate with state management for persistence.

### Known Limitations

- Large files may be slow on web (WASM performance)
- Track count limited by memory/performance
- No real-time mixing preview (only after export)

---

## Next Phase

Proceed to **[Phase 7: State Management & Persistence](./Phase-7.md)** to implement state storage and app lifecycle management.
