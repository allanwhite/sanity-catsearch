import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { CatSearch } from "./CatSearch";
import { ErrorBoundary } from "./ErrorBoundary";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Keep a component crash contained to a useful fallback instead of losing the whole app. */}
    <ErrorBoundary>
      <CatSearch />
    </ErrorBoundary>
  </StrictMode>
);
