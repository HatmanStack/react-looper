import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { SaveModal } from "../../../src/components/SaveModal";

const renderWithProvider = (component: React.ReactElement) => {
  return render(<PaperProvider>{component}</PaperProvider>);
};

describe("SaveModal", () => {
  it("renders when visible is true", () => {
    const { getByText } = renderWithProvider(
      <SaveModal visible={true} onDismiss={() => {}} onSave={() => {}} />,
    );
    expect(getByText("Cancel")).toBeTruthy();
    expect(getByText("Save")).toBeTruthy();
  });

  it("displays track number when provided", () => {
    const { getByText } = renderWithProvider(
      <SaveModal
        visible={true}
        trackNumber={3}
        onDismiss={() => {}}
        onSave={() => {}}
      />,
    );
    expect(getByText("Track 3")).toBeTruthy();
  });

  it("calls onDismiss when Cancel button is pressed", () => {
    const mockOnDismiss = jest.fn();
    const { getByText } = renderWithProvider(
      <SaveModal visible={true} onDismiss={mockOnDismiss} onSave={() => {}} />,
    );

    fireEvent.press(getByText("Cancel"));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it("calls onSave with filename when Save button is pressed", () => {
    const mockOnSave = jest.fn();
    const { getByText, getByTestId } = renderWithProvider(
      <SaveModal visible={true} onDismiss={() => {}} onSave={mockOnSave} />,
    );

    const input = getByTestId("text-input-outlined");
    fireEvent.changeText(input, "my-track");

    fireEvent.press(getByText("Save"));
    expect(mockOnSave).toHaveBeenCalledWith("my-track");
  });

  it("sanitizes filename before calling onSave", () => {
    const mockOnSave = jest.fn();
    const { getByText, getByTestId } = renderWithProvider(
      <SaveModal visible={true} onDismiss={() => {}} onSave={mockOnSave} />,
    );

    const input = getByTestId("text-input-outlined");
    fireEvent.changeText(input, "my<>track:name");

    fireEvent.press(getByText("Save"));
    // Invalid characters should be removed
    expect(mockOnSave).toHaveBeenCalledWith("mytrackname");
  });

  it("validates filename before saving", () => {
    const mockOnSave = jest.fn();
    const { getByText, getByTestId } = renderWithProvider(
      <SaveModal visible={true} onDismiss={() => {}} onSave={mockOnSave} />,
    );

    const input = getByTestId("text-input-outlined");
    // Try to save without entering a filename
    fireEvent.press(getByText("Save"));

    // onSave should not be called with empty filename
    expect(mockOnSave).not.toHaveBeenCalled();

    // Now enter a valid filename
    fireEvent.changeText(input, "valid-track");
    fireEvent.press(getByText("Save"));

    // Now onSave should be called
    expect(mockOnSave).toHaveBeenCalledWith("valid-track");
  });
});
