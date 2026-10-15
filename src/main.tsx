import React from "react";
import { createRoot } from "react-dom/client";
import AuthRoot from "./Auth";
import "./styles.css";
import "./brand-theme.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthRoot />
  </React.StrictMode>,
);
