# Phase 7: State Management & Persistence

---

## ⚠️ CODE REVIEW STATUS: CRITICAL ISSUES FOUND

**Reviewed by:** Senior Code Reviewer
**Review Date:** 2025-11-09
**Status:** ❌ **PHASE 7 INCOMPLETE - TEST FAILURES & TYPESCRIPT ERRORS**

### Summary of Completion:

**All 10 Tasks Implemented:**

- ✅ Task 1: Track Store (useTrackStore.ts - 93 lines)
- ✅ Task 2: Playback Store (usePlaybackStore.ts - enhanced)
- ✅ Task 3: UI State Store (useUIStore.ts - 86 lines)
- ✅ Task 4: State Persistence (storage.ts, persist middleware added)
- ✅ Task 5: App Lifecycle (useAppLifecycle.ts - 155 lines, LifecycleManager.ts - 116 lines)
- ✅ Task 6: Data Migration (migrationSystem.ts - 226 lines, trackMigrations.ts - 126 lines)
- ✅ Task 7: Performance Optimization (selectors.ts - 182 lines)
- ✅ Task 8: DevTools (devtools.ts - 187 lines)
- ✅ Task 9: Tests (5 test files: useTrackStore, useUIStore, migrations, persistence, useAppLifecycle)
- ⚠️ Task 10: Documentation (src/store/README.md created, but not in docs/ as specified)

**Critical Issues:**

- ❌ **3 test failures** (useAppLifecycle, migrations - blocking)
- ❌ **TypeScript compilation fails** - 28 errors (1 new Phase 7 error + 27 from Phase 6)
- ❌ **Test coverage**: Unknown (Phase 6 was 47.27%, below 80% threshold)
- ⚠️ **Linting**: 461 problems (240 errors, 221 warnings)
- ⚠️ **Formatting**: 16 files need formatting

### Verification Results:

- ❌ **Tests**: 3 failed, 3 skipped, 427 passed (26 total suites, 2 failed)
- ❌ **TypeScript compilation**: 28 errors
- ❌ **Linting**: 461 problems
- ❌ **Formatting**: 16 files fail prettier check
- ✅ **Commits**: Follow conventional format (8 commits for Phase 7)
- ⚠️ **Documentation**: README created but not in specified location

**Verdict:** Phase 7 cannot be approved until test failures are fixed and TypeScript compilation errors are resolved. The implementation is comprehensive but has quality issues that must be addressed.

---

## 🔍 Review Feedback

### **BLOCKING ISSUES (Must Fix):**

#### **1. Test Failure: useAppLifecycle - onActive callback not called**

> **Consider:** In `__tests__/unit/hooks/useAppLifecycle.test.ts:36-50`, the test expects `onActive` to be called when the app state changes to `'active'`. But look at your mock at line 12 - what is `AppState.currentState` set to?
>
> **Think about:** In `src/hooks/useAppLifecycle.ts:59-61`, what value is `previousStateRef` initialized to?
>
> **Reflect:** At line 69 of useAppLifecycle.ts, you check `if (currentState !== previousState)`. If both `previousStateRef` and the new state are `'active'`, will this condition be true?
>
> **Consider:** How could you fix the test? Should you:
>
> - Initialize `AppState.currentState` to a different state (like `'background'`) in the mock?
> - OR modify the test to trigger a state change from one state to another (not the same state)?

**Test Output:**

```
expect(jest.fn()).toHaveBeenCalledTimes(expected)
Expected number of calls: 1
Received number of calls: 0
```

#### **2. Test Failure: useBackgroundHandler - onForeground not called**

> **Consider:** This is the same issue as above. In `__tests__/unit/hooks/useAppLifecycle.test.ts:162-172`, the test for `useBackgroundHandler` has the same problem.
>
> **Reflect:** `useBackgroundHandler` calls `useAppLifecycle` with `onActive: onForeground`. Will `onActive` be called if the state doesn't actually change?

#### **3. Test Failure: migrations - non-versioned data loses fields**

