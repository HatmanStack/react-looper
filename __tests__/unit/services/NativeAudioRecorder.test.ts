/**
 * NativeAudioRecorder Tests
 */

import { NativeAudioRecorder } from "../../../src/services/audio/NativeAudioRecorder";
import { AudioError } from "../../../src/services/audio/AudioError";
import { Audio } from "expo-av";

// Mock expo-av
jest.mock("expo-av", () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(),
    setAudioModeAsync: jest.fn(),
    Recording: jest.fn().mockImplementation(() => ({
      prepareToRecordAsync: jest.fn(),
      startAsync: jest.fn(),
      stopAndUnloadAsync: jest.fn(),
      getURI: jest.fn(),
      getDurationMillis: jest.fn(),
    })),
  },
  RecordingOptions: {},
  RecordingOptionsPresets: {
    HIGH_QUALITY: {},
  },
}));

describe("NativeAudioRecorder", () => {
  let recorder: NativeAudioRecorder;
  let mockRecording: any;

  beforeEach(() => {
    jest.clearAllMocks();
    recorder = new NativeAudioRecorder();

    // Create mock recording instance
    mockRecording = {
      prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
      startAsync: jest.fn().mockResolvedValue(undefined),
      stopAndUnloadAsync: jest
        .fn()
        .mockResolvedValue({ uri: "file://recording.m4a" }),
      getURI: jest.fn().mockReturnValue("file://recording.m4a"),
      getDurationMillis: jest.fn().mockResolvedValue(5000),
    };

    (Audio.Recording as jest.Mock).mockImplementation(() => mockRecording);
  });

  describe("checkPermission", () => {
    it("should request and return permissions", async () => {
      (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
        granted: true,
      });

      const result = await recorder.checkPermission();

      expect(result).toBe(true);
      expect(Audio.requestPermissionsAsync).toHaveBeenCalled();
    });

    it("should return false if permission denied", async () => {
      (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
        granted: false,
      });

      const result = await recorder.checkPermission();

      expect(result).toBe(false);
    });

    it("should throw AudioError on permission check failure", async () => {
      (Audio.requestPermissionsAsync as jest.Mock).mockRejectedValue(
        new Error("Permission error"),
      );

      await expect(recorder.checkPermission()).rejects.toThrow(AudioError);
      await expect(recorder.checkPermission()).rejects.toThrow(
        "Failed to check recording permissions",
      );
    });
  });

  describe("startRecording", () => {
    beforeEach(() => {
      (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
        granted: true,
      });
      (Audio.setAudioModeAsync as jest.Mock).mockResolvedValue(undefined);
    });

    it("should start recording with permissions", async () => {
      await recorder.startRecording();

      expect(Audio.requestPermissionsAsync).toHaveBeenCalled();
      expect(Audio.setAudioModeAsync).toHaveBeenCalled();
      expect(mockRecording.prepareToRecordAsync).toHaveBeenCalled();
      expect(mockRecording.startAsync).toHaveBeenCalled();
    });

    it("should throw if permissions denied", async () => {
      (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
        granted: false,
      });

      await expect(recorder.startRecording()).rejects.toThrow(AudioError);
      await expect(recorder.startRecording()).rejects.toThrow(
        "Recording permission denied",
      );
    });

    it("should throw if already recording", async () => {
      await recorder.startRecording();

      await expect(recorder.startRecording()).rejects.toThrow(AudioError);
      await expect(recorder.startRecording()).rejects.toThrow(
        "Already recording",
      );
    });
  });

  describe("stopRecording", () => {
    it("should stop recording and return URI", async () => {
      (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
        granted: true,
      });

      await recorder.startRecording();
      const uri = await recorder.stopRecording();

      expect(uri).toBe("file://recording.m4a");
      expect(mockRecording.stopAndUnloadAsync).toHaveBeenCalled();
    });

    it("should throw if not recording", async () => {
      await expect(recorder.stopRecording()).rejects.toThrow(AudioError);
      await expect(recorder.stopRecording()).rejects.toThrow(
        "No active recording",
      );
    });

    it("should throw if stop fails", async () => {
      (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
        granted: true,
      });

      mockRecording.stopAndUnloadAsync.mockRejectedValue(
        new Error("Stop failed"),
      );

      await recorder.startRecording();
      await expect(recorder.stopRecording()).rejects.toThrow(AudioError);
    });
  });

  describe("getDuration", () => {
    it("should return recording duration", async () => {
      (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
        granted: true,
      });

      await recorder.startRecording();
      await recorder.stopRecording();

      const duration = await recorder.getDuration();
      expect(duration).toBe(5000);
    });

    it("should return 0 if no recording", async () => {
      const duration = await recorder.getDuration();
      expect(duration).toBe(0);
    });
  });

  describe("cleanup", () => {
    it("should cleanup recording instance", async () => {
      (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
        granted: true,
      });

      await recorder.startRecording();
      await recorder.cleanup();

      // Should be able to start new recording after cleanup
      await recorder.startRecording();
      expect(Audio.Recording).toHaveBeenCalledTimes(2);
    });
  });

  describe("Auto-Stop with maxDuration", () => {
    beforeEach(() => {
      (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
        granted: true,
      });
    });

    it("should set timeout when maxDuration is provided", async () => {
      const setTimeoutSpy = jest.spyOn(global, "setTimeout");

      const maxDuration = 5000;
      await recorder.startRecording({ maxDuration });

      // Verify setTimeout was called with correct duration
      expect(setTimeoutSpy).toHaveBeenCalledWith(
        expect.any(Function),
        maxDuration,
      );

      setTimeoutSpy.mockRestore();
    });

    it("should not set timeout when maxDuration is not provided", async () => {
      const setTimeoutSpy = jest.spyOn(global, "setTimeout");

      await recorder.startRecording(); // No maxDuration

      // Verify recording continues indefinitely
      expect(recorder.isRecording()).toBe(true);

      setTimeoutSpy.mockRestore();
    });

    it("should clear timeout on manual stop", async () => {
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

      await recorder.startRecording({ maxDuration: 10000 });
      await recorder.stopRecording();

      // Verify clearTimeout was called to prevent auto-stop
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    it("should clear timeout on cleanup", async () => {
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

      await recorder.startRecording({ maxDuration: 10000 });
      await recorder.cleanup();

      // Verify clearTimeout was called
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    it("should clear timeout on cancel", async () => {
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

      await recorder.startRecording({ maxDuration: 10000 });
      await recorder.cancelRecording();

      // Verify clearTimeout was called
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    it("should accept maxDuration of zero without error", async () => {
      // Should not throw with zero maxDuration (treated as disabled)
      await expect(
        recorder.startRecording({ maxDuration: 0 }),
      ).resolves.not.toThrow();

      expect(recorder.isRecording()).toBe(true);
    });

    it("should handle very short maxDuration", async () => {
      const maxDuration = 100; // Very short - 100ms

      // Should not throw with very short duration
      await expect(
        recorder.startRecording({ maxDuration }),
      ).resolves.not.toThrow();

      expect(recorder.isRecording()).toBe(true);
    });
  });
});
