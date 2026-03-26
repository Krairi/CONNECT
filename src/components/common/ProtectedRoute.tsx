import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { ROUTES } from "@/src/constants/routes";

type Props = {
  children: ReactNode;
  requireHousehold?: boolean;
  fallbackPath?: string;
};

export default function ProtectedRoute({
  children,
  requireHousehold = false,
  fallbackPath = ROUTES.home,
}: Props) {
  const { authLoading, bootstrapLoading, isAuthenticated, hasHousehold } =
    useAuth();

  if (authLoading || bootstrapLoading) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-center rounded-[2rem] border border-gold/20 bg-black/40 px-8 py-16">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-gold" />
            <p className="mt-4 text-xs uppercase tracking-[0.3em] text-gold">
              Vérification DOMYLI
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (requireHousehold && !hasHousehold) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}