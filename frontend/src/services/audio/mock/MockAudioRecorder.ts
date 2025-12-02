/**
 * Mock Audio Recorder
 *
 * Simulates audio recording for development and testing.
 * No actual audio is recorded - returns mock URIs after a delay.
 */

import { BaseAudioRecorder } from "../BaseAudioRecorder";
import { RecordingOptions, AudioFormat } from "../../../types/audio";
import { generateMockUri } from "../../../mocks/mockAudioData";

export class MockAudioRecorder extends BaseAudioRecorder {
  private recordingTimer: NodeJS.Timeout | null = null;
  private mockPermissionGranted: boolean = true;

  /**
   * Simulate recording start
   */
  protected async _startRecording(options?: RecordingOptions): Promise<void> {
    console.log(
      "[MockAudioRecorder] Starting recording with options:",
      options,
    );

    // Simulate async initialization delay
    await this.delay(100);

    // Start mock recording timer
    this.recordingTimer = setInterval(() => {
      // Just for logging - actual duration is tracked by base class
      const duration = this.getRecordingDuration();
      if (duration % 1000 === 0) {
        console.log(`[MockAudioRecorder] Recording... ${duration}ms`);
      }
    }, 1000);
  }

  /**
   * Simulate recording stop
   */
  protected async _stopRecording(): Promise<string> {
    console.log("[MockAudioRecorder] Stopping recording");

    // Clear timer
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }

    // Simulate processing delay
    await this.delay(200);

    // Generate mock URI
    const format = this._currentOptions?.format || AudioFormat.M4A;
    const uri = generateMockUri("recording", format);

    console.log(`[MockAudioRecorder] Recording saved to: ${uri}`);
    return uri;
  }

  /**
   * Simulate recording cancellation
   */
  protected async _cancelRecording(): Promise<void> {
    console.log("[MockAudioRecorder] Cancelling recording");

    // Clear timer
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }

    await this.delay(50);
  }

  /**
   * Simulate permission check
   */
  protected async _getPermissions(): Promise<boolean> {
    console.log("[MockAudioRecorder] Checking permissions");
    await this.delay(100);
    return this.mockPermissionGranted;
  }

  /**
   * Cleanup
   */
  protected async _cleanup(): Promise<void> {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }

  /**
   * Set mock permission status (for testing)
   */
  public setMockPermission(granted: boolean): void {
    this.mockPermissionGranted = granted;
  }

  /**
   * Helper to simulate async delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
