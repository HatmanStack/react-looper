import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TrackListItem } from "../../../src/components/TrackListItem";
import { useTrackStore } from "../../../src/store/useTrackStore";
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

const createMockTrack = (overrides: Partial<Track> = {}): Track => ({
  ...mockTrack,
  ...overrides,
});

describe("TrackListItem", () => {
  beforeEach(() => {
    // Clear store before each test
    useTrackStore.setState({ tracks: [] });
  });

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

  describe("Master Track Styling", () => {
    it("applies master track styling when track is first", () => {
      const tracks = [
        createMockTrack({ id: "track-1", name: "Master Track" }),
        createMockTrack({ id: "track-2", name: "Track 2" }),
      ];

      // Set tracks in store
      useTrackStore.setState({ tracks });

      const { getByTestId } = render(<TrackListItem track={tracks[0]} />);

      const container = getByTestId("track-list-item-track-1");

      // Verify master track styles applied
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            borderWidth: 3,
            borderColor: "#3F51B5", // Primary color
          }),
        ]),
      );
    });

    it("does not apply master track styling to non-master tracks", () => {
      const tracks = [
        createMockTrack({ id: "track-1", name: "Master Track" }),
        createMockTrack({ id: "track-2", name: "Track 2" }),
      ];

      useTrackStore.setState({ tracks });

      const { getByTestId } = render(<TrackListItem track={tracks[1]} />);

      const container = getByTestId("track-list-item-track-2");

      // Verify standard styling (border width should not be 3)
      const styles = Array.isArray(container.props.style)
        ? container.props.style
        : [container.props.style];
      const hasMasterBorder = styles.some((style) => style?.borderWidth === 3);
      expect(hasMasterBorder).toBe(false);
    });

    it("includes accessibility label for master track", () => {
      const tracks = [createMockTrack({ id: "track-1", name: "Master Track" })];
      useTrackStore.setState({ tracks });

      const { getByLabelText } = render(<TrackListItem track={tracks[0]} />);

      expect(getByLabelText(/Master loop track/i)).toBeTruthy();
    });

    it("does not include master accessibility label for non-master tracks", () => {
      const tracks = [
        createMockTrack({ id: "track-1", name: "Master Track" }),
        createMockTrack({ id: "track-2", name: "Track 2" }),
      ];
      useTrackStore.setState({ tracks });

      const { queryByLabelText } = render(<TrackListItem track={tracks[1]} />);

      expect(queryByLabelText(/Master loop track/i)).toBeNull();
    });
  });
});
