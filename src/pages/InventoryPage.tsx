import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Boxes,
  Package,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/contexts/AuthContext";
import { useInventory } from "@/src/hooks/useInventory";
import { ROUTES } from "@/src/constants/routes";

export default function InventoryPage() {
  const navigate = useNavigate();
  const { bootstrap, isAuthenticated, hasHousehold, authLoading, bootstrapLoading } =
    useAuth();

  const { saveItem, rebuildShopping, saving, rebuilding, error, lastSavedItem, lastRebuild } =
    useInventory();

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
      <div className="min-h-screen bg-obsidian text-white px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/70">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold text-white">
            Chargement de l’inventaire...
          </h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold || !householdId) {
    return (
      <div className="min-h-screen bg-obsidian text-white px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/70">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold text-white">
            Foyer requis
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/70">
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

  const handleSave = async () => {
    setLocalMessage(null);

    try {
      const result = await saveItem({
        p_name: name.trim(),
        p_category: category.trim() || null,
        p_unit: unit.trim() || null,
        p_qty_on_hand: Number(qtyOnHand),
        p_min_qty: minQty === "" ? null : Number(minQty),
      });

      setLocalMessage(`Article enregistré : ${result.item_name}`);
      setName("");
      setCategory("");
      setUnit("");
      setQtyOnHand("");
      setMinQty("");
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  const handleRebuild = async () => {
    setLocalMessage(null);

    try {
      const result = await rebuildShopping();
      setLocalMessage(`Shopping reconstruit : ${result.items_count} élément(s).`);
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-white px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
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
              <div className="text-xs uppercase tracking-[0.35em] text-gold/70">
                DOMYLI
              </div>
              <h1 className="mt-2 text-4xl font-semibold text-white">
                Inventory
              </h1>
              <p className="mt-3 text-sm leading-7 text-white/65">
                Création d’items de stock et déclenchement du rebuild shopping.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRebuild}
            disabled={rebuilding}
            className="inline-flex items-center gap-3 border border-gold/40 px-5 py-3 text-xs uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={rebuilding ? "animate-spin" : ""} />
            {rebuilding ? "Rebuild..." : "Rebuild shopping"}
          </button>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-6 flex items-center gap-3 text-gold">
              <Boxes size={18} />
              <span className="text-xs uppercase tracking-[0.3em]">
                Article de stock
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                  Nom
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Riz"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                  Catégorie
                </label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Alimentaire"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                  Unité
                </label>
                <input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="kg"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                  Quantité en stock
                </label>
                <input
                  value={qtyOnHand}
                  onChange={(e) => setQtyOnHand(e.target.value)}
                  placeholder="3"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                  Seuil mini
                </label>
                <input
                  value={minQty}
                  onChange={(e) => setMinQty(e.target.value)}
                  placeholder="1"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={!canSubmit || saving}
              className="mt-6 inline-flex w-full items-center justify-center gap-3 border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.25em] text-obsidian disabled:opacity-50"
            >
              <Package size={16} />
              {saving ? "Enregistrement..." : "Enregistrer l’article"}
            </button>

            {(localMessage || error) && (
              <div className="mt-6 border border-gold/20 bg-gold/5 px-4 py-4 text-sm text-gold/90">
                {localMessage ?? error?.message}
              </div>
            )}
          </section>

          <aside className="border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-6 flex items-center gap-3 text-gold">
              <ShoppingCart size={18} />
              <span className="text-xs uppercase tracking-[0.3em]">
                Dernières actions
              </span>
            </div>

            {lastSavedItem ? (
              <div className="border border-white/10 p-4 text-sm leading-7 text-white/70">
                <div>
                  <span className="text-gold">Article :</span>{" "}
                  {lastSavedItem.item_name}
                </div>
                <div>
                  <span className="text-gold">Quantité :</span>{" "}
                  {lastSavedItem.qty_on_hand}
                </div>
                <div>
                  <span className="text-gold">Seuil :</span>{" "}
                  {lastSavedItem.min_qty}
                </div>
              </div>
            ) : (
              <div className="text-sm text-white/65">
                Aucun article sauvegardé pour le moment.
              </div>
            )}

            {lastRebuild && (
              <div className="mt-6 border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-300">
                Rebuild shopping effectué : {lastRebuild.items_count} élément(s).
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}