import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSearchResultsFromAPI } from "./searchApiClient";

describe("fetchSearchResultsFromAPI", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("encodes the query and returns valid results", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([{ breed: "Abyssinian" }]),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchSearchResultsFromAPI("a & b")).resolves.toEqual([
      { breed: "Abyssinian" },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://cat-api.sanity.build/cats?query=a%20%26%20b",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("rejects malformed results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ breed: "Abyssinian" }),
      })
    );

    await expect(fetchSearchResultsFromAPI("aby")).rejects.toThrow(
      "unexpected format"
    );
  });

  it("rejects non-success responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 })
    );

    await expect(fetchSearchResultsFromAPI("aby")).rejects.toThrow("503");
  });

  it("stops waiting after five seconds", async () => {
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
});
