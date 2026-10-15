import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSearchResultsFromAPI } from "./searchApiClient";

describe("fetchSearchResultsFromAPI", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("searches The Cat API and returns valid results", async () => {
    vi.stubEnv("VITE_CAT_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          id: "abys",
          name: "Abyssinian",
          origin: "Egypt",
          image: { url: "https://cdn2.thecatapi.com/images/abys.jpg" },
        },
      ]),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchSearchResultsFromAPI("a & b")).resolves.toEqual([
      {
        breed: "Abyssinian",
        imageUrl: "https://cdn2.thecatapi.com/images/abys.jpg",
        id: "abys",
        origin: "Egypt",
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.thecatapi.com/v1/breeds/search?q=a%20%26%20b",
      expect.objectContaining({
        headers: { "x-api-key": "test-key" },
        signal: expect.any(AbortSignal),
      })
    );
  });

  it("rejects malformed results", async () => {
    vi.stubEnv("VITE_CAT_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([{ breed: "Abyssinian" }]),
      })
    );

    await expect(fetchSearchResultsFromAPI("aby")).rejects.toThrow(
      "unexpected format"
    );
  });

  it("rejects non-success responses", async () => {
    vi.stubEnv("VITE_CAT_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 })
    );

    await expect(fetchSearchResultsFromAPI("aby")).rejects.toThrow("503");
  });

  it("stops waiting after five seconds", async () => {
    vi.stubEnv("VITE_CAT_API_KEY", "test-key");
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_, { signal }) =>
        new Promise((_, reject) => {
          signal.addEventListener("abort", () => reject(signal.reason));
        })
      )
    );

    const request = fetchSearchResultsFromAPI("aby");
    const timeoutExpectation = expect(request).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(5_000);

    await timeoutExpectation;
  });

  it("requires a local API key", async () => {
    await expect(fetchSearchResultsFromAPI("aby")).rejects.toThrow(
      "key is not configured"
    );
  });
});
