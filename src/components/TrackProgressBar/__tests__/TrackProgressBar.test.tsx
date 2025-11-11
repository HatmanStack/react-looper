import React from "react";
import { render } from "@testing-library/react-native";
import { TrackProgressBar } from "../TrackProgressBar";

describe("TrackProgressBar", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders progress bar with initial progress", () => {
    const { getByTestId } = render(
      <TrackProgressBar trackId="track-1" duration={10000} isPlaying={false} />,
    );

    const progressBar = getByTestId("track-progress-bar-track-1");
    expect(progressBar).toBeTruthy();
  });

  it("renders when playing", () => {
    const { getByTestId } = render(
      <TrackProgressBar trackId="track-1" duration={10000} isPlaying={true} />,
    );

    const progressBar = getByTestId("track-progress-bar-track-1");
    expect(progressBar).toBeTruthy();
  });

  it("renders when paused", () => {
    const { getByTestId } = render(
      <TrackProgressBar trackId="track-1" duration={10000} isPlaying={false} />,
    );

    const progressBar = getByTestId("track-progress-bar-track-1");
    expect(progressBar).toBeTruthy();
  });

  it("handles zero duration", () => {
    const { getByTestId } = render(
      <TrackProgressBar trackId="track-1" duration={0} isPlaying={true} />,
    );

    const progressBar = getByTestId("track-progress-bar-track-1");
    expect(progressBar).toBeTruthy();
  });
});
