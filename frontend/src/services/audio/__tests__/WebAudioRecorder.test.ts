/**
 * Tests for WebAudioRecorder onerror handling
 */
import { WebAudioRecorder } from "../WebAudioRecorder";
import { AudioError } from "../AudioError";

// Mock MediaRecorder
let mockMediaRecorder: any;
let mockMediaStream: any;

beforeEach(() => {
  mockMediaRecorder = {
    state: "recording",
    start: jest.fn(),
    stop: jest.fn().mockImplementation(function (this: any) {
      // Trigger onstop asynchronously
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

  (global as any).MediaRecorder = jest.fn().mockImplementation(() => mockMediaRecorder);
  (global.MediaRecorder as any).isTypeSupported = jest.fn().mockReturnValue(true);

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
});

describe("WebAudioRecorder", () => {
  describe("onerror handler", () => {
    it("rejects the stop promise with AudioError when onerror fires", async () => {
      const recorder = new WebAudioRecorder();
      await recorder.startRecording();

      // Override stop to trigger onerror instead of onstop
      mockMediaRecorder.stop = jest.fn().mockImplementation(function (this: any) {
        // Fire onerror after a tick
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new Event("error"));
          }
        }, 0);
      });

      // stopRecording should reject with AudioError
      await expect(recorder.stopRecording()).rejects.toThrow(AudioError);
    });

    it("cleans up media stream on error", async () => {
      const recorder = new WebAudioRecorder();
      await recorder.startRecording();

      const trackStopFn = mockMediaStream.getTracks()[0].stop;

      // Override stop to trigger onerror
      mockMediaRecorder.stop = jest.fn().mockImplementation(function (this: any) {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new Event("error"));
          }
        }, 0);
      });

      try {
        await recorder.stopRecording();
      } catch {
        // Expected to reject
      }

      expect(trackStopFn).toHaveBeenCalled();
    });
  });
});
