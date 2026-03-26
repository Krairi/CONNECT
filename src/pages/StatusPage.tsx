import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Package,
  RefreshCw,
  ShieldCheck,
  TimerReset,
  Utensils,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { useStatus } from "@/src/hooks/useStatus";
import { ROUTES } from "@/src/constants/routes";
import {
  computeDomyliGlobalStatus,
  formatStatusDate,
  getDomyliPriorityAlerts,
  getStatusFeedTypeLabel,
  getStatusFlowLabel,
  getStatusItemSeverityCode,
  getStatusSignalMeta,
  sortStatusFeedItems,
  summarizeStatusFeedByType,
} from "@/src/constants/statusCatalog";

function FlowBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center border border-gold/30 bg-gold/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gold">
      {label}
    </span>
  );
}

function SignalBadge({ code }: { code: "STABLE" | "WATCH" | "ATTENTION" | "CRITICAL" }) {
  const meta = getStatusSignalMeta(code);

  return (
    <span className="inline-flex items-center border border-gold/30 bg-gold/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gold">
      {meta.label}
    </span>
  );
}

export default function StatusPage() {
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
  const { loading, error, health, feed, refresh } = useStatus(householdId);

  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const globalStatus = useMemo(
    () => computeDomyliGlobalStatus(health),
    [health]
  );

  const sortedFeed = useMemo(() => sortStatusFeedItems(feed), [feed]);

  const priorityAlerts = useMemo(
    () => getDomyliPriorityAlerts(health),
    [health]
  );

  const feedSummary = useMemo(
    () => summarizeStatusFeedByType(sortedFeed),
    [sortedFeed]
  );

  const flowLabels = useMemo(
    () =>
      [
        getStatusFlowLabel("INVENTORY"),
        getStatusFlowLabel("TASKS"),
        getStatusFlowLabel("MEALS"),
        getStatusFlowLabel("TOOLS"),
        getStatusFlowLabel("HOUSEHOLD"),
      ] as const,
    []
  );

  if (authLoading || bootstrapLoading) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl border border-gold/20 bg-black/40 p-8">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/80">
            DOMYLI
          </div>
          <h1 className="mt-4 text-3xl font-semibold">
            Chargement du statut...
          </h1>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !hasHousehold || !householdId) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl border border-gold/20 bg-black/40 p-8">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/80">
            DOMYLI
          </div>
          <h1 className="mt-4 text-3xl font-semibold">Foyer requis</h1>
          <p className="mt-4 text-white/70">
            Il faut une session authentifiée et un foyer actif pour accéder au status.
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
      setLocalMessage("Statut DOMYLI rafraîchi.");
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="mt-1 inline-flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
              aria-label="Retour"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="mt-6 text-xs uppercase tracking-[0.35em] text-gold/80">
              DOMYLI
            </div>
            <h1 className="mt-3 text-4xl font-semibold">Status</h1>
            <p className="mt-3 max-w-3xl text-white/65">
              Ici, le statut n’est pas un simple tableau de bord. C’est la lecture
              transverse de l’état du foyer à partir des signaux réels : stock,
              tâches, repas, outils et charge quotidienne.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
            <div className="mb-6 flex items-center gap-3 text-gold/85">
              <ClipboardList className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.35em]">
                Pilotage transverse
              </span>
            </div>

            <h2 className="text-3xl font-semibold">Centre de lecture opérationnelle</h2>

            <p className="mt-6 max-w-3xl text-lg leading-9 text-white/65">
              Le statut du jour consolide les signaux structurants du foyer et
              hiérarchise le flux à regarder en premier.
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
                onClick={() => navigate(ROUTES.INVENTORY)}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                <Package className="h-4 w-4" />
                Inventory
              </button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.TASKS)}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                <TimerReset className="h-4 w-4" />
                Tasks
              </button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.MEALS)}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                <Utensils className="h-4 w-4" />
                Meals
              </button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.TOOLS)}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                <Wrench className="h-4 w-4" />
                Tools
              </button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="inline-flex items-center justify-center gap-3 border border-gold/30 px-6 py-4 text-sm uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold/10"
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

            <div className="mt-8 grid gap-4 md:grid-cols-5">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                  Stock manquant
                </div>
                <div className="mt-3 text-3xl font-semibold">
                  {health?.missing_stock_count ?? 0}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                  Tâches en retard
                </div>
                <div className="mt-3 text-3xl font-semibold">
                  {health?.overdue_tasks_count ?? 0}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                  Repas planifiés
                </div>
                <div className="mt-3 text-3xl font-semibold">
                  {health?.planned_meals_count ?? 0}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                  Repas confirmés
                </div>
                <div className="mt-3 text-3xl font-semibold">
                  {health?.confirmed_meals_count ?? 0}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                  Outils bloqués
                </div>
                <div className="mt-3 text-3xl font-semibold">
                  {health?.blocked_tools_count ?? 0}
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                    État global DOMYLI
                  </div>
                  <div className="mt-3 text-2xl">{globalStatus.label}</div>
                  <div className="mt-2 max-w-2xl text-white/70">
                    {globalStatus.description}
                  </div>
                </div>

                <SignalBadge code={globalStatus.code} />
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-4 text-xs uppercase tracking-[0.24em] text-gold/75">
                Flux priorisé du jour
              </div>

              {loading && (
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5 text-white/70">
                  Chargement du flux DOMYLI...
                </div>
              )}

              {!loading && !error && sortedFeed.length === 0 && (
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5 text-white/70">
                  Aucun élément de flux remonté pour le moment.
                </div>
              )}

              {!loading && !error && sortedFeed.length > 0 && (
                <div className="space-y-4">
                  {sortedFeed.map((item) => {
                    const severityCode = getStatusItemSeverityCode(item);
                    const severity = getStatusSignalMeta(severityCode);

                    return (
                      <article
                        key={`${item.item_type}-${item.item_id}`}
                        className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                              {getStatusFeedTypeLabel(item.item_type)}
                            </div>
                            <div className="mt-2 text-xl">{item.title}</div>
                            <div className="mt-2 text-sm text-white/60">
                              {item.status || "UNKNOWN"} · {formatStatusDate(item.scheduled_at)}
                            </div>
                          </div>

                          <SignalBadge code={severity.code} />
                        </div>

                        <div className="mt-4 text-sm text-white/70">
                          {severity.description}
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
                    Jour observé
                  </div>
                  <div className="mt-3 text-2xl">{health?.day ?? "—"}</div>
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

              <div className="mt-8">
                <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                  Flux surveillés
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {flowLabels.map((label) => (
                    <FlowBadge key={label} label={label} />
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Alertes prioritaires
                </span>
              </div>

              {priorityAlerts.length === 0 ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5 text-white/70">
                  Aucun signal prioritaire remonté aujourd’hui.
                </div>
              ) : (
                <div className="space-y-4">
                  {priorityAlerts.map((alert) => (
                    <div
                      key={alert.code}
                      className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                            {alert.label}
                          </div>
                          <div className="mt-2 text-2xl">{alert.value}</div>
                          <div className="mt-2 text-sm text-white/70">
                            {alert.description}
                          </div>
                        </div>

                        <SignalBadge code={alert.severity as any} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                  Répartition du flux
                </div>

                <div className="mt-4 space-y-3">
                  {feedSummary.map((entry) => (
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

              <div className="mt-6 text-sm text-white/45">
                RPC surveillées : <code>app.rpc_today_health</code> /{" "}
                <code>app.rpc_today_load_feed</code>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}