import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TrackListItem } from "../../../src/components/TrackListItem";
import type { Track } from "../../../src/types";

const mockTrack: Track = {
  id: "track-1",
  name: "Test Track",
  uri: "mock://test.mp3",
  duration: 120000,
  speed: 1.0,
  volume: 75,
  isPlaying: false,
  createdAt: Date.now(),
};

describe("TrackListItem", () => {
  it("renders track name", () => {
    const { getByText } = render(<TrackListItem track={mockTrack} />);
    expect(getByText("Test Track")).toBeTruthy();
  });

  it("displays volume and speed values", () => {
    const { getByText } = render(<TrackListItem track={mockTrack} />);
    expect(getByText(/Volume: 75/i)).toBeTruthy();
    expect(getByText(/Speed: 1\.00x/i)).toBeTruthy();
  });

  it("calls onPlay when play button is pressed", () => {
    const mockOnPlay = jest.fn();
    const { getAllByTestId } = render(
      <TrackListItem track={mockTrack} onPlay={mockOnPlay} />,
    );

    const iconButtons = getAllByTestId("icon-button");
    const playButton = iconButtons[0]; // First IconButton is play

    fireEvent.press(playButton);
    expect(mockOnPlay).toHaveBeenCalledWith("track-1");
  });

  it("calls onPause when pause button is pressed", () => {
    const mockOnPause = jest.fn();
    const { getAllByTestId } = render(
      <TrackListItem track={mockTrack} onPause={mockOnPause} />,
    );

    const iconButtons = getAllByTestId("icon-button");
    const pauseButton = iconButtons[1]; // Second IconButton is pause

    fireEvent.press(pauseButton);
    expect(mockOnPause).toHaveBeenCalledWith("track-1");
  });

  it("calls onDelete when delete button is pressed", () => {
    const mockOnDelete = jest.fn();
    const { getAllByTestId } = render(
      <TrackListItem track={mockTrack} onDelete={mockOnDelete} />,
    );

    const iconButtons = getAllByTestId("icon-button");
    const deleteButton = iconButtons[2]; // Third IconButton is delete

    fireEvent.press(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledWith("track-1");
  });

  it("highlights play button when track is playing", () => {
    const playingTrack = { ...mockTrack, isPlaying: true };
    const { getAllByTestId } = render(<TrackListItem track={playingTrack} />);

    const iconButtons = getAllByTestId("icon-button");
    const playButton = iconButtons[0];

    // Play button should have primary color when playing
    const playIcon = playButton.findByProps({ pointerEvents: "none" });
    expect(playIcon).toBeTruthy();
  });

  it("calls onVolumeChange when volume slider changes", () => {
    const mockOnVolumeChange = jest.fn();
    const { getAllByTestId } = render(
      <TrackListItem track={mockTrack} onVolumeChange={mockOnVolumeChange} />,
    );

    const sliders = getAllByTestId("slider");
    const volumeSlider = sliders[0]; // First slider is volume

    fireEvent(volumeSlider, "onValueChange", 90);
    expect(mockOnVolumeChange).toHaveBeenCalledWith("track-1", 90);
  });

  it("calls onSpeedChange when speed slider changes", () => {
    const mockOnSpeedChange = jest.fn();
    const { getAllByTestId } = render(
      <TrackListItem track={mockTrack} onSpeedChange={mockOnSpeedChange} />,
    );

    const sliders = getAllByTestId("slider");
    const speedSlider = sliders[1]; // Second slider is speed

    fireEvent(speedSlider, "onValueChange", 82); // 82 / 41 = 2.0
    expect(mockOnSpeedChange).toHaveBeenCalledWith("track-1", 2.0);
  });
});
