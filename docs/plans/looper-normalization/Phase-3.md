# Phase 3: Settings Page & Configuration

## Phase Goal

Create a comprehensive settings screen where users can configure looping behavior, export defaults, recording preferences, and other options. Implement settings persistence so preferences survive app restarts. This phase makes the looper fully customizable while maintaining sensible defaults.

**Success Criteria**:
- Settings screen accessible from main screen
- All settings from Phase 0 ADR-006 implemented
- Settings persist across app restarts
- Settings integrate with existing stores and components
- Settings screen tested and accessible
- Works on web and mobile platforms

**Estimated tokens**: ~75,000

---

## Prerequisites

- Phase 0 reviewed
- Phase 1 complete (settings store created)
- Phase 2 complete (UI components)
- Familiarity with React Navigation (app uses it for screen navigation)

---

## Tasks

### Task 1: Create Settings Screen UI

**Goal**: Build the settings screen with all configuration options organized into logical sections.

**Files to Create**:
- `src/screens/SettingsScreen/SettingsScreen.tsx` - Settings screen component
- `src/screens/SettingsScreen/SettingsScreen.styles.ts` - Styles
- `src/screens/SettingsScreen/__tests__/SettingsScreen.test.tsx` - Tests
- `src/screens/SettingsScreen/index.ts` - Re-export

**Prerequisites**: Phase 1 Task 2 (settings store exists)

**Implementation Steps**:

1. Create SettingsScreen component structure:
   - Use ScrollView for vertical scrolling
   - Organize into sections: Looping, Export, Recording
   - Use React Native Paper components for consistency (List, Switch, Slider, etc.)

2. **Looping Behavior Section**:
   - **Crossfade Duration**: Slider (0-50ms)
     - Label: "Loop Crossfade"
     - Description: "Smooth transition at loop boundaries (0ms = gapless)"
     - Display current value
   - **Default Loop Mode**: Switch (ON/OFF)
     - Label: "Default Loop Mode"
     - Description: "Enable looping by default when app starts"

3. **Export Settings Section**:
   - **Default Loop Count**: Radio buttons or picker (1, 2, 4, 8, custom)
     - Label: "Loop Repetitions"
     - Description: "Number of loops to include in exported audio"
     - If custom selected, show number input
   - **Default Fadeout Duration**: Radio buttons or picker (None, 1s, 2s, 5s, custom)
     - Label: "Fadeout Duration"
     - Description: "Apply fadeout at end of export"
     - If custom selected, show number input (in seconds)
   - **Export Format**: Dropdown/Picker (MP3, WAV)
     - Label: "Export Format"
   - **Export Quality**: Dropdown/Picker (Low, Medium, High)
     - Label: "Export Quality"

4. **Recording Settings Section**:
   - **Recording Format**: Dropdown/Picker (based on platform)
   - **Recording Quality**: Dropdown/Picker (Low, Medium, High)

5. **Actions Section** (at bottom):
   - **Reset to Defaults** button
     - Shows confirmation dialog before resetting

6. Connect to settings store:
   - Read current values from `useSettingsStore`
   - Update store on any setting change
   - Debounce slider changes to avoid excessive updates

7. Add header with back navigation

8. Style appropriately:
   - Group sections visually (dividers or cards)
   - Consistent spacing
   - Clear labels and descriptions
   - Responsive layout

9. Write tests:
   - Test rendering all settings
   - Test changing each setting updates store
   - Test reset to defaults
   - Test navigation

**Verification Checklist**:
- [ ] All settings from ADR-006 present
- [ ] Settings organized into logical sections
- [ ] Changing settings updates store immediately
- [ ] Reset to defaults works correctly
- [ ] UI is clear and easy to navigate
- [ ] Works on web and mobile
- [ ] Tests cover all settings and interactions

**Testing Instructions**:

