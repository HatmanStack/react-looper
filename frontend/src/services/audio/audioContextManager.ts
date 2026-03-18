/**
 * AudioContext Manager
 *
 * Provides a shared AudioContext singleton for all web audio components.
 * Lazily creates the context on first access and handles the suspended-state
 * resume required by browser autoplay policies.
 *
 * ADR-2: Share AudioContext via singleton pattern.
 */
import { logger } from "../../utils/logger";

let sharedContext: AudioContext | null = null;

/**
 * Get the shared AudioContext, creating it lazily on first call.
 */
export function getSharedAudioContext(): AudioContext {
  if (!sharedContext || sharedContext.state === "closed") {
    sharedContext = new AudioContext();
    logger.log("[AudioContextManager] Created shared AudioContext");
  }
  return sharedContext;
}

/**
 * Resume the shared AudioContext if suspended (browser autoplay policy).
 */
export async function ensureContextResumed(): Promise<void> {
  if (sharedContext && sharedContext.state === "suspended") {
    await sharedContext.resume();
  }
}

/**
 * Force-close the shared AudioContext. Called during full app cleanup only.
 */
export async function closeSharedAudioContext(): Promise<void> {
  if (sharedContext && sharedContext.state !== "closed") {
    try {
      await sharedContext.close();
      logger.log("[AudioContextManager] Closed shared AudioContext");
    } catch {
      // Already closed
    }
  }
  sharedContext = null;
}

/**
 * Reset for testing -- close and nullify the shared context.
 * @internal Only use in test setup/teardown.
 */
export async function resetAudioContextForTesting(): Promise<void> {
  await closeSharedAudioContext();
}
