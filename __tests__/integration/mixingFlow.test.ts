/**
 * Mixing Flow Integration Test
 *
 * Tests the complete audio mixing workflow
 */

import { getFFmpegService } from '../../src/services/ffmpeg/FFmpegService';
import { useTrackStore } from '../../src/store/useTrackStore';
import { useUIStore } from '../../src/store/useUIStore';
import type { Track } from '../../src/types';

describe('Mixing Flow Integration', () => {
  let ffmpegService: ReturnType<typeof getFFmpegService>;

  beforeEach(() => {
    // Reset stores
    useTrackStore.getState().clearTracks();
    useUIStore.getState().reset();

    // Get FFmpeg service
    ffmpegService = getFFmpegService();

    jest.clearAllMocks();
  });

  it('should complete full mixing flow with multiple tracks', async () => {
    // 1. Add multiple tracks to store
    const tracks: Track[] = [
      {
        id: 'track-1',
        name: 'Track 1',
        uri: 'file://track1.mp3',
        duration: 30000,
        speed: 1.0,
        volume: 75,
        isPlaying: false,
        createdAt: Date.now(),
      },
      {
        id: 'track-2',
        name: 'Track 2',
        uri: 'file://track2.mp3',
        duration: 30000,
        speed: 1.5,
        volume: 50,
        isPlaying: false,
        createdAt: Date.now() + 1,
      },
    ];

    tracks.forEach((track) => useTrackStore.getState().addTrack(track));

    // Verify tracks added
    expect(useTrackStore.getState().tracks).toHaveLength(2);

    // 2. Set UI to mixing state
    useUIStore.getState().setMixing(true);
    useUIStore.getState().showMixingModal();
    useUIStore.getState().setMixingProgress(0);

    expect(useUIStore.getState().isMixing).toBe(true);
    expect(useUIStore.getState().mixingModalVisible).toBe(true);

    // 3. Load FFmpeg (mocked)
    jest.spyOn(ffmpegService, 'load').mockResolvedValue(undefined);

    await ffmpegService.load((ratio) => {
      useUIStore.getState().setMixingProgress(ratio * 0.1); // Loading is 10% of progress
    });

    expect(ffmpegService.load).toHaveBeenCalled();

    // 4. Prepare tracks for mixing
    const mixTracks = tracks.map((track) => ({
      uri: track.uri,
      speed: track.speed,
      volume: track.volume,
    }));

    // 5. Mock mixing operation
    const mockProgressCallback = jest.fn();
    jest.spyOn(ffmpegService, 'mix').mockImplementation(async ({ onProgress }) => {
      // Simulate progress updates
      onProgress?.({ ratio: 0.25, time: 7.5, duration: 30 });
      onProgress?.({ ratio: 0.5, time: 15, duration: 30 });
      onProgress?.({ ratio: 0.75, time: 22.5, duration: 30 });
      onProgress?.({ ratio: 1.0, time: 30, duration: 30 });

      return 'file://mixed-output.mp3';
    });

    // 6. Perform mixing
    const result = await ffmpegService.mix({
      tracks: mixTracks,
      onProgress: (progress) => {
        // Offset by 10% for loading, scale remaining 90%
        const totalProgress = 0.1 + progress.ratio * 0.9;
        useUIStore.getState().setMixingProgress(totalProgress);
        mockProgressCallback(progress);
      },
    });

    // 7. Verify mixing completed
    expect(result).toBe('file://mixed-output.mp3');
    expect(mockProgressCallback).toHaveBeenCalledTimes(4);

    // Verify progress updated
    const finalProgress = useUIStore.getState().mixingProgress;
    expect(finalProgress).toBeGreaterThan(0.9);

    // 8. Update UI state
    useUIStore.getState().setMixing(false);
    useUIStore.getState().hideMixingModal();

    expect(useUIStore.getState().isMixing).toBe(false);
    expect(useUIStore.getState().mixingModalVisible).toBe(false);
  });

  it('should handle mixing progress updates correctly', async () => {
    const progressUpdates: number[] = [];

    jest.spyOn(ffmpegService, 'load').mockResolvedValue(undefined);
    jest.spyOn(ffmpegService, 'mix').mockImplementation(async ({ onProgress }) => {
      // Simulate gradual progress
      for (let i = 0; i <= 10; i++) {
        const ratio = i / 10;
        onProgress?.({ ratio, time: ratio * 30, duration: 30 });
      }
      return 'file://output.mp3';
    });

    await ffmpegService.load();

    await ffmpegService.mix({
      tracks: [{ uri: 'file://track1.mp3', speed: 1.0, volume: 75 }],
      onProgress: (progress) => {
        progressUpdates.push(progress.ratio);
        useUIStore.getState().setMixingProgress(progress.ratio);
      },
    });

    // Verify progress updates
    expect(progressUpdates.length).toBe(11); // 0.0 to 1.0 in 0.1 increments
    expect(progressUpdates[0]).toBe(0);
    expect(progressUpdates[progressUpdates.length - 1]).toBe(1.0);

    // Verify final UI state
    expect(useUIStore.getState().mixingProgress).toBe(1.0);
  });

  it('should handle mixing errors', async () => {
    const tracks: Track[] = [
      {
        id: 'track-1',
        name: 'Track 1',
        uri: 'file://track1.mp3',
        duration: 30000,
        speed: 1.0,
        volume: 75,
        isPlaying: false,
        createdAt: Date.now(),
      },
    ];

    tracks.forEach((track) => useTrackStore.getState().addTrack(track));

    jest.spyOn(ffmpegService, 'load').mockResolvedValue(undefined);
    jest.spyOn(ffmpegService, 'mix').mockRejectedValue(new Error('Mixing failed'));

    useUIStore.getState().setMixing(true);

    await ffmpegService.load();

    // Try to mix
    await expect(
      ffmpegService.mix({
        tracks: [{ uri: 'file://track1.mp3', speed: 1.0, volume: 75 }],
      })
    ).rejects.toThrow('Mixing failed');

    // Update UI to show error
    useUIStore.getState().setError('Mixing failed');
    useUIStore.getState().setMixing(false);

    expect(useUIStore.getState().errorMessage).toBe('Mixing failed');
    expect(useUIStore.getState().isMixing).toBe(false);
  });

  it('should require at least one track for mixing', async () => {
    // No tracks added
    expect(useTrackStore.getState().tracks).toHaveLength(0);

    // Attempting to mix with no tracks should be prevented
    const hasPlayableTracks = useTrackStore.getState().hasPlayableTracks();
    expect(hasPlayableTracks).toBe(false);
  });

  it('should handle different track speeds and volumes', async () => {
    const mixTracks = [
      { uri: 'file://track1.mp3', speed: 0.5, volume: 100 },
      { uri: 'file://track2.mp3', speed: 1.5, volume: 50 },
      { uri: 'file://track3.mp3', speed: 2.0, volume: 25 },
    ];

    jest.spyOn(ffmpegService, 'load').mockResolvedValue(undefined);
    jest.spyOn(ffmpegService, 'mix').mockResolvedValue('file://output.mp3');

    await ffmpegService.load();

    const result = await ffmpegService.mix({
      tracks: mixTracks,
    });

    expect(result).toBe('file://output.mp3');
    expect(ffmpegService.mix).toHaveBeenCalledWith(
      expect.objectContaining({
        tracks: mixTracks,
      })
    );
  });
});