> **Consider:** In `__tests__/unit/store/migrations.test.ts:204-218`, the test "should handle non-versioned data" passes `{ data: 'test' }` (no version wrapper).
>
> **Think about:** Look at `src/store/migrations/migrationSystem.ts:28-32`. What does this code do when `persistedData` is an object?
>
> ```typescript
> const versionedState: VersionedState<TState> =
>   typeof persistedData === "object" && persistedData !== null
>     ? persistedData
>     : { version: 0, state: persistedData };
> ```
>
> **Reflect:** If `persistedData` is `{ data: 'test' }`, the code treats the entire object as a `VersionedState`. What is `versionedState.version`? What is `versionedState.state`?
>
> **Consider:** At line 48, `currentState = versionedState.state`. If `versionedState.state` is `undefined`, what happens when the migration runs `{ ...undefined, migrated: true }`?
>
> **Think about:** How can you distinguish between:
>
> - Non-versioned data: `{ data: 'test' }` (should become `state` property)
> - Versioned data: `{ version: 1, state: { data: 'test' } }`
>
> **Reflect:** Should you check for the presence of a `version` property to determine if data is versioned?

**Test Output:**

```
expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 0

  Object {
-   "data": "test",
    "migrated": true,
  }
```

#### **4. TypeScript Error: devtools.ts Map type mismatch**

> **Consider:** At `src/store/devtools.ts:115-117`, you create a Map from `any` type:
>
> ```typescript
> const trackStatesMap = new Map(stateSnapshot.playback.trackStates);
> usePlaybackStore.setState({
>   trackStates: trackStatesMap,  // Line 117
> ```
>
> **Think about:** What type does TypeScript infer for `trackStatesMap` when created from `any`? Is it `Map<string, TrackState>` or `Map<unknown, unknown>`?
>
> **Reflect:** Should you add an explicit type annotation to `trackStatesMap`?
>
> ```typescript
> const trackStatesMap: Map<string, TrackState> = new Map(
>   stateSnapshot.playback.trackStates,
> );
> ```
>
> **Consider:** Alternatively, should you add types to the `importState` parameter to avoid `any`?

**TypeScript Error:**

```
src/store/devtools.ts(117,11): error TS2322: Type 'Map<unknown, unknown>' is not assignable to type 'Map<string, TrackState>'.
```

#### **5. Phase 6 FFmpeg Errors Still Present (27 errors)**

> **Consider:** Phase 7 inherits all 27 TypeScript errors from Phase 6 (FFmpeg API mismatch). These errors are documented in `docs/plans/Phase-6.md`.
>
> **Reflect:** Should Phase 6 issues be fixed before Phase 7 can be approved? Can you have 28 compilation errors and claim the code is ready?

### **QUALITY ISSUES (Important but non-blocking for Phase 7 approval):**

#### **6. Documentation Location**

> **Consider:** Task 10 specifies creating:
>
> - `docs/architecture/state-management.md`
> - `docs/guides/state-persistence.md`
>
> **Think about:** You created `src/store/README.md` (12,193 bytes). Is this the same as the two documentation files specified?
>
> **Reflect:** Should documentation live in `src/` or in `docs/`? What is the difference between:
>
> - Developer documentation (how to use the code)
> - Architecture documentation (design decisions, patterns)

#### **7. Linting and Formatting**

> **Consider:** There are 461 linting problems and 16 files needing formatting. Many are from Phase 6.
>
> **Reflect:** Should you run `npm run format` to fix the 16 formatting issues automatically?
>
> **Think about:** The 14 jest globals errors in `__mocks__/` - should you add `/* eslint-env jest */` at the top of those files?

#### **8. Test Coverage**

> **Consider:** Phase 6 had 47.27% coverage. What is Phase 7 coverage?
>
> **Reflect:** The success criteria specify coverage >80%. Are you meeting this threshold with comprehensive state management tests?
>
> **Think about:** You added 5 new test files with many tests. Did coverage improve or decline?

---

## Phase Goal

Implement comprehensive state management using Zustand and add data persistence so tracks, settings, and app state survive app restarts. Handle app lifecycle events and ensure data integrity across sessions.

**Success Criteria:**

- Zustand stores implemented for tracks, playback, UI state
- State persists to storage (AsyncStorage/localStorage)
- State restored on app launch
- App lifecycle handled (pause, resume, background)
- Data integrity maintained

