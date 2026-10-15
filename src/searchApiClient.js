export function fetchSearchResultsFromAPI(searchTerm) {
  // Note: this API seems a bit unstable and sometimes it takes a long time to respond, especially
  // for broad searches
  return fetch(`https://cat-api.sanity.build/cats?query=${searchTerm}`).then(
    (res) => res.json()
  )
}
