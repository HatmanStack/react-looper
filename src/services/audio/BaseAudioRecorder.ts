/**
 * BaseAudioRecorder Abstract Class
 *
 * Provides common functionality for audio recording implementations.
 * Platform-specific implementations should extend this class.
 */

import { IAudioRecorder } from './interfaces/IAudioRecorder';
import { RecordingOptions, AudioErrorCode } from '../../types/audio';
import { AudioError } from './AudioError';

export abstract class BaseAudioRecorder implements IAudioRecorder {
  /**
   * Whether recording is currently in progress
   */
  protected _isRecording: boolean = false;

  /**
   * Start time of current recording (ms since epoch)
   */
  protected _recordingStartTime: number = 0;

  /**
   * Recording options for current session
   */
  protected _currentOptions?: RecordingOptions;

  /**
   * Start recording (abstract - must be implemented by platform)
   */
  protected abstract _startRecording(options?: RecordingOptions): Promise<void>;

  /**
   * Stop recording (abstract - must be implemented by platform)
   */
  protected abstract _stopRecording(): Promise<string>;

  /**
   * Cancel recording (abstract - must be implemented by platform)
   */
  protected abstract _cancelRecording(): Promise<void>;

  /**
   * Get permissions (abstract - must be implemented by platform)
   */
  protected abstract _getPermissions(): Promise<boolean>;

  /**
   * Cleanup resources (abstract - must be implemented by platform)
   */
  protected abstract _cleanup(): Promise<void>;

  /**
   * Start audio recording with validation
   */
  public async startRecording(options?: RecordingOptions): Promise<void> {
    // Validate state
    if (this._isRecording) {
      throw new AudioError(
        AudioErrorCode.RECORDING_FAILED,
        'Cannot start recording: already recording',
        'Recording is already in progress'
      );
    }

    try {
      // Check permissions first
      const hasPermission = await this.getPermissions();
      if (!hasPermission) {
        throw new AudioError(
          AudioErrorCode.PERMISSION_DENIED,
          'Microphone permission denied',
          undefined,
          { options }
        );
      }

      // Validate options if provided
      if (options) {
        this.validateRecordingOptions(options);
      }

      this._currentOptions = options;
      this._recordingStartTime = Date.now();
      this._isRecording = true;

      await this._startRecording(options);
    } catch (error) {
      // Reset state on error
      this._isRecording = false;
      this._recordingStartTime = 0;
      this._currentOptions = undefined;

      // Re-throw AudioError, wrap other errors
      if (error instanceof AudioError) {
        throw error;
      }
      throw new AudioError(
        AudioErrorCode.RECORDING_FAILED,
        `Failed to start recording: ${(error as Error).message}`,
        undefined,
        { originalError: error, options }
      );
    }
  }

  /**
   * Stop recording with validation
   */
  public async stopRecording(): Promise<string> {
    if (!this._isRecording) {
      throw new AudioError(
        AudioErrorCode.RECORDING_FAILED,
        'Cannot stop recording: not recording',
        'No recording in progress'
      );
    }

    try {
      const uri = await this._stopRecording();

      // Reset state
      this._isRecording = false;
      this._recordingStartTime = 0;
      this._currentOptions = undefined;

      return uri;
    } catch (error) {
      // Reset state on error
      this._isRecording = false;
      this._recordingStartTime = 0;
      this._currentOptions = undefined;

      if (error instanceof AudioError) {
        throw error;
      }
      throw new AudioError(
        AudioErrorCode.RECORDING_FAILED,
        `Failed to stop recording: ${(error as Error).message}`,
        undefined,
        { originalError: error }
      );
    }
  }

  /**
   * Cancel current recording
   */
  public async cancelRecording(): Promise<void> {
    if (!this._isRecording) {
      return; // Nothing to cancel
    }

    try {
      await this._cancelRecording();
    } finally {
      // Always reset state
      this._isRecording = false;
      this._recordingStartTime = 0;
      this._currentOptions = undefined;
    }
  }

  /**
   * Check if currently recording
   */
  public isRecording(): boolean {
    return this._isRecording;
  }

  /**
   * Get current recording duration
   */
  public getRecordingDuration(): number {
    if (!this._isRecording) {
      return 0;
    }
    return Date.now() - this._recordingStartTime;
  }

  /**
   * Request permissions (delegates to platform implementation)
   */
  public async getPermissions(): Promise<boolean> {
    try {
      return await this._getPermissions();
    } catch (error) {
      throw new AudioError(
        AudioErrorCode.PERMISSION_DENIED,
        `Permission request failed: ${(error as Error).message}`,
        undefined,
        { originalError: error }
      );
    }
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    try {
      // Cancel any ongoing recording
      if (this._isRecording) {
        await this.cancelRecording();
      }

      await this._cleanup();
    } catch (error) {
      // Log but don't throw - cleanup should be best-effort
      console.error('Error during recorder cleanup:', error);
    }
  }

  /**
   * Validate recording options
   */
  protected validateRecordingOptions(options: RecordingOptions): void {
    if (options.sampleRate && options.sampleRate < 8000) {
      throw new AudioError(
        AudioErrorCode.RECORDING_FAILED,
        'Sample rate must be at least 8000 Hz',
        'Invalid recording settings'
      );
    }

    if (options.bitRate && options.bitRate < 32) {
      throw new AudioError(
        AudioErrorCode.RECORDING_FAILED,
        'Bit rate must be at least 32 kbps',
        'Invalid recording settings'
      );
    }

    if (options.channels && (options.channels < 1 || options.channels > 2)) {
      throw new AudioError(
        AudioErrorCode.RECORDING_FAILED,
        'Channels must be 1 (mono) or 2 (stereo)',
        'Invalid recording settings'
      );
    }

    if (options.maxDuration && options.maxDuration <= 0) {
      throw new AudioError(
        AudioErrorCode.RECORDING_FAILED,
        'Max duration must be positive',
        'Invalid recording settings'
      );
    }
  }
}
