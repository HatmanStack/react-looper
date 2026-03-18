/**
 * useTrackPlayback Hook
 *
 * Manages playback orchestration: play/pause per track, volume changes,
 * speed changes, track selection, track deletion, and the speed/delete
 * confirmation dialog logic for the master track.
 */

import { useState, useCallback } from "react";
import { Alert } from "../utils/alert";
import { AudioService } from "../services/audio/AudioService";
import { AudioError } from "../services/audio/AudioError";
import type { Track } from "../types";
import { logger } from "../utils/logger";

export interface UseTrackPlaybackOptions {
  audioService: AudioService | null;
  tracks: Track[];
  updateTrack: (id: string, updates: Partial<Track>) => void;
  removeTrack: (id: string) => void;
}

export interface UseTrackPlaybackReturn {
  handlePlay: (trackId: string) => Promise<void>;
  handlePause: (trackId: string) => Promise<void>;
  handleDelete: (trackId: string) => Promise<void>;
  handleVolumeChange: (trackId: string, volume: number) => Promise<void>;
  handleSpeedChange: (trackId: string, speed: number) => Promise<void>;
  handleSelect: (trackId: string) => void;
  speedConfirmationVisible: boolean;
  handleSpeedChangeConfirm: () => void;
  handleSpeedChangeCancel: () => void;
  deleteConfirmationVisible: boolean;
  handleDeleteConfirm: () => Promise<void>;
  handleDeleteCancel: () => void;
}

export function useTrackPlayback(
  options: UseTrackPlaybackOptions,
): UseTrackPlaybackReturn {
  const { audioService, tracks, updateTrack, removeTrack } = options;

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

  const handlePlay = useCallback(
    async (trackId: string) => {
      if (!audioService) return;

      const track = tracks.find((t) => t.id === trackId);
      if (track?.isPlaying) return;

      try {
        await audioService.playTrack(trackId);
        updateTrack(trackId, { isPlaying: true });
      } catch (error) {
        if (error instanceof AudioError) {
          Alert.alert("Playback Error", error.userMessage);
        }
      }
    },
    [audioService, tracks, updateTrack],
  );

  const handlePause = useCallback(
    async (trackId: string) => {
      if (!audioService) return;

      try {
        await audioService.pauseTrack(trackId);
        updateTrack(trackId, { isPlaying: false });
      } catch (error) {
        if (error instanceof AudioError) {
          Alert.alert("Playback Error", error.userMessage);
        }
      }
    },
    [audioService, updateTrack],
  );

  const performDelete = useCallback(
    async (trackId: string) => {
      if (!audioService) return;

      try {
        const isMaster = tracks.length > 0 && tracks[0].id === trackId;

        if (isMaster) {
          // If deleting master track, unload ALL tracks since store will clear all
          for (const track of tracks) {
            try {
              await audioService.unloadTrack(track.id);
            } catch (error) {
              logger.error(
                `[useTrackPlayback] Failed to unload track ${track.id}:`,
                error,
              );
            }
          }
        } else {
          await audioService.unloadTrack(trackId);
        }

        removeTrack(trackId);
      } catch (error) {
        if (error instanceof AudioError) {
          Alert.alert("Delete Error", error.userMessage);
        }
      }
    },
    [audioService, tracks, removeTrack],
  );

  const handleDelete = useCallback(
    async (trackId: string) => {
      if (!audioService) return;

      const isMasterTrack = tracks.length > 0 && tracks[0].id === trackId;

      if (isMasterTrack) {
        setPendingDeletion(trackId);
        setDeleteConfirmationVisible(true);
        return;
      }

      await performDelete(trackId);
    },
    [audioService, tracks, performDelete],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (pendingDeletion) {
      await performDelete(pendingDeletion);
      setPendingDeletion(null);
    }
    setDeleteConfirmationVisible(false);
  }, [pendingDeletion, performDelete]);

  const handleDeleteCancel = useCallback(() => {
    setPendingDeletion(null);
    setDeleteConfirmationVisible(false);
  }, []);

  const handleVolumeChange = useCallback(
    async (trackId: string, volume: number) => {
      if (!audioService) return;

      try {
        await audioService.setTrackVolume(trackId, volume);
        updateTrack(trackId, { volume });
      } catch (error) {
        logger.error("[useTrackPlayback] Volume change failed:", error);
      }
    },
    [audioService, updateTrack],
  );

  const applySpeedChange = useCallback(
    async (trackId: string, speed: number) => {
      if (!audioService) return;

      try {
        await audioService.setTrackSpeed(trackId, speed);
        updateTrack(trackId, { speed });
      } catch (error) {
        logger.error("[useTrackPlayback] Speed change failed:", error);
      }
    },
    [audioService, updateTrack],
  );

  const handleSpeedChange = useCallback(
    async (trackId: string, speed: number) => {
      if (!audioService) return;

      const isMasterTrack = tracks.length > 0 && tracks[0].id === trackId;
      const hasOtherTracks = tracks.length > 1;

      if (isMasterTrack && hasOtherTracks) {
        setPendingSpeedChange({ trackId, speed });
        setSpeedConfirmationVisible(true);
        return;
      }

      await applySpeedChange(trackId, speed);
    },
    [audioService, tracks, applySpeedChange],
  );

  const handleSpeedChangeConfirm = useCallback(() => {
    if (pendingSpeedChange) {
      applySpeedChange(pendingSpeedChange.trackId, pendingSpeedChange.speed);
      setPendingSpeedChange(null);
    }
    setSpeedConfirmationVisible(false);
  }, [pendingSpeedChange, applySpeedChange]);

  const handleSpeedChangeCancel = useCallback(() => {
    setPendingSpeedChange(null);
    setSpeedConfirmationVisible(false);
  }, []);

  const handleSelect = useCallback(
    (trackId: string) => {
      const track = tracks.find((t) => t.id === trackId);
      if (track) {
        updateTrack(trackId, { selected: !track.selected });
      }
    },
    [tracks, updateTrack],
  );

  return {
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
  };
}
