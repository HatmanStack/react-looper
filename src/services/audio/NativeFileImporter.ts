/**
 * NativeFileImporter
 *
 * Native (iOS/Android) file import functionality using expo-document-picker.
 * Allows users to select audio files from device storage.
 */

import * as DocumentPicker from 'expo-document-picker';
import { Paths, File } from 'expo-file-system';
import { Audio } from 'expo-av';
import { AudioErrorCode } from '../../types/audio';
import { AudioError } from './AudioError';

export interface ImportedFile {
  uri: string;
  name: string;
  size: number;
  type: string;
}

export class NativeFileImporter {
  private static SUPPORTED_AUDIO_TYPES = [
    'audio/mpeg', // MP3
    'audio/mp4', // M4A
    'audio/wav',
    'audio/wave',
    'audio/aac',
    'audio/x-m4a',
    'audio/ogg',
  ];

  /**
   * Open document picker and allow user to select an audio file
   */
  public static async pickAudioFile(): Promise<ImportedFile> {
    try {
      // Open document picker for audio files
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      // Check if user cancelled
      if (result.canceled) {
        throw new AudioError(
          AudioErrorCode.FILE_NOT_FOUND,
          'File selection cancelled',
          'File selection was cancelled.'
        );
      }

      // Get the selected file
      const file = result.assets[0];

      if (!file) {
        throw new AudioError(
          AudioErrorCode.FILE_NOT_FOUND,
          'No file selected',
          'Please select an audio file.'
        );
      }

      // Validate file
      this.validateFile(file);

      // Copy file to app's document directory
      const copiedUri = await this.copyToAppDirectory(file.uri, file.name);

      // Verify the audio is playable
      const isPlayable = await this.verifyAudioPlayback(copiedUri);
      if (!isPlayable) {
        // Delete copied file if not playable
        try {
          const file = new File(copiedUri);
          file.delete();
        } catch {
          // Ignore deletion errors
        }
        throw new AudioError(
          AudioErrorCode.INVALID_FORMAT,
          'Audio file cannot be played',
          'This audio file appears to be corrupted or in an unsupported format.'
        );
      }

      console.log(
        `[NativeFileImporter] Imported file: ${file.name}, Size: ${file.size} bytes, URI: ${copiedUri}`
      );

      return {
        uri: copiedUri,
        name: file.name,
        size: file.size || 0,
        type: file.mimeType || 'audio/mpeg',
      };
    } catch (error) {
      if (error instanceof AudioError) {
        throw error;
      }

      throw new AudioError(
        AudioErrorCode.FILE_NOT_FOUND,
        `Failed to import file: ${(error as Error).message}`,
        'Failed to import audio file. Please try again.'
      );
    }
  }

  /**
   * Validate the selected file
   */
  private static validateFile(file: DocumentPicker.DocumentPickerAsset): void {
    // Check if file has required properties
    if (!file.uri) {
      throw new AudioError(
        AudioErrorCode.FILE_NOT_FOUND,
        'File URI is missing',
        'Invalid file selection.'
      );
    }

    // Validate MIME type if available
    if (file.mimeType && !this.isValidAudioType(file.mimeType)) {
      throw new AudioError(
        AudioErrorCode.INVALID_FORMAT,
        `Unsupported file type: ${file.mimeType}`,
        'This file type is not supported. Please select an MP3, WAV, or M4A file.'
      );
    }

    // Validate file size (max 100MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size && file.size > MAX_FILE_SIZE) {
      throw new AudioError(
        AudioErrorCode.INVALID_FORMAT,
        `File too large: ${file.size} bytes`,
        'The selected file is too large. Please select a file smaller than 100MB.'
      );
    }
  }

  /**
   * Check if MIME type is a supported audio type
   */
  private static isValidAudioType(mimeType: string): boolean {
    return this.SUPPORTED_AUDIO_TYPES.includes(mimeType);
  }

  /**
   * Copy file to app's document directory
   */
  private static async copyToAppDirectory(uri: string, fileName: string): Promise<string> {
    try {
      // Generate unique filename to avoid collisions
      const timestamp = Date.now();
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueName = `imported_${timestamp}_${sanitizedName}`;

      // Create source and destination file instances
      const sourceFile = new File(uri);
      const destFile = new File(Paths.document, uniqueName);

      // Copy file
      sourceFile.copy(destFile);

      console.log(`[NativeFileImporter] Copied file from ${uri} to ${destFile.uri}`);

      return destFile.uri;
    } catch (error) {
      throw new AudioError(
        AudioErrorCode.FILE_NOT_FOUND,
        `Failed to copy file: ${(error as Error).message}`,
        'Failed to import audio file.'
      );
    }
  }

  /**
   * Verify that the audio file can be played using expo-av
   */
  private static async verifyAudioPlayback(uri: string): Promise<boolean> {
    let sound: Audio.Sound | null = null;

    try {
      // Try to load the audio file
      const { sound: loadedSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        undefined,
        false // Don't download
      );

      sound = loadedSound;

      // Check if we can get status
      const status = await sound.getStatusAsync();

      // Unload sound
      await sound.unloadAsync();

      return status.isLoaded;
    } catch (error) {
      console.error('[NativeFileImporter] Playback verification failed:', error);

      // Cleanup sound if it was created
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch {
          // Ignore unload errors
        }
      }

      return false;
    }
  }

  /**
   * Delete an imported file
   */
  public static async deleteFile(uri: string): Promise<void> {
    try {
      const file = new File(uri);
      file.delete();
      console.log(`[NativeFileImporter] Deleted file: ${uri}`);
    } catch (error) {
      console.error('[NativeFileImporter] Failed to delete file:', error);
      throw new AudioError(
        AudioErrorCode.FILE_NOT_FOUND,
        `Failed to delete file: ${(error as Error).message}`,
        'Failed to delete audio file.'
      );
    }
  }
}
