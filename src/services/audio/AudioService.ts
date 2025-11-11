/**
 * AudioService Orchestrator
 *
 * High-level service that coordinates all audio operations.
 * Manages recorder, players, and mixer instances.
 * Provides clean API for UI layer.
 */

import { IAudioRecorder } from "./interfaces/IAudioRecorder";
import { IAudioPlayer } from "./interfaces/IAudioPlayer";
import { IAudioMixer } from "./interfaces/IAudioMixer";
import { IFileManager } from "./interfaces/IFileManager";
import {
  RecordingOptions,
  PlaybackOptions,
  MixerTrackInput,
  MixingOptions,
  AudioErrorCode,
  AudioFormat,
  ProgressCallback,
} from "../../types/audio";
import { AudioError } from "./AudioError";

/**
 * Configuration for AudioService
 */
export interface AudioServiceConfig {
  recorder: IAudioRecorder;
  playerFactory: () => IAudioPlayer;
  mixer: IAudioMixer;
  fileManager: IFileManager;
  maxConcurrentPlayers?: number;
}

/**
 * Track state managed by AudioService
 */
export interface ManagedTrack {
  id: string;
  uri: string;
  player: IAudioPlayer;
  isPlaying: boolean;
  speed: number;
  volume: number;
}

/**
 * Main AudioService class - coordinates all audio operations
 */
export class AudioService {
  private recorder: IAudioRecorder;
  private playerFactory: () => IAudioPlayer;
  private mixer: IAudioMixer;
  private fileManager: IFileManager;
  private maxConcurrentPlayers: number;

  // Track management
  private players: Map<string, ManagedTrack> = new Map();

  // Recording state
  private currentRecording: string | null = null;

  /**
   * Initialize AudioService with platform-specific implementations
   */
  constructor(config: AudioServiceConfig) {
    this.recorder = config.recorder;
    this.playerFactory = config.playerFactory;
    this.mixer = config.mixer;
    this.fileManager = config.fileManager;
    this.maxConcurrentPlayers = config.maxConcurrentPlayers || 10;
  }

  // ==================== Recording Operations ====================

  /**
   * Start recording audio
   */
  public async startRecording(options?: RecordingOptions): Promise<void> {
    if (this.currentRecording) {
      throw new AudioError(
        AudioErrorCode.RECORDING_FAILED,
        "Cannot start recording: recording already in progress",
        "Recording is already in progress",
      );
    }

    await this.recorder.startRecording(options);
    this.currentRecording = "recording"; // Temporary marker
  }

  /**
   * Stop recording and return URI
   */
  public async stopRecording(): Promise<string> {
    if (!this.currentRecording) {
      throw new AudioError(
        AudioErrorCode.RECORDING_FAILED,
        "Cannot stop recording: no recording in progress",
        "No active recording to stop",
      );
    }

    try {
      const uri = await this.recorder.stopRecording();
      this.currentRecording = null;
      return uri;
    } catch (error) {
      this.currentRecording = null;
      throw error;
    }
  }

  /**
   * Cancel ongoing recording
   */
  public async cancelRecording(): Promise<void> {
    if (!this.currentRecording) {
      return; // Nothing to cancel
    }

    await this.recorder.cancelRecording();
    this.currentRecording = null;
  }

  /**
   * Check if currently recording
   */
  public isRecording(): boolean {
    return this.recorder.isRecording();
  }

  /**
   * Get recording duration in milliseconds
   */
  public getRecordingDuration(): number {
    return this.recorder.getRecordingDuration();
  }

  /**
   * Request microphone permissions
   */
  public async requestRecordingPermissions(): Promise<boolean> {
    return this.recorder.getPermissions();
  }

  // ==================== Playback Operations ====================

