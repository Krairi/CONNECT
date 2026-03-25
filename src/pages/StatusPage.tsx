import {
  AlertTriangle,
  ArrowLeft,
  Clock3,
  ListTodo,
  Package,
  RefreshCw,
  ShieldCheck,
  Utensils,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { useDashboard } from "@/src/hooks/useDashboard";
import { ROUTES } from "@/src/constants/routes";

function computeGlobalStatus(input: {
  inventoryLowStock: number;
  openAlerts: number;
  openShopping: number;
}) {
  if (input.openAlerts > 0) {
    return {
      label: "Attention requise",
      description: "Des alertes ouvertes doivent être traitées.",
    };
  }

  if (input.inventoryLowStock > 0 || input.openShopping > 0) {
    return {
      label: "Sous contrôle",
      description: "Le foyer fonctionne, mais des approvisionnements sont à prévoir.",
    };
  }

  return {
    label: "Stable",
    description: "Aucun signal bloquant critique détecté pour le moment.",
  };
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

  const { loading, error, health, feed, refresh } = useDashboard();

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold">
            Chargement du statut...
          </h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold">Foyer requis</h1>
          <p className="mt-5 max-w-2xl text-alabaster/70 leading-8">
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
    inventoryLowStock: health?.inventory_low_stock_count ?? 0,
    openAlerts: health?.open_alert_count ?? 0,
    openShopping: health?.open_shopping_count ?? 0,
  });

  const alerts = [
    {
      title: "Stock bas",
      value: health?.inventory_low_stock_count ?? 0,
      show: (health?.inventory_low_stock_count ?? 0) > 0,
    },
    {
      title: "Alertes ouvertes",
      value: health?.open_alert_count ?? 0,
      show: (health?.open_alert_count ?? 0) > 0,
    },
    {
      title: "Shopping ouverte",
      value: health?.open_shopping_count ?? 0,
      show: (health?.open_shopping_count ?? 0) > 0,
    },
  ].filter((item) => item.show);

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
            <h1 className="mt-2 text-4xl font-semibold">Status</h1>
            <p className="mt-3 max-w-2xl text-alabaster/70 leading-8">
              Centre de pilotage transverse : stock, alertes, shopping, repas,
              tâches et charge.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void refresh()}
            className="border border-gold/40 px-5 py-3 text-xs uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Rafraîchir
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate(ROUTES.SHOPPING)}
            className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
          >
            Shopping
          </button>

          <button
            type="button"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="border border-gold/40 px-5 py-3 text-xs uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
          >
            Dashboard
          </button>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-4">
          <article className="glass metallic-border rounded-[1.75rem] p-6">
            <div className="inline-flex rounded-xl border border-gold/20 p-3 text-gold">
              <Package size={18} />
            </div>
            <div className="mt-4 text-xs uppercase tracking-[0.25em] text-gold/80">
              Stock bas
            </div>
            <div className="mt-3 text-3xl font-semibold text-alabaster">
              {health?.inventory_low_stock_count ?? 0}
            </div>
          </article>

          <article className="glass metallic-border rounded-[1.75rem] p-6">
            <div className="inline-flex rounded-xl border border-gold/20 p-3 text-gold">
              <AlertTriangle size={18} />
            </div>
            <div className="mt-4 text-xs uppercase tracking-[0.25em] text-gold/80">
              Alertes ouvertes
            </div>
            <div className="mt-3 text-3xl font-semibold text-alabaster">
              {health?.open_alert_count ?? 0}
            </div>
          </article>

          <article className="glass metallic-border rounded-[1.75rem] p-6">
            <div className="inline-flex rounded-xl border border-gold/20 p-3 text-gold">
              <Utensils size={18} />
            </div>
            <div className="mt-4 text-xs uppercase tracking-[0.25em] text-gold/80">
              Repas du jour
            </div>
            <div className="mt-3 text-3xl font-semibold text-alabaster">
              {health?.today_meal_count ?? 0}
            </div>
          </article>

          <article className="glass metallic-border rounded-[1.75rem] p-6">
            <div className="inline-flex rounded-xl border border-gold/20 p-3 text-gold">
              <ListTodo size={18} />
            </div>
            <div className="mt-4 text-xs uppercase tracking-[0.25em] text-gold/80">
              Tâches du jour
            </div>
            <div className="mt-3 text-3xl font-semibold text-alabaster">
              {health?.today_task_count ?? 0}
            </div>
          </article>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="glass metallic-border rounded-[2rem] p-6">
            <div className="inline-flex items-center gap-3 text-gold">
              <Clock3 size={18} />
              <span className="text-xs uppercase tracking-[0.3em]">
                Charge opérationnelle
              </span>
            </div>

            <h2 className="mt-5 text-2xl font-semibold text-alabaster">
              Charge par membre
            </h2>

            {loading && (
              <div className="mt-8 rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm text-alabaster/65">
                Chargement du flux DOMYLI...
              </div>
            )}

            {error && (
              <div className="mt-8 border border-gold/20 bg-gold/5 px-4 py-4 text-sm text-gold">
                {error.message}
              </div>
            )}

            {!loading && !error && feed.members.length === 0 && (
              <div className="mt-8 rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm text-alabaster/65">
                Aucun membre remonté pour la charge du jour.
              </div>
            )}

            {!loading && !error && feed.members.length > 0 && (
              <div className="mt-8 space-y-4">
                {feed.members.map((member) => (
                  <article
                    key={member.user_id}
                    className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4"
                  >
                    <div className="grid gap-4 md:grid-cols-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                          Rôle
                        </div>
                        <div className="mt-2 text-sm text-alabaster">
                          {member.role}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                          User ID
                        </div>
                        <div className="mt-2 text-sm text-alabaster break-all">
                          {member.user_id}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                          Capacité
                        </div>
                        <div className="mt-2 text-sm text-alabaster">
                          {member.capacity_points_daily}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                          Tâches
                        </div>
                        <div className="mt-2 text-sm text-alabaster">
                          {member.assigned_task_count}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="glass metallic-border rounded-[2rem] p-7">
            <div className="inline-flex items-center gap-3 text-gold">
              <ShieldCheck size={18} />
              <span className="text-xs uppercase tracking-[0.3em]">
                Pilotage
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                  État global
                </div>
                <div className="mt-2 text-sm text-alabaster">
                  {globalStatus.label}
                </div>
                <div className="mt-2 text-sm text-alabaster/60">
                  {globalStatus.description}
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
                  Jour observé
                </div>
                <div className="mt-2 text-sm text-alabaster">
                  {health?.day ?? "—"}
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

              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                  Session
                </div>
                <div className="mt-2 text-sm text-alabaster">
                  {sessionEmail ?? "—"}
                </div>
              </div>
            </div>

            <div className="mt-8 border border-white/10 bg-black/20 p-6">
              <h3 className="text-xl font-serif italic">Alertes prioritaires</h3>

              {alerts.length === 0 ? (
                <div className="mt-4 text-sm text-alabaster/70">
                  Aucune alerte prioritaire critique.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.title}
                      className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4"
                    >
                      <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                        {alert.title}
                      </div>
                      <div className="mt-2 text-sm text-alabaster">
                        {alert.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 text-sm leading-8 text-alabaster/65">
                RPC : <code>app.rpc_today_health</code> /{" "}
                <code>app.rpc_today_load_feed</code>
              </div>

              <div className="mt-2 text-sm leading-8 text-alabaster/65">
                Cette page sert de centre de pilotage transverse.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}