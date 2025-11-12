/**
 * Settings Screen - Help Section Tests
 *
 * Tests for the help and info section in settings
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider } from "react-native-paper";
import { SettingsScreen } from "../SettingsScreen";
import { useSettingsStore } from "../../../store/useSettingsStore";

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
} as any;

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

describe("Settings Screen - Help Section", () => {
  beforeEach(() => {
    useSettingsStore.getState().resetToDefaults();
    jest.clearAllMocks();
  });

  it("displays app version", () => {
    const { getByText } = renderWithProviders(
      <SettingsScreen navigation={mockNavigation} />,
    );

    expect(getByText("Version")).toBeTruthy();
    expect(getByText("1.0.0")).toBeTruthy(); // Version from package.json
  });

  it("displays help and info section", () => {
    const { getByText } = renderWithProviders(
      <SettingsScreen navigation={mockNavigation} />,
    );

    expect(getByText("Help & Info")).toBeTruthy();
  });

  it("has expandable help for master loop", () => {
    const { getByText } = renderWithProviders(
      <SettingsScreen navigation={mockNavigation} />,
    );

    expect(getByText("How Master Loop Works")).toBeTruthy();
  });

  it("expands master loop help when tapped", () => {
    const { getByText } = renderWithProviders(
      <SettingsScreen navigation={mockNavigation} />,
    );

    const accordion = getByText("How Master Loop Works");
    fireEvent.press(accordion);

    // Check if help text is visible
    expect(
      getByText(/first track you record or import becomes the master loop/i),
    ).toBeTruthy();
  });

  it("has expandable help for loop mode", () => {
    const { getByText } = renderWithProviders(
      <SettingsScreen navigation={mockNavigation} />,
    );

    expect(getByText("What is Loop Mode?")).toBeTruthy();
  });

  it("expands loop mode help when tapped", () => {
    const { getByText } = renderWithProviders(
      <SettingsScreen navigation={mockNavigation} />,
    );

    const accordion = getByText("What is Loop Mode?");
    fireEvent.press(accordion);

    // Check if help text is visible
    expect(
      getByText(/Loop Mode controls how tracks play during preview/i),
    ).toBeTruthy();
  });

  it("has GitHub link", () => {
    const { getByText } = renderWithProviders(
      <SettingsScreen navigation={mockNavigation} />,
    );

    expect(getByText("View on GitHub")).toBeTruthy();
  });
});
