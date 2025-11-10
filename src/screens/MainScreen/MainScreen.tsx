/**
 * MainScreen Component
 *
 * Main screen layout for the Looper app with three sections:
 * - Top controls: Record and Stop buttons
 * - Middle section: Track list with FlatList
 * - Bottom controls: Import Audio and Save buttons
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Alert } from 'react-native';
import { Surface, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrackList } from '@components/TrackList';
import { ActionButton } from '@components/ActionButton';
import { SaveModal } from '@components/SaveModal';
import { MixingProgress } from '@components/MixingProgress';
import type { Track } from '../../types';
import { styles } from './MainScreen.styles';
import { initializeAudioServices } from '../../services/audio/initialize';
import { getAudioService } from '../../services/audio/AudioServiceFactory';
import { AudioService } from '../../services/audio/AudioService';
import { AudioError } from '../../services/audio/AudioError';
import { getFileImporter } from '../../services/audio/FileImporterFactory';
import { getAudioMetadata } from '../../utils/audioUtils';
import { getFFmpegService } from '../../services/ffmpeg/FFmpegService';
import type { MixingProgress as MixingProgressType } from '../../services/ffmpeg/types';

// Initialize audio services for current platform
initializeAudioServices();

export const MainScreen: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMixing, setIsMixing] = useState(false);
  const [mixingProgress, setMixingProgress] = useState<MixingProgressType>({
    ratio: 0,
    time: 0,
    duration: 0,
  });
  const audioServiceRef = useRef<AudioService | null>(null);

  // Initialize AudioService
  useEffect(() => {
    try {
      audioServiceRef.current = getAudioService();
      console.log('[MainScreen] AudioService initialized');
    } catch (error) {
      console.error('[MainScreen] Failed to initialize AudioService:', error);
      if (error instanceof AudioError) {
        Alert.alert('Error', error.userMessage);
      }
    }

    return () => {
      // Cleanup on unmount
      if (audioServiceRef.current) {
        audioServiceRef.current.cleanup();
      }
    };
  }, []);

  const handleRecord = async () => {
    if (!audioServiceRef.current) {
      Alert.alert('Error', 'Audio service not initialized');
      return;
    }

    try {
      setIsLoading(true);
      await audioServiceRef.current.startRecording();
      setIsRecording(true);
      console.log('[MainScreen] Recording started');
    } catch (error) {
      console.error('[MainScreen] Recording failed:', error);
      if (error instanceof AudioError) {
        Alert.alert('Recording Error', error.userMessage);
      } else {
        Alert.alert('Error', 'Failed to start recording');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (!audioServiceRef.current) {
      Alert.alert('Error', 'Audio service not initialized');
      return;
    }

    try {
      setIsLoading(true);
      const uri = await audioServiceRef.current.stopRecording();
      setIsRecording(false);

      // Create new track
      const newTrack: Track = {
        id: `track-${Date.now()}`,
        name: `Recording ${tracks.length + 1}`,
        uri,
        duration: audioServiceRef.current.getRecordingDuration(),
        speed: 1.0,
        volume: 75,
        isPlaying: false,
        createdAt: Date.now(),
      };

      // Load track for playback
      await audioServiceRef.current.loadTrack(newTrack.id, newTrack.uri, {
        speed: newTrack.speed,
        volume: newTrack.volume,
        loop: true,
      });

      setTracks((prevTracks) => [...prevTracks, newTrack]);
      console.log('[MainScreen] Recording stopped and track added:', newTrack.name);
    } catch (error) {
      console.error('[MainScreen] Stop recording failed:', error);
      if (error instanceof AudioError) {
        Alert.alert('Error', error.userMessage);
      } else {
        Alert.alert('Error', 'Failed to stop recording');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!audioServiceRef.current) {
      Alert.alert('Error', 'Audio service not initialized');
      return;
    }

    try {
      setIsLoading(true);
      console.log('[MainScreen] Starting file import...');

      // Get the file importer for current platform
      const fileImporter = getFileImporter();
      const importedFile = await fileImporter.pickAudioFile();

      console.log('[MainScreen] File imported:', importedFile.name);

      // Get audio metadata
      const metadata = await getAudioMetadata(importedFile.uri);

      // Create new track
      const newTrack: Track = {
        id: `track-${Date.now()}`,
        name: importedFile.name.replace(/\.[^/.]+$/, ''), // Remove extension
        uri: importedFile.uri,
        duration: metadata.duration,
        speed: 1.0,
        volume: 75,
        isPlaying: false,
        createdAt: Date.now(),
      };

      // Load track for playback
      await audioServiceRef.current.loadTrack(newTrack.id, newTrack.uri, {
        speed: newTrack.speed,
        volume: newTrack.volume,
        loop: true,
      });

      setTracks((prevTracks) => [...prevTracks, newTrack]);
      console.log('[MainScreen] Imported track added:', newTrack.name);
    } catch (error) {
      console.error('[MainScreen] Import failed:', error);
      if (error instanceof AudioError) {
        Alert.alert('Import Error', error.userMessage);
      } else {
        // User cancelled
        console.log('[MainScreen] Import cancelled by user');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    console.log('Save button pressed');
    setSaveModalVisible(true);
  };

  const handleSaveModalDismiss = () => {
    setSaveModalVisible(false);
  };

  const handleSaveModalSave = async (filename: string) => {
    if (tracks.length < 1) {
      Alert.alert('Error', 'Please add at least one track to mix');
      return;
    }

    setSaveModalVisible(false);
    setIsMixing(true);
    setMixingProgress({ ratio: 0, time: 0, duration: 0 });

    try {
      console.log(`[MainScreen] Starting mix for ${tracks.length} tracks...`);

      // Get FFmpeg service
      const ffmpegService = getFFmpegService();

      // Ensure FFmpeg is loaded (especially important for web)
      await ffmpegService.load((ratio) => {
        setMixingProgress((prev) => ({ ...prev, ratio: ratio * 0.1 })); // Loading is 10% of progress
      });

      // Prepare tracks for mixing
      const mixTracks = tracks.map((track) => ({
        uri: track.uri,
        speed: track.speed,
        volume: track.volume,
      }));

      // Mix tracks with progress callback
      const result = await ffmpegService.mix({
        tracks: mixTracks,
        onProgress: (progress) => {
          // Offset by 10% for loading, scale remaining 90%
          setMixingProgress({
            ratio: 0.1 + progress.ratio * 0.9,
            time: progress.time,
            duration: progress.duration,
          });
        },
      });

      setIsMixing(false);

      console.log('[MainScreen] Mixing complete');

      // Handle the result (Blob for web, URI for native)
      if (typeof result === 'string') {
        // Native: result is a file URI
        Alert.alert(
          'Success',
          `Mixed audio saved successfully!\n\nFile: ${filename}.mp3\n\nLocation: ${result}`,
          [{ text: 'OK' }]
        );
      } else {
        // Web: result is a Blob
        // Create download link
        const url = URL.createObjectURL(result);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        Alert.alert('Success', `Mixed audio downloaded as ${filename}.mp3`);
      }
    } catch (error) {
      setIsMixing(false);
      console.error('[MainScreen] Mixing failed:', error);

      if (error instanceof AudioError) {
        Alert.alert('Mixing Error', error.userMessage);
      } else {
        Alert.alert('Error', 'Failed to mix audio tracks');
      }
    }
  };

  const handleCancelMixing = () => {
    // TODO: Implement cancellation if FFmpegService supports it
    console.log('[MainScreen] Mixing cancellation requested');
    Alert.alert('Cannot Cancel', 'Mixing cannot be cancelled once started');
  };

  const handlePlay = async (trackId: string) => {
    if (!audioServiceRef.current) {
      return;
    }

    try {
      await audioServiceRef.current.playTrack(trackId);

      // Update track state
      setTracks((prevTracks) =>
        prevTracks.map((track) => (track.id === trackId ? { ...track, isPlaying: true } : track))
      );

      console.log(`[MainScreen] Playing track: ${trackId}`);
    } catch (error) {
      console.error('[MainScreen] Play failed:', error);
      if (error instanceof AudioError) {
        Alert.alert('Playback Error', error.userMessage);
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
        prevTracks.map((track) => (track.id === trackId ? { ...track, isPlaying: false } : track))
      );

      console.log(`[MainScreen] Paused track: ${trackId}`);
    } catch (error) {
      console.error('[MainScreen] Pause failed:', error);
      if (error instanceof AudioError) {
        Alert.alert('Playback Error', error.userMessage);
      }
    }
  };

  const handleDelete = async (trackId: string) => {
    if (!audioServiceRef.current) {
      return;
    }

    try {
      // Unload and delete track
      await audioServiceRef.current.unloadTrack(trackId);

      setTracks((prevTracks) => prevTracks.filter((track) => track.id !== trackId));

      console.log(`[MainScreen] Deleted track: ${trackId}`);
    } catch (error) {
      console.error('[MainScreen] Delete failed:', error);
      if (error instanceof AudioError) {
        Alert.alert('Delete Error', error.userMessage);
      }
    }
  };

  const handleVolumeChange = async (trackId: string, volume: number) => {
    if (!audioServiceRef.current) {
      return;
    }

    try {
      await audioServiceRef.current.setTrackVolume(trackId, volume);

      // Update track state
      setTracks((prevTracks) =>
        prevTracks.map((track) => (track.id === trackId ? { ...track, volume } : track))
      );

      console.log(`[MainScreen] Volume changed for track ${trackId}: ${volume}`);
    } catch (error) {
      console.error('[MainScreen] Volume change failed:', error);
    }
  };

  const handleSpeedChange = async (trackId: string, speed: number) => {
    if (!audioServiceRef.current) {
      return;
    }

    try {
      await audioServiceRef.current.setTrackSpeed(trackId, speed);

      // Update track state
      setTracks((prevTracks) =>
        prevTracks.map((track) => (track.id === trackId ? { ...track, speed } : track))
      );

      console.log(`[MainScreen] Speed changed for track ${trackId}: ${speed}`);
    } catch (error) {
      console.error('[MainScreen] Speed change failed:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Top Controls */}
        <Surface
          style={styles.topControls}
          elevation={0}
          accessibilityRole="toolbar"
          accessibilityLabel="Recording controls"
        >
          <ActionButton
            label={isRecording ? 'Recording...' : 'Record'}
            icon="microphone"
            onPress={handleRecord}
            disabled={isRecording || isLoading}
            accessibilityLabel={isRecording ? 'Recording in progress' : 'Record audio'}
            accessibilityHint="Start recording a new audio track"
          />
          <ActionButton
            label="Stop"
            icon="stop"
            onPress={handleStop}
            disabled={!isRecording || isLoading}
            accessibilityHint="Stop recording and save track"
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

        {/* Mixing Progress Modal */}
        <MixingProgress
          visible={isMixing}
          progress={mixingProgress.ratio}
          currentTime={mixingProgress.time}
          totalDuration={mixingProgress.duration}
          onCancel={handleCancelMixing}
        />

        {/* Loading Indicator */}
        {isLoading && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
            accessibilityLabel="Loading"
            accessibilityLiveRegion="polite"
            accessibilityRole="progressbar"
          >
            <ActivityIndicator
              size="large"
              color="#BB86FC"
              accessibilityLabel="Loading, please wait"
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};
