import { Platform } from "react-native";
import { getPlatformName } from "@utils/platform";

/**
 * Platform-specific constants
 *
 * These constants provide platform-specific configuration
 * that can be used throughout the application.
 */

/**
 * Human-readable platform name
 */
export const PLATFORM_NAME = getPlatformName();

/**
 * Development mode flag
 */
export const IS_DEV = __DEV__;

/**
 * Platform-specific file paths and configurations
 */
export const PLATFORM_CONFIG = {
  /**
   * Maximum file size for audio import (in bytes)
   * Web has lower limits due to memory constraints
   */
  MAX_AUDIO_FILE_SIZE: Platform.select({
    web: 50 * 1024 * 1024, // 50MB for web
    default: 200 * 1024 * 1024, // 200MB for native
  }),

  /**
   * Maximum number of simultaneous tracks
   * Web may have lower limits due to browser constraints
   */
  MAX_TRACKS: Platform.select({
    web: 10,
    default: 20,
  }),

  /**
   * Audio sample rate
   */
  AUDIO_SAMPLE_RATE: 44100,

  /**
   * Audio bit rate for exports
   */
  AUDIO_BIT_RATE: 128000,
};
