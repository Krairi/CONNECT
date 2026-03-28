import { ArrowLeft, CheckCircle2, Crown, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/src/constants/routes";
import {
  formatUnlimited,
  SUBSCRIPTION_CATALOG,
} from "@/src/constants/subscriptionCatalog";

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate(ROUTES.HOME)}
              className="mt-1 inline-flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
              aria-label="Retour"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.24em] text-gold">
                DOMYLI
              </p>
              <h1 className="mt-4 text-3xl font-semibold">Pricing</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                DOMYLI ne vend pas une simple application. Chaque plan ouvre un
                niveau de gouvernance du foyer, avec des limites lisibles et des
                entitlements explicites.
              </p>
            </div>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-gold">
            <Crown className="h-4 w-4" />
            Plans DOMYLI
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {SUBSCRIPTION_CATALOG.map((plan) => (
              <article
                key={plan.code}
                className="rounded-[28px] border border-white/10 bg-black/20 p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-gold">
                      {plan.tag}
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold">{plan.label}</h2>
                  </div>

                  <ShieldCheck className="h-5 w-5 text-gold" />
                </div>

                <p className="mt-4 text-3xl font-semibold">{plan.priceLabel}</p>
                <p className="mt-4 text-sm leading-7 text-white/70">
                  {plan.pitch}
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    ["Profils", formatUnlimited(plan.entitlements.max_profiles)],
                    [
                      "Articles inventaire",
                      formatUnlimited(plan.entitlements.max_inventory_items),
                    ],
                    [
                      "Shopping / mois",
                      formatUnlimited(plan.entitlements.shopping_lists_per_month),
                    ],
                    ["Membres", formatUnlimited(plan.entitlements.max_members)],
                    [
                      "Intégrations actives",
                      formatUnlimited(plan.entitlements.max_active_integrations),
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                    >
                      <span className="text-sm text-white/80">{label}</span>
                      <span className="text-sm text-gold">{value}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => navigate(ROUTES.SUBSCRIPTION)}
                  className="mt-6 inline-flex w-full items-center justify-center gap-3 border border-gold/30 px-5 py-4 text-sm uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold/10"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Voir mon abonnement
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}