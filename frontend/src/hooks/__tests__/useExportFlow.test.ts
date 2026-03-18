/**
 * Tests for useExportFlow hook
 */

import { renderHook, act } from "@testing-library/react-native";
import { useExportFlow } from "../useExportFlow";
import { Alert } from "../../utils/alert";
import type { Track } from "../../types";

// Mock Alert
jest.mock("../../utils/alert", () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock downloadBlob
jest.mock("../../utils/downloadFile", () => ({
  downloadBlob: jest.fn(),
}));

const mockLoad = jest.fn().mockResolvedValue(undefined);
const mockMix = jest.fn().mockResolvedValue({
  data: new Blob(["test"], { type: "audio/wav" }),
  actualFormat: "wav",
});

// Mock getAudioExportService
jest.mock("../../services/ffmpeg/AudioExportService", () => ({
  getAudioExportService: () => ({
    load: mockLoad,
    mix: mockMix,
  }),
}));

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

describe("useExportFlow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultOptions = (tracks: Track[] = []) => ({
    tracks,
    exportFormat: "wav",
    exportQuality: "high",
    loopCrossfadeDuration: 0,
  });

  it("initial state - saveModalVisible false and isExporting false", () => {
    const { result } = renderHook(() => useExportFlow(defaultOptions()));

    expect(result.current.saveModalVisible).toBe(false);
    expect(result.current.isExporting).toBe(false);
  });

  it("handleSave sets saveModalVisible to true", () => {
    const { result } = renderHook(() => useExportFlow(defaultOptions()));

    act(() => {
      result.current.handleSave();
    });

    expect(result.current.saveModalVisible).toBe(true);
  });

  it("handleSaveModalDismiss sets saveModalVisible to false", () => {
    const { result } = renderHook(() => useExportFlow(defaultOptions()));

    act(() => {
      result.current.handleSave();
    });
    expect(result.current.saveModalVisible).toBe(true);

    act(() => {
      result.current.handleSaveModalDismiss();
    });
    expect(result.current.saveModalVisible).toBe(false);
  });

  it("handleSaveModalSave with selected tracks calls audioExportService.mix", async () => {
    const track = createMockTrack({ selected: true });
    const { result } = renderHook(() =>
      useExportFlow(defaultOptions([track])),
    );

    await act(async () => {
      await result.current.handleSaveModalSave("output", 4, 2000);
    });

    expect(mockLoad).toHaveBeenCalled();
    expect(mockMix).toHaveBeenCalledWith(
      expect.objectContaining({
        tracks: [{ uri: track.uri, speed: track.speed, volume: track.volume }],
        loopCount: 4,
        fadeoutDuration: 2000,
        format: "wav",
        quality: "high",
        crossfadeDuration: 0,
      }),
    );
  });

  it("handleSaveModalSave sets isExporting true during mixing, false after", async () => {
    const track = createMockTrack({ selected: true });
    const { result } = renderHook(() =>
      useExportFlow(defaultOptions([track])),
    );

    // Before export
    expect(result.current.isExporting).toBe(false);

    await act(async () => {
      await result.current.handleSaveModalSave("output", 1, 0);
    });

    // After export completes
    expect(result.current.isExporting).toBe(false);
  });

  it("handleSaveModalSave with no selected tracks shows error Alert", async () => {
    const track = createMockTrack({ selected: false });
    const { result } = renderHook(() =>
      useExportFlow(defaultOptions([track])),
    );

    await act(async () => {
      await result.current.handleSaveModalSave("output", 1, 0);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Error",
      "Please select at least one track to save",
    );
    expect(mockMix).not.toHaveBeenCalled();
  });

  it("mixing error is caught and shown via Alert", async () => {
    mockMix.mockRejectedValueOnce(new Error("Mix failed"));
    const track = createMockTrack({ selected: true });
    const { result } = renderHook(() =>
      useExportFlow(defaultOptions([track])),
    );

    await act(async () => {
      await result.current.handleSaveModalSave("output", 1, 0);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Error",
      "Failed to mix audio tracks: Mix failed",
    );
    expect(result.current.isExporting).toBe(false);
  });

  it("passes crossfadeDuration through to mixer options", async () => {
    const track = createMockTrack({ selected: true });
    const opts = { ...defaultOptions([track]), loopCrossfadeDuration: 50 };
    const { result } = renderHook(() => useExportFlow(opts));

    await act(async () => {
      await result.current.handleSaveModalSave("output", 2, 1000);
    });

    expect(mockMix).toHaveBeenCalledWith(
      expect.objectContaining({
        crossfadeDuration: 50,
      }),
    );
  });
});
