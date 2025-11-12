/**
 * Playback Integration Tests
 *
 * Tests the full playback flow including multi-track scenarios,
 * speed/volume changes during playback, and edge cases.
 */

import {
  AudioService,
  AudioServiceConfig,
} from "../../src/services/audio/AudioService";
import { WebAudioPlayer } from "../../src/services/audio/WebAudioPlayer";
import { PlaybackOptions } from "../../src/types/audio";
import { BaseAudioPlayer } from "../../src/services/audio/BaseAudioPlayer";

// Mock WebAudioPlayer
jest.mock("../../src/services/audio/WebAudioPlayer");

// Mock types for test configuration - using simple type assertions since these are test mocks

describe("Playback Integration Tests", () => {
  let audioService: AudioService;
  const mockTrackUri1 = "blob:test-track-1";
  const mockTrackUri2 = "blob:test-track-2";
  const mockTrackUri3 = "blob:test-track-3";

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup WebAudioPlayer mock
    (
      WebAudioPlayer as jest.MockedClass<typeof WebAudioPlayer>
    ).mockImplementation(() => {
      let playing = false;
      const mockPlayer = {
        load: jest.fn().mockResolvedValue(undefined),
        play: jest.fn().mockImplementation(async () => {
          playing = true;
        }),
        pause: jest.fn().mockImplementation(async () => {
          playing = false;
        }),
        stop: jest.fn().mockImplementation(async () => {
          playing = false;
        }),
        setSpeed: jest.fn().mockResolvedValue(undefined),
        setVolume: jest.fn().mockResolvedValue(undefined),
        setLooping: jest.fn().mockResolvedValue(undefined),
        setPosition: jest.fn().mockResolvedValue(undefined),
        getDuration: jest.fn().mockResolvedValue(120000),
        getPosition: jest.fn().mockResolvedValue(0),
        getMetadata: jest.fn().mockResolvedValue({
          duration: 120000,
          sampleRate: 44100,
          channels: 2,
        }),
        unload: jest.fn().mockResolvedValue(undefined),
        isPlaying: jest.fn().mockImplementation(() => playing),
        isLoaded: jest.fn().mockReturnValue(true),
        onPlaybackComplete: jest.fn(),
        onPositionUpdate: jest.fn(),
      };
      return mockPlayer;
    });

    // Create AudioService with mock config
    const mockConfig = {
      recorder: {
        startRecording: jest.fn().mockResolvedValue(undefined),
        stopRecording: jest.fn().mockResolvedValue("mock-uri"),
        getPermissions: jest.fn().mockResolvedValue({ granted: true }),
        cancelRecording: jest.fn().mockResolvedValue(undefined),
        getRecordingDuration: jest.fn().mockReturnValue(0),
      },
      playerFactory: () => new WebAudioPlayer() as unknown as BaseAudioPlayer,
      mixer: {
        mixTracks: jest.fn().mockResolvedValue("mixed-output.mp3"),
        setProgressCallback: jest.fn(),
        cancel: jest.fn().mockResolvedValue(undefined),
        estimateMixingDuration: jest.fn().mockResolvedValue(10000),
        validateTracks: jest.fn().mockResolvedValue(undefined),
      },
      fileManager: {
        saveAudioFile: jest.fn().mockResolvedValue("saved-path"),
        deleteAudioFile: jest.fn().mockResolvedValue(undefined),
        copyToAppStorage: jest.fn().mockResolvedValue("app-storage-path"),
        exportToExternalStorage: jest.fn().mockResolvedValue("external-path"),
        getAudioMetadata: jest
          .fn()
          .mockResolvedValue({
            duration: 120000,
            sampleRate: 44100,
            channels: 2,
          }),
        listAudioFiles: jest.fn().mockResolvedValue([]),
        getFileSize: jest.fn().mockResolvedValue(1024000),
        checkFileExists: jest.fn().mockResolvedValue(true),
        getStorageInfo: jest
          .fn()
          .mockResolvedValue({ available: 1000000000, total: 2000000000 }),
        cleanupTempFiles: jest.fn().mockResolvedValue(undefined),
      },
    } as unknown as AudioServiceConfig;

    audioService = new AudioService(mockConfig);
  });

  afterEach(async () => {
    await audioService.cleanup();
  });

  describe("single track playback", () => {
    it("should load, play, and pause a single track", async () => {
      const trackId = "track-1";

      // Load track
      await audioService.loadTrack(trackId, mockTrackUri1, {
        speed: 1.0,
        volume: 75,
        loop: true,
      });

      // Play track
      await audioService.playTrack(trackId);
      expect(audioService.isTrackPlaying(trackId)).toBe(true);

      // Pause track
      await audioService.pauseTrack(trackId);
      expect(audioService.isTrackPlaying(trackId)).toBe(false);
    });

    it("should change speed during playback", async () => {
      const trackId = "track-1";

      await audioService.loadTrack(trackId, mockTrackUri1);
      await audioService.playTrack(trackId);

      // Change speed while playing
      await audioService.setTrackSpeed(trackId, 1.5);

      // Speed change should not stop playback
      expect(audioService.isTrackPlaying(trackId)).toBe(true);
    });

    it("should change volume during playback", async () => {
      const trackId = "track-1";

      await audioService.loadTrack(trackId, mockTrackUri1);
      await audioService.playTrack(trackId);

      // Change volume while playing
      await audioService.setTrackVolume(trackId, 50);

      // Volume change should not stop playback
      expect(audioService.isTrackPlaying(trackId)).toBe(true);
    });

    it("should unload track and release resources", async () => {
      const trackId = "track-1";

      await audioService.loadTrack(trackId, mockTrackUri1);
      await audioService.playTrack(trackId);
      await audioService.unloadTrack(trackId);

      expect(audioService.isTrackPlaying(trackId)).toBe(false);
    });
  });

  describe("multi-track playback", () => {
    it("should play multiple tracks simultaneously", async () => {
      const track1 = "track-1";
      const track2 = "track-2";
      const track3 = "track-3";

      // Load multiple tracks
      await audioService.loadTrack(track1, mockTrackUri1);
      await audioService.loadTrack(track2, mockTrackUri2);
      await audioService.loadTrack(track3, mockTrackUri3);

      // Play all tracks
      await audioService.playTrack(track1);
      await audioService.playTrack(track2);
      await audioService.playTrack(track3);

      // All tracks should be playing
      expect(audioService.isTrackPlaying(track1)).toBe(true);
      expect(audioService.isTrackPlaying(track2)).toBe(true);
      expect(audioService.isTrackPlaying(track3)).toBe(true);
    });

    it("should pause all tracks simultaneously", async () => {
      const track1 = "track-1";
      const track2 = "track-2";

      await audioService.loadTrack(track1, mockTrackUri1);
      await audioService.loadTrack(track2, mockTrackUri2);

      await audioService.playTrack(track1);
      await audioService.playTrack(track2);

      // Pause all
      await audioService.pauseAllTracks();

      expect(audioService.isTrackPlaying(track1)).toBe(false);
      expect(audioService.isTrackPlaying(track2)).toBe(false);
    });

    it("should play all tracks simultaneously", async () => {
      const track1 = "track-1";
      const track2 = "track-2";

      await audioService.loadTrack(track1, mockTrackUri1);
      await audioService.loadTrack(track2, mockTrackUri2);

      // Play all at once
      await audioService.playAllTracks();

      expect(audioService.isTrackPlaying(track1)).toBe(true);
      expect(audioService.isTrackPlaying(track2)).toBe(true);
    });

    it("should control individual track speed independently", async () => {
      const track1 = "track-1";
      const track2 = "track-2";

      await audioService.loadTrack(track1, mockTrackUri1);
      await audioService.loadTrack(track2, mockTrackUri2);

      await audioService.playTrack(track1);
      await audioService.playTrack(track2);

      // Set different speeds
      await audioService.setTrackSpeed(track1, 0.5);
      await audioService.setTrackSpeed(track2, 2.0);

      // Both tracks should still be playing
      expect(audioService.isTrackPlaying(track1)).toBe(true);
      expect(audioService.isTrackPlaying(track2)).toBe(true);
    });

    it("should control individual track volume independently", async () => {
      const track1 = "track-1";
      const track2 = "track-2";

      await audioService.loadTrack(track1, mockTrackUri1);
      await audioService.loadTrack(track2, mockTrackUri2);

      await audioService.playTrack(track1);
      await audioService.playTrack(track2);

      // Set different volumes
      await audioService.setTrackVolume(track1, 25);
      await audioService.setTrackVolume(track2, 100);

      // Both tracks should still be playing
      expect(audioService.isTrackPlaying(track1)).toBe(true);
      expect(audioService.isTrackPlaying(track2)).toBe(true);
    });
  });

  describe("speed edge cases", () => {
    it("should handle very slow speed (0.05x)", async () => {
      const trackId = "track-1";

      await audioService.loadTrack(trackId, mockTrackUri1);
      await audioService.setTrackSpeed(trackId, 0.05);
      await audioService.playTrack(trackId);

      expect(audioService.isTrackPlaying(trackId)).toBe(true);
    });

    it("should handle very fast speed (2.50x)", async () => {
      const trackId = "track-1";

      await audioService.loadTrack(trackId, mockTrackUri1);
      await audioService.setTrackSpeed(trackId, 2.5);
      await audioService.playTrack(trackId);

      expect(audioService.isTrackPlaying(trackId)).toBe(true);
    });

    it("should transition between speed extremes", async () => {
      const trackId = "track-1";

      await audioService.loadTrack(trackId, mockTrackUri1);
      await audioService.playTrack(trackId);

      // Go from very slow to very fast
      await audioService.setTrackSpeed(trackId, 0.05);
      expect(audioService.isTrackPlaying(trackId)).toBe(true);

      await audioService.setTrackSpeed(trackId, 2.5);
      expect(audioService.isTrackPlaying(trackId)).toBe(true);

      // Back to normal
      await audioService.setTrackSpeed(trackId, 1.0);
      expect(audioService.isTrackPlaying(trackId)).toBe(true);
    });
  });

  describe("volume edge cases", () => {
    it("should handle mute (volume = 0)", async () => {
      const trackId = "track-1";

      await audioService.loadTrack(trackId, mockTrackUri1);
      await audioService.setTrackVolume(trackId, 0);
      await audioService.playTrack(trackId);

      // Should still be "playing" even if muted
      expect(audioService.isTrackPlaying(trackId)).toBe(true);
    });

    it("should handle max volume (volume = 100)", async () => {
      const trackId = "track-1";

      await audioService.loadTrack(trackId, mockTrackUri1);
      await audioService.setTrackVolume(trackId, 100);
      await audioService.playTrack(trackId);

      expect(audioService.isTrackPlaying(trackId)).toBe(true);
    });

    it("should transition from mute to max volume", async () => {
      const trackId = "track-1";

      await audioService.loadTrack(trackId, mockTrackUri1);
      await audioService.playTrack(trackId);

      // Start muted
      await audioService.setTrackVolume(trackId, 0);
      expect(audioService.isTrackPlaying(trackId)).toBe(true);

      // Increase to max
      await audioService.setTrackVolume(trackId, 100);
      expect(audioService.isTrackPlaying(trackId)).toBe(true);
    });
  });

  describe("looping functionality", () => {
    it("should enable looping for track", async () => {
      const trackId = "track-1";

      await audioService.loadTrack(trackId, mockTrackUri1, { loop: true });
      await audioService.playTrack(trackId);

      expect(audioService.isTrackPlaying(trackId)).toBe(true);
    });

    it("should disable looping for track", async () => {
      const trackId = "track-1";

      await audioService.loadTrack(trackId, mockTrackUri1, { loop: false });
      await audioService.setTrackLooping(trackId, false);
      await audioService.playTrack(trackId);

      expect(audioService.isTrackPlaying(trackId)).toBe(true);
    });

    it("should change looping state during playback", async () => {
      const trackId = "track-1";

      await audioService.loadTrack(trackId, mockTrackUri1, { loop: true });
      await audioService.playTrack(trackId);

      // Disable looping while playing
      await audioService.setTrackLooping(trackId, false);

      expect(audioService.isTrackPlaying(trackId)).toBe(true);

      // Re-enable looping
      await audioService.setTrackLooping(trackId, true);

      expect(audioService.isTrackPlaying(trackId)).toBe(true);
    });
  });

  describe("playback options", () => {
    it("should apply all playback options when loading", async () => {
      const trackId = "track-1";
      const options: PlaybackOptions = {
        speed: 1.5,
        volume: 50,
        loop: true,
      };

      await audioService.loadTrack(trackId, mockTrackUri1, options);
      await audioService.playTrack(trackId);

      expect(audioService.isTrackPlaying(trackId)).toBe(true);
    });

    it("should handle options with extreme values", async () => {
      const trackId = "track-1";
      const options: PlaybackOptions = {
        speed: 0.05,
        volume: 0,
        loop: false,
      };

      await audioService.loadTrack(trackId, mockTrackUri1, options);
      await audioService.playTrack(trackId);

      expect(audioService.isTrackPlaying(trackId)).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should throw error when playing non-existent track", async () => {
      await expect(audioService.playTrack("non-existent")).rejects.toThrow();
    });

    it("should throw error when pausing non-existent track", async () => {
      await expect(audioService.pauseTrack("non-existent")).rejects.toThrow();
    });

    it("should throw error when setting speed on non-existent track", async () => {
      await expect(
        audioService.setTrackSpeed("non-existent", 1.5),
      ).rejects.toThrow();
    });

    it("should throw error when setting volume on non-existent track", async () => {
      await expect(
        audioService.setTrackVolume("non-existent", 75),
      ).rejects.toThrow();
    });

    it("should handle track unload gracefully", async () => {
      const trackId = "track-1";

      await audioService.loadTrack(trackId, mockTrackUri1);
      await audioService.playTrack(trackId);

      // Unload should not throw
      await expect(audioService.unloadTrack(trackId)).resolves.not.toThrow();

      // Track should no longer exist
      expect(audioService.isTrackPlaying(trackId)).toBe(false);
    });
  });

  describe("complex scenarios", () => {
    it("should handle adding tracks during multi-track playback", async () => {
      const track1 = "track-1";
      const track2 = "track-2";
      const track3 = "track-3";

      // Load and play first two tracks
      await audioService.loadTrack(track1, mockTrackUri1);
      await audioService.loadTrack(track2, mockTrackUri2);
      await audioService.playTrack(track1);
      await audioService.playTrack(track2);

      // Add third track while others are playing
      await audioService.loadTrack(track3, mockTrackUri3);
      await audioService.playTrack(track3);

      // All tracks should be playing
      expect(audioService.isTrackPlaying(track1)).toBe(true);
      expect(audioService.isTrackPlaying(track2)).toBe(true);
      expect(audioService.isTrackPlaying(track3)).toBe(true);
    });

    it("should handle removing tracks during multi-track playback", async () => {
      const track1 = "track-1";
      const track2 = "track-2";
      const track3 = "track-3";

      await audioService.loadTrack(track1, mockTrackUri1);
      await audioService.loadTrack(track2, mockTrackUri2);
      await audioService.loadTrack(track3, mockTrackUri3);

      await audioService.playAllTracks();

      // Remove middle track
      await audioService.unloadTrack(track2);

      // Other tracks should still be playing
      expect(audioService.isTrackPlaying(track1)).toBe(true);
      expect(audioService.isTrackPlaying(track2)).toBe(false);
      expect(audioService.isTrackPlaying(track3)).toBe(true);
    });

    it("should handle rapid speed/volume changes", async () => {
      const trackId = "track-1";

      await audioService.loadTrack(trackId, mockTrackUri1);
      await audioService.playTrack(trackId);

      // Rapid speed changes
      for (let i = 0; i < 10; i++) {
        const speed = 0.05 + i * 0.245; // 0.05 to 2.5
        await audioService.setTrackSpeed(trackId, speed);
      }

      // Rapid volume changes
      for (let i = 0; i <= 100; i += 10) {
        await audioService.setTrackVolume(trackId, i);
      }

      // Track should still be playing
      expect(audioService.isTrackPlaying(trackId)).toBe(true);
    });
  });
});
