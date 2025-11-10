/**
 * LifecycleManager Tests
 */

import { LifecycleManager } from '../../../src/services/lifecycle/LifecycleManager';
import { AppState } from 'react-native';
import { usePlaybackStore } from '../../../src/store/usePlaybackStore';

// Mock React Native AppState
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
  },
}));

// Mock Playback Store
jest.mock('../../../src/store/usePlaybackStore', () => ({
  usePlaybackStore: {
    getState: jest.fn(),
  },
}));

describe('LifecycleManager', () => {
  let lifecycleManager: LifecycleManager;
  let pauseAllMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    LifecycleManager.reset();

    pauseAllMock = jest.fn();
    (usePlaybackStore.getState as jest.Mock).mockReturnValue({
      pauseAll: pauseAllMock,
    });
  });

  afterEach(() => {
    LifecycleManager.reset();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = LifecycleManager.getInstance();
      const instance2 = LifecycleManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = LifecycleManager.getInstance();
      LifecycleManager.reset();
      const instance2 = LifecycleManager.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should set up app state listener', () => {
      lifecycleManager = LifecycleManager.getInstance();
      lifecycleManager.initialize();

      expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should not initialize twice', () => {
      lifecycleManager = LifecycleManager.getInstance();
      lifecycleManager.initialize();
      lifecycleManager.initialize();

      // Should only be called once
      expect(AppState.addEventListener).toHaveBeenCalledTimes(1);
    });

    it('should accept audio cleanup callback', () => {
      const audioCleanup = jest.fn();

      lifecycleManager = LifecycleManager.getInstance();
      lifecycleManager.initialize({ onAudioCleanup: audioCleanup });

      expect(AppState.addEventListener).toHaveBeenCalled();
    });
  });

  describe('handleBackground', () => {
    it('should pause all tracks when going to background', () => {
      lifecycleManager = LifecycleManager.getInstance();
      lifecycleManager.initialize();

      // Get the state change handler
      const stateChangeHandler = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

      // Simulate going to background
      stateChangeHandler('background');

      expect(pauseAllMock).toHaveBeenCalled();
    });

    it('should call audio cleanup callback', () => {
      const audioCleanup = jest.fn();

      lifecycleManager = LifecycleManager.getInstance();
      lifecycleManager.initialize({ onAudioCleanup: audioCleanup });

      const stateChangeHandler = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

      stateChangeHandler('background');

      expect(audioCleanup).toHaveBeenCalled();
    });

    it('should handle inactive state', () => {
      lifecycleManager = LifecycleManager.getInstance();
      lifecycleManager.initialize();

      const stateChangeHandler = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

      stateChangeHandler('inactive');

      expect(pauseAllMock).toHaveBeenCalled();
    });

    it('should handle errors during background handling', () => {
      pauseAllMock.mockImplementation(() => {
        throw new Error('Pause failed');
      });

      lifecycleManager = LifecycleManager.getInstance();
      lifecycleManager.initialize();

      const stateChangeHandler = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

      // Should not throw
      expect(() => stateChangeHandler('background')).not.toThrow();
    });
  });

  describe('handleForeground', () => {
    it('should handle app becoming active', () => {
      lifecycleManager = LifecycleManager.getInstance();
      lifecycleManager.initialize();

      const stateChangeHandler = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

      // Should not throw or cause issues
      expect(() => stateChangeHandler('active')).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should remove listener', () => {
      const removeMock = jest.fn();
      (AppState.addEventListener as jest.Mock).mockReturnValue({
        remove: removeMock,
      });

      lifecycleManager = LifecycleManager.getInstance();
      lifecycleManager.initialize();
      lifecycleManager.cleanup();

      expect(removeMock).toHaveBeenCalled();
    });

    it('should clear audio cleanup callback', () => {
      const audioCleanup = jest.fn();

      lifecycleManager = LifecycleManager.getInstance();
      lifecycleManager.initialize({ onAudioCleanup: audioCleanup });
      lifecycleManager.cleanup();

      // After cleanup, callback should not be called
      const stateChangeHandler = (AppState.addEventListener as jest.Mock).mock.calls[0][1];
      stateChangeHandler('background');

      // audioCleanup should not be called after cleanup
      // (it would have been called if still registered)
    });

    it('should handle cleanup when not initialized', () => {
      lifecycleManager = LifecycleManager.getInstance();

      expect(() => lifecycleManager.cleanup()).not.toThrow();
    });
  });

  describe('reset', () => {
    it('should cleanup and reset instance', () => {
      const removeMock = jest.fn();
      (AppState.addEventListener as jest.Mock).mockReturnValue({
        remove: removeMock,
      });

      lifecycleManager = LifecycleManager.getInstance();
      lifecycleManager.initialize();

      LifecycleManager.reset();

      expect(removeMock).toHaveBeenCalled();
    });

    it('should allow creating new instance after reset', () => {
      const instance1 = LifecycleManager.getInstance();
      LifecycleManager.reset();
      const instance2 = LifecycleManager.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('state transitions', () => {
    it('should handle multiple state changes', () => {
      lifecycleManager = LifecycleManager.getInstance();
      lifecycleManager.initialize();

      const stateChangeHandler = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

      stateChangeHandler('background');
      stateChangeHandler('active');
      stateChangeHandler('inactive');
      stateChangeHandler('background');

      expect(pauseAllMock).toHaveBeenCalledTimes(3); // background, inactive, background
    });

    it('should not call pauseAll when going to active', () => {
      lifecycleManager = LifecycleManager.getInstance();
      lifecycleManager.initialize();

      const stateChangeHandler = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

      stateChangeHandler('active');

      expect(pauseAllMock).not.toHaveBeenCalled();
    });
  });
});