```typescript
describe('SettingsScreen', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetToDefaults();
  });

  it('renders all settings sections', () => {
    const { getByText } = render(<SettingsScreen />);

    expect(getByText('Looping Behavior')).toBeTruthy();
    expect(getByText('Export Settings')).toBeTruthy();
    expect(getByText('Recording Settings')).toBeTruthy();
  });

  it('displays current setting values', () => {
    useSettingsStore.setState({
      loopCrossfadeDuration: 25,
      defaultLoopMode: true,
    });

    const { getByTestId } = render(<SettingsScreen />);

    const crossfadeSlider = getByTestId('crossfade-slider');
    expect(crossfadeSlider.props.value).toBe(25);

    const loopModeSwitch = getByTestId('loop-mode-switch');
    expect(loopModeSwitch.props.value).toBe(true);
  });

  it('updates store when settings changed', () => {
    const { getByTestId } = render(<SettingsScreen />);

    // Change crossfade duration
    const slider = getByTestId('crossfade-slider');
    fireEvent(slider, 'valueChange', 30);

    expect(useSettingsStore.getState().loopCrossfadeDuration).toBe(30);
  });

  it('shows confirmation before resetting to defaults', () => {
    useSettingsStore.setState({ loopCrossfadeDuration: 30 });

    const { getByText } = render(<SettingsScreen />);

    // Press reset button
    fireEvent.press(getByText('Reset to Defaults'));

    // Verify confirmation dialog
    expect(getByText(/reset all settings/i)).toBeTruthy();
  });

  it('resets all settings when confirmed', () => {
    useSettingsStore.setState({
      loopCrossfadeDuration: 30,
      defaultLoopCount: 8,
      defaultFadeoutDuration: 5000,
    });

    const { getByText } = render(<SettingsScreen />);

    // Reset
    fireEvent.press(getByText('Reset to Defaults'));
    fireEvent.press(getByText('Confirm'));

    // Verify defaults restored
    const state = useSettingsStore.getState();
    expect(state.loopCrossfadeDuration).toBe(0);
    expect(state.defaultLoopCount).toBe(4);
    expect(state.defaultFadeoutDuration).toBe(2000);
  });
});
```

Run tests: `npm test -- SettingsScreen.test.tsx`

**Commit Message Template**:
```
feat(settings): create settings screen UI

- Implement settings screen with all configuration options
- Organize into looping, export, and recording sections
- Connect to settings store for persistence
- Add reset to defaults with confirmation
- Include comprehensive tests
```

**Estimated tokens**: ~20,000

---

### Task 2: Add Settings Navigation

**Goal**: Add a way to navigate to the settings screen from the main screen (button, menu, or tab).

**Files to Modify**:
- Navigation configuration (e.g., `App.tsx` or navigation setup file)
- `src/screens/MainScreen/MainScreen.tsx` - Add settings button
- `src/screens/SettingsScreen/SettingsScreen.tsx` - Add back navigation

**Prerequisites**: Task 1 complete

**Implementation Steps**:

1. Register SettingsScreen in navigation:
   - If using stack navigator, add SettingsScreen to stack
   - Configure header title: "Settings"
   - Configure back button behavior

2. Add settings button to MainScreen:
   - Use gear/cog icon button
   - Position in header (top-right) or as floating action button
   - On press, navigate to SettingsScreen

3. Add back navigation to SettingsScreen:
   - Use native header back button OR
   - Add custom back button in header
   - Ensure back button returns to MainScreen

4. Handle deep linking (if applicable):
   - Allow direct navigation to settings via URL (web)

5. Test navigation:
   - Navigate to settings and back
   - Verify state preserved on return
   - Test on web and mobile

**Verification Checklist**:
- [ ] Settings button visible on main screen
- [ ] Pressing settings button navigates to settings screen
- [ ] Back button on settings screen returns to main screen
- [ ] Navigation animations smooth (if applicable)
- [ ] Works on web and mobile
- [ ] Tests verify navigation

**Testing Instructions**:

