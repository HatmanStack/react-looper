/**
 * Mock Audio Mixer
 *
 * Simulates audio mixing for development and testing.
 * No actual mixing occurs - simulates progress and returns mock URI.
 */

import { BaseAudioMixer } from '../BaseAudioMixer';
import { MixerTrackInput, MixingOptions, AudioFormat } from '../../../types/audio';
import { generateMockUri } from '../../../../__tests__/__fixtures__/mockAudioData';

export class MockAudioMixer extends BaseAudioMixer {
  private mixingTimer: NodeJS.Timeout | null = null;
  private simulatedProgress: number = 0;

  /**
   * Simulate mixing tracks
   */
  protected async _mixTracks(
    tracks: MixerTrackInput[],
    outputPath: string,
    options?: MixingOptions
  ): Promise<string> {
    console.log('[MockAudioMixer] Starting to mix', tracks.length, 'tracks');
    console.log('[MockAudioMixer] Output path:', outputPath);
    console.log('[MockAudioMixer] Options:', options);

    // Reset progress
    this.simulatedProgress = 0;
    this.updateProgress(0);

    // Estimate duration based on track count
    const estimatedDuration = this.estimateMixingDuration(tracks);
    const progressInterval = 100; // Update every 100ms
    const progressIncrement = (100 / estimatedDuration) * progressInterval;

    console.log(`[MockAudioMixer] Estimated duration: ${estimatedDuration}ms`);

    // Simulate mixing with progress updates
    return new Promise((resolve, reject) => {
      this.mixingTimer = setInterval(() => {
        // Check for cancellation
        if (this._cancelled) {
          if (this.mixingTimer) {
            clearInterval(this.mixingTimer);
            this.mixingTimer = null;
          }
          reject(new Error('Mixing cancelled'));
          return;
        }

        // Update progress
        this.simulatedProgress += progressIncrement;

        if (this.simulatedProgress >= 100) {
          // Mixing complete
          if (this.mixingTimer) {
            clearInterval(this.mixingTimer);
            this.mixingTimer = null;
          }

          this.updateProgress(100);

          // Generate mock output URI
          const format = options?.format || AudioFormat.MP3;
          const uri = generateMockUri('mixed', format);

          console.log(`[MockAudioMixer] Mixing complete: ${uri}`);
          resolve(uri);
        } else {
          // Update progress
          this.updateProgress(this.simulatedProgress);
        }
      }, progressInterval);
    });
  }

  /**
   * Simulate cancellation
   */
  protected async _cancel(): Promise<void> {
    console.log('[MockAudioMixer] Cancelling mixing operation');

    if (this.mixingTimer) {
      clearInterval(this.mixingTimer);
      this.mixingTimer = null;
    }

    this.simulatedProgress = 0;
  }

  /**
   * Get platform multiplier (mock has faster "mixing")
   */
  protected getPlatformMultiplier(): number {
    return 0.5; // Mock mixing is 2x faster for testing
  }
}
