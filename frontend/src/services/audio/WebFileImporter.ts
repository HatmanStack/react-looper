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
    // Validate file type using MIME type, magic bytes, or extension
    const isValid = await this.isValidAudioFile(file);
    if (!isValid) {
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
   * Check if file is a valid audio file using MIME type, magic bytes, and extension
   */
  private static async isValidAudioFile(file: File): Promise<boolean> {
    // Check MIME type first
    if (file.type && this.SUPPORTED_AUDIO_TYPES.includes(file.type)) {
      return true;
    }

    // Sniff magic bytes from file header for more reliable detection
    const detectedType = await this.detectAudioTypeFromBytes(file);
    if (detectedType) {
      return true;
    }

    // Check file extension as final fallback
    const extension = file.name.split(".").pop()?.toLowerCase();
    const validExtensions = ["mp3", "wav", "m4a", "aac", "ogg", "webm"];

    return extension ? validExtensions.includes(extension) : false;
  }

  /**
   * Magic byte signatures for common audio formats
   * NOTE: Using magic bytes instead of relying solely on MIME type or file extension
   * because these can be spoofed. Magic bytes provide reliable format detection.
   * The playback verification (verifyAudioPlayback) serves as a final validation.
   */
  private static AUDIO_SIGNATURES: Array<{
    bytes: number[];
    offset: number;
    type: string;
  }> = [
    // MP3: ID3 tag or frame sync
    { bytes: [0x49, 0x44, 0x33], offset: 0, type: "audio/mpeg" }, // ID3
    { bytes: [0xff, 0xfb], offset: 0, type: "audio/mpeg" }, // MP3 frame sync
    { bytes: [0xff, 0xfa], offset: 0, type: "audio/mpeg" }, // MP3 frame sync
    { bytes: [0xff, 0xf3], offset: 0, type: "audio/mpeg" }, // MP3 frame sync
    { bytes: [0xff, 0xf2], offset: 0, type: "audio/mpeg" }, // MP3 frame sync

    // WAV: RIFF header with WAVE format
    { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, type: "audio/wav" }, // RIFF

    // OGG: OggS magic
    { bytes: [0x4f, 0x67, 0x67, 0x53], offset: 0, type: "audio/ogg" },

    // FLAC: fLaC magic
    { bytes: [0x66, 0x4c, 0x61, 0x43], offset: 0, type: "audio/flac" },

    // M4A/MP4: ftyp atom (need to also check for audio-specific ftyp)
    { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4, type: "audio/mp4" },

    // WebM: EBML header (0x1A 0x45 0xDF 0xA3)
    { bytes: [0x1a, 0x45, 0xdf, 0xa3], offset: 0, type: "audio/webm" },
  ];

  /**
   * Detect audio type from file magic bytes
   * More reliable than MIME type or extension which can be spoofed
   */
  private static async detectAudioTypeFromBytes(
    file: File,
  ): Promise<string | null> {
    try {
      // Read first 12 bytes (enough for all signatures)
      const buffer = await file.slice(0, 12).arrayBuffer();
      const bytes = new Uint8Array(buffer);

      for (const sig of this.AUDIO_SIGNATURES) {
        if (this.matchesSignature(bytes, sig.bytes, sig.offset)) {
          // For WAV, verify WAVE format marker at offset 8
          if (sig.type === "audio/wav") {
            const waveMarker = [0x57, 0x41, 0x56, 0x45]; // "WAVE"
            if (!this.matchesSignature(bytes, waveMarker, 8)) {
              continue; // Not a WAV file, might be AVI or other RIFF format
            }
          }
          return sig.type;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if bytes match a signature at given offset
   */
  private static matchesSignature(
    bytes: Uint8Array,
    signature: number[],
    offset: number,
  ): boolean {
    if (bytes.length < offset + signature.length) {
      return false;
    }

    for (let i = 0; i < signature.length; i++) {
      // For MP3 frame sync, mask the second byte (only check sync bits)
      if (
        signature[0] === 0xff &&
        i === 1 &&
        (signature[1] & 0xf0) === 0xf0
      ) {
        if ((bytes[offset + i] & 0xf0) !== 0xf0) {
          return false;
        }
      } else if (bytes[offset + i] !== signature[i]) {
        return false;
      }
    }

    return true;
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
