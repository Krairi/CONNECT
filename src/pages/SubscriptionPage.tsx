import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Crown,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/providers/AuthProvider";
import { useSubscription } from "@/src/hooks/useSubscription";
import { ROUTES } from "@/src/constants/routes";
import {
  formatUnlimited,
  getPlanLabel,
  SUBSCRIPTION_CATALOG,
} from "@/src/constants/subscriptionCatalog";

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const {
    sessionEmail,
    activeMembership,
    isAuthenticated,
    hasHousehold,
    authLoading,
    bootstrapLoading,
  } = useAuth();

  const {
    loading,
    checking,
    error,
    subscription,
    lastQuotaCheck,
    refresh,
    checkQuota,
  } = useSubscription();

  if (authLoading || bootstrapLoading || loading) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-semibold">
            Chargement de l’abonnement...
          </h1>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !hasHousehold || !subscription) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-semibold">Contexte requis</h1>
          <p className="mt-3 text-white/70">
            Il faut une session authentifiée, un foyer actif et un état
            d’abonnement lisible pour accéder à cette page.
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

  const activePlanCode = subscription.plan_tier.toUpperCase();
  const activePlan =
    SUBSCRIPTION_CATALOG.find((plan) => plan.code === activePlanCode) ?? null;

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
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
                <h1 className="mt-4 text-3xl font-semibold">Subscription</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                  Cette page lit le plan réel du foyer actif, affiche ses
                  entitlements et prépare les futurs blocages produit sur quotas.
                </p>
              </div>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-gold">
              <Crown className="h-4 w-4" />
              Abonnement actif
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-black/20 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                    Foyer
                  </p>
                  <p className="mt-3 text-2xl font-semibold">
                    {subscription.household_name}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                    Plan actif
                  </p>
                  <p className="mt-3 text-2xl font-semibold">
                    {getPlanLabel(subscription.plan_tier)}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-5">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                    Profils
                  </p>
                  <p className="mt-2 text-lg text-gold">
                    {formatUnlimited(subscription.max_profiles)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                    Inventory
                  </p>
                  <p className="mt-2 text-lg text-gold">
                    {formatUnlimited(subscription.max_inventory_items)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                    Shopping
                  </p>
                  <p className="mt-2 text-lg text-gold">
                    {formatUnlimited(subscription.shopping_lists_per_month)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                    Membres
                  </p>
                  <p className="mt-2 text-lg text-gold">
                    {formatUnlimited(subscription.max_members)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                    Intégrations
                  </p>
                  <p className="mt-2 text-lg text-gold">
                    {formatUnlimited(subscription.max_active_integrations)}
                  </p>
                </div>
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
                disabled={checking}
                onClick={() => void checkQuota("max_profiles", 1)}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Tester quota profiles
              </button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.PRICING)}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Voir Pricing
              </button>
            </div>

            {(error || lastQuotaCheck) && (
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/85">
                {error?.message ??
                  (lastQuotaCheck
                    ? `Quota ${lastQuotaCheck.limit_name} : demande ${lastQuotaCheck.requested_value}, limite ${lastQuotaCheck.current_limit}, résultat ${lastQuotaCheck.ok ? "OK" : "REFUSÉ"}`
                    : null)}
              </div>
            )}
          </section>

          <aside className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/70">
                <ShieldCheck className="h-4 w-4" />
                Lecture métier DOMYLI
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Session
                </p>
                <p className="mt-2 text-sm text-white/85">{sessionEmail ?? "—"}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Foyer actif
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {activeMembership?.household_name ?? subscription.household_name}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Plan actif
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {getPlanLabel(subscription.plan_tier)}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Lecture produit
                </p>
                <p className="mt-2 text-sm leading-7 text-white/70">
                  Les entitlements sont maintenant lisibles depuis le back et
                  peuvent piloter les futurs blocages ou suggestions d’upgrade.
                </p>
              </div>

              {activePlan ? (
                <div className="rounded-3xl border border-gold/20 bg-gold/10 p-5">
                  <div className="inline-flex items-center gap-2 text-gold">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-xs uppercase tracking-[0.24em]">
                      Plan cible
                    </p>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-gold/90">
                    {activePlan.pitch}
                  </p>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}