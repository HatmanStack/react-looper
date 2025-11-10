/**
 * Playback Store Tests
 */

import { usePlaybackStore } from '../../../src/store/usePlaybackStore';

describe('usePlaybackStore', () => {
  beforeEach(() => {
    // Reset store before each test
    usePlaybackStore.getState().reset();
  });

  describe('track management', () => {
    it('should add track with default state', () => {
      const { addTrack, getTrackState } = usePlaybackStore.getState();

      addTrack('track-1');

      const state = getTrackState('track-1');
      expect(state).toEqual({
        speed: 1.0,
        volume: 75,
        isPlaying: false,
        isLooping: true,
      });
    });

    it('should add track with custom initial state', () => {
      const { addTrack, getTrackState } = usePlaybackStore.getState();

      addTrack('track-1', {
        speed: 1.5,
        volume: 50,
        isPlaying: true,
      });

      const state = getTrackState('track-1');
      expect(state).toEqual({
        speed: 1.5,
        volume: 50,
        isPlaying: true,
        isLooping: true, // Default value
      });
    });

    it('should remove track', () => {
      const { addTrack, removeTrack, getTrackState } = usePlaybackStore.getState();

      addTrack('track-1');
      expect(getTrackState('track-1')).toBeDefined();

      removeTrack('track-1');
      expect(getTrackState('track-1')).toBeUndefined();
    });

    it('should remove playing track and update isAnyPlaying', () => {
      const store = usePlaybackStore.getState();

      store.addTrack('track-1');
      store.setTrackPlaying('track-1', true);
      expect(usePlaybackStore.getState().isAnyPlaying).toBe(true);

      store.removeTrack('track-1');
      expect(usePlaybackStore.getState().isAnyPlaying).toBe(false);
    });
  });

  describe('playback state', () => {
    it('should set track playing', () => {
      const store = usePlaybackStore.getState();

      store.addTrack('track-1');
      store.setTrackPlaying('track-1', true);

      const state = usePlaybackStore.getState();
      expect(state.getTrackState('track-1')?.isPlaying).toBe(true);
      expect(state.playingTracks.has('track-1')).toBe(true);
      expect(state.isAnyPlaying).toBe(true);
    });

    it('should set track paused', () => {
      const store = usePlaybackStore.getState();

      store.addTrack('track-1');
      store.setTrackPlaying('track-1', true);
      store.setTrackPlaying('track-1', false);

      const state = usePlaybackStore.getState();
      expect(state.getTrackState('track-1')?.isPlaying).toBe(false);
      expect(state.playingTracks.has('track-1')).toBe(false);
      expect(state.isAnyPlaying).toBe(false);
    });

    it('should track multiple playing tracks', () => {
      const store = usePlaybackStore.getState();

      store.addTrack('track-1');
      store.addTrack('track-2');
      store.addTrack('track-3');

      store.setTrackPlaying('track-1', true);
      store.setTrackPlaying('track-2', true);
      store.setTrackPlaying('track-3', true);

      const state = usePlaybackStore.getState();
      expect(state.playingTracks.size).toBe(3);
      expect(state.isAnyPlaying).toBe(true);
    });

    it('should update isAnyPlaying when last track stops', () => {
      const store = usePlaybackStore.getState();

      store.addTrack('track-1');
      store.addTrack('track-2');

      store.setTrackPlaying('track-1', true);
      store.setTrackPlaying('track-2', true);
      expect(usePlaybackStore.getState().isAnyPlaying).toBe(true);

      store.setTrackPlaying('track-1', false);
      expect(usePlaybackStore.getState().isAnyPlaying).toBe(true);

      store.setTrackPlaying('track-2', false);
      expect(usePlaybackStore.getState().isAnyPlaying).toBe(false);
    });
  });

  describe('track properties', () => {
    it('should set track speed', () => {
      const store = usePlaybackStore.getState();

      store.addTrack('track-1');
      store.setTrackSpeed('track-1', 1.5);

      const state = usePlaybackStore.getState();
      expect(state.getTrackState('track-1')?.speed).toBe(1.5);
    });

    it('should set track volume', () => {
      const store = usePlaybackStore.getState();

      store.addTrack('track-1');
      store.setTrackVolume('track-1', 50);

      const state = usePlaybackStore.getState();
      expect(state.getTrackState('track-1')?.volume).toBe(50);
    });

    it('should set track looping', () => {
      const store = usePlaybackStore.getState();

      store.addTrack('track-1');
      store.setTrackLooping('track-1', false);

      const state = usePlaybackStore.getState();
      expect(state.getTrackState('track-1')?.isLooping).toBe(false);
    });

    it('should update multiple properties independently', () => {
      const store = usePlaybackStore.getState();

      store.addTrack('track-1');
      store.setTrackSpeed('track-1', 2.0);
      store.setTrackVolume('track-1', 100);
      store.setTrackLooping('track-1', false);
      store.setTrackPlaying('track-1', true);

      const state = usePlaybackStore.getState();
      const trackState = state.getTrackState('track-1');

      expect(trackState).toEqual({
        speed: 2.0,
        volume: 100,
        isLooping: false,
        isPlaying: true,
      });
    });
  });

  describe('global controls', () => {
    it('should pause all tracks', () => {
      const store = usePlaybackStore.getState();

      store.addTrack('track-1');
      store.addTrack('track-2');
      store.addTrack('track-3');

      store.setTrackPlaying('track-1', true);
      store.setTrackPlaying('track-2', true);
      store.setTrackPlaying('track-3', true);

      store.pauseAll();

      const state = usePlaybackStore.getState();
      expect(state.getTrackState('track-1')?.isPlaying).toBe(false);
      expect(state.getTrackState('track-2')?.isPlaying).toBe(false);
      expect(state.getTrackState('track-3')?.isPlaying).toBe(false);
      expect(state.playingTracks.size).toBe(0);
      expect(state.isAnyPlaying).toBe(false);
    });

    it('should play all tracks', () => {
      const store = usePlaybackStore.getState();

      store.addTrack('track-1');
      store.addTrack('track-2');
      store.addTrack('track-3');

      store.playAll();

      const state = usePlaybackStore.getState();
      expect(state.getTrackState('track-1')?.isPlaying).toBe(true);
      expect(state.getTrackState('track-2')?.isPlaying).toBe(true);
      expect(state.getTrackState('track-3')?.isPlaying).toBe(true);
      expect(state.playingTracks.size).toBe(3);
      expect(state.isAnyPlaying).toBe(true);
    });

    it('should preserve other properties when pausing all', () => {
      const store = usePlaybackStore.getState();

      store.addTrack('track-1', { speed: 1.5, volume: 50 });
      store.setTrackPlaying('track-1', true);

      store.pauseAll();

      const state = usePlaybackStore.getState();
      const trackState = state.getTrackState('track-1');

      expect(trackState?.isPlaying).toBe(false);
      expect(trackState?.speed).toBe(1.5);
      expect(trackState?.volume).toBe(50);
    });

    it('should preserve other properties when playing all', () => {
      const store = usePlaybackStore.getState();

      store.addTrack('track-1', { speed: 2.0, volume: 25 });

      store.playAll();

      const state = usePlaybackStore.getState();
      const trackState = state.getTrackState('track-1');

      expect(trackState?.isPlaying).toBe(true);
      expect(trackState?.speed).toBe(2.0);
      expect(trackState?.volume).toBe(25);
    });
  });

  describe('store reset', () => {
    it('should reset store to initial state', () => {
      const store = usePlaybackStore.getState();

      store.addTrack('track-1');
      store.addTrack('track-2');
      store.setTrackPlaying('track-1', true);

      store.reset();

      const state = usePlaybackStore.getState();
      expect(state.trackStates.size).toBe(0);
      expect(state.playingTracks.size).toBe(0);
      expect(state.isAnyPlaying).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle setting properties on non-existent track', () => {
      const store = usePlaybackStore.getState();

      // Should not throw
      expect(() => {
        store.setTrackPlaying('non-existent', true);
        store.setTrackSpeed('non-existent', 1.5);
        store.setTrackVolume('non-existent', 50);
        store.setTrackLooping('non-existent', false);
      }).not.toThrow();

      const state = usePlaybackStore.getState();
      expect(state.getTrackState('non-existent')).toBeUndefined();
    });

    it('should handle removing non-existent track', () => {
      const store = usePlaybackStore.getState();

      expect(() => {
        store.removeTrack('non-existent');
      }).not.toThrow();
    });

    it('should handle pauseAll with no tracks', () => {
      const store = usePlaybackStore.getState();

      expect(() => {
        store.pauseAll();
      }).not.toThrow();

      const state = usePlaybackStore.getState();
      expect(state.isAnyPlaying).toBe(false);
    });

    it('should handle playAll with no tracks', () => {
      const store = usePlaybackStore.getState();

      expect(() => {
        store.playAll();
      }).not.toThrow();

      const state = usePlaybackStore.getState();
      expect(state.isAnyPlaying).toBe(false);
    });
  });

  describe('state immutability', () => {
    it('should not mutate trackStates map directly', () => {
      const store = usePlaybackStore.getState();

      store.addTrack('track-1');
      const initialStates = usePlaybackStore.getState().trackStates;

      store.setTrackSpeed('track-1', 1.5);
      const newStates = usePlaybackStore.getState().trackStates;

      expect(initialStates).not.toBe(newStates);
    });

    it('should not mutate playingTracks set directly', () => {
      const store = usePlaybackStore.getState();

      store.addTrack('track-1');
      const initialPlayingTracks = usePlaybackStore.getState().playingTracks;

      store.setTrackPlaying('track-1', true);
      const newPlayingTracks = usePlaybackStore.getState().playingTracks;

      expect(initialPlayingTracks).not.toBe(newPlayingTracks);
    });
  });

  describe('concurrent operations', () => {
    it('should handle rapid state changes', () => {
      const store = usePlaybackStore.getState();

      store.addTrack('track-1');

      // Rapid state changes
      for (let i = 0; i < 100; i++) {
        store.setTrackPlaying('track-1', i % 2 === 0);
        store.setTrackSpeed('track-1', 0.5 + i * 0.02);
        store.setTrackVolume('track-1', i % 100);
      }

      const state = usePlaybackStore.getState();
      expect(state.getTrackState('track-1')).toBeDefined();
    });

    it('should handle adding and removing tracks rapidly', () => {
      const store = usePlaybackStore.getState();

      for (let i = 0; i < 50; i++) {
        store.addTrack(`track-${i}`);
      }

      expect(usePlaybackStore.getState().trackStates.size).toBe(50);

      for (let i = 0; i < 25; i++) {
        store.removeTrack(`track-${i}`);
      }

      expect(usePlaybackStore.getState().trackStates.size).toBe(25);
    });
  });
});
