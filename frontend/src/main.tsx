import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import "@/styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <a href="#main-content" className="sr-only-focusable">
      Skip to main content
    </a>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
