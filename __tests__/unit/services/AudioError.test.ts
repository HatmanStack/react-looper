/**
 * AudioError Tests
 *
 * Tests for the AudioError class
 */

import { AudioError } from "../../../src/services/audio/AudioError";
import { AudioErrorCode } from "../../../src/types/audio";

describe("AudioError", () => {
  it("creates error with all properties", () => {
    const error = new AudioError(
      AudioErrorCode.RECORDING_FAILED,
      "Test error message",
      "User friendly message",
      { detail: "some detail" },
    );

    expect(error.code).toBe(AudioErrorCode.RECORDING_FAILED);
    expect(error.message).toBe("Test error message");
    expect(error.userMessage).toBe("User friendly message");
    expect(error.context).toEqual({ detail: "some detail" });
    expect(error.platform).toBeTruthy();
    expect(error.timestamp).toBeGreaterThan(0);
    expect(error.name).toBe("AudioError");
  });

  it("uses default user message when not provided", () => {
    const error = new AudioError(
      AudioErrorCode.PERMISSION_DENIED,
      "Test error",
    );

    expect(error.userMessage).toBe(
      "Microphone permission is required to record audio. Please grant permission in your device settings.",
    );
  });

  it("identifies permission errors", () => {
    const permissionError = new AudioError(
      AudioErrorCode.PERMISSION_DENIED,
      "Test",
    );
    const otherError = new AudioError(AudioErrorCode.RECORDING_FAILED, "Test");

    expect(permissionError.isPermissionError()).toBe(true);
    expect(otherError.isPermissionError()).toBe(false);
  });

  it("identifies recoverable errors", () => {
    const recoverable1 = new AudioError(
      AudioErrorCode.RECORDING_FAILED,
      "Test",
    );
    const recoverable2 = new AudioError(AudioErrorCode.PLAYBACK_FAILED, "Test");
    const recoverable3 = new AudioError(AudioErrorCode.MIXING_FAILED, "Test");
    const recoverable4 = new AudioError(
      AudioErrorCode.RESOURCE_UNAVAILABLE,
      "Test",
    );
    const notRecoverable = new AudioError(
      AudioErrorCode.FILE_NOT_FOUND,
      "Test",
    );

    expect(recoverable1.isRecoverable()).toBe(true);
    expect(recoverable2.isRecoverable()).toBe(true);
    expect(recoverable3.isRecoverable()).toBe(true);
    expect(recoverable4.isRecoverable()).toBe(true);
    expect(notRecoverable.isRecoverable()).toBe(false);
  });

  it("provides default user messages for all error codes", () => {
    const errorCodes = [
      AudioErrorCode.PERMISSION_DENIED,
      AudioErrorCode.RECORDING_FAILED,
      AudioErrorCode.PLAYBACK_FAILED,
      AudioErrorCode.MIXING_FAILED,
      AudioErrorCode.FILE_NOT_FOUND,
      AudioErrorCode.INVALID_FORMAT,
      AudioErrorCode.RESOURCE_UNAVAILABLE,
      AudioErrorCode.UNKNOWN_ERROR,
    ];

    errorCodes.forEach((code) => {
      const error = new AudioError(code, "Test");
      expect(error.userMessage).toBeTruthy();
      expect(error.userMessage.length).toBeGreaterThan(0);
    });
  });

  it("formats error for logging", () => {
    const error = new AudioError(
      AudioErrorCode.RECORDING_FAILED,
      "Test error",
      "User message",
      {
        detail: "context",
      },
    );

    const formatted = error.toJSON();
    expect(formatted).toHaveProperty("code");
    expect(formatted).toHaveProperty("message");
    expect(formatted).toHaveProperty("userMessage");
    expect(formatted).toHaveProperty("platform");
    expect(formatted).toHaveProperty("timestamp");
    expect(formatted).toHaveProperty("context");
  });

  it("converts to string", () => {
    const error = new AudioError(AudioErrorCode.RECORDING_FAILED, "Test error");

    const str = error.toString();
    expect(str).toBe("AudioError [RECORDING_FAILED]: Test error");
  });
});
