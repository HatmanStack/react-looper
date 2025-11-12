/**
 * Import Flow Integration Test
 *
 * Tests the complete file import workflow
 */

import { getFileImporter } from "../../src/services/audio/FileImporterFactory";
import { getAudioService } from "../../src/services/audio/AudioServiceFactory";
import { useTrackStore } from "../../src/store/useTrackStore";
import { usePlaybackStore } from "../../src/store/usePlaybackStore";
import type { Track } from "../../src/types";
import { getAudioMetadata } from "../../src/utils/audioUtils";

// Mock audio metadata utility
jest.mock("../../src/utils/audioUtils", () => ({
  getAudioMetadata: jest.fn().mockResolvedValue({
    duration: 60000, // 60 seconds
  }),
}));

describe("Import Flow Integration", () => {
  let audioService: ReturnType<typeof getAudioService>;
  let fileImporter: ReturnType<typeof getFileImporter>;

  beforeEach(() => {
    // Reset stores
    useTrackStore.getState().clearTracks();
    usePlaybackStore.getState().reset();

    // Get services
    audioService = getAudioService();
    fileImporter = getFileImporter();

    jest.clearAllMocks();
  });

  afterEach(() => {
    audioService?.cleanup();
  });

  it("should complete full import flow", async () => {
    // Mock file picker to return a file
    jest.spyOn(fileImporter, "pickAudioFile").mockResolvedValue({
      uri: "file://imported-audio.mp3",
      name: "imported-audio.mp3",
      size: 1024000,
      type: "audio/mpeg",
    });

    // 1. Pick audio file
    const importedFile = await fileImporter.pickAudioFile();

    expect(importedFile).toBeDefined();
    expect(importedFile.uri).toBe("file://imported-audio.mp3");
    expect(importedFile.name).toBe("imported-audio.mp3");

    // 2. Get audio metadata
    const metadata = await getAudioMetadata(importedFile.uri);

    expect(metadata.duration).toBe(60000);

    // 3. Create track
    const track: Track = {
      id: `track-${Date.now()}`,
      name: importedFile.name.replace(/\.[^/.]+$/, ""), // Remove extension
      uri: importedFile.uri,
      duration: metadata.duration,
      speed: 1.0,
      volume: 75,
      isPlaying: false,
      createdAt: Date.now(),
    };

    // 4. Add to store
    useTrackStore.getState().addTrack(track);

    // 5. Verify track added
    const tracks = useTrackStore.getState().tracks;
    expect(tracks).toHaveLength(1);
    expect(tracks[0].name).toBe("imported-audio");
    expect(tracks[0].uri).toBe("file://imported-audio.mp3");
    expect(tracks[0].duration).toBe(60000);

    // 6. Load track for playback
    await audioService.loadTrack(track.id, track.uri, {
      speed: track.speed,
      volume: track.volume,
      loop: true,
    });

    // 7. Initialize playback state
    usePlaybackStore.getState().addTrack(track.id, {
      speed: track.speed,
      volume: track.volume,
      isLooping: true,
      isPlaying: false,
    });

    // Verify playback state
    const playbackState = usePlaybackStore.getState().getTrackState(track.id);
    expect(playbackState).toBeDefined();
    expect(playbackState?.isLooping).toBe(true);
  });

  it("should handle importing multiple files", async () => {
    const files = [
      {
        uri: "file://track1.mp3",
        name: "track1.mp3",
        size: 1000000,
        type: "audio/mpeg",
      },
      {
        uri: "file://track2.wav",
        name: "track2.wav",
        size: 2000000,
        type: "audio/wav",
      },
    ];

    let callCount = 0;
    jest.spyOn(fileImporter, "pickAudioFile").mockImplementation(async () => {
      return files[callCount++];
    });

    // Import first file
    const file1 = await fileImporter.pickAudioFile();
    const metadata1 = await getAudioMetadata(file1.uri);

    const track1: Track = {
      id: "track-1",
      name: file1.name.replace(/\.[^/.]+$/, ""),
      uri: file1.uri,
      duration: metadata1.duration,
      speed: 1.0,
      volume: 75,
      isPlaying: false,
      createdAt: Date.now(),
    };

    useTrackStore.getState().addTrack(track1);

    // Import second file
    const file2 = await fileImporter.pickAudioFile();
    const metadata2 = await getAudioMetadata(file2.uri);

    const track2: Track = {
      id: "track-2",
      name: file2.name.replace(/\.[^/.]+$/, ""),
      uri: file2.uri,
      duration: metadata2.duration,
      speed: 1.0,
      volume: 75,
      isPlaying: false,
      createdAt: Date.now() + 1,
    };

    useTrackStore.getState().addTrack(track2);

    // Verify both tracks added
    const tracks = useTrackStore.getState().tracks;
    expect(tracks).toHaveLength(2);
    expect(tracks[0].name).toBe("track1");
    expect(tracks[1].name).toBe("track2");
  });

  it("should handle import cancellation", async () => {
    // Mock user cancelling
    jest
      .spyOn(fileImporter, "pickAudioFile")
      .mockRejectedValue(new Error("File selection cancelled"));

    await expect(fileImporter.pickAudioFile()).rejects.toThrow(
      "File selection cancelled",
    );

    // Verify no tracks added
    const tracks = useTrackStore.getState().tracks;
    expect(tracks).toHaveLength(0);
  });

  it("should preserve existing tracks when importing", async () => {
    // Add existing track
    const existingTrack: Track = {
      id: "existing",
      name: "Existing Track",
      uri: "file://existing.mp3",
      duration: 30000,
      speed: 1.0,
      volume: 75,
      isPlaying: false,
      createdAt: Date.now() - 10000,
    };

    useTrackStore.getState().addTrack(existingTrack);

    // Import new file
    jest.spyOn(fileImporter, "pickAudioFile").mockResolvedValue({
      uri: "file://new.mp3",
      name: "new.mp3",
      size: 1000000,
      type: "audio/mpeg",
    });

    const importedFile = await fileImporter.pickAudioFile();
    const metadata = await getAudioMetadata(importedFile.uri);

    const newTrack: Track = {
      id: "new",
      name: "new",
      uri: importedFile.uri,
      duration: metadata.duration,
      speed: 1.0,
      volume: 75,
      isPlaying: false,
      createdAt: Date.now(),
    };

    useTrackStore.getState().addTrack(newTrack);

    // Verify both tracks present
    const tracks = useTrackStore.getState().tracks;
    expect(tracks).toHaveLength(2);
    expect(tracks[0].name).toBe("Existing Track");
    expect(tracks[1].name).toBe("new");
  });
});
