import { ArrowLeft, RefreshCw, ShoppingCart, House, ShieldCheck, ArrowRight } from "lucide-react";
import { useDomyliConnection } from "../hooks/useDomyliConnection";
import { useShopping } from "../hooks/useShopping";
import { navigateTo } from "../lib/navigation";

export default function ShoppingPage() {
  const {
    sessionEmail,
    activeMembership,
    bootstrap,
    isAuthenticated,
    hasHousehold,
    authLoading,
  } = useDomyliConnection();

  const { loading, rebuilding, error, items, lastRebuild, refresh, rebuild } =
    useShopping();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/80">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-serif italic">Chargement du shopping...</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
        <div className="max-w-xl w-full border border-white/10 bg-white/5 p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/80">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-serif italic">Foyer requis</h1>
          <p className="mt-4 text-alabaster/70">
            Il faut une session authentifiée et un foyer actif pour accéder à la shopping list.
          </p>
          <button
            onClick={() => navigateTo("/")}
            className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
          >
            Retour à l’accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-alabaster">
      <header className="border-b border-white/5 glass">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo("/dashboard")}
              className="w-10 h-10 border border-white/10 flex items-center justify-center hover:border-gold/40 transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft size={18} className="text-gold" />
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold/80">DOMYLI</p>
              <h1 className="text-2xl font-serif italic">Shopping</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Rafraîchir
            </button>

            <button
              onClick={rebuild}
              disabled={rebuilding}
              className="border border-gold/40 px-5 py-3 text-xs uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors disabled:opacity-50"
            >
              {rebuilding ? "Rebuild..." : "Rebuild"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <section className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 border border-white/10 bg-white/5 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Liste de courses</p>
            <h2 className="mt-4 text-4xl font-serif italic">Articles à acheter</h2>
            <p className="mt-6 text-alabaster/70 leading-relaxed">
              Cette page lit la liste de courses réelle et permet de la reconstruire.
            </p>

            {loading && (
              <div className="mt-8 border border-white/10 bg-black/20 p-4 text-sm text-alabaster/70">
                Chargement de la shopping list...
              </div>
            )}

            {error && (
              <div className="mt-8 border border-white/10 bg-black/20 p-4 text-sm text-alabaster/70">
                {error.message}
              </div>
            )}

            {!loading && !error && items.length === 0 && (
              <div className="mt-8 border border-white/10 bg-black/20 p-6 text-sm text-alabaster/70">
                Aucun article dans la shopping list pour le moment.
              </div>
            )}

            {!loading && !error && items.length > 0 && (
              <div className="mt-8 grid gap-4">
                {items.map((item) => (
                  <div
                    key={`${item.shopping_item_id}-${item.item_name}`}
                    className="border border-white/10 bg-black/20 p-4 grid md:grid-cols-5 gap-4 text-sm"
                  >
                    <div className="md:col-span-2">
                      <div className="text-alabaster/50">Article</div>
                      <div className="mt-1 text-alabaster">{item.item_name}</div>
                    </div>
                    <div>
                      <div className="text-alabaster/50">Quantité</div>
                      <div className="mt-1 text-alabaster">
                        {item.quantity_needed} {item.unit ?? ""}
                      </div>
                    </div>
                    <div>
                      <div className="text-alabaster/50">Priorité</div>
                      <div className="mt-1 text-alabaster">{item.priority ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-alabaster/50">Statut</div>
                      <div className="mt-1 text-alabaster">{item.status ?? "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {lastRebuild && (
              <div className="mt-8 border border-white/10 bg-black/20 p-4 text-sm text-alabaster/75">
                Rebuild terminée : {lastRebuild.items_count} article(s), généré à{" "}
                {new Date(lastRebuild.generated_at).toLocaleString("fr-FR")}.
              </div>
            )}
          </div>

          <aside className="border border-white/10 bg-white/5 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Contexte actif</p>

            <div className="mt-6 space-y-4 text-sm">
              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Email :</span>
                <div className="mt-1 text-alabaster">{sessionEmail ?? "—"}</div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Foyer :</span>
                <div className="mt-1 text-alabaster">{activeMembership?.household_name ?? "—"}</div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Rôle :</span>
                <div className="mt-1 text-alabaster">{activeMembership?.role ?? "—"}</div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Super Admin :</span>
                <div className="mt-1 text-alabaster">{bootstrap?.is_super_admin ? "Oui" : "Non"}</div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="border border-gold/20 bg-gold/5 p-4 text-sm text-alabaster/75">
                <div className="flex items-center gap-3">
                  <House size={18} className="text-gold" />
                  <span>Le shopping matérialise l’impact stock + repas + seuils.</span>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <ShoppingCart size={18} className="text-gold" />
                  <span className="text-sm">RPC : app.rpc_shopping_list_rebuild / rpc_shopping_list_list</span>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-gold" />
                  <span className="text-sm">Lecture alignée sur app.shopping_items</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigateTo("/dashboard")}
                className="w-full flex items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
              >
                <ArrowRight size={18} />
                Retour dashboard
              </button>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}