import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  History,
  Link2,
  LoaderCircle,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Utensils,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/providers/AuthProvider";
import { useMeals, type MealExecutionHistoryEntry } from "@/src/hooks/useMeals";
import { ROUTES } from "@/src/constants/routes";
import {
  RECIPE_MEAL_TYPE_OPTIONS,
  RECIPE_SORT_MODE_OPTIONS,
  getRecipeDifficultyLabel,
  getRecipeFitStatusLabel,
  getRecipeSortModeLabel,
  getRecipeStockIntensityLabel,
  type RecipeSortMode,
} from "@/src/constants/recipeCatalog";
import type {
  InventoryMappingTarget,
  MealConfirmConsumptionLine,
  MealFeedItem,
  MealType,
  RecipeCandidate,
  RecipePreviewIngredient,
} from "@/src/services/meals/mealService";

type SearchIntentCode =
  | "FAST"
  | "PROTEIN"
  | "HALAL"
  | "NO_PORK"
  | "LIGHT"
  | "TRANSPORTABLE"
  | "FRESH";

type SearchIntent = {
  code: SearchIntentCode;
  label: string;
};

const SEARCH_INTENTS: SearchIntent[] = [
  { code: "FAST", label: "Rapide" },
  { code: "PROTEIN", label: "Protéiné" },
  { code: "HALAL", label: "Halal" },
  { code: "NO_PORK", label: "Sans porc" },
  { code: "LIGHT", label: "Léger" },
  { code: "TRANSPORTABLE", label: "Transportable" },
  { code: "FRESH", label: "Frais" },
];

