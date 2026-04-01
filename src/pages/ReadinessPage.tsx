import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/src/constants/routes";
import { useReadiness } from "@/src/hooks/useReadiness";
import { useAuth } from "@/src/providers/AuthProvider";

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

function toText(value: unknown, fallback = "—") {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function ReasonBadge({ label, tone }: { label: string; tone: "danger" | "warning" }) {
  const className =
    tone === "danger"
      ? "border border-red-400/30 bg-red-500/10 text-red-200"
      : "border border-gold/30 bg-gold/10 text-gold";

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${className}`}>
      {label.replaceAll("_", " ")}
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">{label}</div>
      <div className="mt-3 text-3xl font-light text-white">{value}</div>
      <div className="mt-2 text-sm text-white/55">{hint}</div>
    </div>
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

  const activation = readiness?.activation ?? {};
  const valueChain = readiness?.value_chain ?? {};
  const todayHealth = readiness?.today_health ?? {};
  const subscription = readiness?.subscription ?? {};
  const entitlements = readiness?.entitlements ?? [];

  const domainFlags = useMemo(
    () =>
      [
        ["Membres", toBoolean((activation as Record<string, unknown>).has_members)],
        ["Profils", toBoolean((activation as Record<string, unknown>).has_profiles)],
        ["Inventaire", toBoolean((activation as Record<string, unknown>).has_inventory)],
        ["Repas", toBoolean((activation as Record<string, unknown>).has_meals)],
        ["Tâches", toBoolean((activation as Record<string, unknown>).has_tasks)],
      ] as const,
    [activation],
  );

  const blockingReasons = readiness?.reasons ?? [];
  const warnings = readiness?.warnings ?? [];

  if (authLoading || bootstrapLoading || loading) {
    return (
      <div className="min-h-screen bg-black px-6 py-12 text-white md:px-10">
        <div className="mx-auto max-w-6xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <div className="text-[11px] uppercase tracking-[0.3em] text-gold">DOMYLI</div>
          <h1 className="mt-4 text-3xl font-light tracking-[0.08em] text-white">Chargement de la validation finale...</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/65">
            Vérification de l’état réel du foyer, des entitlements et des signaux bloquants.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold || !readiness) {
    return (
      <div className="min-h-screen bg-black px-6 py-12 text-white md:px-10">
        <div className="mx-auto max-w-4xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <div className="text-[11px] uppercase tracking-[0.3em] text-gold">DOMYLI</div>
          <h1 className="mt-4 text-3xl font-light tracking-[0.08em] text-white">Contexte requis</h1>
          <p className="mt-3 text-sm text-white/65">
            Il faut une session authentifiée, un foyer actif et un rapport de validation lisible pour accéder à cette page.
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
    <div className="min-h-screen bg-black px-6 py-10 text-white md:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <button
                type="button"
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="inline-flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
                aria-label="Retour"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="mt-4 text-[11px] uppercase tracking-[0.3em] text-gold">DOMYLI</div>
              <h1 className="mt-3 text-4xl font-light tracking-[0.08em] text-white">Validation finale</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">
                Cette page valide l’état final du foyer actif et expose un verdict clair : GO ou NO_GO, avec les blocages,
                les avertissements et les entitlements réellement observés côté serveur.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
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
                onClick={() => navigate(ROUTES.STATUS)}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                <ShieldCheck className="h-4 w-4" />
                Ouvrir Status
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-6 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error.message}</div>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Verdict"
              value={readiness.go_label}
              hint={readiness.go ? "Foyer prêt pour une exploitation réelle." : "Blocages encore présents avant GO."}
            />
            <StatCard label="Activation score" value={readiness.activation_score} hint="Score calculé sur les piliers opérationnels." />
            <StatCard label="Checked at" value={formatDate(readiness.checked_at)} hint="Horodatage du dernier contrôle serveur." />
            <StatCard
              label="Plan courant"
              value={toText((subscription as Record<string, unknown>).plan_code, "—")}
              hint="Lecture household du plan / abonnement actif."
            />
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                {readiness.go ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <XCircle className="h-5 w-5 text-red-300" />}
                <h2 className="text-lg font-medium tracking-[0.04em] text-white">Blocages et avertissements</h2>
              </div>
              <div className="mt-6 space-y-6">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">Blocages</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {blockingReasons.length === 0 ? (
                      <div className="text-sm text-white/55">Aucun blocage détecté.</div>
                    ) : (
                      blockingReasons.map((reason) => <ReasonBadge key={reason} label={reason} tone="danger" />)
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">Avertissements</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {warnings.length === 0 ? (
                      <div className="text-sm text-white/55">Aucun avertissement actif.</div>
                    ) : (
                      warnings.map((warning) => <ReasonBadge key={warning} label={warning} tone="warning" />)
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-gold" />
                <h2 className="text-lg font-medium tracking-[0.04em] text-white">Validation métier</h2>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {domainFlags.map(([label, ok]) => (
                  <div key={label} className="border border-white/10 bg-black/20 p-4">
                    <div className="text-sm text-white/75">{label}</div>
                    <div className={`mt-3 text-sm uppercase tracking-[0.24em] ${ok ? "text-emerald-300" : "text-red-300"}`}>
                      {ok ? "OK" : "Manquant"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-gold" />
                <h2 className="text-lg font-medium tracking-[0.04em] text-white">Entitlements et seuils</h2>
              </div>
              <div className="mt-6 overflow-hidden border border-white/10">
                <div className="grid grid-cols-[1.6fr_0.7fr_0.9fr_0.9fr] bg-white/5 px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-white/45">
                  <div>Entitlement</div>
                  <div>Usage</div>
                  <div>Limite</div>
                  <div>Statut</div>
                </div>
                {entitlements.length === 0 ? (
                  <div className="px-4 py-5 text-sm text-white/55">Aucun entitlement remonté par le serveur.</div>
                ) : (
                  entitlements.map((row, index) => {
                    const code = toText(row.code ?? row.key, `ENTITLEMENT_${index + 1}`);
                    const usage = typeof row.usage === "number" ? row.usage : typeof row.current === "number" ? row.current : "—";
                    const limit = typeof row.limit === "number" ? row.limit : typeof row.max === "number" ? row.max : "—";
                    const status = toText(row.status, "OK");
                    const tone =
                      status === "OVER_LIMIT"
                        ? "text-red-300"
                        : status === "LIMIT_REACHED"
                          ? "text-orange-300"
                          : status === "WATCH"
                            ? "text-gold"
                            : "text-emerald-300";
                    return (
                      <div key={`${code}-${index}`} className="grid grid-cols-[1.6fr_0.7fr_0.9fr_0.9fr] border-t border-white/10 px-4 py-4 text-sm text-white/75">
                        <div>{code.replaceAll("_", " ")}</div>
                        <div>{usage}</div>
                        <div>{limit}</div>
                        <div className={tone}>{status.replaceAll("_", " ")}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">Lecture foyer</div>
              <div className="mt-6 space-y-4 text-sm text-white/70">
                <div>
                  <div className="text-white/45">Session</div>
                  <div className="mt-1 text-white">{sessionEmail ?? "—"}</div>
                </div>
                <div>
                  <div className="text-white/45">Foyer actif</div>
                  <div className="mt-1 text-white">{activeMembership?.household_name ?? "—"}</div>
                  <div className="mt-1 text-xs text-white/45">Household ID : {readiness.household_id}</div>
                </div>
                <div>
                  <div className="text-white/45">Gouvernance</div>
                  <div className="mt-1 text-white">{activeMembership?.role ?? "—"}</div>
                  <div className="mt-1 text-xs text-white/45">Super Admin : {bootstrap?.is_super_admin ? "Oui" : "Non"}</div>
                </div>
              </div>
            </div>

            <div className="border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">Chaîne de valeur</div>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {[
                  ["Members", toNumber((valueChain as Record<string, unknown>).members_count)],
                  ["Profiles", toNumber((valueChain as Record<string, unknown>).profiles_count)],
                  ["Inventory", toNumber((valueChain as Record<string, unknown>).inventory_items_count)],
                  ["Meals", toNumber((valueChain as Record<string, unknown>).meal_slots_count)],
                  ["Tasks", toNumber((valueChain as Record<string, unknown>).tasks_count)],
                  ["Task instances", toNumber((valueChain as Record<string, unknown>).task_instances_count)],
                  ["Shopping open", toNumber((valueChain as Record<string, unknown>).shopping_open_count)],
                  ["Proofs", toNumber((valueChain as Record<string, unknown>).proofs_count)],
                  ["Events", toNumber((valueChain as Record<string, unknown>).events_count)],
                  ["Alerts open", toNumber((valueChain as Record<string, unknown>).alerts_open_count)],
                ].map(([label, value]) => (
                  <div key={label} className="border border-white/10 bg-black/20 p-4">
                    <div className="text-sm text-white/55">{label}</div>
                    <div className="mt-2 text-2xl font-light text-white">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">Today health</div>
              <div className="mt-6 grid gap-3">
                {[
                  ["Missing stock", toNumber((todayHealth as Record<string, unknown>).missing_stock_count)],
                  ["Overdue tasks", toNumber((todayHealth as Record<string, unknown>).overdue_tasks_count)],
                  ["Blocked tools", toNumber((todayHealth as Record<string, unknown>).blocked_tools_count)],
                  ["Open alerts", toNumber((todayHealth as Record<string, unknown>).open_alert_count)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">
                    <span>{label}</span>
                    <span className="text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
