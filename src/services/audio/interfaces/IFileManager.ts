/**
 * IFileManager Interface
 *
 * Defines the contract for file management operations related to audio files.
 * Handles file I/O, storage management, and file system interactions.
 */

import { AudioFormat } from "../../../types/audio";

export interface IFileManager {
  /**
   * Save audio data to a file
   *
   * @param data - Audio data (blob, buffer, or base64 string)
   * @param filename - Desired filename (without extension)
   * @param format - Audio format
   * @returns Promise resolving to the URI of the saved file
   * @throws {AudioError} if save operation fails
   */
  saveAudioFile(
    data: any,
    filename: string,
    format: AudioFormat,
  ): Promise<string>;

  /**
   * Delete an audio file
   *
   * @param uri - URI/path to the file to delete
   * @returns Promise resolving to true if deleted, false if file didn't exist
   */
  deleteAudioFile(uri: string): Promise<boolean>;

  /**
   * Copy an audio file to app storage
   *
   * Copies a file from external storage (e.g., user's Downloads folder)
   * to the app's internal storage.
   *
   * @param sourceUri - Source file URI
   * @param filename - Desired filename in app storage
   * @returns Promise resolving to the new URI in app storage
   */
  copyToAppStorage(sourceUri: string, filename: string): Promise<string>;

  /**
   * Export an audio file to external storage
   *
   * Copies a file from app storage to a user-accessible location
   * (e.g., Downloads folder, Music library).
   *
   * @param uri - Source file URI in app storage
   * @param filename - Desired filename for export
   * @returns Promise resolving to the exported file URI
   */
  exportToExternalStorage(uri: string, filename: string): Promise<string>;

  /**
   * Check if a file exists
   *
   * @param uri - URI/path to check
   * @returns Promise resolving to true if file exists, false otherwise
   */
  fileExists(uri: string): Promise<boolean>;

  /**
   * Get file size in bytes
   *
   * @param uri - URI/path to the file
   * @returns Promise resolving to file size in bytes
   * @throws {AudioError} FILE_NOT_FOUND if file doesn't exist
   */
  getFileSize(uri: string): Promise<number>;

  /**
   * Get file info (size, creation date, etc.)
   *
   * @param uri - URI/path to the file
   * @returns Promise resolving to file information
   */
  getFileInfo(uri: string): Promise<FileInfo>;

  /**
   * List all audio files in app storage
   *
   * @returns Promise resolving to array of file URIs
   */
  listAudioFiles(): Promise<string[]>;

  /**
   * Get available storage space in bytes
   *
   * @returns Promise resolving to available bytes
   */
  getAvailableSpace(): Promise<number>;

  /**
   * Clean up temporary files
   *
   * Removes temporary files created during recording, mixing, etc.
   * Should be called periodically or on app startup.
   */
  cleanupTempFiles(): Promise<void>;

  /**
   * Generate a unique filename
   *
   * Creates a unique filename to avoid collisions.
   * Typically based on timestamp or UUID.
   *
   * @param prefix - Optional prefix for the filename
   * @param format - Audio format (affects extension)
   * @returns Unique filename (without path)
   */
  generateUniqueFilename(prefix?: string, format?: AudioFormat): string;
}

/**
 * File information structure
 */
export interface FileInfo {
  /**
   * File URI/path
   */
  uri: string;

  /**
   * File size in bytes
   */
  size: number;

  /**
   * Creation timestamp (ms since epoch)
   */
  createdAt: number;

  /**
   * Last modified timestamp (ms since epoch)
   */
  modifiedAt: number;

  /**
   * File extension/format
   */
  extension: string;

  /**
   * Whether the file is readable
   */
  readable: boolean;

  /**
   * Whether the file is writable
   */
  writable: boolean;
}