const PROFILE_STORAGE_KEY = "domyli:meals:v3:last-profile";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function formatCodeLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMetricValue(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return Number.isInteger(value) ? `${value}` : value.toFixed(2);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function recipeHasTag(recipe: RecipeCandidate, code: string): boolean {
  return recipe.tags.some((tag) => tag.code.toUpperCase() === code);
}

function recipeMatchesIntent(
  recipe: RecipeCandidate,
  intentCode: SearchIntentCode,
): boolean {
  switch (intentCode) {
    case "FAST":
      return recipe.prep_minutes + recipe.cook_minutes <= 20;
    case "PROTEIN":
      return recipeHasTag(recipe, "PROTEIN");
    case "HALAL":
      return recipeHasTag(recipe, "HALAL_OK");
    case "NO_PORK":
      return recipeHasTag(recipe, "NO_PORK");
    case "LIGHT":
      return recipeHasTag(recipe, "LOW_SUGAR") || recipeHasTag(recipe, "FIBER");
    case "TRANSPORTABLE":
      return recipeHasTag(recipe, "TRANSPORTABLE");
    case "FRESH":
      return recipeHasTag(recipe, "FRESH");
    default:
      return true;
  }
}

function getFitWeight(value: string): number {
  if (value === "OK") return 3;
  if (value === "WARNING") return 2;
  return 1;
}

function getStockWeight(value: string): number {
  if (value === "LOW") return 1;
  if (value === "MEDIUM") return 2;
  return 3;
}

function sortRecipes(
  recipes: RecipeCandidate[],
  sortMode: RecipeSortMode,
): RecipeCandidate[] {
  const cloned = [...recipes];

  cloned.sort((a, b) => {
    if (sortMode === "FAST") {
      const aTime = a.prep_minutes + a.cook_minutes;
      const bTime = b.prep_minutes + b.cook_minutes;

      return (
        aTime - bTime ||
        b.fit.fit_score - a.fit.fit_score ||
        a.title.localeCompare(b.title, "fr")
      );
    }

    if (sortMode === "STOCK") {
      return (
        getStockWeight(a.stock_intensity) - getStockWeight(b.stock_intensity) ||
        b.fit.fit_score - a.fit.fit_score ||
        a.title.localeCompare(b.title, "fr")
      );
    }

    if (sortMode === "FAMILY") {
      return (
        b.default_servings - a.default_servings ||
        b.fit.fit_score - a.fit.fit_score ||
        a.title.localeCompare(b.title, "fr")
      );
    }

    return (
      getFitWeight(b.fit.fit_status) - getFitWeight(a.fit.fit_status) ||
      b.fit.fit_score - a.fit.fit_score ||
      getStockWeight(a.stock_intensity) - getStockWeight(b.stock_intensity) ||
      a.title.localeCompare(b.title, "fr")
    );
  });

  return cloned;
}

function getIngredientRoleLabel(value: string): string {
  return formatCodeLabel(value);
}

function buildOperatorNotes(
  recipe: RecipeCandidate,
  operatorNotes: string,
  profileLabel: string,
  selectedIntentCodes: SearchIntentCode[],
  sortMode: RecipeSortMode,
): string {
  const lines = [
    "[DOMYLI_MEALS_V3]",
    `recipe_id=${recipe.recipe_id}`,
    `recipe_code=${recipe.recipe_code}`,
    `fit_status=${recipe.fit.fit_status}`,
    `fit_score=${recipe.fit.fit_score}`,
    `profile_label=${profileLabel}`,
    `selection_mode=${sortMode}`,
    `intent_filters=${selectedIntentCodes.join("|") || "NONE"}`,
    "[/DOMYLI_MEALS_V3]",
  ];

  if (operatorNotes.trim()) {
    lines.push("", operatorNotes.trim());
  }

  return lines.join("\n");
}

function getConsumptionTone(
  value: string | null | undefined,
): "default" | "warning" | "danger" | "success" {
  if (value === "CONSUMED") return "success";
  if (value === "PARTIAL_STOCK") return "warning";
  if (value === "NO_INVENTORY_ITEM") return "danger";
  return "default";
}

function getConsumptionLabel(value: string | null | undefined): string {
  switch (value) {
    case "CONSUMED":
      return "Consommé";
    case "PARTIAL_STOCK":
      return "Partiel";
    case "NO_INVENTORY_ITEM":
      return "Non mappé";
    case "INVENTORY_ITEM_NOT_FOUND":
      return "Stock introuvable";
    case "INVENTORY_SCHEMA_UNSUPPORTED":
      return "Schéma stock";
    default:
      return value ?? "Inconnu";
  }
}

function getShoppingStatusTone(
  value: string | null | undefined,
): "default" | "warning" | "danger" | "success" {
  if (value?.startsWith("TRIGGERED")) return "success";
  if (value === "ALREADY_CONFIRMED") return "default";
  if (value === "MISSING") return "warning";
  if (value?.startsWith("FAILED")) return "danger";
  return "default";
}

function getExecutionSourceTone(
  value: string | null | undefined,
): "default" | "warning" | "danger" | "success" {
  if (value === "EVENT_LOG") return "success";
  if (value === "MEAL_SLOT_FALLBACK") return "warning";
  return "default";
}

function getExecutionSourceLabel(value: string | null | undefined): string {
  switch (value) {
    case "EVENT_LOG":
      return "Journal serveur";
    case "MEAL_SLOT_FALLBACK":
      return "Fallback meal_slot";
    default:
      return value ?? "Aucune source";
  }
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

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${className}`}
    >
      {label}
    </span>
  );
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
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
            Profil actif
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">{label}</h3>
        </div>
        {isActive ? <ToneBadge label="Sélectionné" tone="success" /> : null}
      </div>

      <p className="mt-3 text-sm text-white/70">{summary}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-gold/80">
        {meta}
      </p>
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
  const fitTone =
    recipe.fit.fit_status === "OK"
      ? "success"
      : recipe.fit.fit_status === "BLOCKED"
        ? "danger"
        : "warning";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-[28px] border p-5 text-left transition ${
        isSelected
          ? "border-gold/50 bg-gold/10 shadow-[0_0_0_1px_rgba(255,215,0,0.12)]"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <ToneBadge
          label={getRecipeFitStatusLabel(recipe.fit.fit_status)}
          tone={fitTone}
        />
        <ToneBadge
          label={getRecipeDifficultyLabel(recipe.difficulty)}
          tone="default"
        />
        <ToneBadge
          label={getRecipeStockIntensityLabel(recipe.stock_intensity)}
          tone="default"
        />
      </div>

      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-gold/80">
        {recipe.personalized_serving_label}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-white">{recipe.title}</h3>
      <p className="mt-2 text-sm text-white/70">{recipe.short_description}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/55">
        <span>{recipe.prep_minutes} min prep</span>
        <span>·</span>
        <span>{recipe.cook_minutes} min cuisson</span>
        <span>·</span>
        <span>score {formatMetricValue(recipe.fit.fit_score)}</span>
      </div>

      {recipe.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {recipe.tags.slice(0, 6).map((tag) => (
            <span
              key={`${recipe.recipe_id}-${tag.code}`}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55"
            >
              {tag.label}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
}

function IngredientLine({ ingredient }: { ingredient: RecipePreviewIngredient }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-white">
            {ingredient.ingredient_label}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/45">
            {getIngredientRoleLabel(ingredient.nutrition_role)} ·{" "}
            {ingredient.scaling_policy}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm font-semibold text-gold">
            {formatMetricValue(ingredient.qty_adjusted)} {ingredient.unit_code}
          </p>
          <p className="text-xs text-white/45">
            base {formatMetricValue(ingredient.qty_base)} {ingredient.unit_code}
          </p>
        </div>
      </div>
    </div>
  );
}

function MappingTargetCard({
  target,
  isActive,
  onClick,
}: {
  target: InventoryMappingTarget;
  isActive: boolean;
  onClick: () => void;
}) {
  const isMapped = Boolean(target.mapped_inventory_item_id);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[24px] border p-4 text-left transition ${
        isActive
          ? "border-gold/50 bg-gold/10"
          : "border-white/10 bg-white/5 hover:border-white/20"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <ToneBadge
          label={isMapped ? "Mappé" : "À relier"}
          tone={isMapped ? "success" : "warning"}
        />
      </div>

      <h3 className="mt-3 text-base font-semibold text-white">
        {target.ingredient_label}
      </h3>
      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/45">
        Recettes {target.recipe_usage_count} · Repas {target.meal_usage_count}
      </p>
      <p className="mt-2 text-sm text-white/65">
        {isMapped
          ? target.mapped_item_label || target.mapped_item_code || "Article stock lié"
          : "Aucun article stock lié"}
      </p>
    </button>
  );
}

function ConsumptionLineCard({
  line,
}: {
  line: MealConfirmConsumptionLine;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{line.ingredient_code}</p>
          <p className="mt-1 text-sm text-white/60">{line.ingredient_label}</p>
        </div>
        <ToneBadge
          label={getConsumptionLabel(line.inventory_status)}
          tone={getConsumptionTone(line.inventory_status)}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
            Planifié
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {formatMetricValue(line.quantity_planned)} {line.unit_code ?? ""}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
            Consommé
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {formatMetricValue(line.consumed_qty)} {line.unit_code ?? ""}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
            Manquant
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {formatMetricValue(line.shortage_qty)} {line.unit_code ?? ""}
          </p>
        </div>
      </div>
    </div>
  );
}

function HistoryEntryCard({
  entry,
  onSelect,
}: {
  entry: MealExecutionHistoryEntry;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-left transition hover:border-white/20"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">
            {entry.title ?? "Repas DOMYLI"}
          </h3>
          <p className="mt-1 text-sm text-white/60">
            {entry.planned_for ?? "Date non renseignée"} ·{" "}
            {entry.meal_type ?? "Meal"}
          </p>
        </div>
        <ToneBadge
          label={entry.status ?? "Historique"}
          tone={entry.unmapped_count > 0 ? "warning" : "success"}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {entry.unmapped_count > 0 ? (
          <ToneBadge label={`${entry.unmapped_count} non mappé(s)`} tone="warning" />
        ) : null}
        {entry.partial_count > 0 ? (
          <ToneBadge label={`${entry.partial_count} partiel(s)`} tone="warning" />
        ) : null}
      </div>

      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-white/45">
        Confirmé le {formatDateTime(entry.confirmed_at)}
      </p>
    </button>
  );
}

function FeedMealCard({
  item,
  isActive,
  onSelect,
}: {
  item: MealFeedItem;
  isActive: boolean;
  onSelect: () => void;
}) {
  const isConfirmed = (item.status ?? "").toUpperCase() === "CONFIRMED";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-[24px] border p-4 text-left transition ${
        isActive
          ? "border-gold/50 bg-gold/10"
          : "border-white/10 bg-white/5 hover:border-white/20"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <ToneBadge
          label={item.status ?? "PLANNED"}
          tone={isConfirmed ? "success" : "default"}
        />
        <ToneBadge label={item.meal_type} tone="default" />
      </div>

      <h3 className="mt-3 text-base font-semibold text-white">
        {item.title ?? item.recipe_title ?? "Repas DOMYLI"}
      </h3>

      <p className="mt-2 text-sm text-white/60">
        {item.planned_for} · {item.profile_label ?? "Profil"} ·{" "}
        {item.recipe_code ?? "recette"}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-white/45">
        <span>{item.inserted_ingredient_count} ingrédients figés</span>
        <span>·</span>
        <span>portion {formatMetricValue(item.portion_factor)}</span>
      </div>

      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-gold/75">
        {isConfirmed
          ? `Confirmé ${formatDateTime(item.confirmed_at ?? item.updated_at)}`
          : `Mis à jour ${formatDateTime(item.updated_at ?? item.created_at)}`}
      </p>
    </button>
  );
}

export default function MealsPage() {
  const navigate = useNavigate();

  const {
    sessionEmail,
    activeMembership,
    isAuthenticated,
    hasHousehold,
    authLoading,
    bootstrapLoading,
  } = useAuth();

  const {
    loadingProfiles,
    saving,
    confirming,
    candidatesLoading,
    previewLoading,
    mappingTargetsLoading,
    mappingCandidatesLoading,
    mappingSaving,
    mealFeedLoading,
    mealDetailLoading,
    mealExecutionLoading,
    error,
    profiles,
    recipeCandidates,
    recipePreview,
    inventoryMappingTargets,
    inventoryMappingCandidates,
    confirmationHistory,
    mealFeed,
    selectedMealDetail,
    selectedMealExecution,
    lastCreatedMealSlotId,
    lastUpdatedMealSlotId,
    lastConfirmResult,
    lastInventoryMappingResult,
    createMeal,
    updateMeal,
    confirmMealSlot,
    refreshRecipeCandidates,
    refreshRecipePreview,
    refreshInventoryMappingCandidates,
    refreshMealFeed,
    refreshMealDetail,
    refreshMealExecution,
    saveInventoryMapping,
  } = useMeals();

  const [selectedMealSlotId, setSelectedMealSlotId] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [plannedFor, setPlannedFor] = useState(todayIsoDate());
  const [feedFromDate, setFeedFromDate] = useState(todayIsoDate());
  const [feedToDate, setFeedToDate] = useState(addDays(todayIsoDate(), 7));
  const [mealType, setMealType] = useState<MealType>("LUNCH");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [selectedIntentCodes, setSelectedIntentCodes] = useState<SearchIntentCode[]>([]);
  const [sortMode, setSortMode] = useState<RecipeSortMode>("COMPATIBILITY");
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [operatorNotes, setOperatorNotes] = useState("");
  const [mappingSearch, setMappingSearch] = useState("");
  const [activeMappingTargetCode, setActiveMappingTargetCode] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedProfileId = window.localStorage.getItem(PROFILE_STORAGE_KEY)?.trim();

    if (savedProfileId) {
      setSelectedProfileId(savedProfileId);
    }
  }, []);

  useEffect(() => {
    if (!profiles.length) return;

    const profileStillExists = profiles.some(
      (profile) => profile.profile_id === selectedProfileId,
    );

    if (!selectedProfileId || !profileStillExists) {
      setSelectedProfileId((current) => {
        if (current && profileStillExists) return current;
        return profiles[0]?.profile_id ?? "";
      });
    }
  }, [profiles, selectedProfileId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!selectedProfileId.trim()) return;
    window.localStorage.setItem(PROFILE_STORAGE_KEY, selectedProfileId.trim());
  }, [selectedProfileId]);

  useEffect(() => {
    if (!selectedProfileId.trim()) return;
    void refreshRecipeCandidates(mealType, selectedProfileId, recipeSearch);
  }, [mealType, recipeSearch, refreshRecipeCandidates, selectedProfileId]);

  useEffect(() => {
    if (!feedFromDate || !feedToDate) return;

    void refreshMealFeed({
      p_from_date: feedFromDate,
      p_to_date: feedToDate,
      p_profile_id: selectedProfileId || null,
      p_meal_type: mealType,
      p_limit: 80,
    });
  }, [feedFromDate, feedToDate, mealType, refreshMealFeed, selectedProfileId]);

  useEffect(() => {
    const recipeStillExists = recipeCandidates.some(
      (recipe) => recipe.recipe_id === selectedRecipeId,
    );

    if (!recipeCandidates.length) {
      if (selectedRecipeId) setSelectedRecipeId("");
      return;
    }

    if (!selectedRecipeId || !recipeStillExists) {
      setSelectedRecipeId(recipeCandidates[0]?.recipe_id ?? "");
    }
  }, [recipeCandidates, selectedRecipeId]);

  useEffect(() => {
    if (!selectedProfileId.trim() || !selectedRecipeId.trim()) return;
    void refreshRecipePreview(mealType, selectedProfileId, selectedRecipeId);
  }, [mealType, refreshRecipePreview, selectedProfileId, selectedRecipeId]);

  const selectedProfile = useMemo(
    () =>
      profiles.find((profile) => profile.profile_id === selectedProfileId) ?? null,
    [profiles, selectedProfileId],
  );

  const filteredRecipes = useMemo(() => {
    const normalizedSearch = normalizeText(recipeSearch.trim());

    return recipeCandidates.filter((recipe) => {
      if (normalizedSearch) {
        const searchDocument = normalizeText(
          [
            recipe.title,
            recipe.recipe_code,
            recipe.short_description,
            recipe.tags.map((tag) => `${tag.code} ${tag.label}`).join(" "),
            recipe.fit.fit_reasons.join(" "),
            recipe.fit.warnings.join(" "),
            recipe.fit.blocked_reasons.join(" "),
          ].join(" "),
        );

        if (!searchDocument.includes(normalizedSearch)) {
          return false;
        }
      }

      if (selectedIntentCodes.length > 0) {
        return selectedIntentCodes.every((intentCode) =>
          recipeMatchesIntent(recipe, intentCode),
        );
      }

      return true;
    });
  }, [recipeCandidates, recipeSearch, selectedIntentCodes]);

  const visibleRecipes = useMemo(
    () => sortRecipes(filteredRecipes, sortMode),
    [filteredRecipes, sortMode],
  );

  const selectedRecipe = useMemo(
    () =>
      visibleRecipes.find((recipe) => recipe.recipe_id === selectedRecipeId) ??
      recipeCandidates.find((recipe) => recipe.recipe_id === selectedRecipeId) ??
      null,
    [recipeCandidates, selectedRecipeId, visibleRecipes],
  );

  const activeMappingTarget = useMemo(
    () =>
      inventoryMappingTargets.find(
        (target) => target.ingredient_code === activeMappingTargetCode,
      ) ?? inventoryMappingTargets[0] ?? null,
    [activeMappingTargetCode, inventoryMappingTargets],
  );

  const effectiveMealSlotId = useMemo(
    () =>
      selectedMealSlotId || lastUpdatedMealSlotId || lastCreatedMealSlotId || "",
    [lastCreatedMealSlotId, lastUpdatedMealSlotId, selectedMealSlotId],
  );

  useEffect(() => {
    if (!effectiveMealSlotId.trim()) return;
    if (selectedMealDetail?.meal_slot_id === effectiveMealSlotId) return;
    void refreshMealDetail(effectiveMealSlotId);
  }, [effectiveMealSlotId, refreshMealDetail, selectedMealDetail?.meal_slot_id]);

  useEffect(() => {
    if (!effectiveMealSlotId.trim()) return;
    if (selectedMealExecution?.meal_slot_id === effectiveMealSlotId) return;
    void refreshMealExecution(effectiveMealSlotId);
  }, [effectiveMealSlotId, refreshMealExecution, selectedMealExecution?.meal_slot_id]);

  const canSubmit = Boolean(
    selectedProfileId.trim() &&
      selectedRecipe?.recipe_id &&
      plannedFor &&
      mealType,
  );

  const canConfirm = Boolean(effectiveMealSlotId);

  function toggleIntent(code: SearchIntentCode) {
    setSelectedIntentCodes((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code],
    );
  }

  function hydrateMealSelection(item: {
    meal_slot_id?: string | null;
    profile_id?: string | null;
    recipe_id?: string | null;
    planned_for?: string | null;
    meal_type?: MealType | null;
    operator_notes?: string | null;
  }) {
    if (!item.profile_id || !item.recipe_id || !item.planned_for || !item.meal_type) {
      return;
    }

    setSelectedMealSlotId(item.meal_slot_id ?? "");
    setSelectedProfileId(item.profile_id);
    setSelectedRecipeId(item.recipe_id);
    setPlannedFor(item.planned_for);
    setMealType(item.meal_type);
    setRecipeSearch("");
    setSelectedIntentCodes([]);
    setOperatorNotes(item.operator_notes ?? "");
  }

  async function handleCreateOrUpdate() {
    if (!selectedProfile || !selectedRecipe) return;

    setLocalMessage(null);

    const notes = buildOperatorNotes(
      selectedRecipe,
      operatorNotes,
      selectedProfile.display_name,
      selectedIntentCodes,
      sortMode,
    );

    if (effectiveMealSlotId) {
      const result = await updateMeal({
        p_meal_slot_id: effectiveMealSlotId,
        p_profile_id: selectedProfile.profile_id,
        p_recipe_id: selectedRecipe.recipe_id,
        p_planned_for: plannedFor,
        p_meal_type: mealType,
        p_operator_notes: notes,
        title: selectedRecipe.title,
      });

      setSelectedMealSlotId(result.meal_slot_id);

      await refreshMealFeed({
        p_from_date: feedFromDate,
        p_to_date: feedToDate,
        p_profile_id: selectedProfile.profile_id,
        p_meal_type: mealType,
        p_limit: 80,
      });
      await refreshMealDetail(result.meal_slot_id);

      setLocalMessage(
        "Repas mis à jour avec la recette personnalisée sélectionnée.",
      );
      return;
    }

    const result = await createMeal({
      p_profile_id: selectedProfile.profile_id,
      p_recipe_id: selectedRecipe.recipe_id,
      p_planned_for: plannedFor,
      p_meal_type: mealType,
      p_operator_notes: notes,
      title: selectedRecipe.title,
    });

    setSelectedMealSlotId(result.meal_slot_id);

    await refreshMealFeed({
      p_from_date: feedFromDate,
      p_to_date: feedToDate,
      p_profile_id: selectedProfile.profile_id,
      p_meal_type: mealType,
      p_limit: 80,
    });
    await refreshMealDetail(result.meal_slot_id);

    setLocalMessage("Repas créé avec succès dans Meals V3.5 et snapshot back rechargé.");
  }

  async function handleConfirm() {
    if (!effectiveMealSlotId) return;

    setLocalMessage(null);

    await confirmMealSlot(effectiveMealSlotId);

    await refreshMealFeed({
      p_from_date: feedFromDate,
      p_to_date: feedToDate,
      p_profile_id: selectedProfileId || null,
      p_meal_type: mealType,
      p_limit: 80,
    });
    await refreshMealDetail(effectiveMealSlotId);

    setLocalMessage(
      "Repas confirmé. Le back a lancé la consommation stock et le rebuild shopping.",
    );
  }

  if (authLoading || bootstrapLoading || loadingProfiles) {
    return (
      <div className="min-h-screen bg-black px-6 py-16 text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-4 rounded-[32px] border border-white/10 bg-white/5 px-8 py-10">
          <LoaderCircle className="h-6 w-6 animate-spin text-gold" />
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
              DOMYLI
            </p>
            <h1 className="mt-2 text-2xl font-semibold">
              Chargement Meals V3.5...
            </h1>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <div className="min-h-screen bg-black px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl rounded-[40px] border border-white/10 bg-white/5 p-8">
          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-white/45 transition hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l’accueil
          </button>

          <p className="mt-8 text-[11px] uppercase tracking-[0.22em] text-gold/80">
            DOMYLI
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Foyer actif requis</h1>
          <p className="mt-4 max-w-2xl text-white/70">
            Meals V3.5 exige une session authentifiée, un foyer actif et au moins
            un profil humain meal-ready.
          </p>
        </div>
      </div>
    );
  }

  if (!profiles.length) {
    return (
      <div className="min-h-screen bg-black px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl rounded-[40px] border border-white/10 bg-white/5 p-8">
          <button
            type="button"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-white/45 transition hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour dashboard
          </button>

          <p className="mt-8 text-[11px] uppercase tracking-[0.22em] text-gold/80">
            Meals V3.4
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            Aucun profil actif prêt pour Meals
          </h1>
          <p className="mt-4 max-w-2xl text-white/70">
            Complète au moins un profil avec un poids valide pour débloquer la
            personnalisation unipersonnelle des recettes et des quantités.
          </p>

          <div className="mt-8">
            <button
              type="button"
              onClick={() => navigate(ROUTES.PROFILES)}
              className="inline-flex items-center gap-2 rounded-full border border-gold/30 px-6 py-3 text-sm uppercase tracking-[0.2em] text-gold transition hover:bg-gold hover:text-black"
            >
              Voir les profils
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-[1480px]">
        <div className="rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.08),transparent_40%),rgba(255,255,255,0.03)] p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <button
                type="button"
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-white/45 transition hover:text-gold"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </button>

              <p className="mt-8 text-[11px] uppercase tracking-[0.22em] text-gold/80">
                DOMYLI · Meals V3.4
              </p>
              <h1 className="mt-3 text-4xl font-semibold">
                Planification réelle + reprise canonique des repas
              </h1>
              <p className="mt-4 max-w-4xl text-white/70">
                Une seule personne. Un seul profil actif. Des recettes directement
                sélectionnables. Des quantités recalculées à partir du poids. Et
                désormais une lecture back des repas déjà créés pour les reprendre
                proprement en multi-session.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Session
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {sessionEmail ?? "Utilisateur DOMYLI"}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gold/75">
                  {activeMembership?.role ?? "MEMBER"}
                </p>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Lot actif
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  Front Meals V3.4
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gold/75">
                  lecture canonique + édition
                </p>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-8 rounded-[28px] border border-red-400/20 bg-red-500/10 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-red-200" />
                <div>
                  <p className="text-sm font-semibold text-red-100">Erreur Meals</p>
                  <p className="mt-2 text-sm text-red-100/85">{error.message}</p>
                  {error.hint ? (
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-red-100/70">
                      {error.hint}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {localMessage ? (
            <div className="mt-8 rounded-[28px] border border-emerald-400/20 bg-emerald-500/10 p-5 text-sm text-emerald-100">
              {localMessage}
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_1fr]">
          <section className="rounded-[36px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-gold" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Étape 1
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Choisir la personne
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {profiles.map((profile) => (
                <ProfileCard
                  key={profile.profile_id}
                  isActive={profile.profile_id === selectedProfileId}
                  label={profile.display_name}
                  summary={profile.summary}
                  meta={`poids ${formatMetricValue(profile.weight_kg)} kg`}
                  onClick={() => setSelectedProfileId(profile.profile_id)}
                />
              ))}
            </div>
          </section>

          <section className="rounded-[36px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-gold" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Étape 2
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Planning réel du foyer
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
              <label className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                  Du
                </p>
                <input
                  type="date"
                  value={feedFromDate}
                  onChange={(event) => setFeedFromDate(event.target.value)}
                  className="mt-3 w-full bg-transparent text-sm text-white outline-none"
                />
              </label>

              <label className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                  Au
                </p>
                <input
                  type="date"
                  value={feedToDate}
                  onChange={(event) => setFeedToDate(event.target.value)}
                  className="mt-3 w-full bg-transparent text-sm text-white outline-none"
                />
              </label>

              <button
                type="button"
                onClick={() =>
                  void refreshMealFeed({
                    p_from_date: feedFromDate,
                    p_to_date: feedToDate,
                    p_profile_id: selectedProfileId || null,
                    p_meal_type: mealType,
                    p_limit: 80,
                  })
                }
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm uppercase tracking-[0.18em] text-white/70 transition hover:border-white/30 hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 ${mealFeedLoading ? "animate-spin" : ""}`} />
                Actualiser
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <ToneBadge
                label={`profil ${selectedProfile?.display_name ?? "—"}`}
                tone="default"
              />
              <ToneBadge label={`type ${mealType}`} tone="default" />
              <ToneBadge label={`${mealFeed.length} repas remonté(s)`} tone="success" />
            </div>

            <div className="mt-6 space-y-4">
              {mealFeedLoading ? (
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-6">
                  <div className="inline-flex items-center gap-3 text-sm text-white/70">
                    <LoaderCircle className="h-5 w-5 animate-spin text-gold" />
                    Chargement du feed Meals depuis le back...
                  </div>
                </div>
              ) : mealFeed.length > 0 ? (
                mealFeed.map((item) => (
                  <FeedMealCard
                    key={item.meal_slot_id}
                    item={item}
                    isActive={item.meal_slot_id === effectiveMealSlotId}
                    onSelect={() => {
                      hydrateMealSelection(item);
                      void refreshMealDetail(item.meal_slot_id);
                      setLocalMessage("Repas existant rechargé avec son snapshot back.");
                    }}
                  />
                ))
              ) : (
                <div className="rounded-[28px] border border-dashed border-white/15 bg-black/20 p-6 text-sm text-white/60">
                  Aucun repas remonté sur cette fenêtre. Le lot Back Meals 6 est
                  prêt à alimenter cette zone dès que la RPC est déployée.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_1fr]">
          <section className="rounded-[36px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-gold" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Étape 3
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Sélectionner la recette
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              <label className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                  Date planifiée
                </p>
                <input
                  type="date"
                  value={plannedFor}
                  onChange={(event) => setPlannedFor(event.target.value)}
                  className="mt-3 w-full bg-transparent text-sm text-white outline-none"
                />
              </label>

              <label className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                  Type de repas
                </p>
                <select
                  value={mealType}
                  onChange={(event) => setMealType(event.target.value as MealType)}
                  className="mt-3 w-full bg-transparent text-sm text-white outline-none"
                >
                  {RECIPE_MEAL_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-black">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_auto]">
              <label className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                  Recherche libre
                </p>
                <input
                  value={recipeSearch}
                  onChange={(event) => setRecipeSearch(event.target.value)}
                  placeholder="Titre, code recette, tags, raisons, vigilance..."
                  className="mt-3 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                />
              </label>

              <label className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                  Tri
                </p>
                <select
                  value={sortMode}
                  onChange={(event) =>
                    setSortMode(event.target.value as RecipeSortMode)
                  }
                  className="mt-3 w-full bg-transparent text-sm text-white outline-none"
                >
                  {RECIPE_SORT_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-black">
                      {getRecipeSortModeLabel(option.value)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {SEARCH_INTENTS.map((intent) => {
                const active = selectedIntentCodes.includes(intent.code);

                return (
                  <button
                    key={intent.code}
                    type="button"
                    onClick={() => toggleIntent(intent.code)}
                    className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition ${
                      active
                        ? "border-gold/50 bg-gold/10 text-gold"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {intent.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <ToneBadge
                label={`${visibleRecipes.length} recette(s) visibles`}
                tone="success"
              />
              {selectedRecipe ? (
                <ToneBadge label={selectedRecipe.recipe_code} tone="default" />
              ) : null}
            </div>

            <div className="mt-6 grid gap-4">
              {candidatesLoading ? (
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-6">
                  <div className="inline-flex items-center gap-3 text-sm text-white/70">
                    <LoaderCircle className="h-5 w-5 animate-spin text-gold" />
                    Recherche des recettes personnalisées...
                  </div>
                </div>
              ) : visibleRecipes.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-white/15 bg-black/20 p-6 text-sm text-white/60">
                  Aucune recette ne correspond aux filtres actifs pour ce profil.
                </div>
              ) : (
                visibleRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.recipe_id}
                    recipe={recipe}
                    isSelected={recipe.recipe_id === selectedRecipeId}
                    onSelect={() => setSelectedRecipeId(recipe.recipe_id)}
                  />
                ))
              )}
            </div>
          </section>

          <section className="rounded-[36px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-gold" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Étape 4
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Aperçu quantitatif personnalisé
                </h2>
              </div>
            </div>

            {previewLoading ? (
              <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-6">
                <div className="inline-flex items-center gap-3 text-sm text-white/70">
                  <LoaderCircle className="h-5 w-5 animate-spin text-gold" />
                  Calcul des quantités personnalisées...
                </div>
              </div>
            ) : selectedRecipe && recipePreview ? (
              <>
                <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <ToneBadge
                      label={selectedProfile?.display_name ?? "Profil sélectionné"}
                      tone="default"
                    />
                    <ToneBadge
                      label={getRecipeFitStatusLabel(recipePreview.fit_status)}
                      tone={
                        recipePreview.fit_status === "OK"
                          ? "success"
                          : recipePreview.fit_status === "BLOCKED"
                            ? "danger"
                            : "warning"
                      }
                    />
                    <ToneBadge
                      label={`portion ${formatMetricValue(recipePreview.portion_factor)}`}
                      tone="success"
                    />
                  </div>

                  <h3 className="mt-4 text-xl font-semibold text-white">
                    {recipePreview.title}
                  </h3>

                  {recipePreview.fit_reasons.length > 0 ? (
                    <div className="mt-5">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-gold/75">
                        Raisons
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-white/70">
                        {recipePreview.fit_reasons.map((reason) => (
                          <li key={reason}>• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {recipePreview.warnings.length > 0 ? (
                    <div className="mt-5">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-amber-200/85">
                        Vigilances
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-white/70">
                        {recipePreview.warnings.map((warning) => (
                          <li key={warning}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div className="mt-6">
                  <div className="flex items-center gap-3">
                    <Target className="h-4 w-4 text-gold" />
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                      Ingrédients recalculés
                    </p>
                  </div>

                  <div className="mt-4 space-y-3">
                    {recipePreview.ingredients.length > 0 ? (
                      recipePreview.ingredients.map((ingredient) => (
                        <IngredientLine
                          key={`${ingredient.ingredient_code}-${ingredient.sort_order}`}
                          ingredient={ingredient}
                        />
                      ))
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-white/15 bg-black/20 p-5 text-sm text-white/60">
                        Aucun détail ingrédient n’a été renvoyé pour cette recette.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-[28px] border border-dashed border-white/15 bg-black/20 p-6 text-sm text-white/60">
                Choisis une recette compatible pour afficher le recalcul précis des
                quantités selon le profil actif.
              </div>
            )}
          </section>

          <section className="rounded-[36px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-gold" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Étape 4B
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Snapshot réel figé du repas
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm text-white/60">
              Ce bloc lit le meal slot réellement enregistré côté back. Il ne
              recalcule pas la recette&nbsp;: il restitue le snapshot figé utilisé
              par DOMYLI pour l’exécution réelle.
            </p>

            {mealDetailLoading ? (
              <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-6">
                <div className="inline-flex items-center gap-3 text-sm text-white/70">
                  <LoaderCircle className="h-5 w-5 animate-spin text-gold" />
                  Lecture du snapshot back du repas...
                </div>
              </div>
            ) : selectedMealDetail ? (
              <>
                <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <ToneBadge
                      label={selectedMealDetail.status ?? "PLANNED"}
                      tone={
                        (selectedMealDetail.status ?? "").toUpperCase() === "CONFIRMED"
                          ? "success"
                          : "default"
                      }
                    />
                    <ToneBadge
                      label={selectedMealDetail.profile_label ?? "Profil"}
                      tone="default"
                    />
                    <ToneBadge
                      label={`portion ${formatMetricValue(selectedMealDetail.portion_factor)}`}
                      tone="success"
                    />
                    <ToneBadge
                      label={`${selectedMealDetail.inserted_ingredient_count} ingrédient(s) figé(s)`}
                      tone="default"
                    />
                  </div>

                  <h3 className="mt-4 text-xl font-semibold text-white">
                    {selectedMealDetail.title ?? selectedMealDetail.recipe_title ?? "Repas DOMYLI"}
                  </h3>

                  <p className="mt-2 text-sm text-white/60">
                    {selectedMealDetail.planned_for} · {selectedMealDetail.meal_type} ·{" "}
                    {selectedMealDetail.recipe_code ?? "RECETTE"}
                  </p>

                  {selectedMealDetail.operator_notes ? (
                    <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                        Notes opérateur enregistrées
                      </p>
                      <pre className="mt-3 whitespace-pre-wrap text-sm text-white/70">
                        {selectedMealDetail.operator_notes}
                      </pre>
                    </div>
                  ) : null}

                  <p className="mt-5 text-xs uppercase tracking-[0.16em] text-gold/75">
                    {(selectedMealDetail.status ?? "").toUpperCase() === "CONFIRMED"
                      ? `Confirmé ${formatDateTime(selectedMealDetail.confirmed_at ?? selectedMealDetail.updated_at)}`
                      : `Snapshot mis à jour ${formatDateTime(selectedMealDetail.updated_at ?? selectedMealDetail.created_at)}`}
                  </p>
                </div>

                <div className="mt-6">
                  <div className="flex items-center gap-3">
                    <Target className="h-4 w-4 text-gold" />
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                      Ingrédients figés enregistrés
                    </p>
                  </div>

                  <div className="mt-4 space-y-3">
                    {selectedMealDetail.ingredients.length > 0 ? (
                      selectedMealDetail.ingredients.map((ingredient) => (
                        <IngredientLine
                          key={`${ingredient.ingredient_code}-${ingredient.sort_order}`}
                          ingredient={ingredient}
                        />
                      ))
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-white/15 bg-black/20 p-5 text-sm text-white/60">
                        Aucun ingrédient figé n’a été renvoyé pour ce meal slot.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-[28px] border border-dashed border-white/15 bg-black/20 p-6 text-sm text-white/60">
                Recharge un repas existant depuis le feed ou crée un repas pour
                afficher ici le snapshot figé réellement persisté côté back.
              </div>
            )}
          </section>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[36px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-gold" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Étape 4C
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Lecture détaillée de l’exécution serveur
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm text-white/60">
              Ce bloc ne lit pas la réponse volatile du front. Il relit la trace
              serveur la plus récente de confirmation du repas sélectionné, avec
              ses lignes de consommation, le statut du rebuild shopping et les
              alertes renvoyées par le back.
            </p>

            {mealExecutionLoading ? (
              <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-6">
                <div className="inline-flex items-center gap-3 text-sm text-white/70">
                  <LoaderCircle className="h-5 w-5 animate-spin text-gold" />
                  Lecture de l’exécution serveur...
                </div>
              </div>
            ) : selectedMealExecution ? (
              <>
                <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <ToneBadge
                      label={selectedMealExecution.status ?? "INCONNU"}
                      tone={
                        (selectedMealExecution.status ?? "").toUpperCase() === "CONFIRMED"
                          ? "success"
                          : "default"
                      }
                    />
                    <ToneBadge
                      label={getExecutionSourceLabel(selectedMealExecution.execution_source)}
                      tone={getExecutionSourceTone(selectedMealExecution.execution_source)}
                    />
                    <ToneBadge
                      label={selectedMealExecution.shopping_rebuild_status ?? "shopping inconnu"}
                      tone={getShoppingStatusTone(selectedMealExecution.shopping_rebuild_status)}
                    />
                    <ToneBadge
                      label={`${selectedMealExecution.alert_count} alerte(s)`}
                      tone={selectedMealExecution.alert_count > 0 ? "warning" : "success"}
                    />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                        Lignes serveur
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-white">
                        {selectedMealExecution.consumption_line_count}
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                        Consommé
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-emerald-200">
                        {selectedMealExecution.consumed_count}
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                        Partiel
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-amber-200">
                        {selectedMealExecution.partial_count}
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                        Non mappé
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-rose-200">
                        {selectedMealExecution.unmapped_count}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-white/65">
                    <p>
                      Trace serveur&nbsp;:{" "}
                      <span className="text-white">
                        {selectedMealExecution.event_name ?? "Aucun événement explicite"}
                      </span>
                    </p>
                    <p className="mt-2">
                      Horodatage serveur&nbsp;:{" "}
                      <span className="text-white">
                        {formatDateTime(
                          selectedMealExecution.server_recorded_at ??
                            selectedMealExecution.confirmed_at,
                        )}
                      </span>
                    </p>
                    <p className="mt-2 break-all">
                      Actor user&nbsp;:{" "}
                      <span className="text-white">
                        {selectedMealExecution.actor_user_id ?? "Non renvoyé"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center gap-3">
                    <Target className="h-4 w-4 text-gold" />
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                      Lignes de consommation serveur
                    </p>
                  </div>

                  <div className="mt-4 space-y-3">
                    {selectedMealExecution.consumption_lines.length > 0 ? (
                      selectedMealExecution.consumption_lines.map((line) => (
                        <ConsumptionLineCard
                          key={`${line.ingredient_code}-${line.inventory_item_id ?? "none"}-${line.quantity_confirmed ?? 0}`}
                          line={line}
                        />
                      ))
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-white/15 bg-black/20 p-5 text-sm text-white/60">
                        Aucune ligne détaillée n’a été renvoyée par le serveur pour ce repas.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-gold" />
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                      Synchronisation alertes
                    </p>
                  </div>

                  <div className="mt-4 space-y-3">
                    {selectedMealExecution.alerts.length > 0 ? (
                      selectedMealExecution.alerts.map((alert) => (
                        <div
                          key={`${alert.ingredient_code}-${alert.inventory_item_id ?? "none"}`}
                          className="rounded-[24px] border border-white/10 bg-black/20 p-4"
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            <ToneBadge
                              label={alert.ingredient_code}
                              tone="default"
                            />
                            <ToneBadge
                              label={alert.alert_sync_status ?? "Aucun statut"}
                              tone={
                                (alert.alert_sync_status ?? "").toUpperCase().startsWith("FAILED")
                                  ? "danger"
                                  : "success"
                              }
                            />
                          </div>

                          <p className="mt-3 text-sm text-white/60 break-all">
                            inventory_item_id&nbsp;: {alert.inventory_item_id ?? "Non renvoyé"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-white/15 bg-black/20 p-5 text-sm text-white/60">
                        Aucune alerte synchronisée n’a été renvoyée pour cette confirmation.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-[28px] border border-dashed border-white/15 bg-black/20 p-6 text-sm text-white/60">
                Sélectionne un meal slot pour relire la trace serveur de confirmation.
                Si le repas n’est pas encore confirmé, DOMYLI affichera ici un reçu vide ou un fallback de statut.
              </div>
            )}
          </section>

          <section className="rounded-[36px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3">
              <Save className="h-5 w-5 text-gold" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Étape 5
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Sauvegarder puis confirmer
                </h2>
              </div>
            </div>

            <label className="mt-6 block rounded-[24px] border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                Notes opérateur
              </p>
              <textarea
                value={operatorNotes}
                onChange={(event) => setOperatorNotes(event.target.value)}
                placeholder="Contexte, substitution, préférence du jour, remarque d’exécution..."
                className="mt-3 min-h-[140px] w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-white/30"
              />
            </label>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                disabled={!canSubmit || saving}
                onClick={() => void handleCreateOrUpdate()}
                className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-gold/30 px-6 py-4 text-sm uppercase tracking-[0.2em] text-gold transition hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                {effectiveMealSlotId ? "Mettre à jour le repas" : "Créer le repas"}
              </button>

              <button
                type="button"
                disabled={!canConfirm || confirming}
                onClick={() => void handleConfirm()}
                className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-emerald-400/30 px-6 py-4 text-sm uppercase tracking-[0.2em] text-emerald-200 transition hover:bg-emerald-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {confirming ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                Confirmer le repas
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <ToneBadge
                label={
                  effectiveMealSlotId
                    ? `meal_slot ${effectiveMealSlotId.slice(0, 8)}`
                    : "aucun meal_slot"
                }
                tone={effectiveMealSlotId ? "success" : "warning"}
              />
              <ToneBadge
                label={selectedRecipe?.recipe_code ?? "aucune recette"}
                tone="default"
              />
            </div>

            {lastConfirmResult ? (
              <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <ToneBadge
                    label={lastConfirmResult.status ?? "CONFIRMED"}
                    tone="success"
                  />
                  <ToneBadge
                    label={lastConfirmResult.shopping_rebuild_status ?? "shopping"}
                    tone={getShoppingStatusTone(lastConfirmResult.shopping_rebuild_status)}
                  />
                  <ToneBadge
                    label={`${lastConfirmResult.alerts.length} alerte(s)`}
                    tone={lastConfirmResult.alerts.length > 0 ? "warning" : "success"}
                  />
                </div>

                <div className="mt-5 space-y-3">
                  {lastConfirmResult.consumption_lines.map((line) => (
                    <ConsumptionLineCard
                      key={`${line.ingredient_code}-${line.inventory_item_id ?? "none"}`}
                      line={line}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-[36px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-gold" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Étape 6
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Mapping inventaire exploitable
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-4">
                {mappingTargetsLoading ? (
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-white/70">
                    Chargement des cibles de mapping...
                  </div>
                ) : (
                  inventoryMappingTargets.map((target) => (
                    <MappingTargetCard
                      key={target.ingredient_code}
                      target={target}
                      isActive={target.ingredient_code === activeMappingTarget?.ingredient_code}
                      onClick={() => setActiveMappingTargetCode(target.ingredient_code)}
                    />
                  ))
                )}
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-gold" />
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                    Candidat stock
                  </p>
                </div>

                {activeMappingTarget ? (
                  <>
                    <h3 className="mt-4 text-lg font-semibold text-white">
                      {activeMappingTarget.ingredient_label}
                    </h3>
                    <p className="mt-2 text-sm text-white/60">
                      {activeMappingTarget.mapped_item_label ||
                        activeMappingTarget.mapped_item_code ||
                        "Aucun article stock lié"}
                    </p>

                    <div className="mt-5 flex gap-3">
                      <input
                        value={mappingSearch}
                        onChange={(event) => setMappingSearch(event.target.value)}
                        placeholder="Rechercher un article stock..."
                        className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
                      />

                      <button
                        type="button"
                        onClick={() => void refreshInventoryMappingCandidates(mappingSearch)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-3 text-xs uppercase tracking-[0.18em] text-white/70 transition hover:border-white/30 hover:text-white"
                      >
                        <Search className="h-4 w-4" />
                        Rechercher
                      </button>
                    </div>

                    {lastInventoryMappingResult?.ingredient_code ===
                    activeMappingTarget.ingredient_code ? (
                      <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                        Mapping sauvegardé sur{" "}
                        {lastInventoryMappingResult.item_label ??
                          lastInventoryMappingResult.item_code ??
                          "article stock"}.
                      </div>
                    ) : null}

                    <div className="mt-5 space-y-3">
                      {mappingCandidatesLoading ? (
                        <div className="text-sm text-white/60">
                          Recherche des candidats stock...
                        </div>
                      ) : inventoryMappingCandidates.length > 0 ? (
                        inventoryMappingCandidates.map((candidate) => (
                          <button
                            key={candidate.inventory_item_id}
                            type="button"
                            disabled={mappingSaving}
                            onClick={() =>
                              void saveInventoryMapping(
                                activeMappingTarget.ingredient_code,
                                candidate.inventory_item_id,
                                `Mapping Meals V3.4 pour ${activeMappingTarget.ingredient_label}`,
                              )
                            }
                            className="flex w-full items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-white/5 p-4 text-left transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <div>
                              <p className="text-sm font-medium text-white">
                                {candidate.item_label}
                              </p>
                              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/45">
                                {candidate.item_code ?? "sans code"} · stock{" "}
                                {formatMetricValue(candidate.qty_on_hand)}
                              </p>
                            </div>

                            <ChevronRight className="h-4 w-4 text-gold" />
                          </button>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/15 p-4 text-sm text-white/55">
                          Lance une recherche pour afficher les articles stock
                          candidats.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="mt-4 text-sm text-white/55">
                    Sélectionne une cible de mapping pour continuer.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-2">
          <section className="rounded-[36px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-gold" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Étape 7
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Historique local des confirmations
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm text-white/60">
              Ce bloc reste volontairement conservé en V3.5 comme mémoire locale
              de secours, même si la lecture détaillée du meal slot existe
              désormais côté back.
            </p>

            <div className="mt-6 space-y-4">
              {confirmationHistory.length > 0 ? (
                confirmationHistory.map((entry) => (
                  <HistoryEntryCard
                    key={`${entry.meal_slot_id}-${entry.confirmed_at}`}
                    entry={entry}
                    onSelect={() => {
                      hydrateMealSelection({
                        meal_slot_id: entry.meal_slot_id,
                        profile_id: entry.profile_id,
                        recipe_id: entry.recipe_id,
                        planned_for: entry.planned_for,
                        meal_type: entry.meal_type,
                        operator_notes: null,
                      });
                      void refreshMealDetail(entry.meal_slot_id);
                      setLocalMessage("Entrée d’historique rechargée avec détail back.");
                    }}
                  />
                ))
              ) : (
                <div className="rounded-[28px] border border-dashed border-white/15 bg-black/20 p-6 text-sm text-white/60">
                  Aucune confirmation locale persistée pour le moment.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[36px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3">
              <Utensils className="h-5 w-5 text-gold" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Étape 8
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Synthèse opératoire
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                  Profil
                </p>
                <p className="mt-3 text-lg font-semibold text-white">
                  {selectedProfile?.display_name ?? "—"}
                </p>
                <p className="mt-2 text-sm text-white/60">
                  {selectedProfile?.summary ?? "Aucun profil actif"}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                  Recette
                </p>
                <p className="mt-3 text-lg font-semibold text-white">
                  {selectedRecipe?.title ?? "—"}
                </p>
                <p className="mt-2 text-sm text-white/60">
                  {selectedRecipe?.recipe_code ?? "Aucune recette sélectionnée"}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                  Meal slot
                </p>
                <p className="mt-3 text-lg font-semibold text-white">
                  {effectiveMealSlotId ? effectiveMealSlotId.slice(0, 12) : "Non créé"}
                </p>
                <p className="mt-2 text-sm text-white/60">
                  {effectiveMealSlotId
                    ? "Mode édition d’un repas réel"
                    : "Mode création"}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                  Focus V3.4
                </p>
                <p className="mt-3 text-lg font-semibold text-white">
                  Lecture canonique
                </p>
                <p className="mt-2 text-sm text-white/60">
                  Recharger un repas existant depuis le back puis le rééditer sans
                  dépendre uniquement du state local.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}