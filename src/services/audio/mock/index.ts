/**
 * Mock Audio Services
 *
 * Export all mock implementations for development and testing.
 */

import { Platform } from "react-native";
import { registerAudioServices } from "../AudioServiceFactory";

export { MockAudioRecorder } from "./MockAudioRecorder";
export { MockAudioPlayer } from "./MockAudioPlayer";
export { MockAudioMixer } from "./MockAudioMixer";
export { MockFileManager } from "./MockFileManager";

/**
 * Register mock services with the factory
 *
 * This should be called during app initialization in development mode
 * to enable UI development without real audio implementations.
 *
 * @example
 * ```typescript
 * import { registerMockServices } from './services/audio/mock';
 *
 * if (__DEV__) {
 *   registerMockServices();
 * }
 * ```
 */
export async function registerMockServices(): Promise<void> {
  // Dynamic imports to avoid circular dependencies
  const { MockAudioRecorder: RecorderClass } = await import(
    "./MockAudioRecorder"
  );
  const { MockAudioPlayer: PlayerClass } = await import("./MockAudioPlayer");
  const { MockAudioMixer: MixerClass } = await import("./MockAudioMixer");
  const { MockFileManager: FileManagerClass } = await import(
    "./MockFileManager"
  );

  const mockServices = {
    recorder: RecorderClass,
    player: PlayerClass,
    mixer: MixerClass,
    fileManager: FileManagerClass,
  };

  // Register for current platform
  const platform = Platform.OS === "web" ? "web" : "native";
  registerAudioServices(platform, mockServices);

  console.log(`[MockServices] Mock audio services registered for ${platform}`);
}
