/**
 * WebAudioRecorder
 *
 * Web-specific audio recording implementation using MediaRecorder API.
 * Records audio from the user's microphone using getUserMedia.
 */

import { BaseAudioRecorder } from './BaseAudioRecorder';
import { RecordingOptions, AudioFormat, AudioErrorCode } from '../../types/audio';
import { AudioError } from './AudioError';

export class WebAudioRecorder extends BaseAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;

  /**
   * Start recording implementation for web
   */
  protected async _startRecording(options?: RecordingOptions): Promise<void> {
    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: options?.sampleRate || 44100,
          channelCount: options?.channels || 2,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Determine MIME type based on format option or browser support
      const mimeType = this.getPreferredMimeType(options?.format);

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType,
        audioBitsPerSecond: (options?.bitRate || 128) * 1000,
      });

      // Clear any previous chunks
      this.audioChunks = [];

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Handle errors
      this.mediaRecorder.onerror = (event: Event) => {
        console.error('[WebAudioRecorder] MediaRecorder error:', event);
        throw new AudioError(
          AudioErrorCode.RECORDING_FAILED,
          'MediaRecorder error occurred',
          'Recording failed. Please try again.'
        );
      };

      // Start recording
      // Request data every 100ms for better progress tracking
      this.mediaRecorder.start(100);

      console.log(`[WebAudioRecorder] Recording started with MIME type: ${mimeType}`);
    } catch (error) {
      // Cleanup on error
      this.cleanupMediaStream();

      if (error instanceof AudioError) {
        throw error;
      }

      // Check for specific errors
      if ((error as Error).name === 'NotAllowedError') {
        throw new AudioError(
          AudioErrorCode.PERMISSION_DENIED,
          'Microphone access denied',
          'Please allow microphone access to record audio.'
        );
      }

      if ((error as Error).name === 'NotFoundError') {
        throw new AudioError(
          AudioErrorCode.RESOURCE_UNAVAILABLE,
          'No microphone found',
          'No microphone detected. Please connect a microphone and try again.'
        );
      }

      throw new AudioError(
        AudioErrorCode.RECORDING_FAILED,
        `Failed to start recording: ${(error as Error).message}`,
        'Failed to start recording. Please check your microphone and try again.'
      );
    }
  }

  /**
   * Stop recording and return audio blob URL
   */
  protected async _stopRecording(): Promise<string> {
    if (!this.mediaRecorder) {
      throw new AudioError(
        AudioErrorCode.RECORDING_FAILED,
        'MediaRecorder not initialized',
        'Recording session not found.'
      );
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(
          new AudioError(
            AudioErrorCode.RECORDING_FAILED,
            'MediaRecorder lost during stop',
            'Recording session was interrupted.'
          )
        );
        return;
      }

      // Handle recording stop
      this.mediaRecorder.onstop = () => {
        try {
          // Create blob from chunks
          const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });

          // Create blob URL
          const blobUrl = URL.createObjectURL(audioBlob);

          console.log(
            `[WebAudioRecorder] Recording stopped. Blob size: ${audioBlob.size} bytes, URL: ${blobUrl}`
          );

          // Cleanup media stream
          this.cleanupMediaStream();

          resolve(blobUrl);
        } catch (error) {
          this.cleanupMediaStream();
          reject(
            new AudioError(
              AudioErrorCode.RECORDING_FAILED,
              `Failed to create blob: ${(error as Error).message}`,
              'Failed to save recording.'
            )
          );
        }
      };

      // Stop the recorder
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      } else {
        // Already stopped, resolve immediately
        this.mediaRecorder.onstop?.(new Event('stop'));
      }
    });
  }

  /**
   * Cancel recording without saving
   */
  protected async _cancelRecording(): Promise<void> {
    console.log('[WebAudioRecorder] Cancelling recording');

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    // Clear chunks
    this.audioChunks = [];

    // Cleanup media stream
    this.cleanupMediaStream();
  }

  /**
   * Request microphone permissions
   */
  protected async _getPermissions(): Promise<boolean> {
    try {
      // Try permissions API first (not supported in all browsers)
      if ('permissions' in navigator) {
        try {
          const result = await navigator.permissions.query({
            name: 'microphone',
          } as any);

          if (result.state === 'granted') {
            return true;
          }

          if (result.state === 'denied') {
            return false;
          }

          // State is 'prompt' - will be requested when getUserMedia is called
        } catch (permError) {
          // Permissions API not fully supported, fall through
          console.warn('[WebAudioRecorder] Permissions API not available:', permError);
        }
      }

      // Request actual media access to trigger permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Immediately stop the stream since this is just a permission check
      stream.getTracks().forEach((track) => track.stop());

      return true;
    } catch (error) {
      if ((error as Error).name === 'NotAllowedError') {
        return false;
      }

      // Other errors (no microphone, etc.)
      console.error('[WebAudioRecorder] Permission check error:', error);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  protected async _cleanup(): Promise<void> {
    console.log('[WebAudioRecorder] Cleaning up resources');

    // Stop and clear media recorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.mediaRecorder = null;

    // Clear chunks
    this.audioChunks = [];

    // Stop media stream
    this.cleanupMediaStream();
  }

  /**
   * Get preferred MIME type based on format and browser support
   */
  private getPreferredMimeType(format?: AudioFormat): string {
    const mimeTypes: Record<AudioFormat, string[]> = {
      [AudioFormat.MP3]: ['audio/mpeg', 'audio/mp3'],
      [AudioFormat.M4A]: ['audio/mp4', 'audio/aac'],
      [AudioFormat.WAV]: ['audio/wav', 'audio/wave'],
      [AudioFormat.THREE_GPP]: ['audio/3gpp'],
    };

    // If format is specified, try to find supported MIME type for it
    if (format) {
      const types = mimeTypes[format];
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          return type;
        }
      }
    }

    // Fallback: try common formats in order of preference
    const preferredFormats = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/wav',
    ];

    for (const type of preferredFormats) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    // Last resort: use whatever the browser's default is
    return '';
  }

  /**
   * Stop and cleanup media stream
   */
  private cleanupMediaStream(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        track.stop();
        console.log(`[WebAudioRecorder] Stopped track: ${track.label}`);
      });
      this.mediaStream = null;
    }
  }
}
