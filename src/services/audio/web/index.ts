/**
 * Web Audio Services Registration
 *
 * Registers web-specific audio service implementations.
 */

import { registerAudioServices } from '../AudioServiceFactory';
import { WebAudioRecorder } from '../WebAudioRecorder';
import { MockAudioPlayer } from '../mock/MockAudioPlayer';
import { MockAudioMixer } from '../mock/MockAudioMixer';
import { MockFileManager } from '../mock/MockFileManager';

/**
 * Register web audio services
 * Note: Player and Mixer use mocks for now (will be implemented in Phase 5 & 6)
 */
export function initializeWebAudioServices(): void {
  registerAudioServices('web', {
    recorder: WebAudioRecorder,
    player: MockAudioPlayer,
    mixer: MockAudioMixer,
    fileManager: MockFileManager,
  });

  console.log('[WebAudioServices] Initialized web audio services');
}
