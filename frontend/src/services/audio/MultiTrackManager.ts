/**
 * MultiTrackManager
 *
 * Manages synchronized playback of multiple audio tracks.
 * Handles track coordination, synchronization, and drift detection.
 */

import { BaseAudioPlayer } from "./BaseAudioPlayer";

export class MultiTrackManager {
  private tracks: Map<string, BaseAudioPlayer>;
  private trackIdCounter: number;

  constructor() {
    this.tracks = new Map();
    this.trackIdCounter = 0;
  }

  /**
   * Add a track to the manager
   */
  public addTrack(player: BaseAudioPlayer): string {
    const trackId = this.generateTrackId();
    this.tracks.set(trackId, player);
    return trackId;
  }

  /**
   * Add a track and sync it to current playback position
   * If manager is playing, new track will join at current position
   */
  public async addTrackAndSync(player: BaseAudioPlayer): Promise<string> {
    // Get current position BEFORE adding the track
    const currentPosition = this.isPlaying() ? await this.getPosition() : 0;

    // Now add the track
    const trackId = this.addTrack(player);

    if (this.isPlaying()) {
      // Sync new track to current position
      await player.setPosition(currentPosition);
      await player.play();
    }

    return trackId;
  }

  /**
   * Remove a track from the manager
   */
  public removeTrack(trackId: string): void {
    if (this.tracks.has(trackId)) {
      this.tracks.delete(trackId);
    }
  }

  /**
   * Get player by track ID
   */
  public getPlayer(trackId: string): BaseAudioPlayer | null {
    return this.tracks.get(trackId) || null;
  }

  /**
   * Clear all tracks
   */
  public clearAllTracks(): void {
    this.tracks.clear();
  }

  /**
   * Get total number of tracks
   */
  public getTrackCount(): number {
    return this.tracks.size;
  }

  /**
   * Play all tracks simultaneously
   */
  public async playAll(): Promise<void> {
    const playPromises = Array.from(this.tracks.values()).map(
      async (player) => {
        try {
          await player.play();
        } catch (error) {
          console.error("[MultiTrackManager] Error playing track:", error);
          // Continue with other tracks even if one fails
        }
      },
    );

    await Promise.all(playPromises);
  }

  /**
   * Pause all tracks simultaneously
   */
  public async pauseAll(): Promise<void> {
    const pausePromises = Array.from(this.tracks.values()).map(
      async (player) => {
        try {
          await player.pause();
        } catch (error) {
          console.error("[MultiTrackManager] Error pausing track:", error);
        }
      },
    );

    await Promise.all(pausePromises);
  }

  /**
   * Stop all tracks simultaneously
   */
  public async stopAll(): Promise<void> {
    const stopPromises = Array.from(this.tracks.values()).map(
      async (player) => {
        try {
          await player.stop();
        } catch (error) {
          console.error("[MultiTrackManager] Error stopping track:", error);
        }
      },
    );

    await Promise.all(stopPromises);
  }

  /**
   * Check if any track is currently playing
   */
  public isPlaying(): boolean {
    return Array.from(this.tracks.values()).some((player) =>
      player.isPlaying(),
    );
  }

  /**
   * Get average playback position across all tracks
   */
  public async getPosition(): Promise<number> {
    if (this.tracks.size === 0) {
      return 0;
    }

    const positions = await Promise.all(
      Array.from(this.tracks.values()).map((player) => player.getPosition()),
    );

    const sum = positions.reduce((acc, pos) => acc + pos, 0);
    const average = sum / positions.length;

    return Math.round(average);
  }

  /**
   * Set playback position on all tracks
   */
  public async setPosition(position: number): Promise<void> {
    const setPositionPromises = Array.from(this.tracks.values()).map(
      async (player) => {
        try {
          await player.setPosition(position);
        } catch (error) {
          console.error("[MultiTrackManager] Error setting position:", error);
        }
      },
    );

    await Promise.all(setPositionPromises);
  }

  /**
   * Get maximum drift between tracks
   * Returns the difference between the earliest and latest track positions
   */
  public async getDrift(): Promise<number> {
    if (this.tracks.size === 0) {
      return 0;
    }

    const positions = await Promise.all(
      Array.from(this.tracks.values()).map((player) => player.getPosition()),
    );

    const minPosition = Math.min(...positions);
    const maxPosition = Math.max(...positions);
    const drift = maxPosition - minPosition;

    return drift;
  }

  /**
   * Resynchronize all tracks to their average position
   */
  public async resyncTracks(): Promise<void> {
    const averagePosition = await this.getPosition();
    await this.setPosition(averagePosition);
  }

  /**
   * Check if all tracks are loaded
   */
  public allTracksLoaded(): boolean {
    if (this.tracks.size === 0) {
      return true;
    }

    return Array.from(this.tracks.values()).every((player) =>
      player.isLoaded(),
    );
  }

  /**
   * Generate unique track ID
   */
  private generateTrackId(): string {
    this.trackIdCounter++;
    return `track_${this.trackIdCounter}`;
  }
}
