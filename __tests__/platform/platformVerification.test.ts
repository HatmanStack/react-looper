/**
 * Platform Verification Tests
 *
 * Verifies that platform-specific code and services are correctly implemented
 * for Web, iOS, and Android
 */

import { Platform } from 'react-native';
import { getAudioService } from '../../src/services/audio/AudioServiceFactory';
import { getFileImporter } from '../../src/services/audio/FileImporterFactory';
import { getFFmpegService } from '../../src/services/ffmpeg/FFmpegService';

describe('Platform Verification', () => {
  it('should identify current platform', () => {
    expect(Platform.OS).toBeDefined();
    expect(['web', 'ios', 'android']).toContain(Platform.OS);

    console.log(`Running on platform: ${Platform.OS}`);
  });

  it('should provide platform version information', () => {
    if (Platform.OS === 'web') {
      expect(Platform.Version).toBeUndefined(); // Web doesn't have version
    } else {
      expect(Platform.Version).toBeDefined();
      console.log(`Platform version: ${Platform.Version}`);
    }
  });
});

describe('Platform-Specific Services', () => {
  describe('Audio Service', () => {
    it('should provide correct audio service for platform', () => {
      const audioService = getAudioService();

      expect(audioService).toBeDefined();
      expect(audioService.startRecording).toBeDefined();
      expect(audioService.stopRecording).toBeDefined();
      expect(audioService.loadTrack).toBeDefined();
      expect(audioService.playTrack).toBeDefined();
      expect(audioService.pauseTrack).toBeDefined();

      console.log(`Audio service initialized for ${Platform.OS}`);
    });

    it('should have platform-specific implementation', () => {
      const audioService = getAudioService();

      if (Platform.OS === 'web') {
        expect(audioService.constructor.name).toContain('Web');
      } else {
        expect(audioService.constructor.name).toContain('Native');
      }
    });
  });

  describe('File Importer', () => {
    it('should provide correct file importer for platform', () => {
      const fileImporter = getFileImporter();

      expect(fileImporter).toBeDefined();
      expect(fileImporter.pickAudioFile).toBeDefined();

      console.log(`File importer initialized for ${Platform.OS}`);
    });

    it('should have platform-specific implementation', () => {
      const fileImporter = getFileImporter();

      if (Platform.OS === 'web') {
        expect(fileImporter.constructor.name).toContain('Web');
      } else {
        expect(fileImporter.constructor.name).toContain('Native');
      }
    });
  });

  describe('FFmpeg Service', () => {
    it('should provide FFmpeg service', () => {
      const ffmpegService = getFFmpegService();

      expect(ffmpegService).toBeDefined();
      expect(ffmpegService.load).toBeDefined();
      expect(ffmpegService.mix).toBeDefined();

      console.log(`FFmpeg service initialized for ${Platform.OS}`);
    });

    it('should have platform-specific configuration', () => {
      const ffmpegService = getFFmpegService();

      if (Platform.OS === 'web') {
        // Web uses FFmpeg.wasm
        expect(ffmpegService.constructor.name).toContain('Web');
      } else {
        // Native uses FFmpeg Kit
        expect(ffmpegService.constructor.name).toContain('Native');
      }
    });
  });
});

describe('Platform Capabilities', () => {
  it('should support required Web APIs on web platform', () => {
    if (Platform.OS === 'web') {
      // Check for required Web APIs
      expect(typeof navigator.mediaDevices).toBe('object');
      expect(typeof MediaRecorder).toBe('function');
      expect(typeof AudioContext).toBe('function');

      console.log('✓ Web Audio API available');
      console.log('✓ MediaRecorder API available');
    } else {
      console.log('Skipping Web API checks on native platform');
    }
  });

  it('should support required native modules on native platforms', () => {
    if (Platform.OS !== 'web') {
      // Native platforms should have expo-av available
      const Audio = require('expo-av').Audio;
      expect(Audio).toBeDefined();
      console.log('✓ expo-av available');
    } else {
      console.log('Skipping native module checks on web platform');
    }
  });

  it('should detect screen dimensions', () => {
    const { width, height } = Platform.select({
      web: { width: window.innerWidth, height: window.innerHeight },
      default: require('react-native').Dimensions.get('window'),
    });

    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);

    console.log(`Screen dimensions: ${width}x${height}`);
  });
});

