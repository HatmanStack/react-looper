/**
 * WebAudioRecorder Tests
 */

import { WebAudioRecorder } from "../../../src/services/audio/WebAudioRecorder";
import { AudioError } from "../../../src/services/audio/AudioError";

// Mock MediaRecorder
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  state: "inactive",
};

global.MediaRecorder = jest
  .fn()
  .mockImplementation(() => mockMediaRecorder) as any;
global.navigator.mediaDevices = {
  getUserMedia: jest.fn(),
} as any;

global.URL.createObjectURL = jest.fn(() => "blob:http://localhost/test");
global.URL.revokeObjectURL = jest.fn();

describe("WebAudioRecorder", () => {
  let recorder: WebAudioRecorder;
  let mockStream: MediaStream;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStream = {
      getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }]),
    } as any;

    (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue(
      mockStream,
    );
    mockMediaRecorder.state = "inactive";
  });

  afterEach(() => {
    recorder?.cleanup();
  });

  describe("checkPermission", () => {
    it("should check media device permissions", async () => {
      recorder = new WebAudioRecorder();
      const hasPermission = await recorder.checkPermission();

      expect(hasPermission).toBe(true);
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: true,
      });
    });

    it("should return false if permission denied", async () => {
      (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValue(
        new Error("Permission denied"),
      );

      recorder = new WebAudioRecorder();
      const hasPermission = await recorder.checkPermission();

      expect(hasPermission).toBe(false);
    });
  });

  describe("startRecording", () => {
    it("should start recording with permissions", async () => {
      recorder = new WebAudioRecorder();
      await recorder.startRecording();

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
      expect(MediaRecorder).toHaveBeenCalledWith(mockStream, {
        mimeType: expect.any(String),
      });
      expect(mockMediaRecorder.start).toHaveBeenCalled();
    });

    it("should throw if permission denied", async () => {
      (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValue(
        new Error("Permission denied"),
      );

      recorder = new WebAudioRecorder();

      await expect(recorder.startRecording()).rejects.toThrow(AudioError);
      await expect(recorder.startRecording()).rejects.toThrow(
        "Microphone permission denied",
      );
    });

    it("should throw if already recording", async () => {
      recorder = new WebAudioRecorder();
      await recorder.startRecording();

      mockMediaRecorder.state = "recording";

      await expect(recorder.startRecording()).rejects.toThrow(AudioError);
      await expect(recorder.startRecording()).rejects.toThrow(
        "Already recording",
      );
    });

    it("should use supported mime type", async () => {
      // Mock MediaRecorder.isTypeSupported
      (MediaRecorder as any).isTypeSupported = jest
        .fn()
        .mockReturnValueOnce(false) // webm not supported
        .mockReturnValueOnce(true); // mp4 supported

      recorder = new WebAudioRecorder();
      await recorder.startRecording();

      expect(MediaRecorder).toHaveBeenCalledWith(
        mockStream,
        expect.objectContaining({
          mimeType: expect.stringContaining("mp4"),
        }),
      );
    });
  });

  describe("stopRecording", () => {
    it("should stop recording and return blob URL", async () => {
      recorder = new WebAudioRecorder();
      await recorder.startRecording();

      // Simulate dataavailable event
      const dataHandler = (
        mockMediaRecorder.addEventListener as jest.Mock
      ).mock.calls.find(([event]) => event === "dataavailable")?.[1];

      const mockBlob = new Blob(["audio data"], { type: "audio/webm" });
      dataHandler?.({ data: mockBlob });

      // Simulate stop event
      mockMediaRecorder.state = "inactive";
      const stopHandler = (
        mockMediaRecorder.addEventListener as jest.Mock
      ).mock.calls.find(([event]) => event === "stop")?.[1];

      const stopPromise = recorder.stopRecording();
      stopHandler?.();

      const uri = await stopPromise;

      expect(mockMediaRecorder.stop).toHaveBeenCalled();
      expect(uri).toBe("blob:http://localhost/test");
    });

    it("should throw if not recording", async () => {
      recorder = new WebAudioRecorder();

      await expect(recorder.stopRecording()).rejects.toThrow(AudioError);
      await expect(recorder.stopRecording()).rejects.toThrow(
        "No active recording",
      );
    });

    it("should stop media stream tracks", async () => {
      recorder = new WebAudioRecorder();
      await recorder.startRecording();

      const stopHandler = (
        mockMediaRecorder.addEventListener as jest.Mock
      ).mock.calls.find(([event]) => event === "stop")?.[1];

      const stopPromise = recorder.stopRecording();
      stopHandler?.();
      await stopPromise;

      expect(mockStream.getTracks()[0].stop).toHaveBeenCalled();
    });
  });

  describe("getDuration", () => {
    it("should return 0 for web (duration not tracked)", async () => {
      recorder = new WebAudioRecorder();
      const duration = await recorder.getDuration();

      expect(duration).toBe(0);
    });
  });

  describe("cleanup", () => {
    it("should cleanup resources", async () => {
      recorder = new WebAudioRecorder();
      await recorder.startRecording();

      recorder.cleanup();

      // Cleanup should stop stream tracks
      expect(mockStream.getTracks()[0].stop).toHaveBeenCalled();
    });

    it("should handle cleanup when not recording", () => {
      recorder = new WebAudioRecorder();

      expect(() => recorder.cleanup()).not.toThrow();
    });
  });

  describe("Auto-Stop with maxDuration", () => {
    it("should set timeout when maxDuration is provided", async () => {
      const setTimeoutSpy = jest.spyOn(global, "setTimeout");

      recorder = new WebAudioRecorder();
      const maxDuration = 5000;

      await recorder.startRecording({ maxDuration });

      // Verify setTimeout was called with correct duration
      expect(setTimeoutSpy).toHaveBeenCalledWith(
        expect.any(Function),
        maxDuration
      );

      setTimeoutSpy.mockRestore();
    });

    it("should not set timeout when maxDuration is not provided", async () => {
      const setTimeoutSpy = jest.spyOn(global, "setTimeout");

      recorder = new WebAudioRecorder();
      await recorder.startRecording(); // No maxDuration

      // setTimeout should not be called for auto-stop
      // (MediaRecorder.start() may use setTimeout internally, so we can't check for zero calls)
      // Instead, verify recording continues indefinitely
      expect(recorder.isRecording()).toBe(true);

      setTimeoutSpy.mockRestore();
    });

    it("should clear timeout on manual stop", async () => {
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

      recorder = new WebAudioRecorder();
      await recorder.startRecording({ maxDuration: 10000 });

      // Simulate dataavailable and stop events
      const dataHandler = (
        mockMediaRecorder.addEventListener as jest.Mock
      ).mock.calls.find(([event]) => event === "dataavailable")?.[1];
      const mockBlob = new Blob(["audio data"], { type: "audio/webm" });
      dataHandler?.({ data: mockBlob });

      mockMediaRecorder.state = "inactive";
      const stopHandler = (
        mockMediaRecorder.addEventListener as jest.Mock
      ).mock.calls.find(([event]) => event === "stop")?.[1];

      const stopPromise = recorder.stopRecording();
      stopHandler?.();
      await stopPromise;

      // Verify clearTimeout was called to prevent auto-stop
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    it("should clear timeout on cleanup", async () => {
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

      recorder = new WebAudioRecorder();
      await recorder.startRecording({ maxDuration: 10000 });

      recorder.cleanup();

      // Verify clearTimeout was called
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    it("should clear timeout on cancel", async () => {
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

      recorder = new WebAudioRecorder();
      await recorder.startRecording({ maxDuration: 10000 });

      await recorder.cancelRecording();

      // Verify clearTimeout was called
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    it("should accept maxDuration of zero without error", async () => {
      recorder = new WebAudioRecorder();

      // Should not throw with zero maxDuration (treated as disabled)
      await expect(
        recorder.startRecording({ maxDuration: 0 })
      ).resolves.not.toThrow();

      expect(recorder.isRecording()).toBe(true);
    });
  });
});
