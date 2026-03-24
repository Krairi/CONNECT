import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/src/App";
import { AuthProvider } from "@/src/providers/AuthProvider";
import { AppErrorBoundary } from "@/src/components/system/AppErrorBoundary";
import "@/src/index.css";
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("DOMYLI_ROOT_NOT_FOUND");
createRoot(rootElement).render(<StrictMode><AppErrorBoundary><AuthProvider><App /></AuthProvider></AppErrorBoundary></StrictMode>);
