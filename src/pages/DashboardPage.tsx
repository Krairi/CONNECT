import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  Boxes,
  ClipboardList,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  Users,
  Utensils,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { useDashboard } from "@/src/hooks/useDashboard";
import { ROUTES } from "@/src/constants/routes";

type Tone = "neutral" | "warning" | "danger" | "success";

function getToneClasses(tone: Tone): string {
  switch (tone) {
    case "danger":
      return "border-red-400/35 bg-red-400/12 text-red-100";
    case "warning":
      return "border-amber-400/35 bg-amber-400/12 text-amber-100";
    case "success":
      return "border-emerald-400/30 bg-emerald-400/12 text-emerald-100";
    default:
      return "border-white/15 bg-white/8 text-white/80";
  }
}

function getSignalTone(status: string): Tone {
  const upper = status.toUpperCase();
  if (["CRITICAL", "BLOCKED", "OVERDUE"].includes(upper)) return "danger";
  if (["WARNING", "LOW", "PENDING", "PROFILE_REQUIRED"].includes(upper)) return "warning";
  if (["DONE", "COMPLETED", "READY"].includes(upper)) return "success";
  return "neutral";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR");
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon: typeof Boxes;
  tone?: Tone;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
        </div>
        <div className={`rounded-2xl border p-3 ${getToneClasses(tone)}`}>
          <Icon className="h-5 w-5" />
        </div>
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
  const { loading, error, activation, valueChain, health, feed, nextAction, summary, refresh } = useDashboard();
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const criticalSignals = useMemo(() => {
    return feed.filter((item) => getSignalTone(item.status) === "danger").length;
  }, [feed]);

  const actionRoute = nextAction?.route || ROUTES.STATUS;
  const actionLabel = nextAction?.label || "Continuer";

  if (authLoading || bootstrapLoading || loading) {
    return (
      <section className="space-y-3 rounded-[32px] border border-white/10 bg-black/25 p-8 text-white shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
        <div className="text-xs uppercase tracking-[0.24em] text-gold/70">DOMYLI</div>
        <h1 className="text-3xl font-semibold">Chargement du dashboard...</h1>
        <p className="max-w-2xl text-sm text-white/65">
          Synchronisation des signaux métier, activation, chaîne de valeur et flux prioritaire du foyer.
        </p>
      </section>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <section className="space-y-6 rounded-[32px] border border-white/10 bg-black/25 p-8 text-white shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
        <div className="text-xs uppercase tracking-[0.24em] text-gold/70">DOMYLI</div>
        <h1 className="text-3xl font-semibold">Contexte insuffisant</h1>
        <p className="max-w-2xl text-sm text-white/65">
          Le dashboard métier nécessite une session authentifiée et un foyer actif.
        </p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.HOME)}
          className="inline-flex items-center justify-center border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-black"
        >
          Retour à l’accueil
        </button>
      </section>
    );
  }

  const handleRefresh = async () => {
    setLocalMessage(null);
    try {
      await refresh();
      setLocalMessage("Dashboard DOMYLI rafraîchi.");
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  return (
    <section className="space-y-8 text-white">
      <div className="rounded-[32px] border border-white/10 bg-black/25 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="text-xs uppercase tracking-[0.24em] text-gold/70">DOMYLI · Dashboard</div>
            <h1 className="text-4xl font-semibold">Cockpit décisionnel du foyer</h1>
            <p className="text-sm leading-7 text-white/70">
              Le dashboard consolide l’activation, la santé opérationnelle et le flux prioritaire. Ce n’est pas une page d’accueil générique : c’est la lecture décisionnelle du foyer.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center justify-center gap-3 rounded-full border border-white/10 px-5 py-3 text-sm uppercase tracking-[0.18em] text-white transition-colors hover:border-gold/40 hover:text-gold"
            >
              <RefreshCw className="h-4 w-4" /> Rafraîchir
            </button>
            <button
              type="button"
              onClick={() => navigate(actionRoute)}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-gold px-5 py-3 text-sm uppercase tracking-[0.18em] text-black transition-opacity hover:opacity-90"
            >
              {actionLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {(localMessage || error) && (
          <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {localMessage ?? error?.message}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Score d’activation" value={String(activation?.activation_score ?? 0)} icon={Sparkles} tone={(activation?.is_operational ?? false) ? "success" : "warning"} />
        <SummaryCard label="Alertes ouvertes" value={String(summary.alerts)} icon={BellRing} tone={summary.alerts > 0 ? "danger" : "success"} />
        <SummaryCard label="Signals critiques" value={String(criticalSignals)} icon={AlertTriangle} tone={criticalSignals > 0 ? "danger" : "neutral"} />
        <SummaryCard label="Shopping open" value={String(summary.shopping)} icon={ShoppingCart} tone={summary.shopping > 0 ? "warning" : "neutral"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr,0.9fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.20)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-gold/70">Flux prioritaire</div>
              <h2 className="mt-2 text-2xl font-semibold text-white">Signaux à traiter en premier</h2>
            </div>
          </div>

          {feed.length === 0 ? (
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm text-white/65">
              Aucun signal remonté pour le moment.
            </div>
          ) : (
            <div className="space-y-4">
              {feed.slice(0, 8).map((item) => (
                <button
                  key={`${item.entity_type ?? item.item_type}-${item.entity_id ?? item.title}`}
                  type="button"
                  onClick={() => navigate(item.route_hint || ROUTES.STATUS)}
                  className="w-full rounded-[24px] border border-white/10 bg-black/20 p-5 text-left transition hover:border-gold/30 hover:bg-black/25"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{item.item_type}</div>
                      <div className="mt-2 text-lg font-semibold text-white">{item.title}</div>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${getToneClasses(getSignalTone(item.status))}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-white/60">{item.flow_code} · {formatDate(item.scheduled_at)}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.20)]">
            <div className="text-[11px] uppercase tracking-[0.22em] text-gold/70">Lecture métier</div>
            <div className="mt-4 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">Session</div>
                <div className="mt-2 text-sm text-white">{sessionEmail ?? "—"}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">Foyer actif</div>
                <div className="mt-2 text-sm text-white">{activeMembership?.household_name ?? "—"}</div>
                <div className="mt-1 text-xs text-white/45">Household ID : {bootstrap?.active_household_id ?? "—"}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">Gouvernance</div>
                <div className="mt-2 text-sm text-white">{activeMembership?.role ?? "—"}</div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.20)]">
            <div className="text-[11px] uppercase tracking-[0.22em] text-gold/70">Chaîne de valeur</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SummaryCard label="Stock manquant" value={String(health?.missing_stock_count ?? 0)} icon={Boxes} tone={(health?.missing_stock_count ?? 0) > 0 ? "danger" : "neutral"} />
              <SummaryCard label="Repas planifiés" value={String(health?.planned_meals_count ?? 0)} icon={Utensils} tone="neutral" />
              <SummaryCard label="Tâches en retard" value={String(health?.overdue_tasks_count ?? 0)} icon={ClipboardList} tone={(health?.overdue_tasks_count ?? 0) > 0 ? "warning" : "neutral"} />
              <SummaryCard label="Outils bloqués" value={String(health?.blocked_tools_count ?? 0)} icon={Wrench} tone={(health?.blocked_tools_count ?? 0) > 0 ? "warning" : "neutral"} />
              <SummaryCard label="Invitations" value={String(health?.pending_invites_count ?? 0)} icon={Users} tone={(health?.pending_invites_count ?? 0) > 0 ? "warning" : "neutral"} />
              <SummaryCard label="Profils à finir" value={String(health?.profiles_incomplete_count ?? 0)} icon={Users} tone={(health?.profiles_incomplete_count ?? 0) > 0 ? "warning" : "neutral"} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
