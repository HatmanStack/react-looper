/**
 * Audio Service Factory
 *
 * Creates and manages audio service instances using the factory pattern.
 * Uses Platform.select() to instantiate platform-specific implementations.
 * Supports service registration and dependency injection.
 */

import { Platform } from "react-native";
import { IAudioRecorder } from "./interfaces/IAudioRecorder";
import { IAudioPlayer } from "./interfaces/IAudioPlayer";
import { IAudioMixer } from "./interfaces/IAudioMixer";
import { IFileManager } from "./interfaces/IFileManager";
import { AudioService, AudioServiceConfig } from "./AudioService";
import { getAudioConfig, getPlatformName } from "./PlatformAudioConfig";
import { AudioError } from "./AudioError";
import { AudioErrorCode } from "../../types/audio";

/**
 * Service constructor types
 */
type AudioRecorderConstructor = new () => IAudioRecorder;
type AudioPlayerConstructor = new () => IAudioPlayer;
type AudioMixerConstructor = new () => IAudioMixer;
type FileManagerConstructor = new () => IFileManager;

/**
 * Platform-specific service implementations
 */
interface PlatformServices {
  recorder: AudioRecorderConstructor;
  player: AudioPlayerConstructor;
  mixer: AudioMixerConstructor;
  fileManager: FileManagerConstructor;
}

/**
 * Service registry for each platform
 */
class ServiceRegistry {
  private webServices: PlatformServices | null = null;
  private nativeServices: PlatformServices | null = null;

  /**
   * Register web platform services
   */
  registerWebServices(services: PlatformServices): void {
    this.webServices = services;
  }

  /**
   * Register native platform services
   */
  registerNativeServices(services: PlatformServices): void {
    this.nativeServices = services;
  }

  /**
   * Get services for current platform
   */
  getServicesForPlatform(): PlatformServices | null {
    return Platform.select({
      web: this.webServices,
      default: this.nativeServices,
    });
  }

  /**
   * Check if services are registered for current platform
   */
  hasServicesForPlatform(): boolean {
    return this.getServicesForPlatform() !== null;
  }
}

/**
 * Audio Service Factory singleton
 */
class AudioServiceFactoryClass {
  private static instance: AudioServiceFactoryClass;
  private registry: ServiceRegistry;
  private audioServiceInstance: AudioService | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    this.registry = new ServiceRegistry();
  }

  /**
   * Get factory singleton instance
   */
  public static getInstance(): AudioServiceFactoryClass {
    if (!AudioServiceFactoryClass.instance) {
      AudioServiceFactoryClass.instance = new AudioServiceFactoryClass();
    }
    return AudioServiceFactoryClass.instance;
  }

  /**
   * Register platform-specific service implementations
   *
   * This should be called during app initialization to register
   * the appropriate platform implementations.
   */
  public registerServices(
    platform: "web" | "native",
    services: PlatformServices,
  ): void {
    if (platform === "web") {
      this.registry.registerWebServices(services);
    } else {
      this.registry.registerNativeServices(services);
    }

    // Reset instance if services are re-registered
    if (this.audioServiceInstance) {
      this.audioServiceInstance = null;
      this.isInitialized = false;
    }
  }

  /**
   * Create a new AudioService instance with platform-specific implementations
   *
   * @throws {AudioError} if services are not registered for current platform
   */
  public createAudioService(): AudioService {
    const platformServices = this.registry.getServicesForPlatform();

    if (!platformServices) {
      const platformName = getPlatformName();
      throw new AudioError(
        AudioErrorCode.RESOURCE_UNAVAILABLE,
        `Audio services not registered for platform: ${platformName}`,
        `Audio services unavailable on ${platformName}. Please ensure platform-specific services are registered.`,
      );
    }

    try {
      // Get platform configuration
      const config = getAudioConfig();

      // Instantiate platform-specific services
      const recorder = new platformServices.recorder();
      const mixer = new platformServices.mixer();
      const fileManager = new platformServices.fileManager();

      // Create player factory
      const playerFactory = () => new platformServices.player();

      // Configure AudioService
      const serviceConfig: AudioServiceConfig = {
        recorder,
        playerFactory,
        mixer,
        fileManager,
        maxConcurrentPlayers: config.maxConcurrentPlayers,
      };

      const audioService = new AudioService(serviceConfig);

      return audioService;
    } catch (error) {
      throw new AudioError(
        AudioErrorCode.UNKNOWN_ERROR,
        `Failed to create AudioService: ${(error as Error).message}`,
        "Failed to initialize audio services",
        { originalError: error },
      );
    }
  }

  /**
   * Get or create AudioService singleton
   *
   * Returns a singleton instance of AudioService. The instance is created
   * lazily on first access.
   *
   * @throws {AudioError} if services are not registered
   */
  public getAudioService(): AudioService {
    if (!this.audioServiceInstance) {
      this.audioServiceInstance = this.createAudioService();
      this.isInitialized = true;
    }
    return this.audioServiceInstance;
  }

  /**
   * Check if AudioService is initialized
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized && this.audioServiceInstance !== null;
  }

  /**
   * Check if services are registered for current platform
   */
  public hasServicesRegistered(): boolean {
    return this.registry.hasServicesForPlatform();
  }

  /**
   * Clean up and destroy AudioService instance
   *
   * Call this during app shutdown or when resetting the app state.
   */
  public async cleanup(): Promise<void> {
    if (this.audioServiceInstance) {
      await this.audioServiceInstance.cleanup();
      this.audioServiceInstance = null;
      this.isInitialized = false;
    }
  }

  /**
   * Reset factory (mainly for testing)
   */
  public reset(): void {
    this.audioServiceInstance = null;
    this.isInitialized = false;
    this.registry = new ServiceRegistry();
  }
}

/**
 * Factory singleton instance
 */
export const AudioServiceFactory = AudioServiceFactoryClass.getInstance();

/**
 * Convenience function to register services
 *
 * @example
 * ```typescript
 * // In web-specific initialization:
 * registerAudioServices('web', {
 *   recorder: WebAudioRecorder,
 *   player: WebAudioPlayer,
 *   mixer: WebAudioMixer,
 *   fileManager: WebFileManager,
 * });
 * ```
 */
export function registerAudioServices(
  platform: "web" | "native",
  services: PlatformServices,
): void {
  AudioServiceFactory.registerServices(platform, services);
}

/**
 * Convenience function to get AudioService instance
 *
 * @example
 * ```typescript
 * const audioService = getAudioService();
 * await audioService.startRecording();
 * ```
 */
export function getAudioService(): AudioService {
  return AudioServiceFactory.getAudioService();
}

/**
 * Check if audio services are available for current platform
 */
export function isAudioServiceAvailable(): boolean {
  return AudioServiceFactory.hasServicesRegistered();
}

/**
 * Clean up audio services
 */
export async function cleanupAudioService(): Promise<void> {
  await AudioServiceFactory.cleanup();
}

/**
 * Export types for platform implementations
 */
export type {
  PlatformServices,
  AudioRecorderConstructor,
  AudioPlayerConstructor,
  AudioMixerConstructor,
  FileManagerConstructor,
};