  /**
   * Load audio track for playback
   */
  public async loadTrack(
    trackId: string,
    uri: string,
    options?: PlaybackOptions,
  ): Promise<void> {
    // Check if we've hit the concurrent player limit
    if (this.players.size >= this.maxConcurrentPlayers) {
      throw new AudioError(
        AudioErrorCode.RESOURCE_UNAVAILABLE,
        `Cannot load track: maximum ${this.maxConcurrentPlayers} concurrent players`,
        "Too many audio tracks loaded",
      );
    }

    // Unload existing player if track already loaded
    if (this.players.has(trackId)) {
      await this.unloadTrack(trackId);
    }

    // Create new player instance
    const player = this.playerFactory();
    await player.load(uri, options);

    // Store managed track
    this.players.set(trackId, {
      id: trackId,
      uri,
      player,
      isPlaying: false,
      speed: options?.speed || 1.0,
      volume: options?.volume || 100,
    });
  }

  /**
   * Play a loaded track
   */
  public async playTrack(trackId: string): Promise<void> {
    const track = this.getTrack(trackId);
    await track.player.play();
    track.isPlaying = true;
  }

  /**
   * Pause a playing track
   */
  public async pauseTrack(trackId: string): Promise<void> {
    const track = this.getTrack(trackId);
    await track.player.pause();
    track.isPlaying = false;
  }

  /**
   * Stop a track and reset position
   */
  public async stopTrack(trackId: string): Promise<void> {
    const track = this.getTrack(trackId);
    await track.player.stop();
    track.isPlaying = false;
  }

  /**
   * Set playback speed for a track
   */
  public async setTrackSpeed(trackId: string, speed: number): Promise<void> {
    const track = this.getTrack(trackId);
    await track.player.setSpeed(speed);
    track.speed = speed;
  }

  /**
   * Set volume for a track
   */
  public async setTrackVolume(trackId: string, volume: number): Promise<void> {
    const track = this.getTrack(trackId);
    await track.player.setVolume(volume);
    track.volume = volume;
  }

  /**
   * Set looping for a track
   */
  public async setTrackLooping(trackId: string, loop: boolean): Promise<void> {
    const track = this.getTrack(trackId);
    await track.player.setLooping(loop);
  }

  /**
   * Get track duration
   */
  public async getTrackDuration(trackId: string): Promise<number> {
    const track = this.getTrack(trackId);
    return track.player.getDuration();
  }

  /**
   * Get track position
   */
  public async getTrackPosition(trackId: string): Promise<number> {
    const track = this.getTrack(trackId);
    return track.player.getPosition();
  }

  /**
   * Set track position
   */
  public async setTrackPosition(
    trackId: string,
    position: number,
  ): Promise<void> {
    const track = this.getTrack(trackId);
    await track.player.setPosition(position);
  }

  /**
   * Check if track is playing
   */
  public isTrackPlaying(trackId: string): boolean {
    const track = this.players.get(trackId);
    return track ? track.isPlaying : false;
  }

  /**
   * Unload a track and free resources
   */
  public async unloadTrack(trackId: string): Promise<void> {
    const track = this.players.get(trackId);
    if (!track) {
      return; // Already unloaded
    }

    await track.player.unload();
    this.players.delete(trackId);
  }

  /**
   * Stop and unload all tracks
   */
  public async unloadAllTracks(): Promise<void> {
    const unloadPromises = Array.from(this.players.keys()).map((trackId) =>
      this.unloadTrack(trackId),
    );
    await Promise.all(unloadPromises);
  }

  /**
   * Play all loaded tracks simultaneously
   */
  public async playAllTracks(): Promise<void> {
    const playPromises = Array.from(this.players.keys()).map((trackId) =>
      this.playTrack(trackId),
    );
    await Promise.all(playPromises);
  }

  /**
   * Pause all playing tracks
   */
  public async pauseAllTracks(): Promise<void> {
    const pausePromises = Array.from(this.players.values())
      .filter((track) => track.isPlaying)
      .map((track) => this.pauseTrack(track.id));
    await Promise.all(pausePromises);
  }

  /**
   * Get list of all loaded track IDs
   */
  public getLoadedTrackIds(): string[] {
    return Array.from(this.players.keys());
  }

