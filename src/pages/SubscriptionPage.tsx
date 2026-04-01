import { useEffect } from "react";
import { ArrowRight, Crown, Gauge, Layers3, RefreshCcw, ShieldCheck } from "lucide-react";

import { useSubscription } from "@/src/hooks/useSubscription";
import type { PlanCode, SubscriptionEntitlement } from "@/src/services/subscription/subscriptionService";

function planIcon(planCode: string) {
  if (planCode === "PREMIUM") return Crown;
  if (planCode === "FAMILY") return ShieldCheck;
  return Layers3;
}

function statusClasses(status: string): string {
  switch (status) {
    case "OVER_LIMIT":
      return "border-rose-400/30 bg-rose-400/12 text-rose-100";
    case "LIMIT_REACHED":
      return "border-amber-400/30 bg-amber-400/12 text-amber-100";
    case "WATCH":
      return "border-gold/30 bg-gold/12 text-gold";
    default:
      return "border-emerald-400/30 bg-emerald-400/12 text-emerald-100";
  }
}

function formatPrice(value: number, currency: string): string {
  if (value <= 0) return "Gratuit";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

function EntitlementUsageCard({ entry }: { entry: SubscriptionEntitlement }) {
  const progress = entry.limit_mode === "UNLIMITED" || entry.limit_value <= 0
    ? 12
    : Math.max(12, Math.min(100, Math.round((entry.used_value / Math.max(entry.limit_value, 1)) * 100)));

  return (
    <article className="rounded-[24px] border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white">{entry.label}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.14em] text-white/45">{entry.code}</div>
        </div>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] ${statusClasses(entry.status)}`}>
          {entry.status}
        </span>
      </div>
      <div className="mt-4 text-sm text-white/72">
        {entry.limit_mode === "UNLIMITED" || entry.limit_value < 0
          ? `${entry.used_value} ${entry.unit ?? "unités"} utilisés · illimité`
          : `${entry.used_value} / ${entry.limit_value} ${entry.unit ?? "unités"}`}
      </div>
      <div className="mt-4 h-2 rounded-full bg-white/8">
        <div className="h-2 rounded-full bg-gold transition-all" style={{ width: `${progress}%` }} />
      </div>
    </article>
  );
}

export default function SubscriptionPage() {
  const {
    loading,
    previewLoading,
    error,
    pricingPlans,
    snapshot,
    currentPlan,
    selectedTargetPlanCode,
    preview,
    refresh,
    selectTargetPlan,
  } = useSubscription();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get("target");
    if (target) {
      void selectTargetPlan(target as PlanCode);
    }
  }, [selectTargetPlan]);

  const activeTargetPlanCode = selectedTargetPlanCode ?? snapshot?.upgrade_suggestion.target_plan_code ?? null;

  return (
    <main className="min-h-screen bg-[#070b11] text-white">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8 px-6 py-10 lg:px-10">
        <header className="overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.16),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-[11px] uppercase tracking-[0.28em] text-gold/80">Abonnement · Quotas · Projection d’évolution</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight text-white xl:text-[3.2rem]">
                Pilote ton plan DOMYLI avec une lecture directe des quotas, des entitlements et de la trajectoire du foyer.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">
                Cette page n’écrit pas encore la facturation. Elle montre l’état réel du plan courant, les usages actuels et la projection gouvernée d’un changement de plan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/30 bg-gold/15 px-5 py-3 text-sm font-medium text-gold transition hover:border-gold/50 hover:bg-gold/20"
            >
              <RefreshCcw className="h-4 w-4" />
              Recharger l’abonnement
            </button>
          </div>
        </header>

        {error ? (
          <section className="rounded-[28px] border border-rose-400/30 bg-rose-400/12 px-5 py-4 text-sm text-rose-100">
            {error.userMessage ?? error.message}
          </section>
        ) : null}

        {snapshot ? (
          <section className="grid gap-4 xl:grid-cols-[1.2fr,1fr]">
            <article className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Plan courant</div>
                  <h2 className="mt-3 text-3xl font-semibold text-white">{snapshot.plan.plan_label}</h2>
                  <div className="mt-2 text-sm text-white/55">{snapshot.billing_status}</div>
                </div>
                {(() => {
                  const Icon = planIcon(snapshot.current_plan_code);
                  return (
                    <div className="rounded-2xl border border-gold/30 bg-gold/12 p-3 text-gold">
                      <Icon className="h-5 w-5" />
                    </div>
                  );
                })()}
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">Prix mensuel</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{formatPrice(snapshot.plan.monthly_price_eur, snapshot.plan.currency)}</div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">Début</div>
                  <div className="mt-2 text-sm text-white/80">{snapshot.started_at ?? "N/A"}</div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">Renouvellement</div>
                  <div className="mt-2 text-sm text-white/80">{snapshot.renews_at ?? "N/A"}</div>
                </div>
              </div>
              <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm text-white/72">
                {snapshot.upgrade_suggestion.reason ?? "Aucune évolution de plan n’est prioritaire pour le moment."}
              </div>
            </article>

            <article className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
              <div className="flex items-center gap-3">
                <Gauge className="h-5 w-5 text-gold" />
                <h2 className="text-xl font-semibold text-white">Usages actuels du foyer</h2>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4"><div className="text-[11px] uppercase tracking-[0.14em] text-white/45">Membres</div><div className="mt-2 text-2xl font-semibold text-white">{snapshot.usage.members_count}</div></div>
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4"><div className="text-[11px] uppercase tracking-[0.14em] text-white/45">Profils</div><div className="mt-2 text-2xl font-semibold text-white">{snapshot.usage.profiles_count}</div></div>
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4"><div className="text-[11px] uppercase tracking-[0.14em] text-white/45">Inventaire</div><div className="mt-2 text-2xl font-semibold text-white">{snapshot.usage.inventory_items_count}</div></div>
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4"><div className="text-[11px] uppercase tracking-[0.14em] text-white/45">Shopping ouvert</div><div className="mt-2 text-2xl font-semibold text-white">{snapshot.usage.shopping_open_count}</div></div>
              </div>
            </article>
          </section>
        ) : null}

        {snapshot ? (
          <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-gold" />
              <h2 className="text-xl font-semibold text-white">Entitlements du plan courant</h2>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {snapshot.entitlements.map((entry) => <EntitlementUsageCard key={entry.code} entry={entry} />)}
            </div>
          </section>
        ) : null}

        <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Projection d’évolution</div>
              <h2 className="mt-2 text-xl font-semibold text-white">Comparer les plans sans casser le fonctionnement du foyer</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {pricingPlans.map((plan) => (
                <button
                  key={plan.plan_code}
                  type="button"
                  onClick={() => void selectTargetPlan(plan.plan_code)}
                  className={`rounded-full border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] transition ${activeTargetPlanCode === plan.plan_code ? "border-gold/40 bg-gold/15 text-gold" : "border-white/10 bg-white/5 text-white/75 hover:border-white/20 hover:bg-white/10"}`}
                >
                  {plan.plan_label}
                </button>
              ))}
            </div>
          </div>

          {previewLoading ? (
            <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 px-4 py-5 text-white/70">Calcul de la projection DOMYLI…</div>
          ) : null}

          {preview ? (
            <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
              <article className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-3 text-sm text-white/65">
                  <span>{currentPlan?.plan_label ?? preview.current_plan_code}</span>
                  <ArrowRight className="h-4 w-4 text-gold" />
                  <span className="font-medium text-white">{preview.target_plan.plan_label}</span>
                </div>
                <div className="mt-4 text-3xl font-semibold text-white">{formatPrice(preview.target_plan.monthly_price_eur, preview.target_plan.currency)}</div>
                <div className="mt-2 text-sm text-white/60">{preview.target_plan.short_promise}</div>
                <div className="mt-6 space-y-3">
                  {preview.delta.map((entry) => (
                    <div key={entry.code} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-white">{entry.label}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.14em] text-white/45">{entry.code}</div>
                      </div>
                      <div className="text-sm text-white/80">
                        {entry.current_limit == null ? "N/A" : entry.current_limit} → {entry.target_limit == null ? "N/A" : entry.target_limit}
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="text-[11px] uppercase tracking-[0.18em] text-gold/80">Entitlements projetés</div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {preview.entitlements.map((entry) => <EntitlementUsageCard key={entry.code} entry={entry} />)}
                </div>
              </article>
            </div>
          ) : loading ? (
            <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 px-4 py-5 text-white/70">Chargement de l’abonnement…</div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
