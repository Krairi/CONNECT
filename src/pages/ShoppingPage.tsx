import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowPath,
  CircleAlert,
  ClipboardList,
  ShoppingBasket,
  Sparkles,
  Store,
} from "lucide-react";
import { useShopping } from "@/src/hooks/useShopping";
import type { ShoppingItem } from "@/src/services/shopping/shoppingService";

type Tone = "neutral" | "warning" | "danger" | "success";

function getPriorityTone(priority: string): Tone {
  switch (priority) {
    case "CRITICAL":
      return "danger";
    case "HIGH":
      return "warning";
    case "MEDIUM":
      return "neutral";
    default:
      return "success";
  }
}

function getPriorityLabel(priority: string): string {
  switch (priority) {
    case "CRITICAL":
      return "Critique";
    case "HIGH":
      return "Élevée";
    case "MEDIUM":
      return "Moyenne";
    default:
      return "Normale";
  }
}

function getOriginLabel(origin: string): string {
  switch (origin) {
    case "INVENTORY_THRESHOLD":
      return "Seuil stock";
    case "MEAL_CONFIRMATION":
      return "Repas confirmé";
    case "REOPEN_COMPENSATION":
      return "Compensation";
    default:
      return "Projection système";
  }
}

function getToneClasses(tone: Tone): string {
  switch (tone) {
    case "danger":
      return "border-rose-400/35 bg-rose-400/12 text-rose-100";
    case "warning":
      return "border-amber-400/35 bg-amber-400/12 text-amber-100";
    case "success":
      return "border-emerald-400/30 bg-emerald-400/12 text-emerald-100";
    default:
      return "border-white/15 bg-white/8 text-white/80";
  }
}

function ToneBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${getToneClasses(tone)}`}>{label}</span>;
}

function SummaryCard({ icon: Icon, label, value, tone = "neutral" }: { icon: typeof ShoppingBasket; label: string; value: string; tone?: Tone }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
        </div>
        <div className={`rounded-2xl border p-3 ${getToneClasses(tone)}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ShoppingCard({ item, isSelected, onSelect }: { item: ShoppingItem; isSelected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[28px] border p-5 text-left transition ${
        isSelected ? "border-gold/50 bg-gold/10 shadow-[0_24px_60px_rgba(212,175,55,0.08)]" : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-lg font-semibold text-white">{item.item_label}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.16em] text-white/45">{item.item_code}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToneBadge label={getOriginLabel(item.origin_type)} />
          <ToneBadge label={getPriorityLabel(item.priority_code)} tone={getPriorityTone(item.priority_code)} />
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MetricBlock label="À acheter" value={`${formatNumber(item.requested_qty)} ${item.unit_code}`} />
        <MetricBlock label="Disponible" value={item.available_qty == null ? "—" : `${formatNumber(item.available_qty)} ${item.unit_code}`} />
        <MetricBlock label="Cible" value={item.target_qty == null ? "—" : `${formatNumber(item.target_qty)} ${item.unit_code}`} />
      </div>
    </button>
  );
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">{label}</div>
      <div className="mt-2 text-sm text-white">{value}</div>
    </div>
  );
}