  /**
   * Get managed track info
   */
  public getTrackInfo(trackId: string): ManagedTrack | undefined {
    return this.players.get(trackId);
  }

  // ==================== Mixing Operations ====================

  /**
   * Mix multiple tracks into a single output file
   */
  public async mixTracks(
    tracks: MixerTrackInput[],
    outputPath: string,
    options?: MixingOptions,
    progressCallback?: ProgressCallback,
  ): Promise<string> {
    // Validate tracks before mixing
    await this.mixer.validateTracks(tracks);

    // Set progress callback if provided
    if (progressCallback) {
      this.mixer.setProgressCallback(progressCallback);
    }

    try {
      const resultUri = await this.mixer.mixTracks(tracks, outputPath, options);
      return resultUri;
    } finally {
      // Clear progress callback
      if (progressCallback) {
        this.mixer.setProgressCallback(() => {});
      }
    }
  }

  /**
   * Cancel ongoing mixing operation
   */
  public async cancelMixing(): Promise<void> {
    await this.mixer.cancel();
  }

  /**
   * Check if mixing is in progress
   */
  public isMixing(): boolean {
    return this.mixer.isMixing();
  }

  /**
   * Estimate mixing duration
   */
  public estimateMixingDuration(tracks: MixerTrackInput[]): number {
    return this.mixer.estimateMixingDuration(tracks);
  }

  // ==================== File Management ====================

  /**
   * Copy audio file to app storage
   */
  public async copyToAppStorage(
    sourceUri: string,
    filename: string,
  ): Promise<string> {
    return this.fileManager.copyToAppStorage(sourceUri, filename);
  }

  /**
   * Export audio file to external storage
   */
  public async exportToExternalStorage(
    uri: string,
    filename: string,
  ): Promise<string> {
    return this.fileManager.exportToExternalStorage(uri, filename);
  }

  /**
   * Delete audio file
   */
  public async deleteAudioFile(uri: string): Promise<boolean> {
    // Unload any players using this URI
    for (const [trackId, track] of this.players.entries()) {
      if (track.uri === uri) {
        await this.unloadTrack(trackId);
      }
    }

    return this.fileManager.deleteAudioFile(uri);
  }

  /**
   * Check if audio file exists
   */
  public async fileExists(uri: string): Promise<boolean> {
    return this.fileManager.fileExists(uri);
  }

  /**
   * Get file size in bytes
   */
  public async getFileSize(uri: string): Promise<number> {
    return this.fileManager.getFileSize(uri);
  }

  /**
   * List all audio files
   */
  public async listAudioFiles(): Promise<string[]> {
    return this.fileManager.listAudioFiles();
  }

  /**
   * Clean up temporary files
   */
  public async cleanupTempFiles(): Promise<void> {
    await this.fileManager.cleanupTempFiles();
  }

  /**
   * Generate unique filename
   */
  public generateUniqueFilename(prefix?: string, format?: AudioFormat): string {
    return this.fileManager.generateUniqueFilename(prefix, format);
  }

  // ==================== Lifecycle Management ====================

  /**
   * Clean up all resources
   */
  public async cleanup(): Promise<void> {
    // Cancel any ongoing recording
    if (this.isRecording()) {
      await this.cancelRecording();
    }

    // Cancel any ongoing mixing
    if (this.isMixing()) {
      await this.cancelMixing();
    }

    // Unload all tracks
    await this.unloadAllTracks();

    // Cleanup recorder
    await this.recorder.cleanup();

    // Cleanup temp files
    await this.cleanupTempFiles();
  }

  // ==================== Helper Methods ====================

  /**
   * Get track or throw error if not found
   */
  private getTrack(trackId: string): ManagedTrack {
    const track = this.players.get(trackId);
    if (!track) {
      throw new AudioError(
        AudioErrorCode.PLAYBACK_FAILED,
        `Track not found: ${trackId}`,
        "Audio track not loaded",
      );
    }
    return track;
  }
}
