import { createContext, useContext } from "react";
import { useDomyliAuthState } from "@/src/hooks/useDomyliAuthState";

type AuthStateValue = ReturnType<typeof useDomyliAuthState>;

export type AuthContextValue = AuthStateValue & {
  refreshAuthState: () => Promise<void>;
  sessionExpired: boolean;
  openSessionExpiredModal: () => void;
  closeSessionExpiredModal: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within <AuthProvider>.");
  }

  return context;
}
