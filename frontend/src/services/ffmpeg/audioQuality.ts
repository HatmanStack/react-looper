/**
 * Audio Quality Utilities
 *
 * Converts quality levels to bitrates for different audio formats.
 */

import type { AudioFormat, QualityLevel } from "./exportTypes";

/**
 * Get bitrate in kbps for a given format and quality level
 */
export function getBitrate(format: AudioFormat, quality: QualityLevel): number {
  const bitrateMap: Record<AudioFormat, Record<QualityLevel, number>> = {
    mp3: {
      low: 96,
      medium: 128,
      high: 192,
    },
    m4a: {
      low: 96,
      medium: 128,
      high: 192,
    },
    wav: {
      // WAV is uncompressed, bitrate not applicable
      // Return sample rate * bit depth * channels as a reference
      low: 705, // 44.1kHz * 16bit * 1ch / 1000
      medium: 1411, // 44.1kHz * 16bit * 2ch / 1000
      high: 1411, // Same as medium (WAV quality is fixed)
    },
  };

  return bitrateMap[format][quality];
}

/**
 * Get file extension for a format
 */
export function getFileExtension(format: AudioFormat): string {
  return format;
}

/**
 * Get FFmpeg codec name for a format
 */
export function getCodecName(format: AudioFormat): string {
  const codecMap: Record<AudioFormat, string> = {
    mp3: "libmp3lame",
    m4a: "aac",
    wav: "pcm_s16le", // 16-bit PCM
  };

  return codecMap[format];
}
