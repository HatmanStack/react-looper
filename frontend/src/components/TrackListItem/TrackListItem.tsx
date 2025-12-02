/**
 * TrackListItem Component
 *
 * Displays an individual track with controls:
 * - Track name
 * - Play, Pause, Delete buttons
 * - Volume and Speed sliders
 * - Master track indication (distinct styling for first track)
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { IconButton } from "react-native-paper";
import { VolumeSlider } from "../VolumeSlider";
import { SpeedSlider } from "../SpeedSlider";
import { TrackProgressBar } from "../TrackProgressBar";
import { useTrackStore } from "../../store/useTrackStore";
import type { Track } from "../../types";
import { styles } from "./TrackListItem.styles";

export interface TrackListItemProps {
  track: Track;
  onPlay?: (trackId: string) => void;
  onPause?: (trackId: string) => void;
  onDelete?: (trackId: string) => void;
  onVolumeChange?: (trackId: string, volume: number) => void;
  onSpeedChange?: (trackId: string, speed: number) => void;
  onSelect?: (trackId: string) => void;
}

export const TrackListItem: React.FC<TrackListItemProps> = ({
  track,
  onPlay,
  onPause,
  onDelete,
  onVolumeChange,
  onSpeedChange,
  onSelect,
}) => {
  // Check if this track is the master track (first track in store)
  const isMaster = useTrackStore((state) => state.isMasterTrack(track.id));
  // Get master loop duration for progress bar sync
  const masterLoopDuration = useTrackStore((state) =>
    state.getMasterLoopDuration(),
  );

  const handlePlay = () => {
    onPlay?.(track.id);
  };

  const handlePause = () => {
    onPause?.(track.id);
  };

  const handleDelete = () => {
    onDelete?.(track.id);
  };

  const handleVolumeChange = (volume: number) => {
    onVolumeChange?.(track.id, volume);
  };

  const handleSpeedChange = (speed: number) => {
    onSpeedChange?.(track.id, speed);
  };

  const handleSelect = () => {
    onSelect?.(track.id);
  };

  // Build container styles with master and/or selected track styling
  const containerStyles = [
    styles.container,
    track.selected && styles.selectedTrackContainer,
    isMaster && styles.masterTrackContainer, // Master takes precedence (applied last)
  ];

  // Build accessibility label
  const accessibilityLabel = isMaster
    ? `Master loop track: ${track.name}`
    : `Track: ${track.name}`;

  return (
    <Pressable
      onPress={handleSelect}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: track.selected }}
      accessibilityHint={
        isMaster
          ? "This track sets the loop length for all tracks"
          : "Tap to select this track for saving"
      }
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={containerStyles} testID={`track-list-item-${track.id}`}>
        {/* Track Name */}
        <Text style={styles.trackName} accessibilityRole="header">
          {track.name}
        </Text>

        {/* Control Buttons Row */}
        <View
          style={styles.controlsRow}
          accessibilityRole="toolbar"
          accessibilityLabel="Track controls"
        >
          {/* Play Button (left) */}
          <IconButton
            icon="play"
            size={30}
            iconColor={track.isPlaying ? "#3F51B5" : "#E1E1E1"}
            onPress={handlePlay}
            style={styles.playButton}
            accessibilityLabel={`Play ${track.name}`}
            accessibilityHint="Double tap to play this track"
            accessibilityRole="button"
            accessibilityState={{ selected: track.isPlaying }}
          />

          {/* Sliders Section */}
          <View style={styles.slidersContainer}>
            {/* Volume Slider */}
            <VolumeSlider
              value={track.volume}
              onValueChange={handleVolumeChange}
            />

            {/* Speed Slider */}
            <SpeedSlider
              value={track.speed}
              onValueChange={handleSpeedChange}
            />
          </View>

          {/* Pause Button (right) */}
          <IconButton
            icon="pause"
            size={30}
            iconColor="#E1E1E1"
            onPress={handlePause}
            style={styles.pauseButton}
            accessibilityLabel={`Pause ${track.name}`}
            accessibilityHint="Double tap to pause this track"
            accessibilityRole="button"
          />

          {/* Delete Button (far right) */}
          <IconButton
            icon="delete"
            size={30}
            iconColor="#E1E1E1"
            onPress={handleDelete}
            style={styles.deleteButton}
            accessibilityLabel={`Delete ${track.name}`}
            accessibilityHint="Double tap to remove this track"
            accessibilityRole="button"
          />
        </View>

        {/* Playback Progress Bar - synced to master loop */}
        <TrackProgressBar
          trackId={track.id}
          masterLoopDuration={masterLoopDuration}
          speed={track.speed}
          isPlaying={track.isPlaying}
        />
      </View>
    </Pressable>
  );
};
