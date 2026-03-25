import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { ROUTES } from "@/src/constants/routes";

type Props = {
  children: ReactNode;
  requireHousehold?: boolean;
};

export default function ProtectedRoute({
  children,
  requireHousehold = false,
}: Props) {
  const { authLoading, bootstrapLoading, isAuthenticated, hasHousehold } = useAuth();

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 rounded-full border-2 border-white/20 border-t-amber-300 animate-spin" />
          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-amber-300">
            Vérification DOMYLI
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (requireHousehold && !hasHousehold) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
}