import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { CatSearch } from "./CatSearch";
import { ErrorBoundary } from "./ErrorBoundary";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <CatSearch />
    </ErrorBoundary>
  </StrictMode>
);
