/**
 * TrackProgressBar Component
 *
 * Displays current playback position within the master loop cycle.
 * All tracks sync to the same master loop boundary for visual alignment.
 * Matches behavior of hardware loop stations (Boss RC-505, etc.)
 */

import React, { useEffect, useState, useRef } from "react";
import { View } from "react-native";
import { ProgressBar } from "react-native-paper";
import { styles } from "./TrackProgressBar.styles";

export interface TrackProgressBarProps {
  /** Track ID to show progress for */
  trackId: string;
  /** Master loop duration in milliseconds (all tracks sync to this) */
  masterLoopDuration: number;
  /** Track's speed multiplier (affects playback rate) */
  speed: number;
  /** Whether playback is active */
  isPlaying: boolean;
}

const TrackProgressBarComponent: React.FC<TrackProgressBarProps> = ({
  trackId,
  masterLoopDuration,
  speed,
  isPlaying,
}) => {
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number>(0);
  const pauseOffsetRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying || masterLoopDuration === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(0);
      return;
    }

    // Reset start time when playback starts
    startTimeRef.current = performance.now() - pauseOffsetRef.current;

    let animationFrameId: number;

    const updateProgress = () => {
      const now = performance.now();
      // Calculate elapsed time with speed multiplier
      const elapsed = (now - startTimeRef.current) * speed;

      // Progress within the master loop cycle (0 to 1)
      // All tracks sync to the same master loop boundary
      const loopPosition = elapsed % masterLoopDuration;
      const currentProgress = loopPosition / masterLoopDuration;

      setProgress(currentProgress);
      animationFrameId = requestAnimationFrame(updateProgress);
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      // Save current position for resume
      const now = performance.now();
      pauseOffsetRef.current = now - startTimeRef.current;
    };
  }, [isPlaying, masterLoopDuration, speed]);

  return (
    <View style={styles.container} testID={`track-progress-bar-${trackId}`}>
      <ProgressBar
        progress={progress}
        color="#EF5555"
        style={styles.progressBar}
        accessibilityLabel="Position within master loop cycle"
      />
    </View>
  );
};

/**
 * Memoized TrackProgressBar to prevent unnecessary re-renders.
 * Re-renders only when playback state or loop duration changes.
 */
export const TrackProgressBar = React.memo(TrackProgressBarComponent);
TrackProgressBar.displayName = "TrackProgressBar";
