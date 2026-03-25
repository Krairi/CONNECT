import { useAuth } from "@/src/providers/AuthProvider";

export function useDomyliConnection() {
  return useAuth();
}