import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "@/src/constants/routes";
import { useAuth } from "@/src/providers/AuthProvider";
export default function ProtectedRoute({ children }: { children: ReactNode }) { const location = useLocation(); const { authLoading, bootstrapLoading, isAuthenticated } = useAuth(); if (authLoading || bootstrapLoading) return <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center"><div className="glass metallic-border rounded-3xl px-6 py-4">Chargement sécurisé de votre espace DOMYLI…</div></div>; if (!isAuthenticated) return <Navigate to={ROUTES.landing} replace state={{ from: location.pathname }} />; return <>{children}</>; }
