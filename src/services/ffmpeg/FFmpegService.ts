/**
 * Platform-agnostic FFmpeg Service
 *
 * Automatically loads the correct platform implementation
 */

export * from "./types";
export { getFFmpegService } from "./FFmpegService";
