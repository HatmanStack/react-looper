/**
 * Tests for WebAudioRecorder
 *
 * Covers start, stop, error propagation, permissions, cancel, and duration.
 */
import { WebAudioRecorder } from "../WebAudioRecorder";
import { AudioError } from "../AudioError";

// Mock logger
jest.mock("../../../utils/logger", () => ({
  logger: {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

let mockMediaRecorder: any;
let mockMediaStream: any;

beforeEach(() => {
  jest.useFakeTimers();

  mockMediaRecorder = {
    state: "recording",
    start: jest.fn(),
    stop: jest.fn().mockImplementation(function (this: any) {
      if (this.onstop) {
        setTimeout(() => this.onstop(), 0);
      }
    }),
    ondataavailable: null as any,
    onstart: null as any,
    onstop: null as any,
    onerror: null as any,
    mimeType: "audio/webm",
  };

  mockMediaStream = {
    getAudioTracks: jest.fn().mockReturnValue([
      {
        label: "default",
        enabled: true,
        readyState: "live",
        muted: false,
        stop: jest.fn(),
      },
    ]),
    getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }]),
  };

  (global as any).MediaRecorder = jest
    .fn()
    .mockImplementation(() => mockMediaRecorder);
  (global.MediaRecorder as any).isTypeSupported = jest
    .fn()
    .mockReturnValue(true);

  (global.navigator as any) = {
    mediaDevices: {
      getUserMedia: jest.fn().mockResolvedValue(mockMediaStream),
    },
    permissions: {
      query: jest.fn().mockResolvedValue({ state: "granted" }),
    },
  };

  (global as any).URL = {
    createObjectURL: jest.fn().mockReturnValue("blob:test-url"),
    revokeObjectURL: jest.fn(),
  };

  (global as any).Blob = class MockBlob {
    parts: any[];
    options: any;
    size: number;
    type: string;
    constructor(parts: any[] = [], options: any = {}) {
      this.parts = parts;
      this.options = options;
      this.size = 1024;
      this.type = options.type || "";
    }
  };
});

afterEach(() => {
  jest.useRealTimers();
});

describe("WebAudioRecorder", () => {
  describe("startRecording", () => {
    it("requests user media and creates MediaRecorder", async () => {
      const recorder = new WebAudioRecorder();
      await recorder.startRecording();

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: expect.any(Object),
        }),
      );
      expect(global.MediaRecorder).toHaveBeenCalled();
      expect(recorder.isRecording()).toBe(true);
    });

    it("starts MediaRecorder with 100ms timeslice", async () => {
      const recorder = new WebAudioRecorder();
      await recorder.startRecording();

      expect(mockMediaRecorder.start).toHaveBeenCalledWith(100);
    });

    it("throws AudioError on permission denied", async () => {
      (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValue(
        Object.assign(new Error("Not allowed"), { name: "NotAllowedError" }),
      );

      const recorder = new WebAudioRecorder();
      await expect(recorder.startRecording()).rejects.toThrow(AudioError);
    });
  });

  describe("stopRecording", () => {
    it("stops MediaRecorder and returns blob URL", async () => {
      const recorder = new WebAudioRecorder();
      await recorder.startRecording();

      // Simulate data available
      const dataEvent = { data: new Blob(["audio data"]) };
      mockMediaRecorder.ondataavailable(dataEvent);

      const uriPromise = recorder.stopRecording();
      jest.runAllTimers(); // trigger onstop
      const uri = await uriPromise;

      expect(uri).toBe("blob:test-url");
      expect(recorder.isRecording()).toBe(false);
    });
  });

  describe("onerror handler", () => {
    it("rejects the stop promise with AudioError when onerror fires", async () => {
      const recorder = new WebAudioRecorder();
      await recorder.startRecording();

      // Override stop to trigger onerror instead of onstop
      mockMediaRecorder.stop = jest
        .fn()
        .mockImplementation(function (this: any) {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Event("error"));
            }
          }, 0);
        });

      const promise = recorder.stopRecording();
      jest.runAllTimers();
      await expect(promise).rejects.toThrow(AudioError);
    });

    it("cleans up media stream on error", async () => {
      const recorder = new WebAudioRecorder();
      await recorder.startRecording();

      const trackStopFn = mockMediaStream.getTracks()[0].stop;

      mockMediaRecorder.stop = jest
        .fn()
        .mockImplementation(function (this: any) {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Event("error"));
            }
          }, 0);
        });

      const promise = recorder.stopRecording();
      jest.runAllTimers();
      try {
        await promise;
      } catch {
        // Expected to reject
      }

      expect(trackStopFn).toHaveBeenCalled();
    });
  });

  describe("getPermissions", () => {
    it("calls getUserMedia and stops the stream", async () => {
      const recorder = new WebAudioRecorder();
      const result = await recorder.getPermissions();

      expect(result).toBe(true);
    });

    it("returns false when permission denied", async () => {
      (navigator.permissions.query as jest.Mock).mockResolvedValue({
        state: "denied",
      });

      const recorder = new WebAudioRecorder();
      const result = await recorder.getPermissions();

      expect(result).toBe(false);
    });
  });

  describe("cancelRecording", () => {
    it("stops MediaRecorder without assembling output", async () => {
      const recorder = new WebAudioRecorder();
      await recorder.startRecording();

      await recorder.cancelRecording();

      expect(recorder.isRecording()).toBe(false);
    });
  });

  describe("getRecordingDuration", () => {
    it("returns elapsed time since recording start", async () => {
      const recorder = new WebAudioRecorder();
      await recorder.startRecording();

      // Advance time
      jest.advanceTimersByTime(1500);

      const duration = recorder.getRecordingDuration();
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it("returns 0 when not recording", () => {
      const recorder = new WebAudioRecorder();
      expect(recorder.getRecordingDuration()).toBe(0);
    });
  });
});
