import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/providers/AuthProvider";
import { useReadiness } from "@/src/hooks/useReadiness";
import { ROUTES } from "@/src/constants/routes";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR");
}

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function ReasonBadge({ reason }: { reason: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-amber-200">
      {reason.replaceAll("_", " ")}
    </span>
  );
}

export default function ReadinessPage() {
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

  const { loading, error, readiness, refresh } = useReadiness();

  if (authLoading || bootstrapLoading || loading) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-semibold">
            Chargement de la readiness...
          </h1>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !hasHousehold || !readiness) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-semibold">Contexte requis</h1>
          <p className="mt-3 text-white/70">
            Il faut une session authentifiée, un foyer actif et un rapport de
            readiness lisible pour accéder à cette page.
          </p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-black"
          >
            Retour à l’accueil
          </button>
        </div>
      </main>
    );
  }

  const activation = readiness.activation ?? {};
  const valueChain = readiness.value_chain ?? {};
  const todayHealth = readiness.today_health ?? {};

  const flags = [
    ["Membres", toBoolean(activation.has_members)],
    ["Profils", toBoolean(activation.has_profiles)],
    ["Inventaire", toBoolean(activation.has_inventory)],
    ["Tâches", toBoolean(activation.has_tasks)],
    ["Repas", toBoolean(activation.has_meals)],
  ] as const;

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <button
                type="button"
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="mt-1 inline-flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
                aria-label="Retour"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.24em] text-gold">
                  DOMYLI
                </p>
                <h1 className="mt-4 text-3xl font-semibold">Readiness</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                  Cette page valide l’état final du foyer actif et affiche un
                  verdict clair : GO ou NO_GO, avec les raisons de blocage si
                  elles existent encore.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void refresh()}
                className="inline-flex items-center justify-center gap-3 border border-gold/30 px-6 py-4 text-sm uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold/10"
              >
                <RefreshCw className="h-4 w-4" />
                Rafraîchir
              </button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Retour Dashboard
              </button>
            </div>

            {error ? (
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/85">
                {error.message}
              </div>
            ) : null}

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Verdict
                </p>
                <div className="mt-3 flex items-center gap-3">
                  {readiness.go ? (
                    <CheckCircle2 className="h-7 w-7 text-emerald-300" />
                  ) : (
                    <XCircle className="h-7 w-7 text-amber-300" />
                  )}
                  <p className="text-3xl font-semibold">{readiness.go_label}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Activation score
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {readiness.activation_score}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Checked at
                </p>
                <p className="mt-3 text-sm text-white/80">
                  {formatDate(readiness.checked_at)}
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-gold" />
                <h2 className="text-xl font-medium">Blocage / raisons</h2>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {readiness.reasons.length === 0 ? (
                  <span className="text-sm text-emerald-200">
                    Aucun blocage détecté.
                  </span>
                ) : (
                  readiness.reasons.map((reason) => (
                    <ReasonBadge key={reason} reason={reason} />
                  ))
                )}
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-gold" />
                <h2 className="text-xl font-medium">Validation métier</h2>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-5">
                {flags.map(([label, ok]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                      {label}
                    </p>
                    <p className="mt-3 text-sm text-white">
                      {ok ? "OK" : "Manquant"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Lecture foyer
                </span>
              </div>

              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Session
                  </div>
                  <div className="mt-3 text-2xl">{sessionEmail ?? "—"}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Foyer actif
                  </div>
                  <div className="mt-3 text-2xl">
                    {activeMembership?.household_name ?? "—"}
                  </div>
                  <div className="mt-2 text-sm text-white/60">
                    Household ID : {readiness.household_id}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Gouvernance
                  </div>
                  <div className="mt-3 text-2xl">
                    {activeMembership?.role ?? "—"}
                  </div>
                  <div className="mt-2 text-sm text-white/60">
                    Super Admin : {bootstrap?.is_super_admin ? "Oui" : "Non"}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Signaux agrégés
                </span>
              </div>

              <div className="space-y-4">
                {[
                  ["Members", toNumber(valueChain.members_count)],
                  ["Profiles", toNumber(valueChain.profiles_count)],
                  ["Inventory", toNumber(valueChain.inventory_items_count)],
                  ["Meals", toNumber(valueChain.meal_slots_count)],
                  ["Tasks", toNumber(valueChain.tasks_count)],
                  ["Task instances", toNumber(valueChain.task_instances_count)],
                  ["Shopping open", toNumber(valueChain.shopping_open_count)],
                  ["Proofs", toNumber(valueChain.proofs_count)],
                  ["Events", toNumber(valueChain.events_count)],
                  ["Alerts open", toNumber(valueChain.alerts_open_count)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-4"
                  >
                    <span className="text-sm text-white/80">{label}</span>
                    <span className="text-sm text-gold">{value}</span>
                  </div>
                ))}

                <div className="mt-2 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Today health
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-white/80">
                    <div className="flex items-center justify-between">
                      <span>Missing stock</span>
                      <span>{toNumber(todayHealth.missing_stock_count)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Overdue tasks</span>
                      <span>{toNumber(todayHealth.overdue_tasks_count)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Blocked tools</span>
                      <span>{toNumber(todayHealth.blocked_tools_count)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Open alerts</span>
                      <span>{toNumber(todayHealth.open_alert_count)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}