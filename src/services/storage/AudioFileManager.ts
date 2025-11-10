/**
 * Audio File Manager Interface
 *
 * Manages audio file storage, retrieval, and deletion across platforms.
 * Handles both temporary and permanent storage of audio files.
 */

export interface AudioFileInfo {
  uri: string;
  name: string;
  size: number;
  type: string;
  duration?: number;
  createdAt: number;
  isTemporary: boolean;
}

export interface StorageInfo {
  totalSpace?: number;
  availableSpace?: number;
  usedSpace: number;
  fileCount: number;
}

/**
 * Audio File Manager
 *
 * Platform-agnostic interface for audio file storage operations.
 */
export abstract class AudioFileManager {
  /**
   * Save a file to storage
   *
   * @param blob - File blob or URI to save
   * @param name - Filename (will be sanitized)
   * @param isTemporary - Whether this is a temporary file
   * @returns URI of saved file
   */
  abstract saveFile(blob: Blob | string, name: string, isTemporary?: boolean): Promise<string>;

  /**
   * Get file information
   *
   * @param uri - File URI
   * @returns File information
   */
  abstract getFileInfo(uri: string): Promise<AudioFileInfo | null>;

  /**
   * Delete a file
   *
   * @param uri - File URI to delete
   */
  abstract deleteFile(uri: string): Promise<void>;

  /**
   * List all files
   *
   * @param includeTemporary - Include temporary files
   * @returns Array of file information
   */
  abstract listFiles(includeTemporary?: boolean): Promise<AudioFileInfo[]>;

  /**
   * Move file from temporary to permanent storage
   *
   * @param tempUri - Temporary file URI
   * @param permanentName - New filename for permanent storage
   * @returns New permanent URI
   */
  abstract makePermanent(tempUri: string, permanentName: string): Promise<string>;

  /**
   * Clean up temporary files
   *
   * @param olderThanMs - Delete temp files older than this many milliseconds
   * @returns Number of files deleted
   */
  abstract cleanupTempFiles(olderThanMs?: number): Promise<number>;

  /**
   * Get storage information
   *
   * @returns Storage statistics
   */
  abstract getStorageInfo(): Promise<StorageInfo>;

  /**
   * Check if there's enough storage space
   *
   * @param requiredBytes - Required space in bytes
   * @returns True if enough space available
   */
  abstract hasEnoughSpace(requiredBytes: number): Promise<boolean>;

  /**
   * Sanitize filename to prevent path traversal and invalid characters
   *
   * @param filename - Original filename
   * @returns Sanitized filename
   */
  protected sanitizeFilename(filename: string): string {
    // Remove path separators and invalid characters
    let sanitized = filename.replace(/[/\\?%*:|"<>]/g, '_');

    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');

    // Ensure filename is not empty
    if (!sanitized) {
      sanitized = 'untitled';
    }

    // Limit length
    if (sanitized.length > 200) {
      const ext = sanitized.substring(sanitized.lastIndexOf('.'));
      const name = sanitized.substring(0, 200 - ext.length);
      sanitized = name + ext;
    }

    return sanitized;
  }

  /**
   * Generate unique filename with timestamp and random suffix
   *
   * @param baseName - Base filename
   * @param extension - File extension (with or without dot)
   * @returns Unique filename
   */
  protected generateUniqueFilename(baseName: string, extension: string): string {
    const sanitizedBase = this.sanitizeFilename(baseName);
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    return `${sanitizedBase}_${timestamp}_${random}${ext}`;
  }
}
