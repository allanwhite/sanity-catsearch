import React, { useState, useEffect } from "react";
import { fetchSearchResultsFromAPI } from "./searchApiClient";

const MINIMUM_SEARCH_LENGTH = 3;
const SEARCH_DELAY_MS = 300;

export function CatSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchState, setSearchState] = useState({
    status: "idle",
    hits: [],
  });
  const [retryCount, setRetryCount] = useState(0);

  const trimmedSearchTerm = searchTerm.trim();
  const canSearch = trimmedSearchTerm.length >= MINIMUM_SEARCH_LENGTH;

  const searchTermOnChange = (event) => {
    setSearchTerm(event.target.value);
  };

  useEffect(() => {
    if (!canSearch) {
      setSearchState({ status: "idle", hits: [] });
      return;
    }

    const controller = new AbortController();
    let isCurrentRequest = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        const hits = await fetchSearchResultsFromAPI(
          trimmedSearchTerm,
          controller.signal
        );

        if (!isCurrentRequest) {
          return;
        }

        setSearchState({
          status: hits.length > 0 ? "results" : "empty",
          hits,
        });
      } catch (error) {
        if (isCurrentRequest && error.name !== "AbortError") {
          setSearchState({ status: "error", hits: [] });
        }
      }
    }, SEARCH_DELAY_MS);

    setSearchState({ status: "loading", hits: [] });

    return () => {
      isCurrentRequest = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [canSearch, retryCount, trimmedSearchTerm]);

  const retrySearch = () => {
    setRetryCount((count) => count + 1);
  };

  const statusMessage = {
    idle: `Type at least ${MINIMUM_SEARCH_LENGTH} characters to start searching.`,
    loading: "Loading cat breeds…",
    empty: "No matching cat breeds found.",
    error: "We could not search for cat breeds. Try again.",
    results: `${searchState.hits.length} cat breed${
      searchState.hits.length === 1 ? "" : "s"
    } found.`,
  }[searchState.status];

  return (
    <div>
      <h2>Search for cat breed</h2>
      <form role="search" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="cat-breed-search">Cat breed</label>
        <input
          id="cat-breed-search"
          type="search"
          value={searchTerm}
          onChange={searchTermOnChange}
          aria-describedby="cat-search-status"
          autoComplete="off"
          maxLength={80}
        />
      </form>
      <p
        id="cat-search-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-busy={searchState.status === "loading"}
      >
        {statusMessage}
      </p>
      {searchState.status === "error" && (
        <button type="button" onClick={retrySearch}>
          Try again
        </button>
      )}
      {searchState.status === "results" && (
        <section aria-label="Search results">
          <ul id="cat-search-results">
            {searchState.hits.map((hit) => (
              <li key={hit.breed}>🐈 {hit.breed}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
