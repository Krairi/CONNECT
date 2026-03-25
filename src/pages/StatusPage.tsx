import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Package,
  RefreshCw,
  ShieldCheck,
  Utensils,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/contexts/AuthContext";
import { useDashboard } from "@/src/hooks/useDashboard";
import { ROUTES } from "@/src/constants/routes";

function formatScheduledAt(value?: string | null): string {
  if (!value) return "Sans horaire";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function feedIcon(type: string) {
  switch (type) {
    case "TASK":
      return <Wrench size={16} />;
    case "MEAL":
      return <Utensils size={16} />;
    case "TOOL":
      return <Package size={16} />;
    default:
      return <Activity size={16} />;
  }
}

function computeGlobalStatus(input: {
  missingStock: number;
  overdueTasks: number;
  blockedTools: number;
}) {
  if (input.overdueTasks > 0 || input.blockedTools > 0) {
    return {
      label: "Attention requise",
      icon: <AlertTriangle size={18} />,
      description: "Des blocages ou retards doivent être traités.",
    };
  }

  if (input.missingStock > 0) {
    return {
      label: "Sous contrôle",
      icon: <ShieldCheck size={18} />,
      description: "Le foyer fonctionne, mais des achats sont à prévoir.",
    };
  }

  return {
    label: "Stable",
    icon: <CheckCircle2 size={18} />,
    description: "Aucun signal bloquant critique détecté pour le moment.",
  };
}

export default function StatusPage() {
  const navigate = useNavigate();
  const { isAuthenticated, hasHousehold, authLoading, bootstrapLoading, bootstrap } =
    useAuth();

  const householdId = bootstrap?.active_household_id ?? null;
  const { loading, degraded, error, health, feed, refresh } =
    useDashboard(householdId);

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-white px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/70">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold text-white">
            Chargement du statut...
          </h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <div className="min-h-screen bg-obsidian text-white px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/70">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold text-white">
            Foyer requis
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/70">
            Il faut une session authentifiée et un foyer actif pour accéder au
            status.
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

  const globalStatus = computeGlobalStatus({
    missingStock: health?.missing_stock_count ?? 0,
    overdueTasks: health?.overdue_tasks_count ?? 0,
    blockedTools: health?.blocked_tools_count ?? 0,
  });

  const alerts = [
    {
      title: "Stock manquant",
      value: health?.missing_stock_count ?? 0,
    },
    {
      title: "Tâches en retard",
      value: health?.overdue_tasks_count ?? 0,
    },
    {
      title: "Outils bloqués",
      value: health?.blocked_tools_count ?? 0,
    },
  ].filter((item) => item.value > 0);

  return (
    <div className="min-h-screen bg-obsidian text-white px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
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
              <div className="text-xs uppercase tracking-[0.35em] text-gold/70">
                DOMYLI
              </div>
              <h1 className="mt-2 text-4xl font-semibold text-white">Status</h1>
              <p className="mt-3 text-sm leading-7 text-white/65">
                Vue synthétique de la stabilité opérationnelle du foyer.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-3 border border-gold/40 px-5 py-3 text-xs uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Rafraîchir
          </button>
        </div>

        <section className="mt-10 border border-gold/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 text-gold">
            {globalStatus.icon}
            <span className="text-xs uppercase tracking-[0.3em]">
              {globalStatus.label}
            </span>
          </div>
          <p className="mt-4 text-base leading-8 text-white/70">
            {globalStatus.description}
          </p>
          {degraded && (
            <p className="mt-4 text-sm text-amber-300">
              Une partie du statut est disponible, mais au moins un RPC a remonté
              une erreur explicite.
            </p>
          )}
          {error && (
            <div className="mt-4 border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-300">
              {error.message}
            </div>
          )}
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {alerts.length === 0 ? (
            <div className="md:col-span-3 border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              Aucun signal critique ouvert pour le moment.
            </div>
          ) : (
            alerts.map((alert) => (
              <article
                key={alert.title}
                className="border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="text-xs uppercase tracking-[0.25em] text-gold/70">
                  {alert.title}
                </div>
                <div className="mt-4 text-4xl font-semibold text-white">
                  {alert.value}
                </div>
              </article>
            ))
          )}
        </div>

        <section className="mt-10 border border-white/10 bg-white/[0.03] p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-gold/70">
            Flux du jour
          </div>

          {!loading && (!Array.isArray(feed) || feed.length === 0) && (
            <div className="mt-5 text-sm text-white/65">
              Aucun événement exploitable n’a été retourné pour le moment.
            </div>
          )}

          {Array.isArray(feed) && feed.length > 0 && (
            <div className="mt-6 space-y-4">
              {feed.map((entry, index) => (
                <article
                  key={`${entry.item_id || "item"}-${index}`}
                  className="border border-white/10 px-4 py-4"
                >
                  <div className="flex items-center gap-3 text-gold">
                    {feedIcon(entry.item_type)}
                    <span className="text-xs uppercase tracking-[0.25em]">
                      {entry.item_type}
                    </span>
                  </div>

                  <div className="mt-3 text-base text-white">{entry.title}</div>

                  <div className="mt-2 text-sm text-white/60">
                    {formatScheduledAt(entry.scheduled_at)}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}