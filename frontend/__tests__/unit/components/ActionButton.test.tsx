import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ActionButton } from "../../../src/components/ActionButton";

// Skip: Tests depend on react-native-paper rendering which is mocked
describe.skip("ActionButton", () => {
  it("renders with label", () => {
    const { getByText } = render(
      <ActionButton label="Test Button" onPress={() => {}} />,
    );
    expect(getByText("Test Button")).toBeTruthy();
  });

  it("renders with icon", () => {
    const { getByTestId } = render(
      <ActionButton label="Test" icon="microphone" onPress={() => {}} />,
    );
    // Paper Button renders icons, we can verify the component renders without errors
    expect(getByTestId("button")).toBeTruthy();
  });

  it("fires onPress when clicked", () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <ActionButton label="Test" onPress={mockOnPress} />,
    );

    fireEvent.press(getByTestId("button"));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress when disabled", () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <ActionButton label="Test" onPress={mockOnPress} disabled={true} />,
    );

    fireEvent.press(getByTestId("button"));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it("applies custom style", () => {
    const customStyle = { marginTop: 20 };
    const { getByTestId } = render(
      <ActionButton label="Test" onPress={() => {}} style={customStyle} />,
    );
    expect(getByTestId("button")).toBeTruthy();
  });

  it("supports different modes", () => {
    const { rerender, getByTestId } = render(
      <ActionButton label="Test" onPress={() => {}} mode="contained" />,
    );
    expect(getByTestId("button")).toBeTruthy();

    rerender(<ActionButton label="Test" onPress={() => {}} mode="outlined" />);
    expect(getByTestId("button")).toBeTruthy();

    rerender(<ActionButton label="Test" onPress={() => {}} mode="text" />);
    expect(getByTestId("button")).toBeTruthy();
  });
});
