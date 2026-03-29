import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { ROUTES } from "@/src/constants/routes";

type Props = {
  children: ReactNode;
  requireHousehold?: boolean;
  requireSuperAdmin?: boolean;
  allowSuperAdminBypassHousehold?: boolean;
};

function getAuthenticatedFallbackRoute(hasHousehold: boolean): string {
  return hasHousehold ? ROUTES.DASHBOARD : ROUTES.ACTIVATE_HOUSEHOLD;
}

export default function ProtectedRoute({
  children,
  requireHousehold = false,
  requireSuperAdmin = false,
  allowSuperAdminBypassHousehold = false,
}: Props) {
  const {
    authLoading,
    bootstrapLoading,
    isAuthenticated,
    hasHousehold,
    bootstrap,
  } = useAuth();

  const isSuperAdmin = Boolean(bootstrap?.is_super_admin);
  const canBypassHousehold =
    allowSuperAdminBypassHousehold && isSuperAdmin;

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 rounded-full border-2 border-white/20 border-t-gold animate-spin" />
          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-gold">
            Vérification DOMYLI
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return (
      <Navigate
        to={getAuthenticatedFallbackRoute(hasHousehold)}
        replace
      />
    );
  }

  if (requireHousehold && !hasHousehold && !canBypassHousehold) {
    return <Navigate to={ROUTES.ACTIVATE_HOUSEHOLD} replace />;
  }

  return <>{children}</>;
}