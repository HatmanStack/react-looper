/**
 * RecordingProgressIndicator Component Tests
 */

import React from "react";
import { render } from "@testing-library/react-native";
import { RecordingProgressIndicator } from "../RecordingProgressIndicator";

describe("RecordingProgressIndicator", () => {
  describe("First Track Mode", () => {
    it("renders timer mode for first track", () => {
      const { getByText, queryByTestId, getByTestId } = render(
        <RecordingProgressIndicator
          isFirstTrack={true}
          recordingDuration={5200}
          loopDuration={0}
        />
      );

      // Should show elapsed time
      expect(getByTestId("timer-text")).toBeTruthy();
      expect(getByText("00:05.2")).toBeTruthy();

      // Should NOT show progress bar
      expect(queryByTestId("progress-bar")).toBeNull();

      // Should show instruction for first track
      expect(getByText(/Stop to set loop length/i)).toBeTruthy();
    });

    it("formats duration correctly for various times", () => {
      const { getByText, rerender } = render(
        <RecordingProgressIndicator
          isFirstTrack={true}
          recordingDuration={0}
          loopDuration={0}
        />
      );

      expect(getByText("00:00.0")).toBeTruthy();

      rerender(
        <RecordingProgressIndicator
          isFirstTrack={true}
          recordingDuration={1500}
          loopDuration={0}
        />
      );
      expect(getByText("00:01.5")).toBeTruthy();

      rerender(
        <RecordingProgressIndicator
          isFirstTrack={true}
          recordingDuration={65300}
          loopDuration={0}
        />
      );
      expect(getByText("01:05.3")).toBeTruthy();
    });
  });

  describe("Subsequent Track Mode", () => {
    it("renders progress mode for subsequent track", () => {
      const { getByText, getByTestId } = render(
        <RecordingProgressIndicator
          isFirstTrack={false}
          recordingDuration={5200}
          loopDuration={10000}
        />
      );

      // Should show both current and total time
      expect(getByText(/00:05.2.*00:10.0/)).toBeTruthy();

      // Should show progress bar
      expect(getByTestId("progress-bar")).toBeTruthy();

      // Should show instruction for subsequent track
      expect(getByText(/Auto-stop at loop end/i)).toBeTruthy();
    });

    it("calculates progress correctly", () => {
      const { getByTestId } = render(
        <RecordingProgressIndicator
          isFirstTrack={false}
          recordingDuration={5000}
          loopDuration={10000}
        />
      );

      const progressBar = getByTestId("progress-bar");
      expect(progressBar.props.progress).toBeCloseTo(0.5, 2);
    });

    it("changes color as loop end approaches", () => {
      // At 50% - should be primary color (blue)
      const { getByTestId, rerender } = render(
        <RecordingProgressIndicator
          isFirstTrack={false}
          recordingDuration={5000}
          loopDuration={10000}
        />
      );

      let progressBar = getByTestId("progress-bar");
      expect(progressBar.props.color).toBe("#3F51B5"); // Primary blue

      // At 85% - should be warning color (orange)
      rerender(
        <RecordingProgressIndicator
          isFirstTrack={false}
          recordingDuration={8500}
          loopDuration={10000}
        />
      );

      progressBar = getByTestId("progress-bar");
      expect(progressBar.props.color).toBe("#F57C00"); // Warning orange

      // At 96% - should be error color (red)
      rerender(
        <RecordingProgressIndicator
          isFirstTrack={false}
          recordingDuration={9600}
          loopDuration={10000}
        />
      );

      progressBar = getByTestId("progress-bar");
      expect(progressBar.props.color).toBe("#D32F2F"); // Error red
    });

    it("clamps progress to 1.0 max", () => {
      // Recording duration exceeds loop duration (edge case)
      const { getByTestId } = render(
        <RecordingProgressIndicator
          isFirstTrack={false}
          recordingDuration={12000}
          loopDuration={10000}
        />
      );

      const progressBar = getByTestId("progress-bar");
      expect(progressBar.props.progress).toBe(1.0);
    });

    it("handles zero loop duration gracefully", () => {
      const { getByTestId } = render(
        <RecordingProgressIndicator
          isFirstTrack={false}
          recordingDuration={5000}
          loopDuration={0}
        />
      );

      const progressBar = getByTestId("progress-bar");
      expect(progressBar.props.progress).toBe(0);
    });
  });

  describe("Accessibility", () => {
    it("has testID for testing", () => {
      const { getByTestId } = render(
        <RecordingProgressIndicator
          isFirstTrack={true}
          recordingDuration={5000}
          loopDuration={0}
        />
      );

      expect(getByTestId("recording-progress-indicator")).toBeTruthy();
    });

    it("displays readable time format", () => {
      const { getByText } = render(
        <RecordingProgressIndicator
          isFirstTrack={false}
          recordingDuration={3456}
          loopDuration={10000}
        />
      );

      // Should format time in readable MM:SS.S format
      expect(getByText(/00:03.4/)).toBeTruthy();
    });
  });
});
