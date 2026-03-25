import type { ReactNode } from "react";
import { navigateTo } from "../lib/navigation";
import { useDomyliConnection } from "../hooks/useDomyliConnection";

type DomyliPageGuardProps = {
  children: ReactNode;
  loadingTitle?: string;
};

export default function DomyliPageGuard({
  children,
  loadingTitle = "Chargement...",
}: DomyliPageGuardProps) {
  const { isAuthenticated, hasHousehold, authLoading } = useDomyliConnection();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/80">
            DOMYLI
          </p>
          <h1 className="mt-4 text-3xl font-serif italic">{loadingTitle}</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
        <div className="max-w-xl w-full border border-white/10 bg-white/5 p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/80">
            DOMYLI
          </p>
          <h1 className="mt-4 text-3xl font-serif italic">Foyer requis</h1>
          <p className="mt-4 text-alabaster/70">
            Il faut une session authentifiée et un foyer actif pour accéder à
            cette page.
          </p>
          <button
            onClick={() => navigateTo("/")}
            className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
          >
            Retour à l’accueil
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}