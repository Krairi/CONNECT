import { ArrowLeft, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { ROUTES } from "@/src/constants/routes";

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    sessionEmail,
    bootstrap,
    activeMembership,
    authLoading,
    bootstrapLoading,
  } = useAuth();

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold">
            Chargement du dashboard...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-alabaster px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            className="mt-1 h-10 w-10 border border-white/10 flex items-center justify-center hover:border-gold/40 transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-gold">
              DOMYLI
            </div>
            <h1 className="mt-2 text-4xl font-semibold">Dashboard</h1>
            <p className="mt-3 text-alabaster/70 leading-7">
              Parcours réduit de production : session, foyer actif, profil,
              navigation protégée.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <article className="glass metallic-border p-6">
            <div className="inline-flex rounded-xl border border-gold/20 p-3 text-gold">
              <LayoutDashboard size={18} />
            </div>
            <div className="mt-4 text-xs uppercase tracking-[0.25em] text-gold/80">
              Compte
            </div>
            <div className="mt-3 text-base text-alabaster">
              {sessionEmail ?? "—"}
            </div>
          </article>

          <article className="glass metallic-border p-6">
            <div className="inline-flex rounded-xl border border-gold/20 p-3 text-gold">
              <Users size={18} />
            </div>
            <div className="mt-4 text-xs uppercase tracking-[0.25em] text-gold/80">
              Foyer actif
            </div>
            <div className="mt-3 text-base text-alabaster">
              {activeMembership?.household_name ?? "—"}
            </div>
            <div className="mt-2 text-sm text-alabaster/60">
              Rôle : {activeMembership?.role ?? "—"}
            </div>
          </article>

          <article className="glass metallic-border p-6">
            <div className="inline-flex rounded-xl border border-gold/20 p-3 text-gold">
              <ShieldCheck size={18} />
            </div>
            <div className="mt-4 text-xs uppercase tracking-[0.25em] text-gold/80">
              Gouvernance
            </div>
            <div className="mt-3 text-base text-alabaster">
              Super Admin : {bootstrap?.is_super_admin ? "Oui" : "Non"}
            </div>
            <div className="mt-2 text-sm text-alabaster/60">
              Household ID : {bootstrap?.active_household_id ?? "—"}
            </div>
          </article>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate(ROUTES.PROFILES)}
            className="border border-gold/40 px-5 py-3 text-xs uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
          >
            Profiles
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.STATUS)}
            className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
          >
            Status
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.INVENTORY)}
            className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
          >
            Inventory
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.MEALS)}
            className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
          >
            Meals
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.TASKS)}
            className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
          >
            Tasks
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.TOOLS)}
            className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
          >
            Tools
          </button>
        </div>
      </div>
    </div>
  );
}