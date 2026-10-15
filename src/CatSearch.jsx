import React, { useState, useEffect } from "react";
import { fetchSearchResultsFromAPI } from "./searchApiClient";

export function CatSearch() {
  const [valid, setValid] = useState(false);
  const [hits, setHits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const searchTermOnChange = (event) => {
    const { value } = event.target;
    setSearchTerm(value);
  };

  useEffect(() => {
    setValid(true);
    if (searchTerm.length < 3) {
      setValid(false);
      return;
    }

    fetchSearchResultsFromAPI(searchTerm).then((hits) => {
      setHits(hits);
    });
  }, [searchTerm]);

  return (
    <div>
      <h2>Search for cat breed</h2>
      <input type="text" onChange={searchTermOnChange} />
      <div>
        {valid === false
          ? "Type at least two characters to start searching"
          : `You searched for ${searchTerm}`}
      </div>
      <div>
        {(hits && hits.length) > 0
          ? hits.map((hit, i) => <div key={i}>🐈 {hit.breed}</div>)
          : "No hits"}
      </div>
    </div>
  );
}
