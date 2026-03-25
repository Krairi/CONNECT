import {
  AlertTriangle,
  ArrowLeft,
  Clock3,
  Package,
  RefreshCw,
  ShieldCheck,
  Utensils,
  Wrench,
  CheckCircle2,
  ListTodo,
} from "lucide-react";
import { useDomyliConnection } from "../hooks/useDomyliConnection";
import { useDashboard } from "../hooks/useDashboard";
import { navigateTo } from "../lib/navigation";

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
      return <ListTodo className="text-gold" size={18} />;
    case "MEAL":
      return <Utensils className="text-gold" size={18} />;
    case "TOOL":
      return <Wrench className="text-gold" size={18} />;
    default:
      return <AlertTriangle className="text-gold" size={18} />;
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
      description: "Des blocages ou retards doivent être traités.",
    };
  }

  if (input.missingStock > 0) {
    return {
      label: "Sous contrôle",
      description: "Le foyer fonctionne, mais des achats sont à prévoir.",
    };
  }

  return {
    label: "Stable",
    description: "Aucun signal bloquant critique détecté pour le moment.",
  };
}

export default function StatusPage() {
  const {
    sessionEmail,
    activeMembership,
    bootstrap,
    isAuthenticated,
    hasHousehold,
    authLoading,
  } = useDomyliConnection();

  const householdId = bootstrap?.active_household_id ?? null;
  const { loading, error, health, feed, refresh } = useDashboard(householdId);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/80">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-serif italic">Chargement du statut...</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
        <div className="max-w-xl w-full border border-white/10 bg-white/5 p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/80">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-serif italic">Foyer requis</h1>
          <p className="mt-4 text-alabaster/70">
            Il faut une session authentifiée et un foyer actif pour accéder au status.
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

  const globalStatus = computeGlobalStatus({
    missingStock: health?.missing_stock_count ?? 0,
    overdueTasks: health?.overdue_tasks_count ?? 0,
    blockedTools: health?.blocked_tools_count ?? 0,
  });

  const alerts = [
    {
      title: "Stock manquant",
      value: health?.missing_stock_count ?? 0,
      show: (health?.missing_stock_count ?? 0) > 0,
    },
    {
      title: "Tâches en retard",
      value: health?.overdue_tasks_count ?? 0,
      show: (health?.overdue_tasks_count ?? 0) > 0,
    },
    {
      title: "Outils bloqués",
      value: health?.blocked_tools_count ?? 0,
      show: (health?.blocked_tools_count ?? 0) > 0,
    },
  ].filter((item) => item.show);

  return (
    <div className="min-h-screen bg-obsidian text-alabaster">
      <header className="border-b border-white/5 glass">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo("/dashboard")}
              className="w-10 h-10 border border-white/10 flex items-center justify-center hover:border-gold/40 transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft size={18} className="text-gold" />
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold/80">DOMYLI</p>
              <h1 className="text-2xl font-serif italic">Status</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Rafraîchir
            </button>

            <button
              onClick={() => navigateTo("/shopping")}
              className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
            >
              Shopping
            </button>

            <button
              onClick={() => navigateTo("/dashboard")}
              className="border border-gold/40 px-5 py-3 text-xs uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <section className="grid lg:grid-cols-4 gap-6">
          <div className="border border-white/10 bg-white/5 p-6">
            <div className="w-12 h-12 border border-gold/20 flex items-center justify-center mb-4">
              <Package className="text-gold" size={24} />
            </div>
            <div className="text-sm uppercase tracking-[0.25em] text-alabaster/50">Stock manquant</div>
            <div className="mt-3 text-3xl font-serif italic">{health?.missing_stock_count ?? 0}</div>
          </div>

          <div className="border border-white/10 bg-white/5 p-6">
            <div className="w-12 h-12 border border-gold/20 flex items-center justify-center mb-4">
              <ListTodo className="text-gold" size={24} />
            </div>
            <div className="text-sm uppercase tracking-[0.25em] text-alabaster/50">Tâches en retard</div>
            <div className="mt-3 text-3xl font-serif italic">{health?.overdue_tasks_count ?? 0}</div>
          </div>

          <div className="border border-white/10 bg-white/5 p-6">
            <div className="w-12 h-12 border border-gold/20 flex items-center justify-center mb-4">
              <Utensils className="text-gold" size={24} />
            </div>
            <div className="text-sm uppercase tracking-[0.25em] text-alabaster/50">Repas confirmés</div>
            <div className="mt-3 text-3xl font-serif italic">{health?.confirmed_meals_count ?? 0}</div>
          </div>

          <div className="border border-white/10 bg-white/5 p-6">
            <div className="w-12 h-12 border border-gold/20 flex items-center justify-center mb-4">
              <Wrench className="text-gold" size={24} />
            </div>
            <div className="text-sm uppercase tracking-[0.25em] text-alabaster/50">Outils bloqués</div>
            <div className="mt-3 text-3xl font-serif italic">{health?.blocked_tools_count ?? 0}</div>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-8 mt-10">
          <div className="lg:col-span-2 border border-white/10 bg-white/5 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Timeline opérationnelle</p>
            <h2 className="mt-4 text-3xl font-serif italic">Flux du jour</h2>

            {loading && (
              <div className="mt-6 border border-white/10 bg-black/20 p-4 text-sm text-alabaster/70">
                Chargement du flux DOMYLI...
              </div>
            )}

            {error && (
              <div className="mt-6 border border-white/10 bg-black/20 p-4 text-sm text-alabaster/70">
                {error.message}
              </div>
            )}

            {!loading && !error && feed.length === 0 && (
              <div className="mt-6 border border-white/10 bg-black/20 p-4 text-sm text-alabaster/70">
                Aucun événement métier remonté pour l’instant.
              </div>
            )}

            {!loading && !error && feed.length > 0 && (
              <div className="mt-6 grid gap-4">
                {feed.map((item) => (
                  <div
                    key={`${item.item_type}-${item.item_id}-${item.title}`}
                    className="border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 border border-gold/20 flex items-center justify-center">
                          {feedIcon(item.item_type)}
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.25em] text-gold/80">
                            {item.item_type}
                          </div>
                          <div className="mt-2 text-lg font-serif italic">{item.title}</div>
                          <div className="mt-2 text-sm text-alabaster/60">
                            {formatScheduledAt(item.scheduled_at)}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs uppercase tracking-[0.25em] text-alabaster/50">
                        {item.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="border border-white/10 bg-white/5 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Pilotage</p>

            <div className="mt-6 border border-gold/20 bg-gold/5 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-gold" />
                <div>
                  <div className="text-sm uppercase tracking-[0.25em] text-gold/80">État global</div>
                  <div className="mt-2 text-2xl font-serif italic">{globalStatus.label}</div>
                  <div className="mt-2 text-sm text-alabaster/70">{globalStatus.description}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4 text-sm">
              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Foyer :</span>
                <div className="mt-1 text-alabaster">{activeMembership?.household_name ?? "—"}</div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Rôle :</span>
                <div className="mt-1 text-alabaster">{activeMembership?.role ?? "—"}</div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Jour observé :</span>
                <div className="mt-1 text-alabaster">{health?.day ?? "—"}</div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Super Admin :</span>
                <div className="mt-1 text-alabaster">{bootstrap?.is_super_admin ? "Oui" : "Non"}</div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Session :</span>
                <div className="mt-1 text-alabaster">{sessionEmail ?? "—"}</div>
              </div>
            </div>

            <div className="mt-8">
              <div className="text-xs uppercase tracking-[0.3em] text-gold/80">Alertes prioritaires</div>

              {alerts.length === 0 ? (
                <div className="mt-4 border border-white/10 bg-black/20 p-4 text-sm text-alabaster/70">
                  Aucune alerte prioritaire critique.
                </div>
              ) : (
                <div className="mt-4 grid gap-3">
                  {alerts.map((alert) => (
                    <div key={alert.title} className="border border-white/10 bg-black/20 p-4">
                      <div className="text-xs uppercase tracking-[0.25em] text-gold/80">
                        {alert.title}
                      </div>
                      <div className="mt-2 text-2xl font-serif italic">{alert.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-gold" />
                <span className="text-sm">RPC : app.rpc_today_health / app.rpc_today_load_feed</span>
              </div>
            </div>

            <div className="mt-4 border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-3">
                <Clock3 size={18} className="text-gold" />
                <span className="text-sm">Cette page sert de centre de pilotage transverse.</span>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}