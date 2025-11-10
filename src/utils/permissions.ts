/**
 * Permission Utilities - Interface
 *
 * Cross-platform permission handling for microphone and storage access.
 * Platform-specific implementations in .web.ts and .native.ts files.
 */

export enum PermissionType {
  MICROPHONE = 'microphone',
  STORAGE = 'storage',
}

export enum PermissionStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  PENDING = 'pending',
  UNDETERMINED = 'undetermined',
}

export interface PermissionResult {
  status: PermissionStatus;
  canAskAgain: boolean;
}

/**
 * Request microphone permission
 */
export async function requestMicrophonePermission(): Promise<PermissionResult> {
  throw new Error('Not implemented. Use platform-specific file.');
}

/**
 * Request storage permission (native only)
 */
export async function requestStoragePermission(): Promise<PermissionResult> {
  throw new Error('Not implemented. Use platform-specific file.');
}

/**
 * Check current permission status without requesting
 */
export async function checkPermission(type: PermissionType): Promise<PermissionStatus> {
  throw new Error('Not implemented. Use platform-specific file.');
}

/**
 * Open device settings for permission management (native only)
 */
export async function openSettings(): Promise<void> {
  throw new Error('Not implemented. Use platform-specific file.');
}
