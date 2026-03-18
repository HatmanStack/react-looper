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
let contextRefCount = 0;

/**
 * Get the shared AudioContext, creating it lazily on first call.
 * Each caller should pair this with releaseAudioContext() when done.
 */
export function getSharedAudioContext(): AudioContext {
  if (!sharedContext || sharedContext.state === "closed") {
    sharedContext = new AudioContext();
    contextRefCount = 0;
    logger.log("[AudioContextManager] Created shared AudioContext");
  }
  contextRefCount++;
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
 * Decrement reference count. Called during player/mixer unload.
 * Does NOT close the context -- it remains available for other users.
 */
export function releaseAudioContext(): void {
  contextRefCount = Math.max(0, contextRefCount - 1);
  logger.log(
    `[AudioContextManager] Released context ref, remaining: ${contextRefCount}`,
  );
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
  contextRefCount = 0;
}

/**
 * Reset for testing -- close and nullify the shared context.
 * @internal Only use in test setup/teardown.
 */
export async function resetAudioContextForTesting(): Promise<void> {
  await closeSharedAudioContext();
}
