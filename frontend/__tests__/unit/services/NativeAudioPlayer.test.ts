/**
 * NativeAudioPlayer Tests
 */

import { NativeAudioPlayer } from "../../../src/services/audio/NativeAudioPlayer";
import { Audio } from "expo-av";

// expo-av is already mocked in jest.setup.js
// We just need to access the mocked functions

// Mock sound type with required methods
interface MockSound {
  getStatusAsync: jest.Mock;
  unloadAsync: jest.Mock;
  playAsync: jest.Mock;
  pauseAsync: jest.Mock;
  stopAsync: jest.Mock;
  setPositionAsync: jest.Mock;
  setRateAsync: jest.Mock;
  setVolumeAsync: jest.Mock;
  setIsLoopingAsync: jest.Mock;
  setOnPlaybackStatusUpdate: jest.Mock;
}

describe("NativeAudioPlayer", () => {
  let player: NativeAudioPlayer;
  let mockSound: MockSound;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a consistent mock sound instance
    mockSound = {
      getStatusAsync: jest.fn(() =>
        Promise.resolve({
          isLoaded: true,
          durationMillis: 120000,
          positionMillis: 0,
          isPlaying: false,
          didJustFinish: false,
          isLooping: true,
        }),
      ),
      unloadAsync: jest.fn(() => Promise.resolve()),
      playAsync: jest.fn(() => Promise.resolve()),
      pauseAsync: jest.fn(() => Promise.resolve()),
      stopAsync: jest.fn(() => Promise.resolve()),
      setPositionAsync: jest.fn(() => Promise.resolve()),
      setRateAsync: jest.fn(() => Promise.resolve()),
      setVolumeAsync: jest.fn(() => Promise.resolve()),
      setIsLoopingAsync: jest.fn(() => Promise.resolve()),
      setOnPlaybackStatusUpdate: jest.fn(),
    };

    // Mock Audio.Sound.createAsync to return our mock sound
    (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
      sound: mockSound,
    });

    player = new NativeAudioPlayer();
  });

  afterEach(async () => {
    if (player && player.isLoaded()) {
      await player.unload();
    }
  });

  describe("load", () => {
    it("should load audio from URI", async () => {
      await player.load("file:///test-audio.m4a");

      expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
        { uri: "file:///test-audio.m4a" },
        expect.objectContaining({
          shouldPlay: false,
        }),
      );
      expect(player.isLoaded()).toBe(true);
    });

    it("should throw error for invalid URI", async () => {
      await expect(player.load("")).rejects.toThrow();
    });

    it("should apply playback options", async () => {
      await player.load("file:///test-audio.m4a", {
        speed: 1.5,
        volume: 75,
        loop: true,
      });

      expect(player.isLoaded()).toBe(true);
    });
  });

  describe("play", () => {
    it("should play loaded audio", async () => {
      await player.load("file:///test-audio.m4a");
      await player.play();

      expect(mockSound.playAsync).toHaveBeenCalled();
      expect(player.isPlaying()).toBe(true);
    });

    it("should throw error if not loaded", async () => {
      await expect(player.play()).rejects.toThrow();
    });
  });

  describe("pause", () => {
    it("should pause playing audio", async () => {
      await player.load("file:///test-audio.m4a");
      await player.play();
      await player.pause();

      expect(mockSound.pauseAsync).toHaveBeenCalled();
      expect(player.isPlaying()).toBe(false);
    });
  });

  describe("stop", () => {
    it("should stop playing audio", async () => {
      await player.load("file:///test-audio.m4a");
      await player.play();
      await player.stop();

      expect(mockSound.stopAsync).toHaveBeenCalled();
      expect(player.isPlaying()).toBe(false);
    });
  });

  describe("setSpeed", () => {
    it("should set playback speed with pitch correction", async () => {
      await player.load("file:///test-audio.m4a");
      await player.setSpeed(1.5);

      expect(mockSound.setRateAsync).toHaveBeenCalledWith(
        1.5,
        true, // shouldCorrectPitch
      );
    });

    it("should reject invalid speed", async () => {
      await expect(player.setSpeed(3.0)).rejects.toThrow();
      await expect(player.setSpeed(0.01)).rejects.toThrow();
    });

    it("should accept valid speed range (0.05 - 2.50)", async () => {
      await player.load("file:///test-audio.m4a");

      await expect(player.setSpeed(0.05)).resolves.not.toThrow();
      await expect(player.setSpeed(2.5)).resolves.not.toThrow();
    });
  });

  describe("setVolume", () => {
    it("should set volume with scaling", async () => {
      await player.load("file:///test-audio.m4a");
      await player.setVolume(75);

      expect(mockSound.setVolumeAsync).toHaveBeenCalled();
      const callArg = (mockSound.setVolumeAsync as jest.Mock).mock.calls[0][0];
      expect(callArg).toBeGreaterThan(0);
      expect(callArg).toBeLessThanOrEqual(1);
    });

    it("should handle mute (volume = 0)", async () => {
      await player.load("file:///test-audio.m4a");
      await player.setVolume(0);

      expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(0);
    });

    it("should reject invalid volume", async () => {
      await expect(player.setVolume(-1)).rejects.toThrow();
      await expect(player.setVolume(101)).rejects.toThrow();
    });
  });

  describe("setLooping", () => {
    it("should enable looping", async () => {
      await player.load("file:///test-audio.m4a");
      await player.setLooping(true);

      expect(mockSound.setIsLoopingAsync).toHaveBeenCalledWith(true);
    });

    it("should disable looping", async () => {
      await player.load("file:///test-audio.m4a");
      await player.setLooping(false);

      expect(mockSound.setIsLoopingAsync).toHaveBeenCalledWith(false);
    });

    it("should allow speed changes while looping", async () => {
      await player.load("file:///test-audio.m4a");
      await player.setLooping(true);
      await player.play();

      expect(mockSound.setIsLoopingAsync).toHaveBeenCalledWith(true);

      // Change speed while looping
      await player.setSpeed(1.5);

      expect(mockSound.setRateAsync).toHaveBeenCalledWith(1.5, true);
      // Looping should remain enabled (setIsLoopingAsync not called again)
    });

    it("should allow volume changes while looping", async () => {
      await player.load("file:///test-audio.m4a");
      await player.setLooping(true);
      await player.play();

      expect(mockSound.setIsLoopingAsync).toHaveBeenCalledWith(true);

      // Change volume while looping
      await player.setVolume(50);

      expect(mockSound.setVolumeAsync).toHaveBeenCalled();
      // Looping should remain enabled (setIsLoopingAsync not called again)
    });
  });

  describe("getDuration", () => {
    it("should return audio duration", async () => {
      await player.load("file:///test-audio.m4a");

      const duration = await player.getDuration();

      // Mock returns 120000ms (120 seconds)
      expect(duration).toBe(120000);
    });

    it("should return 0 if not loaded", async () => {
      const duration = await player.getDuration();
      expect(duration).toBe(0);
    });
  });

  describe("getPosition", () => {
    it("should return current position", async () => {
      await player.load("file:///test-audio.m4a");

      const position = await player.getPosition();

      expect(position).toBeGreaterThanOrEqual(0);
    });
  });

  describe("unload", () => {
    it("should unload audio and release resources", async () => {
      await player.load("file:///test-audio.m4a");
      await player.unload();

      expect(mockSound.unloadAsync).toHaveBeenCalled();
      expect(player.isLoaded()).toBe(false);
    });

    it("should stop playback when unloading", async () => {
      await player.load("file:///test-audio.m4a");
      await player.play();
      await player.unload();

      expect(player.isPlaying()).toBe(false);
    });
  });
});
