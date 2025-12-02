/**
 * Native Audio Export Service
 *
 * Re-exports the native implementation for Metro bundler platform resolution
 */

export * from "./exportTypes";
export { getAudioExportService } from "./FFmpegService.native";