**Estimated tokens:** ~95,000

---

## Prerequisites

- Phases 1-6 completed (all features functional)
- Understanding of Phase 0 ADR-005 (Zustand for state management)

---

## Tasks

### Task 1: Create Track Store

**Goal:** Implement Zustand store for managing track data.

**Files to Create:**

- `src/store/useTrackStore.ts` - Track state management

**Implementation Steps:**

1. Define track store interface:

   ```typescript
   interface TrackStore {
     tracks: Track[];
     addTrack: (track: Track) => void;
     removeTrack: (id: string) => void;
     updateTrack: (id: string, updates: Partial<Track>) => void;
     getTrack: (id: string) => Track | undefined;
     clearTracks: () => void;
   }
   ```

2. Implement store with Zustand:
   - Use `create` to define store
   - Implement immutable state updates
   - Add selectors for common queries

3. Add derived state:
   - Track count
   - Has playable tracks
   - Filtered tracks

4. Connect to UI:
   - Replace local state in components
   - Use store hooks in TrackList, MainScreen

**Verification Checklist:**

- [ ] Store created successfully
- [ ] CRUD operations work
- [ ] State updates trigger re-renders
- [ ] No state mutations

**Commit Message Template:**

```
feat(state): create track store with Zustand

- Define TrackStore interface and types
- Implement track CRUD operations
- Add derived state selectors
- Connect store to UI components
```

**Estimated tokens:** ~12,000

---

### Task 2: Create Playback Store

**Goal:** Manage playback state separately from track data.

**Files to Create:**

- `src/store/usePlaybackStore.ts` - Playback state

**Implementation Steps:**

1. Define playback store:

   ```typescript
   interface PlaybackStore {
     playingTracks: Set<string>;
     trackSettings: Map<string, { speed: number; volume: number }>;
     togglePlayback: (id: string) => void;
     setSpeed: (id: string, speed: number) => void;
     setVolume: (id: string, volume: number) => void;
     pauseAll: () => void;
   }
   ```

2. Implement state management
3. Sync with AudioService
4. Connect to TrackListItem controls

**Verification Checklist:**

- [ ] Playback state tracked per track
- [ ] Settings persisted per track
- [ ] UI reflects playback state
- [ ] Audio service synced

**Commit Message Template:**

```
feat(state): create playback store for audio state

- Implement PlaybackStore with Zustand
- Track playing state and settings per track
- Sync with AudioService
- Connect to playback controls UI
```

**Estimated tokens:** ~10,000

---

### Task 3: Create UI State Store

**Goal:** Manage UI-specific state (modals, dialogs, loading).

**Files to Create:**

- `src/store/useUIStore.ts` - UI state management

**Implementation Steps:**

1. Define UI store:

   ```typescript
   interface UIStore {
     saveModalVisible: boolean;
     mixingModalVisible: boolean;
     selectedTrackId: string | null;
     isRecording: boolean;
     isMixing: boolean;
     mixingProgress: number;
     errorMessage: string | null;
   }
   ```

2. Add actions for each state
3. Connect to modals and dialogs
4. Handle loading states

**Verification Checklist:**

- [ ] UI state centralized
- [ ] Modals controlled by store
- [ ] Loading states managed
- [ ] Error state handled

**Commit Message Template:**

```
feat(state): create UI state store

- Implement UIStore for modal/dialog state
- Manage loading and error states
- Control recording and mixing UI state
- Connect to UI components
```

**Estimated tokens:** ~8,000

---

### Task 4: Implement State Persistence

**Goal:** Persist state to storage using Zustand middleware.

**Files to Modify:**

- `src/store/useTrackStore.ts`
- `src/store/usePlaybackStore.ts`
- `src/store/useUIStore.ts`

**Implementation Steps:**

1. Install AsyncStorage:
   - `@react-native-async-storage/async-storage`

2. Add persist middleware to stores:

   ```typescript
   import { persist } from "zustand/middleware";

   const useTrackStore = create(
     persist(
       (set) => ({
         /* store */
       }),
       {
         name: "looper-tracks",
         storage: createJSONStorage(() => AsyncStorage),
       },
     ),
   );
   ```