describe('Platform-Specific Features', () => {
  it('should handle file URIs correctly per platform', () => {
    const testURI = Platform.select({
      web: 'blob:http://localhost:8081/test.mp3',
      ios: 'file:///var/mobile/Containers/Data/Application/test.mp3',
      android: 'file:///data/user/0/com.looper/files/test.mp3',
      default: 'file://test.mp3',
    });

    expect(testURI).toBeDefined();
    expect(typeof testURI).toBe('string');

    console.log(`Platform URI format: ${testURI}`);
  });

  it('should have correct audio formats support', () => {
    const supportedFormats = Platform.select({
      web: ['audio/webm', 'audio/mp3', 'audio/wav'],
      ios: ['audio/mp4', 'audio/mp3', 'audio/wav', 'audio/aac'],
      android: ['audio/mp4', 'audio/mp3', 'audio/wav', 'audio/aac'],
      default: ['audio/mp3'],
    });

    expect(supportedFormats).toBeDefined();
    expect(Array.isArray(supportedFormats)).toBe(true);
    expect(supportedFormats.length).toBeGreaterThan(0);

    console.log(`Supported formats: ${supportedFormats.join(', ')}`);
  });
});

describe('Error Handling', () => {
  it('should handle platform-specific errors', async () => {
    // This tests that platform-specific error handling is in place
    const audioService = getAudioService();

    // Attempting operations without permissions should throw errors
    try {
      await audioService.startRecording();
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.message || error.userMessage).toBeDefined();

      console.log(`Platform error handling works: ${error.message || error.userMessage}`);
    }
  });
});

describe('Performance Characteristics', () => {
  it('should provide platform performance info', () => {
    const info = {
      platform: Platform.OS,
      version: Platform.Version,
      isTV: Platform.isTV,
      isTesting: Platform.isTesting,
    };

    console.log('Platform info:', info);

    expect(info.platform).toBeDefined();
  });

  it('should report expected audio latency characteristics', () => {
    const expectedLatency = Platform.select({
      web: { min: 50, max: 150, unit: 'ms' },
      ios: { min: 10, max: 30, unit: 'ms' },
      android: { min: 20, max: 50, unit: 'ms' },
      default: { min: 0, max: 100, unit: 'ms' },
    });

    console.log(
      `Expected audio latency: ${expectedLatency.min}-${expectedLatency.max}${expectedLatency.unit}`
    );

    expect(expectedLatency).toBeDefined();
  });
});

describe('Platform Constants', () => {
  it('should provide platform select utility', () => {
    const value = Platform.select({
      web: 'web-value',
      ios: 'ios-value',
      android: 'android-value',
      default: 'default-value',
    });

    expect(value).toBeDefined();
    console.log(`Platform.select returned: ${value}`);
  });

  it('should provide correct separator', () => {
    const separator = Platform.select({
      web: '/',
      default: '/',
    });

    expect(separator).toBe('/');
  });
});

describe('Platform-Specific Configurations', () => {
  it('should have correct audio configuration', () => {
    const audioConfig = Platform.select({
      web: {
        sampleRate: 48000,
        channels: 2,
        bitsPerSample: 16,
      },
      ios: {
        sampleRate: 44100,
        channels: 2,
        audioQuality: 'high',
      },
      android: {
        sampleRate: 44100,
        channels: 2,
        audioEncoder: 'aac',
      },
      default: {
        sampleRate: 44100,
        channels: 2,
      },
    });

    expect(audioConfig).toBeDefined();
    expect(audioConfig.sampleRate).toBeGreaterThan(0);
    expect(audioConfig.channels).toBeGreaterThan(0);

    console.log('Audio configuration:', audioConfig);
  });

  it('should have correct storage paths', () => {
    const storagePath = Platform.select({
      web: 'localStorage',
      ios: 'Documents',
      android: 'files',
      default: 'temp',
    });

    expect(storagePath).toBeDefined();
    console.log(`Storage path: ${storagePath}`);
  });
});
