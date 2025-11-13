/**
 * SettingsScreen Component Tests
 *
 * Tests for the settings screen UI and interactions
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider } from "react-native-paper";
import { SettingsScreen } from "../SettingsScreen";
import { useSettingsStore } from "../../../store/useSettingsStore";

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  setOptions: jest.fn(),
} as any;

// Helper to render with required providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <PaperProvider>
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 0, height: 0 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        {component}
      </SafeAreaProvider>
    </PaperProvider>,
  );
};

describe("SettingsScreen", () => {
  beforeEach(() => {
    // Reset settings store to defaults before each test
    useSettingsStore.getState().resetToDefaults();
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders all settings sections", () => {
      const { getByText } = renderWithProviders(
        <SettingsScreen navigation={mockNavigation} />,
      );

      expect(getByText("Looping Behavior")).toBeTruthy();
      expect(getByText("Export Settings")).toBeTruthy();
      expect(getByText("Recording Settings")).toBeTruthy();
    });

    it("displays current setting values", () => {
      // Set specific values
      useSettingsStore.setState({
        loopCrossfadeDuration: 25,
        defaultLoopMode: true,
        defaultLoopCount: 8,
        defaultFadeout: 5000,
      });

      const { getByTestId } = renderWithProviders(
        <SettingsScreen navigation={mockNavigation} />,
      );

      const crossfadeSlider = getByTestId("crossfade-slider");
      expect(crossfadeSlider.props.value).toBe(25);

      const loopModeSwitch = getByTestId("loop-mode-switch");
      expect(loopModeSwitch.props.value).toBe(true);
    });
  });

  describe("Interactions", () => {
    it("updates store when crossfade duration changed", () => {
      const { getByTestId } = renderWithProviders(
        <SettingsScreen navigation={mockNavigation} />,
      );

      const slider = getByTestId("crossfade-slider");
      fireEvent(slider, "valueChange", 30);

      expect(useSettingsStore.getState().loopCrossfadeDuration).toBe(30);
    });

    it("updates store when loop mode switch toggled", () => {
      const { getByTestId } = renderWithProviders(
        <SettingsScreen navigation={mockNavigation} />,
      );

      const loopSwitch = getByTestId("loop-mode-switch");

      // Initial state is true (default)
      expect(useSettingsStore.getState().defaultLoopMode).toBe(true);

      // Toggle to false
      fireEvent(loopSwitch, "valueChange", false);
      expect(useSettingsStore.getState().defaultLoopMode).toBe(false);

      // Toggle back to true
      fireEvent(loopSwitch, "valueChange", true);
      expect(useSettingsStore.getState().defaultLoopMode).toBe(true);
    });

    it("updates store when loop count changed", () => {
      const { getByTestId } = renderWithProviders(
        <SettingsScreen navigation={mockNavigation} />,
      );

      const button = getByTestId("loop-count-8");
      fireEvent.press(button);

      expect(useSettingsStore.getState().defaultLoopCount).toBe(8);
    });

    it("updates store when fadeout duration changed", () => {
      const { getByTestId } = renderWithProviders(
        <SettingsScreen navigation={mockNavigation} />,
      );

      const button = getByTestId("fadeout-5000");
      fireEvent.press(button);

      expect(useSettingsStore.getState().defaultFadeout).toBe(5000);
    });
  });

  describe("Reset to Defaults", () => {
    it("shows confirmation dialog before resetting", () => {
      const { getByText, queryByText } = renderWithProviders(
        <SettingsScreen navigation={mockNavigation} />,
      );

      // Change some settings
      useSettingsStore.setState({ loopCrossfadeDuration: 30 });

      // Press reset button
      fireEvent.press(getByText("Reset to Defaults"));

      // Verify confirmation dialog appears
      expect(queryByText(/reset all settings to default values/i)).toBeTruthy();
    });

    it("does not reset when cancelled", () => {
      const { getByText } = renderWithProviders(
        <SettingsScreen navigation={mockNavigation} />,
      );

      // Change settings
      useSettingsStore.setState({
        loopCrossfadeDuration: 30,
        defaultLoopCount: 8,
      });

      // Open reset dialog
      fireEvent.press(getByText("Reset to Defaults"));

      // Cancel
      fireEvent.press(getByText("Cancel"));

      // Verify settings unchanged
      const state = useSettingsStore.getState();
      expect(state.loopCrossfadeDuration).toBe(30);
      expect(state.defaultLoopCount).toBe(8);
    });

    it("resets all settings when confirmed", () => {
      const { getByText } = renderWithProviders(
        <SettingsScreen navigation={mockNavigation} />,
      );

      // Change multiple settings
      useSettingsStore.setState({
        loopCrossfadeDuration: 30,
        defaultLoopCount: 8,
        defaultFadeout: 5000,
        defaultLoopMode: false,
      });

      // Reset
      fireEvent.press(getByText("Reset to Defaults"));
      fireEvent.press(getByText("Confirm"));

      // Verify defaults restored
      const state = useSettingsStore.getState();
      expect(state.loopCrossfadeDuration).toBe(0);
      expect(state.defaultLoopCount).toBe(4);
      expect(state.defaultFadeout).toBe(2000);
      expect(state.defaultLoopMode).toBe(true);
    });
  });

  describe("Accessibility", () => {
    it("has proper accessibility labels", () => {
      const { getByLabelText } = renderWithProviders(
        <SettingsScreen navigation={mockNavigation} />,
      );

      expect(getByLabelText(/crossfade/i)).toBeTruthy();
      expect(getByLabelText(/loop mode/i)).toBeTruthy();
    });
  });
});
