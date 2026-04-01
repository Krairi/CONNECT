import { useMemo } from "react";
import {
  Archive,
  BookImage,
  CheckCircle2,
  ClipboardList,
  Eye,
  Layers3,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useAdminCatalog } from "@/src/hooks/useAdminCatalog";
import type {
  AdminRecipeCatalogItem,
  AdminTaskCatalogItem,
  PublicationStatus,
} from "@/src/services/admin/adminCatalogService";

type Tone = "neutral" | "success" | "warning" | "danger";

function toneClasses(tone: Tone): string {
  switch (tone) {
    case "success":
      return "border-emerald-400/30 bg-emerald-400/12 text-emerald-100";
    case "warning":
      return "border-amber-400/30 bg-amber-400/12 text-amber-100";
    case "danger":
      return "border-rose-400/30 bg-rose-400/12 text-rose-100";
    default:
      return "border-white/15 bg-white/8 text-white/80";
  }
}

function statusTone(status: string): Tone {
  switch (status) {
    case "PUBLISHED":
      return "success";
    case "DEPRECATED":
      return "warning";
    case "ARCHIVED":
      return "danger";
    default:
      return "neutral";
  }
}

function Badge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${toneClasses(tone)}`}>
      {label}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon: typeof Sparkles;
  tone?: Tone;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
        </div>
        <div className={`rounded-2xl border p-3 ${toneClasses(tone)}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function PublicationActions({
  currentStatus,
  onSelect,
  disabled,
}: {
  currentStatus: string;
  onSelect: (status: Exclude<PublicationStatus, "ALL">) => void;
  disabled: boolean;
}) {
  const targets: Exclude<PublicationStatus, "ALL">[] = ["DRAFT", "VALIDATED", "PUBLISHED", "DEPRECATED", "ARCHIVED"];
  return (
    <div className="flex flex-wrap gap-2">
      {targets.map((status) => (
        <button
          key={status}
          type="button"
          disabled={disabled || currentStatus === status}
          onClick={() => onSelect(status)}
          className={`rounded-full border px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] transition ${
            currentStatus === status
              ? "border-gold/50 bg-gold/15 text-gold"
              : "border-white/10 bg-white/5 text-white/75 hover:border-white/20 hover:bg-white/10"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {status}
        </button>
      ))}
    </div>
  );
}

function RecipeCard({
  item,
  selected,
  onSelect,
}: {
  item: AdminRecipeCatalogItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[28px] border p-5 text-left transition ${
        selected
          ? "border-gold/45 bg-gold/10 shadow-[0_24px_60px_rgba(212,175,55,0.08)]"
          : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-lg font-semibold text-white">{item.title}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.16em] text-white/45">{item.recipe_code}</div>
        </div>
        <Badge label={item.publication_status} tone={statusTone(item.publication_status)} />
      </div>
      <p className="mt-4 line-clamp-2 text-sm leading-6 text-white/70">{item.short_description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge label={`${item.prep_minutes + item.cook_minutes} min`} />
        <Badge label={`${item.default_servings} pers.`} />
        <Badge label={item.detail_readiness} tone={item.detail_readiness === "RICH" ? "success" : "neutral"} />
      </div>
    </button>
  );
}

function TaskCard({
  item,
  selected,
  onSelect,
}: {
  item: AdminTaskCatalogItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[28px] border p-5 text-left transition ${
        selected
          ? "border-gold/45 bg-gold/10 shadow-[0_24px_60px_rgba(212,175,55,0.08)]"
          : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-lg font-semibold text-white">{item.title}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.16em] text-white/45">{item.zone_label} · {item.family_label}</div>
        </div>
        <Badge label={item.publication_status} tone={statusTone(item.publication_status)} />
      </div>
      <p className="mt-4 line-clamp-2 text-sm leading-6 text-white/70">{item.short_description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge label={`${item.estimated_duration_minutes} min`} />
        <Badge label={item.frequency_label} />
        <Badge label={item.effort_label} />
      </div>
    </button>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-black/20 p-5">
      <div className="mb-4 text-[11px] uppercase tracking-[0.24em] text-gold/80">{title}</div>
      {children}
    </section>
  );
}

export default function AdminCatalogPage() {
  const {
    loading,
    mutating,
    error,
    tab,
    search,
    publicationStatus,
    summary,
    recipeItems,
    taskItems,
    selectedRecipe,
    selectedTask,
    setTab,
    setSearch,
    setPublicationStatus,
    setSelectedRecipeId,
    setSelectedTaskTemplateCode,
    refresh,
    setRecipePublication,
    setTaskPublication,
  } = useAdminCatalog();

  const activeCount = tab === "recipes" ? recipeItems.length : taskItems.length;
  const statusOptions: PublicationStatus[] = ["ALL", "DRAFT", "VALIDATED", "PUBLISHED", "DEPRECATED", "ARCHIVED"];

  const recipeStats = summary?.recipes ?? { total: 0, published: 0, draft: 0, validated: 0, archived: 0 };
  const taskStats = summary?.tasks ?? { total: 0, published: 0, draft: 0, validated: 0, archived: 0 };

  const selectedHeroBadges = useMemo(() => {
    if (tab === "recipes") return selectedRecipe?.hero_badges ?? [];
    return selectedTask?.hero_badges ?? [];
  }, [tab, selectedRecipe, selectedTask]);

  return (
    <main className="min-h-screen bg-[#070b11] text-white">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8 px-6 py-10 lg:px-10">
        <header className="overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.16),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-[11px] uppercase tracking-[0.28em] text-gold/80">Cockpit Super Admin · Catalogues gouvernés</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight text-white xl:text-[3.2rem]">
                Gouverne les bibliothèques recettes et tâches sans casser la cohérence produit DOMYLI.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">
                Ce cockpit n’édite pas librement le métier. Il pilote la publication, la validation et l’archivage des actifs stratégiques du produit, avec une lecture détaillée gouvernée et des statuts explicites.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/30 bg-gold/15 px-5 py-3 text-sm font-medium text-gold transition hover:border-gold/50 hover:bg-gold/20"
            >
              <RefreshCcw className="h-4 w-4" />
              Recharger le cockpit
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Recettes catalogue" value={String(recipeStats.total)} icon={BookImage} />
          <SummaryCard label="Recettes publiées" value={String(recipeStats.published)} icon={CheckCircle2} tone="success" />
          <SummaryCard label="Tâches catalogue" value={String(taskStats.total)} icon={ClipboardList} />
          <SummaryCard label="Tâches publiées" value={String(taskStats.published)} icon={ShieldCheck} tone="success" />
        </section>

        {error ? (
          <section className="rounded-[28px] border border-rose-400/25 bg-rose-400/10 p-5 text-sm text-rose-100">
            {error.message || "Une erreur cockpit admin est survenue."}
          </section>
        ) : null}

        <section className="grid gap-8 xl:grid-cols-[0.92fr,1.08fr]">
          <div className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTab("recipes")}
                  className={`rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] transition ${
                    tab === "recipes"
                      ? "border-gold/40 bg-gold/15 text-gold"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  Bibliothèque recettes
                </button>
                <button
                  type="button"
                  onClick={() => setTab("tasks")}
                  className={`rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] transition ${
                    tab === "tasks"
                      ? "border-gold/40 bg-gold/15 text-gold"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  Bibliothèque tâches
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-[1fr,220px]">
                <label className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/35">
                    <Search className="h-3.5 w-3.5" />
                    Recherche gouvernée
                  </div>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={tab === "recipes" ? "Titre ou code recette" : "Titre ou code tâche"}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-gold/40"
                  />
                </label>

                <label className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">Statut publication</div>
                  <select
                    value={publicationStatus}
                    onChange={(event) => setPublicationStatus(event.target.value as PublicationStatus)}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-gold/40"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status} className="bg-[#0b1220] text-white">
                        {status === "ALL" ? "Tous les statuts" : status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-white/45">
                <span>{activeCount} élément(s)</span>
                <span>{loading ? "Chargement…" : "Lecture gouvernée prête"}</span>
              </div>
            </section>

            <section className="space-y-4">
              {tab === "recipes"
                ? recipeItems.map((item) => (
                    <RecipeCard
                      key={item.recipe_id}
                      item={item}
                      selected={selectedRecipe?.recipe_id === item.recipe_id}
                      onSelect={() => setSelectedRecipeId(item.recipe_id)}
                    />
                  ))
                : taskItems.map((item) => (
                    <TaskCard
                      key={item.task_template_code}
                      item={item}
                      selected={selectedTask?.task_template_code === item.task_template_code}
                      onSelect={() => setSelectedTaskTemplateCode(item.task_template_code)}
                    />
                  ))}

              {!loading && activeCount === 0 ? (
                <div className="rounded-[28px] border border-dashed border-white/15 bg-white/[0.03] p-8 text-center text-sm text-white/55">
                  Aucun élément catalogue ne correspond aux filtres courants.
                </div>
              ) : null}
            </section>
          </div>

          <div className="space-y-6">
            <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.28)]">
              <div className="aspect-[16/9] w-full bg-black/25">
                {(tab === "recipes" ? selectedRecipe?.image_url : selectedTask?.image_url) ? (
                  <img
                    src={(tab === "recipes" ? selectedRecipe?.image_url : selectedTask?.image_url) ?? undefined}
                    alt={(tab === "recipes" ? selectedRecipe?.image_alt : selectedTask?.image_alt) ?? "Visuel catalogue DOMYLI"}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>

              <div className="space-y-6 p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge label={tab === "recipes" ? "Catalogue recette" : "Catalogue tâche"} />
                  {tab === "recipes" && selectedRecipe ? (
                    <Badge label={selectedRecipe.publication_status} tone={statusTone(selectedRecipe.publication_status)} />
                  ) : null}
                  {tab === "tasks" && selectedTask ? (
                    <Badge label={selectedTask.publication_status} tone={statusTone(selectedTask.publication_status)} />
                  ) : null}
                  {selectedHeroBadges.slice(0, 3).map((badge) => (
                    <Badge key={`${badge.code}-${badge.label}`} label={badge.label} />
                  ))}
                </div>

                <div>
                  <h2 className="text-3xl font-semibold text-white">
                    {tab === "recipes" ? selectedRecipe?.title ?? "Sélectionne une recette" : selectedTask?.title ?? "Sélectionne une tâche"}
                  </h2>
                  <p className="mt-4 text-base leading-7 text-white/70">
                    {tab === "recipes"
                      ? selectedRecipe?.description ?? "Lecture détaillée gouvernée de la recette catalogue."
                      : selectedTask?.short_description ?? "Lecture détaillée gouvernée de la tâche catalogue."}
                  </p>
                </div>

                {tab === "recipes" && selectedRecipe ? (
                  <>
                    <PublicationActions
                      currentStatus={selectedRecipe.publication_status}
                      onSelect={(status) => void setRecipePublication(selectedRecipe.recipe_id, status)}
                      disabled={mutating}
                    />

                    <DetailSection title="Métadonnées recette">
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <div className="text-xs uppercase tracking-[0.16em] text-white/35">Code</div>
                          <div className="mt-2 text-sm text-white/85">{selectedRecipe.recipe_code}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.16em] text-white/35">Difficulté</div>
                          <div className="mt-2 text-sm text-white/85">{selectedRecipe.difficulty}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.16em] text-white/35">Durée totale</div>
                          <div className="mt-2 text-sm text-white/85">{selectedRecipe.prep_minutes + selectedRecipe.cook_minutes} min</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.16em] text-white/35">Portions base</div>
                          <div className="mt-2 text-sm text-white/85">{selectedRecipe.default_servings}</div>
                        </div>
                      </div>
                    </DetailSection>

                    <DetailSection title="Types repas et tags gouvernés">
                      <div className="flex flex-wrap gap-2">
                        {selectedRecipe.meal_types.map((item) => (
                          <Badge key={item} label={item} />
                        ))}
                        {selectedRecipe.tags.map((tag) => (
                          <Badge key={`${tag.code}-${tag.label}`} label={tag.label || tag.code} />
                        ))}
                      </div>
                    </DetailSection>

                    <DetailSection title="Étapes normalisées">
                      <div className="space-y-3">
                        {selectedRecipe.instruction_steps.map((step) => (
                          <div key={step.step_code} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">{step.step_code}</div>
                            <div className="mt-2 text-sm leading-6 text-white/80">{step.label}</div>
                          </div>
                        ))}
                        {selectedRecipe.instruction_steps.length === 0 ? (
                          <div className="text-sm text-white/55">Aucune étape structurée disponible dans cette lecture.</div>
                        ) : null}
                      </div>
                    </DetailSection>
                  </>
                ) : null}

                {tab === "tasks" && selectedTask ? (
                  <>
                    <PublicationActions
                      currentStatus={selectedTask.publication_status}
                      onSelect={(status) => void setTaskPublication(selectedTask.task_template_code, status)}
                      disabled={mutating}
                    />

                    <DetailSection title="Métadonnées tâche">
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <div className="text-xs uppercase tracking-[0.16em] text-white/35">Zone</div>
                          <div className="mt-2 text-sm text-white/85">{selectedTask.zone_label}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.16em] text-white/35">Famille</div>
                          <div className="mt-2 text-sm text-white/85">{selectedTask.family_label}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.16em] text-white/35">Fréquence</div>
                          <div className="mt-2 text-sm text-white/85">{selectedTask.frequency_label}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.16em] text-white/35">Durée</div>
                          <div className="mt-2 text-sm text-white/85">{selectedTask.estimated_duration_minutes} min</div>
                        </div>
                      </div>
                    </DetailSection>

                    <DetailSection title="Checklist normalisée">
                      <div className="space-y-3">
                        {selectedTask.checklist_items.map((step) => (
                          <div key={step.check_code} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">{step.check_code}</div>
                            <div className="mt-2 text-sm leading-6 text-white/80">{step.label}</div>
                          </div>
                        ))}
                      </div>
                    </DetailSection>

                    <DetailSection title="Outils requis et preuve">
                      <div className="grid gap-4 lg:grid-cols-[1fr,260px]">
                        <div className="flex flex-wrap gap-2">
                          {selectedTask.required_tools.map((tool) => (
                            <Badge key={`${tool.tool_code}-${tool.tool_label}`} label={tool.tool_label || tool.tool_code} />
                          ))}
                          {selectedTask.required_tools.length === 0 ? (
                            <div className="text-sm text-white/55">Aucun outil requis remonté par le catalogue.</div>
                          ) : null}
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <div className="text-xs uppercase tracking-[0.16em] text-white/35">Preuve attendue</div>
                          <div className="mt-2 text-sm text-white/80">{selectedTask.proof_type_label}</div>
                        </div>
                      </div>
                    </DetailSection>
                  </>
                ) : null}

                {!selectedRecipe && tab === "recipes" ? (
                  <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm text-white/55">
                    Sélectionne une recette pour lire sa gouvernance détaillée.
                  </div>
                ) : null}
                {!selectedTask && tab === "tasks" ? (
                  <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm text-white/55">
                    Sélectionne une tâche pour lire sa gouvernance détaillée.
                  </div>
                ) : null}

                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-white/40">
                  <Eye className="h-4 w-4" />
                  Lecture cockpit premium gouvernée
                  <Layers3 className="ml-3 h-4 w-4" />
                  Aucun champ libre
                  <Archive className="ml-3 h-4 w-4" />
                  Publication contrôlée
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
