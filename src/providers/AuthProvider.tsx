import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { useDomyliAuthState } from "@/src/hooks/useDomyliAuthState";
import SessionExpiredModal from "@/src/components/system/SessionExpiredModal";

type AuthValue = ReturnType<typeof useDomyliAuthState> & {
  sessionExpired: boolean;
  openSessionExpiredModal: () => void;
  closeSessionExpiredModal: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const auth = useDomyliAuthState();
  const [sessionExpired, setSessionExpired] = useState(false);

  const value = useMemo<AuthValue>(
    () => ({
      ...auth,
      sessionExpired,
      openSessionExpiredModal: () => setSessionExpired(true),
      closeSessionExpiredModal: () => setSessionExpired(false),
    }),
    [auth, sessionExpired]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionExpiredModal
        open={sessionExpired}
        onReconnect={() => {
          setSessionExpired(false);
          void auth.signOut().finally(() => {
            window.location.assign("/");
          });
        }}
      />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within <AuthProvider>.");
  }

  return context;
}