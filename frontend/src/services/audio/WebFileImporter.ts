/**
 * WebFileImporter
 *
 * Web-specific file import functionality using HTML File API.
 * Allows users to select audio files from their computer.
 */

import { AudioErrorCode } from "../../types/audio";
import { AudioError } from "./AudioError";

export interface ImportedFile {
  uri: string;
  name: string;
  size: number;
  type: string;
}

export class WebFileImporter {
  private static SUPPORTED_AUDIO_TYPES = [
    "audio/mpeg", // MP3
    "audio/mp4", // M4A
    "audio/wav",
    "audio/wave",
    "audio/webm",
    "audio/ogg",
    "audio/aac",
    "audio/x-m4a",
  ];

  /**
   * Open file picker and allow user to select an audio file
   */
  public static async pickAudioFile(): Promise<ImportedFile> {
    return new Promise((resolve, reject) => {
      // Create file input element
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "audio/*";
      input.style.display = "none";

      // Handle file selection
      input.onchange = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) {
          reject(
            new AudioError(
              AudioErrorCode.FILE_NOT_FOUND,
              "No file selected",
              "Please select an audio file.",
            ),
          );
          return;
        }

        try {
          const importedFile = await this.processFile(file);
          resolve(importedFile);
        } catch (error) {
          reject(error);
        } finally {
          // Cleanup input element
          document.body.removeChild(input);
        }
      };

      // Handle cancel
      input.oncancel = () => {
        document.body.removeChild(input);
        reject(
          new AudioError(
            AudioErrorCode.FILE_NOT_FOUND,
            "File selection cancelled",
            "File selection was cancelled.",
          ),
        );
      };

      // Add to DOM and trigger click
      document.body.appendChild(input);
      input.click();
    });
  }

  /**
   * Process selected file and create blob URL
   */
  private static async processFile(file: File): Promise<ImportedFile> {
    // Validate file type
    if (!this.isValidAudioFile(file)) {
      throw new AudioError(
        AudioErrorCode.INVALID_FORMAT,
        `Unsupported file type: ${file.type}`,
        "This file type is not supported. Please select an MP3, WAV, or M4A file.",
      );
    }

    // Validate file size (e.g., max 100MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_FILE_SIZE) {
      throw new AudioError(
        AudioErrorCode.INVALID_FORMAT,
        `File too large: ${file.size} bytes`,
        "The selected file is too large. Please select a file smaller than 100MB.",
      );
    }

    // Create blob URL
    const blobUrl = URL.createObjectURL(file);

    // Verify the audio is playable
    const isPlayable = await this.verifyAudioPlayback(blobUrl);
    if (!isPlayable) {
      URL.revokeObjectURL(blobUrl);
      throw new AudioError(
        AudioErrorCode.INVALID_FORMAT,
        "Audio file cannot be played",
        "This audio file appears to be corrupted or in an unsupported format.",
      );
    }

    return {
      uri: blobUrl,
      name: file.name,
      size: file.size,
      type: file.type,
    };
  }

  /**
   * Check if file is a valid audio file
   */
  private static isValidAudioFile(file: File): boolean {
    // Check MIME type
    if (file.type && this.SUPPORTED_AUDIO_TYPES.includes(file.type)) {
      return true;
    }

    // Check file extension as fallback
    const extension = file.name.split(".").pop()?.toLowerCase();
    const validExtensions = ["mp3", "wav", "m4a", "aac", "ogg", "webm"];

    return extension ? validExtensions.includes(extension) : false;
  }

  /**
   * Verify that the audio file can be played
   */
  private static async verifyAudioPlayback(blobUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const audio = new Audio();

      const cleanup = () => {
        audio.remove();
      };

      audio.onloadedmetadata = () => {
        cleanup();
        resolve(true);
      };

      audio.onerror = () => {
        cleanup();
        resolve(false);
      };

      // Set timeout to avoid hanging
      setTimeout(() => {
        cleanup();
        resolve(false);
      }, 5000);

      audio.src = blobUrl;
    });
  }

  /**
   * Revoke a blob URL to free memory
   */
  public static revokeBlobUrl(url: string): void {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }
}
