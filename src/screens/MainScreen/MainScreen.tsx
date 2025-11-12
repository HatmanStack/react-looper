/**
 * MainScreen Component
 *
 * Main screen layout for the Looper app with three sections:
 * - Top controls: Record and Stop buttons
 * - Middle section: Track list with FlatList
 * - Bottom controls: Import Audio and Save buttons
 */

import React, { useState, useEffect, useRef } from "react";
import { View } from "react-native";
import { Surface, ActivityIndicator, IconButton } from "react-native-paper";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../App";
import { Alert } from "../../utils/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrackList } from "@components/TrackList";
import { ActionButton } from "@components/ActionButton";
import { SaveModal } from "@components/SaveModal";
import { HelpModal } from "@components/HelpModal";
import { ConfirmationDialog } from "@components/ConfirmationDialog";
import { LoopModeToggle } from "@components/LoopModeToggle";
import type { Track } from "../../types";
import { styles } from "./MainScreen.styles";
import { initializeAudioServices } from "../../services/audio/initialize";
import { getAudioService } from "../../services/audio/AudioServiceFactory";
import { AudioService } from "../../services/audio/AudioService";
import { AudioError } from "../../services/audio/AudioError";
import { getFileImporter } from "../../services/audio/FileImporterFactory";
import { getAudioMetadata } from "../../utils/audioUtils";
import { getFFmpegService } from "../../services/ffmpeg/FFmpegService";

// Initialize audio services for current platform
initializeAudioServices();

type MainScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Main">;
};

