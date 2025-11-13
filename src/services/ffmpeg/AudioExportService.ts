/**
 * Platform-agnostic Audio Export Service
 *
 * Automatically loads the correct platform implementation:
 * - Web: Uses Web Audio API + lamejs (WebAudioExportService)
 * - Native: Uses FFmpeg via ffmpeg-kit-react-native (FFmpegService)
 *
 * Metro bundler automatically resolves to .web.ts or .native.ts based on platform
 */

export * from "./exportTypes";

// TypeScript declaration for platform-specific export
// Metro bundler will resolve this to the correct platform implementation (.web.ts or .native.ts)
import type { IAudioExportService } from "./exportTypes";
export declare function getAudioExportService(): IAudioExportService;
