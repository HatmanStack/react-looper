/**
 * TopControls Component
 *
 * Toolbar with Record, Stop, Import, Save buttons and overflow menu.
 * Extracted from MainScreen to improve component modularity.
 */

import React, { useState } from "react";
import { Surface, IconButton, Menu } from "react-native-paper";
import { StyleSheet } from "react-native";
import { ActionButton } from "@components/ActionButton";
import { usePlaybackStore } from "../../store/usePlaybackStore";

export interface TopControlsProps {
  isRecording: boolean;
  isLoading: boolean;
  hasTracks: boolean;
  hasMasterTrack: boolean;
  useIconOnly: boolean;
  onRecord: () => void;
  onStop: () => void;
  onImport: () => void;
  onSave: () => void;
  onSettings: () => void;
  onHelp: () => void;
}

export const TopControls: React.FC<TopControlsProps> = ({
  isRecording,
  isLoading,
  hasTracks,
  hasMasterTrack,
  useIconOnly,
  onRecord,
  onStop,
  onImport,
  onSave,
  onSettings,
  onHelp,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const loopMode = usePlaybackStore((state) => state.loopMode);
  const toggleLoopMode = usePlaybackStore((state) => state.toggleLoopMode);

  return (
    <Surface
      style={styles.container}
      elevation={0}
      accessibilityRole="toolbar"
      accessibilityLabel="Main controls"
    >
      <ActionButton
        label="Record"
        icon="microphone"
        onPress={onRecord}
        disabled={isRecording || isLoading}
        iconOnly={useIconOnly}
        accessibilityLabel={
          isRecording
            ? "Recording in progress"
            : hasMasterTrack
              ? "Record overdub track"
              : "Record first loop track"
        }
        accessibilityHint={
          hasMasterTrack
            ? "Record a new track that will auto-stop at the loop boundary"
            : "Record your first track to set the master loop length"
        }
      />
      <ActionButton
        label="Stop"
        icon="stop"
        onPress={onStop}
        disabled={!isRecording || isLoading}
        iconOnly={useIconOnly}
        accessibilityHint="Stop recording and save track"
      />
      <ActionButton
        label="Import"
        icon="file-music"
        onPress={onImport}
        disabled={isLoading}
        iconOnly={useIconOnly}
        accessibilityHint="Import an audio file from device storage"
      />
      <ActionButton
        label="Save"
        icon="content-save"
        onPress={onSave}
        disabled={!hasTracks || isLoading}
        iconOnly={useIconOnly}
        accessibilityHint="Mix and save all tracks to a single audio file"
      />
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <IconButton
            icon="dots-vertical"
            size={32}
            iconColor="#FFFFFF"
            onPress={() => setMenuVisible(true)}
            accessibilityLabel="More options"
            accessibilityHint="Open menu for loop mode, settings, and help"
          />
        }
      >
        <Menu.Item
          onPress={() => {
            toggleLoopMode();
            setMenuVisible(false);
          }}
          title={loopMode ? "Loop Mode: On" : "Loop Mode: Off"}
          leadingIcon={loopMode ? "repeat" : "repeat-off"}
        />
        <Menu.Item
          onPress={() => {
            setMenuVisible(false);
            onSettings();
          }}
          title="Settings"
          leadingIcon="cog"
        />
        <Menu.Item
          onPress={() => {
            setMenuVisible(false);
            onHelp();
          }}
          title="Help"
          leadingIcon="help-circle"
        />
      </Menu>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#1E1E1E",
  },
});
