// ─── main.tsx ─────────────────────────────────────────────────────────────────
// The absolute entry point: mounts the React app into the #root div in index.html
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // StrictMode double-invokes lifecycle methods in development to catch bugs.
  // It has no effect in production builds.
  <React.StrictMode>
    <App />
  </React.StrictMode>
);