/**
 * NativeAudioRecorder
 *
 * Native (iOS/Android) audio recording implementation using expo-av.
 * Platform-specific file uses .native.ts extension for native builds.
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { BaseAudioRecorder } from './BaseAudioRecorder';
import { RecordingOptions, AudioFormat, AudioErrorCode } from '../../types/audio';
import { AudioError } from './AudioError';

export class NativeAudioRecorder extends BaseAudioRecorder {
  private recording: Audio.Recording | null = null;

  /**
   * Start recording implementation for native
   */
  protected async _startRecording(options?: RecordingOptions): Promise<void> {
    try {
      // Create recording instance
      this.recording = new Audio.Recording();

      // Prepare recording with platform-specific options
      const recordingOptions = this.getRecordingOptions(options);

      await this.recording.prepareToRecordAsync(recordingOptions);

      // Start recording
      await this.recording.startAsync();

      console.log('[NativeAudioRecorder] Recording started with options:', recordingOptions);
    } catch (error) {
      // Cleanup on error
      this.recording = null;

      if ((error as Error).message?.includes('PERMISSION')) {
        throw new AudioError(
          AudioErrorCode.PERMISSION_DENIED,
          'Microphone permission denied',
          'Please allow microphone access in your device settings.'
        );
      }

      throw new AudioError(
        AudioErrorCode.RECORDING_FAILED,
        `Failed to start recording: ${(error as Error).message}`,
        'Failed to start recording. Please check your microphone and try again.'
      );
    }
  }

  /**
   * Stop recording and return file URI
   */
  protected async _stopRecording(): Promise<string> {
    if (!this.recording) {
      throw new AudioError(
        AudioErrorCode.RECORDING_FAILED,
        'Recording instance not found',
        'Recording session not found.'
      );
    }

    try {
      // Stop recording
      await this.recording.stopAndUnloadAsync();

      // Get the recorded file URI
      const uri = this.recording.getURI();

      if (!uri) {
        throw new AudioError(
          AudioErrorCode.RECORDING_FAILED,
          'No recording URI returned',
          'Failed to save recording.'
        );
      }

      // Get file info to verify it was created
      const fileInfo = await FileSystem.getInfoAsync(uri);

      if (!fileInfo.exists) {
        throw new AudioError(
          AudioErrorCode.FILE_NOT_FOUND,
          `Recording file not found at ${uri}`,
          'Failed to save recording file.'
        );
      }

      console.log(
        `[NativeAudioRecorder] Recording stopped. URI: ${uri}, Size: ${fileInfo.size} bytes`
      );

      // Clear recording instance
      this.recording = null;

      return uri;
    } catch (error) {
      // Cleanup recording instance
      this.recording = null;

      if (error instanceof AudioError) {
        throw error;
      }

      throw new AudioError(
        AudioErrorCode.RECORDING_FAILED,
        `Failed to stop recording: ${(error as Error).message}`,
        'Failed to save recording.'
      );
    }
  }

  /**
   * Cancel recording without saving
   */
  protected async _cancelRecording(): Promise<void> {
    console.log('[NativeAudioRecorder] Cancelling recording');

    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();

        // Optionally delete the file
        const uri = this.recording.getURI();
        if (uri) {
          try {
            await FileSystem.deleteAsync(uri, { idempotent: true });
            console.log(`[NativeAudioRecorder] Deleted recording file: ${uri}`);
          } catch (deleteError) {
            // Non-critical error, just log it
            console.warn('[NativeAudioRecorder] Failed to delete recording file:', deleteError);
          }
        }
      } catch (error) {
        console.error('[NativeAudioRecorder] Error during cancel:', error);
      }

      this.recording = null;
    }
  }

  /**
   * Request microphone permissions
   */
  protected async _getPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();

      console.log(`[NativeAudioRecorder] Permission status: ${status}`);

      return status === 'granted';
    } catch (error) {
      console.error('[NativeAudioRecorder] Permission request error:', error);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  protected async _cleanup(): Promise<void> {
    console.log('[NativeAudioRecorder] Cleaning up resources');

    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (error) {
        console.error('[NativeAudioRecorder] Cleanup error:', error);
      }

      this.recording = null;
    }
  }

  /**
   * Get expo-av recording options based on app recording options
   */
  private getRecordingOptions(options?: RecordingOptions): Audio.RecordingOptions {
    const format = options?.format || AudioFormat.MP3;

    // Base configuration matching Android app quality
    const baseOptions: Audio.RecordingOptions = {
      android: {
        extension: `.${format}`,
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: options?.sampleRate || 44100,
        numberOfChannels: options?.channels || 2,
        bitRate: (options?.bitRate || 128) * 1000, // Convert to bits per second
      },
      ios: {
        extension: `.${format}`,
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        audioQuality: this.getIOSQuality(options),
        sampleRate: options?.sampleRate || 44100,
        numberOfChannels: options?.channels || 2,
        bitRate: (options?.bitRate || 128) * 1000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: 'audio/webm',
        bitsPerSecond: (options?.bitRate || 128) * 1000,
      },
    };

    // Add max file size if specified (Android only)
    if (options?.maxDuration && baseOptions.android) {
      // Android uses maxFileSize in bytes, not duration
      // We'll skip this for now as it's file size, not duration
      // This would need to be calculated based on bitrate and duration
    }

    return baseOptions;
  }

  /**
   * Convert our quality enum to iOS quality setting
   */
  private getIOSQuality(options?: RecordingOptions): Audio.IOSAudioQuality {
    // Map bitrate to iOS quality
    const bitRate = options?.bitRate || 128;

    if (bitRate >= 192) {
      return Audio.IOSAudioQuality.MAX;
    } else if (bitRate >= 128) {
      return Audio.IOSAudioQuality.HIGH;
    } else if (bitRate >= 96) {
      return Audio.IOSAudioQuality.MEDIUM;
    } else {
      return Audio.IOSAudioQuality.LOW;
    }
  }
}