function formatNumber(value: number | null): string {
  if (value == null) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export default function ShoppingPage() {
  const {
    loading,
    rebuilding,
    error,
    filteredItems,
    selectedItem,
    selectedOrigin,
    selectedPriority,
    originOptions,
    priorityOptions,
    summary,
    lastRebuild,
    setSelectedItemKey,
    setSelectedOrigin,
    setSelectedPriority,
    refresh,
    rebuild,
  } = useShopping();

  const recommendedActions = useMemo(() => {
    if (!selectedItem) {
      return ["Les besoins shopping sont dérivés du système : seuils stock, repas confirmés et projections métier."];
    }

    if (selectedItem.origin_type === "INVENTORY_THRESHOLD") {
      return [
        "Vérifier si le seuil minimal reflète bien la consommation réelle du foyer.",
        "Utiliser cet article comme signal prioritaire pour le prochain panier d'achat.",
      ];
    }

    if (selectedItem.origin_type === "MEAL_CONFIRMATION") {
      return [
        "Ce besoin provient d'une exécution repas ou d'un rebuild lié à Meals.",
        "Contrôler la cohérence avec la planification déjà confirmée.",
      ];
    }

    return [
      "Projection système consolidée : vérifier la priorité métier et l'origine associée.",
      "Utiliser ce besoin comme signal gouverné, pas comme saisie libre de courses.",
    ];
  }, [selectedItem]);

  return (
    <main className="min-h-screen bg-[#070b11] text-white">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8 px-6 py-10 lg:px-10">
        <header className="overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.16),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-[11px] uppercase tracking-[0.28em] text-gold/80">Shopping · Projection gouvernée DOMYLI</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight text-white xl:text-[3.2rem]">
                Visualise les besoins d'achat issus du système, avec origine, priorité et quantité gouvernées.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">
                Shopping n'est pas une checklist libre. C'est la projection structurée de ce qui manque réellement au foyer : seuil stock,
                exécutions repas et autres signaux métier consolidés.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void refresh()}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/10"
              >
                Recharger
              </button>
              <button
                type="button"
                onClick={() => void rebuild()}
                className="inline-flex items-center justify-center rounded-full border border-gold/30 bg-gold/15 px-5 py-3 text-sm font-medium text-gold transition hover:border-gold/50 hover:bg-gold/20"
              >
                {rebuilding ? "Rebuild..." : "Recalculer la projection"}
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard icon={ClipboardList} label="Besoins totaux" value={String(summary.total)} />
          <SummaryCard icon={CircleAlert} label="Ouverts" value={String(summary.open)} tone="warning" />
          <SummaryCard icon={AlertTriangle} label="Critiques" value={String(summary.critical)} tone="danger" />
          <SummaryCard icon={Store} label="Seuil stock" value={String(summary.inventoryOrigin)} tone="neutral" />
        </section>

        {error ? <section className="rounded-[28px] border border-rose-400/25 bg-rose-400/10 p-5 text-sm text-rose-100">{error.message || "Une erreur Shopping est survenue."}</section> : null}

        <section className="grid gap-8 xl:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-gold/80">Filtres gouvernés</div>
                  <h2 className="mt-2 text-xl font-semibold text-white">Origine et niveau de priorité</h2>
                </div>
                {lastRebuild ? <ToneBadge label={`Rebuild ${new Date(lastRebuild.rebuilt_at ?? "").toLocaleDateString("fr-FR") || "récent"}`} /> : <ToneBadge label="Projection active" />}              
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Origine</div>
                  <select
                    value={selectedOrigin}
                    onChange={(event) => setSelectedOrigin(event.target.value)}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-gold/40"
                  >
                    {originOptions.map((option) => (
                      <option key={option} value={option} className="bg-[#0b1220] text-white">
                        {option === "ALL" ? "Toutes les origines" : getOriginLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Priorité</div>
                  <select
                    value={selectedPriority}
                    onChange={(event) => setSelectedPriority(event.target.value)}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-gold/40"
                  >
                    {priorityOptions.map((option) => (
                      <option key={option} value={option} className="bg-[#0b1220] text-white">
                        {option === "ALL" ? "Toutes les priorités" : getPriorityLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-gold/80">Projection shopping</div>
                  <h2 className="mt-2 text-xl font-semibold text-white">Besoins dérivés du système</h2>
                </div>
                {loading ? <ToneBadge label="Chargement" /> : <ToneBadge label={`${filteredItems.length} besoin(s)`} />}
              </div>
              <div className="mt-6 grid gap-4">
                {filteredItems.length ? (
                  filteredItems.map((item) => (
                    <ShoppingCard key={item.item_key} item={item} isSelected={selectedItem?.item_key === item.item_key} onSelect={() => setSelectedItemKey(item.item_key)} />
                  ))
                ) : (
                  <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-white/50">
                    Aucun besoin shopping ne correspond aux filtres actuels. La projection est vide ou déjà couverte.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5">
              <div className="aspect-[16/10] w-full border-b border-white/10 bg-white/5">
                {selectedItem?.image_url ? (
                  <img src={selectedItem.image_url} alt={selectedItem.image_alt ?? selectedItem.item_label} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/35">
                    <ShoppingBasket className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  <ToneBadge label={selectedItem?.category_label ?? "Shopping"} />
                  <ToneBadge label={selectedItem ? getOriginLabel(selectedItem.origin_type) : "Projection système"} />
                  <ToneBadge label={selectedItem ? getPriorityLabel(selectedItem.priority_code) : "Normale"} tone={selectedItem ? getPriorityTone(selectedItem.priority_code) : "neutral"} />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-white">{selectedItem?.item_label ?? "Besoin shopping"}</h2>
                <p className="mt-2 text-sm text-white/65">{selectedItem?.item_code ?? "Sélectionne un besoin pour lire son détail"}</p>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <MetricBlock label="À acheter" value={selectedItem ? `${formatNumber(selectedItem.requested_qty)} ${selectedItem.unit_code}` : "—"} />
                  <MetricBlock label="Disponible" value={selectedItem?.available_qty == null ? "—" : `${formatNumber(selectedItem.available_qty)} ${selectedItem.unit_code}`} />
                  <MetricBlock label="Cible" value={selectedItem?.target_qty == null ? "—" : `${formatNumber(selectedItem.target_qty)} ${selectedItem.unit_code}`} />
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-gold/25 bg-gold/12 p-3 text-gold">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-gold/80">Lecture intelligente</div>
                  <h2 className="mt-1 text-xl font-semibold text-white">Pourquoi ce besoin existe</h2>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {recommendedActions.map((action) => (
                  <div key={action} className="rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/75">
                    {action}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <div className="text-[11px] uppercase tracking-[0.24em] text-gold/80">Règle DOMYLI</div>
              <h2 className="mt-2 text-xl font-semibold text-white">Shopping sans saisie libre</h2>
              <p className="mt-3 text-sm leading-7 text-white/70">
                Tu n'ajoutes pas une course libre. Tu lis une projection gouvernée issue du stock, des repas et des signaux métier. L'origine,
                la priorité et la quantité sont pilotées par le système.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <ToneBadge label="Zéro champ libre" />
                <ToneBadge label="Origine visible" />
                <ToneBadge label="Priorité gouvernée" />
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
