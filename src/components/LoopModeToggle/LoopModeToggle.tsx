/**
 * LoopModeToggle Component
 *
 * Toggle button for global loop mode.
 * When enabled, tracks loop to match the master loop duration during playback.
 * When disabled, tracks play once and stop (inspection mode).
 */

import React from "react";
import { IconButton } from "react-native-paper";
import { usePlaybackStore } from "../../store/usePlaybackStore";

export const LoopModeToggle: React.FC = () => {
  const loopMode = usePlaybackStore((state) => state.loopMode);
  const toggleLoopMode = usePlaybackStore((state) => state.toggleLoopMode);

  const handleToggle = () => {
    toggleLoopMode();
  };

  return (
    <IconButton
      icon={loopMode ? "repeat" : "repeat-off"}
      size={32}
      iconColor={loopMode ? "#3F51B5" : "#938F99"}
      onPress={handleToggle}
      testID="loop-mode-toggle"
      accessibilityLabel={`Loop mode toggle, currently ${loopMode ? "on" : "off"}`}
      accessibilityHint="When enabled, tracks will loop to match the master loop duration"
      accessibilityRole="switch"
      accessibilityState={{ checked: loopMode }}
    />
  );
};
