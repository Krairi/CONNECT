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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-medium text-slate-700 shadow-sm">
          Vérification DOMYLI…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (requireHousehold && !hasHousehold) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <>{children}</>;
}