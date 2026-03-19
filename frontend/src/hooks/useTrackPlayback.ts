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
import {
  calculateSyncSpeed,
  calculateSpeedAdjustedDuration,
  MIN_SPEED,
  MAX_SPEED,
} from "../utils/loopUtils";

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
  handleSyncSelect: (trackId: string, multiplier: number) => Promise<void>;
  handleSyncClear: (trackId: string) => void;
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

      // Clear sync binding when speed is manually changed on a non-master track
      updateTrack(trackId, { syncMultiplier: null });
      await applySpeedChange(trackId, speed);
    },
    [audioService, tracks, applySpeedChange, updateTrack],
  );

  const handleSpeedChangeConfirm = useCallback(() => {
    if (pendingSpeedChange) {
      void applySpeedChange(
        pendingSpeedChange.trackId,
        pendingSpeedChange.speed,
      );

      // Auto-resync all synced non-master tracks
      const masterTrack = tracks[0];
      if (masterTrack) {
        const newMasterLoopDuration = calculateSpeedAdjustedDuration(
          masterTrack.duration,
          pendingSpeedChange.speed,
        );

        for (let i = 1; i < tracks.length; i++) {
          const track = tracks[i];
          if (track.syncMultiplier != null) {
            const newSyncSpeed = calculateSyncSpeed(
              track.duration,
              newMasterLoopDuration,
              track.syncMultiplier,
            );

            if (newSyncSpeed >= MIN_SPEED && newSyncSpeed <= MAX_SPEED) {
              void applySpeedChange(track.id, newSyncSpeed);
            } else {
              // Speed out of range -- break sync gracefully
              updateTrack(track.id, { syncMultiplier: null });
            }
          }
        }
      }

      setPendingSpeedChange(null);
    }
    setSpeedConfirmationVisible(false);
  }, [pendingSpeedChange, applySpeedChange, tracks, updateTrack]);

  const handleSpeedChangeCancel = useCallback(() => {
    setPendingSpeedChange(null);
    setSpeedConfirmationVisible(false);
  }, []);

  const handleSyncSelect = useCallback(
    async (trackId: string, multiplier: number) => {
      const track = tracks.find((t) => t.id === trackId);
      if (!track || !audioService) return;

      const masterTrack = tracks[0];
      if (!masterTrack) return;

      const masterLoopDuration = calculateSpeedAdjustedDuration(
        masterTrack.duration,
        masterTrack.speed ?? 1.0,
      );

      const syncSpeed = calculateSyncSpeed(
        track.duration,
        masterLoopDuration,
        multiplier,
      );

      await applySpeedChange(trackId, syncSpeed);
      updateTrack(trackId, { syncMultiplier: multiplier });
    },
    [audioService, tracks, applySpeedChange, updateTrack],
  );

  const handleSyncClear = useCallback(
    (trackId: string) => {
      updateTrack(trackId, { syncMultiplier: null });
    },
    [updateTrack],
  );

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
    handleSyncSelect,
    handleSyncClear,
  };
}
