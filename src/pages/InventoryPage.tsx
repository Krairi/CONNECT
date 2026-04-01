import { useMemo, type ComponentType } from "react";
import { AlertTriangle, Boxes, Image as ImageIcon, PackageCheck, ShieldAlert, Warehouse } from "lucide-react";
import { useInventory } from "@/src/hooks/useInventory";
import type { InventoryCatalogItem, InventoryItem } from "@/src/services/inventory/inventoryService";

function formatMetricValue(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "0";
  return Number(value).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

function getStockTone(status: string): "default" | "warning" | "danger" | "success" {
  switch (status) {
    case "OUT":
      return "danger";
    case "LOW":
      return "warning";
    case "HEALTHY":
      return "success";
    default:
      return "default";
  }
}

function getStockLabel(status: string): string {
  switch (status) {
    case "OUT":
      return "Rupture";
    case "LOW":
      return "Sous seuil";
    case "HEALTHY":
      return "Sain";
    default:
      return status || "Inconnu";
  }
}

function ToneBadge({ label, tone = "default" }: { label: string; tone?: "default" | "warning" | "danger" | "success" }) {
  const toneClass = {
    default: "border-white/10 bg-white/5 text-white/75",
    warning: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    danger: "border-rose-400/30 bg-rose-400/10 text-rose-200",
    success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  }[tone];

  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${toneClass}`}>{label}</span>;
}

function SummaryCard({ icon: Icon, label, value, tone = "default" }: { icon: ComponentType<{ className?: string }>; label: string; value: string; tone?: "default" | "warning" | "danger" | "success" }) {
  const toneClass = {
    default: "border-white/10 bg-white/5 text-white/80",
    warning: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    danger: "border-rose-400/30 bg-rose-400/10 text-rose-200",
    success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  }[tone];

  return (
    <div className={`rounded-[28px] border p-5 ${toneClass}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] opacity-70">{label}</div>
          <div className="mt-3 text-2xl font-semibold">{value}</div>
        </div>
        <Icon className="h-8 w-8 opacity-80" />
      </div>
    </div>
  );
}

