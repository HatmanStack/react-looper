/**
 * AudioServiceFactory Tests
 *
 * Tests for platform detection and service factory
 */

import { Platform } from "react-native";
import {
  AudioServiceFactory,
  registerAudioServices,
  getAudioService,
  isAudioServiceAvailable,
} from "../../../src/services/audio/AudioServiceFactory";
import { MockAudioRecorder } from "../../../src/services/audio/mock/MockAudioRecorder";
import { MockAudioPlayer } from "../../../src/services/audio/mock/MockAudioPlayer";
import { MockAudioMixer } from "../../../src/services/audio/mock/MockAudioMixer";
import { MockFileManager } from "../../../src/services/audio/mock/MockFileManager";

describe("AudioServiceFactory", () => {
  beforeEach(() => {
    // Reset factory before each test
    AudioServiceFactory.reset();
  });

  afterEach(async () => {
    // Cleanup after each test
    await AudioServiceFactory.cleanup();
  });

  describe("Service Registration", () => {
    it("registers services for platform", () => {
      const mockServices = {
        recorder: MockAudioRecorder,
        player: MockAudioPlayer,
        mixer: MockAudioMixer,
        fileManager: MockFileManager,
      };

      registerAudioServices("native", mockServices);

      expect(AudioServiceFactory.hasServicesRegistered()).toBe(true);
    });

    it("detects when no services are registered", () => {
      expect(AudioServiceFactory.hasServicesRegistered()).toBe(false);
    });

    it("allows re-registration of services", () => {
      const mockServices = {
        recorder: MockAudioRecorder,
        player: MockAudioPlayer,
        mixer: MockAudioMixer,
        fileManager: MockFileManager,
      };

      registerAudioServices("native", mockServices);
      expect(AudioServiceFactory.hasServicesRegistered()).toBe(true);

      // Re-register
      registerAudioServices("native", mockServices);
      expect(AudioServiceFactory.hasServicesRegistered()).toBe(true);
    });
  });

  describe("AudioService Creation", () => {
    beforeEach(() => {
      // Register mock services for tests
      const mockServices = {
        recorder: MockAudioRecorder,
        player: MockAudioPlayer,
        mixer: MockAudioMixer,
        fileManager: MockFileManager,
      };

      const platform = Platform.OS === "web" ? "web" : "native";
      registerAudioServices(platform, mockServices);
    });

    it("creates AudioService instance", () => {
      const audioService = AudioServiceFactory.createAudioService();
      expect(audioService).toBeDefined();
      expect(audioService).toBeTruthy();
    });

    it("returns singleton instance", () => {
      const audioService1 = getAudioService();
      const audioService2 = getAudioService();

      expect(audioService1).toBe(audioService2);
    });

    it("throws error when services not registered", () => {
      AudioServiceFactory.reset();

      expect(() => {
        AudioServiceFactory.createAudioService();
      }).toThrow();
    });

    it("creates new instance after cleanup", async () => {
      const audioService1 = getAudioService();

      await AudioServiceFactory.cleanup();

      const audioService2 = getAudioService();

      // Should be different instances after cleanup
      expect(audioService1).not.toBe(audioService2);
    });
  });

  describe("Service Availability", () => {
    it("returns true when services are available", () => {
      const mockServices = {
        recorder: MockAudioRecorder,
        player: MockAudioPlayer,
        mixer: MockAudioMixer,
        fileManager: MockFileManager,
      };

      const platform = Platform.OS === "web" ? "web" : "native";
      registerAudioServices(platform, mockServices);

      expect(isAudioServiceAvailable()).toBe(true);
    });

    it("returns false when services are not available", () => {
      expect(isAudioServiceAvailable()).toBe(false);
    });
  });

  describe("Lifecycle Management", () => {
    beforeEach(() => {
      const mockServices = {
        recorder: MockAudioRecorder,
        player: MockAudioPlayer,
        mixer: MockAudioMixer,
        fileManager: MockFileManager,
      };

      const platform = Platform.OS === "web" ? "web" : "native";
      registerAudioServices(platform, mockServices);
    });

    it("initializes service on first access", () => {
      expect(AudioServiceFactory.isServiceInitialized()).toBe(false);

      getAudioService();

      expect(AudioServiceFactory.isServiceInitialized()).toBe(true);
    });

    it("cleans up service instance", async () => {
      getAudioService();
      expect(AudioServiceFactory.isServiceInitialized()).toBe(true);

      await AudioServiceFactory.cleanup();

      expect(AudioServiceFactory.isServiceInitialized()).toBe(false);
    });

    it("resets factory state", () => {
      getAudioService();
      expect(AudioServiceFactory.isServiceInitialized()).toBe(true);
      expect(AudioServiceFactory.hasServicesRegistered()).toBe(true);

      AudioServiceFactory.reset();

      expect(AudioServiceFactory.isServiceInitialized()).toBe(false);
      expect(AudioServiceFactory.hasServicesRegistered()).toBe(false);
    });
  });
});
