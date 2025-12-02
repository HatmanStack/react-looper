/**
 * BaseAudioPlayer Tests
 *
 * Tests for abstract base class validation and common functionality
 */

import { BaseAudioPlayer } from "../../../src/services/audio/BaseAudioPlayer";
import { AudioError } from "../../../src/services/audio/AudioError";
import { AudioErrorCode } from "../../../src/types/audio";

// Concrete test implementation
class TestAudioPlayer extends BaseAudioPlayer {
  public loadCallCount = 0;
  public playCallCount = 0;
  public pauseCallCount = 0;
  public stopCallCount = 0;
  public setSpeedCallCount = 0;
  public setVolumeCallCount = 0;
  public setLoopingCallCount = 0;

  private _testDuration = 120000;
  private _testPosition = 0;

  protected async _load(_uri: string): Promise<void> {
    this.loadCallCount++;
  }

  protected async _play(): Promise<void> {
    this.playCallCount++;
  }

  protected async _pause(): Promise<void> {
    this.pauseCallCount++;
  }

  protected async _stop(): Promise<void> {
    this.stopCallCount++;
    this._testPosition = 0;
  }

  protected async _setSpeed(_speed: number): Promise<void> {
    this.setSpeedCallCount++;
  }

  protected async _setVolume(_volume: number): Promise<void> {
    this.setVolumeCallCount++;
  }

  protected async _setLooping(_loop: boolean): Promise<void> {
    this.setLoopingCallCount++;
  }

  protected async _setPosition(position: number): Promise<void> {
    this._testPosition = position;
  }

  protected async _getDuration(): Promise<number> {
    return this._testDuration;
  }

  protected async _getPosition(): Promise<number> {
    return this._testPosition;
  }

  protected async _getMetadata() {
    return {
      duration: this._testDuration,
    };
  }

  protected async _unload(): Promise<void> {
    this._testPosition = 0;
  }
}

