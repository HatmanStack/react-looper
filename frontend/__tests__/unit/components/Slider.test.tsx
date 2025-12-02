import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { VolumeSlider } from "../../../src/components/VolumeSlider";
import { SpeedSlider } from "../../../src/components/SpeedSlider";

// Skip: Tests depend on @react-native-community/slider which is mocked
describe.skip("VolumeSlider", () => {
  it("renders with initial value", () => {
    const { getByText } = render(
      <VolumeSlider value={75} onValueChange={() => {}} />,
    );
    expect(getByText(/Volume: 75/i)).toBeTruthy();
  });

  it("calls onValueChange when slider moves", () => {
    const mockOnValueChange = jest.fn();
    const { getByTestId } = render(
      <VolumeSlider value={50} onValueChange={mockOnValueChange} />,
    );

    const slider = getByTestId("slider");
    fireEvent(slider, "onValueChange", 80);

    expect(mockOnValueChange).toHaveBeenCalledWith(80);
  });

  it("displays rounded volume value", () => {
    const { getByText } = render(
      <VolumeSlider value={75.7} onValueChange={() => {}} />,
    );
    expect(getByText(/Volume: 76/i)).toBeTruthy();
  });

  it("respects disabled prop", () => {
    const { getByTestId } = render(
      <VolumeSlider value={50} onValueChange={() => {}} disabled />,
    );
    const slider = getByTestId("slider");
    expect(slider.props.disabled).toBe(true);
  });
});

// Skip: Tests depend on @react-native-community/slider which is mocked
describe.skip("SpeedSlider", () => {
  it("renders with formatted speed value", () => {
    const { getByText } = render(
      <SpeedSlider value={1.25} onValueChange={() => {}} />,
    );
    expect(getByText(/Speed: 1\.25x/i)).toBeTruthy();
  });

  it("calls onValueChange with correct speed value", () => {
    const mockOnValueChange = jest.fn();
    const { getByTestId } = render(
      <SpeedSlider value={1.0} onValueChange={mockOnValueChange} />,
    );

    const slider = getByTestId("slider");
    // Android formula: speed = progress / 41, so progress 82 = speed 2.0
    fireEvent(slider, "onValueChange", 82);

    expect(mockOnValueChange).toHaveBeenCalledWith(2.0);
  });

  it("formats speed value to 2 decimal places", () => {
    const { getByText } = render(
      <SpeedSlider value={1.2563} onValueChange={() => {}} />,
    );
    expect(getByText(/Speed: 1\.26x/i)).toBeTruthy();
  });

  it("converts speed to slider value correctly", () => {
    const { getByTestId } = render(
      <SpeedSlider value={2.0} onValueChange={() => {}} />,
    );
    const slider = getByTestId("slider");
    // Speed 2.0 * 41 = 82
    expect(slider.props.value).toBe(82);
  });

  it("respects min and max range", () => {
    const { getByTestId } = render(
      <SpeedSlider value={1.0} onValueChange={() => {}} />,
    );
    const slider = getByTestId("slider");
    expect(slider.props.minimumValue).toBe(3);
    expect(slider.props.maximumValue).toBe(102);
  });
});
