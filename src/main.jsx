import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import "./index.css";
import { CatSearch } from "./CatSearch";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CatSearch />
  </StrictMode>
);