describe("BaseAudioPlayer", () => {
  let player: TestAudioPlayer;

  beforeEach(() => {
    player = new TestAudioPlayer();
  });

  describe("initialization", () => {
    it("should start in unloaded state", () => {
      expect(player.isLoaded()).toBe(false);
      expect(player.isPlaying()).toBe(false);
    });

    it("should have default values", async () => {
      await player.load("test://audio");
      expect(await player.getDuration()).toBe(120000);
      expect(await player.getPosition()).toBe(0);
    });
  });

  describe("load validation", () => {
    it("should validate URI is not empty", async () => {
      await expect(player.load("")).rejects.toThrow(AudioError);
      await expect(player.load("")).rejects.toThrow("Invalid URI provided");
    });

    it("should unload previous audio before loading new", async () => {
      await player.load("test://audio1");
      expect(player.loadCallCount).toBe(1);

      await player.load("test://audio2");
      expect(player.loadCallCount).toBe(2);
      expect(player.isLoaded()).toBe(true);
    });

    it("should apply playback options when loading", async () => {
      await player.load("test://audio", {
        speed: 1.5,
        volume: 50,
        loop: false,
      });

      expect(player.setSpeedCallCount).toBe(1);
      expect(player.setVolumeCallCount).toBe(1);
      expect(player.setLoopingCallCount).toBe(1);
    });
  });

  describe("play validation", () => {
    it("should throw error if not loaded", async () => {
      await expect(player.play()).rejects.toThrow(AudioError);
      await expect(player.play()).rejects.toThrow(
        "Cannot play: no audio loaded",
      );
    });

    it("should not throw if already playing", async () => {
      await player.load("test://audio");
      await player.play();
      expect(player.isPlaying()).toBe(true);

      // Should not throw
      await expect(player.play()).resolves.not.toThrow();
    });

    it("should mark as playing", async () => {
      await player.load("test://audio");
      await player.play();

      expect(player.isPlaying()).toBe(true);
      expect(player.playCallCount).toBe(1);
    });
  });

  describe("pause validation", () => {
    it("should return early if not loaded", async () => {
      await expect(player.pause()).resolves.not.toThrow();
      expect(player.pauseCallCount).toBe(0);
    });

    it("should pause when playing", async () => {
      await player.load("test://audio");
      await player.play();
      await player.pause();

      expect(player.isPlaying()).toBe(false);
      expect(player.pauseCallCount).toBe(1);
    });
  });

  describe("stop validation", () => {
    it("should return early if not loaded", async () => {
      await expect(player.stop()).resolves.not.toThrow();
      expect(player.stopCallCount).toBe(0);
    });

    it("should stop and reset position", async () => {
      await player.load("test://audio");
      await player.play();
      await player.stop();

      expect(player.isPlaying()).toBe(false);
      expect(await player.getPosition()).toBe(0);
    });
  });

  describe("speed validation", () => {
    it("should reject speed below minimum (0.05)", async () => {
      await player.load("test://audio");

      await expect(player.setSpeed(0.04)).rejects.toThrow(AudioError);
      await expect(player.setSpeed(0.04)).rejects.toThrow(
        "Speed must be between 0.05 and 2.50, got 0.04",
      );
    });

    it("should reject speed above maximum (2.5)", async () => {
      await player.load("test://audio");

      await expect(player.setSpeed(2.51)).rejects.toThrow(AudioError);
      await expect(player.setSpeed(2.51)).rejects.toThrow(
        "Speed must be between 0.05 and 2.50, got 2.51",
      );
    });

    it("should accept minimum speed (0.05)", async () => {
      await player.load("test://audio");
      await expect(player.setSpeed(0.05)).resolves.not.toThrow();
    });

    it("should accept maximum speed (2.5)", async () => {
      await player.load("test://audio");
      await expect(player.setSpeed(2.5)).resolves.not.toThrow();
    });

    it("should accept normal speed (1.0)", async () => {
      await player.load("test://audio");
      await expect(player.setSpeed(1.0)).resolves.not.toThrow();
    });

    it("should store speed value when not loaded", async () => {
      await player.setSpeed(1.5);
      // Should not call implementation when not loaded
      expect(player.setSpeedCallCount).toBe(0);
    });
  });

  describe("volume validation", () => {
    it("should reject volume below 0", async () => {
      await player.load("test://audio");

      await expect(player.setVolume(-1)).rejects.toThrow(AudioError);
      await expect(player.setVolume(-1)).rejects.toThrow(
        "Volume must be between 0 and 100, got -1",
      );
    });

    it("should reject volume above 100", async () => {
      await player.load("test://audio");

      await expect(player.setVolume(101)).rejects.toThrow(AudioError);
      await expect(player.setVolume(101)).rejects.toThrow(
        "Volume must be between 0 and 100, got 101",
      );
    });

    it("should accept minimum volume (0)", async () => {
      await player.load("test://audio");
      await expect(player.setVolume(0)).resolves.not.toThrow();
    });

    it("should accept maximum volume (100)", async () => {
      await player.load("test://audio");
      await expect(player.setVolume(100)).resolves.not.toThrow();
    });

    it("should store volume value when not loaded", async () => {
      await player.setVolume(50);
      // Should not call implementation when not loaded
      expect(player.setVolumeCallCount).toBe(0);
    });
  });

  describe("looping", () => {
    it("should enable looping", async () => {
      await player.load("test://audio");
      await player.setLooping(true);

      expect(player.setLoopingCallCount).toBe(1);
    });

    it("should disable looping", async () => {
      await player.load("test://audio");
      await player.setLooping(false);

      expect(player.setLoopingCallCount).toBe(1);
    });

    it("should store looping value when not loaded", async () => {
      await player.setLooping(false);
      // Should not call implementation when not loaded
      expect(player.setLoopingCallCount).toBe(0);
    });
  });

  describe("position", () => {
    it("should set position", async () => {
      await player.load("test://audio");
      await player.setPosition(5000);

      expect(await player.getPosition()).toBe(5000);
    });

    it("should return early if not loaded", async () => {
      await expect(player.setPosition(5000)).resolves.not.toThrow();
    });

    it("should throw error for negative position", async () => {
      await player.load("test://audio");
      await expect(player.setPosition(-100)).rejects.toThrow(AudioError);
      await expect(player.setPosition(-100)).rejects.toThrow(
        "Position cannot be negative",
      );
    });
  });

  describe("unload", () => {
    it("should unload audio", async () => {
      await player.load("test://audio");
      expect(player.isLoaded()).toBe(true);

      await player.unload();
      expect(player.isLoaded()).toBe(false);
    });

    it("should stop playback when unloading", async () => {
      await player.load("test://audio");
      await player.play();
      expect(player.isPlaying()).toBe(true);

      await player.unload();
      expect(player.isPlaying()).toBe(false);
    });

    it("should not throw if already unloaded", async () => {
      await expect(player.unload()).resolves.not.toThrow();
    });
  });

  describe("error handling", () => {
    it("should create AudioError with correct code for playback", async () => {
      try {
        await player.play();
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(AudioError);
        expect((error as AudioError).code).toBe(AudioErrorCode.PLAYBACK_FAILED);
        expect((error as AudioError).message).toBe(
          "Cannot play: no audio loaded",
        );
      }
    });

    it("should create AudioError for invalid URI", async () => {
      try {
        await player.load("");
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(AudioError);
        expect((error as AudioError).code).toBe(AudioErrorCode.FILE_NOT_FOUND);
        expect((error as AudioError).message).toBe("Invalid URI provided");
      }
    });

    it("should create AudioError for invalid speed", async () => {
      try {
        await player.setSpeed(3.0);
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(AudioError);
        expect((error as AudioError).code).toBe(AudioErrorCode.PLAYBACK_FAILED);
        expect((error as AudioError).message).toContain(
          "Speed must be between",
        );
      }
    });
  });
});
