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

type SelectOptionLike = {
  code?: string;
  value?: string;
  label?: string;
};

type InventoryItemLike = {
  code?: string;
  value?: string;
  label?: string;
  defaultUnit?: string;
  domain?: string;
  domyliFlows?: Array<"MEALS" | "SHOPPING" | "ALERTS" | "HOUSEHOLD">;
};

function getOptionKey(option: SelectOptionLike, fallback: string) {
  return option.code ?? option.value ?? fallback;
}

function getOptionValue(option: SelectOptionLike, fallback = "") {
  return option.code ?? option.value ?? fallback;
}

function DomyliFlowBadge({ flow }: DomyliFlowBadgeProps) {
  const labels: Record<DomyliFlowBadgeProps["flow"], string> = {
    MEALS: "Repas",
    SHOPPING: "Courses",
    ALERTS: "Alertes",
    HOUSEHOLD: "Exécution foyer",
  };

  return (
    <span className="inline-flex items-center rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gold">
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

  const categoryOptions = useMemo(
    () => (getInventoryCategoryOptions() ?? []) as SelectOptionLike[],
    [],
  );

  const itemOptions = useMemo(
    () => (getInventoryItemsByCategory(categoryCode) ?? []) as InventoryItemLike[],
    [categoryCode],
  );

  const selectedItem = useMemo(
    () => (getInventoryItemByCode(itemCode) ?? null) as InventoryItemLike | null,
    [itemCode],
  );

  const unitOptions = useMemo(
    () => (getInventoryUnitOptionsForItem(itemCode) ?? []) as SelectOptionLike[],
    [itemCode],
  );

  const categoryLabel = getInventoryCategoryLabel(categoryCode);
  const unitLabel = getInventoryUnitLabel(unitCode);

  const canSubmit = useMemo(() => {
    return Boolean(
      householdId &&
        categoryCode &&
        itemCode &&
        unitCode &&
        qtyOnHand !== "",
    );
  }, [householdId, categoryCode, itemCode, unitCode, qtyOnHand]);

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            DOMYLI
          </p>
          <h1 className="mt-4 text-3xl font-semibold">
            Chargement de l’inventaire...
          </h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold || !householdId) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            DOMYLI
          </p>
          <h1 className="mt-4 text-3xl font-semibold">Foyer requis</h1>
          <p className="mt-3 text-white/70">
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
      </div>
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

    const item = getInventoryItemByCode(nextItemCode) as InventoryItemLike | null;
    setUnitCode(item?.defaultUnit ?? "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalMessage(null);

    if (!selectedItem || !categoryLabel) {
      setLocalMessage(
        "La catégorie ou l’article canonique sélectionné n’est pas reconnu par le catalogue DOMYLI.",
      );
      return;
    }

    try {
      const selectedItemCode = selectedItem.code ?? selectedItem.value ?? "";

      if (!selectedItemCode) {
        setLocalMessage("Le code de l’article canonique est introuvable.");
        return;
      }

      const result = await saveItem({
        p_household_id: householdId,
        p_name: selectedItem.label ?? "Article DOMYLI",
        p_item_code: selectedItemCode,
        p_category: categoryLabel,
        p_category_code: categoryCode,
        p_unit: unitCode,
        p_qty_on_hand: Number(qtyOnHand),
        p_min_qty: minQty !== "" ? Number(minQty) : null,
      });

      setLocalMessage(
        `Article canonique enregistré : ${result.item_name} (${result.qty_on_hand} ${result.unit ?? ""})`,
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
      const result = await rebuildShopping();

      setLocalMessage(
        result.rebuilt
          ? `Liste de courses reconstruite : ${result.items_count} élément(s)`
          : "Reconstruction terminée.",
      );
    } catch {
      // erreur gérée par le hook
    }
  };

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
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
                <h1 className="mt-4 text-3xl font-semibold">Inventory</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                  Ici, l’inventaire n’est pas un simple formulaire. C’est un
                  stock gouverné, déterministe et exploitable, aligné avec les
                  courses, les repas et les seuils du foyer.
                </p>
              </div>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-gold">
              <Boxes className="h-4 w-4" />
              Stock gouverné
            </div>

            <h2 className="mt-6 text-2xl font-semibold">
              Ajouter un article canonique
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
              Sélectionne une famille métier, puis un article canonique DOMYLI,
              puis une unité autorisée. Cette normalisation prépare des flux
              fiables vers les courses, les repas et les alertes de seuil.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Catégorie</span>
                  <select
                    value={categoryCode}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    required
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  >
                    <option value="">Sélectionner une famille métier</option>
                    {categoryOptions.map((option, index) => {
                      const optionValue = getOptionValue(option);
                      return (
                        <option
                          key={`inventory-category-${getOptionKey(option, String(index))}-${index}`}
                          value={optionValue}
                        >
                          {option.label ?? optionValue}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Nom de l’article</span>
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
                    {itemOptions.map((item, index) => {
                      const optionValue = getOptionValue(item);
                      return (
                        <option
                          key={`inventory-item-${getOptionKey(item, String(index))}-${index}`}
                          value={optionValue}
                        >
                          {item.label ?? optionValue}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Unité</span>
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
                    {unitOptions.map((option, index) => {
                      const optionValue = getOptionValue(option);
                      return (
                        <option
                          key={`inventory-unit-${getOptionKey(option, String(index))}-${index}`}
                          value={optionValue}
                        >
                          {option.label ?? optionValue}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Quantité disponible</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={qtyOnHand}
                    onChange={(e) => setQtyOnHand(e.target.value)}
                    required
                    placeholder="2"
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </label>

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Seuil minimum</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={minQty}
                    onChange={(e) => setMinQty(e.target.value)}
                    placeholder="1"
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <button
                  type="submit"
                  disabled={!canSubmit || saving}
                  className="inline-flex flex-1 items-center justify-center gap-3 border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.24em] text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Package className="h-4 w-4" />
                  {saving ? "Enregistrement..." : "Enregistrer l’article"}
                </button>

                <button
                  type="button"
                  onClick={handleRebuildShopping}
                  disabled={rebuilding}
                  className="inline-flex flex-1 items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${rebuilding ? "animate-spin" : ""}`}
                  />
                  {rebuilding ? "Reconstruction..." : "Rebuild shopping"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(ROUTES.DASHBOARD)}
                  className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
                >
                  Dashboard
                </button>
              </div>

              {(localMessage || error) && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/85">
                  {localMessage ?? error?.message}
                </div>
              )}
            </form>
          </section>

          <aside className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/70">
              <ShieldCheck className="h-4 w-4" />
              Lecture métier DOMYLI
            </div>

            <div className="mt-8 space-y-5">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Contexte actif
                </p>
                <div className="mt-4 space-y-3 text-sm text-white/85">
                  <p>Email : {sessionEmail ?? "—"}</p>
                  <p>Foyer : {activeMembership?.household_name ?? "—"}</p>
                  <p>Rôle : {activeMembership?.role ?? "—"}</p>
                  <p>Super Admin : {bootstrap?.is_super_admin ? "Oui" : "Non"}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Famille métier
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {categoryLabel ?? "—"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Article canonique
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {selectedItem?.label ?? "—"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Unité autorisée
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {unitLabel ?? "—"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Domaine
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {selectedItem?.domain ?? "—"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Flux impactés
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedItem?.domyliFlows?.length ? (
                    selectedItem.domyliFlows.map((flow, index) => (
                      <DomyliFlowBadge
                        key={`inventory-flow-${selectedItem.code ?? selectedItem.value ?? "item"}-${flow}-${index}`}
                        flow={flow}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-white/55">Aucun flux sélectionné</p>
                  )}
                </div>
              </div>

              {(lastSavedItem || lastRebuild) && (
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-white/85">
                  {lastSavedItem ? (
                    <p>
                      Dernier article :{" "}
                      {lastSavedItem.stock_key ?? lastSavedItem.item_name}
                    </p>
                  ) : null}

                  {lastRebuild ? (
                    <p className={lastSavedItem ? "mt-3" : ""}>
                      Dernière reconstruction : {lastRebuild.items_count} élément(s)
                    </p>
                  ) : null}
                </div>
              )}

              <div className="rounded-3xl border border-gold/20 bg-gold/10 p-5">
                <div className="inline-flex items-center gap-2 text-gold">
                  <ClipboardList className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.24em]">
                    Lecture système
                  </p>
                </div>

                <p className="mt-3 text-sm leading-7 text-gold/90">
                  Stock gouverné DOMYLI : article canonique, unité autorisée,
                  seuil exploitable, rebuild shopping canonique.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="inline-flex items-center gap-2 text-white">
                  <ShoppingCart className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.24em]">
                    Étape suivante
                  </p>
                </div>

                <p className="mt-3 text-sm leading-7 text-white/70">
                  Une fois le stock gouverné, DOMYLI peut brancher proprement la
                  lecture et la reconstruction des courses.
                </p>

                <button
                  type="button"
                  onClick={() => navigate(ROUTES.SHOPPING)}
                  className="mt-8 inline-flex w-full items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
                >
                  Continuer vers Shopping
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}