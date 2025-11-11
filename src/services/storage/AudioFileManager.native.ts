/**
 * Native Audio File Manager
 *
 * Uses expo-file-system for file storage on iOS and Android.
 */

import { Paths, Directory, File } from "expo-file-system";
import {
  AudioFileManager,
  AudioFileInfo,
  StorageInfo,
} from "./AudioFileManager";

const TEMP_DIR_NAME = "temp";
const PERMANENT_DIR_NAME = "audio";
const METADATA_FILE_NAME = "file_metadata.json";

interface FileMetadata {
  [uri: string]: {
    name: string;
    size: number;
    type: string;
    duration?: number;
    createdAt: number;
    isTemporary: boolean;
  };
}

export class NativeAudioFileManager extends AudioFileManager {
  private tempDir: Directory;
  private permanentDir: Directory;
  private metadataFile: File;
  private metadata: FileMetadata = {};
  private initialized = false;

  constructor() {
    super();
    this.tempDir = new Directory(Paths.document, TEMP_DIR_NAME);
    this.permanentDir = new Directory(Paths.document, PERMANENT_DIR_NAME);
    this.metadataFile = new File(Paths.document, METADATA_FILE_NAME);
  }

  /**
   * Initialize directories and load metadata
   */
  private async init(): Promise<void> {
    if (this.initialized) return;

    // Create directories if they don't exist
    if (!this.tempDir.exists) {
      this.tempDir.create();
      console.log("[NativeAudioFileManager] Created temp directory");
    }

    if (!this.permanentDir.exists) {
      this.permanentDir.create();
      console.log("[NativeAudioFileManager] Created permanent directory");
    }

    // Load metadata
    await this.loadMetadata();

    this.initialized = true;
  }

  /**
   * Load metadata from file
   */
  private async loadMetadata(): Promise<void> {
    try {
      if (this.metadataFile.exists) {
        const content = await this.metadataFile.text();
        this.metadata = JSON.parse(content);
        console.log(
          `[NativeAudioFileManager] Loaded metadata for ${Object.keys(this.metadata).length} files`,
        );
      } else {
        this.metadata = {};
      }
    } catch (error) {
      console.error("[NativeAudioFileManager] Failed to load metadata:", error);
      this.metadata = {};
    }
  }

  /**
   * Save metadata to file
   */
  private async saveMetadata(): Promise<void> {
    try {
      const content = JSON.stringify(this.metadata, null, 2);
      await this.metadataFile.write(content);
    } catch (error) {
      console.error("[NativeAudioFileManager] Failed to save metadata:", error);
      throw new Error("Failed to save file metadata");
    }
  }

  /**
   * Save file to storage
   */
  async saveFile(
    uriOrBlob: string | Blob,
    name: string,
    isTemporary = true,
  ): Promise<string> {
    await this.init();

    if (uriOrBlob instanceof Blob) {
      throw new Error(
        "Blob not supported on native platform, use file URI instead",
      );
    }

    const sourceUri = uriOrBlob;
    const sanitizedName = this.sanitizeFilename(name);
    const uniqueName = this.generateUniqueFilename(
      sanitizedName.replace(/\.[^/.]+$/, ""), // Remove extension
      sanitizedName.substring(sanitizedName.lastIndexOf(".") + 1) || "m4a",
    );

    // Determine destination directory
    const destDir = isTemporary ? this.tempDir : this.permanentDir;
    const destFile = new File(destDir, uniqueName);

    // Copy file
    const sourceFile = new File(sourceUri);
    sourceFile.copy(destFile);

    // Get file info
    const info = destFile.info();

    // Store metadata
    this.metadata[destFile.uri] = {
      name: uniqueName,
      size: info.size || 0,
      type: "audio/mpeg",
      createdAt: Date.now(),
      isTemporary,
    };

    await this.saveMetadata();

    console.log(
      `[NativeAudioFileManager] Saved file: ${uniqueName} (${info.size} bytes) to ${isTemporary ? "temp" : "permanent"}`,
    );

    return destFile.uri;
  }

  /**
   * Get file information
   */
  async getFileInfo(uri: string): Promise<AudioFileInfo | null> {
    await this.init();

    const meta = this.metadata[uri];
    if (!meta) {
      return null;
    }

    return {
      uri,
      name: meta.name,
      size: meta.size,
      type: meta.type,
      duration: meta.duration,
      createdAt: meta.createdAt,
      isTemporary: meta.isTemporary,
    };
  }

