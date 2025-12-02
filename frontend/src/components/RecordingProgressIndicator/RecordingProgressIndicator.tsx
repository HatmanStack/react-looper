/**
 * RecordingProgressIndicator Component
 *
 * Shows recording progress during recording:
 * - First track: Simple timer showing elapsed time
 * - Subsequent tracks: Progress bar + timer showing progress through loop cycle
 *
 * Visual cues: Color changes as loop end approaches (warning at 80%, error at 95%)
 */

import React from "react";
import { View, Text } from "react-native";
import { ProgressBar } from "react-native-paper";
import { styles } from "./RecordingProgressIndicator.styles";

export interface RecordingProgressIndicatorProps {
  /**
   * Whether this is the first track recording (master loop)
   */
  isFirstTrack: boolean;

  /**
   * Current recording duration in milliseconds
   */
  recordingDuration: number;

  /**
   * Master loop duration in milliseconds (for subsequent tracks)
   */
  loopDuration: number;
}

/**
 * Format duration in milliseconds to "MM:SS.S" format
 */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

/**
 * Get progress bar color based on completion percentage
 */
function getProgressColor(progress: number): string {
  if (progress >= 0.95) {
    return "#D32F2F"; // Error red
  } else if (progress >= 0.8) {
    return "#F57C00"; // Warning orange
  } else {
    return "#3F51B5"; // Primary blue
  }
}

export const RecordingProgressIndicator: React.FC<
  RecordingProgressIndicatorProps
> = ({ isFirstTrack, recordingDuration, loopDuration }) => {
  // For first track, just show elapsed time
  if (isFirstTrack) {
    return (
      <View style={styles.container} testID="recording-progress-indicator">
        <Text style={styles.timerText} testID="timer-text">
          {formatDuration(recordingDuration)}
        </Text>
        <Text style={styles.instructionText}>
          Recording... Stop to set loop length
        </Text>
      </View>
    );
  }

  // For subsequent tracks, show progress bar + timer
  const progress = loopDuration > 0 ? recordingDuration / loopDuration : 0;
  const clampedProgress = Math.min(progress, 1.0); // Clamp to 1.0 max
  const progressColor = getProgressColor(clampedProgress);

  return (
    <View style={styles.container} testID="recording-progress-indicator">
      <Text style={styles.timerText} testID="timer-text">
        {formatDuration(recordingDuration)} / {formatDuration(loopDuration)}
      </Text>

      <ProgressBar
        progress={clampedProgress}
        color={progressColor}
        style={styles.progressBar}
        testID="progress-bar"
      />

      <Text style={styles.instructionText}>
        Recording... Auto-stop at loop end
      </Text>
    </View>
  );
};
