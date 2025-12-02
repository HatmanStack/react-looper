/**
 * Tests for Settings Store
 *
 * Following TDD approach - tests written first before implementation
 */

import { useSettingsStore, getSettings } from "../useSettingsStore";

describe("useSettingsStore", () => {
  beforeEach(() => {
    // Reset store to defaults before each test
    useSettingsStore.getState().resetToDefaults();
  });

  describe("initialization", () => {
    it("initializes with default looping settings", () => {
      const state = useSettingsStore.getState();

      expect(state.loopCrossfadeDuration).toBe(0);
      expect(state.defaultLoopMode).toBe(true);
    });

    it("initializes with default export settings", () => {
      const state = useSettingsStore.getState();

      expect(state.defaultLoopCount).toBe(4);
      expect(state.defaultFadeout).toBe(2000);
      expect(state.exportFormat).toBe("mp3");
      expect(state.exportQuality).toBe("high");
    });

    it("initializes with default recording settings", () => {
      const state = useSettingsStore.getState();

      expect(state.recordingFormat).toBe("m4a");
      expect(state.recordingQuality).toBe("high");
    });
  });

  describe("updateSettings", () => {
    it("updates partial settings without affecting others", () => {
      const initial = useSettingsStore.getState();
      const initialCrossfade = initial.loopCrossfadeDuration;

      useSettingsStore.getState().updateSettings({
        defaultLoopCount: 8,
      });

      const updated = useSettingsStore.getState();
      expect(updated.defaultLoopCount).toBe(8);
      expect(updated.loopCrossfadeDuration).toBe(initialCrossfade); // Unchanged
      expect(updated.defaultLoopMode).toBe(true); // Unchanged
    });

    it("updates multiple settings at once", () => {
      useSettingsStore.getState().updateSettings({
        defaultLoopCount: 6,
        defaultFadeout: 3000,
        defaultLoopMode: false,
      });

      const state = useSettingsStore.getState();
      expect(state.defaultLoopCount).toBe(6);
      expect(state.defaultFadeout).toBe(3000);
      expect(state.defaultLoopMode).toBe(false);
    });

    it("allows updating looping settings", () => {
      useSettingsStore.getState().updateSettings({
        loopCrossfadeDuration: 50,
        defaultLoopMode: false,
      });

      const state = useSettingsStore.getState();
      expect(state.loopCrossfadeDuration).toBe(50);
      expect(state.defaultLoopMode).toBe(false);
    });

    it("allows updating export settings", () => {
      useSettingsStore.getState().updateSettings({
        exportFormat: "wav",
        exportQuality: "medium",
        defaultLoopCount: 2,
        defaultFadeout: 1000,
      });

      const state = useSettingsStore.getState();
      expect(state.exportFormat).toBe("wav");
      expect(state.exportQuality).toBe("medium");
      expect(state.defaultLoopCount).toBe(2);
      expect(state.defaultFadeout).toBe(1000);
    });

    it("allows updating recording settings", () => {
      useSettingsStore.getState().updateSettings({
        recordingFormat: "wav",
        recordingQuality: "low",
      });

      const state = useSettingsStore.getState();
      expect(state.recordingFormat).toBe("wav");
      expect(state.recordingQuality).toBe("low");
    });
  });

  describe("resetToDefaults", () => {
    it("resets all settings to default values", () => {
      // Change some settings
      useSettingsStore.getState().updateSettings({
        defaultLoopCount: 10,
        defaultLoopMode: false,
        loopCrossfadeDuration: 100,
        exportFormat: "wav",
        exportQuality: "low",
      });

      // Verify changes took effect
      let state = useSettingsStore.getState();
      expect(state.defaultLoopCount).toBe(10);
      expect(state.defaultLoopMode).toBe(false);

      // Reset to defaults
      useSettingsStore.getState().resetToDefaults();

      // Verify all defaults restored
      state = useSettingsStore.getState();
      expect(state.loopCrossfadeDuration).toBe(0);
      expect(state.defaultLoopMode).toBe(true);
      expect(state.defaultLoopCount).toBe(4);
      expect(state.defaultFadeout).toBe(2000);
      expect(state.exportFormat).toBe("mp3");
      expect(state.exportQuality).toBe("high");
      expect(state.recordingFormat).toBe("m4a");
      expect(state.recordingQuality).toBe("high");
    });
  });

  describe("merge semantics", () => {
    it("preserves unrelated settings when updating subset", () => {
      // Set initial custom state
      useSettingsStore.getState().updateSettings({
        defaultLoopCount: 6,
        defaultFadeout: 3000,
        exportFormat: "wav",
      });

      // Update only loop count
      useSettingsStore.getState().updateSettings({
        defaultLoopCount: 8,
      });

      const state = useSettingsStore.getState();
      expect(state.defaultLoopCount).toBe(8); // Updated
      expect(state.defaultFadeout).toBe(3000); // Preserved
      expect(state.exportFormat).toBe("wav"); // Preserved
    });
  });

  describe("type safety", () => {
    it("accepts valid export formats", () => {
      const validFormats = ["mp3", "wav", "m4a"];

      validFormats.forEach((format) => {
        useSettingsStore.getState().updateSettings({
          exportFormat: format as "mp3" | "wav" | "m4a",
        });
        expect(useSettingsStore.getState().exportFormat).toBe(format);
      });
    });

    it("accepts valid quality levels", () => {
      const validQualities = ["low", "medium", "high"];

      validQualities.forEach((quality) => {
        useSettingsStore.getState().updateSettings({
          exportQuality: quality as "low" | "medium" | "high",
        });
        expect(useSettingsStore.getState().exportQuality).toBe(quality);
      });
    });
  });

  describe("boundary values", () => {
    it("handles zero crossfade duration", () => {
      useSettingsStore.getState().updateSettings({
        loopCrossfadeDuration: 0,
      });

      expect(useSettingsStore.getState().loopCrossfadeDuration).toBe(0);
    });

    it("handles large crossfade duration", () => {
      useSettingsStore.getState().updateSettings({
        loopCrossfadeDuration: 10000,
      });

      expect(useSettingsStore.getState().loopCrossfadeDuration).toBe(10000);
    });

    it("handles zero loop count", () => {
      useSettingsStore.getState().updateSettings({
        defaultLoopCount: 0,
      });

      expect(useSettingsStore.getState().defaultLoopCount).toBe(0);
    });

    it("handles very large loop count", () => {
      useSettingsStore.getState().updateSettings({
        defaultLoopCount: 100,
      });

      expect(useSettingsStore.getState().defaultLoopCount).toBe(100);
    });
  });

  describe("getSettings helper", () => {
    it("returns current settings snapshot", () => {
      // Update some settings
      useSettingsStore.getState().updateSettings({
        defaultLoopCount: 6,
        defaultLoopMode: false,
        exportFormat: "wav",
      });

      // Get snapshot
      const snapshot = getSettings();

      // Verify snapshot matches current state
      expect(snapshot).toMatchObject({
        defaultLoopCount: 6,
        defaultLoopMode: false,
        exportFormat: "wav",
        loopCrossfadeDuration: 0,
        defaultFadeout: 2000,
        exportQuality: "high",
        recordingFormat: "m4a",
        recordingQuality: "high",
      });
    });

    it("returns independent snapshot (not reactive)", () => {
      const snapshot1 = getSettings();

      // Modify store
      useSettingsStore.getState().updateSettings({
        defaultLoopCount: 99,
      });

      // Original snapshot should be unchanged
      expect(snapshot1.defaultLoopCount).not.toBe(99);
      expect(snapshot1.defaultLoopCount).toBe(4); // Still default
    });
  });
});
