import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import { StorageBoundary } from "./components/StorageBoundary";
import "./styles.css";

const Router =
  import.meta.env.VITE_ROUTER_MODE === "hash" ? HashRouter : BrowserRouter;
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StorageBoundary>
      <Router
        basename={
          import.meta.env.VITE_ROUTER_MODE === "hash"
            ? undefined
            : import.meta.env.BASE_URL
        }
      >
        <App />
      </Router>
    </StorageBoundary>
  </React.StrictMode>,
);
