/**
 * useRecordingSession Hook
 *
 * Manages the recording lifecycle: starting/stopping recording,
 * recording timer management, duration tracking, and auto-stop
 * logic for subsequent tracks.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Alert } from "../utils/alert";
import { AudioService } from "../services/audio/AudioService";
import { AudioError } from "../services/audio/AudioError";
import { getBitrate } from "../services/ffmpeg/audioQuality";
import type {
  AudioFormat as ExportAudioFormat,
  QualityLevel,
} from "../services/ffmpeg/exportTypes";
import { AudioFormat } from "../types/audio";
import type { Track } from "../types";
import { logger } from "../utils/logger";

export interface UseRecordingSessionOptions {
  audioService: AudioService | null;
  tracks: Track[];
  getMasterLoopDuration: () => number;
  hasMasterTrack: () => boolean;
  recordingFormat: string;
  recordingQuality: string;
  onTrackRecorded: (track: Track) => Promise<void>;
}

export interface UseRecordingSessionReturn {
  isRecording: boolean;
  recordingDuration: number;
  handleRecord: () => Promise<void>;
  handleStop: () => Promise<void>;
}

export function useRecordingSession(
  options: UseRecordingSessionOptions,
): UseRecordingSessionReturn {
  const {
    audioService,
    tracks,
    getMasterLoopDuration,
    hasMasterTrack,
    recordingFormat,
    recordingQuality,
    onTrackRecorded,
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use ref for handleStop to avoid stale closure in setTimeout
  const handleStopRef = useRef<() => Promise<void>>(undefined);

  const handleStop = useCallback(async () => {
    if (!audioService) {
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
      // Capture duration BEFORE stopRecording() resets the internal state
      const duration = audioService.getRecordingDuration();
      logger.log(
        `[useRecordingSession] Stopping recording, captured duration: ${duration}ms`,
      );

      const uri = await audioService.stopRecording();
      setIsRecording(false);
      setRecordingDuration(0);

      // Create new track
      const newTrack: Track = {
        id: crypto.randomUUID(),
        name: `Recording ${tracks.length + 1}`,
        uri,
        duration,
        speed: 1.0,
        volume: 75,
        isPlaying: false,
        selected: true,
        createdAt: Date.now(),
      };

      await onTrackRecorded(newTrack);
    } catch (error) {
      if (error instanceof AudioError) {
        Alert.alert("Error", error.userMessage);
      } else {
        Alert.alert("Error", "Failed to stop recording");
      }
    }
  }, [audioService, tracks.length, onTrackRecorded]);

  // Keep ref in sync — wrapped in useEffect to avoid ref assignment during render
  useEffect(() => {
    handleStopRef.current = handleStop;
  });

  const handleRecord = useCallback(async () => {
    if (!audioService) {
      Alert.alert("Error", "Audio service not initialized");
      return;
    }

    try {
      const masterLoopDuration = getMasterLoopDuration();
      const isFirstTrackRecording = !hasMasterTrack();

      logger.log(
        `[useRecordingSession] handleRecord called: isFirstTrack=${isFirstTrackRecording}, masterLoopDuration=${masterLoopDuration}, trackCount=${tracks.length}`,
      );

      // Convert quality level to bitrate
      const bitRate = getBitrate(
        recordingFormat as ExportAudioFormat,
        recordingQuality as QualityLevel,
      );

      // Start recording with auto-stop timer for subsequent tracks
      if (!isFirstTrackRecording) {
        const targetDuration = masterLoopDuration;
        logger.log(
          `[useRecordingSession] Starting subsequent recording: masterLoopDuration=${masterLoopDuration}ms, targetDuration=${targetDuration}ms`,
        );

        // Sanity check: don't set up auto-stop if duration is invalid
        if (targetDuration < 500) {
          logger.error(
            `[useRecordingSession] Invalid targetDuration (${targetDuration}ms), treating as first track recording`,
          );
          await audioService.startRecording({
            format: recordingFormat as AudioFormat,
            bitRate,
          });
        } else {
          await audioService.startRecording({
            format: recordingFormat as AudioFormat,
            bitRate,
          });

          // Set up auto-stop timer
          logger.log(
            `[useRecordingSession] Setting auto-stop timer for ${targetDuration}ms`,
          );
          recordingTimerRef.current = setTimeout(() => {
            logger.log(`[useRecordingSession] Auto-stop timer fired`);
            handleStopRef.current?.();
          }, targetDuration);
        }
      } else {
        // First track - no auto-stop
        await audioService.startRecording({
          format: recordingFormat as AudioFormat,
          bitRate,
        });
      }

      setIsRecording(true);
      setRecordingDuration(0);

      // Start interval to update recording duration display
      recordingIntervalRef.current = setInterval(() => {
        if (audioService) {
          const duration = audioService.getRecordingDuration();
          setRecordingDuration(duration);
        }
      }, 100);
    } catch (error) {
      if (error instanceof AudioError) {
        Alert.alert("Recording Error", error.userMessage);
      } else {
        Alert.alert("Error", "Failed to start recording");
      }
    }
  }, [
    audioService,
    tracks.length,
    getMasterLoopDuration,
    hasMasterTrack,
    recordingFormat,
    recordingQuality,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  return {
    isRecording,
    recordingDuration,
    handleRecord,
    handleStop,
  };
}
