/**
 * App Lifecycle Hook Tests
 */

import { renderHook } from "@testing-library/react-native";
import { AppState } from "react-native";
import {
  useAppLifecycle,
  useBackgroundHandler,
} from "../../../src/hooks/useAppLifecycle";

// Mock AppState
jest.mock("react-native", () => ({
  AppState: {
    currentState: "background", // Start in background so state changes trigger callbacks
    addEventListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
  },
  Platform: {
    OS: "ios",
  },
}));

describe("useAppLifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register AppState listener", () => {
    renderHook(() => useAppLifecycle());

    expect(AppState.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("should call onActive when app becomes active", () => {
    const onActive = jest.fn();
    const onBackground = jest.fn();

    renderHook(() => useAppLifecycle({ onActive, onBackground }));

    // Get the registered callback
    const callback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

    // Simulate state change to active
    callback("active");

    expect(onActive).toHaveBeenCalledTimes(1);
    expect(onBackground).not.toHaveBeenCalled();
  });

  it("should call onBackground when app goes to background", () => {
    const onActive = jest.fn();
    const onBackground = jest.fn();

    renderHook(() => useAppLifecycle({ onActive, onBackground }));

    const callback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

    // Simulate state change to background
    callback("background");

    expect(onBackground).toHaveBeenCalledTimes(1);
    expect(onActive).not.toHaveBeenCalled();
  });

  it("should call onInactive when app becomes inactive", () => {
    const onInactive = jest.fn();

    renderHook(() => useAppLifecycle({ onInactive }));

    const callback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

    // Simulate state change to inactive
    callback("inactive");

    expect(onInactive).toHaveBeenCalledTimes(1);
  });

  it("should call onChange with current and previous state", () => {
    const onChange = jest.fn();

    renderHook(() => useAppLifecycle({ onChange }));

    const callback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

    // Simulate state changes (initial state is 'background')
    callback("active");
    expect(onChange).toHaveBeenCalledWith("active", "background");

    callback("background");
    expect(onChange).toHaveBeenCalledWith("background", "active");
  });

  it("should not call callbacks if state does not change", () => {
    const onBackground = jest.fn();

    renderHook(() => useAppLifecycle({ onBackground }));

    const callback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

    // Set to background (same as initial state)
    callback("background");

    // Should not be called since state didn't actually change
    expect(onBackground).not.toHaveBeenCalled();
  });

  it("should cleanup listener on unmount", () => {
    const remove = jest.fn();
    (AppState.addEventListener as jest.Mock).mockReturnValue({ remove });

    const { unmount } = renderHook(() => useAppLifecycle());

    unmount();

    expect(remove).toHaveBeenCalled();
  });

  it("should handle multiple state transitions", () => {
    const onChange = jest.fn();

    renderHook(() => useAppLifecycle({ onChange }));

    const callback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

    callback("inactive");
    callback("background");
    callback("active");
    callback("background");

    expect(onChange).toHaveBeenCalledTimes(4);
    expect(onChange).toHaveBeenNthCalledWith(1, "inactive", "background");
    expect(onChange).toHaveBeenNthCalledWith(2, "background", "inactive");
    expect(onChange).toHaveBeenNthCalledWith(3, "active", "background");
    expect(onChange).toHaveBeenNthCalledWith(4, "background", "active");
  });
});

describe("useBackgroundHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call onBackground when app goes to background", () => {
    const onBackground = jest.fn();
    const onForeground = jest.fn();

    renderHook(() => useBackgroundHandler(onBackground, onForeground));

    const callback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

    callback("background");

    expect(onBackground).toHaveBeenCalledTimes(1);
    expect(onForeground).not.toHaveBeenCalled();
  });

  it("should call onForeground when app becomes active", () => {
    const onBackground = jest.fn();
    const onForeground = jest.fn();

    renderHook(() => useBackgroundHandler(onBackground, onForeground));

    const callback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

    callback("active");

    expect(onForeground).toHaveBeenCalledTimes(1);
    expect(onBackground).not.toHaveBeenCalled();
  });

  it("should work without onForeground callback", () => {
    const onBackground = jest.fn();

    renderHook(() => useBackgroundHandler(onBackground));

    const callback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];

    expect(() => {
      callback("background");
      callback("active");
    }).not.toThrow();

    expect(onBackground).toHaveBeenCalledTimes(1);
  });
});

