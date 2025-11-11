/**
 * Track Store Tests
 */

import { useTrackStore } from "../../../src/store/useTrackStore";
import type { Track } from "../../../src/types";

describe("useTrackStore", () => {
  // Helper to create mock track
  const createMockTrack = (overrides?: Partial<Track>): Track => ({
    id: "test-track-1",
    name: "Test Track",
    uri: "file://test.mp3",
    duration: 60000,
    speed: 1.0,
    volume: 75,
    isPlaying: false,
    createdAt: Date.now(),
    ...overrides,
  });

  beforeEach(() => {
    // Clear all tracks before each test
    useTrackStore.getState().clearTracks();
  });

  describe("track management", () => {
    it("should add track", () => {
      const store = useTrackStore.getState();
      const track = createMockTrack();

      store.addTrack(track);

      const state = useTrackStore.getState();
      expect(state.tracks).toHaveLength(1);
      expect(state.tracks[0]).toEqual(track);
    });

    it("should add multiple tracks", () => {
      const store = useTrackStore.getState();
      const track1 = createMockTrack({ id: "track-1", name: "Track 1" });
      const track2 = createMockTrack({ id: "track-2", name: "Track 2" });
      const track3 = createMockTrack({ id: "track-3", name: "Track 3" });

      store.addTrack(track1);
      store.addTrack(track2);
      store.addTrack(track3);

      const state = useTrackStore.getState();
      expect(state.tracks).toHaveLength(3);
      expect(state.tracks[0].name).toBe("Track 1");
      expect(state.tracks[1].name).toBe("Track 2");
      expect(state.tracks[2].name).toBe("Track 3");
    });

    it("should remove track by id", () => {
      const store = useTrackStore.getState();
      const track1 = createMockTrack({ id: "track-1", name: "Track 1" });
      const track2 = createMockTrack({ id: "track-2", name: "Track 2" });

      store.addTrack(track1);
      store.addTrack(track2);
      expect(useTrackStore.getState().tracks).toHaveLength(2);

      store.removeTrack("track-1");

      const state = useTrackStore.getState();
      expect(state.tracks).toHaveLength(1);
      expect(state.tracks[0].id).toBe("track-2");
    });

    it("should handle removing non-existent track", () => {
      const store = useTrackStore.getState();
      const track = createMockTrack();

      store.addTrack(track);

      expect(() => {
        store.removeTrack("non-existent");
      }).not.toThrow();

      expect(useTrackStore.getState().tracks).toHaveLength(1);
    });

    it("should update track properties", () => {
      const store = useTrackStore.getState();
      const track = createMockTrack();

      store.addTrack(track);
      store.updateTrack(track.id, {
        name: "Updated Name",
        speed: 1.5,
        volume: 50,
      });

      const state = useTrackStore.getState();
      const updatedTrack = state.tracks[0];

      expect(updatedTrack.name).toBe("Updated Name");
      expect(updatedTrack.speed).toBe(1.5);
      expect(updatedTrack.volume).toBe(50);
      // Other properties should remain unchanged
      expect(updatedTrack.id).toBe(track.id);
      expect(updatedTrack.uri).toBe(track.uri);
    });

    it("should handle updating non-existent track", () => {
      const store = useTrackStore.getState();

      expect(() => {
        store.updateTrack("non-existent", { name: "Updated" });
      }).not.toThrow();
    });

    it("should get track by id", () => {
      const store = useTrackStore.getState();
      const track = createMockTrack({ id: "find-me" });

      store.addTrack(track);

      const found = store.getTrack("find-me");
      expect(found).toEqual(track);
    });

    it("should return undefined for non-existent track", () => {
      const store = useTrackStore.getState();

      const found = store.getTrack("non-existent");
      expect(found).toBeUndefined();
    });

    it("should clear all tracks", () => {
      const store = useTrackStore.getState();

      store.addTrack(createMockTrack({ id: "track-1" }));
      store.addTrack(createMockTrack({ id: "track-2" }));
      store.addTrack(createMockTrack({ id: "track-3" }));

      expect(useTrackStore.getState().tracks).toHaveLength(3);

      store.clearTracks();

      expect(useTrackStore.getState().tracks).toHaveLength(0);
    });
  });

  describe("derived state", () => {
    it("should get track count", () => {
      const store = useTrackStore.getState();

      expect(store.getTrackCount()).toBe(0);

      store.addTrack(createMockTrack({ id: "track-1" }));
      expect(store.getTrackCount()).toBe(1);

      store.addTrack(createMockTrack({ id: "track-2" }));
      expect(store.getTrackCount()).toBe(2);

      store.removeTrack("track-1");
      expect(store.getTrackCount()).toBe(1);
    });

    it("should check if has playable tracks", () => {
      const store = useTrackStore.getState();

      expect(store.hasPlayableTracks()).toBe(false);

      store.addTrack(createMockTrack());
      expect(store.hasPlayableTracks()).toBe(true);

      store.clearTracks();
      expect(store.hasPlayableTracks()).toBe(false);
    });

    it("should get playing tracks", () => {
      const store = useTrackStore.getState();

      store.addTrack(createMockTrack({ id: "track-1", isPlaying: true }));
      store.addTrack(createMockTrack({ id: "track-2", isPlaying: false }));
      store.addTrack(createMockTrack({ id: "track-3", isPlaying: true }));

      const playingTracks = store.getPlayingTracks();

      expect(playingTracks).toHaveLength(2);
      expect(playingTracks[0].id).toBe("track-1");
      expect(playingTracks[1].id).toBe("track-3");
    });

    it("should return empty array when no tracks are playing", () => {
      const store = useTrackStore.getState();

      store.addTrack(createMockTrack({ id: "track-1", isPlaying: false }));
      store.addTrack(createMockTrack({ id: "track-2", isPlaying: false }));

      const playingTracks = store.getPlayingTracks();

      expect(playingTracks).toHaveLength(0);
    });
  });

  describe("state immutability", () => {
    it("should not mutate tracks array when adding", () => {
      const store = useTrackStore.getState();
      const track = createMockTrack();

      const initialTracks = useTrackStore.getState().tracks;

      store.addTrack(track);

      const newTracks = useTrackStore.getState().tracks;
      expect(initialTracks).not.toBe(newTracks);
    });

    it("should not mutate tracks array when removing", () => {
      const store = useTrackStore.getState();
      const track = createMockTrack();

      store.addTrack(track);
      const tracksAfterAdd = useTrackStore.getState().tracks;

      store.removeTrack(track.id);

      const tracksAfterRemove = useTrackStore.getState().tracks;
      expect(tracksAfterAdd).not.toBe(tracksAfterRemove);
    });

    it("should not mutate tracks array when updating", () => {
      const store = useTrackStore.getState();
      const track = createMockTrack();

      store.addTrack(track);
      const tracksAfterAdd = useTrackStore.getState().tracks;

      store.updateTrack(track.id, { name: "Updated" });

      const tracksAfterUpdate = useTrackStore.getState().tracks;
      expect(tracksAfterAdd).not.toBe(tracksAfterUpdate);
    });

    it("should not mutate original track object when updating", () => {
      const store = useTrackStore.getState();
      const track = createMockTrack();

      store.addTrack(track);
      const addedTrack = useTrackStore.getState().tracks[0];

      store.updateTrack(track.id, { name: "Updated" });

      const updatedTrack = useTrackStore.getState().tracks[0];
      expect(addedTrack).not.toBe(updatedTrack);
    });
  });

  describe("edge cases", () => {
    it("should handle rapid operations", () => {
      const store = useTrackStore.getState();

      // Add many tracks rapidly
      for (let i = 0; i < 100; i++) {
        store.addTrack(
          createMockTrack({ id: `track-${i}`, name: `Track ${i}` }),
        );
      }

      expect(store.getTrackCount()).toBe(100);

      // Update some tracks
      for (let i = 0; i < 50; i++) {
        store.updateTrack(`track-${i}`, { speed: 2.0 });
      }

      // Remove some tracks
      for (let i = 0; i < 25; i++) {
        store.removeTrack(`track-${i}`);
      }

      expect(store.getTrackCount()).toBe(75);
    });

    it("should maintain order when adding tracks", () => {
      const store = useTrackStore.getState();

      for (let i = 0; i < 10; i++) {
        store.addTrack(
          createMockTrack({ id: `track-${i}`, name: `Track ${i}` }),
        );
      }

      const state = useTrackStore.getState();
      for (let i = 0; i < 10; i++) {
        expect(state.tracks[i].name).toBe(`Track ${i}`);
      }
    });

    it("should handle empty state operations", () => {
      const store = useTrackStore.getState();

      expect(() => {
        store.removeTrack("any-id");
        store.updateTrack("any-id", { name: "Updated" });
        store.clearTracks();
      }).not.toThrow();

      expect(store.getTrackCount()).toBe(0);
      expect(store.hasPlayableTracks()).toBe(false);
      expect(store.getPlayingTracks()).toHaveLength(0);
    });
  });

  describe("track data integrity", () => {
    it("should preserve all track properties when adding", () => {
      const store = useTrackStore.getState();
      const track = createMockTrack({
        id: "track-1",
        name: "Test Track",
        uri: "file://test.mp3",
        duration: 120000,
        speed: 1.5,
        volume: 80,
        isPlaying: true,
        createdAt: 1234567890,
      });

      store.addTrack(track);

      const storedTrack = store.getTrack("track-1");
      expect(storedTrack).toEqual(track);
    });

    it("should only update specified properties", () => {
      const store = useTrackStore.getState();
      const originalTrack = createMockTrack({
        id: "track-1",
        name: "Original",
        speed: 1.0,
        volume: 75,
      });

      store.addTrack(originalTrack);
      store.updateTrack("track-1", { speed: 2.0 });

      const updatedTrack = store.getTrack("track-1");
      expect(updatedTrack?.name).toBe("Original");
      expect(updatedTrack?.speed).toBe(2.0);
      expect(updatedTrack?.volume).toBe(75);
    });
  });
});
