import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  ClipboardList,
  Package,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { useInventory } from "@/src/hooks/useInventory";
import { ROUTES } from "@/src/constants/routes";
import {
  getInventoryCategoryLabel,
  getInventoryCategoryOptions,
  getInventoryItemByCode,
  getInventoryItemsByCategory,
  getInventoryUnitLabel,
  getInventoryUnitOptionsForItem,
} from "@/src/constants/inventoryCatalog";

type DomyliFlowBadgeProps = {
  flow: "MEALS" | "SHOPPING" | "ALERTS" | "HOUSEHOLD";
};

function DomyliFlowBadge({ flow }: DomyliFlowBadgeProps) {
  const labels: Record<DomyliFlowBadgeProps["flow"], string> = {
    MEALS: "Repas",
    SHOPPING: "Courses",
    ALERTS: "Alertes",
    HOUSEHOLD: "Exécution foyer",
  };

  return (
    <span className="inline-flex items-center border border-gold/30 bg-gold/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gold">
      {labels[flow]}
    </span>
  );
}

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

  const [categoryCode, setCategoryCode] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [unitCode, setUnitCode] = useState("");
  const [qtyOnHand, setQtyOnHand] = useState("");
  const [minQty, setMinQty] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const categoryOptions = useMemo(() => getInventoryCategoryOptions(), []);
  const itemOptions = useMemo(
    () => getInventoryItemsByCategory(categoryCode),
    [categoryCode]
  );
  const selectedItem = useMemo(
    () => getInventoryItemByCode(itemCode),
    [itemCode]
  );
  const unitOptions = useMemo(
    () => getInventoryUnitOptionsForItem(itemCode),
    [itemCode]
  );

  const categoryLabel = getInventoryCategoryLabel(categoryCode);
  const unitLabel = getInventoryUnitLabel(unitCode);

  const canSubmit = useMemo(() => {
    return Boolean(
      householdId &&
        categoryCode &&
        itemCode &&
        unitCode &&
        qtyOnHand !== ""
    );
  }, [householdId, categoryCode, itemCode, unitCode, qtyOnHand]);

  if (authLoading || bootstrapLoading) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl border border-gold/20 bg-black/40 p-8">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/80">
            DOMYLI
          </div>
          <h1 className="mt-4 text-3xl font-semibold">
            Chargement de l’inventaire...
          </h1>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !hasHousehold || !householdId) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl border border-gold/20 bg-black/40 p-8">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/80">
            DOMYLI
          </div>
          <h1 className="mt-4 text-3xl font-semibold">Foyer requis</h1>
          <p className="mt-4 text-white/70">
            Il faut une session authentifiée et un foyer actif pour accéder à
            l’inventaire.
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

  const resetArticleFields = () => {
    setItemCode("");
    setUnitCode("");
    setQtyOnHand("");
    setMinQty("");
  };

  const handleCategoryChange = (nextCategoryCode: string) => {
    setCategoryCode(nextCategoryCode);
    setLocalMessage(null);
    resetArticleFields();
  };

  const handleItemChange = (nextItemCode: string) => {
    setItemCode(nextItemCode);
    setLocalMessage(null);

    const item = getInventoryItemByCode(nextItemCode);
    setUnitCode(item?.defaultUnit ?? "");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalMessage(null);

    if (!selectedItem || !categoryLabel) return;

    try {
      const result = await saveItem({
        p_household_id: householdId,
        p_name: selectedItem.label,
        p_item_code: selectedItem.code,
        p_category: categoryLabel,
        p_category_code: categoryCode,
        p_unit: unitCode,
        p_qty_on_hand: Number(qtyOnHand),
        p_min_qty: minQty !== "" ? Number(minQty) : null,
      });

      setLocalMessage(
        `Article canonique enregistré : ${result.item_name} (${result.qty_on_hand} ${result.unit ?? ""})`
      );

      setItemCode("");
      setUnitCode("");
      setQtyOnHand("");
      setMinQty("");
    } catch {
      // erreur gérée par le hook
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
      // erreur gérée par le hook
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="mt-1 inline-flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
              aria-label="Retour"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="mt-6 text-xs uppercase tracking-[0.35em] text-gold/80">
              DOMYLI
            </div>
            <h1 className="mt-3 text-4xl font-semibold">Inventory</h1>
            <p className="mt-3 max-w-3xl text-white/65">
              Ici, l’inventaire n’est pas un simple formulaire. C’est un stock
              gouverné, déterministe et exploitable, aligné avec les courses,
              les repas et les seuils du foyer.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
            <div className="mb-6 flex items-center gap-3 text-gold/85">
              <Boxes className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.35em]">
                Stock gouverné
              </span>
            </div>

            <h2 className="text-3xl font-semibold">
              Ajouter un article canonique
            </h2>

            <p className="mt-6 max-w-3xl text-lg leading-9 text-white/65">
              Sélectionne une famille métier, puis un article canonique DOMYLI,
              puis une unité autorisée. Cette normalisation prépare des flux
              fiables vers les courses, les repas et les alertes de seuil.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Catégorie
                </label>
                <select
                  value={categoryCode}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  required
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  <option value="">Sélectionner une famille métier</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Nom de l’article
                </label>
                <select
                  value={itemCode}
                  onChange={(e) => handleItemChange(e.target.value)}
                  disabled={!categoryCode}
                  required
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {categoryCode
                      ? "Sélectionner un article canonique"
                      : "Choisir d’abord une catégorie"}
                  </option>
                  {itemOptions.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Unité
                </label>
                <select
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value)}
                  disabled={!itemCode}
                  required
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {itemCode
                      ? "Sélectionner une unité autorisée"
                      : "Choisir d’abord un article"}
                  </option>
                  {unitOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Quantité disponible
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={qtyOnHand}
                  onChange={(e) => setQtyOnHand(e.target.value)}
                  required
                  placeholder="2"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Seuil minimum
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={minQty}
                  onChange={(e) => setMinQty(e.target.value)}
                  placeholder="1"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div className="md:col-span-2 flex flex-wrap gap-4 pt-2">
                <button
                  type="submit"
                  disabled={!canSubmit || saving}
                  className="inline-flex items-center justify-center gap-3 bg-gold px-6 py-4 text-sm uppercase tracking-[0.24em] text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Package className="h-4 w-4" />
                  {saving ? "Enregistrement..." : "Enregistrer l’article"}
                </button>

                <button
                  type="button"
                  onClick={handleRebuildShopping}
                  disabled={rebuilding}
                  className="inline-flex items-center justify-center gap-3 border border-gold/30 px-6 py-4 text-sm uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  {rebuilding ? "Reconstruction..." : "Rebuild shopping"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(ROUTES.DASHBOARD)}
                  className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
                >
                  Dashboard
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            {(localMessage || error) && (
              <div className="mt-8 border border-gold/20 bg-gold/10 px-5 py-4 text-lg text-gold">
                {localMessage ?? error?.message}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <ShoppingCart className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Contexte actif
                </span>
              </div>

              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Email
                  </div>
                  <div className="mt-3 text-2xl">{sessionEmail ?? "—"}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Foyer
                  </div>
                  <div className="mt-3 text-2xl">
                    {activeMembership?.household_name ?? "—"}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Rôle
                  </div>
                  <div className="mt-3 text-2xl">{activeMembership?.role ?? "—"}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Super Admin
                  </div>
                  <div className="mt-3 text-2xl">
                    {bootstrap?.is_super_admin ? "Oui" : "Non"}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <ClipboardList className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Lecture métier DOMYLI
                </span>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5 text-white/75">
                <div className="space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                      Famille métier
                    </div>
                    <div className="mt-2 text-xl">{categoryLabel ?? "—"}</div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                      Article canonique
                    </div>
                    <div className="mt-2 text-xl">{selectedItem?.label ?? "—"}</div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                      Unité autorisée
                    </div>
                    <div className="mt-2 text-xl">{unitLabel ?? "—"}</div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                      Domaine
                    </div>
                    <div className="mt-2 text-xl">{selectedItem?.domain ?? "—"}</div>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                    Flux impactés
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedItem?.domyliFlows?.length ? (
                      selectedItem.domyliFlows.map((flow) => (
                        <DomyliFlowBadge key={flow} flow={flow} />
                      ))
                    ) : (
                      <span className="text-white/45">Aucun flux sélectionné</span>
                    )}
                  </div>
                </div>
              </div>

              {(lastSavedItem || lastRebuild) && (
                <div className="mt-6 space-y-4">
                  {lastSavedItem && (
                    <div className="rounded-[1.25rem] border border-white/10 bg-black/20 px-5 py-4">
                      <div className="flex items-center gap-3 text-gold/85">
                        <Package className="h-4 w-4" />
                        <span>
                          Dernier article :{" "}
                          {lastSavedItem.stock_key ?? lastSavedItem.item_name}
                        </span>
                      </div>
                    </div>
                  )}

                  {lastRebuild && (
                    <div className="rounded-[1.25rem] border border-white/10 bg-black/20 px-5 py-4">
                      <div className="flex items-center gap-3 text-gold/85">
                        <RefreshCw className="h-4 w-4" />
                        <span>
                          Dernière reconstruction : {lastRebuild.items_count} élément(s)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex items-center gap-3 text-white/45">
                <ShieldCheck className="h-4 w-4 text-gold/80" />
                <span className="text-sm">
                  Stock gouverné DOMYLI : article canonique, unité autorisée,
                  seuil exploitable.
                </span>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}