# Phase 3: Audio Abstraction Layer

---

## ⚠️ CODE REVIEW STATUS: ISSUES FOUND

**Reviewed by:** Senior Code Reviewer
**Review Date:** 2025-11-09
**Status:** ⚠️ **PHASE 3 MOSTLY COMPLETE - QUALITY ISSUES NEED FIXES**

### Summary of Completion:

**All 8 Tasks Completed:**

- ✅ Task 1: Audio service interfaces defined
- ✅ Task 2: Abstract base classes created
- ✅ Task 3: Platform detection and factory implemented
- ✅ Task 4: Mock services created
- ✅ Task 5: Error handling implemented
- ✅ Task 6: UI integration complete
- ✅ Task 7: Unit tests added
- ✅ Task 8: Documentation (README.md) created

**Quality Issues to Fix:**

- ❌ **Test coverage**: 55.95% (below 80% threshold from Phase 1)
- ❌ **Formatting**: 11 files need prettier fixes
- ❌ **Linting**: TypeScript `any` types and missing globals
- ❌ **Test organization**: mockAudioData.ts incorrectly treated as test file
- ⚠️ **Test warnings**: Async cleanup issues in integration tests

### Verification Results:

- ✅ TypeScript compilation (`npx tsc --noEmit`)
- ⚠️ Tests: 88 passed, 9 failed (fixtures file issue + async warnings)
- ❌ Linting: 24 errors (prettier + `any` types + undefined globals)
- ❌ Formatting: 11 files fail `npm run format:check`
- ✅ Commits: Follow conventional format

**Verdict:** Implementation is functionally complete and demonstrates excellent architecture, but quality standards from Phase 1 (80% coverage, clean linting/formatting) are not met. Fix issues before proceeding.

---

## Phase Goal

Design and implement platform-agnostic interfaces for audio operations (recording, playback, mixing). Create abstract base classes that will be implemented differently for web and native platforms in Phases 4-6. Establish error handling, logging, and dependency injection patterns for audio services.

**Success Criteria:**

- TypeScript interfaces defined for all audio operations
- Abstract service classes created
- Platform detection working correctly
- Mock implementations functional for testing UI
- Error handling patterns established
- Dependency injection configured

**Estimated tokens:** ~90,000

---

## Prerequisites

- Phase 2 completed (UI components ready)
- Understanding of Phase 0 ADR-003 (Platform-Specific Audio Implementations)

---

## Tasks

### Task 1: Define Audio Service Interfaces

**Goal:** Create TypeScript interfaces for all audio operations.

**Files to Create:**

- `src/services/audio/interfaces/IAudioRecorder.ts` - Recording interface
- `src/services/audio/interfaces/IAudioPlayer.ts` - Playback interface
- `src/services/audio/interfaces/IAudioMixer.ts` - Mixing interface
- `src/services/audio/interfaces/IFileManager.ts` - File operations interface
- `src/types/audio.ts` - Audio-related types

**Implementation Steps:**

1. Define IAudioRecorder interface with methods:
   - `startRecording(): Promise<void>`
   - `stopRecording(): Promise<string>` (returns URI)
   - `isRecording(): boolean`
   - `getPermissions(): Promise<boolean>`

2. Define IAudioPlayer interface:
   - `load(uri: string): Promise<void>`
   - `play(): Promise<void>`
   - `pause(): Promise<void>`
   - `stop(): Promise<void>`
   - `setSpeed(speed: number): Promise<void>` (0.05 - 2.50)
   - `setVolume(volume: number): Promise<void>` (0 - 100)
   - `setLooping(loop: boolean): Promise<void>`
   - `getDuration(): Promise<number>`
   - `isPlaying(): boolean`
   - `unload(): Promise<void>`

3. Define IAudioMixer interface:
   - `mixTracks(tracks: MixerTrackInput[], outputPath: string): Promise<string>`
   - `setProgressCallback(callback: (progress: number) => void): void`
   - `cancel(): Promise<void>`

4. Define types in `audio.ts`:
   - `AudioFormat`, `AudioQuality`, `MixerTrackInput`, `RecordingOptions`, `PlaybackOptions`

**Verification Checklist:**

- [ ] All interfaces have complete method signatures
- [ ] Return types use Promise for async operations
- [ ] Types are exported and importable
- [ ] JSDoc comments explain each method

**Commit Message Template:**

```
feat(audio): define audio service interfaces

- Create IAudioRecorder, IAudioPlayer, IAudioMixer interfaces
- Define audio-related TypeScript types
- Add JSDoc comments for all methods
- Establish contract for platform implementations
```

