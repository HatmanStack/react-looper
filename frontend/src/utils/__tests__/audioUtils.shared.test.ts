/**
 * Tests for fetchWithTimeout in audioUtils.shared
 */
import { fetchWithTimeout, AUDIO_FETCH_TIMEOUT_MS } from "../audioUtils.shared";
import { AudioError } from "../../services/audio/AudioError";

describe("fetchWithTimeout", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it("exports AUDIO_FETCH_TIMEOUT_MS as 30000", () => {
    expect(AUDIO_FETCH_TIMEOUT_MS).toBe(30_000);
  });

  it("returns the Response on successful fetch", async () => {
    const mockResponse = new Response("ok", { status: 200 });
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const response = await fetchWithTimeout("https://example.com/audio.mp3");
    expect(response).toBe(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/audio.mp3",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("rejects with AudioError when fetch times out", async () => {
    jest.useFakeTimers();

    // Mock fetch that never resolves
    global.fetch = jest.fn().mockImplementation((_uri: string, options: RequestInit) => {
      return new Promise((_resolve, reject) => {
        options.signal?.addEventListener("abort", () => {
          const abortError = new DOMException("The operation was aborted.", "AbortError");
          reject(abortError);
        });
      });
    });

    const promise = fetchWithTimeout("https://example.com/audio.mp3", 5000);

    // Advance timers to trigger the timeout
    jest.advanceTimersByTime(5000);

    await expect(promise).rejects.toThrow(AudioError);
    await expect(promise).rejects.toThrow(/timed out/);
  });

  it("propagates non-abort errors as-is", async () => {
    const networkError = new TypeError("Failed to fetch");
    global.fetch = jest.fn().mockRejectedValue(networkError);

    await expect(
      fetchWithTimeout("https://example.com/audio.mp3"),
    ).rejects.toThrow(TypeError);
    await expect(
      fetchWithTimeout("https://example.com/audio.mp3"),
    ).rejects.toThrow("Failed to fetch");
  });
});
