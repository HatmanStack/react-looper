/**
 * Permission Utilities - Native Implementation
 *
 * Native (iOS/Android) permission handling using expo-av and expo-media-library.
 */

import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { PermissionType, PermissionStatus, PermissionResult } from './permissions';

/**
 * Convert expo permission status to our PermissionStatus
 */
function convertPermissionStatus(status: 'granted' | 'denied' | 'undetermined'): PermissionStatus {
  switch (status) {
    case 'granted':
      return PermissionStatus.GRANTED;
    case 'denied':
      return PermissionStatus.DENIED;
    case 'undetermined':
      return PermissionStatus.UNDETERMINED;
    default:
      return PermissionStatus.UNDETERMINED;
  }
}

/**
 * Request microphone permission
 */
export async function requestMicrophonePermission(): Promise<PermissionResult> {
  try {
    const { status, canAskAgain } = await Audio.requestPermissionsAsync();

    return {
      status: convertPermissionStatus(status),
      canAskAgain: canAskAgain !== false,
    };
  } catch (error) {
    console.error('[Permissions] Microphone permission error:', error);
    return {
      status: PermissionStatus.DENIED,
      canAskAgain: false,
    };
  }
}

/**
 * Request storage/media library permission
 */
export async function requestStoragePermission(): Promise<PermissionResult> {
  try {
    const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();

    return {
      status: convertPermissionStatus(status),
      canAskAgain: canAskAgain !== false,
    };
  } catch (error) {
    console.error('[Permissions] Storage permission error:', error);
    return {
      status: PermissionStatus.DENIED,
      canAskAgain: false,
    };
  }
}

/**
 * Check current permission status without requesting
 */
export async function checkPermission(type: PermissionType): Promise<PermissionStatus> {
  try {
    if (type === PermissionType.MICROPHONE) {
      const { status } = await Audio.getPermissionsAsync();
      return convertPermissionStatus(status);
    }

    if (type === PermissionType.STORAGE) {
      const { status } = await MediaLibrary.getPermissionsAsync();
      return convertPermissionStatus(status);
    }

    return PermissionStatus.UNDETERMINED;
  } catch (error) {
    console.error('[Permissions] Check permission error:', error);
    return PermissionStatus.UNDETERMINED;
  }
}

/**
 * Open device settings for permission management
 */
export async function openSettings(): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      // On iOS, open app-specific settings
      await Linking.openSettings();
    } else if (Platform.OS === 'android') {
      // On Android, open app settings
      await Linking.openSettings();
    }
  } catch (error) {
    console.error('[Permissions] Failed to open settings:', error);
    throw new Error('Failed to open settings. Please open them manually.');
  }
}
