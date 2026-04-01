import { useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  UserRoundCog,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/src/constants/routes";
import { useProfiles } from "@/src/hooks/useProfiles";
import { useAuth } from "@/src/providers/AuthProvider";

function buildStateLabel(state: string): string {
  switch (state) {
    case "READY":
      return "Profil exploitable";
    case "PROFILE_INCOMPLETE":
      return "Profil incomplet";
    case "PROFILE_REQUIRED":
      return "Profil requis";
    default:
      return state;
  }
}

function buildStateClasses(state: string): string {
  switch (state) {
    case "READY":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "PROFILE_INCOMPLETE":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    default:
      return "border-white/10 bg-black/20 text-white/80";
  }
}

export default function ProfilesPage() {
  const navigate = useNavigate();
  const { isAuthenticated, hasHousehold, bootstrapLoading, activeMembership } =
    useAuth();
  const { loading, error, profiles, summary } = useProfiles();

  const sortedProfiles = useMemo(() => {
    return [...profiles].sort((left, right) => {
      if (left.onboarding_state === right.onboarding_state) {
        return (left.member_email ?? "").localeCompare(right.member_email ?? "");
      }

      const weights: Record<string, number> = {
        PROFILE_REQUIRED: 0,
        PROFILE_INCOMPLETE: 1,
        READY: 2,
      };

      return (weights[left.onboarding_state] ?? 9) - (weights[right.onboarding_state] ?? 9);
    });
  }, [profiles]);

  if (bootstrapLoading || loading) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-semibold">Chargement des profils...</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-semibold">Foyer requis</h1>
          <p className="mt-3 text-white/70">
            La page Profiles nécessite un foyer actif résolu par le bootstrap DOMYLI.
          </p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-black"
          >
            Retour à l’accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4 rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gold">DOMYLI</p>
            <h1 className="mt-4 text-3xl font-semibold">Profiles</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
              Profiles n’est pas un simple formulaire. C’est la lecture gouvernée
              des identités métier du foyer : qui est prêt, qui doit compléter son
              profil, et ce que DOMYLI peut déjà exploiter côté repas, tâches,
              règles et arbitrages.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="inline-flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.24em] text-white/60">
              Membres lus
            </p>
            <p className="mt-4 text-4xl font-semibold">{summary.total}</p>
          </div>

          <div className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/5 p-6 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">
              Profils exploitables
            </p>
            <p className="mt-4 text-4xl font-semibold text-white">{summary.ready}</p>
          </div>

          <div className="rounded-[28px] border border-amber-500/20 bg-amber-500/5 p-6 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-300">
              Profils incomplets
            </p>
            <p className="mt-4 text-4xl font-semibold text-white">{summary.incomplete}</p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.24em] text-white/60">
              Taux de préparation
            </p>
            <p className="mt-4 text-4xl font-semibold">{summary.readinessRate}%</p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_380px]">
          <section className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gold" />
              <p className="text-sm uppercase tracking-[0.24em] text-gold">
                Lecture gouvernée du foyer
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {sortedProfiles.length === 0 ? (
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm leading-7 text-white/70">
                  Aucun membre n’a encore été remonté par le foyer actif.
                </div>
              ) : (
                sortedProfiles.map((item) => (
                  <article
                    key={item.member_user_id || item.member_email || `${item.role}-${item.onboarding_state}`}
                    className="rounded-[24px] border border-white/10 bg-black/20 p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                          Membre
                        </p>
                        <h2 className="mt-3 text-xl font-semibold text-white">
                          {item.profile_display_name ?? item.member_email ?? "Profil DOMYLI"}
                        </h2>
                        <p className="mt-2 text-sm text-white/60">
                          {item.member_email ?? "Email non remonté"}
                        </p>
                      </div>

                      <div
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${buildStateClasses(item.onboarding_state)}`}
                      >
                        {buildStateLabel(item.onboarding_state)}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">Rôle</p>
                        <p className="mt-2 text-sm font-medium text-white">{item.role}</p>
                      </div>

                      <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">Score</p>
                        <p className="mt-2 text-sm font-medium text-white">{item.readiness_score}%</p>
                      </div>

                      <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">Profil lié</p>
                        <p className="mt-2 text-sm font-medium text-white">
                          {item.profile_id ? "Oui" : "Non"}
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            {error?.message ? (
              <div className="mt-6 rounded-[24px] border border-red-500/20 bg-red-500/5 p-5 text-sm leading-7 text-red-200">
                {error.message}
              </div>
            ) : null}
          </section>

          <aside className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
              <div className="flex items-center gap-3">
                <UserRoundCog className="h-5 w-5 text-gold" />
                <p className="text-sm uppercase tracking-[0.24em] text-gold">
                  Mon profil
                </p>
              </div>

              <p className="mt-4 text-sm leading-7 text-white/70">
                Accède à la normalisation de ton identité métier. Ce parcours est
                guidé, sans champ libre, et conditionne l’accès complet aux routes
                profilées du système.
              </p>

              <button
                type="button"
                onClick={() => navigate(ROUTES.MY_PROFILE)}
                className="mt-6 inline-flex w-full items-center justify-center gap-3 border border-gold/40 px-5 py-4 text-sm uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold hover:text-black"
              >
                Structurer mon profil
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-gold" />
                <p className="text-sm uppercase tracking-[0.24em] text-gold">
                  Lecture métier DOMYLI
                </p>
              </div>

              <div className="mt-6 space-y-4 text-sm leading-7 text-white/70">
                <p>
                  Foyer actif : <span className="text-white">{activeMembership?.household_name ?? "—"}</span>
                </p>
                <p>
                  Rôle actif : <span className="text-white">{activeMembership?.role ?? "—"}</span>
                </p>
                <p>
                  Le profil humain valide devient la base réelle des repas,
                  tâches, règles, compatibilités et arbitrages du foyer.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate(ROUTES.HOUSEHOLD_MEMBERS)}
                className="mt-6 inline-flex w-full items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Gérer les membres du foyer
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
