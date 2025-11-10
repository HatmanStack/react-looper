/**
 * AudioService Tests
 *
 * Comprehensive tests for the AudioService orchestrator
 */

import { AudioService } from '../../../src/services/audio/AudioService';
import { MockAudioRecorder } from '../../../src/services/audio/mock/MockAudioRecorder';
import { MockAudioPlayer } from '../../../src/services/audio/mock/MockAudioPlayer';
import { MockAudioMixer } from '../../../src/services/audio/mock/MockAudioMixer';
import { MockFileManager } from '../../../src/services/audio/mock/MockFileManager';
import { AudioError } from '../../../src/services/audio/AudioError';
import { AudioFormat } from '../../../src/types/audio';
import { MOCK_AUDIO_URIS } from '../../__fixtures__/mockAudioData';

describe('AudioService', () => {
  let audioService: AudioService;

  beforeEach(() => {
    const config = {
      recorder: new MockAudioRecorder(),
      playerFactory: () => new MockAudioPlayer(),
      mixer: new MockAudioMixer(),
      fileManager: new MockFileManager(),
      maxConcurrentPlayers: 3,
    };
    audioService = new AudioService(config);
  });

  afterEach(async () => {
    await audioService.cleanup();
  });

  describe('Recording Operations', () => {
    it('starts and stops recording', async () => {
      await audioService.startRecording();
      expect(audioService.isRecording()).toBe(true);

      const uri = await audioService.stopRecording();
      expect(audioService.isRecording()).toBe(false);
      expect(uri).toBeTruthy();
    });

    it('prevents starting recording when already recording', async () => {
      await audioService.startRecording();

      await expect(audioService.startRecording()).rejects.toThrow(AudioError);
    });

    it('prevents stopping when not recording', async () => {
      await expect(audioService.stopRecording()).rejects.toThrow(AudioError);
    });

    it('cancels recording', async () => {
      await audioService.startRecording();
      await audioService.cancelRecording();
      expect(audioService.isRecording()).toBe(false);
    });

    it('gets recording duration', async () => {
      await audioService.startRecording();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const duration = audioService.getRecordingDuration();
      expect(duration).toBeGreaterThan(0);

      await audioService.stopRecording();
    });

    it('requests recording permissions', async () => {
      const hasPermission = await audioService.requestRecordingPermissions();
      expect(typeof hasPermission).toBe('boolean');
    });
  });

  describe('Playback Operations', () => {
    const trackId = 'test-track';
    const mockUri = MOCK_AUDIO_URIS.recording1;

    it('loads and plays a track', async () => {
      await audioService.loadTrack(trackId, mockUri);
      expect(audioService.isTrackPlaying(trackId)).toBe(false);

      await audioService.playTrack(trackId);
      expect(audioService.isTrackPlaying(trackId)).toBe(true);
    });

    it('pauses a playing track', async () => {
      await audioService.loadTrack(trackId, mockUri);
      await audioService.playTrack(trackId);
      await audioService.pauseTrack(trackId);

      expect(audioService.isTrackPlaying(trackId)).toBe(false);
    });

    it('stops a playing track', async () => {
      await audioService.loadTrack(trackId, mockUri);
      await audioService.playTrack(trackId);
      await audioService.stopTrack(trackId);

      expect(audioService.isTrackPlaying(trackId)).toBe(false);
    });

    it('sets track speed', async () => {
      await audioService.loadTrack(trackId, mockUri);
      await audioService.setTrackSpeed(trackId, 1.5);

      const trackInfo = audioService.getTrackInfo(trackId);
      expect(trackInfo?.speed).toBe(1.5);
    });

    it('sets track volume', async () => {
      await audioService.loadTrack(trackId, mockUri);
      await audioService.setTrackVolume(trackId, 50);

      const trackInfo = audioService.getTrackInfo(trackId);
      expect(trackInfo?.volume).toBe(50);
    });

    it('sets track looping', async () => {
      await audioService.loadTrack(trackId, mockUri);
      await audioService.setTrackLooping(trackId, false);
      // Should not throw
      expect(true).toBe(true);
    });

    it('gets track duration', async () => {
      await audioService.loadTrack(trackId, mockUri);
      const duration = await audioService.getTrackDuration(trackId);
      expect(duration).toBeGreaterThan(0);
    });

    it('gets and sets track position', async () => {
      await audioService.loadTrack(trackId, mockUri);
      await audioService.setTrackPosition(trackId, 1000);

      const position = await audioService.getTrackPosition(trackId);
      expect(position).toBe(1000);
    });

    it('unloads a track', async () => {
      await audioService.loadTrack(trackId, mockUri);
      await audioService.unloadTrack(trackId);

      expect(audioService.isTrackPlaying(trackId)).toBe(false);
    });

    it('unloads all tracks', async () => {
      await audioService.loadTrack('track1', mockUri);
      await audioService.loadTrack('track2', mockUri);

      expect(audioService.getLoadedTrackIds()).toHaveLength(2);

      await audioService.unloadAllTracks();

      expect(audioService.getLoadedTrackIds()).toHaveLength(0);
    });

    it('plays all tracks', async () => {
      await audioService.loadTrack('track1', mockUri);
      await audioService.loadTrack('track2', mockUri);

      await audioService.playAllTracks();

      expect(audioService.isTrackPlaying('track1')).toBe(true);
      expect(audioService.isTrackPlaying('track2')).toBe(true);
    });

    it('pauses all tracks', async () => {
      await audioService.loadTrack('track1', mockUri);
      await audioService.loadTrack('track2', mockUri);
      await audioService.playAllTracks();

      await audioService.pauseAllTracks();

      expect(audioService.isTrackPlaying('track1')).toBe(false);
      expect(audioService.isTrackPlaying('track2')).toBe(false);
    });

    it('enforces max concurrent players limit', async () => {
      // Load up to max (3)
      await audioService.loadTrack('track1', mockUri);
      await audioService.loadTrack('track2', mockUri);
      await audioService.loadTrack('track3', mockUri);

      // Try to load one more
      await expect(audioService.loadTrack('track4', mockUri)).rejects.toThrow(AudioError);
    });

    it('throws error when playing non-existent track', async () => {
      await expect(audioService.playTrack('nonexistent')).rejects.toThrow(AudioError);
    });
  });

  describe('Mixing Operations', () => {
    it('mixes tracks successfully', async () => {
      const tracks = [
        { uri: MOCK_AUDIO_URIS.recording1, speed: 1.0, volume: 75 },
        { uri: MOCK_AUDIO_URIS.recording2, speed: 1.25, volume: 100 },
      ];

      const result = await audioService.mixTracks(tracks, 'output.mp3');
      expect(result).toBeTruthy();
      expect(result).toContain('mock://');
    });

    it('reports mixing progress', async () => {
      const tracks = [{ uri: MOCK_AUDIO_URIS.recording1, speed: 1.0, volume: 75 }];

      let progressReported = false;
      const progressCallback = (progress: number) => {
        progressReported = true;
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(100);
      };

      await audioService.mixTracks(tracks, 'output.mp3', {}, progressCallback);
      expect(progressReported).toBe(true);
    });

    it('cancels mixing operation', async () => {
      expect(audioService.isMixing()).toBe(false);
      await audioService.cancelMixing();
      expect(audioService.isMixing()).toBe(false);
    });

    it('estimates mixing duration', () => {
      const tracks = [
        { uri: MOCK_AUDIO_URIS.recording1, speed: 1.0, volume: 75 },
        { uri: MOCK_AUDIO_URIS.recording2, speed: 1.0, volume: 100 },
      ];

      const estimate = audioService.estimateMixingDuration(tracks);
      expect(estimate).toBeGreaterThan(0);
    });
  });

  describe('File Operations', () => {
    it('copies file to app storage', async () => {
      const result = await audioService.copyToAppStorage(MOCK_AUDIO_URIS.recording1, 'dest');
      expect(result).toBeTruthy();
    });

    it('exports file to external storage', async () => {
      const result = await audioService.exportToExternalStorage(
        MOCK_AUDIO_URIS.recording1,
        'export'
      );
      expect(result).toBeTruthy();
    });

    it('deletes audio file', async () => {
      const uri = MOCK_AUDIO_URIS.recording1;
      await audioService.loadTrack('track', uri);

      const deleted = await audioService.deleteAudioFile(uri);
      expect(typeof deleted).toBe('boolean');
    });

    it('checks if file exists', async () => {
      const exists = await audioService.fileExists(MOCK_AUDIO_URIS.recording1);
      expect(typeof exists).toBe('boolean');
    });

    it('gets file size', async () => {
      const size = await audioService.getFileSize(MOCK_AUDIO_URIS.recording1);
      expect(size).toBeGreaterThan(0);
    });

    it('lists audio files', async () => {
      const files = await audioService.listAudioFiles();
      expect(Array.isArray(files)).toBe(true);
    });

    it('cleans up temp files', async () => {
      await audioService.cleanupTempFiles();
      // Should not throw
      expect(true).toBe(true);
    });

    it('generates unique filename', () => {
      const filename1 = audioService.generateUniqueFilename('test', AudioFormat.MP3);
      const filename2 = audioService.generateUniqueFilename('test', AudioFormat.MP3);

      expect(filename1).not.toBe(filename2);
      expect(filename1).toContain('test');
      expect(filename1).toContain('.mp3');
    });
  });

  describe('Lifecycle Management', () => {
    it('cleans up all resources', async () => {
      // Start recording
      await audioService.startRecording();

      // Load a track
      await audioService.loadTrack('track1', MOCK_AUDIO_URIS.recording1);

      // Cleanup
      await audioService.cleanup();

      expect(audioService.isRecording()).toBe(false);
      expect(audioService.getLoadedTrackIds()).toHaveLength(0);
    });
  });
});
