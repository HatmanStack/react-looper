/**
 * Recording Flow Integration Test
 *
 * Tests the complete recording workflow from start to track addition
 */

import { AudioService } from "../../src/services/audio/AudioService";
import { getAudioService } from "../../src/services/audio/AudioServiceFactory";
import { useTrackStore } from "../../src/store/useTrackStore";
import { usePlaybackStore } from "../../src/store/usePlaybackStore";
import type { Track } from "../../src/types";

describe("Recording Flow Integration", () => {
  let audioService: AudioService;

  beforeEach(() => {
    // Reset stores
    useTrackStore.getState().clearTracks();
    usePlaybackStore.getState().reset();

    // Get audio service
    audioService = getAudioService();
  });

  afterEach(() => {
    audioService?.cleanup();
  });

  it("should complete full recording flow", async () => {
    // 1. Start recording
    await audioService.startRecording();

    // Verify recording started
    const recorder = (audioService as any).recorder;
    expect(recorder).toBeDefined();

    // 2. Simulate recording time (2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 3. Stop recording
    const recordingUri = await audioService.stopRecording();

    // Verify recording URI returned
    expect(recordingUri).toBeDefined();
    expect(typeof recordingUri).toBe("string");

    // 4. Get recording duration
    const duration = audioService.getRecordingDuration();
    expect(duration).toBeGreaterThanOrEqual(0);

    // 5. Create track from recording
    const track: Track = {
      id: `track-${Date.now()}`,
      name: "Test Recording",
      uri: recordingUri,
      duration,
      speed: 1.0,
      volume: 75,
      isPlaying: false,
      createdAt: Date.now(),
    };

    // 6. Add track to store
    useTrackStore.getState().addTrack(track);

    // 7. Verify track added
    const tracks = useTrackStore.getState().tracks;
    expect(tracks).toHaveLength(1);
    expect(tracks[0].name).toBe("Test Recording");

    // 8. Load track for playback
    await audioService.loadTrack(track.id, track.uri, {
      speed: track.speed,
      volume: track.volume,
      loop: true,
    });

    // 9. Initialize playback state
    usePlaybackStore.getState().addTrack(track.id, {
      speed: track.speed,
      volume: track.volume,
      isLooping: true,
      isPlaying: false,
    });

    // Verify playback state
    const playbackState = usePlaybackStore.getState().getTrackState(track.id);
    expect(playbackState).toBeDefined();
    expect(playbackState?.speed).toBe(1.0);
    expect(playbackState?.volume).toBe(75);
  });

  it("should handle recording cancellation", async () => {
    await audioService.startRecording();

    // Stop immediately
    const uri = await audioService.stopRecording();

    // Should still return a URI even for very short recording
    expect(uri).toBeDefined();
  });

  it("should handle multiple recordings sequentially", async () => {
    // First recording
    await audioService.startRecording();
    const uri1 = await audioService.stopRecording();

    const track1: Track = {
      id: "track-1",
      name: "Recording 1",
      uri: uri1,
      duration: audioService.getRecordingDuration(),
      speed: 1.0,
      volume: 75,
      isPlaying: false,
      createdAt: Date.now(),
    };

    useTrackStore.getState().addTrack(track1);

    // Second recording
    await audioService.startRecording();
    const uri2 = await audioService.stopRecording();

    const track2: Track = {
      id: "track-2",
      name: "Recording 2",
      uri: uri2,
      duration: audioService.getRecordingDuration(),
      speed: 1.0,
      volume: 75,
      isPlaying: false,
      createdAt: Date.now() + 1,
    };

    useTrackStore.getState().addTrack(track2);

    // Verify both tracks added
    const tracks = useTrackStore.getState().tracks;
    expect(tracks).toHaveLength(2);
    expect(tracks[0].name).toBe("Recording 1");
    expect(tracks[1].name).toBe("Recording 2");
  });

  it("should handle recording errors gracefully", async () => {
    // Try to stop without starting
    await expect(audioService.stopRecording()).rejects.toThrow();

    // Verify no tracks added on error
    const tracks = useTrackStore.getState().tracks;
    expect(tracks).toHaveLength(0);
  });

  it("should prevent simultaneous recordings", async () => {
    await audioService.startRecording();

    // Try to start again while recording
    await expect(audioService.startRecording()).rejects.toThrow();

    // Cleanup
    await audioService.stopRecording();
  });
});
