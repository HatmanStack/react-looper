/**
 * MainScreen Component
 *
 * Main screen layout for the Looper app:
 * - Top controls: Record, Stop, Import, Save, and Menu (Loop mode, Settings, Help)
 * - Middle section: Track list with FlatList
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { View } from "react-native";
import {
  Surface,
  ActivityIndicator,
  IconButton,
  Menu,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { Alert } from "../../utils/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrackList } from "@components/TrackList";
import { ActionButton } from "@components/ActionButton";
import { TopControlsSkeleton } from "@components/TopControlsSkeleton";
import { SaveModal } from "@components/SaveModal";
import { HelpModal } from "@components/HelpModal";
import { ConfirmationDialog } from "@components/ConfirmationDialog";
import { RecordingProgressIndicator } from "@components/RecordingProgressIndicator";
import type { Track } from "../../types";
import { getStyles } from "./MainScreen.styles";
import { initializeAudioServices } from "../../services/audio/initialize";
import { getAudioService } from "../../services/audio/AudioServiceFactory";
import { AudioService } from "../../services/audio/AudioService";
import { AudioError } from "../../services/audio/AudioError";
import { getFileImporter } from "../../services/audio/FileImporterFactory";
import { getAudioMetadata } from "../../utils/audioUtils";
import { useTrackStore } from "../../store/useTrackStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { usePlaybackStore } from "../../store/usePlaybackStore";
import { useResponsive } from "../../utils/responsive";
import { looperTheme } from "../../theme/paperTheme";
import { useRecordingSession } from "../../hooks/useRecordingSession";
import { useTrackPlayback } from "../../hooks/useTrackPlayback";
import { useExportFlow } from "../../hooks/useExportFlow";

export const MainScreen: React.FC = () => {
  const router = useRouter();
  const responsive = useResponsive();
  const styles = getStyles(responsive);
  const useIconOnly = !responsive.isDesktop;

  // Store selectors
  const tracks = useTrackStore((state) => state.tracks);
  const addTrack = useTrackStore((state) => state.addTrack);
  const removeTrack = useTrackStore((state) => state.removeTrack);
  const updateTrack = useTrackStore((state) => state.updateTrack);
  const getMasterLoopDuration = useTrackStore(
    (state) => state.getMasterLoopDuration,
  );
  const hasMasterTrack = useTrackStore((state) => state.hasMasterTrack);

  const exportFormat = useSettingsStore((state) => state.exportFormat);
  const exportQuality = useSettingsStore((state) => state.exportQuality);
  const recordingFormat = useSettingsStore((state) => state.recordingFormat);
  const recordingQuality = useSettingsStore((state) => state.recordingQuality);
  const loopCrossfadeDuration = useSettingsStore(
    (state) => state.loopCrossfadeDuration,
  );

  const loopMode = usePlaybackStore((state) => state.loopMode);
  const toggleLoopMode = usePlaybackStore((state) => state.toggleLoopMode);

  // Local UI state
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(false);
  const audioServiceRef = useRef<AudioService | null>(null);

  // Initialize AudioService
  useEffect(() => {
    try {
      initializeAudioServices();
      audioServiceRef.current = getAudioService();
      setIsInitialized(true);
    } catch (error) {
      if (error instanceof AudioError) {
        Alert.alert("Error", error.userMessage);
      }
      setInitError(true);
    }

    return () => {
      if (audioServiceRef.current) {
        audioServiceRef.current.cleanup();
      }
    };
  }, []);

  // Recording hook
  const { isRecording, recordingDuration, handleRecord, handleStop } =
    useRecordingSession({
      audioService: audioServiceRef.current,
      tracks,
      getMasterLoopDuration,
      hasMasterTrack,
      recordingFormat,
      recordingQuality,
      onTrackRecorded: useCallback(
        async (track: Track) => {
          if (!audioServiceRef.current) {
            Alert.alert("Error", "Audio service not initialized");
            return;
          }
          await audioServiceRef.current.loadTrack(track.id, track.uri, {
            speed: track.speed,
            volume: track.volume,
            loop: true,
          });
          addTrack(track);
        },
        [addTrack],
      ),
    });

  // Playback hook
  const {
    handlePlay,
    handlePause,
    handleDelete,
    handleVolumeChange,
    handleSpeedChange,
    handleSelect,
    speedConfirmationVisible,
    handleSpeedChangeConfirm,
    handleSpeedChangeCancel,
    deleteConfirmationVisible,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleSyncSelect,
    handleSyncClear,
  } = useTrackPlayback({
    audioService: audioServiceRef.current,
    tracks,
    updateTrack,
    removeTrack,
  });

  // Export hook
  const {
    isExporting,
    saveModalVisible,
    handleSave,
    handleSaveModalDismiss,
    handleSaveModalSave,
  } = useExportFlow({
    tracks,
    exportFormat,
    exportQuality,
    loopCrossfadeDuration,
  });

  const isLoading = isExporting || isImporting;
  const isDisabled = isLoading || initError;

  const handleImport = useCallback(async () => {
    if (!audioServiceRef.current) {
      Alert.alert("Error", "Audio service not initialized");
      return;
    }

    try {
      setIsImporting(true);
      const fileImporter = getFileImporter();
      const importedFile = await fileImporter.pickAudioFile();
      const metadata = await getAudioMetadata(importedFile.uri);

      const newTrack: Track = {
        id: crypto.randomUUID(),
        name: importedFile.name.replace(/\.[^/.]+$/, ""),
        uri: importedFile.uri,
        duration: metadata.duration,
        speed: 1.0,
        volume: 75,
        isPlaying: false,
        selected: true,
        createdAt: Date.now(),
      };

      await audioServiceRef.current.loadTrack(newTrack.id, newTrack.uri, {
        speed: newTrack.speed,
        volume: newTrack.volume,
        loop: true,
      });

      addTrack(newTrack);
    } catch (error) {
      if (error instanceof AudioError) {
        Alert.alert("Import Error", error.userMessage);
      }
    } finally {
      setIsImporting(false);
    }
  }, [addTrack]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Top Controls */}
        {!isInitialized && !initError ? (
          <TopControlsSkeleton style={styles.topControls} />
        ) : (
          <Surface
            style={styles.topControls}
            elevation={0}
            accessibilityRole="toolbar"
            accessibilityLabel="Main controls"
          >
            <ActionButton
              label="Record"
              icon="microphone"
              onPress={handleRecord}
              disabled={isRecording || isDisabled}
              iconOnly={useIconOnly}
              accessibilityLabel={
                isRecording
                  ? "Recording in progress"
                  : hasMasterTrack()
                    ? "Record overdub track"
                    : "Record first loop track"
              }
              accessibilityHint={
                hasMasterTrack()
                  ? "Record a new track that will auto-stop at the loop boundary"
                  : "Record your first track to set the master loop length"
              }
            />
            <ActionButton
              label="Stop"
              icon="stop"
              onPress={handleStop}
              disabled={!isRecording || isDisabled}
              iconOnly={useIconOnly}
              accessibilityHint="Stop recording and save track"
            />
            <ActionButton
              label="Import"
              icon="file-music"
              onPress={handleImport}
              disabled={isDisabled}
              iconOnly={useIconOnly}
              accessibilityHint="Import an audio file from device storage"
            />
            <ActionButton
              label="Save"
              icon="content-save"
              onPress={handleSave}
              disabled={tracks.length === 0 || isDisabled}
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
                  iconColor={looperTheme.colors.onSurface}
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
                  router.push("/settings");
                }}
                title="Settings"
                leadingIcon="cog"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  setHelpModalVisible(true);
                }}
                title="Help"
                leadingIcon="help-circle"
              />
            </Menu>
          </Surface>
        )}

        {/* Recording Progress Indicator */}
        {isRecording && (
          <RecordingProgressIndicator
            isFirstTrack={!hasMasterTrack()}
            recordingDuration={recordingDuration}
            loopDuration={getMasterLoopDuration()}
          />
        )}

        {/* Middle Section - Track List */}
        <View style={styles.trackListContainer}>
          <TrackList
            tracks={tracks}
            onPlay={handlePlay}
            onPause={handlePause}
            onDelete={handleDelete}
            onVolumeChange={handleVolumeChange}
            onSpeedChange={handleSpeedChange}
            onSelect={handleSelect}
            onSyncSelect={handleSyncSelect}
            onSyncClear={handleSyncClear}
          />
        </View>

        {/* Save Modal */}
        <SaveModal
          visible={saveModalVisible}
          trackNumber={tracks.length}
          onDismiss={handleSaveModalDismiss}
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
          message="This track sets the loop length. Changing its speed will affect how all other tracks loop. Synced tracks will be adjusted when possible; out-of-range tracks will be unsynced. Continue?"
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
        {isLoading && (
          <View
            style={styles.loadingOverlay}
            accessibilityLabel="Loading"
            accessibilityLiveRegion="polite"
            accessibilityRole="progressbar"
          >
            <ActivityIndicator
              size="large"
              color={looperTheme.colors.primary}
              accessibilityLabel="Loading, please wait"
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};
