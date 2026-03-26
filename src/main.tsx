import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { AuthProvider } from "./providers/AuthProvider";
import { router } from "./app/router";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('DOMYLI root element "#root" not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);