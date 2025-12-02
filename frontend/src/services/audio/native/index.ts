/**
 * Native Audio Services Registration
 *
 * Registers native (iOS/Android) audio service implementations.
 */

import { registerAudioServices } from "../AudioServiceFactory";
import { NativeAudioRecorder } from "../NativeAudioRecorder";
import { MockAudioPlayer } from "../mock/MockAudioPlayer";
import { MockAudioMixer } from "../mock/MockAudioMixer";
import { MockFileManager } from "../mock/MockFileManager";

/**
 * Register native audio services
 * Note: Player and Mixer use mocks for now (will be implemented in Phase 5 & 6)
 */
export function initializeNativeAudioServices(): void {
  registerAudioServices("native", {
    recorder: NativeAudioRecorder,
    player: MockAudioPlayer,
    mixer: MockAudioMixer,
    fileManager: MockFileManager,
  });

  console.log("[NativeAudioServices] Initialized native audio services");
}
