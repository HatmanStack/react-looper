/**
 * App Lifecycle Hook Tests
 */

import { renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useAppLifecycle, useBackgroundHandler } from '../../../src/hooks/useAppLifecycle';

// Mock AppState
jest.mock('react-native', () => ({
  AppState: {
    currentState: 'background', // Start in background so state changes trigger callbacks
    addEventListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
  },
  Platform: {
    OS: 'ios',
  },
}));

describe('useAppLifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register AppState listener', () => {
    renderHook(() => useAppLifecycle());

    expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('should call onActive when app becomes active', () => {
    const onActive = jest.fn();
    const onBackground = jest.fn();

    renderHook(() => useAppLifecycle({ onActive, onBackground }));

    // Get the registered callback
    const callback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

    // Simulate state change to active
    callback('active');

    expect(onActive).toHaveBeenCalledTimes(1);
    expect(onBackground).not.toHaveBeenCalled();
  });

  it('should call onBackground when app goes to background', () => {
    const onActive = jest.fn();
    const onBackground = jest.fn();

    renderHook(() => useAppLifecycle({ onActive, onBackground }));

    const callback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

    // Simulate state change to background
    callback('background');

    expect(onBackground).toHaveBeenCalledTimes(1);
    expect(onActive).not.toHaveBeenCalled();
  });

  it('should call onInactive when app becomes inactive', () => {
    const onInactive = jest.fn();

    renderHook(() => useAppLifecycle({ onInactive }));

    const callback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

    // Simulate state change to inactive
    callback('inactive');

    expect(onInactive).toHaveBeenCalledTimes(1);
  });

  it('should call onChange with current and previous state', () => {
    const onChange = jest.fn();

    renderHook(() => useAppLifecycle({ onChange }));

    const callback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

    // Simulate state changes (initial state is 'background')
    callback('active');
    expect(onChange).toHaveBeenCalledWith('active', 'background');

    callback('background');
    expect(onChange).toHaveBeenCalledWith('background', 'active');
  });

  it('should not call callbacks if state does not change', () => {
    const onBackground = jest.fn();

    renderHook(() => useAppLifecycle({ onBackground }));

    const callback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

    // Set to background (same as initial state)
    callback('background');

    // Should not be called since state didn't actually change
    expect(onBackground).not.toHaveBeenCalled();
  });

  it('should cleanup listener on unmount', () => {
    const remove = jest.fn();
    (AppState.addEventListener as jest.Mock).mockReturnValue({ remove });

    const { unmount } = renderHook(() => useAppLifecycle());

    unmount();

    expect(remove).toHaveBeenCalled();
  });

  it('should handle multiple state transitions', () => {
    const onChange = jest.fn();

    renderHook(() => useAppLifecycle({ onChange }));

    const callback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

    callback('inactive');
    callback('background');
    callback('active');
    callback('background');

    expect(onChange).toHaveBeenCalledTimes(4);
    expect(onChange).toHaveBeenNthCalledWith(1, 'inactive', 'background');
    expect(onChange).toHaveBeenNthCalledWith(2, 'background', 'inactive');
    expect(onChange).toHaveBeenNthCalledWith(3, 'active', 'background');
    expect(onChange).toHaveBeenNthCalledWith(4, 'background', 'active');
  });
});

describe('useBackgroundHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call onBackground when app goes to background', () => {
    const onBackground = jest.fn();
    const onForeground = jest.fn();

    renderHook(() => useBackgroundHandler(onBackground, onForeground));

    const callback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

    callback('background');

    expect(onBackground).toHaveBeenCalledTimes(1);
    expect(onForeground).not.toHaveBeenCalled();
  });

  it('should call onForeground when app becomes active', () => {
    const onBackground = jest.fn();
    const onForeground = jest.fn();

    renderHook(() => useBackgroundHandler(onBackground, onForeground));

    const callback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

    callback('active');

    expect(onForeground).toHaveBeenCalledTimes(1);
    expect(onBackground).not.toHaveBeenCalled();
  });

  it('should work without onForeground callback', () => {
    const onBackground = jest.fn();

    renderHook(() => useBackgroundHandler(onBackground));

    const callback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

    expect(() => {
      callback('background');
      callback('active');
    }).not.toThrow();

    expect(onBackground).toHaveBeenCalledTimes(1);
  });
});
