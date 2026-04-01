import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  ChefHat,
  CheckCircle2,
  Clock3,
  ImageIcon,
  PackageSearch,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Soup,
  Target,
  Undo2,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useMeals } from "@/src/hooks/useMeals";
import { ROUTES } from "@/src/constants/routes";
import {
  RECIPE_MEAL_TYPE_OPTIONS,
  getRecipeDifficultyLabel,
  getRecipeFitStatusLabel,
  getRecipeMealTypeLabel,
  getRecipeStockIntensityLabel,
  type RecipeMealType,
} from "@/src/constants/recipeCatalog";
import type {
  MealConfirmConsumptionLine,
  MealFeedItem,
  MealRecipeDetail,
  MealSlotDetail,
  RecipeCandidate,
} from "@/src/services/meals/mealService";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function formatMetricValue(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return Number.isInteger(value) ? `${value}` : value.toFixed(2);
}

function formatCodeLabel(value: string): string {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function ToneBadge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const className =
    tone === "danger"
      ? "border border-red-400/20 bg-red-500/10 text-red-100"
      : tone === "warning"
        ? "border border-amber-400/20 bg-amber-500/10 text-amber-100"
        : tone === "success"
          ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
          : "border border-gold/20 bg-gold/10 text-gold";

  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${className}`}>{label}</span>;
}

function getFitTone(value: string): "default" | "warning" | "danger" | "success" {
  if (value === "OK") return "success";
  if (value === "WARNING") return "warning";
  if (value === "BLOCKED") return "danger";
  return "default";
}

function getConsumptionTone(value: string | null | undefined): "default" | "warning" | "danger" | "success" {
  if (value === "CONSUMED") return "success";
  if (value === "PARTIAL_STOCK") return "warning";
  if (value && value.includes("NO_")) return "danger";
  return "default";
}

function ProfileCard({
  isActive,
  label,
  summary,
  meta,
  onClick,
}: {
  isActive: boolean;
  label: string;
  summary: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-[28px] border p-5 text-left transition ${
        isActive
          ? "border-gold/50 bg-gold/10 shadow-[0_0_0_1px_rgba(255,215,0,0.12)]"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Profil repas</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{label}</h3>
        </div>
        {isActive ? <ToneBadge label="Actif" tone="success" /> : null}
      </div>
      <p className="mt-3 text-sm text-white/70">{summary}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-gold/80">{meta}</p>
    </button>
  );
}

function RecipeCard({
  recipe,
  isSelected,
  onSelect,
}: {
  recipe: RecipeCandidate;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`overflow-hidden rounded-[30px] border text-left transition ${
        isSelected
          ? "border-gold/50 bg-gold/10 shadow-[0_0_0_1px_rgba(255,215,0,0.12)]"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
      }`}
    >
      <div className="aspect-[16/9] w-full border-b border-white/10 bg-white/5">
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.image_alt} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/35">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <ToneBadge label={getRecipeFitStatusLabel(recipe.fit.fit_status)} tone={getFitTone(recipe.fit.fit_status)} />
          <ToneBadge label={getRecipeDifficultyLabel(recipe.difficulty)} />
          <ToneBadge label={getRecipeStockIntensityLabel(recipe.stock_intensity)} />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white">{recipe.title}</h3>
        <p className="mt-2 text-sm text-white/65">{recipe.short_description}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-gold/75">
          <span>{recipe.personalized_serving_label}</span>
          <span>•</span>
          <span>{recipe.prep_minutes + recipe.cook_minutes} min</span>
        </div>
      </div>
    </button>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
      <div className="mb-4 text-[11px] uppercase tracking-[0.24em] text-gold/80">{title}</div>
      {children}
    </section>
  );
}

function RecipeDetailPanel({ detail }: { detail: MealRecipeDetail | null }) {
  if (!detail) {
    return (
      <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-white/50">
        Sélectionne une recette publiée pour lire sa fiche détaillée intelligente.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5">
        <div className="aspect-[16/8] w-full border-b border-white/10 bg-white/5">
          {detail.image_url ? (
            <img src={detail.image_url} alt={detail.image_alt} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/35">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <ToneBadge label={getRecipeFitStatusLabel(detail.fit.fit_status)} tone={getFitTone(detail.fit.fit_status)} />
            <ToneBadge label={getRecipeDifficultyLabel(detail.difficulty)} />
            <ToneBadge label={getRecipeStockIntensityLabel(detail.stock_intensity)} />
            {detail.hero_badges.map((badge) => (
              <ToneBadge key={`${badge.code}-${badge.label}`} label={badge.label || badge.code} />
            ))}
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-white">{detail.title}</h2>
          <p className="mt-3 max-w-3xl text-sm text-white/70">{detail.description || detail.short_description}</p>
          <div className="mt-5 flex flex-wrap gap-6 text-sm text-white/70">
            <div className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-gold" /> {detail.prep_minutes + detail.cook_minutes} min</div>
            <div className="inline-flex items-center gap-2"><ChefHat className="h-4 w-4 text-gold" /> {detail.default_servings} portion(s) base</div>
            <div className="inline-flex items-center gap-2"><Target className="h-4 w-4 text-gold" /> facteur {formatMetricValue(detail.portion_factor)}</div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <DetailSection title="Étapes normalisées">
          {detail.instruction_steps.length ? (
            <ol className="space-y-4">
              {detail.instruction_steps.map((step) => (
                <li key={`${step.step_code}-${step.sort_order}`} className="flex gap-4 border-b border-white/5 pb-4 last:border-none last:pb-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-xs text-gold">
                    {step.sort_order}
                  </div>
                  <div>
                    <div className="text-sm text-white">{step.label}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/35">{formatCodeLabel(step.source)}</div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="text-sm text-white/55">Aucune étape structurée disponible.</div>
          )}
        </DetailSection>

        <DetailSection title="Ingrédients personnalisés">
          <div className="space-y-3">
            {detail.ingredients.length ? (
              detail.ingredients.map((ingredient) => (
                <div key={`${ingredient.ingredient_code}-${ingredient.sort_order}`} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-white">{ingredient.ingredient_label}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-gold/70">{formatCodeLabel(ingredient.nutrition_role)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white">{formatMetricValue(ingredient.qty_adjusted)} {ingredient.unit_code}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/35">base {formatMetricValue(ingredient.qty_base)}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-white/55">Aucune projection ingrédients disponible.</div>
            )}
          </div>
        </DetailSection>
      </div>
    </div>
  );
}

function MealFeedCard({ item, isSelected, onClick }: { item: MealFeedItem; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[26px] border p-5 text-left transition ${
        isSelected ? "border-gold/50 bg-gold/10" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <ToneBadge label={item.status ?? "PLANNED"} tone={item.status === "CONFIRMED" ? "success" : "default"} />
        <ToneBadge label={getRecipeMealTypeLabel(item.meal_type)} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-white">{item.recipe_title || item.title || "Repas DOMYLI"}</h3>
      <p className="mt-2 text-sm text-white/65">{item.profile_label || "Profil non renseigné"}</p>
      <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-gold/75">{item.planned_for} · {item.recipe_code || "RECETTE"}</div>
    </button>
  );
}

function MealSlotSnapshot({ detail }: { detail: MealSlotDetail | null }) {
  if (!detail) {
    return <div className="text-sm text-white/55">Sélectionne un repas existant pour lire son snapshot figé.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <ToneBadge label={detail.status ?? "PLANNED"} tone={detail.status === "CONFIRMED" ? "success" : "default"} />
        <ToneBadge label={getRecipeMealTypeLabel(detail.meal_type)} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Profil</div>
          <div className="mt-2 text-sm text-white">{detail.profile_label || "—"}</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Date planifiée</div>
          <div className="mt-2 text-sm text-white">{detail.planned_for}</div>
        </div>
      </div>
      <div className="space-y-3">
        {detail.ingredients.map((ingredient) => (
          <div key={`${ingredient.ingredient_code}-${ingredient.sort_order}`} className="rounded-2xl border border-white/8 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm text-white">{ingredient.ingredient_label}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-gold/75">{formatCodeLabel(ingredient.nutrition_role)}</div>
              </div>
              <div className="text-sm text-white">{formatMetricValue(ingredient.qty_adjusted)} {ingredient.unit_code}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfirmationServerPanel({
  lines,
}: {
  lines: MealConfirmConsumptionLine[];
}) {
  if (!lines.length) return <div className="text-sm text-white/55">Aucune ligne d’exécution serveur disponible.</div>;
  return (
    <div className="space-y-3">
      {lines.map((line, index) => (
        <div key={`${line.ingredient_code}-${index}`} className="rounded-2xl border border-white/8 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-white">{line.ingredient_label}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-gold/75">{formatCodeLabel(line.nutrition_role ?? "OTHER")}</div>
            </div>
            <ToneBadge label={line.inventory_status ?? "UNKNOWN"} tone={getConsumptionTone(line.inventory_status)} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm text-white/65">
            <div>Prévu : {formatMetricValue(line.quantity_planned)} {line.unit_code ?? ""}</div>
            <div>Confirmé : {formatMetricValue(line.quantity_confirmed)} {line.unit_code ?? ""}</div>
            <div>Consommé : {formatMetricValue(line.consumed_qty)} {line.unit_code ?? ""}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MealsPage() {
  const navigate = useNavigate();
  const {
    loadingProfiles,
    candidatesLoading,
    recipeDetailLoading,
    mealFeedLoading,
    mealDetailLoading,
    mealExecutionLoading,
    saving,
    confirming,
    reopening,
    error,
    profiles,
    selectedProfileId,
    selectedMealType,
    selectedTagCode,
    plannedFor,
    recipeCandidates,
    selectedRecipeId,
    selectedRecipeDetail,
    mealFeed,
    selectedMealSlotId,
    selectedMealDetail,
    selectedMealExecution,
    lastMutation,
    lastConfirmResult,
    lastReopenResult,
    availableTagOptions,
    profileLabel,
    setSelectedProfileId,
    setSelectedMealType,
    setSelectedTagCode,
    setPlannedFor,
    setSelectedRecipeId,
    hydratePlanningFromMeal,
    createSelectedMeal,
    updateSelectedMeal,
    confirmSelectedMeal,
    reopenSelectedMeal,
    refreshMealFeed,
  } = useMeals();

  const canCreate = Boolean(selectedProfileId && selectedRecipeId && plannedFor && !selectedMealSlotId);
  const canUpdate = Boolean(selectedMealSlotId && selectedProfileId && selectedRecipeId && plannedFor && selectedMealDetail?.status !== "CONFIRMED");
  const canConfirm = Boolean(selectedMealSlotId && selectedMealDetail?.status !== "CONFIRMED");
  const canReopen = Boolean(selectedMealSlotId && selectedMealDetail?.status === "CONFIRMED");

  const selectedProfileMeta = useMemo(() => {
    return profiles.find((item) => item.profile_id === selectedProfileId) ?? null;
  }, [profiles, selectedProfileId]);

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.RECIPES)}
              className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Retour bibliothèque recettes
            </button>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10 text-gold">
                <Soup className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-gold/80">Build 4 · Meals runtime final</div>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Meals gouverné, sans champ libre</h1>
              </div>
            </div>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-white/65">
              Sélection profil actif → sélection recette publiée → lecture détaillée intelligente avec image → planification → confirmation serveur → réouverture compensatrice.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void refreshMealFeed()}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 transition hover:border-white/20 hover:bg-white/[0.07]"
            >
              <RefreshCw className="h-4 w-4" /> Recharger le planning
            </button>
            <button
              type="button"
              onClick={() => navigate(ROUTES.SHOPPING)}
              className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-sm text-gold transition hover:border-gold/35 hover:bg-gold/15"
            >
              <PackageSearch className="h-4 w-4" /> Voir Shopping
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-[26px] border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-100">
            {error.message || "Une erreur est survenue sur Meals."}
          </div>
        ) : null}

        <div className="mt-8 grid gap-8 xl:grid-cols-[0.92fr,1.08fr]">
          <section className="space-y-8">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <UserRound className="h-5 w-5 text-gold" />
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-gold/80">Étape 1</div>
                  <h2 className="text-lg font-semibold text-white">Choisir le profil humain actif</h2>
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {loadingProfiles ? (
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-white/55">Chargement des profils actifs…</div>
                ) : (
                  profiles.map((profile) => (
                    <ProfileCard
                      key={profile.profile_id}
                      isActive={profile.profile_id === selectedProfileId}
                      label={profile.display_name}
                      summary={profile.summary}
                      meta={[
                        profile.weight_kg ? `${profile.weight_kg} kg` : null,
                        profile.goal ? formatCodeLabel(profile.goal) : null,
                        profile.activity_level ? formatCodeLabel(profile.activity_level) : null,
                      ].filter(Boolean).join(" · ") || "Profil prêt pour Meals"}
                      onClick={() => setSelectedProfileId(profile.profile_id)}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <ChefHat className="h-5 w-5 text-gold" />
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-gold/80">Étape 2</div>
                  <h2 className="text-lg font-semibold text-white">Cadre de planification</h2>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {RECIPE_MEAL_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedMealType(option.value as RecipeMealType)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      selectedMealType === option.value
                        ? "border-gold/40 bg-gold/10 text-gold"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/[0.07]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Date planifiée</div>
                  <div className="mt-3 inline-flex items-center gap-2 text-sm text-white/80"><CalendarDays className="h-4 w-4 text-gold" /> {plannedFor}</div>
                  <input
                    type="date"
                    value={plannedFor}
                    onChange={(event) => setPlannedFor(event.target.value)}
                    className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-gold/40"
                  />
                </label>
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Projection active</div>
                  <div className="mt-3 text-sm text-white">{profileLabel || "Aucun profil"}</div>
                  <div className="mt-2 text-sm text-white/60">{selectedProfileMeta?.summary || "Sélectionne un profil prêt pour personnaliser le repas."}</div>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-gold" />
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-gold/80">Étape 3</div>
                  <h2 className="text-lg font-semibold text-white">Choisir une recette publiée</h2>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTagCode("")}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    !selectedTagCode
                      ? "border-gold/40 bg-gold/10 text-gold"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/[0.07]"
                  }`}
                >
                  Toutes
                </button>
                {availableTagOptions.map((tag) => (
                  <button
                    key={tag.code}
                    type="button"
                    onClick={() => setSelectedTagCode(tag.code)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      selectedTagCode === tag.code
                        ? "border-gold/40 bg-gold/10 text-gold"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/[0.07]"
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
              <div className="mt-6 grid gap-4">
                {candidatesLoading ? (
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-white/55">Chargement des recettes publiées…</div>
                ) : recipeCandidates.length ? (
                  recipeCandidates.map((recipe) => (
                    <RecipeCard
                      key={recipe.recipe_id}
                      recipe={recipe}
                      isSelected={recipe.recipe_id === selectedRecipeId}
                      onSelect={() => setSelectedRecipeId(recipe.recipe_id)}
                    />
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/55">
                    Aucune recette publiée ne correspond au profil et au type de repas choisis.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-8">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-gold/80">Lecture détaillée intelligente</div>
                  <h2 className="mt-1 text-xl font-semibold text-white">Recette cible</h2>
                </div>
                {recipeDetailLoading ? <ToneBadge label="Chargement détail" /> : null}
              </div>
              <div className="mt-6">
                <RecipeDetailPanel detail={selectedRecipeDetail} />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void createSelectedMeal()}
                  disabled={!canCreate || saving}
                  className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-5 py-3 text-sm font-medium text-gold transition hover:border-gold/45 hover:bg-gold/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" /> Planifier ce repas
                </button>
                <button
                  type="button"
                  onClick={() => void updateSelectedMeal()}
                  disabled={!canUpdate || saving}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" /> Mettre à jour le repas sélectionné
                </button>
              </div>
              {lastMutation ? (
                <div className="mt-5 rounded-[22px] border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                  Mutation repas enregistrée · meal_slot {lastMutation.meal_slot_id || "créé"} · statut {lastMutation.status || "PLANNED"}
                </div>
              ) : null}
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-gold" />
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-gold/80">Planning meals</div>
                  <h2 className="mt-1 text-xl font-semibold text-white">Feed repas du foyer</h2>
                </div>
              </div>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  {mealFeedLoading ? (
                    <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-white/55">Chargement du feed repas…</div>
                  ) : mealFeed.length ? (
                    mealFeed.map((item) => (
                      <MealFeedCard
                        key={item.meal_slot_id}
                        item={item}
                        isSelected={item.meal_slot_id === selectedMealSlotId}
                        onClick={() => hydratePlanningFromMeal(item.meal_slot_id)}
                      />
                    ))
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/55">
                      Aucun repas planifié pour la fenêtre active.
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <DetailSection title="Snapshot figé du repas">
                    {mealDetailLoading ? <div className="text-sm text-white/55">Lecture du snapshot serveur…</div> : <MealSlotSnapshot detail={selectedMealDetail} />}
                  </DetailSection>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void confirmSelectedMeal()}
                      disabled={!canConfirm || confirming}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-5 py-3 text-sm font-medium text-emerald-100 transition hover:border-emerald-400/40 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ShieldCheck className="h-4 w-4" /> Confirmer le repas
                    </button>
                    <button
                      type="button"
                      onClick={() => void reopenSelectedMeal()}
                      disabled={!canReopen || reopening}
                      className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-500/10 px-5 py-3 text-sm font-medium text-amber-100 transition hover:border-amber-400/40 hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Undo2 className="h-4 w-4" /> Rouvrir le repas
                    </button>
                  </div>

                  {lastConfirmResult ? (
                    <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 p-5 text-sm text-emerald-100">
                      Confirmation serveur enregistrée · {lastConfirmResult.shopping_rebuild_status || "shopping status inconnu"}
                    </div>
                  ) : null}

                  {lastReopenResult ? (
                    <div className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 p-5 text-sm text-amber-100">
                      Réouverture compensatrice enregistrée · {lastReopenResult.inventory_compensation_status || "compensation inconnue"}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-gold" />
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-gold/80">Lecture serveur</div>
                  <h2 className="mt-1 text-xl font-semibold text-white">Exécution détaillée / stock / shopping</h2>
                </div>
              </div>

              {mealExecutionLoading ? (
                <div className="mt-6 text-sm text-white/55">Lecture du reçu serveur…</div>
              ) : selectedMealExecution ? (
                <div className="mt-6 space-y-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Source</div>
                      <div className="mt-2 text-sm text-white">{selectedMealExecution.execution_source || "—"}</div>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Confirmé le</div>
                      <div className="mt-2 text-sm text-white">{formatDateTime(selectedMealExecution.confirmed_at)}</div>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Shopping</div>
                      <div className="mt-2 text-sm text-white">{selectedMealExecution.shopping_rebuild_status || "—"}</div>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Alertes</div>
                      <div className="mt-2 text-sm text-white">{selectedMealExecution.alert_count}</div>
                    </div>
                  </div>

                  <DetailSection title="Lignes de consommation serveur">
                    <ConfirmationServerPanel lines={selectedMealExecution.consumption_lines} />
                  </DetailSection>
                </div>
              ) : (
                <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/55">
                  Aucun reçu serveur disponible pour le repas sélectionné.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
