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
