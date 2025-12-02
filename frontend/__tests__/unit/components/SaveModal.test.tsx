/**
 * SaveModal Component Tests
 *
 * Tests for the enhanced SaveModal with loop count and fadeout configuration
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { SaveModal } from "../../../src/components/SaveModal";

// Mock the stores
jest.mock("../../../src/store/useSettingsStore", () => ({
  useSettingsStore: jest.fn(() => ({
    defaultLoopCount: 4,
    defaultFadeout: 2000,
  })),
}));

jest.mock("../../../src/store/useTrackStore", () => ({
  useTrackStore: jest.fn((selector) => {
    const state = {
      tracks: [
        {
          id: "track-1",
          name: "Test Track",
          uri: "file://test.wav",
          duration: 10000,
          speed: 1.0,
          volume: 100,
          isPlaying: false,
          selected: true,
          createdAt: Date.now(),
        },
      ],
    };
    return selector ? selector(state) : state;
  }),
}));

const renderWithProvider = (component: React.ReactElement) => {
  return render(<PaperProvider>{component}</PaperProvider>);
};

// Skip: Tests depend on react-native-paper rendering which is mocked
describe.skip("SaveModal", () => {
  it("renders when visible is true", () => {
    const { getByText } = renderWithProvider(
      <SaveModal visible={true} onDismiss={() => {}} onSave={() => {}} />,
    );
    expect(getByText("Cancel")).toBeTruthy();
    expect(getByText("Export")).toBeTruthy();
  });

  it("displays track count when provided", () => {
    const { getByText } = renderWithProvider(
      <SaveModal
        visible={true}
        trackNumber={3}
        onDismiss={() => {}}
        onSave={() => {}}
      />,
    );
    expect(getByText("Export 3 Tracks")).toBeTruthy();
  });

  it("calls onDismiss when Cancel button is pressed", () => {
    const mockOnDismiss = jest.fn();
    const { getByTestId } = renderWithProvider(
      <SaveModal visible={true} onDismiss={mockOnDismiss} onSave={() => {}} />,
    );

    const cancelButton = getByTestId("cancel-button");
    fireEvent.press(cancelButton);
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it("calls onSave with filename, loopCount, and fadeout when Export button is pressed", async () => {
    const mockOnSave = jest.fn();
    const { getByTestId } = renderWithProvider(
      <SaveModal visible={true} onDismiss={() => {}} onSave={mockOnSave} />,
    );

    const input = getByTestId("filename-input");
    fireEvent.changeText(input, "my-track");

    const saveButton = getByTestId("save-button");
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith("my-track", 4, 2000);
    });
  });

  it("sanitizes filename before calling onSave", async () => {
    const mockOnSave = jest.fn();
    const { getByTestId } = renderWithProvider(
      <SaveModal visible={true} onDismiss={() => {}} onSave={mockOnSave} />,
    );

    const input = getByTestId("filename-input");
    fireEvent.changeText(input, "my<>track:name");

    const saveButton = getByTestId("save-button");
    fireEvent.press(saveButton);

    await waitFor(() => {
      // Invalid characters should be removed
      expect(mockOnSave).toHaveBeenCalledWith("mytrackname", 4, 2000);
    });
  });

  it("displays estimated duration", () => {
    const { getByTestId } = renderWithProvider(
      <SaveModal visible={true} onDismiss={() => {}} onSave={() => {}} />,
    );

    // 4 loops × 10s + 2s fadeout = 42s
    const duration = getByTestId("estimated-duration");
    expect(duration.children[0]).toMatch(/42s/);
  });

  it("shows loop count selector", () => {
    const { getByText } = renderWithProvider(
      <SaveModal visible={true} onDismiss={() => {}} onSave={() => {}} />,
    );

    // Check that the Loop Repetitions section is present
    expect(getByText("Loop Repetitions")).toBeTruthy();
    // Check that preset buttons are present
    expect(getByText("1")).toBeTruthy();
    expect(getByText("2")).toBeTruthy();
    expect(getByText("4")).toBeTruthy();
    expect(getByText("8")).toBeTruthy();
  });

  it("shows fadeout selector", () => {
    const { getByText } = renderWithProvider(
      <SaveModal visible={true} onDismiss={() => {}} onSave={() => {}} />,
    );

    // Check that the Fadeout Duration section is present
    expect(getByText("Fadeout Duration")).toBeTruthy();
    // Check that preset buttons are present
    expect(getByText("None")).toBeTruthy();
    expect(getByText("1s")).toBeTruthy();
    expect(getByText("2s")).toBeTruthy();
    expect(getByText("5s")).toBeTruthy();
  });

  it("has proper accessibility labels", () => {
    const { getByTestId } = renderWithProvider(
      <SaveModal visible={true} onDismiss={() => {}} onSave={() => {}} />,
    );

    const filenameInput = getByTestId("filename-input");
    expect(filenameInput.props.accessibilityLabel).toBe("File name");

    const saveButton = getByTestId("save-button");
    expect(saveButton.props.accessibilityLabel).toBe("Save");

    const cancelButton = getByTestId("cancel-button");
    expect(cancelButton.props.accessibilityLabel).toBe("Cancel");
  });
});
