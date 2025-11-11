/**
 * Tests for Playback Store - Loop Mode
 *
 * Following TDD approach - tests written first before implementation
 */

import { usePlaybackStore } from "../usePlaybackStore";
import { useSettingsStore } from "../useSettingsStore";

describe("usePlaybackStore - loop mode", () => {
  beforeEach(() => {
    usePlaybackStore.getState().reset();
    useSettingsStore.getState().resetToDefaults();
  });

  describe("initialization", () => {
    it("initializes loop mode from settings default", () => {
      const defaultLoopMode = useSettingsStore.getState().defaultLoopMode;
      const loopMode = usePlaybackStore.getState().loopMode;

      expect(loopMode).toBe(defaultLoopMode);
      expect(loopMode).toBe(true); // Default is true
    });

    it("initializes loop mode as true when settings default is true", () => {
      useSettingsStore.getState().updateSettings({ defaultLoopMode: true });

      // Create new store instance or reset to pick up settings
      usePlaybackStore.getState().reset();

      expect(usePlaybackStore.getState().loopMode).toBe(true);
    });

    it("initializes loop mode as false when settings default is false", () => {
      useSettingsStore.getState().updateSettings({ defaultLoopMode: false });

      // Reset to pick up new settings
      usePlaybackStore.getState().reset();

      expect(usePlaybackStore.getState().loopMode).toBe(false);
    });
  });

  describe("setLoopMode", () => {
    it("sets loop mode to true", () => {
      usePlaybackStore.getState().setLoopMode(true);
      expect(usePlaybackStore.getState().loopMode).toBe(true);
    });

    it("sets loop mode to false", () => {
      usePlaybackStore.getState().setLoopMode(false);
      expect(usePlaybackStore.getState().loopMode).toBe(false);
    });

    it("updates loop mode state", () => {
      usePlaybackStore.getState().setLoopMode(true);
      expect(usePlaybackStore.getState().loopMode).toBe(true);

      usePlaybackStore.getState().setLoopMode(false);
      expect(usePlaybackStore.getState().loopMode).toBe(false);

      usePlaybackStore.getState().setLoopMode(true);
      expect(usePlaybackStore.getState().loopMode).toBe(true);
    });
  });

  describe("toggleLoopMode", () => {
    it("toggles from true to false", () => {
      usePlaybackStore.getState().setLoopMode(true);
      usePlaybackStore.getState().toggleLoopMode();
      expect(usePlaybackStore.getState().loopMode).toBe(false);
    });

    it("toggles from false to true", () => {
      usePlaybackStore.getState().setLoopMode(false);
      usePlaybackStore.getState().toggleLoopMode();
      expect(usePlaybackStore.getState().loopMode).toBe(true);
    });

    it("toggles multiple times correctly", () => {
      const initialMode = usePlaybackStore.getState().loopMode;

      usePlaybackStore.getState().toggleLoopMode();
      expect(usePlaybackStore.getState().loopMode).toBe(!initialMode);

      usePlaybackStore.getState().toggleLoopMode();
      expect(usePlaybackStore.getState().loopMode).toBe(initialMode);

      usePlaybackStore.getState().toggleLoopMode();
      expect(usePlaybackStore.getState().loopMode).toBe(!initialMode);
    });
  });

  describe("loop mode persistence across operations", () => {
    it("maintains loop mode when tracks are added", () => {
      usePlaybackStore.getState().setLoopMode(false);

      usePlaybackStore.getState().addTrack("track-1");
      usePlaybackStore.getState().addTrack("track-2");

      expect(usePlaybackStore.getState().loopMode).toBe(false);
    });

    it("maintains loop mode when tracks are removed", () => {
      usePlaybackStore.getState().setLoopMode(true);
      usePlaybackStore.getState().addTrack("track-1");

      usePlaybackStore.getState().removeTrack("track-1");

      expect(usePlaybackStore.getState().loopMode).toBe(true);
    });

    it("maintains loop mode when playback state changes", () => {
      usePlaybackStore.getState().setLoopMode(false);
      usePlaybackStore.getState().addTrack("track-1");

      usePlaybackStore.getState().setTrackPlaying("track-1", true);
      expect(usePlaybackStore.getState().loopMode).toBe(false);

      usePlaybackStore.getState().pauseAll();
      expect(usePlaybackStore.getState().loopMode).toBe(false);
    });
  });

  describe("independence from per-track looping", () => {
    it("loop mode is independent from track isLooping property", () => {
      usePlaybackStore.getState().setLoopMode(true);
      usePlaybackStore.getState().addTrack("track-1");

      // Set per-track looping to false
      usePlaybackStore.getState().setTrackLooping("track-1", false);

      // Global loop mode should remain true
      expect(usePlaybackStore.getState().loopMode).toBe(true);

      // Track's isLooping should be false
      const trackState = usePlaybackStore.getState().getTrackState("track-1");
      expect(trackState?.isLooping).toBe(false);
    });
  });
});