describe("useAppLifecycle - Web Platform", () => {
  // Save original values
  const originalPlatform = require("react-native").Platform;
  const originalDocument = global.document;
  const originalWindow = global.window;
  const originalAppState = require("react-native").AppState.currentState;

  beforeAll(() => {
    // Mock web platform
    require("react-native").Platform = {
      ...originalPlatform,
      OS: "web",
    };

    // Mock document and window for web
    (global as any).document = {
      hidden: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    (global as any).window = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
  });

  afterAll(() => {
    // Restore original values
    require("react-native").Platform = originalPlatform;
    (global as any).document = originalDocument;
    (global as any).window = originalWindow;
    require("react-native").AppState.currentState = originalAppState;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to a known state
    (document as any).hidden = false;
    require("react-native").AppState.currentState = "background";
  });

  it("should register visibilitychange listener on web", () => {
    renderHook(() => useAppLifecycle());

    expect(document.addEventListener).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function),
    );
  });

  it("should register beforeunload listener on web", () => {
    renderHook(() => useAppLifecycle());

    expect(window.addEventListener).toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function),
    );
  });

  it("should call onBackground when document becomes hidden", () => {
    const onBackground = jest.fn();
    const onActive = jest.fn();

    // Start with visible document (active state)
    (document as any).hidden = false;
    // Also need to set AppState to active to match
    require("react-native").AppState.currentState = "active";

    renderHook(() => useAppLifecycle({ onBackground, onActive }));

    // Get the visibilitychange callback
    const visibilityCallback = (
      document.addEventListener as jest.Mock
    ).mock.calls.find(([event]) => event === "visibilitychange")?.[1];

    // Simulate document becoming hidden
    (document as any).hidden = true;
    visibilityCallback();

    expect(onBackground).toHaveBeenCalledTimes(1);
    expect(onActive).not.toHaveBeenCalled();
  });

  it("should call onActive when document becomes visible", () => {
    const onBackground = jest.fn();
    const onActive = jest.fn();

    // Start with hidden document and background state
    (document as any).hidden = true;
    require("react-native").AppState.currentState = "background";

    renderHook(() => useAppLifecycle({ onBackground, onActive }));

    // Get the visibilitychange callback
    const visibilityCallback = (
      document.addEventListener as jest.Mock
    ).mock.calls.find(([event]) => event === "visibilitychange")?.[1];

    // Simulate document becoming visible
    (document as any).hidden = false;
    visibilityCallback();

    expect(onActive).toHaveBeenCalledTimes(1);
    expect(onBackground).not.toHaveBeenCalled();
  });

  it("should call onBackground on beforeunload", () => {
    const onBackground = jest.fn();

    // Start in active state
    require("react-native").AppState.currentState = "active";

    renderHook(() => useAppLifecycle({ onBackground }));

    // Get the beforeunload callback
    const beforeunloadCallback = (
      window.addEventListener as jest.Mock
    ).mock.calls.find(([event]) => event === "beforeunload")?.[1];

    // Simulate beforeunload event
    beforeunloadCallback();

    // beforeunload calls onBackground directly, doesn't go through handleStateChange
    expect(onBackground).toHaveBeenCalledTimes(1);
  });

  it("should cleanup web listeners on unmount", () => {
    const { unmount } = renderHook(() => useAppLifecycle());

    unmount();

    expect(document.removeEventListener).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function),
    );
    expect(window.removeEventListener).toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function),
    );
  });

  it("should handle multiple visibility changes", () => {
    const onChange = jest.fn();

    // Start with visible document and active state
    (document as any).hidden = false;
    require("react-native").AppState.currentState = "active";

    renderHook(() => useAppLifecycle({ onChange }));

    const visibilityCallback = (
      document.addEventListener as jest.Mock
    ).mock.calls.find(([event]) => event === "visibilitychange")?.[1];

    // Active -> Background (hidden)
    (document as any).hidden = true;
    visibilityCallback();

    // Background -> Active (visible)
    (document as any).hidden = false;
    visibilityCallback();

    // Active -> Background (hidden)
    (document as any).hidden = true;
    visibilityCallback();

    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenNthCalledWith(1, "background", "active");
    expect(onChange).toHaveBeenNthCalledWith(2, "active", "background");
    expect(onChange).toHaveBeenNthCalledWith(3, "background", "active");
  });
});
