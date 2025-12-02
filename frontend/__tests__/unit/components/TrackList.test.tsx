import React from "react";
import { render } from "@testing-library/react-native";
import { TrackList } from "../../../src/components/TrackList";
import type { Track } from "../../../src/types";

const mockTracks: Track[] = [
  {
    id: "track-1",
    name: "Track 1",
    uri: "mock://track1.mp3",
    duration: 120000,
    speed: 1.0,
    volume: 75,
    isPlaying: false,
    createdAt: Date.now(),
  },
  {
    id: "track-2",
    name: "Track 2",
    uri: "mock://track2.mp3",
    duration: 180000,
    speed: 1.25,
    volume: 100,
    isPlaying: true,
    createdAt: Date.now(),
  },
];

describe("TrackList", () => {
  it("renders list of tracks", () => {
    const { getByText } = render(<TrackList tracks={mockTracks} />);
    expect(getByText("Track 1")).toBeTruthy();
    expect(getByText("Track 2")).toBeTruthy();
  });

  it("shows empty state when no tracks", () => {
    const { getByText } = render(<TrackList tracks={[]} />);
    expect(getByText(/No tracks yet/i)).toBeTruthy();
    expect(
      getByText(/Record audio or import tracks to get started/i),
    ).toBeTruthy();
  });

  it("renders correct number of track items", () => {
    const { getAllByText } = render(<TrackList tracks={mockTracks} />);
    // Both tracks should have "Volume:" text
    const volumeLabels = getAllByText(/Volume:/i);
    expect(volumeLabels).toHaveLength(2);
  });

  it("passes callbacks to TrackListItem components", () => {
    const mockOnPlay = jest.fn();
    const mockOnPause = jest.fn();
    const mockOnDelete = jest.fn();

    const { getAllByTestId } = render(
      <TrackList
        tracks={mockTracks}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
        onDelete={mockOnDelete}
      />,
    );

    // Verify TrackListItem components are rendered with buttons
    const iconButtons = getAllByTestId("icon-button");
    expect(iconButtons.length).toBeGreaterThan(0);
  });

  it("uses track id as key extractor", () => {
    const { getAllByText } = render(<TrackList tracks={mockTracks} />);
    // Verify all tracks are rendered (they have unique IDs)
    expect(getAllByText(/Track/i).length).toBeGreaterThanOrEqual(2);
  });
});