3. Configure what to persist:
   - Tracks: persist
   - Playback settings: persist
   - UI state: mostly don't persist (except preferences)

4. Handle hydration:
   - Wait for persistence to load
   - Show loading screen during hydration
   - Handle migration from old data

5. Handle serialization:
   - Sets/Maps need custom serialization
   - File URIs may need validation
   - Clean invalid data on load

Reference Android:

- `../app/src/main/java/gemenie/looper/MainActivity.java:360-378` (save instance state)

**Verification Checklist:**

- [ ] State persists across app restarts
- [ ] Tracks restored correctly
- [ ] Playback settings restored
- [ ] Invalid data handled
- [ ] Hydration doesn't block UI

**Commit Message Template:**

```
feat(state): add persistence with Zustand middleware

- Install AsyncStorage for storage
- Add persist middleware to stores
- Configure serialization for complex types
- Handle hydration and data migration
- Validate and clean persisted data
```

**Estimated tokens:** ~15,000

---

### Task 5: Handle App Lifecycle Events

**Goal:** Properly handle app pause, resume, and background states.

**Files to Create:**

- `src/hooks/useAppLifecycle.ts` - Lifecycle hook
- `src/services/lifecycle/LifecycleManager.ts` - Lifecycle manager

**Implementation Steps:**

1. Use React Native AppState:
   - Listen to state changes (active, background, inactive)
   - Pause playback when backgrounded
   - Resume when foregrounded

2. Handle audio focus (native):
   - Pause when phone call comes
   - Pause when other apps play audio
   - Resume when audio focus regained

3. Save state on background:
   - Ensure tracks saved before background
   - Clean up temp files
   - Release audio resources

4. Handle app termination:
   - Save state before quit
   - Clean up properly

5. Web-specific handling:
   - visibilitychange event
   - beforeunload event
   - Pause audio when tab hidden

Reference Android:

- `../app/src/main/java/gemenie/looper/MainActivity.java:381-389` (onDestroy)

**Verification Checklist:**

- [ ] Playback pauses when backgrounded
- [ ] State saved on background
- [ ] Audio resources released
- [ ] Works on all platforms

**Commit Message Template:**

```
feat(lifecycle): handle app lifecycle events

- Create useAppLifecycle hook for state monitoring
- Pause playback when app backgrounded
- Save state before termination
- Handle audio focus on native
- Support web visibility changes
```

**Estimated tokens:** ~13,000

---

### Task 6: Implement Data Migration and Versioning

**Goal:** Handle data schema changes across app versions.

**Files to Create:**

- `src/store/migrations/` - Migration utilities
- `src/store/migrations/trackMigrations.ts` - Track data migrations

**Implementation Steps:**

1. Add version to persisted state:

   ```typescript
   {
     version: 1,
     state: { /* actual state */ }
   }
   ```

2. Create migration functions:
   - v1 → v2: add new field
   - v2 → v3: rename field
   - etc.

3. Run migrations on hydration:
   - Check current version
   - Apply needed migrations sequentially
   - Update version after migration

4. Handle failed migrations:
   - Log error
   - Optionally reset to defaults
   - Don't lose user data if possible

5. Add schema validation:
   - Validate structure on load
   - Fix common issues automatically
   - Warn on validation failures

**Verification Checklist:**

- [ ] Migrations run on version mismatch
- [ ] Data preserved after migration
- [ ] Failed migrations handled
- [ ] Schema validation works

**Commit Message Template:**

```
feat(state): implement data migration and versioning

- Add version field to persisted state
- Create migration system for schema changes
- Handle migration failures gracefully
- Validate data schema on load
```

**Estimated tokens:** ~12,000

---

### Task 7: Optimize Performance and Memory

**Goal:** Ensure state management doesn't cause performance issues.

**Files to Modify:**

- All store files

**Implementation Steps:**

1. Use Zustand selectors:
   - Select only needed state slices
   - Prevent unnecessary re-renders
   - Use shallow equality checks

2. Memoize expensive computations:
   - Derived state calculations
   - Filters and sorts
   - Complex transformations

