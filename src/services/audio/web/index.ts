/**
 * Web Audio Services Registration
 *
 * Registers web-specific audio service implementations.
 */

import { registerAudioServices } from "../AudioServiceFactory";
import { WebAudioRecorder } from "../WebAudioRecorder";
import { WebAudioPlayer } from "../WebAudioPlayer";
import { WebAudioMixer } from "../WebAudioMixer";
import { MockFileManager } from "../mock/MockFileManager";

/**
 * Register web audio services
 * All services now use Web Audio API implementations
 */
export function initializeWebAudioServices(): void {
  registerAudioServices("web", {
    recorder: WebAudioRecorder,
    player: WebAudioPlayer,
    mixer: WebAudioMixer,
    fileManager: MockFileManager,
  });
}
