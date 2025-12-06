/**
 * useAudioController Hook
 *
 * Manages all audio operations: recording, playback, import, and export.
 * Extracted from MainScreen to improve separation of concerns.
 *
 * NOTE: This hook maintains a ref to AudioService rather than storing it in state
 * because the service is a singleton with internal state. Re-renders should not
 * recreate the service instance.
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { Alert } from "../utils/alert";
import type { Track } from "../types";
import { getAudioService } from "../services/audio/AudioServiceFactory";
import { AudioService } from "../services/audio/AudioService";
import { AudioError } from "../services/audio/AudioError";
import { getFileImporter } from "../services/audio/FileImporterFactory";
import { getAudioMetadata } from "../utils/audioUtils";
import { getAudioExportService } from "../services/ffmpeg/AudioExportService";
import { getBitrate } from "../services/ffmpeg/audioQuality";
import { useTrackStore } from "../store/useTrackStore";
import { useSettingsStore } from "../store/useSettingsStore";
import type { AudioFormat } from "../types/audio";

export interface AudioControllerState {
  isRecording: boolean;
  isLoading: boolean;
  recordingDuration: number;
}

export interface AudioControllerActions {
  handleRecord: () => Promise<void>;
  handleStop: () => Promise<void>;
  handleImport: () => Promise<void>;
  handleSave: (
    filename: string,
    loopCount: number,
    fadeoutDuration: number,
  ) => Promise<{ success: boolean; message: string; warning?: string }>;
  handlePlay: (trackId: string) => Promise<void>;
  handlePause: (trackId: string) => Promise<void>;
  handleDelete: (trackId: string) => Promise<void>;
  handleVolumeChange: (trackId: string, volume: number) => Promise<void>;
  handleSpeedChange: (trackId: string, speed: number) => Promise<void>;
}

export interface UseAudioControllerReturn {
  state: AudioControllerState;
  actions: AudioControllerActions;
}

export function useAudioController(): UseAudioControllerReturn {
  const audioServiceRef = useRef<AudioService | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const handleStopRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Store actions
  const tracks = useTrackStore((state) => state.tracks);
  const addTrack = useTrackStore((state) => state.addTrack);
  const removeTrack = useTrackStore((state) => state.removeTrack);
  const updateTrack = useTrackStore((state) => state.updateTrack);
  const getMasterLoopDuration = useTrackStore(
    (state) => state.getMasterLoopDuration,
  );
  const hasMasterTrack = useTrackStore((state) => state.hasMasterTrack);

  // Settings
  const exportFormat = useSettingsStore((state) => state.exportFormat);
  const exportQuality = useSettingsStore((state) => state.exportQuality);
  const recordingFormat = useSettingsStore((state) => state.recordingFormat);
  const recordingQuality = useSettingsStore((state) => state.recordingQuality);

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

  const handleRecord = useCallback(async () => {
    if (!audioServiceRef.current) {
      Alert.alert("Error", "Audio service not initialized");
      return;
    }

    try {
      setIsLoading(true);

      const masterLoopDuration = getMasterLoopDuration();
      const isFirstTrackRecording = !hasMasterTrack();
      const bitRate = getBitrate(recordingFormat, recordingQuality);

      if (!isFirstTrackRecording) {
        const targetDuration = masterLoopDuration;

        await audioServiceRef.current.startRecording({
          maxDuration: targetDuration,
          format: recordingFormat as AudioFormat,
          bitRate,
        });

        recordingTimerRef.current = setTimeout(() => {
          handleStopRef.current();
        }, targetDuration);
      } else {
        await audioServiceRef.current.startRecording({
          format: recordingFormat as AudioFormat,
          bitRate,
        });
      }

      setIsRecording(true);
      setRecordingDuration(0);

      recordingIntervalRef.current = setInterval(() => {
        if (audioServiceRef.current) {
          const duration = audioServiceRef.current.getRecordingDuration();
          setRecordingDuration(duration);
        }
      }, 100);
    } catch (error) {
      if (error instanceof AudioError) {
        Alert.alert("Recording Error", error.userMessage);
      } else {
        Alert.alert("Error", "Failed to start recording");
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    getMasterLoopDuration,
    hasMasterTrack,
    recordingFormat,
    recordingQuality,
  ]);

  const handleStop = useCallback(async () => {
    if (!audioServiceRef.current) {
      Alert.alert("Error", "Audio service not initialized");
      return;
    }

    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    try {
      setIsLoading(true);
      const uri = await audioServiceRef.current.stopRecording();
      setIsRecording(false);
      setRecordingDuration(0);

      const duration = audioServiceRef.current.getRecordingDuration();

      const newTrack: Track = {
        id: `track-${Date.now()}`,
        name: `Recording ${tracks.length + 1}`,
        uri,
        duration,
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
        Alert.alert("Error", error.userMessage);
      } else {
        Alert.alert("Error", "Failed to stop recording");
      }
    } finally {
      setIsLoading(false);
    }
  }, [tracks.length, addTrack]);

  // Keep ref in sync with latest handleStop
  handleStopRef.current = handleStop;

  const handleImport = useCallback(async () => {
    if (!audioServiceRef.current) {
      Alert.alert("Error", "Audio service not initialized");
      return;
    }

    try {
      setIsLoading(true);

      const fileImporter = getFileImporter();
      const importedFile = await fileImporter.pickAudioFile();
      const metadata = await getAudioMetadata(importedFile.uri);

      const newTrack: Track = {
        id: `track-${Date.now()}`,
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
      // User cancelled - no alert needed
    } finally {
      setIsLoading(false);
    }
  }, [addTrack]);

  const handleSave = useCallback(
    async (filename: string, loopCount: number, fadeoutDuration: number) => {
      const selectedTracks = tracks.filter((track) => track.selected);

      if (selectedTracks.length < 1) {
        return {
          success: false,
          message: "Please select at least one track to save",
        };
      }

      setIsLoading(true);

      try {
        const audioExportService = getAudioExportService();
        await audioExportService.load();

        const mixTracks = selectedTracks.map((track) => ({
          uri: track.uri,
          speed: track.speed,
          volume: track.volume,
        }));

        const result = await audioExportService.mix({
          tracks: mixTracks,
          loopCount,
          fadeoutDuration,
          format: exportFormat,
          quality: exportQuality,
        });

        setIsLoading(false);

        const actualFormat = result.actualFormat;

        // Handle the result (Blob for web, URI for native)
        if (typeof result.data === "string") {
          return {
            success: true,
            message: `Mixed audio saved successfully!\n\nFile: ${filename}.${actualFormat}\n\nLocation: ${result.data}`,
            warning: result.formatFallbackWarning,
          };
        } else {
          // Web: trigger download
          const url = URL.createObjectURL(result.data);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${filename}.${actualFormat}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          return {
            success: true,
            message: `Mixed audio downloaded as ${filename}.${actualFormat} (${exportQuality} quality)`,
            warning: result.formatFallbackWarning,
          };
        }
      } catch (error) {
        setIsLoading(false);

        if (error instanceof AudioError) {
          return { success: false, message: error.userMessage };
        }
        const errorMessage = (error as Error).message || "Unknown error";
        return {
          success: false,
          message: `Failed to mix audio tracks: ${errorMessage}`,
        };
      }
    },
    [tracks, exportFormat, exportQuality],
  );

  const handlePlay = useCallback(
    async (trackId: string) => {
      if (!audioServiceRef.current) return;

      const track = tracks.find((t) => t.id === trackId);
      if (track?.isPlaying) return;

      try {
        await audioServiceRef.current.playTrack(trackId);
        updateTrack(trackId, { isPlaying: true });
      } catch (error) {
        if (error instanceof AudioError) {
          Alert.alert("Playback Error", error.userMessage);
        }
      }
    },
    [tracks, updateTrack],
  );

  const handlePause = useCallback(
    async (trackId: string) => {
      if (!audioServiceRef.current) return;

      try {
        await audioServiceRef.current.pauseTrack(trackId);
        updateTrack(trackId, { isPlaying: false });
      } catch (error) {
        if (error instanceof AudioError) {
          Alert.alert("Playback Error", error.userMessage);
        }
      }
    },
    [updateTrack],
  );

  const handleDelete = useCallback(
    async (trackId: string) => {
      if (!audioServiceRef.current) return;

      try {
        const isMaster = tracks.length > 0 && tracks[0].id === trackId;

        if (isMaster) {
          for (const track of tracks) {
            try {
              await audioServiceRef.current.unloadTrack(track.id);
            } catch {
              // Ignore unload errors
            }
          }
        } else {
          await audioServiceRef.current.unloadTrack(trackId);
        }

        removeTrack(trackId);
      } catch (error) {
        if (error instanceof AudioError) {
          Alert.alert("Delete Error", error.userMessage);
        }
      }
    },
    [tracks, removeTrack],
  );

  const handleVolumeChange = useCallback(
    async (trackId: string, volume: number) => {
      if (!audioServiceRef.current) return;

      try {
        await audioServiceRef.current.setTrackVolume(trackId, volume);
        updateTrack(trackId, { volume });
      } catch {
        // Ignore volume change errors
      }
    },
    [updateTrack],
  );

  const handleSpeedChange = useCallback(
    async (trackId: string, speed: number) => {
      if (!audioServiceRef.current) return;

      try {
        await audioServiceRef.current.setTrackSpeed(trackId, speed);
        updateTrack(trackId, { speed });
      } catch {
        // Ignore speed change errors
      }
    },
    [updateTrack],
  );

  return {
    state: {
      isRecording,
      isLoading,
      recordingDuration,
    },
    actions: {
      handleRecord,
      handleStop,
      handleImport,
      handleSave,
      handlePlay,
      handlePause,
      handleDelete,
      handleVolumeChange,
      handleSpeedChange,
    },
  };
}
