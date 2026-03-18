/**
 * Download a Blob as a file (Native implementation)
 *
 * On native platforms, Blob-based downloads are not applicable.
 * The native export flow uses file URIs handled by the AudioExportService.
 * This function exists to satisfy the cross-platform import and should
 * not be called in normal native flows.
 */
import { logger } from "./logger";

export function downloadBlob(_blob: Blob, _filename: string): void {
  logger.warn(
    "[downloadFile] downloadBlob called on native platform -- this is unexpected. Native exports use file URIs.",
  );
}
