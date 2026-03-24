import {
  ArrowLeft,
  Activity,
  Package,
  Users,
  Utensils,
  ShieldAlert,
  RefreshCw,
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useDomyliConnection } from "../hooks/useDomyliConnection";
import { useDashboard } from "../hooks/useDashboard";
import { navigateTo } from "../lib/navigation";

export default function DashboardPage() {
  const {
    sessionEmail,
    activeMembership,
    bootstrap,
    isAuthenticated,
    hasHousehold,
    authLoading,
  } = useDomyliConnection();

  const { loading, error, health, feed, refresh } = useDashboard();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/80">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-serif italic">Chargement du dashboard...</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
        <div className="max-w-xl w-full border border-white/10 bg-white/5 p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/80">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-serif italic">Contexte insuffisant</h1>
          <p className="mt-4 text-alabaster/70">
            Il faut une session authentifiée et un foyer actif pour accéder au dashboard.
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

  const cards = [
    {
      title: "Repas du jour",
      value: String(health?.today_meal_count ?? 0),
      icon: <Utensils className="text-gold" size={24} />,
      text: "Nombre de repas planifiés aujourd’hui.",
    },
    {
      title: "Tâches du jour",
      value: String(health?.today_task_count ?? 0),
      icon: <Activity className="text-gold" size={24} />,
      text: "Nombre total de tâches prévues aujourd’hui.",
    },
    {
      title: "Tâches terminées",
      value: String(health?.today_task_done_count ?? 0),
      icon: <CheckCircle2 className="text-gold" size={24} />,
      text: "Tâches marquées DONE aujourd’hui.",
    },
    {
      title: "Stock bas",
      value: String(health?.inventory_low_stock_count ?? 0),
      icon: <Package className="text-gold" size={24} />,
      text: "Articles sous le seuil minimum.",
    },
  ];

  return (
    <div className="min-h-screen bg-obsidian text-alabaster">
      <header className="border-b border-white/5 glass">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo("/profiles")}
              className="w-10 h-10 border border-white/10 flex items-center justify-center hover:border-gold/40 transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft size={18} className="text-gold" />
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold/80">DOMYLI</p>
              <h1 className="text-2xl font-serif italic">Dashboard</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <button
              onClick={refresh}
              className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Rafraîchir
            </button>

            <button
              onClick={() => navigateTo("/inventory")}
              className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
            >
              Inventory
            </button>

            <button
              onClick={() => navigateTo("/tasks")}
              className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
            >
              Tasks
            </button>

            <button
              onClick={() => navigateTo("/tools")}
              className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
            >
              Tools
            </button>

            <button
              onClick={() => navigateTo("/capacity")}
              className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
            >
              Capacity
            </button>

            <button
              onClick={() => navigateTo("/meals")}
              className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
            >
              Meals
            </button>

            <button
              onClick={() => navigateTo("/shopping")}
              className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
            >
              Shopping
            </button>

            <button
              onClick={() => navigateTo("/status")}
              className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
            >
              Status
            </button>

            <button
              onClick={() => navigateTo("/profiles")}
              className="border border-gold/40 px-5 py-3 text-xs uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
            >
              Profils
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <section className="grid lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div key={card.title} className="border border-white/10 bg-white/5 p-6">
              <div className="w-12 h-12 border border-gold/20 flex items-center justify-center mb-4">
                {card.icon}
              </div>
              <div className="text-sm uppercase tracking-[0.25em] text-alabaster/50">
                {card.title}
              </div>
              <div className="mt-3 text-3xl font-serif italic">{card.value}</div>
              <p className="mt-4 text-sm text-alabaster/65">{card.text}</p>
            </div>
          ))}
        </section>

        <section className="grid lg:grid-cols-2 gap-8 mt-10">
          <div className="border border-white/10 bg-white/5 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Contexte réel</p>
            <h2 className="mt-4 text-3xl font-serif italic">État du foyer actif</h2>

            <div className="mt-8 space-y-4 text-sm">
              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Email :</span>
                <div className="mt-1 text-alabaster">{sessionEmail ?? "—"}</div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Foyer actif :</span>
                <div className="mt-1 text-alabaster">{activeMembership?.household_name ?? "—"}</div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Rôle :</span>
                <div className="mt-1 text-alabaster">{activeMembership?.role ?? "—"}</div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Super Admin :</span>
                <div className="mt-1 text-alabaster">{bootstrap?.is_super_admin ? "Oui" : "Non"}</div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Jour observé :</span>
                <div className="mt-1 text-alabaster">{health?.day ?? "—"}</div>
              </div>
            </div>
          </div>

          <div className="border border-white/10 bg-white/5 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Charge du jour</p>
            <h2 className="mt-4 text-3xl font-serif italic">Répartition par membre</h2>

            {loading && (
              <div className="mt-6 border border-white/10 bg-black/20 p-4 text-sm text-alabaster/70">
                Chargement du dashboard DOMYLI...
              </div>
            )}

            {error && (
              <div className="mt-6 border border-white/10 bg-black/20 p-4 text-sm text-alabaster/70">
                {error.message}
              </div>
            )}

            {!loading && !error && feed && feed.members.length === 0 && (
              <div className="mt-6 border border-white/10 bg-black/20 p-4 text-sm text-alabaster/70">
                Aucun membre remonté dans la charge du jour.
              </div>
            )}

            {!loading && !error && feed && feed.members.length > 0 && (
              <div className="mt-6 grid gap-4">
                {feed.members.map((member) => (
                  <div
                    key={member.user_id}
                    className="border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.25em] text-gold/80">
                          {member.role}
                        </div>
                        <div className="mt-2 text-lg font-serif italic">
                          {member.user_id}
                        </div>
                        <div className="mt-2 text-sm text-alabaster/60">
                          Capacité : {member.capacity_points_daily} • Tâches : {member.assigned_task_count}
                        </div>
                      </div>

                      <div className="text-xs uppercase tracking-[0.25em] text-alabaster/50">
                        Effort : {member.assigned_effort_points}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-8 mt-10">
          <div className="border border-white/10 bg-white/5 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Santé opérationnelle</p>
            <h2 className="mt-4 text-3xl font-serif italic">Résumé métier</h2>

            <div className="mt-8 grid sm:grid-cols-2 gap-4 text-sm">
              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Alertes ouvertes :</span>
                <div className="mt-2 text-2xl font-serif italic">
                  {health?.open_alert_count ?? 0}
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Shopping ouverte :</span>
                <div className="mt-2 text-2xl font-serif italic">
                  {health?.open_shopping_count ?? 0}
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Repas du jour :</span>
                <div className="mt-2 text-2xl font-serif italic">
                  {health?.today_meal_count ?? 0}
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Tâches terminées :</span>
                <div className="mt-2 text-2xl font-serif italic">
                  {health?.today_task_done_count ?? 0}
                </div>
              </div>
            </div>
          </div>

          <div className="border border-white/10 bg-white/5 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Suite logique</p>
            <h2 className="mt-4 text-3xl font-serif italic">Base prête, valeur métier visible</h2>
            <p className="mt-6 text-alabaster/70 leading-relaxed">
              Le dashboard lit maintenant les vrais JSON de ta base DOMYLI. Tu peux naviguer vers les
              modules métiers pour enrichir l’exécution réelle du foyer.
            </p>

            <div className="mt-8 grid gap-4">
              <button
                onClick={() => navigateTo("/profiles")}
                className="border border-gold/40 px-5 py-4 text-sm uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors text-left"
              >
                Revenir aux profils
              </button>
              <button
                onClick={() => navigateTo("/status")}
                className="border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors text-left"
              >
                Ouvrir le status
              </button>
              <button
                onClick={() => navigateTo("/")}
                className="border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors text-left"
              >
                Revenir à la landing
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}