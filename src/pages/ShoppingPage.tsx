import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  PackageCheck,
  RefreshCw,
  ShoppingCart,
  ShieldCheck,
} from "lucide-react";

import { useDomyliConnection } from "../hooks/useDomyliConnection";
import { useShopping } from "../hooks/useShopping";
import { navigateTo } from "../lib/navigation";
import {
  getShoppingPriorityMeta,
  getShoppingStatusMeta,
  SHOPPING_DOMYLI_FLOWS,
  sortShoppingItemsByDomyliPriority,
  summarizeShoppingCountsByPriority,
  summarizeShoppingCountsByStatus,
} from "../constants/shoppingCatalog";

type ShoppingItemView = {
  item_name?: string | null;
  quantity_needed?: number | null;
  unit?: string | null;
  priority?: string | null;
  status?: string | null;
};

function FlowBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center border border-gold/30 bg-gold/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gold">
      {label}
    </span>
  );
}

export default function ShoppingPage() {
  const {
    sessionEmail,
    activeMembership,
    bootstrap,
    isAuthenticated,
    hasHousehold,
    authLoading,
  } = useDomyliConnection();

  const { loading, rebuilding, error, items, lastRebuild, refresh, rebuild } =
    useShopping();

  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const typedItems = useMemo(
    () => sortShoppingItemsByDomyliPriority((items ?? []) as ShoppingItemView[]),
    [items]
  );

  const prioritySummary = useMemo(
    () => summarizeShoppingCountsByPriority(typedItems),
    [typedItems]
  );

  const statusSummary = useMemo(
    () => summarizeShoppingCountsByStatus(typedItems),
    [typedItems]
  );

  const criticalCount = useMemo(
    () =>
      typedItems.filter(
        (item) => getShoppingPriorityMeta(item.priority).code === "CRITICAL"
      ).length,
    [typedItems]
  );

  if (authLoading) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl border border-gold/20 bg-black/40 p-8">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/80">
            DOMYLI
          </div>
          <h1 className="mt-4 text-3xl font-semibold">
            Chargement du shopping...
          </h1>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl border border-gold/20 bg-black/40 p-8">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/80">
            DOMYLI
          </div>
          <h1 className="mt-4 text-3xl font-semibold">Foyer requis</h1>
          <p className="mt-4 text-white/70">
            Il faut une session authentifiée et un foyer actif pour accéder à la
            shopping list.
          </p>

          <button
            type="button"
            onClick={() => navigateTo("/")}
            className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-black"
          >
            Retour à l’accueil
          </button>
        </div>
      </main>
    );
  }

  const handleRefresh = async () => {
    setLocalMessage(null);

    try {
      await Promise.resolve(refresh());
      setLocalMessage("Lecture shopping actualisée.");
    } catch {
      // erreur gérée par le hook
    }
  };

  const handleRebuild = async () => {
    setLocalMessage(null);

    try {
      await Promise.resolve(rebuild());
      setLocalMessage("Reconstruction shopping lancée.");
    } catch {
      // erreur gérée par le hook
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigateTo("/dashboard")}
              className="mt-1 inline-flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
              aria-label="Retour"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="mt-6 text-xs uppercase tracking-[0.35em] text-gold/80">
              DOMYLI
            </div>
            <h1 className="mt-3 text-4xl font-semibold">Shopping</h1>
            <p className="mt-3 max-w-3xl text-white/65">
              Ici, la shopping list n’est pas une simple liste de courses. C’est
              la matérialisation gouvernée des manques du foyer, issue du stock,
              des seuils et de l’exécution domestique.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
            <div className="mb-6 flex items-center gap-3 text-gold/85">
              <ShoppingCart className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.35em]">
                Shopping gouverné
              </span>
            </div>

            <h2 className="text-3xl font-semibold">Articles à acheter</h2>

            <p className="mt-6 max-w-3xl text-lg leading-9 text-white/65">
              Cette page lit la liste réelle, la classe par criticité et permet
              de relancer la reconstruction métier du besoin d’achat.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                {loading ? "Chargement..." : "Rafraîchir"}
              </button>

              <button
                type="button"
                onClick={handleRebuild}
                disabled={rebuilding}
                className="inline-flex items-center justify-center gap-3 border border-gold/30 px-6 py-4 text-sm uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                {rebuilding ? "Reconstruction..." : "Rebuild shopping"}
              </button>

              <button
                type="button"
                onClick={() => navigateTo("/dashboard")}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {(localMessage || error) && (
              <div className="mt-8 border border-gold/20 bg-gold/10 px-5 py-4 text-lg text-gold">
                {localMessage ?? error?.message}
              </div>
            )}

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                  Articles actifs
                </div>
                <div className="mt-3 text-3xl font-semibold">
                  {typedItems.length}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                  Priorité critique
                </div>
                <div className="mt-3 text-3xl font-semibold">{criticalCount}</div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                  Dernière rebuild
                </div>
                <div className="mt-3 text-base text-white/80">
                  {lastRebuild?.generated_at
                    ? new Date(lastRebuild.generated_at).toLocaleString("fr-FR")
                    : "—"}
                </div>
              </div>
            </div>

            <div className="mt-8">
              {loading && (
                <div className="border border-white/10 bg-black/20 px-5 py-4 text-white/70">
                  Chargement de la shopping list...
                </div>
              )}

              {!loading && !error && typedItems.length === 0 && (
                <div className="border border-white/10 bg-black/20 px-5 py-6 text-white/70">
                  Aucun article dans la shopping list pour le moment.
                </div>
              )}

              {!loading && !error && typedItems.length > 0 && (
                <div className="space-y-4">
                  {typedItems.map((item, index) => {
                    const priorityMeta = getShoppingPriorityMeta(item.priority);
                    const statusMeta = getShoppingStatusMeta(item.status);

                    return (
                      <article
                        key={`${item.item_name ?? "item"}-${index}`}
                        className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                              Article canonique
                            </div>
                            <h3 className="mt-2 text-2xl font-semibold">
                              {item.item_name ?? "—"}
                            </h3>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center border border-gold/30 bg-gold/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gold">
                              {priorityMeta.label}
                            </span>
                            <span className="inline-flex items-center border border-white/10 bg-black/30 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/75">
                              {statusMeta.label}
                            </span>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-3">
                          <div>
                            <div className="text-xs uppercase tracking-[0.22em] text-gold/70">
                              Quantité nécessaire
                            </div>
                            <div className="mt-2 text-lg">
                              {item.quantity_needed ?? 0} {item.unit ?? ""}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs uppercase tracking-[0.22em] text-gold/70">
                              Lecture priorité
                            </div>
                            <div className="mt-2 text-sm text-white/75">
                              {priorityMeta.description}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs uppercase tracking-[0.22em] text-gold/70">
                              Lecture statut
                            </div>
                            <div className="mt-2 text-sm text-white/75">
                              {statusMeta.description}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <ClipboardList className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Lecture métier DOMYLI
                </span>
              </div>

              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Email
                  </div>
                  <div className="mt-3 text-2xl">{sessionEmail ?? "—"}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Foyer
                  </div>
                  <div className="mt-3 text-2xl">
                    {activeMembership?.household_name ?? "—"}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Rôle
                  </div>
                  <div className="mt-3 text-2xl">{activeMembership?.role ?? "—"}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Super Admin
                  </div>
                  <div className="mt-3 text-2xl">
                    {bootstrap?.is_super_admin ? "Oui" : "Non"}
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                  Flux alimentés
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {SHOPPING_DOMYLI_FLOWS.map((flow) => (
                    <FlowBadge key={flow.code} label={flow.label} />
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Synthèse gouvernée
                </span>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                    Répartition par priorité
                  </div>

                  <div className="mt-4 space-y-3">
                    {prioritySummary.map((entry) => (
                      <div
                        key={entry.code}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="text-white/75">{entry.label}</span>
                        <span className="text-gold">{entry.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                    Répartition par statut
                  </div>

                  <div className="mt-4 space-y-3">
                    {statusSummary.map((entry) => (
                      <div
                        key={entry.code}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="text-white/75">{entry.label}</span>
                        <span className="text-gold">{entry.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {lastRebuild && (
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                    <div className="flex items-center gap-3 text-gold/85">
                      <PackageCheck className="h-4 w-4" />
                      <span>
                        Rebuild terminée : {lastRebuild.items_count} article(s)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center gap-3 text-white/45">
                <ShieldCheck className="h-4 w-4 text-gold/80" />
                <span className="text-sm">
                  Shopping gouverné DOMYLI : manque exploitable, priorité
                  lisible, statut traçable.
                </span>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}