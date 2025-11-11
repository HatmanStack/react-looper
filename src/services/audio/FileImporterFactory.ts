/**
 * File Importer Factory
 *
 * Returns the appropriate FileImporter implementation for the current platform.
 */

import { Platform } from "react-native";
import type { ImportedFile } from "./WebFileImporter";

export type { ImportedFile };

/**
 * File Importer interface
 */
export interface FileImporterClass {
  pickAudioFile(): Promise<ImportedFile>;
}

/**
 * Get the file importer for the current platform
 *
 * @returns Platform-specific file importer class
 */
export function getFileImporter(): FileImporterClass {
  if (Platform.OS === "web") {
    // Dynamic import for web
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { WebFileImporter } = require("./WebFileImporter");
    return WebFileImporter;
  } else {
    // Dynamic import for native
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { NativeFileImporter } = require("./NativeFileImporter");
    return NativeFileImporter;
  }
}
