import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/src/contexts/AuthContext";
import { ROUTES } from "@/src/constants/routes";

type DomyliPageGuardProps = {
  children: ReactNode;
  requireHousehold?: boolean;
  requireAdmin?: boolean;
};

export default function DomyliPageGuard({
  children,
  requireHousehold = false,
  requireAdmin = false,
}: DomyliPageGuardProps) {
  const { authLoading, bootstrapLoading, isAuthenticated, hasHousehold, bootstrap } = useAuth();

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-6 h-12 w-12 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
          <p className="text-sm uppercase tracking-[0.3em] text-gold/80">
            {requireAdmin ? "Vérification des droits administrateur" : "Vérification de l’accès DOMYLI"}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (requireAdmin && !bootstrap?.is_super_admin) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  if (requireHousehold && !hasHousehold) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
}