export const MainScreen: React.FC<MainScreenProps> = ({ navigation }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [baseLoopDuration, setBaseLoopDuration] = useState<number | null>(null); // Duration in ms
  const audioServiceRef = useRef<AudioService | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      console.log("[MainScreen] AudioService initialized");
    } catch (error) {
      console.error("[MainScreen] Failed to initialize AudioService:", error);
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
    console.log("[MainScreen] handleRecord called");

    if (!audioServiceRef.current) {
      console.error("[MainScreen] Audio service not initialized");
      Alert.alert("Error", "Audio service not initialized");
      return;
    }

    try {
      console.log("[MainScreen] Starting recording...");
      setIsLoading(true);
      await audioServiceRef.current.startRecording();
      setIsRecording(true);
      console.log("[MainScreen] Recording started successfully");

      // If this isn't the first track, set up auto-stop timer
      if (baseLoopDuration !== null) {
        const targetDuration = calculateQuantizedDuration(baseLoopDuration);
        console.log(
          `[MainScreen] Auto-stop timer set for ${targetDuration}ms (base: ${baseLoopDuration}ms)`,
        );

        recordingTimerRef.current = setTimeout(() => {
          console.log(
            "[MainScreen] Auto-stopping recording at quantized duration",
          );
          handleStop();
        }, targetDuration);
      }
    } catch (error) {
      console.error("[MainScreen] Recording failed:", error);
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

    try {
      setIsLoading(true);
      const uri = await audioServiceRef.current.stopRecording();
      setIsRecording(false);

      const recordingDuration = audioServiceRef.current.getRecordingDuration();

      // If this is the first track, set it as the base loop duration
      if (baseLoopDuration === null) {
        setBaseLoopDuration(recordingDuration);
        console.log(
          `[MainScreen] Base loop duration set to ${recordingDuration}ms`,
        );
      }

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

      setTracks((prevTracks) => [...prevTracks, newTrack]);
      console.log(
        "[MainScreen] Recording stopped and track added:",
        newTrack.name,
      );
    } catch (error) {
      console.error("[MainScreen] Stop recording failed:", error);
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
      console.log("[MainScreen] Starting file import...");

      // Get the file importer for current platform
      const fileImporter = getFileImporter();
      const importedFile = await fileImporter.pickAudioFile();

      console.log("[MainScreen] File imported:", importedFile.name);

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

      setTracks((prevTracks) => [...prevTracks, newTrack]);
      console.log("[MainScreen] Imported track added:", newTrack.name);
    } catch (error) {
      console.error("[MainScreen] Import failed:", error);
      if (error instanceof AudioError) {
        Alert.alert("Import Error", error.userMessage);
      } else {
        // User cancelled
        console.log("[MainScreen] Import cancelled by user");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    console.log("Save button pressed");
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
    navigation.navigate("Settings");
  };

  const handleSaveModalSave = async (filename: string) => {
    // Filter only selected tracks
    const selectedTracks = tracks.filter((track) => track.selected);

    if (selectedTracks.length < 1) {
      Alert.alert("Error", "Please select at least one track to save");
      return;
    }

    setSaveModalVisible(false);
    setIsLoading(true);

    try {
      console.log(
        `[MainScreen] Starting mix for ${selectedTracks.length} selected tracks...`,
      );

      // Get FFmpeg service
      const ffmpegService = getFFmpegService();

      // Ensure FFmpeg is loaded (especially important for web)
      await ffmpegService.load();

      // Prepare tracks for mixing
      const mixTracks = selectedTracks.map((track) => ({
        uri: track.uri,
        speed: track.speed,
        volume: track.volume,
      }));

      // Mix tracks
      const result = await ffmpegService.mix({
        tracks: mixTracks,
      });

      setIsLoading(false);

      console.log("[MainScreen] Mixing complete");

      // Handle the result (Blob for web, URI for native)
      if (typeof result === "string") {
        // Native: result is a file URI
        Alert.alert(
          "Success",
          `Mixed audio saved successfully!\n\nFile: ${filename}.mp3\n\nLocation: ${result}`,
          [{ text: "OK" }],
        );
      } else {
        // Web: result is a Blob (WAV format from Web Audio API)
        // Create download link
        const url = URL.createObjectURL(result);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        Alert.alert("Success", `Mixed audio downloaded as ${filename}.wav`);
      }
    } catch (error) {
      setIsLoading(false);
      console.error("[MainScreen] Mixing failed:", error);
      console.error("[MainScreen] Error details:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        error,
      });

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
      console.log(`[MainScreen] Track ${trackId} is already playing, ignoring`);
      return;
    }

    try {
      await audioServiceRef.current.playTrack(trackId);

      // Update track state
      setTracks((prevTracks) =>
        prevTracks.map((track) =>
          track.id === trackId ? { ...track, isPlaying: true } : track,
        ),
      );

      console.log(`[MainScreen] Playing track: ${trackId}`);
    } catch (error) {
      console.error("[MainScreen] Play failed:", error);
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

      // Update track state
      setTracks((prevTracks) =>
        prevTracks.map((track) =>
          track.id === trackId ? { ...track, isPlaying: false } : track,
        ),
      );

      console.log(`[MainScreen] Paused track: ${trackId}`);
    } catch (error) {
      console.error("[MainScreen] Pause failed:", error);
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
      // Unload and delete track
      await audioServiceRef.current.unloadTrack(trackId);

      setTracks((prevTracks) => {
        const newTracks = prevTracks.filter((track) => track.id !== trackId);

        // Reset base loop duration if all tracks are deleted
        if (newTracks.length === 0) {
          setBaseLoopDuration(null);
          console.log(
            "[MainScreen] All tracks deleted, base loop duration reset",
          );
        }

        return newTracks;
      });

      console.log(`[MainScreen] Deleted track: ${trackId}`);
    } catch (error) {
      console.error("[MainScreen] Delete failed:", error);
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

      // Update track state
      setTracks((prevTracks) =>
        prevTracks.map((track) =>
          track.id === trackId ? { ...track, volume } : track,
        ),
      );

      console.log(
        `[MainScreen] Volume changed for track ${trackId}: ${volume}`,
      );
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

      // Update track state
      setTracks((prevTracks) =>
        prevTracks.map((track) =>
          track.id === trackId ? { ...track, speed } : track,
        ),
      );

      console.log(`[MainScreen] Speed changed for track ${trackId}: ${speed}`);
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
    setTracks((prevTracks) =>
      prevTracks.map((track) => ({
        ...track,
        selected: track.id === trackId ? !track.selected : track.selected,
      })),
    );

    console.log(`[MainScreen] Toggled selection for track ${trackId}`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Top Controls */}
        <Surface
          style={styles.topControls}
          elevation={0}
          accessibilityRole="toolbar"
          accessibilityLabel="Recording controls"
        >
          <ActionButton
            label={isRecording ? "Recording..." : "Record"}
            icon="microphone"
            onPress={handleRecord}
            disabled={isRecording || isLoading}
            accessibilityLabel={
              isRecording ? "Recording in progress" : "Record audio"
            }
            accessibilityHint="Start recording a new audio track"
          />
          <ActionButton
            label="Stop"
            icon="stop"
            onPress={handleStop}
            disabled={!isRecording || isLoading}
            accessibilityHint="Stop recording and save track"
          />
          <LoopModeToggle />
          <IconButton
            icon="cog"
            size={32}
            iconColor="#FFFFFF"
            onPress={handleSettings}
            testID="settings-button"
            accessibilityLabel="Settings"
            accessibilityHint="Open settings screen"
          />
          <IconButton
            icon="help-circle"
            size={32}
            iconColor="#FFFFFF"
            onPress={handleHelp}
            accessibilityLabel="Help"
            accessibilityHint="Show help information"
          />
        </Surface>

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

        {/* Bottom Controls */}
        <Surface
          style={styles.bottomControls}
          elevation={0}
          accessibilityRole="toolbar"
          accessibilityLabel="File controls"
        >
          <ActionButton
            label="Import Audio"
            icon="file-music"
            onPress={handleImport}
            disabled={isLoading}
            accessibilityHint="Import an audio file from device storage"
          />
          <ActionButton
            label="Save"
            icon="content-save"
            onPress={handleSave}
            disabled={tracks.length === 0 || isLoading}
            accessibilityHint="Mix and save all tracks to a single audio file"
          />
        </Surface>

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
