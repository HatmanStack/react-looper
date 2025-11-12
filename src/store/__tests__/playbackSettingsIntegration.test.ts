/**
 * Playback Store - Settings Integration Tests
 *
 * Tests for integration between playback store and settings store
 */

import { usePlaybackStore } from "../usePlaybackStore";
import { useSettingsStore } from "../useSettingsStore";

describe("Playback Store - Settings Integration", () => {
  beforeEach(() => {
    // Reset both stores to defaults
    useSettingsStore.getState().resetToDefaults();
    usePlaybackStore.getState().reset();
  });

  it("initializes loop mode from settings default", () => {
    // Set a custom default in settings
    useSettingsStore.getState().updateSettings({ defaultLoopMode: false });

    // Create new playback store state (simulating app restart)
    // Note: In actual implementation, this would be the initial store creation
    const playbackState = usePlaybackStore.getState();

    // Verify loop mode matches settings (may need to reset to pick up new default)
    usePlaybackStore.getState().reset();
    expect(usePlaybackStore.getState().loopMode).toBe(false);
  });

  it("uses updated default when reset is called", () => {
    // Start with default (true)
    useSettingsStore.setState({ defaultLoopMode: true });
    usePlaybackStore.getState().reset();
    expect(usePlaybackStore.getState().loopMode).toBe(true);

    // Change settings default
    useSettingsStore.setState({ defaultLoopMode: false });
    usePlaybackStore.getState().reset();
    expect(usePlaybackStore.getState().loopMode).toBe(false);

    // Change back
    useSettingsStore.setState({ defaultLoopMode: true });
    usePlaybackStore.getState().reset();
    expect(usePlaybackStore.getState().loopMode).toBe(true);
  });

  it("does not change current loop mode when settings changed mid-session", () => {
    // Start with default true
    useSettingsStore.setState({ defaultLoopMode: true });
    usePlaybackStore.getState().reset();
    expect(usePlaybackStore.getState().loopMode).toBe(true);

    // User toggles loop mode during session
    usePlaybackStore.getState().setLoopMode(false);
    expect(usePlaybackStore.getState().loopMode).toBe(false);

    // Settings default changed (shouldn't affect current session)
    useSettingsStore.setState({ defaultLoopMode: true });

    // Current session loop mode remains unchanged
    expect(usePlaybackStore.getState().loopMode).toBe(false);
  });

  it("new session uses latest settings default", () => {
    // Change default to false
    useSettingsStore.setState({ defaultLoopMode: false });

    // Start new session (reset)
    usePlaybackStore.getState().reset();

    // Verify new session uses updated default
    expect(usePlaybackStore.getState().loopMode).toBe(false);
  });

  it("toggleLoopMode does not affect settings default", () => {
    // Set settings default
    useSettingsStore.setState({ defaultLoopMode: true });

    // User toggles loop mode
    usePlaybackStore.getState().toggleLoopMode();
    expect(usePlaybackStore.getState().loopMode).toBe(false);

    // Settings default should remain unchanged
    expect(useSettingsStore.getState().defaultLoopMode).toBe(true);

    // New session should still use settings default
    usePlaybackStore.getState().reset();
    expect(usePlaybackStore.getState().loopMode).toBe(true);
  });

  it("reads current settings default each time reset is called", () => {
    // Multiple resets with different settings
    const testCases = [
      { setting: true, expected: true },
      { setting: false, expected: false },
      { setting: true, expected: true },
    ];

    testCases.forEach(({ setting, expected }) => {
      useSettingsStore.setState({ defaultLoopMode: setting });
      usePlaybackStore.getState().reset();
      expect(usePlaybackStore.getState().loopMode).toBe(expected);
    });
  });
});
