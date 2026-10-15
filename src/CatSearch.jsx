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
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <header className="mx-auto flex w-full max-w-xl flex-col gap-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Find a cat breed</h1>
        <form role="search" onSubmit={(event) => event.preventDefault()}>
          <label className="input input-lg w-full shadow-sm focus-within:input-primary">
            <svg
              className="h-[1em] opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2.5" />
              <path
                d="m21 21-4.3-4.3"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="sr-only">Cat breed</span>
            <input
              id="cat-breed-search"
              className="grow"
              type="search"
              value={searchTerm}
              onChange={searchTermOnChange}
              aria-describedby="cat-search-status"
              autoComplete="off"
              maxLength={80}
              placeholder="Search cat breeds"
            />
          </label>
        </form>
      </header>
      <p
        id="cat-search-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-busy={searchState.status === "loading"}
        className="text-center text-sm text-base-content/70"
      >
        {statusMessage}
      </p>
      {searchState.status === "error" && (
        <div className="text-center">
          <button className="btn btn-primary" type="button" onClick={retrySearch}>
            Try again
          </button>
        </div>
      )}
      {searchState.status === "results" && (
        <section aria-label="Search results" className="w-full">
          <ul
            id="cat-search-results"
            className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
          >
            {searchState.hits.map((hit) => (
              <li key={hit.breed}>
                <article className="card overflow-hidden bg-base-100 shadow-sm">
                  {hit.imageUrl ? (
                    <figure className="aspect-[4/3] bg-base-200">
                      <picture className="block size-full">
                        <source srcSet={hit.imageUrl} type="image/jpeg" />
                        <img
                          src={hit.imageUrl}
                          alt={`${hit.breed} cat`}
                          width={hit.imageWidth ?? undefined}
                          height={hit.imageHeight ?? undefined}
                          sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                          loading="lazy"
                          decoding="async"
                          fetchPriority="low"
                          className="size-full object-cover"
                        />
                      </picture>
                    </figure>
                  ) : (
                    <div
                      className="grid aspect-[4/3] place-items-center bg-base-200 p-6 text-center"
                      aria-label={`No image available for ${hit.breed}`}
                    >
                      No image available.
                    </div>
                  )}
                  <div className="card-body">
                    <h3 className="card-title">🐈 {hit.breed}</h3>
                    {hit.description && <p>{hit.description}</p>}
                    {(hit.origin || hit.life_span || hit.temperament) && (
                      <dl className="grid gap-3 text-sm">
                        {hit.origin && (
                          <div>
                            <dt className="font-semibold">Origin</dt>
                            <dd>{hit.origin}</dd>
                          </div>
                        )}
                        {hit.life_span && (
                          <div>
                            <dt className="font-semibold">Life span</dt>
                            <dd>{hit.life_span} years</dd>
                          </div>
                        )}
                        {hit.temperament && (
                          <div>
                            <dt className="font-semibold">Temperament</dt>
                            <dd>{hit.temperament}</dd>
                          </div>
                        )}
                      </dl>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
