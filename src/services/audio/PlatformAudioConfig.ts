/**
 * Platform-Specific Audio Configuration
 *
 * Defines audio settings optimized for each platform.
 * Web and native platforms have different capabilities and constraints.
 */

import { Platform } from 'react-native';
import { AudioFormat, AudioQuality } from '../../types/audio';

/**
 * Audio configuration interface
 */
export interface AudioConfig {
  /**
   * Default audio format for recording and export
   */
  defaultFormat: AudioFormat;

  /**
   * Supported audio formats for this platform
   */
  supportedFormats: AudioFormat[];

  /**
   * Default recording quality
   */
  defaultQuality: AudioQuality;

  /**
   * Sample rate in Hz
   */
  sampleRate: number;

  /**
   * Bit rate in kbps
   */
  bitRate: number;

  /**
   * Number of audio channels (1 = mono, 2 = stereo)
   */
  channels: number;

  /**
   * Audio buffer size for playback
   */
  bufferSize: number;

  /**
   * Target latency in milliseconds
   */
  targetLatency: number;

  /**
   * Maximum concurrent audio players
   */
  maxConcurrentPlayers: number;

  /**
   * Whether hardware acceleration is available
   */
  hardwareAcceleration: boolean;

  /**
   * Performance multiplier for duration estimates
   * (e.g., web FFmpeg is ~5x slower than native)
   */
  performanceMultiplier: number;

  /**
   * Maximum recording duration in milliseconds (0 = unlimited)
   */
  maxRecordingDuration: number;

  /**
   * Whether speed adjustment preserves pitch by default
   */
  preservePitchByDefault: boolean;
}

/**
 * Web platform audio configuration
 *
 * Web uses:
 * - expo-av for recording/playback
 * - @ffmpeg/ffmpeg (WebAssembly) for mixing
 * - MediaRecorder API where available
 */
const WEB_CONFIG: AudioConfig = {
  defaultFormat: AudioFormat.MP3,
  supportedFormats: [AudioFormat.MP3, AudioFormat.WAV, AudioFormat.M4A],
  defaultQuality: AudioQuality.MEDIUM,
  sampleRate: 44100,
  bitRate: 128,
  channels: 2, // Stereo
  bufferSize: 4096,
  targetLatency: 100, // ms - web has higher latency
  maxConcurrentPlayers: 5, // Limit due to browser constraints
  hardwareAcceleration: false, // WebAssembly FFmpeg is slower
  performanceMultiplier: 5.0, // Web mixing is ~5x slower
  maxRecordingDuration: 600000, // 10 minutes (browser memory limits)
  preservePitchByDefault: true,
};

/**
 * Native platform audio configuration
 *
 * Native uses:
 * - expo-av for recording/playback
 * - react-native-ffmpeg for mixing
 * - Native audio APIs
 */
const NATIVE_CONFIG: AudioConfig = {
  defaultFormat: AudioFormat.M4A, // Better compression on mobile
  supportedFormats: [AudioFormat.MP3, AudioFormat.WAV, AudioFormat.M4A, AudioFormat.THREE_GPP],
  defaultQuality: AudioQuality.HIGH,
  sampleRate: 44100,
  bitRate: 192,
  channels: 2, // Stereo
  bufferSize: 2048,
  targetLatency: 50, // ms - native has lower latency
  maxConcurrentPlayers: 10, // Native can handle more
  hardwareAcceleration: true, // Native FFmpeg uses hardware acceleration
  performanceMultiplier: 1.0, // Baseline performance
  maxRecordingDuration: 0, // Unlimited (limited by storage)
  preservePitchByDefault: true,
};

/**
 * Get audio configuration for current platform
 */
export function getAudioConfig(): AudioConfig {
  return Platform.select({
    web: WEB_CONFIG,
    default: NATIVE_CONFIG,
  }) as AudioConfig;
}

/**
 * Get platform name for logging
 */
export function getPlatformName(): string {
  return Platform.select({
    web: 'Web',
    ios: 'iOS',
    android: 'Android',
    default: 'Unknown',
  }) as string;
}

/**
 * Check if current platform supports a feature
 */
export function isPlatformSupported(): boolean {
  return Platform.OS === 'web' || Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Get recommended format for current platform
 */
export function getRecommendedFormat(): AudioFormat {
  return getAudioConfig().defaultFormat;
}

/**
 * Check if format is supported on current platform
 */
export function isFormatSupported(format: AudioFormat): boolean {
  return getAudioConfig().supportedFormats.includes(format);
}

/**
 * Get platform-specific performance multiplier
 * Used for estimating operation durations (mixing, encoding, etc.)
 */
export function getPerformanceMultiplier(): number {
  return getAudioConfig().performanceMultiplier;
}
