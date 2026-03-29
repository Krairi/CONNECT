import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Utensils,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/providers/AuthProvider";
import { useDashboard } from "@/src/hooks/useDashboard";
import { ROUTES } from "@/src/constants/routes";

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("fr-FR");
}

function getFeedSeverity(status: string) {
  const upper = status.toUpperCase();

  if (["BLOCKED", "CRITICAL", "OVERDUE", "FAILED"].includes(upper)) {
    return {
      code: "CRITICAL",
      label: "Critique",
      description: "À traiter en premier.",
    };
  }

  if (["WARNING", "WATCH", "LOW", "OPEN", "PLANNED"].includes(upper)) {
    return {
      code: "WATCH",
      label: "Sous surveillance",
      description: "À suivre de près.",
    };
  }

  if (["CONFIRMED", "DONE", "COMPLETED", "RESERVED"].includes(upper)) {
    return {
      code: "STABLE",
      label: "Stable",
      description: "Signal maîtrisé.",
    };
  }

  return {
    code: "ATTENTION",
    label: "Attention",
    description: "Signal à lire.",
  };
}

function FlowBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gold">
      {label}
    </span>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    sessionEmail,
    bootstrap,
    activeMembership,
    isAuthenticated,
    hasHousehold,
    authLoading,
    bootstrapLoading,
  } = useAuth();

  const { loading, error, health, feed, activation, valueChain, refresh } =
    useDashboard();

  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const priorityFeed = useMemo(() => {
    return [...feed].sort((a, b) => {
      const rank = (status: string) => {
        const code = getFeedSeverity(status).code;
        if (code === "CRITICAL") return 0;
        if (code === "ATTENTION") return 1;
        if (code === "WATCH") return 2;
        return 3;
      };

      return rank(a.status) - rank(b.status);
    });
  }, [feed]);

  const nextRecommendedRoute = useMemo(() => {
    if (!activation?.has_profiles) return ROUTES.PROFILES;
    if (!activation?.has_inventory) return ROUTES.INVENTORY;
    if ((valueChain?.shopping_open_count ?? 0) > 0) return ROUTES.SHOPPING;
    if (!activation?.has_meals) return ROUTES.MEALS;
    if (!activation?.has_tasks) return ROUTES.TASKS;
    return ROUTES.STATUS;
  }, [activation, valueChain]);

  const nextRecommendedLabel = useMemo(() => {
    switch (nextRecommendedRoute) {
      case ROUTES.PROFILES:
        return "Continuer vers Profiles";
      case ROUTES.INVENTORY:
        return "Continuer vers Inventory";
      case ROUTES.SHOPPING:
        return "Continuer vers Shopping";
      case ROUTES.MEALS:
        return "Continuer vers Meals";
      case ROUTES.TASKS:
        return "Continuer vers Tasks";
      default:
        return "Continuer vers Status";
    }
  }, [nextRecommendedRoute]);

  if (authLoading || bootstrapLoading || loading) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-semibold">
            Chargement du dashboard...
          </h1>
          <p className="mt-3 text-white/70">
            Synchronisation des signaux métier, activation et chaîne de valeur.
          </p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-semibold">Contexte insuffisant</h1>
          <p className="mt-3 text-white/70">
            Le dashboard métier nécessite une session authentifiée et un foyer actif.
          </p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
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
      await refresh();
      setLocalMessage("Dashboard DOMYLI rafraîchi.");
    } catch {
      // erreur gérée par le hook
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <button
                type="button"
                onClick={() => navigate(ROUTES.HOME)}
                className="mt-1 inline-flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
                aria-label="Retour"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.24em] text-gold">
                  DOMYLI
                </p>
                <h1 className="mt-4 text-3xl font-semibold">Dashboard</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                  Ici, le dashboard n’est plus un simple point d’entrée. Il lit
                  l’activation du foyer, la santé du jour, la chaîne de valeur
                  et le flux prioritaire remonté par le système.
                </p>
              </div>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-gold">
              <LayoutDashboard className="h-4 w-4" />
              Cockpit métier
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center justify-center gap-3 border border-gold/30 px-6 py-4 text-sm uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold/10"
              >
                <RefreshCw className="h-4 w-4" />
                Rafraîchir
              </button>

              <button
                type="button"
                onClick={() => navigate(nextRecommendedRoute)}
                className="inline-flex items-center justify-center gap-3 bg-gold px-6 py-4 text-sm uppercase tracking-[0.24em] text-black transition-opacity hover:opacity-90"
              >
                <ArrowRight className="h-4 w-4" />
                {nextRecommendedLabel}
              </button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.STATUS)}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Ouvrir Status
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
                  Score d’activation
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {activation?.activation_score ?? 0}
                </p>
                <p className="mt-2 text-sm text-white/60">
                  {activation?.is_operational ? "Foyer opérationnel" : "Foyer en montée"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Alertes ouvertes
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {health?.open_alert_count ?? 0}
                </p>
                <p className="mt-2 text-sm text-white/60">
                  Vigilance quotidienne
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Charges ouvertes
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {(valueChain?.shopping_open_count ?? 0) +
                    (health?.overdue_tasks_count ?? 0)}
                </p>
                <p className="mt-2 text-sm text-white/60">
                  Courses + tâches en retard
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-5">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <Boxes className="h-5 w-5 text-gold" />
                <p className="mt-3 text-2xl font-semibold">
                  {health?.missing_stock_count ?? 0}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/50">
                  Stock manquant
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <ShoppingCart className="h-5 w-5 text-gold" />
                <p className="mt-3 text-2xl font-semibold">
                  {valueChain?.shopping_open_count ?? 0}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/50">
                  Shopping open
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <Utensils className="h-5 w-5 text-gold" />
                <p className="mt-3 text-2xl font-semibold">
                  {health?.planned_meals_count ?? 0}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/50">
                  Repas planifiés
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <ClipboardList className="h-5 w-5 text-gold" />
                <p className="mt-3 text-2xl font-semibold">
                  {health?.overdue_tasks_count ?? 0}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/50">
                  Tâches en retard
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <Wrench className="h-5 w-5 text-gold" />
                <p className="mt-3 text-2xl font-semibold">
                  {health?.blocked_tools_count ?? 0}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/50">
                  Outils bloqués
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-gold" />
                <h2 className="text-xl font-medium">Flux prioritaire du jour</h2>
              </div>

              <div className="mt-6 space-y-4">
                {priorityFeed.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/60">
                    Aucun signal remonté pour le moment.
                  </div>
                ) : (
                  priorityFeed.slice(0, 8).map((item) => {
                    const severity = getFeedSeverity(item.status);

                    return (
                      <article
                        key={`${item.item_type}-${item.item_id}`}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                              {item.item_type}
                            </p>
                            <h3 className="mt-2 text-lg font-medium">
                              {item.title}
                            </h3>
                            <p className="mt-2 text-sm text-white/60">
                              {item.status} · {formatDate(item.scheduled_at)}
                            </p>
                          </div>

                          <div className="rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gold">
                            {severity.label}
                          </div>
                        </div>

                        <p className="mt-4 text-sm text-white/65">
                          {severity.description}
                        </p>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Lecture métier DOMYLI
                </span>
              </div>

              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Session
                  </div>
                  <div className="mt-3 text-2xl">{sessionEmail ?? "—"}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Foyer actif
                  </div>
                  <div className="mt-3 text-2xl">
                    {activeMembership?.household_name ?? "—"}
                  </div>
                  <div className="mt-2 text-sm text-white/60">
                    Household ID : {bootstrap?.active_household_id ?? "—"}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Gouvernance
                  </div>
                  <div className="mt-3 text-2xl">
                    {activeMembership?.role ?? "—"}
                  </div>
                  <div className="mt-2 text-sm text-white/60">
                    Super Admin : {bootstrap?.is_super_admin ? "Oui" : "Non"}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Jour observé
                  </div>
                  <div className="mt-3 text-2xl">{health?.day ?? "—"}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Chaîne de valeur
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <FlowBadge label={`Members ${valueChain?.members_count ?? 0}`} />
                    <FlowBadge label={`Profiles ${valueChain?.profiles_count ?? 0}`} />
                    <FlowBadge label={`Inventory ${valueChain?.inventory_items_count ?? 0}`} />
                    <FlowBadge label={`Meals ${valueChain?.meal_slots_count ?? 0}`} />
                    <FlowBadge label={`Tasks ${valueChain?.tasks_count ?? 0}`} />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Activation pilotée
                </span>
              </div>

              <div className="space-y-4">
                {[
                  ["Membres", activation?.has_members],
                  ["Profils", activation?.has_profiles],
                  ["Inventaire", activation?.has_inventory],
                  ["Tâches", activation?.has_tasks],
                  ["Repas", activation?.has_meals],
                ].map(([label, ok]: [string, boolean | undefined]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-4"
                  >
                    <span className="text-sm text-white/80">{label}</span>
                    <span className="text-sm text-gold">
                      {ok ? "OK" : "À construire"}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => navigate(nextRecommendedRoute)}
                className="mt-8 inline-flex w-full items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                {nextRecommendedLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}