function CatalogCard({ item, isSelected, onSelect }: { item: InventoryCatalogItem; isSelected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`overflow-hidden rounded-[28px] border text-left transition ${
        isSelected ? "border-gold/50 bg-gold/10" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
      }`}
    >
      <div className="aspect-[16/9] w-full border-b border-white/10 bg-white/5">
        {item.image_url ? (
          <img src={item.image_url} alt={item.image_alt ?? item.item_label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/35">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          <ToneBadge label={item.category_label} />
          <ToneBadge label={item.unit_code} />
        </div>
        <h3 className="mt-4 text-base font-semibold text-white">{item.item_label}</h3>
        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gold/75">{item.item_code}</p>
      </div>
    </button>
  );
}

function StockCard({ item, isSelected, onSelect }: { item: InventoryItem; isSelected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-[26px] border p-5 text-left transition ${
        isSelected ? "border-gold/50 bg-gold/10" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white">{item.item_label}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-gold/75">{item.item_code}</div>
        </div>
        <ToneBadge label={getStockLabel(item.stock_status)} tone={getStockTone(item.stock_status)} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Stock</div>
          <div className="mt-2 text-sm text-white">{formatMetricValue(item.qty_on_hand)} {item.unit_code}</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Seuil</div>
          <div className="mt-2 text-sm text-white">{formatMetricValue(item.min_qty)} {item.unit_code}</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Couverture</div>
          <div className="mt-2 text-sm text-white">{item.coverage_ratio == null ? "—" : `${formatMetricValue(item.coverage_ratio)}×`}</div>
        </div>
      </div>
    </button>
  );
}

export default function InventoryPage() {
  const {
    loading,
    saving,
    error,
    catalog,
    items,
    selectedItemCode,
    qtyDraft,
    minQtyDraft,
    selectedCatalogItem,
    selectedInventoryItem,
    summary,
    lastSaved,
    selectItemCode,
    setQtyDraft,
    setMinQtyDraft,
    save,
    refresh,
  } = useInventory();

  const selectedStatus = selectedInventoryItem?.stock_status ?? "HEALTHY";
  const selectedCoverage = selectedInventoryItem?.coverage_ratio ?? null;

  const recommendedActions = useMemo(() => {
    if (!selectedInventoryItem) return ["Sélectionne un article canonique pour le gouverner dans le stock du foyer."];
    if (selectedInventoryItem.stock_status === "OUT") {
      return [
        "Article en rupture : relier le besoin aux prochaines courses.",
        "Vérifier son usage dans les recettes déjà planifiées.",
      ];
    }
    if (selectedInventoryItem.stock_status === "LOW") {
      return [
        "Article sous seuil : surveiller le prochain rebuild shopping.",
        "Confirmer que le seuil minimal reflète bien le besoin réel du foyer.",
      ];
    }
    return [
      "Article couvert : conserver un seuil cohérent avec la consommation du foyer.",
      "Utilisable comme base fiable pour Meals et Shopping.",
    ];
  }, [selectedInventoryItem]);

  return (
    <main className="min-h-screen bg-[#070b11] text-white">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8 px-6 py-10 lg:px-10">
        <header className="overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.16),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-[11px] uppercase tracking-[0.28em] text-gold/80">Inventory · Stock gouverné DOMYLI</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight text-white xl:text-[3.2rem]">
                Gouverne le stock du foyer à partir d’un catalogue canonique, sans aucun champ libre.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">
                Inventory devient la base fiable de Meals et Shopping : article canonique, unité gouvernée, seuil minimal contrôlé,
                lecture premium des tensions stock et des articles réellement exploitables.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/10"
            >
              Recharger le stock
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard icon={Boxes} label="Articles suivis" value={String(summary.total)} />
          <SummaryCard icon={ShieldAlert} label="Sous seuil" value={String(summary.low)} tone="warning" />
          <SummaryCard icon={AlertTriangle} label="Ruptures" value={String(summary.out)} tone="danger" />
          <SummaryCard icon={PackageCheck} label="Couverts" value={String(summary.healthy)} tone="success" />
        </section>

        {error ? (
          <section className="rounded-[28px] border border-rose-400/25 bg-rose-400/10 p-5 text-sm text-rose-100">
            {error.message || "Une erreur Inventory est survenue."}
          </section>
        ) : null}

        <section className="grid gap-8 xl:grid-cols-[1.15fr,0.85fr]">
          <div className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-gold/80">Catalogue canonique</div>
                  <h2 className="mt-2 text-xl font-semibold text-white">Sélectionne l’article à gouverner</h2>
                </div>
                <ToneBadge label="Zéro champ libre" />
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {catalog.map((item) => (
                  <CatalogCard key={item.item_code} item={item} isSelected={item.item_code === selectedItemCode} onSelect={() => selectItemCode(item.item_code)} />
                ))}
              </div>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-gold/80">Stock foyer</div>
                  <h2 className="mt-2 text-xl font-semibold text-white">Lecture gouvernée du stock réel</h2>
                </div>
                {loading ? <ToneBadge label="Chargement" /> : <ToneBadge label={`${items.length} article(s)`} />}
              </div>
              <div className="mt-6 grid gap-4">
                {items.length ? (
                  items.map((item) => (
                    <StockCard key={item.inventory_item_id || item.item_code} item={item} isSelected={item.item_code === selectedItemCode} onSelect={() => selectItemCode(item.item_code)} />
                  ))
                ) : (
                  <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-white/50">
                    Aucun article stocké pour le foyer actif. Sélectionne un article canonique puis enregistre un premier niveau de stock.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5">
              <div className="aspect-[16/10] w-full border-b border-white/10 bg-white/5">
                {selectedCatalogItem?.image_url ? (
                  <img src={selectedCatalogItem.image_url} alt={selectedCatalogItem.image_alt ?? selectedCatalogItem.item_label} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/35">
                    <Warehouse className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  <ToneBadge label={selectedCatalogItem?.category_label ?? "Catalogue"} />
                  <ToneBadge label={selectedCatalogItem?.unit_code ?? "UNIT"} />
                  <ToneBadge label={getStockLabel(selectedStatus)} tone={getStockTone(selectedStatus)} />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-white">{selectedCatalogItem?.item_label ?? "Article inventaire"}</h2>
                <p className="mt-2 text-sm text-white/65">{selectedCatalogItem?.item_code ?? "Sélectionne un article canonique"}</p>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Quantité en stock</div>
                    <div className="mt-2 text-sm text-white">{formatMetricValue(selectedInventoryItem?.qty_on_hand ?? qtyDraft)} {selectedCatalogItem?.unit_code ?? "UNIT"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Couverture</div>
                    <div className="mt-2 text-sm text-white">{selectedCoverage == null ? "—" : `${formatMetricValue(selectedCoverage)}×`}</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <div className="text-[11px] uppercase tracking-[0.24em] text-gold/80">Gouvernance stock</div>
              <h2 className="mt-2 text-xl font-semibold text-white">Définir le niveau et le seuil</h2>
              <p className="mt-3 text-sm text-white/65">
                Tu ne saisis pas d’article libre : tu gouvernes un article canonique avec un niveau de stock et un seuil minimal contrôlés.
              </p>

              <div className="mt-6 grid gap-4">
                <label className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Quantité en stock</div>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={qtyDraft}
                    onChange={(event) => setQtyDraft(Number(event.target.value))}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-gold/50"
                  />
                </label>

                <label className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Seuil minimal</div>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={minQtyDraft}
                    onChange={(event) => setMinQtyDraft(Number(event.target.value))}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-gold/50"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => void save()}
                disabled={!selectedItemCode || saving}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-gold/30 bg-gold/15 px-5 py-3 text-sm font-medium text-gold transition hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Enregistrement en cours…" : "Enregistrer le stock gouverné"}
              </button>

              {lastSaved ? (
                <div className="mt-5 rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                  Stock mis à jour pour <strong>{lastSaved.item_label}</strong> · {formatMetricValue(lastSaved.qty_on_hand)} {lastSaved.unit_code} · seuil {formatMetricValue(lastSaved.min_qty)} {lastSaved.unit_code}
                </div>
              ) : null}
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <div className="text-[11px] uppercase tracking-[0.24em] text-gold/80">Signaux utiles</div>
              <div className="mt-5 space-y-3">
                {recommendedActions.map((line) => (
                  <div key={line} className="rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-white/75">
                    {line}
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
