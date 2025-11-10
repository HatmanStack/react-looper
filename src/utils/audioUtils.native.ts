/**
 * Audio Utilities - Native Implementation
 *
 * Native-specific audio utility functions using expo-av.
 */

import { Audio } from 'expo-av';
import { AudioError } from '../services/audio/AudioError';
import { AudioErrorCode } from '../types/audio';

export * from './audioUtils';

export interface AudioMetadata {
  duration: number; // in milliseconds
  format?: string;
  sampleRate?: number;
  channels?: number;
  bitRate?: number;
}

/**
 * Get audio metadata using expo-av
 */
export async function getAudioMetadata(uri: string): Promise<AudioMetadata> {
  let sound: Audio.Sound | null = null;

  try {
    // Load sound without playing
    const { sound: loadedSound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: false },
      undefined,
      false
    );

    sound = loadedSound;

    // Get status to extract metadata
    const status = await sound.getStatusAsync();

    if (!status.isLoaded) {
      throw new AudioError(
        AudioErrorCode.INVALID_FORMAT,
        'Failed to load audio',
        'Could not read audio file information.'
      );
    }

    const metadata: AudioMetadata = {
      duration: status.durationMillis || 0,
    };

    // Unload sound
    await sound.unloadAsync();

    return metadata;
  } catch (error) {
    // Cleanup sound if it was created
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch (unloadError) {
        // Ignore unload errors
      }
    }

    if (error instanceof AudioError) {
      throw error;
    }

    throw new AudioError(
      AudioErrorCode.INVALID_FORMAT,
      `Failed to get audio metadata: ${(error as Error).message}`,
      'Could not read audio file information.'
    );
  }
}

/**
 * Validate if a file is a playable audio file
 */
export async function validateAudioFile(uri: string): Promise<boolean> {
  try {
    await getAudioMetadata(uri);
    return true;
  } catch (error) {
    return false;
  }
}