```typescript
describe('Settings Navigation', () => {
  it('navigates to settings screen when button pressed', () => {
    const navigation = createMockNavigation();
    const { getByTestId } = render(<MainScreen navigation={navigation} />);

    const settingsButton = getByTestId('settings-button');
    fireEvent.press(settingsButton);

    expect(navigation.navigate).toHaveBeenCalledWith('Settings');
  });

  it('navigates back to main screen from settings', () => {
    const navigation = createMockNavigation();
    const { getByTestId } = render(<SettingsScreen navigation={navigation} />);

    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);

    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('preserves main screen state when returning from settings', () => {
    // This test may require navigation stack testing
    // Verify tracks, playback state, etc. are preserved
  });
});
```

Run tests: `npm test -- navigation`

**Commit Message Template**:
```
feat(navigation): add settings screen to navigation

- Register settings screen in navigation stack
- Add settings button to main screen header
- Configure back navigation from settings
- Add navigation tests
```

**Estimated tokens**: ~10,000

---

### Task 3: Implement Settings Persistence

**Goal**: Ensure settings persist across app restarts using platform-appropriate storage (localStorage for web, AsyncStorage for mobile).

**Files to Modify**:
- `src/store/useSettingsStore.ts` - Add persistence middleware
- Create platform-specific persistence utilities if needed

**Prerequisites**: Phase 1 Task 2 (settings store created)

**Implementation Steps**:

1. Choose persistence strategy:
   - **Web**: Use localStorage
   - **Native**: Use AsyncStorage or Expo SecureStore
   - **Cross-platform**: Use Zustand persist middleware with platform-specific storage adapter

2. Implement persistence for settings store:
   - Serialize store state to JSON
   - Save to storage on state changes (debounced)
   - Load from storage on app initialization
   - Handle JSON parse errors gracefully

3. Create storage adapter:
   ```typescript
   // src/utils/settingsStorage.ts
   const storage = {
     getItem: async (key: string) => {
       // Platform-specific implementation
     },
     setItem: async (key: string, value: string) => {
       // Platform-specific implementation
     },
     removeItem: async (key: string) => {
       // Platform-specific implementation
     },
   };
   ```

4. Apply persistence to settings store:
   - Use Zustand's persist middleware OR
   - Implement custom persistence logic
   - Ensure hydration happens before first render

5. Handle versioning:
   - Include version number in persisted data
   - Migrate old format if needed (e.g., from Phase 1 to Phase 3)

6. Test persistence:
   - Change settings
   - Simulate app restart (reload page, kill and restart app)
   - Verify settings loaded correctly
   - Test with corrupted data (should fallback to defaults)
   - Test with missing data (first launch)

**Verification Checklist**:
- [ ] Settings persist on web (localStorage)
- [ ] Settings persist on mobile (AsyncStorage)
- [ ] Settings load correctly on app start
- [ ] Corrupted data handled gracefully
- [ ] First launch uses defaults
- [ ] Performance acceptable (no slow app start)
- [ ] Tests cover persistence scenarios

**Testing Instructions**:

```typescript
describe('Settings Persistence', () => {
  beforeEach(async () => {
    // Clear storage
    await AsyncStorage.clear(); // or localStorage.clear() on web
  });

  it('saves settings to storage when changed', async () => {
    useSettingsStore.getState().updateSettings({
      loopCrossfadeDuration: 25,
    });

    // Wait for debounced save
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('settings');
    });

    const stored = await AsyncStorage.getItem('settings');
    const parsed = JSON.parse(stored);
    expect(parsed.loopCrossfadeDuration).toBe(25);
  });

  it('loads settings from storage on initialization', async () => {
    // Pre-populate storage
    const settings = {
      loopCrossfadeDuration: 30,
      defaultLoopMode: false,
    };
    await AsyncStorage.setItem('settings', JSON.stringify(settings));

    // Reinitialize store (may require test utility to reset)
    const store = createSettingsStore(); // Or whatever your initialization is

    // Wait for hydration
    await waitFor(() => {
      expect(store.getState().loopCrossfadeDuration).toBe(30);
      expect(store.getState().defaultLoopMode).toBe(false);
    });
  });

  it('uses defaults when storage is empty', async () => {
    const store = createSettingsStore();

    await waitFor(() => {
      const state = store.getState();
      expect(state.loopCrossfadeDuration).toBe(0); // Default
      expect(state.defaultLoopMode).toBe(true); // Default
    });
  });

  it('handles corrupted storage gracefully', async () => {
    // Store invalid JSON
    await AsyncStorage.setItem('settings', 'invalid json {{{');

    const store = createSettingsStore();

    // Should fallback to defaults without crashing
    await waitFor(() => {
      expect(store.getState().loopCrossfadeDuration).toBe(0);
    });
  });
});
```

