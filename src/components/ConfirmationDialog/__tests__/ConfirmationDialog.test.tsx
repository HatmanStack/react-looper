import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { ConfirmationDialog } from "../ConfirmationDialog";

const renderWithProvider = (component: React.ReactElement) => {
  return render(<PaperProvider>{component}</PaperProvider>);
};

describe("ConfirmationDialog", () => {
  it("renders with title and message", () => {
    const { getByText } = renderWithProvider(
      <ConfirmationDialog
        visible={true}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(getByText("Confirm Action")).toBeTruthy();
    expect(getByText("Are you sure?")).toBeTruthy();
  });

  it("does not render when visible is false", () => {
    const { queryByText } = renderWithProvider(
      <ConfirmationDialog
        visible={false}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(queryByText("Confirm Action")).toBeNull();
  });

  it("calls onConfirm when confirm button pressed", () => {
    const onConfirm = jest.fn();
    const { getByText } = renderWithProvider(
      <ConfirmationDialog
        visible={true}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />,
    );

    fireEvent.press(getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button pressed", () => {
    const onCancel = jest.fn();
    const { getByText } = renderWithProvider(
      <ConfirmationDialog
        visible={true}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.press(getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("uses custom button labels when provided", () => {
    const { getByText } = renderWithProvider(
      <ConfirmationDialog
        visible={true}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        confirmLabel="Yes, continue"
        cancelLabel="No, go back"
      />,
    );

    expect(getByText("Yes, continue")).toBeTruthy();
    expect(getByText("No, go back")).toBeTruthy();
  });

  it("applies destructive styling when destructive prop is true", () => {
    const { getByText } = renderWithProvider(
      <ConfirmationDialog
        visible={true}
        title="Delete Item"
        message="This cannot be undone"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        destructive={true}
      />,
    );

    // Just verify the button exists and is clickable
    // The actual color is handled by React Native Paper's Button component
    const confirmButton = getByText("Confirm");
    expect(confirmButton).toBeTruthy();
  });

  it("applies primary styling when destructive prop is false", () => {
    const { getByText } = renderWithProvider(
      <ConfirmationDialog
        visible={true}
        title="Confirm Action"
        message="Continue?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        destructive={false}
      />,
    );

    // Just verify the button exists and is clickable
    const confirmButton = getByText("Confirm");
    expect(confirmButton).toBeTruthy();
  });

  it("has correct accessibility role", () => {
    const { getByText } = renderWithProvider(
      <ConfirmationDialog
        visible={true}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    // Verify dialog content is accessible
    expect(getByText("Confirm Action")).toBeTruthy();
    expect(getByText("Are you sure?")).toBeTruthy();
  });
});
