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
import { useDomyliConnection } from "../hooks/useDomyliConnection";
import { useInventory } from "../hooks/useInventory";
import { navigateTo } from "../lib/navigation";

export default function InventoryPage() {
  const {
    sessionEmail,
    activeMembership,
    bootstrap,
    isAuthenticated,
    hasHousehold,
    authLoading,
  } = useDomyliConnection();

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/80">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-serif italic">Chargement de l’inventaire...</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold || !householdId) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
        <div className="max-w-xl w-full border border-white/10 bg-white/5 p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/80">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-serif italic">Foyer requis</h1>
          <p className="mt-4 text-alabaster/70">
            Il faut une session authentifiée et un foyer actif pour accéder à l’inventaire.
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

  const handleSubmit = async (e: React.FormEvent) => {
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

      setLocalMessage(`Article enregistré : ${result.stock_key || name.trim()}`);
      setName("");
      setCategory("");
      setUnit("");
      setQtyOnHand("");
      setMinQty("");
    } catch {
      //
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
      //
    }
  };

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
              <h1 className="text-2xl font-serif italic">Inventaire</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRebuildShopping}
              disabled={rebuilding}
              className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={14} />
              {rebuilding ? "Reconstruction..." : "Rebuild shopping"}
            </button>

            <button
              onClick={() => navigateTo("/dashboard")}
              className="border border-gold/40 px-5 py-3 text-xs uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <section className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 border border-white/10 bg-white/5 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Stock réel</p>
            <h2 className="mt-4 text-4xl font-serif italic">Ajouter un article à l’inventaire</h2>
            <p className="mt-6 text-alabaster/70 leading-relaxed">
              Cette page branche maintenant l’expérience DOMYLI au stock réel via
              <span className="text-gold"> rpc_inventory_item_upsert</span> et à la reconstruction
              shopping via <span className="text-gold">rpc_shopping_list_rebuild</span>.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Nom de l’article
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Riz basmati"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Catégorie
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Épicerie"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Unité
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="kg, pièce, litre..."
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Quantité disponible
                </label>
                <input
                  type="number"
                  value={qtyOnHand}
                  onChange={(e) => setQtyOnHand(e.target.value)}
                  required
                  placeholder="2"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Seuil minimum
                </label>
                <input
                  type="number"
                  value={minQty}
                  onChange={(e) => setMinQty(e.target.value)}
                  placeholder="1"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div className="md:col-span-2 flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={!canSubmit || saving}
                  className="flex items-center justify-center gap-3 bg-gold px-6 py-4 text-sm font-medium uppercase tracking-[0.25em] text-obsidian transition hover:opacity-90 disabled:opacity-50"
                >
                  <Package size={18} />
                  {saving ? "Enregistrement..." : "Enregistrer l’article"}
                </button>

                <button
                  type="button"
                  onClick={handleRebuildShopping}
                  disabled={rebuilding}
                  className="flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-50"
                >
                  <ShoppingCart size={18} />
                  {rebuilding ? "Reconstruction..." : "Reconstruire le shopping"}
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo("/dashboard")}
                  className="flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
                >
                  <ArrowRight size={18} />
                  Aller au dashboard
                </button>
              </div>
            </form>

            {(localMessage || error || lastSavedItem || lastRebuild) && (
              <div className="mt-8 border border-white/10 bg-black/20 p-4 text-sm text-alabaster/75">
                {localMessage ??
                  error?.message ??
                  (lastSavedItem
                    ? `Article enregistré : ${lastSavedItem.stock_key || lastSavedItem.item_id}`
                    : null) ??
                  (lastRebuild
                    ? `Liste de courses reconstruite : ${lastRebuild.items_count} élément(s)`
                    : null)}
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
                <div className="mt-1 text-alabaster">
                  {activeMembership?.household_name ?? "—"}
                </div>
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
                  <span>Le stock réel gouverne ensuite les courses et les repas.</span>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <Boxes size={18} className="text-gold" />
                  <span className="text-sm">RPC branchée : app.rpc_inventory_item_upsert</span>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-gold" />
                  <span className="text-sm">RPC branchée : app.rpc_shopping_list_rebuild</span>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}