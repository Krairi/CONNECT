import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  Boxes,
  ClipboardList,
  House,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  UserRound,
  Users,
  Utensils,
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
  if (["WARNING", "LOW", "PENDING", "PROFILE_REQUIRED"].includes(upper)) {
    return "warning";
  }
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
    <div className="border border-white/10 bg-black/20 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">
          {label}
        </div>
        <Icon className="h-4 w-4 text-gold/85" />
      </div>
      <div className="mt-5 text-3xl font-light tracking-[0.04em] text-white">
        {value}
      </div>
      <div
        className={`mt-4 inline-flex items-center border px-3 py-2 text-[11px] uppercase tracking-[0.22em] ${getToneClasses(
          tone,
        )}`}
      >
        Signal {tone}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    hasHousehold,
    authLoading,
    bootstrapLoading,
  } = useAuth();

  const {
    loading,
    error,
    activation,
    valueChain,
    health,
    feed,
    refresh,
    viewMode,
    setViewMode,
    selectProfile,
    availableProfiles,
    selectedProfile,
    householdName,
    role,
  } = useDashboard();

  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const criticalSignals = useMemo(() => {
    return feed.filter((item) => getSignalTone(item.status) === "danger").length;
  }, [feed]);

  const warningSignals = useMemo(() => {
    return feed.filter((item) => getSignalTone(item.status) === "warning").length;
  }, [feed]);

  const profileSummary = useMemo(() => {
    if (!selectedProfile) return null;

    const constraints = [
      ...(selectedProfile.food_constraints ?? []),
      ...(selectedProfile.cultural_constraints ?? []),
    ];

    return {
      displayName: selectedProfile.display_name,
      goal: selectedProfile.goal ?? "Non défini",
      activity: selectedProfile.activity_level ?? "Non défini",
      allergies:
        (selectedProfile.allergies ?? []).length > 0
          ? selectedProfile.allergies!.join(", ")
          : "Aucune",
      constraints: constraints.length > 0 ? constraints.join(", ") : "Aucune",
    };
  }, [selectedProfile]);

  if (authLoading || bootstrapLoading || loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
          <div className="border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
            <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-gold/75">
              <Sparkles className="h-4 w-4" />
              DOMYLI
            </div>
            <h1 className="mt-6 text-4xl font-light tracking-[0.06em] text-white">
              Chargement du dashboard…
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60">
              Synchronisation du cockpit foyer, de la vue active et du flux
              prioritaire.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <main className="min-h-screen bg-black text-white">
        <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
          <div className="border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
            <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-gold/75">
              <House className="h-4 w-4" />
              DOMYLI
            </div>
            <h1 className="mt-6 text-4xl font-light tracking-[0.06em] text-white">
              Contexte insuffisant
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60">
              Le dashboard métier nécessite une session authentifiée et un foyer actif.
            </p>
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="mt-8 inline-flex items-center justify-center border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-black"
            >
              Retour à l’accueil
            </button>
          </div>
        </section>
      </main>
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
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-6 border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-gold/75">
                <Sparkles className="h-4 w-4" />
                DOMYLI · Dashboard
              </div>
              <h1 className="mt-5 text-4xl font-light tracking-[0.06em] text-white sm:text-5xl">
                {viewMode === "PROFILE"
                  ? "Ma vue personnelle du foyer"
                  : "Cockpit décisionnel du foyer"}
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-white/60">
                {viewMode === "PROFILE"
                  ? "Lecture ciblée de ce qui concerne le profil humain actif : repas, tâches, blocages et signaux utiles."
                  : "Lecture foyer consolidée : activation, santé opérationnelle, signaux prioritaires et chaîne de valeur du système."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center justify-center gap-3 border border-white/15 px-5 py-3 text-sm uppercase tracking-[0.18em] text-white/75 transition-colors hover:border-gold/35 hover:text-gold"
              >
                <RefreshCw className="h-4 w-4" />
                Rafraîchir
              </button>

              <button
                onClick={() =>
                  navigate(viewMode === "PROFILE" ? ROUTES.MEALS : ROUTES.STATUS)
                }
                className="inline-flex items-center justify-center gap-3 rounded-full bg-gold px-5 py-3 text-sm uppercase tracking-[0.18em] text-black transition-opacity hover:opacity-90"
              >
                {viewMode === "PROFILE" ? "Mes repas" : "Status foyer"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setViewMode("PROFILE")}
              className={`inline-flex items-center gap-3 border px-4 py-3 text-xs uppercase tracking-[0.24em] transition-colors ${
                viewMode === "PROFILE"
                  ? "border-gold bg-gold text-black"
                  : "border-white/15 text-white/70 hover:border-gold/35 hover:text-gold"
              }`}
            >
              <UserRound className="h-4 w-4" />
              Vue profil
            </button>

            <button
              type="button"
              onClick={() => setViewMode("FOYER")}
              className={`inline-flex items-center gap-3 border px-4 py-3 text-xs uppercase tracking-[0.24em] transition-colors ${
                viewMode === "FOYER"
                  ? "border-gold bg-gold text-black"
                  : "border-white/15 text-white/70 hover:border-gold/35 hover:text-gold"
              }`}
            >
              <Users className="h-4 w-4" />
              Vue foyer
            </button>

            {availableProfiles.length > 0 ? (
              <select
                value={selectedProfile?.profile_id ?? ""}
                onChange={(event) =>
                  void selectProfile(event.target.value || null)
                }
                className="min-w-[240px] border border-white/15 bg-black/30 px-4 py-3 text-xs uppercase tracking-[0.18em] text-white/80 outline-none transition-colors focus:border-gold/35"
              >
                {availableProfiles.map((profile) => (
                  <option key={profile.profile_id} value={profile.profile_id}>
                    {profile.display_name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          {(localMessage || error) && (
            <div className="border border-amber-400/25 bg-amber-400/10 px-4 py-4 text-sm text-amber-100">
              {localMessage ?? error?.message}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Repas"
              value={String(health?.planned_meals_count ?? 0)}
              icon={Utensils}
              tone={(health?.planned_meals_count ?? 0) > 0 ? "success" : "neutral"}
            />
            <SummaryCard
              label="Tâches"
              value={String(valueChain?.tasks_count ?? 0)}
              icon={ClipboardList}
              tone={(health?.overdue_tasks_count ?? 0) > 0 ? "danger" : "neutral"}
            />
            <SummaryCard
              label="Achats ouverts"
              value={String(valueChain?.shopping_open_count ?? 0)}
              icon={ShoppingCart}
              tone={(valueChain?.shopping_open_count ?? 0) > 0 ? "warning" : "neutral"}
            />
            <SummaryCard
              label="Alertes"
              value={String(health?.open_alert_count ?? 0)}
              icon={BellRing}
              tone={criticalSignals > 0 ? "danger" : warningSignals > 0 ? "warning" : "success"}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
            <div className="text-[11px] uppercase tracking-[0.28em] text-gold/75">
              {viewMode === "PROFILE" ? "Vue profil humain" : "Vue foyer"}
            </div>

            <h2 className="mt-5 text-3xl font-light tracking-[0.05em] text-white">
              {viewMode === "PROFILE"
                ? selectedProfile?.display_name ?? "Profil humain"
                : householdName ?? "Foyer actif"}
            </h2>

            <p className="mt-4 text-sm leading-7 text-white/60">
              {viewMode === "PROFILE"
                ? "Lecture personnelle : ce qui me concerne, ce qui me bloque, ce que je dois voir d’abord."
                : "Lecture globale : état consolidé du foyer, rôle, activation et pilotage transverse."}
            </p>

            <div className="mt-8 space-y-4">
              <div className="border border-white/10 bg-black/20 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Foyer
                </div>
                <div className="mt-2 text-lg font-medium text-white">
                  {householdName ?? "—"}
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Gouvernance
                </div>
                <div className="mt-2 text-lg font-medium text-white">
                  {role ?? "—"}
                </div>
              </div>

              {viewMode === "PROFILE" && profileSummary ? (
                <>
                  <div className="border border-white/10 bg-black/20 p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                      Mon profil
                    </div>
                    <div className="mt-2 text-lg font-medium text-white">
                      {profileSummary.displayName}
                    </div>
                    <div className="mt-4 space-y-2 text-sm leading-6 text-white/60">
                      <div>Objectif : {profileSummary.goal}</div>
                      <div>Activité : {profileSummary.activity}</div>
                      <div>Allergies : {profileSummary.allergies}</div>
                      <div>Contraintes : {profileSummary.constraints}</div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border border-white/10 bg-black/20 p-5">
                      <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                        Mes repas
                      </div>
                      <div className="mt-2 text-2xl font-light text-white">
                        {health?.planned_meals_count ?? 0}
                      </div>
                    </div>

                    <div className="border border-white/10 bg-black/20 p-5">
                      <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                        Mes blocages
                      </div>
                      <div className="mt-2 text-2xl font-light text-white">
                        {(health?.open_alert_count ?? 0) + (health?.missing_stock_count ?? 0)}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {viewMode === "FOYER" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border border-white/10 bg-black/20 p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                      Profils actifs
                    </div>
                    <div className="mt-2 text-2xl font-light text-white">
                      {valueChain?.profiles_count ?? 0}
                    </div>
                  </div>

                  <div className="border border-white/10 bg-black/20 p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                      Consommables suivis
                    </div>
                    <div className="mt-2 text-2xl font-light text-white">
                      {valueChain?.inventory_items_count ?? 0}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
            <div className="text-[11px] uppercase tracking-[0.28em] text-gold/75">
              Flux prioritaire
            </div>

            <h2 className="mt-5 text-3xl font-light tracking-[0.05em] text-white">
              Signaux à traiter en premier
            </h2>

            <p className="mt-4 text-sm leading-7 text-white/60">
              {viewMode === "PROFILE"
                ? "Lecture prioritaire centrée sur l’exécution personnelle et les blocages visibles."
                : "Lecture prioritaire du foyer : alertes, signaux critiques, manque stock et pression opérationnelle."}
            </p>

            <div className="mt-8 space-y-4">
              {feed.length === 0 ? (
                <div className="border border-white/10 bg-black/20 px-5 py-5 text-sm text-white/55">
                  Aucun signal remonté pour le moment.
                </div>
              ) : (
                feed.slice(0, 8).map((item) => (
                  <button
                    key={`${item.item_type}-${item.item_id}`}
                    type="button"
                    onClick={() =>
                      navigate(
                        viewMode === "PROFILE" ? ROUTES.TASKS : ROUTES.STATUS,
                      )
                    }
                    className="w-full border border-white/10 bg-black/20 p-5 text-left transition hover:border-gold/30 hover:bg-black/25"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                          {item.item_type}
                        </div>
                        <div className="mt-2 text-lg font-medium text-white">
                          {item.title}
                        </div>
                        <div className="mt-3 text-sm text-white/50">
                          {formatDate(item.scheduled_at)}
                        </div>
                      </div>

                      <div
                        className={`inline-flex items-center border px-3 py-2 text-[11px] uppercase tracking-[0.22em] ${getToneClasses(
                          getSignalTone(item.status),
                        )}`}
                      >
                        {item.status}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="border border-white/10 bg-black/20 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Activation
                </div>
                <div className="mt-2 text-2xl font-light text-white">
                  {activation?.activation_score ?? 0}
                </div>
                <div className="mt-3 text-sm text-white/55">
                  {activation?.is_operational ? "Foyer opérationnel" : "Activation incomplète"}
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Chaîne de valeur
                </div>
                <div className="mt-2 text-2xl font-light text-white">
                  {valueChain?.events_count ?? 0}
                </div>
                <div className="mt-3 text-sm text-white/55">
                  Événements consolidés du foyer
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Stock manquant
                </div>
                <div className="mt-2 text-2xl font-light text-white">
                  {health?.missing_stock_count ?? 0}
                </div>
                <div className="mt-3 text-sm text-white/55">
                  Consommables critiques à corriger
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Tâches en retard
                </div>
                <div className="mt-2 text-2xl font-light text-white">
                  {health?.overdue_tasks_count ?? 0}
                </div>
                <div className="mt-3 text-sm text-white/55">
                  Charge opérationnelle à résorber
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => navigate(ROUTES.MEALS)}
                className="inline-flex items-center gap-3 border border-white/15 px-4 py-3 text-xs uppercase tracking-[0.22em] text-white/75 transition-colors hover:border-gold/35 hover:text-gold"
              >
                <Utensils className="h-4 w-4" />
                Meals
              </button>

              <button
                onClick={() => navigate(ROUTES.TASKS)}
                className="inline-flex items-center gap-3 border border-white/15 px-4 py-3 text-xs uppercase tracking-[0.22em] text-white/75 transition-colors hover:border-gold/35 hover:text-gold"
              >
                <ClipboardList className="h-4 w-4" />
                Tasks
              </button>

              <button
                onClick={() => navigate(ROUTES.SHOPPING)}
                className="inline-flex items-center gap-3 border border-white/15 px-4 py-3 text-xs uppercase tracking-[0.22em] text-white/75 transition-colors hover:border-gold/35 hover:text-gold"
              >
                <ShoppingCart className="h-4 w-4" />
                Shopping
              </button>

              <button
                onClick={() => navigate(ROUTES.PROFILES)}
                className="inline-flex items-center gap-3 border border-white/15 px-4 py-3 text-xs uppercase tracking-[0.22em] text-white/75 transition-colors hover:border-gold/35 hover:text-gold"
              >
                <Users className="h-4 w-4" />
                Profils
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}