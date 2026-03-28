import type { ReactNode } from "react";
import { navigateTo } from "@/src/lib/navigation";
import { useAuth } from "@/src/providers/AuthProvider";
import { ROUTES } from "@/src/constants/routes";

type DomyliPageGuardProps = {
  children: ReactNode;
  loadingTitle?: string;
};

export default function DomyliPageGuard({
  children,
  loadingTitle = "Chargement...",
}: DomyliPageGuardProps) {
  const { isAuthenticated, hasHousehold, authLoading, bootstrapLoading } =
    useAuth();

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            DOMYLI
          </p>
          <h1 className="mt-4 text-3xl font-semibold">{loadingTitle}</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            DOMYLI
          </p>
          <h1 className="mt-4 text-3xl font-semibold">Session requise</h1>
          <p className="mt-3 text-white/70">
            Il faut une session authentifiée pour accéder à cette page.
          </p>
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.HOME, true)}
            className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-black"
          >
            Retour à l’accueil
          </button>
        </div>
      </div>
    );
  }

  if (!hasHousehold) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            DOMYLI
          </p>
          <h1 className="mt-4 text-3xl font-semibold">Foyer actif requis</h1>
          <p className="mt-3 text-white/70">
            Votre session est valide, mais aucun foyer actif n’est encore résolu.
          </p>
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.ACTIVATE_HOUSEHOLD, true)}
            className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-black"
          >
            Activer mon foyer
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}