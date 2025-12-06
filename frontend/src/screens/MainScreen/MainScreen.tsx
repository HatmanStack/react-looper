/**
 * MainScreen Component
 *
 * Main screen layout for the Looper app:
 * - Top controls: Record, Stop, Import, Save, and Menu (Loop mode, Settings, Help)
 * - Middle section: Track list with FlatList
 */

import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Alert } from "../../utils/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrackList } from "@components/TrackList";
import { TopControls } from "@components/TopControls";
import { LoadingOverlay } from "@components/LoadingOverlay";
import { SaveModal } from "@components/SaveModal";
import { HelpModal } from "@components/HelpModal";
import { ConfirmationDialog } from "@components/ConfirmationDialog";
import { RecordingProgressIndicator } from "@components/RecordingProgressIndicator";
import { getStyles } from "./MainScreen.styles";
import { initializeAudioServices } from "../../services/audio/initialize";
import { useTrackStore } from "../../store/useTrackStore";
import { useResponsive } from "../../utils/responsive";
import { useAudioController } from "../../hooks/useAudioController";

// Initialize audio services for current platform
// NOTE: Module-level initialization is intentional - audio services must be ready
// before any component renders to avoid race conditions with microphone permissions
initializeAudioServices();

export const MainScreen: React.FC = () => {
  const router = useRouter();
  const responsive = useResponsive();
  const styles = getStyles(responsive);

  // Use icon-only buttons on small screens
  const useIconOnly = !responsive.isDesktop;

  // Use track store
  const tracks = useTrackStore((state) => state.tracks);
  const updateTrack = useTrackStore((state) => state.updateTrack);
  const getMasterLoopDuration = useTrackStore(
    (state) => state.getMasterLoopDuration,
  );
  const hasMasterTrack = useTrackStore((state) => state.hasMasterTrack);

  // Audio controller hook for all audio operations
  const { state: audioState, actions: audioActions } = useAudioController();

  // Modal visibility state
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  // Confirmation dialog state for master track speed changes
  const [speedConfirmationVisible, setSpeedConfirmationVisible] =
    useState(false);
  const [pendingSpeedChange, setPendingSpeedChange] = useState<{
    trackId: string;
    speed: number;
  } | null>(null);

  // Confirmation dialog state for master track deletion
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] =
    useState(false);
  const [pendingDeletion, setPendingDeletion] = useState<string | null>(null);

  // Handle save with confirmation dialog
  const handleSaveModalSave = async (
    filename: string,
    loopCount: number,
    fadeoutDuration: number,
  ) => {
    setSaveModalVisible(false);

    const result = await audioActions.handleSave(
      filename,
      loopCount,
      fadeoutDuration,
    );

    if (result.success) {
      const warningText = result.warning ? `\n\nNote: ${result.warning}` : "";
      Alert.alert("Success", `${result.message}${warningText}`);
    } else {
      Alert.alert("Error", result.message);
    }
  };

  // Handle delete with confirmation for master track
  const handleDelete = async (trackId: string) => {
    const isMasterTrack = tracks.length > 0 && tracks[0].id === trackId;

    if (isMasterTrack) {
      setPendingDeletion(trackId);
      setDeleteConfirmationVisible(true);
      return;
    }

    await audioActions.handleDelete(trackId);
  };

  const handleDeleteConfirm = async () => {
    if (pendingDeletion) {
      await audioActions.handleDelete(pendingDeletion);
      setPendingDeletion(null);
    }
    setDeleteConfirmationVisible(false);
  };

  const handleDeleteCancel = () => {
    setPendingDeletion(null);
    setDeleteConfirmationVisible(false);
  };

  // Handle speed change with confirmation for master track
  const handleSpeedChange = async (trackId: string, speed: number) => {
    const isMasterTrack = tracks.length > 0 && tracks[0].id === trackId;
    const hasOtherTracks = tracks.length > 1;

    if (isMasterTrack && hasOtherTracks) {
      setPendingSpeedChange({ trackId, speed });
      setSpeedConfirmationVisible(true);
      return;
    }

    await audioActions.handleSpeedChange(trackId, speed);
  };

  const handleSpeedChangeConfirm = async () => {
    if (pendingSpeedChange) {
      await audioActions.handleSpeedChange(
        pendingSpeedChange.trackId,
        pendingSpeedChange.speed,
      );
      setPendingSpeedChange(null);
    }
    setSpeedConfirmationVisible(false);
  };

  const handleSpeedChangeCancel = () => {
    setPendingSpeedChange(null);
    setSpeedConfirmationVisible(false);
  };

  // Handle track selection toggle
  const handleSelect = (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId);
    if (track) {
      updateTrack(trackId, { selected: !track.selected });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Top Controls */}
        <TopControls
          isRecording={audioState.isRecording}
          isLoading={audioState.isLoading}
          hasTracks={tracks.length > 0}
          hasMasterTrack={hasMasterTrack()}
          useIconOnly={useIconOnly}
          onRecord={audioActions.handleRecord}
          onStop={audioActions.handleStop}
          onImport={audioActions.handleImport}
          onSave={() => setSaveModalVisible(true)}
          onSettings={() => router.push("/settings")}
          onHelp={() => setHelpModalVisible(true)}
        />

        {/* Recording Progress Indicator */}
        {audioState.isRecording && (
          <RecordingProgressIndicator
            isFirstTrack={!hasMasterTrack()}
            recordingDuration={audioState.recordingDuration}
            loopDuration={getMasterLoopDuration()}
          />
        )}

        {/* Middle Section - Track List */}
        <View style={styles.trackListContainer}>
          <TrackList
            tracks={tracks}
            onPlay={audioActions.handlePlay}
            onPause={audioActions.handlePause}
            onDelete={handleDelete}
            onVolumeChange={audioActions.handleVolumeChange}
            onSpeedChange={handleSpeedChange}
            onSelect={handleSelect}
          />
        </View>

        {/* Save Modal */}
        <SaveModal
          visible={saveModalVisible}
          trackNumber={tracks.length}
          onDismiss={() => setSaveModalVisible(false)}
          onSave={handleSaveModalSave}
        />

        {/* Help Modal */}
        <HelpModal
          visible={helpModalVisible}
          onDismiss={() => setHelpModalVisible(false)}
        />

        {/* Speed Change Confirmation Dialog */}
        <ConfirmationDialog
          visible={speedConfirmationVisible}
          title="Change Master Loop Speed?"
          message="This track sets the loop length. Changing its speed will affect how all other tracks loop. Continue?"
          onConfirm={handleSpeedChangeConfirm}
          onCancel={handleSpeedChangeCancel}
          confirmLabel="Change Speed"
          cancelLabel="Cancel"
          destructive={false}
        />

        {/* Master Track Deletion Confirmation Dialog */}
        <ConfirmationDialog
          visible={deleteConfirmationVisible}
          title="Delete Master Track?"
          message="This track sets the loop length. Deleting it will clear all tracks and start fresh. This cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          confirmLabel="Delete All Tracks"
          cancelLabel="Cancel"
          destructive={true}
        />

        {/* Loading Indicator */}
        <LoadingOverlay visible={audioState.isLoading} />
      </View>
    </SafeAreaView>
  );
};
