/**
 * IAudioRecorder Interface
 *
 * Defines the contract for audio recording implementations.
 * Platform-specific implementations (web and native) must implement this interface.
 */

import { RecordingOptions } from "../../../types/audio";

export interface IAudioRecorder {
  /**
   * Start audio recording
   *
   * Requests microphone permissions if needed and begins recording.
   * Recording continues until stopRecording() is called or maxDuration is reached.
   *
   * @throws {AudioError} PERMISSION_DENIED if microphone permission is denied
   * @throws {AudioError} RECORDING_FAILED if recording initialization fails
   * @throws {AudioError} RESOURCE_UNAVAILABLE if microphone is in use
   */
  startRecording(options?: RecordingOptions): Promise<void>;

  /**
   * Stop audio recording and save the file
   *
   * Finalizes the recording and returns the URI/path to the saved audio file.
   * The file is saved in the app's internal storage.
   *
   * @returns Promise resolving to the URI of the saved recording
   * @throws {AudioError} RECORDING_FAILED if stop/save operation fails
   */
  stopRecording(): Promise<string>;

  /**
   * Check if currently recording
   *
   * @returns true if recording is in progress, false otherwise
   */
  isRecording(): boolean;

  /**
   * Request microphone permissions
   *
   * Requests necessary permissions for audio recording.
   * On web, this is handled automatically during getUserMedia().
   * On native, this requests RECORD_AUDIO permission.
   *
   * @returns Promise resolving to true if permission granted, false otherwise
   */
  getPermissions(): Promise<boolean>;

  /**
   * Cancel current recording without saving
   *
   * Stops recording and discards the audio data.
   * Useful for implementing a "cancel" button.
   */
  cancelRecording(): Promise<void>;

  /**
   * Get current recording duration in milliseconds
   *
   * Returns 0 if not recording.
   *
   * @returns Current recording duration in ms
   */
  getRecordingDuration(): number;

  /**
   * Release recording resources
   *
   * Cleans up any native resources, event listeners, etc.
   * Should be called when the recorder is no longer needed.
   */
  cleanup(): Promise<void>;
}
