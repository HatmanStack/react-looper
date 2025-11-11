/**
 * Web Audio File Manager
 *
 * Uses IndexedDB to store file metadata and blob URLs for web platform.
 */

import {
  AudioFileManager,
  AudioFileInfo,
  StorageInfo,
} from "./AudioFileManager";

const DB_NAME = "AudioLooperDB";
const DB_VERSION = 1;
const STORE_NAME = "audioFiles";

interface StoredFileRecord {
  uri: string; // blob URL
  name: string;
  size: number;
  type: string;
  duration?: number;
  createdAt: number;
  isTemporary: boolean;
  blob: Blob; // Store the actual blob
}

export class WebAudioFileManager extends AudioFileManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB
   */
  private async init(): Promise<void> {
    if (this.db) return;

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, {
            keyPath: "uri",
          });
          objectStore.createIndex("name", "name", { unique: false });
          objectStore.createIndex("createdAt", "createdAt", { unique: false });
          objectStore.createIndex("isTemporary", "isTemporary", {
            unique: false,
          });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Save file to IndexedDB
   */
  async saveFile(
    blobOrUri: Blob | string,
    name: string,
    isTemporary = true,
  ): Promise<string> {
    await this.init();

    let blob: Blob;
    if (typeof blobOrUri === "string") {
      // If it's a blob URL, fetch the blob
      const response = await fetch(blobOrUri);
      blob = await response.blob();
    } else {
      blob = blobOrUri;
    }

    const sanitizedName = this.sanitizeFilename(name);
    const uniqueName = this.generateUniqueFilename(
      sanitizedName.replace(/\.[^/.]+$/, ""), // Remove extension
      sanitizedName.substring(sanitizedName.lastIndexOf(".") + 1) || "mp3",
    );

    const blobUrl = URL.createObjectURL(blob);

    const record: StoredFileRecord = {
      uri: blobUrl,
      name: uniqueName,
      size: blob.size,
      type: blob.type || "audio/mpeg",
      createdAt: Date.now(),
      isTemporary,
      blob,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => {
        console.log(
          `[WebAudioFileManager] Saved file: ${uniqueName} (${blob.size} bytes)`,
        );
        resolve(blobUrl);
      };

      request.onerror = () => {
        reject(new Error(`Failed to save file: ${uniqueName}`));
      };
    });
  }

  /**
   * Get file information
   */
  async getFileInfo(uri: string): Promise<AudioFileInfo | null> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(uri);

      request.onsuccess = () => {
        const record = request.result as StoredFileRecord | undefined;
        if (!record) {
          resolve(null);
          return;
        }

        const info: AudioFileInfo = {
          uri: record.uri,
          name: record.name,
          size: record.size,
          type: record.type,
          duration: record.duration,
          createdAt: record.createdAt,
          isTemporary: record.isTemporary,
        };

        resolve(info);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get file info for: ${uri}`));
      };
    });
  }

  /**
   * Delete file
   */
  async deleteFile(uri: string): Promise<void> {
    await this.init();

    // Revoke blob URL to free memory
    URL.revokeObjectURL(uri);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(uri);

      request.onsuccess = () => {
        console.log(`[WebAudioFileManager] Deleted file: ${uri}`);
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete file: ${uri}`));
      };
    });
  }

  /**
   * List all files
   */
  async listFiles(includeTemporary = false): Promise<AudioFileInfo[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result as StoredFileRecord[];
        const files = records
          .filter((record) => includeTemporary || !record.isTemporary)
          .map((record) => ({
            uri: record.uri,
            name: record.name,
            size: record.size,
            type: record.type,
            duration: record.duration,
            createdAt: record.createdAt,
            isTemporary: record.isTemporary,
          }));

        resolve(files);
      };

      request.onerror = () => {
        reject(new Error("Failed to list files"));
      };
    });
  }

  /**
   * Move file from temporary to permanent storage
   */
  async makePermanent(tempUri: string, permanentName: string): Promise<string> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(tempUri);

      request.onsuccess = () => {
        const record = request.result as StoredFileRecord | undefined;
        if (!record) {
          reject(new Error(`File not found: ${tempUri}`));
          return;
        }

        // Update record
        record.isTemporary = false;
        record.name = this.sanitizeFilename(permanentName);

        const updateRequest = store.put(record);

        updateRequest.onsuccess = () => {
          console.log(`[WebAudioFileManager] Made permanent: ${permanentName}`);
          resolve(record.uri);
        };

        updateRequest.onerror = () => {
          reject(new Error(`Failed to make permanent: ${tempUri}`));
        };
      };

      request.onerror = () => {
        reject(new Error(`Failed to get file: ${tempUri}`));
      };
    });
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(olderThanMs = 24 * 60 * 60 * 1000): Promise<number> {
    await this.init();

    const cutoffTime = Date.now() - olderThanMs;
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("isTemporary");
      const request = index.openCursor(IDBKeyRange.only(true));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest)
          .result as IDBCursorWithValue | null;
        if (cursor) {
          const record = cursor.value as StoredFileRecord;
          if (record.createdAt < cutoffTime) {
            // Revoke blob URL
            URL.revokeObjectURL(record.uri);
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          console.log(
            `[WebAudioFileManager] Cleaned up ${deletedCount} temporary files`,
          );
          resolve(deletedCount);
        }
      };

      request.onerror = () => {
        reject(new Error("Failed to cleanup temp files"));
      };
    });
  }

  /**
   * Get storage information
   */
  async getStorageInfo(): Promise<StorageInfo> {
    await this.init();

    const files = await this.listFiles(true);
    const usedSpace = files.reduce((total, file) => total + file.size, 0);

    // Try to get storage quota (not supported in all browsers)
    let totalSpace: number | undefined;
    let availableSpace: number | undefined;

    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        totalSpace = estimate.quota;
        availableSpace = estimate.quota
          ? estimate.quota - (estimate.usage || 0)
          : undefined;
      } catch (error) {
        console.warn("[WebAudioFileManager] Storage estimate not available");
      }
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

    // If we can't determine available space, assume it's available
    if (info.availableSpace === undefined) {
      return true;
    }

    return info.availableSpace >= requiredBytes;
  }

  /**
   * Clean up on destroy
   */
  async destroy(): Promise<void> {
    // Revoke all blob URLs
    const files = await this.listFiles(true);
    files.forEach((file) => URL.revokeObjectURL(file.uri));

    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
