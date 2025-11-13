/**
 * File Importer Tests (Native and Web)
 */

import { NativeFileImporter } from "../../../src/services/audio/NativeFileImporter";
import { AudioError } from "../../../src/services/audio/AudioError";
import * as DocumentPicker from "expo-document-picker";

// Mock expo-document-picker
jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));

describe("NativeFileImporter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("pickAudioFile", () => {
    it("should return selected audio file", async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        type: "success",
        uri: "file://test-audio.mp3",
        name: "test-audio.mp3",
        size: 1024000,
        mimeType: "audio/mpeg",
      });

      const result = await NativeFileImporter.pickAudioFile();

      expect(result).toEqual({
        uri: "file://test-audio.mp3",
        name: "test-audio.mp3",
        size: 1024000,
        mimeType: "audio/mpeg",
      });
    });

    it("should throw if user cancelled", async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        type: "cancel",
      });

      await expect(NativeFileImporter.pickAudioFile()).rejects.toThrow(
        AudioError,
      );
      await expect(NativeFileImporter.pickAudioFile()).rejects.toThrow(
        "File selection cancelled",
      );
    });

    it("should throw on picker error", async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockRejectedValue(
        new Error("Picker error"),
      );

      await expect(NativeFileImporter.pickAudioFile()).rejects.toThrow(
        AudioError,
      );
      await expect(NativeFileImporter.pickAudioFile()).rejects.toThrow(
        "Failed to open file picker",
      );
    });

    it("should use correct mime types for audio files", async () => {
      await NativeFileImporter.pickAudioFile();

      expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith({
        type: ["audio/*", "audio/mpeg", "audio/mp4", "audio/wav", "audio/webm"],
        copyToCacheDirectory: true,
      });
    });
  });
});

describe("WebFileImporter", () => {
  let mockInput: HTMLInputElement;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock file input element
    mockInput = document.createElement("input");
    jest.spyOn(document, "createElement").mockReturnValue(mockInput);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("pickAudioFile", () => {
    it("should return selected file with blob URL", async () => {
      const mockFile = new File(["audio data"], "test.mp3", {
        type: "audio/mpeg",
      });

      // Simulate file selection
      Object.defineProperty(mockInput, "files", {
        value: [mockFile],
        configurable: true,
      });

      global.URL.createObjectURL = jest.fn(
        () => "blob:http://localhost/test-audio",
      );

      // Trigger the change event
      const pickPromise = NativeFileImporter.pickAudioFile();

      // Simulate user selecting file
      const changeEvent = new Event("change");
      mockInput.dispatchEvent(changeEvent);

      const result = await pickPromise;

      expect(result).toEqual({
        uri: "blob:http://localhost/test-audio",
        name: "test.mp3",
        size: 10,
        mimeType: "audio/mpeg",
      });
    });

    it("should throw if no file selected", async () => {
      Object.defineProperty(mockInput, "files", {
        value: [],
        configurable: true,
      });

      const pickPromise = NativeFileImporter.pickAudioFile();

      const changeEvent = new Event("change");
      mockInput.dispatchEvent(changeEvent);

      await expect(pickPromise).rejects.toThrow(AudioError);
      await expect(pickPromise).rejects.toThrow("No file selected");
    });

    it("should create input with audio accept types", async () => {
      const pickPromise = NativeFileImporter.pickAudioFile();

      expect(mockInput.type).toBe("file");
      expect(mockInput.accept).toBe("audio/*,.mp3,.wav,.m4a,.webm");

      // Cancel to cleanup
      const changeEvent = new Event("change");
      Object.defineProperty(mockInput, "files", {
        value: [],
        configurable: true,
      });
      mockInput.dispatchEvent(changeEvent);

      await expect(pickPromise).rejects.toThrow();
    });

    it("should trigger click on input", () => {
      const clickSpy = jest.spyOn(mockInput, "click");

      void NativeFileImporter.pickAudioFile();

      expect(clickSpy).toHaveBeenCalled();

      // Cleanup
      Object.defineProperty(mockInput, "files", {
        value: [],
        configurable: true,
      });
      mockInput.dispatchEvent(new Event("change"));
    });
  });
});
