/**
 * MainScreen Component
 *
 * Main screen layout for the Looper app:
 * - Top controls: Record, Stop, Import, Save, and Menu (Loop mode, Settings, Help)
 * - Middle section: Track list with FlatList
 */

import React, { useState, useEffect, useRef } from "react";
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
import { getAudioExportService } from "../../services/ffmpeg/AudioExportService";
import { getBitrate } from "../../services/ffmpeg/audioQuality";
import { useTrackStore } from "../../store/useTrackStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { usePlaybackStore } from "../../store/usePlaybackStore";
import { useResponsive } from "../../utils/responsive";

// Initialize audio services for current platform
initializeAudioServices();

export const MainScreen: React.FC = () => {
  const router = useRouter();
  const responsive = useResponsive();
  const styles = getStyles(responsive);

  // Use icon-only buttons on small screens
  const useIconOnly = !responsive.isDesktop;

  // Use track store instead of local state
  const tracks = useTrackStore((state) => state.tracks);
  const addTrack = useTrackStore((state) => state.addTrack);
  const removeTrack = useTrackStore((state) => state.removeTrack);
  const updateTrack = useTrackStore((state) => state.updateTrack);
  const getMasterLoopDuration = useTrackStore(
    (state) => state.getMasterLoopDuration,
  );
  const hasMasterTrack = useTrackStore((state) => state.hasMasterTrack);

  // Get export settings
  const exportFormat = useSettingsStore((state) => state.exportFormat);
  const exportQuality = useSettingsStore((state) => state.exportQuality);

  // Get recording settings
  const recordingFormat = useSettingsStore((state) => state.recordingFormat);
  const recordingQuality = useSettingsStore((state) => state.recordingQuality);

  // Get loop mode state
  const loopMode = usePlaybackStore((state) => state.loopMode);
  const toggleLoopMode = usePlaybackStore((state) => state.toggleLoopMode);

  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0); // Current recording duration in ms
  const audioServiceRef = useRef<AudioService | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null); // For updating recording duration

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

  // Initialize AudioService
  useEffect(() => {
    try {
      audioServiceRef.current = getAudioService();
    } catch (error) {
      if (error instanceof AudioError) {
        Alert.alert("Error", error.userMessage);
      }
    }

    return () => {
      // Cleanup on unmount
      if (audioServiceRef.current) {
        audioServiceRef.current.cleanup();
      }
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  /**
   * Calculate quantized duration based on base loop
   * Returns the target duration (1x, 2x, 4x, 8x of base)
   */
  const calculateQuantizedDuration = (baseDuration: number): number => {
    // Multiples: 1x, 2x, 4x, 8x
    const multiples = [1, 2, 4, 8];

    // For now, default to 1x (same as base loop)
    // This will auto-stop at the same length as the first loop
    return baseDuration * multiples[0];
  };

  const handleRecord = async () => {
    if (!audioServiceRef.current) {
      Alert.alert("Error", "Audio service not initialized");
      return;
    }

    try {
      setIsLoading(true);

      // Detect recording context: first track or subsequent
      const masterLoopDuration = getMasterLoopDuration();
      const isFirstTrackRecording = !hasMasterTrack();

      // Convert quality level to bitrate
      const bitRate = getBitrate(recordingFormat, recordingQuality);

      // Start recording with maxDuration for subsequent tracks
      if (!isFirstTrackRecording) {
        const targetDuration = calculateQuantizedDuration(masterLoopDuration);

        await audioServiceRef.current.startRecording({
          maxDuration: targetDuration,
          format: recordingFormat as import("../../types/audio").AudioFormat,
          bitRate,
        });

        // Set up auto-stop timer as backup
        recordingTimerRef.current = setTimeout(() => {
          handleStop();
        }, targetDuration);
      } else {
        // First track - no auto-stop
        await audioServiceRef.current.startRecording({
          format: recordingFormat as import("../../types/audio").AudioFormat,
          bitRate,
        });
      }

      setIsRecording(true);
      setRecordingDuration(0);

      // Start interval to update recording duration display
      recordingIntervalRef.current = setInterval(() => {
        if (audioServiceRef.current) {
          const duration = audioServiceRef.current.getRecordingDuration();
          setRecordingDuration(duration);
        }
      }, 100); // Update every 100ms for smooth progress
    } catch (error) {
      if (error instanceof AudioError) {
        Alert.alert("Recording Error", error.userMessage);
      } else {
        Alert.alert("Error", "Failed to start recording");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (!audioServiceRef.current) {
      Alert.alert("Error", "Audio service not initialized");
      return;
    }

    // Clear the auto-stop timer if it exists
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Clear the recording duration update interval
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    try {
      setIsLoading(true);
      const uri = await audioServiceRef.current.stopRecording();
      setIsRecording(false);
      setRecordingDuration(0);

      const recordingDuration = audioServiceRef.current.getRecordingDuration();

      // Create new track
      const newTrack: Track = {
        id: `track-${Date.now()}`,
        name: `Recording ${tracks.length + 1}`,
        uri,
        duration: recordingDuration,
        speed: 1.0,
        volume: 75,
        isPlaying: false,
        selected: true,
        createdAt: Date.now(),
      };

      // Load track for playback
      await audioServiceRef.current.loadTrack(newTrack.id, newTrack.uri, {
        speed: newTrack.speed,
        volume: newTrack.volume,
        loop: true,
      });

      // Add track to store
      addTrack(newTrack);
    } catch (error) {
      if (error instanceof AudioError) {
        Alert.alert("Error", error.userMessage);
      } else {
        Alert.alert("Error", "Failed to stop recording");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!audioServiceRef.current) {
      Alert.alert("Error", "Audio service not initialized");
      return;
    }

    try {
      setIsLoading(true);

      // Get the file importer for current platform
      const fileImporter = getFileImporter();
      const importedFile = await fileImporter.pickAudioFile();

      // Get audio metadata
      const metadata = await getAudioMetadata(importedFile.uri);

      // Create new track
      const newTrack: Track = {
        id: `track-${Date.now()}`,
        name: importedFile.name.replace(/\.[^/.]+$/, ""), // Remove extension
        uri: importedFile.uri,
        duration: metadata.duration,
        speed: 1.0,
        volume: 75,
        isPlaying: false,
        selected: true,
        createdAt: Date.now(),
      };

      // Load track for playback
      await audioServiceRef.current.loadTrack(newTrack.id, newTrack.uri, {
        speed: newTrack.speed,
        volume: newTrack.volume,
        loop: true,
      });

      // Add track to store
      addTrack(newTrack);
    } catch (error) {
      if (error instanceof AudioError) {
        Alert.alert("Import Error", error.userMessage);
      } else {
        // User cancelled
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    setSaveModalVisible(true);
  };

  const handleSaveModalDismiss = () => {
    setSaveModalVisible(false);
  };

  const handleHelp = () => {
    setHelpModalVisible(true);
  };

  const handleHelpModalDismiss = () => {
    setHelpModalVisible(false);
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  const handleSaveModalSave = async (
    filename: string,
    loopCount: number,
    fadeoutDuration: number,
  ) => {
    // Filter only selected tracks
    const selectedTracks = tracks.filter((track) => track.selected);

    if (selectedTracks.length < 1) {
      Alert.alert("Error", "Please select at least one track to save");
      return;
    }

    setSaveModalVisible(false);
    setIsLoading(true);

    try {
      // Get FFmpeg service
      const audioExportService = getAudioExportService();

      // Ensure FFmpeg is loaded (especially important for web)
      await audioExportService.load();

      // Prepare tracks for mixing
      const mixTracks = selectedTracks.map((track) => ({
        uri: track.uri,
        speed: track.speed,
        volume: track.volume,
      }));

      // Mix tracks with loop, fadeout, format, and quality options
      const result = await audioExportService.mix({
        tracks: mixTracks,
        loopCount,
        fadeoutDuration,
        format: exportFormat,
        quality: exportQuality,
      });

      setIsLoading(false);

      // Use actual format from result (may differ if fallback occurred)
      const actualFormat = result.actualFormat;

      // Handle the result (Blob for web, URI for native)
      if (typeof result.data === "string") {
        // Native: result is a file URI
        Alert.alert(
          "Success",
          `Mixed audio saved successfully!\n\nFile: ${filename}.${actualFormat}\n\nLocation: ${result.data}`,
          [{ text: "OK" }],
        );
      } else {
        // Web: result is a Blob
        // Create download link
        const url = URL.createObjectURL(result.data);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.${actualFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        Alert.alert(
          "Success",
          `Mixed audio downloaded as ${filename}.${actualFormat} (${exportQuality} quality)`,
        );
      }
    } catch (error) {
      setIsLoading(false);

      if (error instanceof AudioError) {
        Alert.alert("Mixing Error", error.userMessage);
      } else {
        const errorMessage = (error as Error).message || "Unknown error";
        Alert.alert("Error", `Failed to mix audio tracks: ${errorMessage}`);
      }
    }
  };

  const handlePlay = async (trackId: string) => {
    if (!audioServiceRef.current) {
      return;
    }

    // Check if track is already playing
    const track = tracks.find((t) => t.id === trackId);
    if (track?.isPlaying) {
      return;
    }

    try {
      await audioServiceRef.current.playTrack(trackId);

      // Update track state in store
      updateTrack(trackId, { isPlaying: true });
    } catch (error) {
      if (error instanceof AudioError) {
        Alert.alert("Playback Error", error.userMessage);
      }
    }
  };

  const handlePause = async (trackId: string) => {
    if (!audioServiceRef.current) {
      return;
    }

    try {
      await audioServiceRef.current.pauseTrack(trackId);

      // Update track state in store
      updateTrack(trackId, { isPlaying: false });
    } catch (error) {
      if (error instanceof AudioError) {
        Alert.alert("Playback Error", error.userMessage);
      }
    }
  };

  const handleDelete = async (trackId: string) => {
    if (!audioServiceRef.current) {
      return;
    }

    // Check if this is the master track (first track)
    const isMasterTrack = tracks.length > 0 && tracks[0].id === trackId;

    // If deleting master track, show confirmation (this will clear all tracks)
    if (isMasterTrack) {
      setPendingDeletion(trackId);
      setDeleteConfirmationVisible(true);
      return;
    }

    // Otherwise, delete immediately
    await performDelete(trackId);
  };

  const performDelete = async (trackId: string) => {
    if (!audioServiceRef.current) {
      return;
    }

    try {
      // Check if this is the master track (first track)
      const isMaster = tracks.length > 0 && tracks[0].id === trackId;

      if (isMaster) {
        // If deleting master track, unload ALL tracks since store will clear all
        for (const track of tracks) {
          try {
            await audioServiceRef.current.unloadTrack(track.id);
          } catch (error) {
            console.error(
              `[MainScreen] Failed to unload track ${track.id}:`,
              error,
            );
          }
        }
      } else {
        // Otherwise, just unload this specific track
        await audioServiceRef.current.unloadTrack(trackId);
      }

      // Remove track from store (store handles master track deletion logic)
      removeTrack(trackId);
    } catch (error) {
      if (error instanceof AudioError) {
        Alert.alert("Delete Error", error.userMessage);
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (pendingDeletion) {
      await performDelete(pendingDeletion);
      setPendingDeletion(null);
    }
    setDeleteConfirmationVisible(false);
  };

  const handleDeleteCancel = () => {
    setPendingDeletion(null);
    setDeleteConfirmationVisible(false);
  };

  const handleVolumeChange = async (trackId: string, volume: number) => {
    if (!audioServiceRef.current) {
      return;
    }

    try {
      await audioServiceRef.current.setTrackVolume(trackId, volume);

      // Update track state in store
      updateTrack(trackId, { volume });
    } catch (error) {
      console.error("[MainScreen] Volume change failed:", error);
    }
  };

  const handleSpeedChange = async (trackId: string, speed: number) => {
    if (!audioServiceRef.current) {
      return;
    }

    // Check if this is the master track (first track) and if there are other tracks
    const isMasterTrack = tracks.length > 0 && tracks[0].id === trackId;
    const hasOtherTracks = tracks.length > 1;

    // If changing master track speed with other tracks present, show confirmation
    if (isMasterTrack && hasOtherTracks) {
      setPendingSpeedChange({ trackId, speed });
      setSpeedConfirmationVisible(true);
      return;
    }

    // Otherwise, apply speed change immediately
    await applySpeedChange(trackId, speed);
  };

  const applySpeedChange = async (trackId: string, speed: number) => {
    if (!audioServiceRef.current) {
      return;
    }

    try {
      await audioServiceRef.current.setTrackSpeed(trackId, speed);

      // Update track state in store
      updateTrack(trackId, { speed });
    } catch (error) {
      console.error("[MainScreen] Speed change failed:", error);
    }
  };

  const handleSpeedChangeConfirm = () => {
    if (pendingSpeedChange) {
      applySpeedChange(pendingSpeedChange.trackId, pendingSpeedChange.speed);
      setPendingSpeedChange(null);
    }
    setSpeedConfirmationVisible(false);
  };

  const handleSpeedChangeCancel = () => {
    setPendingSpeedChange(null);
    setSpeedConfirmationVisible(false);
  };

  const handleSelect = (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId);
    if (track) {
      // Toggle selection in store
      updateTrack(trackId, { selected: !track.selected });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Top Controls */}
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
            disabled={isRecording || isLoading}
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
            disabled={!isRecording || isLoading}
            iconOnly={useIconOnly}
            accessibilityHint="Stop recording and save track"
          />
          <ActionButton
            label="Import"
            icon="file-music"
            onPress={handleImport}
            disabled={isLoading}
            iconOnly={useIconOnly}
            accessibilityHint="Import an audio file from device storage"
          />
          <ActionButton
            label="Save"
            icon="content-save"
            onPress={handleSave}
            disabled={tracks.length === 0 || isLoading}
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
                handleSettings();
              }}
              title="Settings"
              leadingIcon="cog"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                handleHelp();
              }}
              title="Help"
              leadingIcon="help-circle"
            />
          </Menu>
        </Surface>

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
          onDismiss={handleHelpModalDismiss}
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
        {isLoading && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}
            accessibilityLabel="Loading"
            accessibilityLiveRegion="polite"
            accessibilityRole="progressbar"
          >
            <ActivityIndicator
              size="large"
              color="#3F51B5"
              accessibilityLabel="Loading, please wait"
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};
