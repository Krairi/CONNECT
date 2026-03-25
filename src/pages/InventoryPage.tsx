import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Boxes,
  House,
  Package,
  RefreshCw,
  ShoppingCart,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { useInventory } from "@/src/hooks/useInventory";
import { ROUTES } from "@/src/constants/routes";

export default function InventoryPage() {
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

  const {
    saveItem,
    rebuildShopping,
    saving,
    rebuilding,
    error,
    lastSavedItem,
    lastRebuild,
  } = useInventory();

  const householdId = bootstrap?.active_household_id ?? null;

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [qtyOnHand, setQtyOnHand] = useState("");
  const [minQty, setMinQty] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(householdId && name.trim() && qtyOnHand !== "");
  }, [householdId, name, qtyOnHand]);

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold">
            Chargement de l’inventaire...
          </h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold || !householdId) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold">
            DOMYLI
          </div>

          <h1 className="mt-4 text-4xl font-semibold">Foyer requis</h1>

          <p className="mt-5 max-w-2xl text-alabaster/70 leading-8">
            Il faut une session authentifiée et un foyer actif pour accéder à
            l’inventaire.
          </p>

          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
          >
            Retour à l’accueil
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLocalMessage(null);

    try {
      const result = await saveItem({
        p_household_id: householdId,
        p_name: name.trim(),
        p_category: category.trim() || null,
        p_unit: unit.trim() || null,
        p_qty_on_hand: Number(qtyOnHand),
        p_min_qty: minQty !== "" ? Number(minQty) : null,
      });

      setLocalMessage(
        `Article enregistré : ${result.stock_key ?? result.item_name}`
      );
      setName("");
      setCategory("");
      setUnit("");
      setQtyOnHand("");
      setMinQty("");
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  const handleRebuildShopping = async () => {
    setLocalMessage(null);

    try {
      const result = await rebuildShopping(householdId);
      setLocalMessage(
        result.rebuilt
          ? `Liste de courses reconstruite : ${result.items_count} élément(s)`
          : "Reconstruction terminée."
      );
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-alabaster px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="mt-1 h-10 w-10 border border-white/10 flex items-center justify-center hover:border-gold/40 transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-gold">
              DOMYLI
            </div>
            <h1 className="mt-2 text-4xl font-semibold">Inventory</h1>
            <p className="mt-3 max-w-2xl text-alabaster/70 leading-8">
              Le stock réel alimente ensuite les courses et les repas. Cette
              étape ouvre le premier vrai chaînage métier P1.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="glass metallic-border rounded-[2rem] p-6">
            <div className="inline-flex items-center gap-3 text-gold">
              <Boxes size={18} />
              <span className="text-xs uppercase tracking-[0.3em]">
                Stock réel
              </span>
            </div>

            <h2 className="mt-5 text-2xl font-semibold text-alabaster">
              Ajouter un article à l’inventaire
            </h2>

            <p className="mt-4 text-sm leading-8 text-alabaster/65">
              Cette page branche l’expérience DOMYLI au stock réel via{" "}
              <code>app.rpc_inventory_item_upsert</code> puis à la reconstruction
              shopping via <code>app.rpc_shopping_list_rebuild</code>.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 grid gap-5 md:grid-cols-2"
            >
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                  Nom de l’article
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Riz basmati"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                  Catégorie
                </label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Épicerie"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                  Unité
                </label>
                <input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="kg, pièce, litre..."
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                  Quantité disponible
                </label>
                <input
                  value={qtyOnHand}
                  onChange={(e) => setQtyOnHand(e.target.value)}
                  required
                  placeholder="2"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                  Seuil minimum
                </label>
                <input
                  value={minQty}
                  onChange={(e) => setMinQty(e.target.value)}
                  placeholder="1"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={!canSubmit || saving}
                  className="inline-flex flex-1 items-center justify-center gap-3 border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.24em] text-obsidian disabled:opacity-50 gold-glow"
                >
                  <Package size={16} />
                  {saving ? "Enregistrement..." : "Enregistrer l’article"}
                </button>

                <button
                  type="button"
                  onClick={handleRebuildShopping}
                  disabled={rebuilding}
                  className="inline-flex flex-1 items-center justify-center gap-3 border border-gold/40 px-5 py-4 text-sm uppercase tracking-[0.24em] text-gold hover:bg-gold hover:text-obsidian transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={16} className={rebuilding ? "animate-spin" : ""} />
                  {rebuilding ? "Reconstruction..." : "Rebuild shopping"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(ROUTES.DASHBOARD)}
                  className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
                >
                  Dashboard
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>

            {(localMessage || error) && (
              <div className="mt-6 border border-gold/20 bg-gold/5 px-4 py-4 text-sm text-gold">
                {localMessage ?? error?.message}
              </div>
            )}
          </section>

          <aside className="glass metallic-border rounded-[2rem] p-7">
            <div className="inline-flex items-center gap-3 text-gold">
              <ShoppingCart size={18} />
              <span className="text-xs uppercase tracking-[0.3em]">
                Contexte actif
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                  Email
                </div>
                <div className="mt-2 text-sm text-alabaster">
                  {sessionEmail ?? "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                  Foyer
                </div>
                <div className="mt-2 text-sm text-alabaster">
                  {activeMembership?.household_name ?? "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                  Rôle
                </div>
                <div className="mt-2 text-sm text-alabaster">
                  {activeMembership?.role ?? "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                  Super Admin
                </div>
                <div className="mt-2 text-sm text-alabaster">
                  {bootstrap?.is_super_admin ? "Oui" : "Non"}
                </div>
              </div>
            </div>

            {(lastSavedItem || lastRebuild) && (
              <div className="mt-8 space-y-4">
                {lastSavedItem && (
                  <div className="rounded-2xl border border-gold/15 bg-gold/5 px-4 py-4 text-sm text-gold">
                    Dernier article :{" "}
                    {lastSavedItem.stock_key ?? lastSavedItem.item_name}
                  </div>
                )}

                {lastRebuild && (
                  <div className="rounded-2xl border border-gold/15 bg-gold/5 px-4 py-4 text-sm text-gold">
                    Dernière reconstruction : {lastRebuild.items_count} élément(s)
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm leading-8 text-alabaster/65">
              Le stock réel gouverne ensuite les courses et les repas.
              <div className="mt-3 text-gold/90">
                RPC branchée : <code>app.rpc_inventory_item_upsert</code>
              </div>
              <div className="mt-2 text-gold/90">
                RPC branchée : <code>app.rpc_shopping_list_rebuild</code>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}