import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ROUTES } from "@/src/constants/routes";
import { useAuth } from "@/src/providers/AuthProvider";
import { useAdminAccess } from "@/src/hooks/admin/useAdminAccess";
export default function AdminRoute({ children }: { children: ReactNode }) { const { authLoading, bootstrapLoading, isAuthenticated } = useAuth(); const { permissions, loading } = useAdminAccess(); if (authLoading || bootstrapLoading || loading) return <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center"><div className="glass metallic-border rounded-3xl px-6 py-4">Vérification sécurisée des permissions admin…</div></div>; if (!isAuthenticated) return <Navigate to={ROUTES.landing} replace />; if (!permissions.isSuperAdmin) return <Navigate to={ROUTES.dashboard} replace />; return <>{children}</>; }