Run tests: `npm test -- settingsStorage`

**Commit Message Template**:
```
feat(settings): implement settings persistence

- Add platform-specific storage adapter
- Implement persistence for settings store
- Handle hydration on app start
- Add error handling for corrupted data
- Include persistence tests
```

**Estimated tokens**: ~15,000

---

### Task 4: Connect Settings to Loop Mode Default

**Goal**: Ensure the default loop mode setting is applied when the app starts or when playback store is reset.

**Files to Modify**:
- `src/store/usePlaybackStore.ts` - Read default from settings on init
- `src/store/__tests__/usePlaybackStore.test.ts` - Add tests

**Prerequisites**: Task 3 complete (settings persistence working)

**Implementation Steps**:

1. Update playback store initialization:
   - On store creation, read `defaultLoopMode` from settings store
   - Set initial `loopMode` state to this value
   - **Ensure this happens after settings hydration** to avoid race conditions:
     ```typescript
     // Option A: Use Zustand persist onRehydrateStorage callback
     const usePlaybackStore = create(
       persist((set, get) => ({
         loopMode: false, // Temporary default
         _hasHydrated: false,
       }), {
         name: 'playback-storage',
         onRehydrateStorage: () => (state) => {
           // Sync with settings after hydration
           if (state) {
             state.loopMode = useSettingsStore.getState().defaultLoopMode;
             state._hasHydrated = true;
           }
         }
       })
     );

     // Option B: Subscribe to settings hydration and update
     // In playback store initialization
     useSettingsStore.persist.onFinishHydration(() => {
       usePlaybackStore.setState({
         loopMode: useSettingsStore.getState().defaultLoopMode
       });
     });
     ```

2. Update `reset()` action in playback store:
   - When resetting, read current default from settings
   - Don't hardcode default value

3. Handle settings changes:
   - When user changes default loop mode in settings, it should affect NEW sessions
   - Current session loop mode remains unchanged (user might have toggled it mid-session)

4. Test integration:
   - Change default in settings
   - Restart app (or reset playback store)
   - Verify new default applied

**Verification Checklist**:
- [ ] Playback store reads default from settings
- [ ] Default applied on app start
- [ ] Reset action uses current default
- [ ] Changing setting affects future sessions
- [ ] Tests verify integration

**Testing Instructions**:

```typescript
describe('Playback Store - Settings Integration', () => {
  it('initializes loop mode from settings default', () => {
    useSettingsStore.setState({ defaultLoopMode: false });

    // Create new playback store (or reset)
    const playbackStore = createPlaybackStore();

    expect(playbackStore.getState().loopMode).toBe(false);
  });

  it('uses updated default when reset', () => {
    const playbackStore = usePlaybackStore.getState();

    // Start with one default
    useSettingsStore.setState({ defaultLoopMode: true });
    playbackStore.reset();
    expect(playbackStore.loopMode).toBe(true);

    // Change default
    useSettingsStore.setState({ defaultLoopMode: false });
    playbackStore.reset();
    expect(playbackStore.loopMode).toBe(false);
  });

  it('does not change current loop mode when settings changed mid-session', () => {
    const playbackStore = usePlaybackStore.getState();

    // Start session
    useSettingsStore.setState({ defaultLoopMode: true });
    playbackStore.reset();
    expect(playbackStore.loopMode).toBe(true);

    // User toggles loop mode
    playbackStore.setLoopMode(false);

    // Settings changed
    useSettingsStore.setState({ defaultLoopMode: true });

    // Current session NOT affected
    expect(playbackStore.loopMode).toBe(false);
  });
});
```

