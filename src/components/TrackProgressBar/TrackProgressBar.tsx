/**
 * TrackProgressBar Component
 *
 * Displays current playback position for a track.
 * Shows progress within the track's duration, resetting at loop boundaries.
 */

import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { ProgressBar } from "react-native-paper";
import { styles } from "./TrackProgressBar.styles";

export interface TrackProgressBarProps {
  /** Track ID to show progress for */
  trackId: string;
  /** Track duration in milliseconds */
  duration: number;
  /** Whether playback is active */
  isPlaying: boolean;
}

export const TrackProgressBar: React.FC<TrackProgressBarProps> = ({
  trackId,
  duration,
  isPlaying,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isPlaying || duration === 0) {
      return;
    }

    let animationFrameId: number;
    let startTime = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const currentProgress = (elapsed % duration) / duration;
      setProgress(currentProgress);

      animationFrameId = requestAnimationFrame(updateProgress);
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, duration]);

  return (
    <View style={styles.container} testID={`track-progress-bar-${trackId}`}>
      <ProgressBar
        progress={progress}
        color="#3F51B5"
        style={styles.progressBar}
        accessibilityLabel="Playback progress"
      />
    </View>
  );
};
