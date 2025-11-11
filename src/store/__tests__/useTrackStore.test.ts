/**
 * Tests for Track Store - Master Loop Tracking
 *
 * Following TDD approach - tests written first before implementation
 * Tests both existing functionality and new master loop tracking features
 */

import type { Track } from "../../types";
import { useTrackStore } from "../useTrackStore";

// Helper to create mock tracks for testing
const createMockTrack = (overrides: Partial<Track> = {}): Track => ({
  id: `track-${Date.now()}-${Math.random()}`,
  name: "Test Track",
  uri: "file:///test.mp3",
  duration: 10000, // 10 seconds default
  speed: 1.0,
  volume: 100,
  isPlaying: false,
  createdAt: Date.now(),
  ...overrides,
});

describe("useTrackStore", () => {
  beforeEach(() => {
    // Clear tracks before each test
    useTrackStore.getState().clearTracks();
  });

  describe("existing functionality", () => {
    describe("addTrack", () => {
      it("adds a track to empty array", () => {
        const track = createMockTrack({ id: "track-1" });
        useTrackStore.getState().addTrack(track);

        const tracks = useTrackStore.getState().tracks;
        expect(tracks).toHaveLength(1);
        expect(tracks[0].id).toBe("track-1");
      });

      it("appends track to existing tracks", () => {
        const track1 = createMockTrack({ id: "track-1" });
        const track2 = createMockTrack({ id: "track-2" });

        useTrackStore.getState().addTrack(track1);
        useTrackStore.getState().addTrack(track2);

        const tracks = useTrackStore.getState().tracks;
        expect(tracks).toHaveLength(2);
        expect(tracks[0].id).toBe("track-1");
        expect(tracks[1].id).toBe("track-2");
      });
    });

    describe("removeTrack", () => {
      it("removes non-master track by ID", () => {
        const track1 = createMockTrack({ id: "track-1" });
        const track2 = createMockTrack({ id: "track-2" });
        const track3 = createMockTrack({ id: "track-3" });

        useTrackStore.getState().addTrack(track1);
        useTrackStore.getState().addTrack(track2);
        useTrackStore.getState().addTrack(track3);
        useTrackStore.getState().removeTrack("track-2"); // Remove non-master

        const tracks = useTrackStore.getState().tracks;
        expect(tracks).toHaveLength(2);
        expect(tracks[0].id).toBe("track-1"); // Master still exists
        expect(tracks[1].id).toBe("track-3");
      });
    });

    describe("updateTrack", () => {
      it("updates track properties", () => {
        const track = createMockTrack({ id: "track-1", speed: 1.0 });

        useTrackStore.getState().addTrack(track);
        useTrackStore.getState().updateTrack("track-1", { speed: 1.5 });

        const updated = useTrackStore.getState().getTrack("track-1");
        expect(updated?.speed).toBe(1.5);
      });
    });

    describe("clearTracks", () => {
      it("removes all tracks", () => {
        useTrackStore.getState().addTrack(createMockTrack({ id: "track-1" }));
        useTrackStore.getState().addTrack(createMockTrack({ id: "track-2" }));

        useTrackStore.getState().clearTracks();

        expect(useTrackStore.getState().tracks).toHaveLength(0);
      });
    });
  });

  describe("master loop tracking", () => {
    describe("getMasterTrack", () => {
      it("returns first track when tracks exist", () => {
        const track1 = createMockTrack({ id: "track-1", name: "First" });
        const track2 = createMockTrack({ id: "track-2", name: "Second" });

        useTrackStore.getState().addTrack(track1);
        useTrackStore.getState().addTrack(track2);

        const master = useTrackStore.getState().getMasterTrack();
        expect(master).not.toBeNull();
        expect(master?.id).toBe("track-1");
        expect(master?.name).toBe("First");
      });

      it("returns null for empty array", () => {
        const master = useTrackStore.getState().getMasterTrack();
        expect(master).toBeNull();
      });

      it("returns single track when only one exists", () => {
        const track = createMockTrack({ id: "only-track" });
        useTrackStore.getState().addTrack(track);

        const master = useTrackStore.getState().getMasterTrack();
        expect(master?.id).toBe("only-track");
      });
    });

    describe("isMasterTrack", () => {
      it("returns true for first track", () => {
        const track1 = createMockTrack({ id: "track-1" });
        const track2 = createMockTrack({ id: "track-2" });

        useTrackStore.getState().addTrack(track1);
        useTrackStore.getState().addTrack(track2);

        expect(useTrackStore.getState().isMasterTrack("track-1")).toBe(true);
      });

      it("returns false for non-first track", () => {
        const track1 = createMockTrack({ id: "track-1" });
        const track2 = createMockTrack({ id: "track-2" });

        useTrackStore.getState().addTrack(track1);
        useTrackStore.getState().addTrack(track2);

        expect(useTrackStore.getState().isMasterTrack("track-2")).toBe(false);
      });

      it("returns false for empty array", () => {
        expect(useTrackStore.getState().isMasterTrack("any-id")).toBe(false);
      });

      it("returns false for non-existent track", () => {
        const track = createMockTrack({ id: "track-1" });
        useTrackStore.getState().addTrack(track);

        expect(useTrackStore.getState().isMasterTrack("non-existent")).toBe(
          false,
        );
      });
    });

    describe("hasMasterTrack", () => {
      it("returns true when tracks exist", () => {
        const track = createMockTrack({ id: "track-1" });
        useTrackStore.getState().addTrack(track);

        expect(useTrackStore.getState().hasMasterTrack()).toBe(true);
      });

      it("returns false when no tracks exist", () => {
        expect(useTrackStore.getState().hasMasterTrack()).toBe(false);
      });
    });

    describe("getMasterLoopDuration", () => {
      it("calculates master loop duration with speed adjustment", () => {
        const track = createMockTrack({
          id: "track-1",
          duration: 10000, // 10 seconds
          speed: 0.5, // Half speed
        });

        useTrackStore.getState().addTrack(track);

        // 10s / 0.5 = 20s
        expect(useTrackStore.getState().getMasterLoopDuration()).toBe(20000);
      });

      it("returns 0 for empty array", () => {
        expect(useTrackStore.getState().getMasterLoopDuration()).toBe(0);
      });

      it("uses first track only", () => {
        const track1 = createMockTrack({
          id: "track-1",
          duration: 10000,
          speed: 1.0,
        });
        const track2 = createMockTrack({
          id: "track-2",
          duration: 20000, // Different duration
          speed: 1.0,
        });

        useTrackStore.getState().addTrack(track1);
        useTrackStore.getState().addTrack(track2);

        // Should use track1's duration
        expect(useTrackStore.getState().getMasterLoopDuration()).toBe(10000);
      });

      it("recalculates when master track speed changes", () => {
        const track = createMockTrack({
          id: "track-1",
          duration: 10000,
          speed: 1.0,
        });

        useTrackStore.getState().addTrack(track);
        expect(useTrackStore.getState().getMasterLoopDuration()).toBe(10000);

        // Change speed to 0.5x
        useTrackStore.getState().updateTrack("track-1", { speed: 0.5 });
        expect(useTrackStore.getState().getMasterLoopDuration()).toBe(20000);
      });
    });

    describe("removeTrack - master track special handling", () => {
      it("clears all tracks when master track is removed", () => {
        const track1 = createMockTrack({ id: "track-1" });
        const track2 = createMockTrack({ id: "track-2" });
        const track3 = createMockTrack({ id: "track-3" });

        useTrackStore.getState().addTrack(track1);
        useTrackStore.getState().addTrack(track2);
        useTrackStore.getState().addTrack(track3);

        // Remove master track (first one)
        useTrackStore.getState().removeTrack("track-1");

        // All tracks should be cleared
        expect(useTrackStore.getState().tracks).toHaveLength(0);
      });

      it("allows removing non-master tracks normally", () => {
        const track1 = createMockTrack({ id: "track-1" });
        const track2 = createMockTrack({ id: "track-2" });
        const track3 = createMockTrack({ id: "track-3" });

        useTrackStore.getState().addTrack(track1);
        useTrackStore.getState().addTrack(track2);
        useTrackStore.getState().addTrack(track3);

        // Remove non-master track
        useTrackStore.getState().removeTrack("track-2");

        const tracks = useTrackStore.getState().tracks;
        expect(tracks).toHaveLength(2);
        expect(tracks[0].id).toBe("track-1"); // Master still exists
        expect(tracks[1].id).toBe("track-3");
      });

      it("handles removing last track normally", () => {
        const track = createMockTrack({ id: "track-1" });
        useTrackStore.getState().addTrack(track);

        useTrackStore.getState().removeTrack("track-1");

        expect(useTrackStore.getState().tracks).toHaveLength(0);
      });
    });
  });
});
