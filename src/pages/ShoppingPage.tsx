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
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/providers/AuthProvider";
import { useShopping } from "@/src/hooks/useShopping";
import { ROUTES } from "@/src/constants/routes";
import {
  getShoppingPriorityMeta,
  getShoppingStatusMeta,
  SHOPPING_DOMYLI_FLOWS,
  sortShoppingItemsByDomyliPriority,
  summarizeShoppingCountsByPriority,
  summarizeShoppingCountsByStatus,
} from "@/src/constants/shoppingCatalog";

type ShoppingItemView = {
  item_name?: string | null;
  quantity_needed?: number | null;
  unit?: string | null;
  priority?: string | null;
  status?: string | null;
};

function FlowBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gold">
      {label}
    </span>
  );
}

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

  const { loading, rebuilding, error, items, lastRebuild, refresh, rebuild } =
    useShopping();

  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const typedItems = useMemo(
    () => sortShoppingItemsByDomyliPriority((items ?? []) as ShoppingItemView[]),
    [items],
  );

  const prioritySummary = useMemo(
    () => summarizeShoppingCountsByPriority(typedItems),
    [typedItems],
  );

  const statusSummary = useMemo(
    () => summarizeShoppingCountsByStatus(typedItems),
    [typedItems],
  );

  const criticalCount = useMemo(
    () =>
      typedItems.filter(
        (item) => getShoppingPriorityMeta(item.priority).code === "CRITICAL",
      ).length,
    [typedItems],
  );

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            DOMYLI
          </p>
          <h1 className="mt-4 text-3xl font-semibold">
            Chargement du shopping...
          </h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            DOMYLI
          </p>
          <h1 className="mt-4 text-3xl font-semibold">Foyer requis</h1>
          <p className="mt-3 text-white/70">
            Il faut une session authentifiée et un foyer actif pour accéder à la
            shopping list.
          </p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-black"
          >
            Retour à l’accueil
          </button>
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    setLocalMessage(null);

    try {
      await refresh();
      setLocalMessage("Lecture shopping actualisée.");
    } catch {
      // erreur gérée par le hook
    }
  };

  const handleRebuild = async () => {
    setLocalMessage(null);

    try {
      await rebuild();
      setLocalMessage("Reconstruction shopping lancée.");
    } catch {
      // erreur gérée par le hook
    }
  };

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <button
                type="button"
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="mt-1 inline-flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
                aria-label="Retour"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.24em] text-gold">
                  DOMYLI
                </p>
                <h1 className="mt-4 text-3xl font-semibold">Shopping</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                  Ici, la shopping list n’est pas une simple liste de courses.
                  C’est la matérialisation gouvernée des manques du foyer, issue
                  du stock, des seuils et de l’exécution domestique.
                </p>
              </div>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-gold">
              <ShoppingCart className="h-4 w-4" />
              Shopping gouverné
            </div>

            <h2 className="mt-6 text-2xl font-semibold">Articles à acheter</h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
              Cette page lit la liste réelle, la classe par criticité et permet
              de relancer la reconstruction métier du besoin d’achat.
            </p>

            <div className="mt-8 flex flex-col gap-3 md:flex-row">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex flex-1 items-center justify-center gap-3 border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.24em] text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Chargement..." : "Rafraîchir"}
              </button>

              <button
                type="button"
                onClick={handleRebuild}
                disabled={rebuilding}
                className="inline-flex flex-1 items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PackageCheck
                  className={`h-4 w-4 ${rebuilding ? "animate-pulse" : ""}`}
                />
                {rebuilding ? "Reconstruction..." : "Rebuild shopping"}
              </button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Dashboard
              </button>
            </div>

            {(localMessage || error) && (
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/85">
                {localMessage ?? error?.message}
              </div>
            )}

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Articles actifs
                </p>
                <p className="mt-3 text-3xl font-semibold">{typedItems.length}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Priorité critique
                </p>
                <p className="mt-3 text-3xl font-semibold">{criticalCount}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Dernière rebuild
                </p>
                <p className="mt-3 text-sm text-white/80">
                  {lastRebuild?.generated_at
                    ? new Date(lastRebuild.generated_at).toLocaleString("fr-FR")
                    : "—"}
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {loading && (
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-white/70">
                  Chargement de la shopping list...
                </div>
              )}

              {!loading && !error && typedItems.length === 0 && (
                <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/60">
                  Aucun article dans la shopping list pour le moment.
                </div>
              )}

              {!loading &&
                !error &&
                typedItems.length > 0 &&
                typedItems.map((item, index) => {
                  const priorityMeta = getShoppingPriorityMeta(item.priority);
                  const statusMeta = getShoppingStatusMeta(item.status);

                  return (
                    <article
                      key={`${item.item_name ?? "shopping-item"}-${index}`}
                      className="rounded-3xl border border-white/10 bg-black/20 p-6"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                            Article canonique
                          </p>
                          <h3 className="mt-2 text-xl font-medium">
                            {item.item_name ?? "—"}
                          </h3>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gold">
                            {priorityMeta.label}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/75">
                            {statusMeta.label}
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                            Quantité nécessaire
                          </p>
                          <p className="mt-2 text-sm text-white/85">
                            {item.quantity_needed ?? 0} {item.unit ?? ""}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                            Lecture priorité
                          </p>
                          <p className="mt-2 text-sm text-white/85">
                            {priorityMeta.description}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                            Lecture statut
                          </p>
                          <p className="mt-2 text-sm text-white/85">
                            {statusMeta.description}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
            </div>
          </section>

          <aside className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/70">
              <ShieldCheck className="h-4 w-4" />
              Lecture métier DOMYLI
            </div>

            <div className="mt-8 space-y-5">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Email
                </p>
                <p className="mt-2 text-sm text-white/85">{sessionEmail ?? "—"}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Foyer
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {activeMembership?.household_name ?? "—"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Rôle
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {activeMembership?.role ?? "—"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Super Admin
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {bootstrap?.is_super_admin ? "Oui" : "Non"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Flux alimentés
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SHOPPING_DOMYLI_FLOWS.map((flow) => (
                    <FlowBadge key={flow.code} label={flow.label} />
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="inline-flex items-center gap-2 text-white">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.24em]">
                    Synthèse gouvernée
                  </p>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                      Répartition par priorité
                    </p>
                    <div className="mt-3 space-y-2">
                      {prioritySummary.map((entry) => (
                        <div
                          key={entry.code}
                          className="flex items-center justify-between text-sm text-white/80"
                        >
                          <span>{entry.label}</span>
                          <span>{entry.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                      Répartition par statut
                    </p>
                    <div className="mt-3 space-y-2">
                      {statusSummary.map((entry) => (
                        <div
                          key={entry.code}
                          className="flex items-center justify-between text-sm text-white/80"
                        >
                          <span>{entry.label}</span>
                          <span>{entry.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {lastRebuild && (
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                      Rebuild terminée : {lastRebuild.items_count} article(s)
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-gold/20 bg-gold/10 p-5">
                <div className="inline-flex items-center gap-2 text-gold">
                  <ClipboardList className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.24em]">
                    Lecture système
                  </p>
                </div>

                <p className="mt-3 text-sm leading-7 text-gold/90">
                  Shopping gouverné DOMYLI : manque exploitable, priorité lisible,
                  statut traçable.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate(ROUTES.MEALS)}
                className="inline-flex w-full items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Continuer vers Meals
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}