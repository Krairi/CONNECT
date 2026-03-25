import { ROUTES } from "@/src/constants/routes";

export { ROUTES };

export function navigateTo(path: string, replace = false) {
  if (typeof window === "undefined") return;

  if (replace) {
    window.history.replaceState({}, "", path);
  } else {
    window.history.pushState({}, "", path);
  }

  window.dispatchEvent(new PopStateEvent("popstate"));
}