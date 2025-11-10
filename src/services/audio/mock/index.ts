/**
 * Mock Audio Services
 *
 * Export all mock implementations for development and testing.
 */

export { MockAudioRecorder } from './MockAudioRecorder';
export { MockAudioPlayer } from './MockAudioPlayer';
export { MockAudioMixer } from './MockAudioMixer';
export { MockFileManager } from './MockFileManager';

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
export function registerMockServices(): void {
  const { registerAudioServices } = require('../AudioServiceFactory');
  const MockAudioRecorder = require('./MockAudioRecorder').MockAudioRecorder;
  const MockAudioPlayer = require('./MockAudioPlayer').MockAudioPlayer;
  const MockAudioMixer = require('./MockAudioMixer').MockAudioMixer;
  const MockFileManager = require('./MockFileManager').MockFileManager;
  const { Platform } = require('react-native');

  const mockServices = {
    recorder: MockAudioRecorder,
    player: MockAudioPlayer,
    mixer: MockAudioMixer,
    fileManager: MockFileManager,
  };

  // Register for current platform
  const platform = Platform.OS === 'web' ? 'web' : 'native';
  registerAudioServices(platform, mockServices);

  console.log(`[MockServices] Mock audio services registered for ${platform}`);
}
