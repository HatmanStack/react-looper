/**
 * Mock File Manager
 *
 * Simulates file operations for development and testing.
 * No actual file I/O occurs - uses in-memory storage simulation.
 */

import { IFileManager, FileInfo } from '../interfaces/IFileManager';
import { AudioFormat } from '../../../types/audio';
import {
  generateMockUri,
  getMockFileSize,
  MOCK_AUDIO_URIS,
} from '../../../../__tests__/__fixtures__/mockAudioData';

export class MockFileManager implements IFileManager {
  // In-memory "file system"
  private files: Map<string, MockFile> = new Map();

  constructor() {
    // Pre-populate with some mock files
    this.initializeMockFiles();
  }

  /**
   * Initialize mock file system with test data
   */
  private initializeMockFiles(): void {
    Object.values(MOCK_AUDIO_URIS).forEach((uri) => {
      this.files.set(uri, {
        uri,
        size: getMockFileSize(uri),
        createdAt: Date.now() - Math.random() * 86400000, // Random time in last 24h
        modifiedAt: Date.now() - Math.random() * 3600000, // Random time in last hour
        data: new Uint8Array(0), // Empty data for mock
      });
    });

    console.log(`[MockFileManager] Initialized with ${this.files.size} mock files`);
  }

  /**
   * Save audio file (mock implementation)
   */
  async saveAudioFile(data: any, filename: string, format: AudioFormat): Promise<string> {
    console.log('[MockFileManager] Saving audio file:', filename, format);

    await this.delay(100);

    const uri = `mock://audio/${filename}.${format}`;

    // Simulate file size based on format
    const size = this.estimateFileSize(format);

    this.files.set(uri, {
      uri,
      size,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      data,
    });

    console.log(`[MockFileManager] File saved: ${uri} (${size} bytes)`);
    return uri;
  }

  /**
   * Delete audio file
   */
  async deleteAudioFile(uri: string): Promise<boolean> {
    console.log('[MockFileManager] Deleting file:', uri);

    await this.delay(50);

    const existed = this.files.has(uri);
    this.files.delete(uri);

    console.log(`[MockFileManager] File ${existed ? 'deleted' : 'not found'}:`, uri);
    return existed;
  }

  /**
   * Copy to app storage
   */
  async copyToAppStorage(sourceUri: string, filename: string): Promise<string> {
    console.log('[MockFileManager] Copying to app storage:', sourceUri, '->', filename);

    await this.delay(150);

    const format = sourceUri.split('.').pop() || 'mp3';
    const destUri = `mock://audio/${filename}.${format}`;

    // Copy file data if source exists
    const sourceFile = this.files.get(sourceUri);
    if (sourceFile) {
      this.files.set(destUri, {
        ...sourceFile,
        uri: destUri,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      });
    } else {
      // Create new file
      this.files.set(destUri, {
        uri: destUri,
        size: 1000000, // 1 MB default
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        data: new Uint8Array(0),
      });
    }

    console.log(`[MockFileManager] File copied: ${destUri}`);
    return destUri;
  }

  /**
   * Export to external storage
   */
  async exportToExternalStorage(uri: string, filename: string): Promise<string> {
    console.log('[MockFileManager] Exporting to external storage:', uri, '->', filename);

    await this.delay(200);

    const format = uri.split('.').pop() || 'mp3';
    const exportUri = `mock://external/${filename}.${format}`;

    console.log(`[MockFileManager] File exported: ${exportUri}`);
    return exportUri;
  }

  /**
   * Check if file exists
   */
  async fileExists(uri: string): Promise<boolean> {
    await this.delay(20);
    return this.files.has(uri);
  }

  /**
   * Get file size
   */
  async getFileSize(uri: string): Promise<number> {
    await this.delay(20);

    const file = this.files.get(uri);
    if (!file) {
      throw new Error(`File not found: ${uri}`);
    }

    return file.size;
  }

  /**
   * Get file info
   */
  async getFileInfo(uri: string): Promise<FileInfo> {
    await this.delay(30);

    const file = this.files.get(uri);
    if (!file) {
      throw new Error(`File not found: ${uri}`);
    }

    const extension = uri.split('.').pop() || '';

    return {
      uri: file.uri,
      size: file.size,
      createdAt: file.createdAt,
      modifiedAt: file.modifiedAt,
      extension,
      readable: true,
      writable: true,
    };
  }

  /**
   * List all audio files
   */
  async listAudioFiles(): Promise<string[]> {
    console.log('[MockFileManager] Listing audio files');

    await this.delay(50);

    const uris = Array.from(this.files.keys()).filter(
      (uri) => uri.startsWith('mock://audio/') && !uri.includes('/temp-')
    );

    console.log(`[MockFileManager] Found ${uris.length} audio files`);
    return uris;
  }

  /**
   * Get available storage space
   */
  async getAvailableSpace(): Promise<number> {
    await this.delay(30);

    // Mock unlimited space (10 GB)
    return 10 * 1024 * 1024 * 1024;
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(): Promise<void> {
    console.log('[MockFileManager] Cleaning up temporary files');

    await this.delay(100);

    // Remove files with "temp" in the URI
    const tempFiles = Array.from(this.files.keys()).filter((uri) => uri.includes('/temp-'));

    tempFiles.forEach((uri) => {
      this.files.delete(uri);
    });

    console.log(`[MockFileManager] Cleaned up ${tempFiles.length} temporary files`);
  }

  /**
   * Generate unique filename
   */
  generateUniqueFilename(prefix?: string, format?: AudioFormat): string {
    const finalPrefix = prefix || 'audio';
    const finalFormat = format || AudioFormat.MP3;
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);

    return `${finalPrefix}-${timestamp}-${random}.${finalFormat}`;
  }

  /**
   * Estimate file size based on format (for mock purposes)
   */
  private estimateFileSize(format: AudioFormat): number {
    switch (format) {
      case AudioFormat.WAV:
        return 5000000; // ~5 MB
      case AudioFormat.MP3:
        return 2000000; // ~2 MB
      case AudioFormat.M4A:
        return 1500000; // ~1.5 MB
      case AudioFormat.THREE_GPP:
        return 1000000; // ~1 MB
      default:
        return 2000000;
    }
  }

  /**
   * Helper to simulate async delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Internal mock file structure
 */
interface MockFile {
  uri: string;
  size: number;
  createdAt: number;
  modifiedAt: number;
  data: any;
}
