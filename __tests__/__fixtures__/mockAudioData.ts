/**
 * Mock Audio Data Fixtures
 *
 * Test data for mock audio services.
 * Used during development and testing.
 */

import { AudioFormat, AudioMetadata, MixerTrackInput } from '../../src/types/audio';

/**
 * Mock audio URIs
 */
export const MOCK_AUDIO_URIS = {
  recording1: 'mock://audio/recording-1.m4a',
  recording2: 'mock://audio/recording-2.m4a',
  recording3: 'mock://audio/recording-3.m4a',
  imported1: 'mock://audio/imported-track.mp3',
  mixed: 'mock://audio/mixed-output.mp3',
  temp: 'mock://audio/temp-recording.m4a',
};

/**
 * Mock audio metadata
 */
export const MOCK_AUDIO_METADATA: Record<string, AudioMetadata> = {
  'mock://audio/recording-1.m4a': {
    duration: 120000, // 2 minutes
    sampleRate: 44100,
    channels: 2,
    bitRate: 128,
    format: 'm4a',
  },
  'mock://audio/recording-2.m4a': {
    duration: 180000, // 3 minutes
    sampleRate: 44100,
    channels: 2,
    bitRate: 128,
    format: 'm4a',
  },
  'mock://audio/recording-3.m4a': {
    duration: 60000, // 1 minute
    sampleRate: 44100,
    channels: 2,
    bitRate: 192,
    format: 'm4a',
  },
  'mock://audio/imported-track.mp3': {
    duration: 240000, // 4 minutes
    sampleRate: 48000,
    channels: 2,
    bitRate: 320,
    format: 'mp3',
  },
  'mock://audio/mixed-output.mp3': {
    duration: 300000, // 5 minutes
    sampleRate: 44100,
    channels: 2,
    bitRate: 192,
    format: 'mp3',
  },
};

/**
 * Mock track data for mixer testing
 */
export const MOCK_MIXER_TRACKS: MixerTrackInput[] = [
  {
    uri: MOCK_AUDIO_URIS.recording1,
    speed: 1.0,
    volume: 75,
  },
  {
    uri: MOCK_AUDIO_URIS.recording2,
    speed: 1.25,
    volume: 100,
  },
  {
    uri: MOCK_AUDIO_URIS.recording3,
    speed: 0.75,
    volume: 50,
  },
];

/**
 * Generate a mock URI for testing
 */
export function generateMockUri(
  prefix: string = 'recording',
  format: AudioFormat = AudioFormat.M4A
): string {
  const timestamp = Date.now();
  return `mock://audio/${prefix}-${timestamp}.${format}`;
}

/**
 * Get mock metadata for a URI
 */
export function getMockMetadata(uri: string): AudioMetadata {
  // Return metadata if it exists, otherwise generate generic metadata
  if (MOCK_AUDIO_METADATA[uri]) {
    return MOCK_AUDIO_METADATA[uri];
  }

  // Generate metadata based on URI
  const format = uri.split('.').pop() || 'm4a';
  return {
    duration: 120000 + Math.random() * 180000, // 2-5 minutes
    sampleRate: 44100,
    channels: 2,
    bitRate: 128,
    format,
  };
}

/**
 * Mock file sizes (bytes)
 */
export const MOCK_FILE_SIZES: Record<string, number> = {
  'mock://audio/recording-1.m4a': 1920000, // ~1.9 MB
  'mock://audio/recording-2.m4a': 2880000, // ~2.9 MB
  'mock://audio/recording-3.m4a': 960000, // ~960 KB
  'mock://audio/imported-track.mp3': 9600000, // ~9.6 MB
  'mock://audio/mixed-output.mp3': 7200000, // ~7.2 MB
};

/**
 * Get mock file size
 */
export function getMockFileSize(uri: string): number {
  return MOCK_FILE_SIZES[uri] || 1000000; // Default 1 MB
}