Run tests: `npm test -- usePlaybackStore.test.ts`

**Commit Message Template**:
```
feat(stores): connect settings default to loop mode

- Initialize loop mode from settings default
- Update reset action to use current default
- Add tests for settings integration
```

**Estimated tokens**: ~10,000

---

### Task 5: Add Crossfade Setting Integration (Placeholder)

**Goal**: Add the crossfade setting to the settings store and UI, but note that actual crossfade implementation in audio mixing is deferred to Phase 4.

**Files to Modify**:
- `src/screens/SettingsScreen/SettingsScreen.tsx` - Already added in Task 1
- `src/store/useSettingsStore.ts` - Verify crossfade setting exists

**Prerequisites**: Tasks 1 and 3 complete

**Implementation Steps**:

1. Verify `loopCrossfadeDuration` is in settings store (should be from Phase 1)

2. Verify crossfade slider is in SettingsScreen UI (should be from Task 1)

3. Add TODO comment in audio mixer files indicating where crossfade will be applied:
   ```typescript
   // TODO (Phase 4): Apply crossfade from settings when looping tracks
   // const crossfadeDuration = useSettingsStore.getState().loopCrossfadeDuration;
   ```

4. Document in Phase 3 completion notes that crossfade UI exists but functionality is in Phase 4

5. Write placeholder test:
   ```typescript
   it.todo('applies crossfade duration from settings to looped tracks');
   ```

**Verification Checklist**:
- [ ] Crossfade setting in store
- [ ] Crossfade slider in UI
- [ ] Setting persists correctly
- [ ] TODO comments added for Phase 4 implementation
- [ ] Documented in completion notes

**Testing Instructions**:

```typescript
describe('Crossfade Setting', () => {
  it('persists crossfade duration setting', () => {
    const { getByTestId } = render(<SettingsScreen />);

    const slider = getByTestId('crossfade-slider');
    fireEvent(slider, 'valueChange', 25);

    expect(useSettingsStore.getState().loopCrossfadeDuration).toBe(25);
  });

  it.todo('applies crossfade duration from settings to looped tracks');
});
```

**Commit Message Template**:
```
feat(settings): add crossfade setting (UI only)

- Add crossfade duration slider to settings screen
- Verify setting persists correctly
- Add TODO comments for Phase 4 implementation
- Note: Actual crossfade mixing in Phase 4
```

**Estimated tokens**: ~8,000

---

### Task 6: Add Help/Info Section to Settings

**Goal**: Add a help or about section to settings screen with information about the looper feature and how to use it.

**Files to Modify**:
- `src/screens/SettingsScreen/SettingsScreen.tsx` - Add help section
- Optionally update existing HelpModal component

**Prerequisites**: Task 1 complete

**Implementation Steps**:

1. Add "Help & Info" section to settings screen:
   - Version number (read from package.json)
   - Link to user guide (if exists)
   - Link to GitHub issues for bug reports
   - Brief explanation of master loop concept

2. Add expandable section explaining looper functionality:
   - "How Master Loop Works"
   - "What is Loop Mode?"
   - "Understanding Track Repetition"
   - Link to full documentation or in-app tutorial

3. Style consistently with rest of settings screen

4. Make links functional:
   - Open external links in browser
   - Navigate to internal screens if applicable

5. Test help section displays correctly

**Verification Checklist**:
- [ ] Help section visible in settings
- [ ] Version number correct
- [ ] Links functional
- [ ] Information clear and helpful
- [ ] Works on web and mobile

**Testing Instructions**:

