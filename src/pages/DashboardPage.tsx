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
  const upper = String(status ?? "").toUpperCase();

  if (["BLOCKED", "CRITICAL", "OVERDUE", "FAILED"].includes(upper)) {
    return {
      code: "CRITICAL",
      label: "Critique",
      description: "À traiter en premier.",
      classes: "border-red-400/30 bg-red-400/10 text-red-100",
    };
  }

  if (["WARNING", "WATCH", "LOW", "OPEN", "PLANNED"].includes(upper)) {
    return {
      code: "WATCH",
      label: "Sous surveillance",
      description: "À suivre de près.",
      classes: "border-amber-400/30 bg-amber-400/10 text-amber-100",
    };
  }

  if (["CONFIRMED", "DONE", "COMPLETED", "RESERVED"].includes(upper)) {
    return {
      code: "STABLE",
      label: "Stable",
      description: "Signal maîtrisé.",
      classes: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
    };
  }

  return {
    code: "ATTENTION",
    label: "Attention",
    description: "Signal à lire.",
    classes: "border-white/15 bg-white/8 text-white/80",
  };
}

function FlowBadge({ label, ok }: { label: string; ok: boolean | undefined }) {
  return (
    <div
      className={`inline-flex items-center gap-2 border px-3 py-2 text-[11px] uppercase tracking-[0.22em] ${
        ok
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
          : "border-amber-400/30 bg-amber-400/10 text-amber-100"
      }`}
    >
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {label}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  subtitle,
}: {
  label: string;
  value: string;
  icon: typeof Boxes;
  subtitle: string;
}) {
  return (
    <div className="border border-white/10 bg-black/20 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">
          {label}
        </div>
        <Icon className="h-4 w-4 text-gold/85" />
      </div>
      <div className="mt-5 text-3xl font-light tracking-[0.04em] text-white">
        {value}
      </div>
      <div className="mt-4 text-xs uppercase tracking-[0.2em] text-white/45">
        {subtitle}
      </div>
    </div>
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

  const {
    loading,
    error,
    health,
    feed,
    activation,
    valueChain,
    refresh,
  } = useDashboard();

  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const safeFeed = Array.isArray(feed) ? feed : [];
  const safeActivation = activation ?? {
    activation_score: 0,
    is_operational: false,
    has_members: false,
    has_profiles: false,
    has_inventory: false,
    has_tasks: false,
    has_meals: false,
    blockers: [],
    missing_paths: [],
  };
  const safeValueChain = valueChain ?? {
    shopping_open_count: 0,
    overdue_tasks_count: 0,
    missing_stock_count: 0,
    blocked_tools_count: 0,
    open_alert_count: 0,
    pending_actions: [],
  };

  const priorityFeed = useMemo(() => {
    return [...safeFeed].sort((a, b) => {
      const rank = (status: string) => {
        const code = getFeedSeverity(status).code;
        if (code === "CRITICAL") return 0;
        if (code === "ATTENTION") return 1;
        if (code === "WATCH") return 2;
        return 3;
      };

      return rank(a.status) - rank(b.status);
    });
  }, [safeFeed]);

  const nextRecommendedRoute = useMemo(() => {
    if (!safeActivation.has_profiles) return ROUTES.PROFILES;
    if (!safeActivation.has_inventory) return ROUTES.INVENTORY;
    if ((safeValueChain.shopping_open_count ?? 0) > 0) return ROUTES.SHOPPING;
    if (!safeActivation.has_meals) return ROUTES.MEALS;
    if (!safeActivation.has_tasks) return ROUTES.TASKS;
    return ROUTES.STATUS;
  }, [safeActivation, safeValueChain]);

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
      <main className="min-h-screen bg-black text-white">
        <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
          <div className="border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
            <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-gold/75">
              <Sparkles className="h-4 w-4" />
              DOMYLI
            </div>
            <h1 className="mt-6 text-4xl font-light tracking-[0.06em] text-white">
              Chargement du dashboard...
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60">
              Synchronisation des signaux métier, activation et chaîne de valeur.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <main className="min-h-screen bg-black text-white">
        <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
          <div className="border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
            <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-gold/75">
              <LayoutDashboard className="h-4 w-4" />
              DOMYLI
            </div>
            <h1 className="mt-6 text-4xl font-light tracking-[0.06em] text-white">
              Contexte insuffisant
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60">
              Le dashboard métier nécessite une session authentifiée et un foyer actif.
            </p>
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-black"
            >
              Retour à l’accueil
            </button>
          </div>
        </section>
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
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-6 border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <button
                onClick={() => navigate(ROUTES.HOME)}
                className="inline-flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
                aria-label="Retour"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="mt-5 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-gold/75">
                <Sparkles className="h-4 w-4" />
                DOMYLI
              </div>

              <h1 className="mt-5 text-4xl font-light tracking-[0.06em] text-white sm:text-5xl">
                Dashboard
              </h1>

              <p className="mt-5 text-sm leading-7 text-white/60">
                Ici, le dashboard n’est plus un simple point d’entrée. Il lit l’activation du foyer, la santé du jour, la chaîne de valeur et le flux prioritaire remonté par le système.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-3 border border-gold/20 bg-gold/10 px-5 py-3 text-xs uppercase tracking-[0.24em] text-gold">
                <ShieldCheck className="h-4 w-4" />
                Cockpit métier
              </div>

              <button
                onClick={handleRefresh}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                <RefreshCw className="h-4 w-4" />
                Rafraîchir
              </button>

              <button
                onClick={() => navigate(nextRecommendedRoute)}
                className="inline-flex items-center justify-center gap-3 bg-gold px-6 py-4 text-sm uppercase tracking-[0.24em] text-black transition-opacity hover:opacity-90"
              >
                {nextRecommendedLabel}
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => navigate(ROUTES.STATUS)}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Ouvrir Status
              </button>
            </div>
          </div>

          {(localMessage || error) && (
            <div className="border border-amber-400/25 bg-amber-400/10 px-4 py-4 text-sm text-amber-100">
              {localMessage ?? error?.message}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Score d’activation"
              value={String(safeActivation.activation_score ?? 0)}
              icon={ShieldCheck}
              subtitle={safeActivation.is_operational ? "Foyer opérationnel" : "Foyer en montée"}
            />
            <MetricCard
              label="Alertes ouvertes"
              value={String(health?.open_alert_count ?? 0)}
              icon={AlertTriangle}
              subtitle="Vigilance quotidienne"
            />
            <MetricCard
              label="Charges ouvertes"
              value={String((safeValueChain.shopping_open_count ?? 0) + (health?.overdue_tasks_count ?? 0))}
              icon={ClipboardList}
              subtitle="Courses + tâches en retard"
            />
            <MetricCard
              label="Stock manquant"
              value={String(health?.missing_stock_count ?? 0)}
              icon={Boxes}
              subtitle="Signal consommables"
            />
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
            <div className="text-[11px] uppercase tracking-[0.28em] text-gold/75">
              Flux prioritaire du jour
            </div>

            <h2 className="mt-5 text-3xl font-light tracking-[0.05em] text-white">
              Signaux remontés par DOMYLI
            </h2>

            <p className="mt-4 text-sm leading-7 text-white/60">
              Lecture priorisée des événements du foyer, classés par criticité.
            </p>

            <div className="mt-8 space-y-4">
              {priorityFeed.length === 0 ? (
                <div className="border border-white/10 bg-black/20 px-5 py-5 text-sm text-white/55">
                  Aucun signal remonté pour le moment.
                </div>
              ) : (
                priorityFeed.slice(0, 8).map((item) => {
                  const severity = getFeedSeverity(item.status);

                  return (
                    <div
                      key={item.item_id}
                      className="border border-white/10 bg-black/20 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                            {item.item_type}
                          </div>
                          <h3 className="mt-2 text-lg font-medium text-white">
                            {item.title}
                          </h3>
                          <p className="mt-2 text-sm text-white/55">
                            {item.status} · {formatDate(item.scheduled_at)}
                          </p>
                        </div>

                        <div className={`border px-3 py-2 text-[11px] uppercase tracking-[0.22em] ${severity.classes}`}>
                          {severity.label}
                        </div>
                      </div>

                      <p className="mt-4 text-sm text-white/60">
                        {severity.description}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
            <div className="text-[11px] uppercase tracking-[0.28em] text-gold/75">
              Lecture métier DOMYLI
            </div>

            <h2 className="mt-5 text-3xl font-light tracking-[0.05em] text-white">
              Activation et chaîne de valeur
            </h2>

            <div className="mt-8 space-y-4">
              <div className="border border-white/10 bg-black/20 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Session
                </div>
                <div className="mt-2 text-lg font-medium text-white">
                  {sessionEmail ?? "—"}
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Foyer actif
                </div>
                <div className="mt-2 text-lg font-medium text-white">
                  {activeMembership?.household_name ?? "—"}
                </div>
                <div className="mt-3 text-sm text-white/55">
                  Household ID : {bootstrap?.active_household_id ?? "—"}
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Gouvernance
                </div>
                <div className="mt-2 text-lg font-medium text-white">
                  {activeMembership?.role ?? "—"}
                </div>
                <div className="mt-3 text-sm text-white/55">
                  Super Admin : {bootstrap?.is_super_admin ? "Oui" : "Non"}
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Jour observé
                </div>
                <div className="mt-2 text-lg font-medium text-white">
                  {health?.day ?? "—"}
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Chaîne de valeur
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {[
                    ["Membres", safeActivation.has_members],
                    ["Profils", safeActivation.has_profiles],
                    ["Inventaire", safeActivation.has_inventory],
                    ["Tâches", safeActivation.has_tasks],
                    ["Repas", safeActivation.has_meals],
                  ].map(([label, ok]) => (
                    <FlowBadge key={label} label={label} ok={ok} />
                  ))}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                      Shopping open
                    </div>
                    <div className="mt-2 text-2xl font-light text-white">
                      {safeValueChain.shopping_open_count ?? 0}
                    </div>
                  </div>

                  <div className="border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                      Repas planifiés
                    </div>
                    <div className="mt-2 text-2xl font-light text-white">
                      {health?.planned_meals_count ?? 0}
                    </div>
                  </div>

                  <div className="border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                      Tâches en retard
                    </div>
                    <div className="mt-2 text-2xl font-light text-white">
                      {health?.overdue_tasks_count ?? 0}
                    </div>
                  </div>

                  <div className="border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                      Outils bloqués
                    </div>
                    <div className="mt-2 text-2xl font-light text-white">
                      {health?.blocked_tools_count ?? 0}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate(nextRecommendedRoute)}
                  className="mt-8 inline-flex w-full items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
                >
                  {nextRecommendedLabel}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(ROUTES.MEALS)}
                  className="inline-flex items-center gap-3 border border-white/15 px-4 py-3 text-xs uppercase tracking-[0.22em] text-white/75 transition-colors hover:border-gold/35 hover:text-gold"
                >
                  <Utensils className="h-4 w-4" />
                  Meals
                </button>

                <button
                  onClick={() => navigate(ROUTES.TASKS)}
                  className="inline-flex items-center gap-3 border border-white/15 px-4 py-3 text-xs uppercase tracking-[0.22em] text-white/75 transition-colors hover:border-gold/35 hover:text-gold"
                >
                  <ClipboardList className="h-4 w-4" />
                  Tasks
                </button>

                <button
                  onClick={() => navigate(ROUTES.SHOPPING)}
                  className="inline-flex items-center gap-3 border border-white/15 px-4 py-3 text-xs uppercase tracking-[0.22em] text-white/75 transition-colors hover:border-gold/35 hover:text-gold"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Shopping
                </button>

                <button
                  onClick={() => navigate(ROUTES.STATUS)}
                  className="inline-flex items-center gap-3 border border-white/15 px-4 py-3 text-xs uppercase tracking-[0.22em] text-white/75 transition-colors hover:border-gold/35 hover:text-gold"
                >
                  <Wrench className="h-4 w-4" />
                  Status
                </button>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}