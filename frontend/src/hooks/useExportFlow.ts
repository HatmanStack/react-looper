/**
 * useExportFlow Hook
 *
 * Manages the export/save flow: save modal lifecycle, FFmpeg mixing
 * invocation, and platform-specific file download.
 */

import { useState, useCallback } from "react";
import { Alert } from "../utils/alert";
import { AudioError } from "../services/audio/AudioError";
import { getAudioExportService } from "../services/ffmpeg/AudioExportService";
import type { AudioFormat, QualityLevel } from "../services/ffmpeg/exportTypes";
import { downloadBlob } from "../utils/downloadFile";
import type { Track } from "../types";

export interface UseExportFlowOptions {
  tracks: Track[];
  exportFormat: string;
  exportQuality: string;
  loopCrossfadeDuration: number;
}

export interface UseExportFlowReturn {
  isExporting: boolean;
  saveModalVisible: boolean;
  handleSave: () => void;
  handleSaveModalDismiss: () => void;
  handleSaveModalSave: (
    filename: string,
    loopCount: number,
    fadeoutDuration: number,
  ) => Promise<void>;
}

export function useExportFlow(
  options: UseExportFlowOptions,
): UseExportFlowReturn {
  const { tracks, exportFormat, exportQuality, loopCrossfadeDuration } =
    options;

  const [isExporting, setIsExporting] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);

  const handleSave = useCallback(() => {
    setSaveModalVisible(true);
  }, []);

  const handleSaveModalDismiss = useCallback(() => {
    setSaveModalVisible(false);
  }, []);

  const handleSaveModalSave = useCallback(
    async (filename: string, loopCount: number, fadeoutDuration: number) => {
      // Filter only selected tracks
      const selectedTracks = tracks.filter((track) => track.selected);

      if (selectedTracks.length < 1) {
        Alert.alert("Error", "Please select at least one track to save");
        return;
      }

      setSaveModalVisible(false);
      setIsExporting(true);

      try {
        // Get FFmpeg service
        const audioExportService = getAudioExportService();

        // Ensure FFmpeg is loaded
        await audioExportService.load();

        // Prepare tracks for mixing
        const mixTracks = selectedTracks.map((track) => ({
          uri: track.uri,
          speed: track.speed,
          volume: track.volume,
        }));

        // Mix tracks with loop, fadeout, format, quality, and crossfade options
        const result = await audioExportService.mix({
          tracks: mixTracks,
          loopCount,
          fadeoutDuration,
          format: exportFormat as AudioFormat,
          quality: exportQuality as QualityLevel,
          crossfadeDuration: loopCrossfadeDuration,
        });

        setIsExporting(false);

        // Use actual format from result (may differ if fallback occurred)
        const actualFormat = result.actualFormat;

        // Handle the result (Blob for web, URI for native)
        if (typeof result.data === "string") {
          // Native: result is a file URI — show actual path, not user-supplied name
          Alert.alert(
            "Success",
            `Mixed audio saved successfully!\n\nLocation: ${result.data}`,
            [{ text: "OK" }],
          );
        } else {
          // Web: result is a Blob
          downloadBlob(result.data as Blob, `${filename}.${actualFormat}`);

          Alert.alert(
            "Success",
            `Mixed audio downloaded as ${filename}.${actualFormat} (${exportQuality} quality)`,
          );
        }
      } catch (error) {
        setIsExporting(false);

        if (error instanceof AudioError) {
          Alert.alert("Mixing Error", error.userMessage);
        } else {
          const errorMessage = (error as Error).message || "Unknown error";
          Alert.alert("Error", `Failed to mix audio tracks: ${errorMessage}`);
        }
      }
    },
    [tracks, exportFormat, exportQuality, loopCrossfadeDuration],
  );

  return {
    isExporting,
    saveModalVisible,
    handleSave,
    handleSaveModalDismiss,
    handleSaveModalSave,
  };
}
