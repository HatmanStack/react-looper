/**
 * Permissions Utility Tests
 */

import {
  requestMicrophonePermission,
  requestStoragePermission,
} from "../../../src/utils/permissions";
import { Platform } from "react-native";

// Mock platform
jest.mock("react-native", () => ({
  Platform: {
    OS: "ios",
  },
  PermissionsAndroid: {
    request: jest.fn(),
    PERMISSIONS: {
      RECORD_AUDIO: "android.permission.RECORD_AUDIO",
      WRITE_EXTERNAL_STORAGE: "android.permission.WRITE_EXTERNAL_STORAGE",
    },
    RESULTS: {
      GRANTED: "granted",
      DENIED: "denied",
      NEVER_ASK_AGAIN: "never_ask_again",
    },
  },
}));

describe("Permissions Utils", () => {
  describe("requestMicrophonePermission", () => {
    describe("iOS/Web", () => {
      beforeEach(() => {
        (Platform as any).OS = "ios";
      });

      it("should return true on iOS (handled by expo-av)", async () => {
        const granted = await requestMicrophonePermission();
        expect(granted).toBe(true);
      });
    });

    describe("Android", () => {
      beforeEach(() => {
        (Platform as any).OS = "android";
        jest.clearAllMocks();
      });

      it("should request Android permission and return true if granted", async () => {
        const PermissionsAndroid = require("react-native").PermissionsAndroid;
        PermissionsAndroid.request.mockResolvedValue("granted");

        const granted = await requestMicrophonePermission();

        expect(granted).toBe(true);
        expect(PermissionsAndroid.request).toHaveBeenCalledWith(
          "android.permission.RECORD_AUDIO",
          expect.any(Object),
        );
      });

      it("should return false if permission denied", async () => {
        const PermissionsAndroid = require("react-native").PermissionsAndroid;
        PermissionsAndroid.request.mockResolvedValue("denied");

        const granted = await requestMicrophonePermission();

        expect(granted).toBe(false);
      });

      it("should return false if never ask again", async () => {
        const PermissionsAndroid = require("react-native").PermissionsAndroid;
        PermissionsAndroid.request.mockResolvedValue("never_ask_again");

        const granted = await requestMicrophonePermission();

        expect(granted).toBe(false);
      });
    });
  });

  describe("requestStoragePermission", () => {
    describe("iOS/Web", () => {
      beforeEach(() => {
        (Platform as any).OS = "ios";
      });

      it("should return true on iOS (handled by system)", async () => {
        const granted = await requestStoragePermission();
        expect(granted).toBe(true);
      });
    });

    describe("Android", () => {
      beforeEach(() => {
        (Platform as any).OS = "android";
        jest.clearAllMocks();
      });

      it("should request storage permission on Android", async () => {
        const PermissionsAndroid = require("react-native").PermissionsAndroid;
        PermissionsAndroid.request.mockResolvedValue("granted");

        const granted = await requestStoragePermission();

        expect(granted).toBe(true);
        expect(PermissionsAndroid.request).toHaveBeenCalledWith(
          "android.permission.WRITE_EXTERNAL_STORAGE",
          expect.any(Object),
        );
      });

      it("should return false if storage permission denied", async () => {
        const PermissionsAndroid = require("react-native").PermissionsAndroid;
        PermissionsAndroid.request.mockResolvedValue("denied");

        const granted = await requestStoragePermission();

        expect(granted).toBe(false);
      });
    });
  });

  describe("Web platform", () => {
    beforeEach(() => {
      (Platform as any).OS = "web";
    });

    it("should return true for microphone on web", async () => {
      const granted = await requestMicrophonePermission();
      expect(granted).toBe(true);
    });

    it("should return true for storage on web", async () => {
      const granted = await requestStoragePermission();
      expect(granted).toBe(true);
    });
  });
});