3. Limit storage size:
   - Don't persist large files (just URIs)
   - Limit track history
   - Clean old data periodically

4. Debounce frequent updates:
   - Slider changes
   - Progress updates
   - Batched updates

5. Profile performance:
   - Check re-render counts
   - Monitor memory usage
   - Identify bottlenecks

**Verification Checklist:**

- [ ] No unnecessary re-renders
- [ ] Memory usage acceptable
- [ ] UI remains responsive
- [ ] Large state handled efficiently

**Commit Message Template:**

```
perf(state): optimize state management performance

- Use Zustand selectors to minimize re-renders
- Memoize expensive computations
- Limit persisted data size
- Debounce frequent state updates
```

**Estimated tokens:** ~10,000

---

### Task 8: Add State DevTools and Debugging

**Goal:** Add tools for debugging state management.

**Files to Create:**

- `src/store/devtools.ts` - DevTools integration

**Implementation Steps:**

1. Add Zustand DevTools:
   - Integrate Redux DevTools extension
   - View state changes in browser
   - Time-travel debugging

2. Add logging middleware:
   - Log state changes in development
   - Track action history
   - Measure performance

3. Add state inspector:
   - Show current state in UI (dev only)
   - Export state for debugging
   - Import state for testing

4. Add state reset:
   - Clear all state (dev only)
   - Reset to defaults
   - Useful for testing

**Verification Checklist:**

- [ ] DevTools work in development
- [ ] State changes visible
- [ ] Logging helps debugging
- [ ] Only enabled in dev mode

**Commit Message Template:**

```
dev(state): add state devtools and debugging

- Integrate Redux DevTools for state inspection
- Add logging middleware for development
- Create state inspector UI
- Add state reset functionality
```

**Estimated tokens:** ~8,000

---

### Task 9: Add Tests for State Management

**Goal:** Comprehensively test stores and persistence.

**Files to Create:**

- `__tests__/unit/store/useTrackStore.test.ts`
- `__tests__/unit/store/usePlaybackStore.test.ts`
- `__tests__/unit/store/useUIStore.test.ts`
- `__tests__/integration/statePersistence.test.ts`

**Implementation Steps:**

1. Test track store:
   - CRUD operations
   - Derived state
   - State immutability

2. Test playback store:
   - Playback state management
   - Settings updates
   - Sync with audio service

3. Test UI store:
   - Modal state
   - Loading states
   - Error handling

4. Test persistence:
   - Save and load state
   - Hydration
   - Migrations
   - Schema validation

5. Integration tests:
   - Full state lifecycle
   - Cross-store interactions
   - App lifecycle scenarios

**Verification Checklist:**

- [ ] All unit tests pass
- [ ] Integration tests cover main flows
- [ ] Coverage >80%
- [ ] Persistence tested

**Commit Message Template:**

```
test(state): add comprehensive state management tests

- Test all Zustand stores
- Add persistence and hydration tests
- Test migration and versioning
- Add integration tests for state lifecycle
```

**Estimated tokens:** ~10,000

---

### Task 10: Documentation

**Goal:** Document state management architecture.

**Files to Create:**

- `docs/architecture/state-management.md`
- `docs/guides/state-persistence.md`

**Implementation Steps:**

1. Document state architecture
2. Explain each store's purpose
3. Document persistence strategy
4. Explain lifecycle handling
5. Add migration guide

**Verification Checklist:**

- [ ] Documentation complete
- [ ] Examples accurate
- [ ] Migration process documented

**Commit Message Template:**

```
docs(state): document state management architecture

- Create state management documentation
- Document persistence and hydration
- Explain lifecycle handling
- Add migration guide
```

**Estimated tokens:** ~7,000

---

## Phase Verification

1. **State Management:**
   - Stores control app state
   - UI synced with state
   - No prop drilling

2. **Persistence:**
   - State survives app restart
   - Data loaded correctly
   - Migrations work

3. **Lifecycle:**
   - App handles background/foreground
   - Audio paused appropriately
   - Resources released

4. **Tests:**
   - All tests pass
   - Coverage >80%

---

## Next Phase

Proceed to **[Phase 8: Testing & Quality Assurance](./Phase-8.md)**.