  /**
   * Delete file
   */
  async deleteFile(uri: string): Promise<void> {
    await this.init();

    try {
      const file = new File(uri);
      if (file.exists) {
        file.delete();
      }

      // Remove from metadata
      delete this.metadata[uri];
      await this.saveMetadata();

      console.log(`[NativeAudioFileManager] Deleted file: ${uri}`);
    } catch (error) {
      console.error(
        `[NativeAudioFileManager] Failed to delete file: ${uri}`,
        error,
      );
      throw new Error(`Failed to delete file: ${uri}`);
    }
  }

  /**
   * List all files
   */
  async listFiles(includeTemporary = false): Promise<AudioFileInfo[]> {
    await this.init();

    const files: AudioFileInfo[] = [];

    for (const [uri, meta] of Object.entries(this.metadata)) {
      if (includeTemporary || !meta.isTemporary) {
        files.push({
          uri,
          name: meta.name,
          size: meta.size,
          type: meta.type,
          duration: meta.duration,
          createdAt: meta.createdAt,
          isTemporary: meta.isTemporary,
        });
      }
    }

    return files.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Move file from temporary to permanent storage
   */
  async makePermanent(tempUri: string, permanentName: string): Promise<string> {
    await this.init();

    const meta = this.metadata[tempUri];
    if (!meta) {
      throw new Error(`File not found: ${tempUri}`);
    }

    if (!meta.isTemporary) {
      // Already permanent
      return tempUri;
    }

    const sanitizedName = this.sanitizeFilename(permanentName);
    const uniqueName = this.generateUniqueFilename(
      sanitizedName.replace(/\.[^/.]+$/, ""),
      sanitizedName.substring(sanitizedName.lastIndexOf(".") + 1) || "m4a",
    );

    // Move file
    const sourceFile = new File(tempUri);
    const destFile = new File(this.permanentDir, uniqueName);

    sourceFile.move(destFile);

    // Update metadata
    const newUri = destFile.uri;
    this.metadata[newUri] = {
      ...meta,
      name: uniqueName,
      isTemporary: false,
    };
    delete this.metadata[tempUri];

    await this.saveMetadata();

    console.log(
      `[NativeAudioFileManager] Made permanent: ${tempUri} -> ${newUri}`,
    );

    return newUri;
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(olderThanMs = 24 * 60 * 60 * 1000): Promise<number> {
    await this.init();

    const cutoffTime = Date.now() - olderThanMs;
    let deletedCount = 0;

    const filesToDelete: string[] = [];

    for (const [uri, meta] of Object.entries(this.metadata)) {
      if (meta.isTemporary && meta.createdAt < cutoffTime) {
        filesToDelete.push(uri);
      }
    }

    for (const uri of filesToDelete) {
      try {
        await this.deleteFile(uri);
        deletedCount++;
      } catch (error) {
        console.error(
          `[NativeAudioFileManager] Failed to delete temp file: ${uri}`,
          error,
        );
      }
    }

    console.log(
      `[NativeAudioFileManager] Cleaned up ${deletedCount} temporary files`,
    );

    return deletedCount;
  }

  /**
   * Get storage information
   */
  async getStorageInfo(): Promise<StorageInfo> {
    await this.init();

    const files = await this.listFiles(true);
    const usedSpace = files.reduce((total, file) => total + file.size, 0);

    // Get total and available space
    let totalSpace: number | undefined;
    let availableSpace: number | undefined;

    try {
      totalSpace = Paths.totalDiskSpace;
      availableSpace = Paths.availableDiskSpace;
    } catch (error) {
      console.warn("[NativeAudioFileManager] Could not get disk space info");
    }

    return {
      totalSpace,
      availableSpace,
      usedSpace,
      fileCount: files.length,
    };
  }

  /**
   * Check if there's enough storage space
   */
  async hasEnoughSpace(requiredBytes: number): Promise<boolean> {
    const info = await this.getStorageInfo();

    if (info.availableSpace === undefined) {
      return true; // Assume available if we can't check
    }

    // Keep at least 100MB buffer
    const bufferBytes = 100 * 1024 * 1024;
    return info.availableSpace >= requiredBytes + bufferBytes;
  }
}
