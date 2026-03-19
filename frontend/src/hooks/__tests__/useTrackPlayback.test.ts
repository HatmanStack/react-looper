/**
 * Tests for useTrackPlayback hook
 */

import { renderHook, act } from "@testing-library/react-native";
import { useTrackPlayback } from "../useTrackPlayback";
import type { Track } from "../../types";

// Mock Alert
jest.mock("../../utils/alert", () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock logger
jest.mock("../../utils/logger", () => ({
  logger: {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const createMockAudioService = () => ({
  playTrack: jest.fn().mockResolvedValue(undefined),
  pauseTrack: jest.fn().mockResolvedValue(undefined),
  unloadTrack: jest.fn().mockResolvedValue(undefined),
  setTrackVolume: jest.fn().mockResolvedValue(undefined),
  setTrackSpeed: jest.fn().mockResolvedValue(undefined),
});

const createMockTrack = (overrides: Partial<Track> = {}): Track => ({
  id: "track-1",
  name: "Track 1",
  uri: "file:///test.mp3",
  duration: 10000,
  speed: 1.0,
  volume: 75,
  isPlaying: false,
  selected: true,
  createdAt: Date.now(),
  ...overrides,
});

describe("useTrackPlayback", () => {
  let mockAudioService: ReturnType<typeof createMockAudioService>;
  let mockUpdateTrack: jest.Mock;
  let mockRemoveTrack: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAudioService = createMockAudioService();
    mockUpdateTrack = jest.fn();
    mockRemoveTrack = jest.fn();
  });

  const defaultOptions = (tracks: Track[] = []) => ({
    audioService: mockAudioService as any,
    tracks,
    updateTrack: mockUpdateTrack,
    removeTrack: mockRemoveTrack,
  });

  it("handlePlay calls audioService.playTrack and updates track", async () => {
    const track = createMockTrack({ id: "t1", isPlaying: false });
    const { result: hookResult } = renderHook(() =>
      useTrackPlayback(defaultOptions([track])),
    );

    await act(async () => {
      await hookResult.current.handlePlay("t1");
    });

    expect(mockAudioService.playTrack).toHaveBeenCalledWith("t1");
    expect(mockUpdateTrack).toHaveBeenCalledWith("t1", { isPlaying: true });
  });

  it("handlePlay does not play if track is already playing", async () => {
    const track = createMockTrack({ id: "t1", isPlaying: true });
    const { result } = renderHook(() =>
      useTrackPlayback(defaultOptions([track])),
    );

    await act(async () => {
      await result.current.handlePlay("t1");
    });

    expect(mockAudioService.playTrack).not.toHaveBeenCalled();
  });

  it("handlePause calls audioService.pauseTrack and updates track", async () => {
    const track = createMockTrack({ id: "t1", isPlaying: true });
    const { result } = renderHook(() =>
      useTrackPlayback(defaultOptions([track])),
    );

    await act(async () => {
      await result.current.handlePause("t1");
    });

    expect(mockAudioService.pauseTrack).toHaveBeenCalledWith("t1");
    expect(mockUpdateTrack).toHaveBeenCalledWith("t1", { isPlaying: false });
  });

  it("handleDelete on non-master track calls unloadTrack and removeTrack", async () => {
    const track1 = createMockTrack({ id: "master" });
    const track2 = createMockTrack({ id: "t2" });
    const { result } = renderHook(() =>
      useTrackPlayback(defaultOptions([track1, track2])),
    );

    await act(async () => {
      await result.current.handleDelete("t2");
    });

    expect(mockAudioService.unloadTrack).toHaveBeenCalledWith("t2");
    expect(mockRemoveTrack).toHaveBeenCalledWith("t2");
  });

  it("handleDelete on master track shows confirmation dialog", async () => {
    const track1 = createMockTrack({ id: "master" });
    const track2 = createMockTrack({ id: "t2" });
    const { result } = renderHook(() =>
      useTrackPlayback(defaultOptions([track1, track2])),
    );

    await act(async () => {
      await result.current.handleDelete("master");
    });

    expect(result.current.deleteConfirmationVisible).toBe(true);
    expect(mockAudioService.unloadTrack).not.toHaveBeenCalled();
  });

  it("handleDeleteConfirm after master deletion calls unloadTrack for all tracks", async () => {
    const track1 = createMockTrack({ id: "master" });
    const track2 = createMockTrack({ id: "t2" });
    const { result } = renderHook(() =>
      useTrackPlayback(defaultOptions([track1, track2])),
    );

    // Trigger confirmation
    await act(async () => {
      await result.current.handleDelete("master");
    });

    // Confirm deletion
    await act(async () => {
      await result.current.handleDeleteConfirm();
    });

    expect(mockAudioService.unloadTrack).toHaveBeenCalledWith("master");
    expect(mockAudioService.unloadTrack).toHaveBeenCalledWith("t2");
    expect(mockRemoveTrack).toHaveBeenCalledWith("master");
    expect(result.current.deleteConfirmationVisible).toBe(false);
  });

  it("handleSpeedChange on master track with other tracks shows confirmation", async () => {
    const track1 = createMockTrack({ id: "master" });
    const track2 = createMockTrack({ id: "t2" });
    const { result } = renderHook(() =>
      useTrackPlayback(defaultOptions([track1, track2])),
    );

    await act(async () => {
      await result.current.handleSpeedChange("master", 1.5);
    });

    expect(result.current.speedConfirmationVisible).toBe(true);
    expect(mockAudioService.setTrackSpeed).not.toHaveBeenCalled();
  });

  it("handleSpeedChange on non-master track applies immediately", async () => {
    const track1 = createMockTrack({ id: "master" });
    const track2 = createMockTrack({ id: "t2" });
    const { result } = renderHook(() =>
      useTrackPlayback(defaultOptions([track1, track2])),
    );

    await act(async () => {
      await result.current.handleSpeedChange("t2", 1.5);
    });

    expect(mockAudioService.setTrackSpeed).toHaveBeenCalledWith("t2", 1.5);
    expect(mockUpdateTrack).toHaveBeenCalledWith("t2", { speed: 1.5 });
  });

  it("handleVolumeChange calls audioService.setTrackVolume and updates track", async () => {
    const track = createMockTrack({ id: "t1" });
    const { result } = renderHook(() =>
      useTrackPlayback(defaultOptions([track])),
    );

    await act(async () => {
      await result.current.handleVolumeChange("t1", 50);
    });

    expect(mockAudioService.setTrackVolume).toHaveBeenCalledWith("t1", 50);
    expect(mockUpdateTrack).toHaveBeenCalledWith("t1", { volume: 50 });
  });

  it("handleSelect toggles the track selected state", () => {
    const track = createMockTrack({ id: "t1", selected: true });
    const { result } = renderHook(() =>
      useTrackPlayback(defaultOptions([track])),
    );

    act(() => {
      result.current.handleSelect("t1");
    });

    expect(mockUpdateTrack).toHaveBeenCalledWith("t1", { selected: false });
  });

  describe("sync speed", () => {
    it("handleSyncSelect sets track speed and syncMultiplier", async () => {
      const masterTrack = createMockTrack({
        id: "master",
        duration: 10000,
        speed: 1.0,
      });
      const track2 = createMockTrack({
        id: "t2",
        duration: 5000,
        speed: 1.0,
      });
      const { result } = renderHook(() =>
        useTrackPlayback(defaultOptions([masterTrack, track2])),
      );

      await act(async () => {
        result.current.handleSyncSelect("t2", 1);
      });

      // Sync speed = (5000 / 10000) * 1 = 0.5, rounded to nearest 1/41
      const expectedSpeed = Math.round(0.5 * 41) / 41;
      expect(mockAudioService.setTrackSpeed).toHaveBeenCalledWith(
        "t2",
        expectedSpeed,
      );
      expect(mockUpdateTrack).toHaveBeenCalledWith("t2", {
        speed: expectedSpeed,
      });
      expect(mockUpdateTrack).toHaveBeenCalledWith("t2", {
        syncMultiplier: 1,
      });
    });

    it("handleSyncClear removes sync binding", async () => {
      const track = createMockTrack({
        id: "t2",
        syncMultiplier: 1,
      });
      const { result } = renderHook(() =>
        useTrackPlayback(
          defaultOptions([createMockTrack({ id: "master" }), track]),
        ),
      );

      act(() => {
        result.current.handleSyncClear("t2");
      });

      expect(mockUpdateTrack).toHaveBeenCalledWith("t2", {
        syncMultiplier: null,
      });
    });

    it("manual speed change clears syncMultiplier on non-master track", async () => {
      const masterTrack = createMockTrack({ id: "master" });
      const track2 = createMockTrack({
        id: "t2",
        syncMultiplier: 2,
      });
      const { result } = renderHook(() =>
        useTrackPlayback(defaultOptions([masterTrack, track2])),
      );

      await act(async () => {
        await result.current.handleSpeedChange("t2", 1.5);
      });

      expect(mockUpdateTrack).toHaveBeenCalledWith("t2", {
        syncMultiplier: null,
      });
      expect(mockAudioService.setTrackSpeed).toHaveBeenCalledWith("t2", 1.5);
    });

    it("master speed confirm triggers auto-resync of synced tracks", async () => {
      const masterTrack = createMockTrack({
        id: "master",
        duration: 10000,
        speed: 1.0,
      });
      const syncedTrack = createMockTrack({
        id: "t2",
        duration: 5000,
        speed: 0.5,
        syncMultiplier: 1,
      });
      const { result } = renderHook(() =>
        useTrackPlayback(defaultOptions([masterTrack, syncedTrack])),
      );

      // Trigger master speed change
      await act(async () => {
        await result.current.handleSpeedChange("master", 2.0);
      });

      expect(result.current.speedConfirmationVisible).toBe(true);

      // Confirm the speed change
      await act(async () => {
        await result.current.handleSpeedChangeConfirm();
      });

      // Master speed applied
      expect(mockAudioService.setTrackSpeed).toHaveBeenCalledWith(
        "master",
        2.0,
      );

      // Synced track should be resynced:
      // New master loop duration = 10000 / 2.0 = 5000ms
      // New sync speed = (5000 / 5000) * 1 = 1.0, rounded
      const expectedSyncSpeed = Math.round(1.0 * 41) / 41;
      expect(mockAudioService.setTrackSpeed).toHaveBeenCalledWith(
        "t2",
        expectedSyncSpeed,
      );
    });

    it("auto-resync clears sync when new speed would be out of range", async () => {
      const masterTrack = createMockTrack({
        id: "master",
        duration: 10000,
        speed: 1.0,
      });
      // Track with duration that will produce out-of-range speed
      // At multiplier 4: if master speed goes to 0.1, master loop = 100000
      // sync speed = (50000 / 100000) * 4 = 2.0 -- still valid
      // Need: track.duration / newMasterLoop * multiplier > 2.5
      // Use track of 30000ms with multiplier 4. New master speed = 2.0, master loop = 5000
      // sync speed = (30000 / 5000) * 4 = 24.0 -- way out of range
      const syncedTrack = createMockTrack({
        id: "t2",
        duration: 30000,
        speed: 1.0,
        syncMultiplier: 4,
      });
      const { result } = renderHook(() =>
        useTrackPlayback(defaultOptions([masterTrack, syncedTrack])),
      );

      await act(async () => {
        await result.current.handleSpeedChange("master", 2.0);
      });

      await act(async () => {
        await result.current.handleSpeedChangeConfirm();
      });

      // Sync should be cleared because the new speed is out of range
      expect(mockUpdateTrack).toHaveBeenCalledWith("t2", {
        syncMultiplier: null,
      });
    });
  });

  it("handleDeleteCancel hides confirmation dialog", async () => {
    const track1 = createMockTrack({ id: "master" });
    const track2 = createMockTrack({ id: "t2" });
    const { result } = renderHook(() =>
      useTrackPlayback(defaultOptions([track1, track2])),
    );

    await act(async () => {
      await result.current.handleDelete("master");
    });

    expect(result.current.deleteConfirmationVisible).toBe(true);

    act(() => {
      result.current.handleDeleteCancel();
    });

    expect(result.current.deleteConfirmationVisible).toBe(false);
  });
});
