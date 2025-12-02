import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config: _config }: ConfigContext): ExpoConfig => {
  // Load environment-specific configuration
  const appEnv = process.env.APP_ENV || "development";
  const enableDevTools = process.env.ENABLE_DEV_TOOLS === "true";
  const enableAnalytics = process.env.ENABLE_ANALYTICS === "true";

  return {
    name: "Looper",
    slug: "looper",
    version: "1.0.0",
    orientation: "portrait",
    platforms: ["ios", "android", "web"],
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#121212",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.looper.app",
      buildNumber: "1",
      infoPlist: {
        NSMicrophoneUsageDescription:
          "Looper needs access to your microphone to record audio tracks.",
        NSPhotoLibraryUsageDescription:
          "Looper needs access to your photo library to import audio files.",
        NSPhotoLibraryAddUsageDescription:
          "Looper needs access to save mixed audio files to your photo library.",
      },
      config: {
        usesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#121212",
      },
      package: "com.looper.app",
      versionCode: 1,
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_MEDIA_AUDIO",
      ],
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
      output: "static",
      config: {
        firebase: undefined,
      },
      // PWA Configuration
      name: "Looper - Audio Mixing App",
      shortName: "Looper",
      description:
        "Record, import, and mix audio tracks with independent speed and volume controls",
      themeColor: "#BB86FC",
      backgroundColor: "#121212",
      display: "standalone",
      startUrl: "/",
      scope: "/",
      lang: "en-US",
      orientation: "portrait",
      dir: "ltr",
      preferRelatedApplications: false,
      relatedApplications: [
        {
          platform: "play",
          url: "https://play.google.com/store/apps/details?id=com.looper.app",
          id: "com.looper.app",
        },
        {
          platform: "itunes",
          url: "https://apps.apple.com/app/looper/id000000000",
        },
      ],
    },
    plugins: [
      "expo-av",
      [
        "expo-media-library",
        {
          photosPermission:
            "Allow Looper to access your photos to import and export audio files.",
          savePhotosPermission:
            "Allow Looper to save mixed audio files to your photo library.",
          isAccessMediaLocationEnabled: true,
        },
      ],
      [
        "expo-document-picker",
        {
          iCloudContainerEnvironment: "Production",
        },
      ],
    ],
    extra: {
      appEnv,
      enableDevTools,
      enableAnalytics,
      eas: {
        projectId: process.env.EAS_PROJECT_ID || undefined,
      },
    },
    owner: process.env.EXPO_ACCOUNT_OWNER || undefined,
  };
};