**Estimated tokens:** ~10,000

---

### Task 2: Create Abstract Audio Service Classes

**Goal:** Implement abstract base classes with common logic.

**Files to Create:**

- `src/services/audio/AudioService.ts` - Main audio service orchestrator
- `src/services/audio/BaseAudioRecorder.ts` - Abstract recorder
- `src/services/audio/BaseAudioPlayer.ts` - Abstract player
- `src/services/audio/BaseAudioMixer.ts` - Abstract mixer

**Implementation Steps:**

1. Create BaseAudioRecorder abstract class:
   - Implement common state management (isRecording flag)
   - Define abstract methods matching IAudioRecorder
   - Add validation (e.g., can't start if already recording)
   - Implement error handling wrapper

2. Create BaseAudioPlayer abstract class:
   - State management (current URI, playing state)
   - Abstract methods for platform-specific implementation
   - Common validation logic
   - Event emitter for playback events

3. Create BaseAudioMixer abstract class:
   - Track input validation
   - Progress tracking state
   - Abstract mix method
   - Cancellation support

4. Create AudioService orchestrator:
   - Manages instances of recorder, players, mixer
   - Provides high-level API for UI
   - Handles multi-track coordination
   - Platform detection and service instantiation

**Verification Checklist:**

- [ ] Abstract classes implement interfaces
- [ ] Common logic is not duplicated
- [ ] Abstract methods are clearly defined
- [ ] Error handling is consistent

**Commit Message Template:**

```
feat(audio): create abstract audio service base classes

- Implement BaseAudioRecorder with common state logic
- Create BaseAudioPlayer with validation
- Add BaseAudioMixer with progress tracking
- Build AudioService orchestrator for high-level API
```

**Estimated tokens:** ~15,000

---

### Task 3: Implement Platform Detection and Service Factory

**Goal:** Create factory pattern for instantiating platform-specific audio services.

**Files to Create:**

- `src/services/audio/AudioServiceFactory.ts` - Factory for creating services
- `src/services/audio/PlatformAudioConfig.ts` - Platform-specific configuration

**Implementation Steps:**

1. Create AudioServiceFactory:
   - Use Platform.select() to choose implementation
   - Return appropriate service instances for web vs native
   - Handle missing implementations gracefully
   - Log which platform implementation is being used

2. Implement service registration:
   - Allow platform-specific modules to register themselves
   - Support dynamic loading (lazy initialization)
   - Handle initialization errors

3. Create configuration per platform:
   - Audio format settings (MP3, sample rate, bit rate)
   - Buffer sizes, latency settings
   - Platform-specific optimizations

4. Add service lifecycle management:
   - Singleton pattern for main AudioService
   - Proper cleanup on app shutdown
   - Resource release

**Verification Checklist:**

- [ ] Factory returns correct service for each platform
- [ ] Services are singletons where appropriate
- [ ] Configuration is loaded correctly
- [ ] Errors are handled if service unavailable

**Commit Message Template:**

```
feat(audio): implement platform detection and service factory

- Create AudioServiceFactory with Platform.select
- Add platform-specific configuration
- Implement service lifecycle management
- Support dynamic service registration
```

**Estimated tokens:** ~12,000

---

### Task 4: Create Mock Audio Services for Testing

**Goal:** Implement mock/stub versions of audio services for UI testing.

**Files to Create:**

- `src/services/audio/mock/MockAudioRecorder.ts` - Mock recorder
- `src/services/audio/mock/MockAudioPlayer.ts` - Mock player
- `src/services/audio/mock/MockAudioMixer.ts` - Mock mixer
- `__tests__/fixtures/mockAudioData.ts` - Test fixtures

**Implementation Steps:**

1. Create MockAudioRecorder:
   - Simulates recording with setTimeout
   - Returns fake URI
   - Tracks calls for testing

2. Create MockAudioPlayer:
   - Simulates playback with timers
   - Updates isPlaying state
   - Logs speed/volume changes
   - Returns fake durations

3. Create MockAudioMixer:
   - Simulates mixing with progress updates
   - Returns success after delay
   - No actual audio processing

4. Create test fixtures:
   - Mock track data
   - Fake URIs
   - Sample audio metadata

5. Register mocks in factory (for test environment):
   - Use **DEV** or process.env.NODE_ENV
   - Allow switching between mock and real services

**Verification Checklist:**

- [ ] Mocks implement full interfaces
- [ ] UI works with mock services
- [ ] Mocks are only used in development/test
- [ ] Mock behavior is predictable

**⚠️ CODE REVIEW FINDINGS (Task 4):**

**Test File Organization Issue:**

> **Consider:** Looking at the test output, why does Jest fail with "Your test suite must contain at least one test" for `__tests__/fixtures/mockAudioData.ts`?
>
> **Think about:** The file `__tests__/fixtures/mockAudioData.ts` is a fixtures file, not a test file. When you run `cat __tests__/fixtures/mockAudioData.ts | grep -E "test|describe|it\("`, do you find any test functions?
>
> **Reflect:** Jest runs all `.ts` files in the `__tests__` directory by default. Should fixtures files be in `__tests__/fixtures/` or should they be somewhere else (like `__tests__/__fixtures__/` which Jest ignores by default)?
>
> **Consider:** Looking at Jest configuration in `jest.config.js`, is there a `testPathIgnorePatterns` or `testMatch` configuration that excludes fixtures?

**Linting Issues in Mock Files:**

> **Think about:** When you run `npm run lint`, why do `MockAudioMixer.ts` and `MockAudioPlayer.ts` have errors saying `'NodeJS' is not defined`?
>
> **Reflect:** These files use `NodeJS.Timeout` for timer types. Looking at `eslint.config.mjs`, are NodeJS globals defined in the globals configuration?
>
> **Consider:** Should you add `NodeJS: 'readonly'` to the globals, or use a different type like `ReturnType<typeof setTimeout>`?

**Evidence:**

```bash
$ npm test
FAIL __tests__/fixtures/mockAudioData.ts
  ● Test suite failed to run
    Your test suite must contain at least one test.

$ npm run lint
/Migration/src/services/audio/mock/MockAudioMixer.ts
  13:24  error  'NodeJS' is not defined  no-undef
/Migration/src/services/audio/mock/MockAudioPlayer.ts
  13:26  error  'NodeJS' is not defined  no-undef
```

**Commit Message Template:**

```
test(audio): create mock audio services for UI testing

- Implement MockAudioRecorder, MockAudioPlayer, MockAudioMixer
- Add test fixtures for mock data
- Register mocks in factory for dev environment
- Enable UI development without real audio
```

**Estimated tokens:** ~13,000

---

### Task 5: Implement Error Handling and Logging

**Goal:** Create consistent error handling and logging for audio operations.

**Files to Create:**

- `src/services/audio/AudioError.ts` - Custom error class
- `src/utils/logger.ts` - Logging utility
- `src/utils/logger.web.ts` - Web logging
- `src/utils/logger.native.ts` - Native logging

**Implementation Steps:**

1. Create AudioError class:
   - Extend Error with custom properties
   - Error codes (PERMISSION_DENIED, RECORDING_FAILED, etc.)
   - Platform information
   - User-friendly messages

2. Implement logging utility:
   - debug(), info(), warn(), error() methods
   - Platform-specific implementations
   - Only log in development mode
   - Integration with error tracking (Sentry, etc.) placeholder

3. Add error boundaries:
   - Wrap audio operations in try-catch
   - Log errors with context
   - Show user-friendly error messages
   - Retry logic for transient failures

4. Create error recovery strategies:
   - Permission errors → prompt user
   - Resource errors → cleanup and retry
   - Platform errors → fallback or notify user

**Verification Checklist:**

- [ ] AudioError has all necessary fields
- [ ] Logging works on all platforms
- [ ] Errors are caught and handled
- [ ] User sees helpful error messages

**⚠️ CODE REVIEW FINDINGS (Task 5):**

**TypeScript `any` Types:**

> **Consider:** Looking at `src/services/audio/AudioError.ts:29` and `AudioError.ts:40`, why are the `context` parameters typed as `Record<string, any>`?
>
> **Think about:** Phase 1 established strict TypeScript mode. Does using `any` violate the strict type checking principle?
>
> **Reflect:** Could you use `Record<string, unknown>` instead of `Record<string, any>` to maintain type safety while allowing flexible context data?
>
> **Consider:** Similarly, in `src/services/audio/interfaces/IFileManager.ts:20`, the `metadata` property uses `any`. Should this be `unknown` or a more specific type?

**Evidence:**

```bash
$ npm run lint
/Migration/src/services/audio/AudioError.ts
  29:44  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  40:30  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/Migration/src/services/audio/interfaces/IFileManager.ts
  20:23  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
```

**Commit Message Template:**

```
feat(audio): implement error handling and logging

- Create AudioError custom error class with codes
- Build platform-specific logging utilities
- Add error boundaries around audio operations
- Define error recovery strategies
```

**Estimated tokens:** ~12,000

---

### Task 6: Integrate Audio Services with UI

**Goal:** Connect Phase 2 UI components to audio service abstraction.

**Files to Modify:**

- `src/screens/MainScreen/MainScreen.tsx` - Wire up audio service
- `src/components/TrackListItem/TrackListItem.tsx` - Connect controls

**Implementation Steps:**

1. Initialize AudioService in MainScreen:
   - Use factory to get service instance
   - Store in state or context
   - Use mock services for now

2. Connect Record button:
   - Call audioService.startRecording()
   - Handle errors (show alert)
   - Update UI state (recording indicator)

3. Connect Stop button:
   - Call audioService.stopRecording()
   - Add track to list with returned URI
   - Reset recording state

4. Connect Track controls:
   - Play → audioService.play(uri)
   - Pause → audioService.pause()
   - Delete → remove from list, unload audio
   - Speed slider → audioService.setSpeed()
   - Volume slider → audioService.setVolume()

5. Add loading states:
   - Show spinner during async operations
   - Disable buttons while loading
   - Handle concurrent operations

**Verification Checklist:**

- [ ] Record button starts mock recording
- [ ] Stop button creates track in list
- [ ] Play/Pause buttons update state
- [ ] Sliders call service methods
- [ ] Errors show user feedback

**Commit Message Template:**

```
feat(integration): connect UI to audio services

- Wire MainScreen to AudioService via factory
- Connect Record/Stop buttons to recorder
- Link track controls to audio player methods
- Add loading states and error handling
- Use mock services for testing
```

**Estimated tokens:** ~13,000

---

### Task 7: Add Unit Tests for Audio Abstractions

**Goal:** Test all audio service interfaces and base classes.

**Files to Create:**

- `__tests__/unit/services/AudioService.test.ts`
- `__tests__/unit/services/AudioServiceFactory.test.ts`
- `__tests__/unit/services/mock/MockAudioServices.test.ts`

**Implementation Steps:**

1. Test AudioServiceFactory:
   - Returns correct service for platform
   - Handles missing implementations
   - Singleton behavior

2. Test Mock services:
   - Implement interface correctly
   - State updates as expected
   - Async operations resolve

3. Test error handling:
   - AudioError created correctly
   - Errors are caught and logged
   - Recovery strategies work

4. Test service lifecycle:
   - Initialization succeeds
   - Cleanup releases resources
   - Multiple instances handled correctly

**Verification Checklist:**

- [ ] All tests pass
- [ ] Coverage >80% for audio services
- [ ] Mocks tested independently
- [ ] Platform detection tested

**⚠️ CODE REVIEW FINDINGS (Task 7):**

**Test Coverage Below Threshold:**

> **Consider:** When you run `npm run test:coverage`, what is the overall coverage percentage? Phase 1 specified an 80% coverage threshold. Are you meeting that requirement?
>
> **Think about:** The coverage report shows:
>
> - Statements: 55.95% (target: 80%)
> - Branches: 38.26% (target: 80%)
> - Functions: 57.84% (target: 80%)
> - Lines: 56.09% (target: 80%)
>
> **Reflect:** Which files or components have low coverage? Looking at the coverage report, are the base classes (`BaseAudioRecorder`, `BaseAudioPlayer`, `BaseAudioMixer`) adequately tested?
>
> **Consider:** Should you add more tests for edge cases, error paths, and the abstract base classes to reach the 80% threshold?

**Async Test Cleanup Issues:**

> **Think about:** Several tests show warnings: "Cannot log after tests are done. Did you forget to wait for something async in your test?"
>
> **Reflect:** Looking at `__tests__/integration/screens/MainScreen.test.tsx` and `__tests__/App.test.tsx`, are there any timers (setTimeout/setInterval) or promises that aren't being cleaned up?
>
> **Consider:** Are the mock services using timers that aren't being cleared? Should you add `afterEach()` hooks to clean up timers with `jest.clearAllTimers()`?

**Evidence:**

```bash
$ npm run test:coverage
File                       | % Stmts | % Branch | % Funcs | % Lines
All files                  |   55.95 |    38.26 |   57.84 |   56.09

Jest: "global" coverage threshold for statements (80%) not met: 55.95%
Jest: "global" coverage threshold for branches (80%) not met: 38.26%
Jest: "global" coverage threshold for lines (80%) not met: 56.09%
Jest: "global" coverage threshold for functions (80%) not met: 57.84%

$ npm test
●  Cannot log after tests are done. Did you forget to wait for something async in your test?
(repeated in App.test.tsx and MainScreen.test.tsx)
```

**Commit Message Template:**

```
test(audio): add unit tests for audio abstractions

- Test AudioServiceFactory platform detection
- Verify mock services implement interfaces
- Test error handling and logging
- Ensure service lifecycle management works
```

**Estimated tokens:** ~10,000

---

### Task 8: Document Audio Architecture

**Goal:** Create comprehensive documentation for audio service architecture.

**Files to Create:**

- `src/services/audio/README.md` - Architecture documentation
- `docs/architecture/audio-services.md` - Detailed architecture doc

**Implementation Steps:**

1. Document service architecture:
   - Class diagrams (can use ASCII or PlantUML)
   - Sequence diagrams for key operations
   - Explain abstraction pattern

2. Document platform-specific approach:
   - Why platform-specific implementations
   - How factory pattern works
   - When to use mock vs real services

3. Add usage examples:
   - How to use AudioService in components
   - How to add new audio operations
   - How to implement platform-specific service

4. Document testing approach:
   - How to test with mocks
   - How to add new mock services
   - Testing platform-specific code

**Verification Checklist:**

- [ ] Documentation is clear and comprehensive
- [ ] Diagrams are included
- [ ] Examples are accurate
- [ ] New developers can understand architecture

**Commit Message Template:**

```
docs(audio): document audio service architecture

- Create architecture documentation with diagrams
- Explain platform-specific implementation pattern
- Add usage examples for components
- Document testing approach for audio services
```

**Estimated tokens:** ~5,000

---

## Phase Verification

**⚠️ CODE QUALITY ISSUES (All Tasks):**

**Formatting Not Applied:**

> **Consider:** When you run `npm run format:check`, 11 files are reported as having formatting issues. Did you run `npm run format` to fix them before committing?
>
> **Think about:** Phase 1 established that all code should pass `npm run format:check`. Looking at the list of files, which ones need formatting?
>
> **Evidence:**
>
> ```bash
> $ npm run format:check
> [warn] __tests__/fixtures/mockAudioData.ts
> [warn] __tests__/unit/components/SaveModal.test.tsx
> [warn] __tests__/unit/components/TrackList.test.tsx
> [warn] __tests__/unit/services/MockAudioServices.test.ts
> [warn] docs/plans/Phase-2.md
> [warn] src/screens/MainScreen/MainScreen.tsx
> [warn] src/services/audio/AudioService.ts
> [warn] src/services/audio/BaseAudioMixer.ts
> [warn] src/services/audio/BaseAudioPlayer.ts
> [warn] src/services/audio/PlatformAudioConfig.ts
> [warn] src/services/audio/README.md
> ```

**Quick Fixes Needed:**

> **Reflect:** All of these issues can be fixed quickly:
>
> 1. Run `npm run format` to fix formatting
> 2. Move `__tests__/fixtures/` to `__tests__/__fixtures__/` or add to `testPathIgnorePatterns`
> 3. Add `NodeJS: 'readonly'` to eslint globals
> 4. Change `Record<string, any>` to `Record<string, unknown>`
> 5. Add more tests to reach 80% coverage
> 6. Add cleanup in test `afterEach` hooks

---

### How to Verify Phase 3 is Complete

1. **Interface Completeness:**
   - All audio operations have interface definitions
   - Interfaces cover recording, playback, mixing

2. **Mock Functionality:**
   - UI works with mock audio services
   - Record creates tracks, play toggles state
   - No real audio operations yet

3. **Platform Detection:**
   - Factory returns correct services for platform
   - Test on web and native

4. **Error Handling:**
   - Errors are caught and shown to user
   - Logging works correctly

5. **Tests:**
   - All unit tests pass
   - Coverage meets threshold

### Integration Points for Phases 4-5

Phase 3 provides foundation for:

- Phase 4: Implement IAudioRecorder for web and native
- Phase 5: Implement IAudioPlayer for web and native
- Phase 6: Implement IAudioMixer for web and native

### Known Limitations

- No real audio operations (using mocks)
- Actual implementation in Phases 4-6
- File management minimal (URI handling only)

---

## Next Phase

Proceed to **[Phase 4: Recording & Import (Platform-Specific)](./Phase-4.md)** to implement real audio recording and file import.
