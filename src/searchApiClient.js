const SEARCH_TIMEOUT_MS = 5_000;
const CAT_API_BREEDS_URL = "https://api.thecatapi.com/v1/breeds/search";

function isValidCatApiBreed(result) {
  return (
    result &&
    typeof result === "object" &&
    typeof result.name === "string" &&
    result.name.trim().length > 0 &&
    (result.image === undefined ||
      result.image === null ||
      (typeof result.image === "object" && typeof result.image.url === "string"))
  );
}

function formatCatApiBreed({ name, image, ...details }) {
  return {
    breed: name,
    imageUrl: image?.url ?? null,
    ...details,
  };
}

export async function fetchSearchResultsFromAPI(searchTerm, signal) {
  const apiKey = import.meta.env.VITE_CAT_API_KEY;

  if (!apiKey) {
    throw new Error("The Cat API key is not configured.");
  }

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
      `${CAT_API_BREEDS_URL}?q=${encodeURIComponent(searchTerm)}`,
      {
        headers: { "x-api-key": apiKey },
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new Error(`Search request failed with status ${response.status}.`);
    }

    const results = await response.json();

    if (!Array.isArray(results) || !results.every(isValidCatApiBreed)) {
      throw new Error("Search response has an unexpected format.");
    }

    return results.map(formatCatApiBreed);
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
