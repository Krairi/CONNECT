import {
  ArrowLeft,
  LayoutDashboard,
  ShieldCheck,
  Users,
  House,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { ROUTES } from "@/src/constants/routes";

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
          <p className="mt-4 max-w-2xl text-alabaster/70 leading-8">
            Synchronisation du contexte foyer, session et gouvernance.
          </p>
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

          <h1 className="mt-4 text-4xl font-semibold">
            Contexte insuffisant
          </h1>

          <p className="mt-5 max-w-2xl text-alabaster/70 leading-8">
            Le dashboard minimum P0 nécessite une session authentifiée et un
            foyer actif.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(ROUTES.HOME)}
              className="border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
            >
              Retour à l’accueil
            </button>
          </div>
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
            <p className="mt-3 max-w-2xl text-alabaster/70 leading-8">
              Cockpit minimum P0 : identité de session, foyer actif, rôle et
              navigation vers la prochaine étape métier.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <article className="glass metallic-border rounded-[1.75rem] p-6">
            <div className="inline-flex rounded-xl border border-gold/20 p-3 text-gold">
              <LayoutDashboard size={18} />
            </div>

            <div className="mt-4 text-xs uppercase tracking-[0.25em] text-gold/80">
              Compte
            </div>

            <div className="mt-3 text-base text-alabaster">
              {sessionEmail ?? "—"}
            </div>

            <p className="mt-3 text-sm leading-7 text-alabaster/60">
              Session active utilisée pour accéder au contrat RPC DOMYLI.
            </p>
          </article>

          <article className="glass metallic-border rounded-[1.75rem] p-6">
            <div className="inline-flex rounded-xl border border-gold/20 p-3 text-gold">
              <House size={18} />
            </div>

            <div className="mt-4 text-xs uppercase tracking-[0.25em] text-gold/80">
              Foyer actif
            </div>

            <div className="mt-3 text-base text-alabaster">
              {activeMembership?.household_name ?? "—"}
            </div>

            <p className="mt-3 text-sm leading-7 text-alabaster/60">
              Household ID : {bootstrap?.active_household_id ?? "—"}
            </p>
          </article>

          <article className="glass metallic-border rounded-[1.75rem] p-6">
            <div className="inline-flex rounded-xl border border-gold/20 p-3 text-gold">
              <ShieldCheck size={18} />
            </div>

            <div className="mt-4 text-xs uppercase tracking-[0.25em] text-gold/80">
              Gouvernance
            </div>

            <div className="mt-3 text-base text-alabaster">
              Rôle : {activeMembership?.role ?? "—"}
            </div>

            <p className="mt-3 text-sm leading-7 text-alabaster/60">
              Super Admin : {bootstrap?.is_super_admin ? "Oui" : "Non"}
            </p>
          </article>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <section className="glass metallic-border rounded-[2rem] p-7">
            <div className="text-xs uppercase tracking-[0.3em] text-gold/80">
              État P0
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-alabaster">
              Parcours minimum opérationnel
            </h2>

            <div className="mt-6 space-y-4">
              {[
                ["Landing premium", "Actif"],
                ["Session Supabase", "Active"],
                ["Foyer", activeMembership?.household_name ?? "Résolu"],
                ["Profiles", "Étape suivante"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-4"
                >
                  <div className="text-sm text-alabaster">{label}</div>
                  <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="glass metallic-border rounded-[2rem] p-7">
            <div className="inline-flex items-center gap-3 text-gold">
              <Users size={18} />
              <span className="text-xs uppercase tracking-[0.3em]">
                Action recommandée
              </span>
            </div>

            <h3 className="mt-5 text-2xl font-semibold text-alabaster">
              Continuer l’activation du foyer
            </h3>

            <p className="mt-4 text-sm leading-8 text-alabaster/65">
              L’étape P0 suivante consiste à structurer le premier profil humain
              du foyer pour rendre les repas, tâches et règles futures
              exploitables.
            </p>

            <button
              type="button"
              onClick={() => navigate(ROUTES.PROFILES)}
              className="mt-8 inline-flex w-full items-center justify-center gap-3 border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.24em] text-obsidian gold-glow"
            >
              Ouvrir Profiles
              <ChevronRight size={16} />
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}