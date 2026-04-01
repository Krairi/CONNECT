import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CalendarClock,
  ClipboardList,
  RefreshCw,
  ShoppingCart,
  Users,
  Utensils,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { useStatus } from "@/src/hooks/useStatus";
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

function SummaryPill({ label, value, tone = "neutral" }: { label: string; value: string; tone?: Tone }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${getToneClasses(tone)}`}>
      <div className="text-[11px] uppercase tracking-[0.16em] opacity-75">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function FlowCard({
  icon: Icon,
  title,
  value,
  subtitle,
  tone = "neutral",
}: {
  icon: typeof Boxes;
  title: string;
  value: string;
  subtitle: string;
  tone?: Tone;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">{title}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
          <div className="mt-1 text-sm text-white/55">{subtitle}</div>
        </div>
        <div className={`rounded-2xl border p-3 ${getToneClasses(tone)}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function StatusPage() {
  const navigate = useNavigate();
  const { isAuthenticated, hasHousehold, authLoading, bootstrapLoading } = useAuth();
  const { loading, error, health, flowSummary, globalStatus, priorityFeed, refresh } = useStatus();
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const globalTone = useMemo<Tone>(() => {
    if (globalStatus === "CRITICAL") return "danger";
    if (globalStatus === "WATCH") return "warning";
    return "success";
  }, [globalStatus]);

  if (authLoading || bootstrapLoading || loading) {
    return (
      <section className="space-y-3 rounded-[32px] border border-white/10 bg-black/25 p-8 text-white shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
        <div className="text-xs uppercase tracking-[0.24em] text-gold/70">DOMYLI</div>
        <h1 className="text-3xl font-semibold">Chargement du statut...</h1>
      </section>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <section className="space-y-6 rounded-[32px] border border-white/10 bg-black/25 p-8 text-white shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
        <div className="text-xs uppercase tracking-[0.24em] text-gold/70">DOMYLI</div>
        <h1 className="text-3xl font-semibold">Foyer requis</h1>
        <p className="max-w-2xl text-sm text-white/65">
          Il faut une session authentifiée et un foyer actif pour accéder au status.
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
      setLocalMessage("Statut DOMYLI rafraîchi.");
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  return (
    <section className="space-y-8 text-white">
      <div className="rounded-[32px] border border-white/10 bg-black/25 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="text-xs uppercase tracking-[0.24em] text-gold/70">DOMYLI · Status</div>
            <h1 className="text-4xl font-semibold">Lecture transverse du foyer</h1>
            <p className="text-sm leading-7 text-white/70">
              Le status consolide les signaux structurants : stock, repas, tâches, shopping, outils, invitations et profils à compléter.
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
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-gold px-5 py-3 text-sm uppercase tracking-[0.18em] text-black transition-opacity hover:opacity-90"
            >
              Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <SummaryPill label="Statut global" value={globalStatus} tone={globalTone} />
          <SummaryPill label="Alertes ouvertes" value={String(health?.open_alert_count ?? 0)} tone={(health?.open_alert_count ?? 0) > 0 ? "danger" : "success"} />
          <SummaryPill label="Jour observé" value={health?.day ?? "—"} />
        </div>

        {(localMessage || error) && (
          <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {localMessage ?? error?.message}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <FlowCard icon={Boxes} title="Inventaire" value={String(flowSummary?.inventory.missing_stock_count ?? 0)} subtitle="Articles manquants" tone={(flowSummary?.inventory.missing_stock_count ?? 0) > 0 ? "danger" : "neutral"} />
        <FlowCard icon={ShoppingCart} title="Shopping" value={String(flowSummary?.shopping.open_shopping_count ?? 0)} subtitle="Besoins ouverts" tone={(flowSummary?.shopping.open_shopping_count ?? 0) > 0 ? "warning" : "neutral"} />
        <FlowCard icon={Utensils} title="Meals" value={String(flowSummary?.meals.planned_meals_count ?? 0)} subtitle="Repas planifiés" />
        <FlowCard icon={ClipboardList} title="Tasks" value={String(flowSummary?.tasks.overdue_tasks_count ?? 0)} subtitle="Tâches en retard" tone={(flowSummary?.tasks.overdue_tasks_count ?? 0) > 0 ? "danger" : "neutral"} />
        <FlowCard icon={Wrench} title="Tools" value={String(flowSummary?.tools.blocked_tools_count ?? 0)} subtitle="Outils bloqués" tone={(flowSummary?.tools.blocked_tools_count ?? 0) > 0 ? "warning" : "neutral"} />
        <FlowCard icon={Users} title="Household" value={String((flowSummary?.household.pending_invites_count ?? 0) + (flowSummary?.household.profiles_incomplete_count ?? 0))} subtitle="Invitations + profils à finaliser" tone={((flowSummary?.household.pending_invites_count ?? 0) + (flowSummary?.household.profiles_incomplete_count ?? 0)) > 0 ? "warning" : "neutral"} />
      </div>

      <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-gold/70">Flux prioritaire</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Signaux à lire et traiter</h2>
          </div>
          <div className="text-sm text-white/55">
            {priorityFeed.length} signal{priorityFeed.length > 1 ? "s" : ""} consolidé{priorityFeed.length > 1 ? "s" : ""}
          </div>
        </div>

        {priorityFeed.length === 0 ? (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm text-white/65">
            Aucun signal prioritaire remonté pour le moment.
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {priorityFeed.slice(0, 10).map((item) => (
              <button
                key={`${item.entity_type ?? item.item_type}-${item.entity_id ?? item.title}`}
                type="button"
                onClick={() => navigate(item.route_hint || ROUTES.DASHBOARD)}
                className="w-full rounded-[24px] border border-white/10 bg-black/20 p-5 text-left transition hover:border-gold/30 hover:bg-black/25"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{item.item_type} · {item.flow_code}</div>
                    <div className="mt-2 text-lg font-semibold text-white">{item.title}</div>
                    <div className="mt-2 text-sm text-white/55">{formatDate(item.scheduled_at)}</div>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${getToneClasses(getSignalTone(item.status))}`}>
                    {item.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryPill label="Stock bas" value={String(health?.low_stock_count ?? 0)} tone={(health?.low_stock_count ?? 0) > 0 ? "warning" : "neutral"} />
        <SummaryPill label="Invitations" value={String(health?.pending_invites_count ?? 0)} tone={(health?.pending_invites_count ?? 0) > 0 ? "warning" : "neutral"} />
        <SummaryPill label="Profils incomplets" value={String(health?.profiles_incomplete_count ?? 0)} tone={(health?.profiles_incomplete_count ?? 0) > 0 ? "warning" : "neutral"} />
        <SummaryPill label="Tâches en retard" value={String(health?.overdue_tasks_count ?? 0)} tone={(health?.overdue_tasks_count ?? 0) > 0 ? "danger" : "neutral"} />
      </div>
    </section>
  );
}
