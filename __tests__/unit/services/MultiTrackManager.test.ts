/**
 * MultiTrackManager Tests
 */

import { MultiTrackManager } from "../../../src/services/audio/MultiTrackManager";
import { WebAudioPlayer } from "../../../src/services/audio/WebAudioPlayer";

// Mock the audio players
jest.mock("../../../src/services/audio/WebAudioPlayer");

describe("MultiTrackManager", () => {
  let manager: MultiTrackManager;
  let mockPlayer1: jest.Mocked<WebAudioPlayer>;
  let mockPlayer2: jest.Mocked<WebAudioPlayer>;
  let mockPlayer3: jest.Mocked<WebAudioPlayer>;

  beforeEach(() => {
    manager = new MultiTrackManager();

    // Create mock players
    mockPlayer1 = new WebAudioPlayer() as jest.Mocked<WebAudioPlayer>;
    mockPlayer2 = new WebAudioPlayer() as jest.Mocked<WebAudioPlayer>;
    mockPlayer3 = new WebAudioPlayer() as jest.Mocked<WebAudioPlayer>;

    // Set up mock implementations
    mockPlayer1.play = jest.fn().mockResolvedValue(undefined);
    mockPlayer1.pause = jest.fn().mockResolvedValue(undefined);
    mockPlayer1.stop = jest.fn().mockResolvedValue(undefined);
    mockPlayer1.isPlaying = jest.fn().mockReturnValue(false);
    mockPlayer1.isLoaded = jest.fn().mockReturnValue(true);
    mockPlayer1.getPosition = jest.fn().mockResolvedValue(0);
    mockPlayer1.setPosition = jest.fn().mockResolvedValue(undefined);

    mockPlayer2.play = jest.fn().mockResolvedValue(undefined);
    mockPlayer2.pause = jest.fn().mockResolvedValue(undefined);
    mockPlayer2.stop = jest.fn().mockResolvedValue(undefined);
    mockPlayer2.isPlaying = jest.fn().mockReturnValue(false);
    mockPlayer2.isLoaded = jest.fn().mockReturnValue(true);
    mockPlayer2.getPosition = jest.fn().mockResolvedValue(0);
    mockPlayer2.setPosition = jest.fn().mockResolvedValue(undefined);

    mockPlayer3.play = jest.fn().mockResolvedValue(undefined);
    mockPlayer3.pause = jest.fn().mockResolvedValue(undefined);
    mockPlayer3.stop = jest.fn().mockResolvedValue(undefined);
    mockPlayer3.isPlaying = jest.fn().mockReturnValue(false);
    mockPlayer3.isLoaded = jest.fn().mockReturnValue(true);
    mockPlayer3.getPosition = jest.fn().mockResolvedValue(0);
    mockPlayer3.setPosition = jest.fn().mockResolvedValue(undefined);
  });

  describe("track management", () => {
    it("should add track to manager", () => {
      const trackId = manager.addTrack(mockPlayer1);

      expect(trackId).toBeDefined();
      expect(manager.getTrackCount()).toBe(1);
    });

    it("should add multiple tracks", () => {
      manager.addTrack(mockPlayer1);
      manager.addTrack(mockPlayer2);
      manager.addTrack(mockPlayer3);

      expect(manager.getTrackCount()).toBe(3);
    });

    it("should remove track by ID", () => {
      const trackId = manager.addTrack(mockPlayer1);
      manager.addTrack(mockPlayer2);

      manager.removeTrack(trackId);

      expect(manager.getTrackCount()).toBe(1);
    });

    it("should get player by track ID", () => {
      const trackId = manager.addTrack(mockPlayer1);

      const player = manager.getPlayer(trackId);

      expect(player).toBe(mockPlayer1);
    });

    it("should return null for invalid track ID", () => {
      const player = manager.getPlayer("invalid-id");

      expect(player).toBeNull();
    });

    it("should clear all tracks", () => {
      manager.addTrack(mockPlayer1);
      manager.addTrack(mockPlayer2);
      manager.addTrack(mockPlayer3);

      manager.clearAllTracks();

      expect(manager.getTrackCount()).toBe(0);
    });
  });

  describe("synchronized playback", () => {
    it("should play all tracks simultaneously", async () => {
      manager.addTrack(mockPlayer1);
      manager.addTrack(mockPlayer2);

      await manager.playAll();

      expect(mockPlayer1.play).toHaveBeenCalled();
      expect(mockPlayer2.play).toHaveBeenCalled();
    });

    it("should pause all tracks simultaneously", async () => {
      manager.addTrack(mockPlayer1);
      manager.addTrack(mockPlayer2);

      mockPlayer1.isPlaying.mockReturnValue(true);
      mockPlayer2.isPlaying.mockReturnValue(true);

      await manager.pauseAll();

      expect(mockPlayer1.pause).toHaveBeenCalled();
      expect(mockPlayer2.pause).toHaveBeenCalled();
    });

    it("should stop all tracks simultaneously", async () => {
      manager.addTrack(mockPlayer1);
      manager.addTrack(mockPlayer2);

      await manager.stopAll();

      expect(mockPlayer1.stop).toHaveBeenCalled();
      expect(mockPlayer2.stop).toHaveBeenCalled();
    });

    it("should return true when any track is playing", () => {
      manager.addTrack(mockPlayer1);
      manager.addTrack(mockPlayer2);

      mockPlayer1.isPlaying.mockReturnValue(true);
      mockPlayer2.isPlaying.mockReturnValue(false);

      expect(manager.isPlaying()).toBe(true);
    });

    it("should return false when no tracks are playing", () => {
      manager.addTrack(mockPlayer1);
      manager.addTrack(mockPlayer2);

      mockPlayer1.isPlaying.mockReturnValue(false);
      mockPlayer2.isPlaying.mockReturnValue(false);

      expect(manager.isPlaying()).toBe(false);
    });
  });

  describe("playback position", () => {
    it("should get average position across all tracks", async () => {
      manager.addTrack(mockPlayer1);
      manager.addTrack(mockPlayer2);

      mockPlayer1.getPosition.mockResolvedValue(1000);
      mockPlayer2.getPosition.mockResolvedValue(1200);

      const position = await manager.getPosition();

      expect(position).toBe(1100); // Average: (1000 + 1200) / 2
    });

    it("should set position on all tracks", async () => {
      manager.addTrack(mockPlayer1);
      manager.addTrack(mockPlayer2);

      await manager.setPosition(5000);

      expect(mockPlayer1.setPosition).toHaveBeenCalledWith(5000);
      expect(mockPlayer2.setPosition).toHaveBeenCalledWith(5000);
    });

    it("should return 0 when no tracks exist", async () => {
      const position = await manager.getPosition();

      expect(position).toBe(0);
    });
  });

  describe("adding tracks during playback", () => {
    it("should sync new track to current position when added during playback", async () => {
      // Add first track and start playback
      manager.addTrack(mockPlayer1);
      mockPlayer1.isPlaying.mockReturnValue(true);
      mockPlayer1.getPosition.mockResolvedValue(5000);

      // Add second track during playback
      const trackId = await manager.addTrackAndSync(mockPlayer2);

      expect(trackId).toBeDefined();
      expect(mockPlayer2.setPosition).toHaveBeenCalledWith(5000);
      expect(mockPlayer2.play).toHaveBeenCalled();
    });

    it("should not auto-play new track if manager is not playing", async () => {
      manager.addTrack(mockPlayer1);
      mockPlayer1.isPlaying.mockReturnValue(false);

      await manager.addTrackAndSync(mockPlayer2);

      expect(mockPlayer2.play).not.toHaveBeenCalled();
    });
  });

  describe("synchronization drift", () => {
    it("should detect when tracks are out of sync", async () => {
      manager.addTrack(mockPlayer1);
      manager.addTrack(mockPlayer2);

      // Simulate drift: player 1 at 1000ms, player 2 at 2000ms (1000ms drift)
      mockPlayer1.getPosition.mockResolvedValue(1000);
      mockPlayer2.getPosition.mockResolvedValue(2000);

      const drift = await manager.getDrift();

      expect(drift).toBe(1000); // Max drift between tracks
    });

    it("should return 0 drift when tracks are in sync", async () => {
      manager.addTrack(mockPlayer1);
      manager.addTrack(mockPlayer2);

      mockPlayer1.getPosition.mockResolvedValue(1000);
      mockPlayer2.getPosition.mockResolvedValue(1010); // 10ms is acceptable

      const drift = await manager.getDrift();

      expect(drift).toBe(10);
    });

    it("should resync tracks when drift is detected", async () => {
      manager.addTrack(mockPlayer1);
      manager.addTrack(mockPlayer2);

      // Player 1 at 1000ms, player 2 at 2000ms
      mockPlayer1.getPosition.mockResolvedValue(1000);
      mockPlayer2.getPosition.mockResolvedValue(2000);

      await manager.resyncTracks();

      // Both should be set to the average position (1500ms)
      expect(mockPlayer1.setPosition).toHaveBeenCalledWith(1500);
      expect(mockPlayer2.setPosition).toHaveBeenCalledWith(1500);
    });
  });

  describe("error handling", () => {
    it("should continue if one track fails to play", async () => {
      manager.addTrack(mockPlayer1);
      manager.addTrack(mockPlayer2);

      mockPlayer1.play.mockRejectedValue(new Error("Playback failed"));

      await manager.playAll();

      // Second player should still play despite first one failing
      expect(mockPlayer2.play).toHaveBeenCalled();
    });

    it("should handle missing players gracefully", () => {
      expect(() => manager.removeTrack("invalid-id")).not.toThrow();
    });
  });

  describe("track state", () => {
    it("should report all tracks loaded when all are ready", () => {
      manager.addTrack(mockPlayer1);
      manager.addTrack(mockPlayer2);

      mockPlayer1.isLoaded.mockReturnValue(true);
      mockPlayer2.isLoaded.mockReturnValue(true);

      expect(manager.allTracksLoaded()).toBe(true);
    });

    it("should report not all loaded when any track is not ready", () => {
      manager.addTrack(mockPlayer1);
      manager.addTrack(mockPlayer2);

      mockPlayer1.isLoaded.mockReturnValue(true);
      mockPlayer2.isLoaded.mockReturnValue(false);

      expect(manager.allTracksLoaded()).toBe(false);
    });

    it("should return true for empty manager", () => {
      expect(manager.allTracksLoaded()).toBe(true);
    });
  });
});
