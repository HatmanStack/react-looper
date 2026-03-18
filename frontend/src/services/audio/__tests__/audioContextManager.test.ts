/**
 * Tests for AudioContext Manager singleton
 */
import {
  getSharedAudioContext,
  ensureContextResumed,
  closeSharedAudioContext,
  resetAudioContextForTesting,
} from "../audioContextManager";

// Set up a proper AudioContext mock that tracks state
const originalAudioContext = global.AudioContext;

beforeAll(() => {
  (global as any).AudioContext = jest.fn().mockImplementation(() => {
    const ctx: any = {
      state: "running",
      resume: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockImplementation(() => {
        ctx.state = "closed";
        return Promise.resolve();
      }),
      createGain: jest.fn(),
      createBufferSource: jest.fn(),
      decodeAudioData: jest.fn(),
      destination: {},
      currentTime: 0,
      sampleRate: 44100,
    };
    return ctx;
  });
});

afterAll(() => {
  global.AudioContext = originalAudioContext;
});

describe("audioContextManager", () => {
  afterEach(async () => {
    await resetAudioContextForTesting();
  });

  describe("getSharedAudioContext", () => {
    it("returns an AudioContext instance", () => {
      const ctx = getSharedAudioContext();
      expect(ctx).toBeDefined();
    });

    it("returns the same instance on multiple calls", () => {
      const ctx1 = getSharedAudioContext();
      const ctx2 = getSharedAudioContext();
      expect(ctx1).toBe(ctx2);
    });

    it("creates a new context after close", async () => {
      const ctx1 = getSharedAudioContext();
      await closeSharedAudioContext();
      const ctx2 = getSharedAudioContext();
      expect(ctx2).toBeDefined();
      expect(ctx2).not.toBe(ctx1);
    });
  });

  describe("ensureContextResumed", () => {
    it("is a no-op when no context exists", async () => {
      await expect(ensureContextResumed()).resolves.toBeUndefined();
    });

    it("resumes a suspended context", async () => {
      const ctx = getSharedAudioContext();
      Object.defineProperty(ctx, "state", {
        value: "suspended",
        writable: true,
        configurable: true,
      });
      await ensureContextResumed();
      expect(ctx.resume).toHaveBeenCalled();
    });

    it("does not resume a running context", async () => {
      const ctx = getSharedAudioContext();
      // state is "running" by default from mock
      Object.defineProperty(ctx, "state", {
        value: "running",
        writable: true,
        configurable: true,
      });
      await ensureContextResumed();
      expect(ctx.resume).not.toHaveBeenCalled();
    });
  });

  describe("closeSharedAudioContext", () => {
    it("nullifies the context so a new one is created next", async () => {
      const ctx1 = getSharedAudioContext();
      await closeSharedAudioContext();
      const ctx2 = getSharedAudioContext();
      expect(ctx2).not.toBe(ctx1);
    });

    it("is safe to call when no context exists", async () => {
      await expect(closeSharedAudioContext()).resolves.toBeUndefined();
    });

    it("calls close on the context", async () => {
      const ctx = getSharedAudioContext();
      await closeSharedAudioContext();
      expect(ctx.close).toHaveBeenCalled();
    });
  });
});
