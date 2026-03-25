import {
  ArrowLeft,
  RefreshCw,
  ShoppingCart,
  House,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { useShopping } from "@/src/hooks/useShopping";
import { ROUTES } from "@/src/constants/routes";

export default function ShoppingPage() {
  const navigate = useNavigate();

  const {
    sessionEmail,
    activeMembership,
    bootstrap,
    isAuthenticated,
    hasHousehold,
    authLoading,
    bootstrapLoading,
  } = useAuth();

  const householdId = bootstrap?.active_household_id ?? null;

  const { loading, rebuilding, error, items, lastRebuild, refresh, rebuild } =
    useShopping(householdId);

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold">
            Chargement du shopping...
          </h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold || !householdId) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold">
            DOMYLI
          </div>

          <h1 className="mt-4 text-4xl font-semibold">Foyer requis</h1>

          <p className="mt-5 max-w-2xl text-alabaster/70 leading-8">
            Il faut une session authentifiée et un foyer actif pour accéder à
            la shopping list.
          </p>

          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
          >
            Retour à l’accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-alabaster px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="mt-1 h-10 w-10 border border-white/10 flex items-center justify-center hover:border-gold/40 transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-gold">
              DOMYLI
            </div>
            <h1 className="mt-2 text-4xl font-semibold">Shopping</h1>
            <p className="mt-3 max-w-2xl text-alabaster/70 leading-8">
              Le shopping matérialise l’impact du stock, des repas et des seuils.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="glass metallic-border rounded-[2rem] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-3 text-gold">
                  <ShoppingCart size={18} />
                  <span className="text-xs uppercase tracking-[0.3em]">
                    Liste de courses
                  </span>
                </div>

                <h2 className="mt-5 text-2xl font-semibold text-alabaster">
                  Articles à acheter
                </h2>

                <p className="mt-4 text-sm leading-8 text-alabaster/65">
                  Cette page lit la liste de courses réelle et permet de la
                  reconstruire.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="inline-flex items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.24em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                  Rafraîchir
                </button>

                <button
                  type="button"
                  onClick={() => void rebuild()}
                  disabled={rebuilding}
                  className="inline-flex items-center justify-center gap-3 border border-gold/40 px-5 py-4 text-sm uppercase tracking-[0.24em] text-gold hover:bg-gold hover:text-obsidian transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={16} className={rebuilding ? "animate-spin" : ""} />
                  {rebuilding ? "Rebuild..." : "Rebuild"}
                </button>
              </div>
            </div>

            {loading && (
              <div className="mt-8 rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm text-alabaster/65">
                Chargement de la shopping list...
              </div>
            )}

            {error && (
              <div className="mt-8 border border-gold/20 bg-gold/5 px-4 py-4 text-sm text-gold">
                {error.message}
              </div>
            )}

            {!loading && !error && items.length === 0 && (
              <div className="mt-8 rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm text-alabaster/65">
                Aucun article dans la shopping list pour le moment.
              </div>
            )}

            {!loading && !error && items.length > 0 && (
              <div className="mt-8 space-y-4">
                {items.map((item) => (
                  <article
                    key={item.shopping_item_id}
                    className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4"
                  >
                    <div className="grid gap-4 md:grid-cols-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                          Article
                        </div>
                        <div className="mt-2 text-sm text-alabaster">
                          {item.item_name}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                          Quantité
                        </div>
                        <div className="mt-2 text-sm text-alabaster">
                          {item.quantity_needed} {item.unit ?? ""}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                          Priorité
                        </div>
                        <div className="mt-2 text-sm text-alabaster">
                          {item.priority ?? "—"}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                          Statut
                        </div>
                        <div className="mt-2 text-sm text-alabaster">
                          {item.status ?? "—"}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {lastRebuild && (
              <div className="mt-8 rounded-2xl border border-gold/15 bg-gold/5 px-4 py-4 text-sm text-gold">
                Rebuild terminée : {lastRebuild.items_count} article(s), généré à{" "}
                {new Date(lastRebuild.generated_at).toLocaleString("fr-FR")}.
              </div>
            )}
          </section>

          <aside className="glass metallic-border rounded-[2rem] p-7">
            <div className="inline-flex items-center gap-3 text-gold">
              <House size={18} />
              <span className="text-xs uppercase tracking-[0.3em]">
                Contexte actif
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                  Email
                </div>
                <div className="mt-2 text-sm text-alabaster">
                  {sessionEmail ?? "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                  Foyer
                </div>
                <div className="mt-2 text-sm text-alabaster">
                  {activeMembership?.household_name ?? "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                  Rôle
                </div>
                <div className="mt-2 text-sm text-alabaster">
                  {activeMembership?.role ?? "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                  Super Admin
                </div>
                <div className="mt-2 text-sm text-alabaster">
                  {bootstrap?.is_super_admin ? "Oui" : "Non"}
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm leading-8 text-alabaster/65">
              Le shopping matérialise l’impact stock + repas + seuils.
              <div className="mt-3 text-gold/90">
                RPC : <code>app.rpc_shopping_list_rebuild</code> /{" "}
                <code>rpc_shopping_list_list</code>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="mt-8 inline-flex w-full items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.24em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
            >
              Retour dashboard
              <ArrowRight size={16} />
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}