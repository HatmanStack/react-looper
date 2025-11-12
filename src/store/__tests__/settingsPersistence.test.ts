/**
 * Settings Persistence Tests
 *
 * Tests for settings store persistence functionality
 */

import { useSettingsStore } from "../useSettingsStore";

describe("Settings Persistence", () => {
  beforeEach(() => {
    // Reset store to defaults before each test
    useSettingsStore.getState().resetToDefaults();
  });

  it("has persist middleware configured", () => {
    // Verify the store has persist method (indicates persist middleware is active)
    expect(useSettingsStore.persist).toBeDefined();
    expect(typeof useSettingsStore.persist).toBe("object");
  });

  it("store state includes all required settings", () => {
    const state = useSettingsStore.getState();

    // Verify all settings exist
    expect(typeof state.loopCrossfadeDuration).toBe("number");
    expect(typeof state.defaultLoopMode).toBe("boolean");
    expect(typeof state.defaultLoopCount).toBe("number");
    expect(typeof state.defaultFadeout).toBe("number");
    expect(typeof state.exportFormat).toBe("string");
    expect(typeof state.exportQuality).toBe("string");
    expect(typeof state.recordingFormat).toBe("string");
    expect(typeof state.recordingQuality).toBe("string");
  });

  it("defaults are correctly set", () => {
    const state = useSettingsStore.getState();

    // Verify default values
    expect(state.loopCrossfadeDuration).toBe(0);
    expect(state.defaultLoopMode).toBe(true);
    expect(state.defaultLoopCount).toBe(4);
    expect(state.defaultFadeout).toBe(2000);
    expect(state.exportFormat).toBe("mp3");
    expect(state.exportQuality).toBe("high");
    expect(state.recordingFormat).toBe("m4a");
    expect(state.recordingQuality).toBe("high");
  });

  it("updates settings correctly", () => {
    // Change multiple settings
    useSettingsStore.getState().updateSettings({
      loopCrossfadeDuration: 30,
      defaultLoopCount: 8,
      defaultFadeout: 5000,
    });

    const state = useSettingsStore.getState();

    expect(state.loopCrossfadeDuration).toBe(30);
    expect(state.defaultLoopCount).toBe(8);
    expect(state.defaultFadeout).toBe(5000);
  });

  it("resets to defaults correctly", () => {
    // Change settings
    useSettingsStore.getState().updateSettings({
      loopCrossfadeDuration: 30,
      defaultLoopCount: 8,
      defaultFadeout: 5000,
      defaultLoopMode: false,
    });

    // Verify changed
    let state = useSettingsStore.getState();
    expect(state.loopCrossfadeDuration).toBe(30);
    expect(state.defaultLoopMode).toBe(false);

    // Reset to defaults
    useSettingsStore.getState().resetToDefaults();

    // Verify reset
    state = useSettingsStore.getState();
    expect(state.loopCrossfadeDuration).toBe(0);
    expect(state.defaultLoopCount).toBe(4);
    expect(state.defaultFadeout).toBe(2000);
    expect(state.defaultLoopMode).toBe(true);
  });
});
