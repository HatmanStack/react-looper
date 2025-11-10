/**
 * Audio Services Initialization
 *
 * Platform-agnostic initialization that registers the correct services for each platform.
 */

import { Platform } from 'react-native';

/**
 * Initialize audio services for the current platform
 */
export function initializeAudioServices(): void {
  if (Platform.OS === 'web') {
    // Dynamically require web services
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { initializeWebAudioServices } = require('./web');
    initializeWebAudioServices();
  } else {
    // Dynamically require native services
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { initializeNativeAudioServices } = require('./native');
    initializeNativeAudioServices();
  }
}
