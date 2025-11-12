/**
 * Platform-agnostic FFmpeg Service
 *
 * Automatically loads the correct platform implementation
 * Metro bundler will automatically resolve to .web.ts or .native.ts based on platform
 */

export * from "./types";

// TypeScript declaration for platform-specific export
// Metro bundler will resolve this to the correct platform implementation (.web.ts or .native.ts)
import type { IFFmpegService } from "./types";
export declare function getFFmpegService(): IFFmpegService;
