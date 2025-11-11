/**
 * WebAudioPlayer Tests
 */

import { WebAudioPlayer } from "../../../src/services/audio/WebAudioPlayer";

// Mock Web Audio API
const mockAudioContext = {
  createBufferSource: jest.fn(),
  createGain: jest.fn(),
  decodeAudioData: jest.fn(),
  destination: {},
  currentTime: 0,
  resume: jest.fn(() => Promise.resolve()),
  suspend: jest.fn(() => Promise.resolve()),
  close: jest.fn(() => Promise.resolve()),
};

const mockAudioBuffer = {
  duration: 120, // 120 seconds
  sampleRate: 44100,
  numberOfChannels: 2,
};

const mockBufferSource = {
  buffer: null,
  playbackRate: { value: 1.0 },
  loop: false,
  start: jest.fn(),
  stop: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  onended: null,
};

const mockGainNode = {
  gain: { value: 1.0 },
  connect: jest.fn(),
  disconnect: jest.fn(),
};

// Setup global mocks
global.AudioContext = jest.fn(
  () => mockAudioContext,
) as unknown as typeof AudioContext;
global.fetch = jest.fn();

describe("WebAudioPlayer", () => {
  let player: WebAudioPlayer;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAudioContext.createBufferSource.mockReturnValue(mockBufferSource);
    mockAudioContext.createGain.mockReturnValue(mockGainNode);
    mockAudioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer);

    (global.fetch as jest.Mock).mockResolvedValue({
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
    });

    player = new WebAudioPlayer();
  });

  afterEach(async () => {
    if (player && player.isLoaded()) {
      await player.unload();
    }
  });

  describe("load", () => {
    it("should load audio from URI", async () => {
      await player.load("blob:test-audio");

      expect(global.fetch).toHaveBeenCalledWith("blob:test-audio");
      expect(mockAudioContext.decodeAudioData).toHaveBeenCalled();
      expect(player.isLoaded()).toBe(true);
    });

    it("should throw error for invalid URI", async () => {
      await expect(player.load("")).rejects.toThrow();
    });

    it("should unload previous audio before loading new", async () => {
      await player.load("blob:audio1");
      await player.load("blob:audio2");

      expect(player.isLoaded()).toBe(true);
    });
  });

  describe("play", () => {
    it("should play loaded audio", async () => {
      await player.load("blob:test-audio");
      await player.play();

      expect(mockBufferSource.start).toHaveBeenCalled();
      expect(player.isPlaying()).toBe(true);
    });

    it("should throw error if not loaded", async () => {
      await expect(player.play()).rejects.toThrow();
    });
  });

  describe("pause", () => {
    it("should pause playing audio", async () => {
      await player.load("blob:test-audio");
      await player.play();
      await player.pause();

      expect(player.isPlaying()).toBe(false);
    });
  });

  describe("setSpeed", () => {
    it("should set playback speed", async () => {
      await player.load("blob:test-audio");
      await player.setSpeed(1.5);
      await player.play(); // Speed is applied when play() is called

      expect(mockBufferSource.playbackRate.value).toBe(1.5);
    });

    it("should reject invalid speed", async () => {
      await expect(player.setSpeed(3.0)).rejects.toThrow();
      await expect(player.setSpeed(0.01)).rejects.toThrow();
    });

    it("should accept valid speed range (0.05 - 2.50)", async () => {
      await player.load("blob:test-audio");
      await expect(player.setSpeed(0.05)).resolves.not.toThrow();
      await expect(player.setSpeed(2.5)).resolves.not.toThrow();
    });
  });

  describe("setVolume", () => {
    it("should set volume with logarithmic scaling", async () => {
      await player.load("blob:test-audio");
      await player.setVolume(75);

      expect(mockGainNode.gain.value).toBeGreaterThan(0);
      expect(mockGainNode.gain.value).toBeLessThanOrEqual(1);
    });

    it("should handle mute (volume = 0)", async () => {
      await player.load("blob:test-audio");
      await player.setVolume(0);

      expect(mockGainNode.gain.value).toBe(0);
    });

    it("should reject invalid volume", async () => {
      await expect(player.setVolume(-1)).rejects.toThrow();
      await expect(player.setVolume(101)).rejects.toThrow();
    });
  });

  describe("setLooping", () => {
    it("should enable looping", async () => {
      await player.load("blob:test-audio");
      await player.setLooping(true);
      await player.play(); // Looping is applied when play() is called

      expect(mockBufferSource.loop).toBe(true);
    });

    it("should disable looping", async () => {
      await player.load("blob:test-audio");
      await player.setLooping(false);
      await player.play(); // Looping is applied when play() is called

      expect(mockBufferSource.loop).toBe(false);
    });

    it("should allow speed changes while looping", async () => {
      await player.load("blob:test-audio");
      await player.setLooping(true);
      await player.play();

      expect(mockBufferSource.loop).toBe(true);

      // Change speed while looping
      await player.setSpeed(1.5);

      expect(mockBufferSource.playbackRate.value).toBe(1.5);
      expect(mockBufferSource.loop).toBe(true); // Loop should still be enabled
    });

    it("should allow volume changes while looping", async () => {
      await player.load("blob:test-audio");
      await player.setLooping(true);
      await player.play();

      expect(mockBufferSource.loop).toBe(true);

      // Change volume while looping
      await player.setVolume(50);

      expect(mockGainNode.gain.value).toBeGreaterThan(0);
      expect(mockBufferSource.loop).toBe(true); // Loop should still be enabled
    });
  });

  describe("getDuration", () => {
    it("should return audio duration", async () => {
      await player.load("blob:test-audio");
      const duration = await player.getDuration();

      // Duration should be in milliseconds (120s * 1000)
      expect(duration).toBe(120000);
    });

    it("should return 0 if not loaded", async () => {
      const duration = await player.getDuration();
      expect(duration).toBe(0);
    });
  });

  describe("unload", () => {
    it("should unload audio and release resources", async () => {
      await player.load("blob:test-audio");
      await player.unload();

      expect(player.isLoaded()).toBe(false);
    });

    it("should stop playback when unloading", async () => {
      await player.load("blob:test-audio");
      await player.play();
      await player.unload();

      expect(player.isPlaying()).toBe(false);
    });
  });
});
