import { CheckCircle2, Crown, Layers3, ShieldCheck, Sparkles } from "lucide-react";

import { useSubscription } from "@/src/hooks/useSubscription";
import type { PricingPlan, SubscriptionEntitlement } from "@/src/services/subscription/subscriptionService";

function formatPrice(value: number, currency: string): string {
  if (value <= 0) return "Gratuit";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function toneForStatus(status: string): string {
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

function planIcon(planCode: string) {
  if (planCode === "PREMIUM") return Crown;
  if (planCode === "FAMILY") return ShieldCheck;
  return Layers3;
}

function EntitlementList({ items }: { items: PricingPlan["entitlements"] | SubscriptionEntitlement[] }) {
  return (
    <ul className="space-y-3">
      {items.map((entry) => (
        <li key={entry.code} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
          <div className="min-w-0">
            <div className="text-sm font-medium text-white">{entry.label}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.14em] text-white/50">
              {entry.limit_mode === "UNLIMITED" || entry.limit_value < 0 ? "Illimité" : `${entry.limit_value} ${entry.unit ?? "unités"}`}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function PlanCard({
  plan,
  currentPlanCode,
}: {
  plan: PricingPlan;
  currentPlanCode: string | null;
}) {
  const Icon = planIcon(plan.plan_code);
  const isCurrent = currentPlanCode === plan.plan_code;
  return (
    <article className={`rounded-[32px] border p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${plan.highlight ? "border-gold/35 bg-gold/[0.08]" : "border-white/10 bg-white/[0.04]"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Plan DOMYLI</div>
          <h2 className="mt-3 text-2xl font-semibold text-white">{plan.plan_label}</h2>
        </div>
        <div className={`rounded-2xl border p-3 ${plan.highlight ? "border-gold/30 bg-gold/15 text-gold" : "border-white/10 bg-white/8 text-white/80"}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/72">{plan.short_promise}</p>
      <div className="mt-6 flex items-end gap-2">
        <div className="text-4xl font-semibold text-white">{formatPrice(plan.monthly_price_eur, plan.currency)}</div>
        <div className="pb-1 text-sm text-white/50">/ mois</div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {isCurrent ? (
          <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/12 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-100">Plan actuel</span>
        ) : null}
        {plan.highlight ? (
          <span className="inline-flex items-center rounded-full border border-gold/30 bg-gold/12 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-gold">Recommandé</span>
        ) : null}
      </div>
      <div className="mt-6">
        <EntitlementList items={plan.entitlements} />
      </div>
      <a
        href={`/subscription?target=${encodeURIComponent(plan.plan_code)}`}
        className="mt-6 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
      >
        Voir ce plan dans l’abonnement
      </a>
    </article>
  );
}

export default function PricingPage() {
  const { loading, error, pricingPlans, snapshot } = useSubscription();

  return (
    <main className="min-h-screen bg-[#070b11] text-white">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8 px-6 py-10 lg:px-10">
        <header className="overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.16),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
          <div className="max-w-4xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-gold/80">Plans · Quotas · Entitlements</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-white xl:text-[3.2rem]">
              Choisis le niveau DOMYLI adapté à la profondeur réelle de ton foyer.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">
              Les plans DOMYLI ne vendent pas une décoration tarifaire. Ils gouvernent l’accès aux profils, au stock, aux projections shopping et à la coordination réelle du foyer.
            </p>
          </div>
        </header>

        {error ? (
          <section className="rounded-[28px] border border-rose-400/30 bg-rose-400/12 px-5 py-4 text-sm text-rose-100">
            {error.userMessage ?? error.message}
          </section>
        ) : null}

        {snapshot ? (
          <section className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Plan actuel</div>
              <div className="mt-2 text-3xl font-semibold text-white">{snapshot.plan.plan_label}</div>
              <div className="mt-2 text-sm text-white/55">{snapshot.billing_status}</div>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Profils utilisés</div>
              <div className="mt-2 text-3xl font-semibold text-white">{snapshot.usage.profiles_count}</div>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Articles inventaire</div>
              <div className="mt-2 text-3xl font-semibold text-white">{snapshot.usage.inventory_items_count}</div>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Signal d’évolution</div>
              <div className="mt-2 text-sm leading-6 text-white/75">
                {snapshot.upgrade_suggestion.reason ?? "Le foyer reste dans le périmètre du plan actuel."}
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-3">
          {loading && pricingPlans.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 text-white/70">Chargement des plans DOMYLI…</div>
          ) : null}
          {pricingPlans.map((plan) => (
            <PlanCard key={plan.plan_code} plan={plan} currentPlanCode={snapshot?.current_plan_code ?? null} />
          ))}
        </section>

        {snapshot ? (
          <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-gold" />
              <h2 className="text-xl font-semibold text-white">État actuel des entitlements</h2>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {snapshot.entitlements.map((entry) => (
                <article key={entry.code} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">{entry.label}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.14em] text-white/45">{entry.code}</div>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] ${toneForStatus(entry.status)}`}>
                      {entry.status}
                    </span>
                  </div>
                  <div className="mt-4 text-sm text-white/70">
                    {entry.limit_mode === "UNLIMITED" || entry.limit_value < 0
                      ? `${entry.used_value} ${entry.unit ?? "unités"} utilisés · illimité`
                      : `${entry.used_value} / ${entry.limit_value} ${entry.unit ?? "unités"}`}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
