const SEARCH_TIMEOUT_MS = 5_000;
const CAT_API_BREEDS_URL = "https://api.thecatapi.com/v1/breeds/search";
const CAT_API_IMAGES_URL = "https://api.thecatapi.com/v1/images/search";

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

function isValidCatApiImage(result) {
  return (
    result &&
    typeof result === "object" &&
    typeof result.url === "string" &&
    result.url.length > 0
  );
}

function formatCatApiBreed({ name, image, ...details }, imageResult) {
  return {
    breed: name,
    imageUrl: imageResult?.url ?? image?.url ?? null,
    imageWidth: imageResult?.width ?? image?.width ?? null,
    imageHeight: imageResult?.height ?? image?.height ?? null,
    ...details,
  };
}

function createImageSearchUrl(breeds) {
  const breedIds = breeds.map((breed) => breed.id).filter(Boolean);

  if (breedIds.length === 0) {
    return null;
  }

  const parameters = new URLSearchParams({
    limit: String(Math.min(breedIds.length, 10)),
    breed_ids: breedIds.join(","),
    size: "med",
    mime_types: "jpg",
    include_breeds: "true",
  });

  return `${CAT_API_IMAGES_URL}?${parameters}`;
}

function mapImagesByBreedId(images) {
  const imagesByBreedId = new Map();

  images.forEach((image) => {
    image.breeds?.forEach((breed) => {
      if (breed?.id && !imagesByBreedId.has(breed.id)) {
        imagesByBreedId.set(breed.id, image);
      }
    });
  });

  return imagesByBreedId;
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

    const imageSearchUrl = createImageSearchUrl(results);
    let imagesByBreedId = new Map();

    if (imageSearchUrl) {
      try {
        const imageResponse = await fetch(imageSearchUrl, {
          headers: { "x-api-key": apiKey },
          signal: controller.signal,
        });

        if (!imageResponse.ok) {
          throw new Error(
            `Image request failed with status ${imageResponse.status}.`
          );
        }

        const images = await imageResponse.json();

        if (!Array.isArray(images) || !images.every(isValidCatApiImage)) {
          throw new Error("Image response has an unexpected format.");
        }

        imagesByBreedId = mapImagesByBreedId(images);
      } catch (error) {
        if (controller.signal.aborted) {
          throw error;
        }
      }
    }

    return results.map((breed) =>
      formatCatApiBreed(breed, imagesByBreedId.get(breed.id))
    );
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