```typescript
describe('Settings - Help Section', () => {
  it('displays app version', () => {
    const { getByText } = render(<SettingsScreen />);

    expect(getByText(/Version 1.0.0/i)).toBeTruthy(); // Or actual version
  });

  it('provides looper feature explanation', () => {
    const { getByText } = render(<SettingsScreen />);

    expect(getByText(/Master Loop/i)).toBeTruthy();
    expect(getByText(/Loop Mode/i)).toBeTruthy();
  });

  it('has functional link to documentation', () => {
    const { getByText } = render(<SettingsScreen />);
    const link = getByText('User Guide');

    fireEvent.press(link);

    // Verify link opened (may need to mock Linking module)
    expect(Linking.openURL).toHaveBeenCalled();
  });
});
```

**Commit Message Template**:
```
feat(settings): add help and info section

- Add version number and links to settings
- Include looper feature explanation
- Add links to documentation and support
- Test help section rendering and links
```

**Estimated tokens**: ~12,000

---

## Phase Verification

After completing all tasks, verify Phase 3 is complete:

### Automated Verification
```bash
# Run all tests
npm test

# Run only Phase 3 tests
npm test -- SettingsScreen.test.tsx
npm test -- settingsStorage
npm test -- navigation

# Check test coverage
npm test -- --coverage
```

**Expected Results**:
- All tests pass
- Code coverage ≥ 80% for new code
- No existing tests broken

### Manual Testing Scenarios

#### Scenario 1: Settings Screen Access and Navigation
1. Open app
2. Tap settings button (gear icon)
3. **Verify**: Settings screen opens
4. **Verify**: All sections visible (Looping, Export, Recording, Help)
5. Tap back button
6. **Verify**: Returns to main screen
7. **Verify**: App state preserved

#### Scenario 2: Looping Settings
1. Navigate to settings
2. Adjust crossfade slider
3. **Verify**: Value updates in real-time
4. Toggle default loop mode switch
5. **Verify**: Switch state changes
6. Navigate away and back
7. **Verify**: Settings preserved

#### Scenario 3: Export Settings
1. Navigate to settings
2. Change default loop count (e.g., to 8)
3. Change default fadeout (e.g., to 5s)
4. Change export format (e.g., to WAV)
5. Change export quality (e.g., to Low)
6. **Verify**: All changes reflected in UI
7. Navigate away
8. **Verify**: Save dialog (in Phase 4) will use these defaults

#### Scenario 4: Settings Persistence
1. Change multiple settings
2. Close app completely (web: close tab, mobile: kill app)
3. Reopen app
4. Navigate to settings
5. **Verify**: All changed settings retained

#### Scenario 5: Reset to Defaults
1. Change several settings away from defaults
2. Scroll to bottom, tap "Reset to Defaults"
3. **Verify**: Confirmation dialog appears
4. Cancel
5. **Verify**: Settings unchanged
6. Tap "Reset to Defaults" again
7. Confirm
8. **Verify**: All settings revert to defaults

#### Scenario 6: Default Loop Mode Integration
1. Navigate to settings
2. Turn OFF default loop mode
3. Navigate to main screen
4. Restart app (or simulate by resetting stores)
5. **Verify**: Loop mode toggle on main screen is OFF

### Integration Points Tested

- ✅ Settings screen integrated into navigation
- ✅ Settings store persists across restarts
- ✅ Default loop mode setting affects playback store
- ✅ All settings accessible and functional
- ✅ Reset to defaults works correctly
- ✅ Help section provides useful information

### Known Limitations (to be addressed in later phases)

- Crossfade setting exists but not applied to audio yet (Phase 4)
- Export default settings exist but not used in save dialog yet (Phase 4)
- Recording default settings exist but not used in recorder yet (Phase 5)

---

## Next Steps

Proceed to **Phase 4: Save/Export Enhancements** to implement loop repetition in exported audio and configurable fadeout.

**Phase 4 Preview**:
- Enhanced save dialog with loop count and fadeout options
- Audio mixer updates to duplicate tracks for loop repetitions
- Fadeout implementation in final mix
- Export using settings defaults
- Progress tracking for longer exports
- Testing with various loop configurations
