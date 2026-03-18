/**
 * Tests for useRecordingSession hook
 */

import { renderHook, act } from "@testing-library/react-native";
import { useRecordingSession } from "../useRecordingSession";
import { Alert } from "../../utils/alert";

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

// Mock getBitrate
jest.mock("../../services/ffmpeg/audioQuality", () => ({
  getBitrate: jest.fn().mockReturnValue(128000),
}));

const createMockAudioService = () => ({
  startRecording: jest.fn().mockResolvedValue(undefined),
  stopRecording: jest.fn().mockResolvedValue("mock://recording.m4a"),
  getRecordingDuration: jest.fn().mockReturnValue(5000),
  cancelRecording: jest.fn().mockResolvedValue(undefined),
  loadTrack: jest.fn().mockResolvedValue(undefined),
  cleanup: jest.fn().mockResolvedValue(undefined),
  isRecording: jest.fn().mockReturnValue(false),
});

const defaultOptions = () => ({
  audioService: createMockAudioService() as any,
  tracks: [],
  getMasterLoopDuration: jest.fn().mockReturnValue(0),
  hasMasterTrack: jest.fn().mockReturnValue(false),
  recordingFormat: "m4a",
  recordingQuality: "high",
  onTrackRecorded: jest.fn().mockResolvedValue(undefined),
});

describe("useRecordingSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("initial state - isRecording false and recordingDuration 0", () => {
    const opts = defaultOptions();
    const { result } = renderHook(() => useRecordingSession(opts));

    expect(result.current.isRecording).toBe(false);
    expect(result.current.recordingDuration).toBe(0);
  });

  it("handleRecord calls audioService.startRecording and sets isRecording true", async () => {
    const opts = defaultOptions();
    const { result } = renderHook(() => useRecordingSession(opts));

    await act(async () => {
      await result.current.handleRecord();
    });

    expect(opts.audioService.startRecording).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(true);
  });

  it("handleStop calls audioService.stopRecording and creates track via onTrackRecorded", async () => {
    const opts = defaultOptions();
    const { result } = renderHook(() => useRecordingSession(opts));

    // Start recording first
    await act(async () => {
      await result.current.handleRecord();
    });

    // Stop recording
    await act(async () => {
      await result.current.handleStop();
    });

    expect(opts.audioService.stopRecording).toHaveBeenCalled();
    expect(opts.onTrackRecorded).toHaveBeenCalledWith(
      expect.objectContaining({
        uri: "mock://recording.m4a",
        duration: 5000,
        speed: 1.0,
        volume: 75,
        isPlaying: false,
        selected: true,
      }),
    );
    expect(result.current.isRecording).toBe(false);
  });

  it("auto-stop timer fires for subsequent tracks", async () => {
    const opts = defaultOptions();
    opts.hasMasterTrack.mockReturnValue(true);
    opts.getMasterLoopDuration.mockReturnValue(10000);
    opts.tracks = [{ id: "track-1", name: "Track 1", uri: "test", duration: 10000, speed: 1.0, volume: 75, isPlaying: false, createdAt: Date.now() }];

    const { result } = renderHook(() => useRecordingSession(opts));

    await act(async () => {
      await result.current.handleRecord();
    });

    expect(result.current.isRecording).toBe(true);

    // Advance timers by the master loop duration to trigger auto-stop
    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    // Auto-stop should have called stopRecording
    expect(opts.audioService.stopRecording).toHaveBeenCalled();
  });

  it("cleanup clears timers on unmount", async () => {
    const opts = defaultOptions();
    opts.hasMasterTrack.mockReturnValue(true);
    opts.getMasterLoopDuration.mockReturnValue(10000);
    opts.tracks = [{ id: "track-1", name: "Track 1", uri: "test", duration: 10000, speed: 1.0, volume: 75, isPlaying: false, createdAt: Date.now() }];

    const { result, unmount } = renderHook(() => useRecordingSession(opts));

    await act(async () => {
      await result.current.handleRecord();
    });

    // Unmount should clear timers without errors
    unmount();

    // Advancing timers after unmount should not cause errors
    jest.advanceTimersByTime(20000);
  });

  it("error during recording start shows Alert", async () => {
    const opts = defaultOptions();
    opts.audioService.startRecording.mockRejectedValue(new Error("Mic access denied"));

    const { result } = renderHook(() => useRecordingSession(opts));

    await act(async () => {
      await result.current.handleRecord();
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to start recording");
    expect(result.current.isRecording).toBe(false);
  });

  it("shows alert when audioService is null", async () => {
    const opts = defaultOptions();
    opts.audioService = null as any;

    const { result } = renderHook(() => useRecordingSession(opts));

    await act(async () => {
      await result.current.handleRecord();
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Audio service not initialized");
  });
});
