import React, { useState, useEffect } from "react";
import { fetchSearchResultsFromAPI } from "./searchApiClient";

const MINIMUM_SEARCH_LENGTH = 3;
const SEARCH_DELAY_MS = 300;

function formatFieldName(fieldName) {
  return fieldName
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatFieldValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

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
            {searchState.hits.map((hit) => {
              const details = Object.entries(hit).filter(
                ([fieldName]) => fieldName !== "breed" && fieldName !== "imageUrl"
              );

              return (
                <li key={hit.breed}>
                  <article>
                    <h3>🐈 {hit.breed}</h3>
                    {hit.imageUrl ? (
                      <img
                        src={hit.imageUrl}
                        alt={`${hit.breed} cat`}
                        loading="lazy"
                      />
                    ) : (
                      <p>No image available.</p>
                    )}
                    <table>
                      <caption>{hit.breed} details</caption>
                      <tbody>
                        {details.length > 0 ? (
                          details.map(([fieldName, value]) => (
                            <tr key={fieldName}>
                              <th scope="row">{formatFieldName(fieldName)}</th>
                              <td>{formatFieldValue(value)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="2">No additional details.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
