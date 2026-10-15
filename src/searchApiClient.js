const SEARCH_TIMEOUT_MS = 5_000;

function isValidSearchResult(result) {
  return (
    result &&
    typeof result === "object" &&
    typeof result.breed === "string" &&
    result.breed.trim().length > 0
  );
}

export async function fetchSearchResultsFromAPI(searchTerm, signal) {
  const controller = new AbortController();
  const abortRequest = () => controller.abort(signal?.reason);
  const timeoutId = window.setTimeout(
    () => controller.abort(new DOMException("Search request timed out.", "TimeoutError")),
    SEARCH_TIMEOUT_MS
  );

  if (signal) {
    if (signal.aborted) {
      abortRequest();
    } else {
      signal.addEventListener("abort", abortRequest, { once: true });
    }
  }

  try {
    const response = await fetch(
      `https://cat-api.sanity.build/cats?query=${encodeURIComponent(searchTerm)}`,
      { signal: controller.signal }
    );

    if (!response.ok) {
      throw new Error(`Search request failed with status ${response.status}.`);
    }

    const results = await response.json();

    if (!Array.isArray(results) || !results.every(isValidSearchResult)) {
      throw new Error("Search response has an unexpected format.");
    }

    return results;
  } catch (error) {
    if (controller.signal.reason?.name === "TimeoutError") {
      throw new Error("Search request timed out.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortRequest);
  }
}
