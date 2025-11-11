import { Platform } from "react-native";

/**
 * Platform detection utilities
 *
 * These functions help identify the current platform and enable
 * platform-specific logic throughout the application.
 */

/**
 * Returns true if running on web platform
 */
export const isWeb = (): boolean => {
  return Platform.OS === "web";
};

/**
 * Returns true if running on native platforms (iOS or Android)
 */
export const isNative = (): boolean => {
  return Platform.OS === "ios" || Platform.OS === "android";
};

/**
 * Returns true if running on iOS
 */
export const isIOS = (): boolean => {
  return Platform.OS === "ios";
};

/**
 * Returns true if running on Android
 */
export const isAndroid = (): boolean => {
  return Platform.OS === "android";
};

/**
 * Gets a human-readable platform name
 */
export const getPlatformName = (): string => {
  switch (Platform.OS) {
    case "ios":
      return "iOS";
    case "android":
      return "Android";
    case "web":
      return "Web";
    default:
      return "Unknown";
  }
};
