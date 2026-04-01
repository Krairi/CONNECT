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
import { useMeals } from "@/src/hooks/useMeals";
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
  MealExecutionHistoryEntry,
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

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
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
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${className}`}
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
      className={`rounded-3xl border p-5 text-left transition-all ${
        isActive
          ? "border-gold bg-gold/10 shadow-[0_0_0_1px_rgba(212,175,55,0.25)]"
          : "border-white/10 bg-white/5 hover:border-gold/40 hover:bg-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-white/45">
            Profil actif
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">{label}</h3>
        </div>
        {isActive ? <ToneBadge label="Sélectionné" /> : null}
      </div>
      <p className="mt-3 text-sm text-white/70">{summary}</p>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-gold/80">
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
      className={`rounded-3xl border p-5 text-left transition-all ${
        isSelected
          ? "border-gold bg-gold/10 shadow-[0_0_0_1px_rgba(212,175,55,0.25)]"
          : "border-white/10 bg-white/5 hover:border-gold/40 hover:bg-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold/80">
            {recipe.personalized_serving_label}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            {recipe.title}
          </h3>
          <p className="mt-2 text-sm text-white/65">{recipe.short_description}</p>
        </div>
        <ToneBadge
          label={getRecipeFitStatusLabel(recipe.fit.fit_status)}
          tone={fitTone}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ToneBadge label={`${recipe.prep_minutes + recipe.cook_minutes} min`} />
        <ToneBadge label={getRecipeDifficultyLabel(recipe.difficulty)} />
        <ToneBadge label={getRecipeStockIntensityLabel(recipe.stock_intensity)} />
        <ToneBadge label={`Score ${recipe.fit.fit_score}`} />
      </div>

      {recipe.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {recipe.tags.slice(0, 6).map((tag) => (
            <span
              key={`${recipe.recipe_id}-${tag.code}`}
              className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70"
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
    <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-white/6 py-3 last:border-b-0">
      <div>
        <p className="text-sm font-medium text-white">{ingredient.ingredient_label}</p>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
          {getIngredientRoleLabel(ingredient.nutrition_role)} ·{" "}
          {ingredient.scaling_policy}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gold">
          {ingredient.qty_adjusted} {ingredient.unit_code}
        </p>
        <p className="mt-1 text-xs text-white/45">
          base {ingredient.qty_base} {ingredient.unit_code}
        </p>
      </div>
    </div>
  );
}

function MappingStatusCard({
  target,
  isActive,
  onSelect,
}: {
  target: InventoryMappingTarget;
  isActive: boolean;
  onSelect: () => void;
}) {
  const isMapped = Boolean(target.mapped_inventory_item_id);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-3xl border p-4 text-left transition ${
        isActive
          ? "border-gold bg-gold/10"
          : "border-white/10 bg-black/20 hover:border-white/20"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">
            {target.ingredient_code}
          </p>
          <h3 className="mt-2 text-sm font-semibold text-white">
            {target.ingredient_label}
          </h3>
          <p className="mt-2 text-xs text-white/55">
            Recettes {target.recipe_usage_count} · Repas {target.meal_usage_count}
          </p>
        </div>
        <ToneBadge
          label={isMapped ? "Mappé" : "À mapper"}
          tone={isMapped ? "success" : "warning"}
        />
      </div>

      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-gold/80">
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
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">
            {line.ingredient_code}
          </p>
          <h3 className="mt-2 text-sm font-semibold text-white">
            {line.ingredient_label}
          </h3>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gold/80">
            {line.nutrition_role ? formatCodeLabel(line.nutrition_role) : "Rôle non défini"}
          </p>
        </div>
        <ToneBadge
          label={getConsumptionLabel(line.inventory_status)}
          tone={getConsumptionTone(line.inventory_status)}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
            Planifié
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {formatMetricValue(line.quantity_planned)} {line.unit_code ?? ""}
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
            Confirmé
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {formatMetricValue(line.quantity_confirmed)} {line.unit_code ?? ""}
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
            Avant stock
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {formatMetricValue(line.before_qty)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
            Après stock
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {formatMetricValue(line.after_qty)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
            Consommé
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {formatMetricValue(line.consumed_qty)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
            Manque
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {formatMetricValue(line.shortage_qty)}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/45">
        {line.inventory_item_id
          ? `Inventory item ${line.inventory_item_id}`
          : "Aucun inventory item lié"}
      </p>
    </div>
  );
}

function HistoryCard({
  entry,
  isActive,
  onOpen,
}: {
  entry: MealExecutionHistoryEntry;
  isActive: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full rounded-3xl border p-5 text-left transition ${
        isActive
          ? "border-gold bg-gold/10"
          : "border-white/10 bg-black/20 hover:border-white/20"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">
            {entry.meal_slot_id}
          </p>
          <h3 className="mt-2 text-sm font-semibold text-white">
            {entry.title ?? "Repas DOMYLI"}
          </h3>
          <p className="mt-2 text-xs text-white/55">
            {entry.planned_for ?? "Date non renseignée"} · {entry.meal_type ?? "Meal"}
          </p>
        </div>
        <ToneBadge label={entry.status ?? "CONFIRMED"} tone="success" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ToneBadge label={`${entry.consumption_line_count} lignes`} />
        <ToneBadge label={`${entry.consumed_count} consommés`} tone="success" />
        {entry.unmapped_count > 0 ? (
          <ToneBadge label={`${entry.unmapped_count} non mappés`} tone="danger" />
        ) : null}
        {entry.partial_count > 0 ? (
          <ToneBadge label={`${entry.partial_count} partiels`} tone="warning" />
        ) : null}
      </div>

      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-gold/80">
        Confirmé le {formatDateTime(entry.confirmed_at)}
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
    historyLoading,
    error,
    items,
    profiles,
    recipeCandidates,
    recipePreview,
    inventoryMappingTargets,
    inventoryMappingCandidates,
    confirmationHistory,
    lastCreatedMealSlotId,
    lastUpdatedMealSlotId,
    lastConfirmResult,
    lastInventoryMappingResult,
    createMeal,
    updateMeal,
    confirmMealSlot,
    refreshRecipeCandidates,
    refreshRecipePreview,
    refreshInventoryMappingTargets,
    refreshInventoryMappingCandidates,
    saveInventoryMapping,
  } = useMeals();

  const [selectedMealSlotId, setSelectedMealSlotId] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [plannedFor, setPlannedFor] = useState(todayIsoDate());
  const [mealType, setMealType] = useState<MealType>("LUNCH");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [selectedIntentCodes, setSelectedIntentCodes] = useState<SearchIntentCode[]>([]);
  const [sortMode, setSortMode] = useState<RecipeSortMode>("COMPATIBILITY");
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [operatorNotes, setOperatorNotes] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const [activeMappingIngredientCode, setActiveMappingIngredientCode] = useState("");
  const [mappingSearch, setMappingSearch] = useState("");
  const [mappingNotes, setMappingNotes] = useState("");

  const [activeHistoryMealSlotId, setActiveHistoryMealSlotId] = useState("");

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

  useEffect(() => {
    if (!recipePreview?.ingredients.length) return;
    void refreshInventoryMappingTargets(true);
  }, [recipePreview, refreshInventoryMappingTargets]);

  useEffect(() => {
    if (!confirmationHistory.length) return;
    if (!activeHistoryMealSlotId) {
      setActiveHistoryMealSlotId(confirmationHistory[0]?.meal_slot_id ?? "");
    }
  }, [activeHistoryMealSlotId, confirmationHistory]);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.profile_id === selectedProfileId) ?? null,
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

  const selectedRecipeBlocked =
    recipePreview?.fit_status === "BLOCKED" ||
    selectedRecipe?.fit.fit_status === "BLOCKED";

  const effectiveMealSlotId = useMemo(
    () =>
      selectedMealSlotId ||
      lastUpdatedMealSlotId ||
      lastCreatedMealSlotId ||
      "",
    [lastCreatedMealSlotId, lastUpdatedMealSlotId, selectedMealSlotId],
  );

  const mappingIndex = useMemo(() => {
    return new Map(
      inventoryMappingTargets.map((target) => [target.ingredient_code, target]),
    );
  }, [inventoryMappingTargets]);

  const currentRecipeMappingTargets = useMemo(() => {
    if (!recipePreview?.ingredients.length) return [];

    return recipePreview.ingredients.map((ingredient) => {
      return (
        mappingIndex.get(ingredient.ingredient_code) ?? {
          ingredient_code: ingredient.ingredient_code,
          ingredient_label: ingredient.ingredient_label,
          meal_usage_count: 0,
          recipe_usage_count: 0,
          mapped_inventory_item_id: null,
          mapped_item_code: null,
          mapped_item_label: null,
        }
      );
    });
  }, [mappingIndex, recipePreview]);

  const mappedIngredientCount = currentRecipeMappingTargets.filter((target) =>
    Boolean(target.mapped_inventory_item_id),
  ).length;

  useEffect(() => {
    if (!currentRecipeMappingTargets.length) {
      if (activeMappingIngredientCode) {
        setActiveMappingIngredientCode("");
      }
      return;
    }

    const exists = currentRecipeMappingTargets.some(
      (target) => target.ingredient_code === activeMappingIngredientCode,
    );

    if (!exists) {
      const firstUnmapped =
        currentRecipeMappingTargets.find((target) => !target.mapped_inventory_item_id) ??
        currentRecipeMappingTargets[0];
      setActiveMappingIngredientCode(firstUnmapped?.ingredient_code ?? "");
    }
  }, [activeMappingIngredientCode, currentRecipeMappingTargets]);

  const activeMappingTarget = useMemo(
    () =>
      currentRecipeMappingTargets.find(
        (target) => target.ingredient_code === activeMappingIngredientCode,
      ) ?? null,
    [activeMappingIngredientCode, currentRecipeMappingTargets],
  );

  useEffect(() => {
    if (!activeMappingTarget) return;
    setMappingSearch(
      activeMappingTarget.mapped_item_label ||
        activeMappingTarget.ingredient_label ||
        activeMappingTarget.ingredient_code,
    );
  }, [activeMappingTarget?.ingredient_code]);

  useEffect(() => {
    if (!activeMappingTarget) return;
    if (!mappingSearch.trim()) return;
    void refreshInventoryMappingCandidates(mappingSearch);
  }, [activeMappingTarget, mappingSearch, refreshInventoryMappingCandidates]);

  const activeHistoryEntry = useMemo(
    () =>
      confirmationHistory.find(
        (entry) => entry.meal_slot_id === activeHistoryMealSlotId,
      ) ?? confirmationHistory[0] ?? null,
    [activeHistoryMealSlotId, confirmationHistory],
  );

  const confirmationSummary = useMemo(() => {
    if (!lastConfirmResult) {
      return {
        consumed: 0,
        partial: 0,
        unmapped: 0,
        shortage: 0,
      };
    }

    return lastConfirmResult.consumption_lines.reduce(
      (acc, line) => {
        if (line.inventory_status === "CONSUMED") acc.consumed += 1;
        if (line.inventory_status === "PARTIAL_STOCK") acc.partial += 1;
        if (line.inventory_status === "NO_INVENTORY_ITEM") acc.unmapped += 1;
        if ((line.shortage_qty ?? 0) > 0) acc.shortage += 1;
        return acc;
      },
      {
        consumed: 0,
        partial: 0,
        unmapped: 0,
        shortage: 0,
      },
    );
  }, [lastConfirmResult]);

  const canSubmit = Boolean(
    selectedProfileId.trim() &&
      selectedRecipe?.recipe_id &&
      plannedFor &&
      mealType &&
      !selectedRecipeBlocked,
  );

  const canConfirm = Boolean(effectiveMealSlotId);

  function toggleIntent(code: SearchIntentCode) {
    setSelectedIntentCodes((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code],
    );
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
      setLocalMessage("Repas mis à jour avec la recette personnalisée sélectionnée.");
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
    setLocalMessage("Repas créé avec succès dans Meals V3.");
  }

  async function handleConfirm() {
    if (!effectiveMealSlotId) return;
    setLocalMessage(null);
    await confirmMealSlot(effectiveMealSlotId);
    setLocalMessage(
      "Repas confirmé. Les lignes de consommation, le rebuild shopping et les alertes sont maintenant visibles ci-dessous.",
    );
  }

  async function handleMapCandidate(inventoryItemId: string) {
    if (!activeMappingTarget) return;

    setLocalMessage(null);

    const result = await saveInventoryMapping(
      activeMappingTarget.ingredient_code,
      inventoryItemId,
      mappingNotes,
    );

    setLocalMessage(
      `Mapping enregistré pour ${result.ingredient_code} → ${
        result.item_label || result.item_code || result.inventory_item_id
      }.`,
    );
  }

  function openHistoryEntry(entry: MealExecutionHistoryEntry) {
    setActiveHistoryMealSlotId(entry.meal_slot_id);
    setSelectedMealSlotId(entry.meal_slot_id);

    const matchingSessionMeal = items.find(
      (item) => item.meal_slot_id === entry.meal_slot_id,
    );

    if (matchingSessionMeal) {
      setSelectedProfileId(matchingSessionMeal.profile_id ?? "");
      setSelectedRecipeId(matchingSessionMeal.recipe_id ?? "");
      setMealType(matchingSessionMeal.meal_type);
      setPlannedFor(matchingSessionMeal.planned_for);
      setOperatorNotes(matchingSessionMeal.notes ?? "");
      setLocalMessage("Repas de session rechargé dans le formulaire.");
      return;
    }

    setLocalMessage(
      "Historique local chargé. La relecture détaillée cross-session complète demandera ensuite une RPC back canonique de lecture des meal slots.",
    );
  }

  if (authLoading || bootstrapLoading || loadingProfiles || historyLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-7 text-center">
            <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-gold" />
            <p className="mt-4 text-sm uppercase tracking-[0.25em] text-white/45">
              DOMYLI
            </p>
            <h1 className="mt-2 text-xl font-semibold">Chargement Meals V3...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-10 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-gold" />
            <p className="mt-5 text-sm uppercase tracking-[0.25em] text-gold/80">
              DOMYLI
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Foyer actif requis</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/65">
              Meals V3 exige une session authentifiée, un foyer actif et au moins un
              profil humain meal-ready.
            </p>
            <button
              type="button"
              onClick={() => navigate(ROUTES.HOME)}
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold/30 px-6 py-3 text-sm uppercase tracking-[0.2em] text-gold transition hover:bg-gold hover:text-black"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à l’accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profiles.length) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <button
            type="button"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-white/45 transition hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour dashboard
          </button>

          <div className="mt-10 rounded-[32px] border border-white/10 bg-white/5 p-10">
            <UserRound className="h-10 w-10 text-gold" />
            <p className="mt-5 text-sm uppercase tracking-[0.25em] text-gold/80">
              Meals V3
            </p>
            <h1 className="mt-3 text-3xl font-semibold">
              Aucun profil actif prêt pour Meals
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">
              Complète au moins un profil avec un poids valide pour débloquer la
              personnalisation unipersonnelle des recettes et des quantités.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => navigate(ROUTES.PROFILES)}
                className="inline-flex items-center gap-2 rounded-full border border-gold/30 px-6 py-3 text-sm uppercase tracking-[0.2em] text-gold transition hover:bg-gold hover:text-black"
              >
                Aller aux profils
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-white/45 transition hover:text-gold"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </button>

            <p className="mt-6 text-sm uppercase tracking-[0.28em] text-gold/80">
              DOMYLI · Meals V3.3
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Exécution visible + historique local
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65">
              La page Meals conserve maintenant un historique local persistant des
              confirmations et permet de recharger rapidement un repas déjà manipulé.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">
              Session
            </p>
            <p className="mt-2 text-sm font-medium text-white">
              {sessionEmail ?? "Utilisateur DOMYLI"}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gold/80">
              {activeMembership?.role ?? "MEMBER"}
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-8 rounded-3xl border border-red-400/20 bg-red-500/10 p-5 text-red-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em]">
                  Erreur Meals
                </p>
                <p className="mt-2 text-sm">{error.message}</p>
                {error.hint ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-red-200/80">
                    {error.hint}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {localMessage ? (
          <div className="mt-8 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-emerald-100">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5" />
              <p className="text-sm">{localMessage}</p>
            </div>
          </div>
        ) : null}

        <div className="mt-10 grid gap-8 xl:grid-cols-[1.2fr_1fr]">
          <section className="space-y-8">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-gold/80">
                    Étape 1
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    Choisir la personne
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    void refreshRecipeCandidates(mealType, selectedProfileId, recipeSearch)
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/70 transition hover:border-white/30 hover:text-white"
                >
                  <RefreshCw className="h-4 w-4" />
                  Rafraîchir
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {profiles.map((profile) => {
                  const meta = [
                    profile.weight_kg ? `${profile.weight_kg} kg` : null,
                    profile.goal,
                    profile.activity_level,
                  ]
                    .filter(Boolean)
                    .join(" · ");

                  return (
                    <ProfileCard
                      key={profile.profile_id}
                      isActive={selectedProfileId === profile.profile_id}
                      label={profile.display_name}
                      summary={profile.summary}
                      meta={meta || "Profil meal-ready"}
                      onClick={() => setSelectedProfileId(profile.profile_id)}
                    />
                  );
                })}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-8">
              <div className="flex items-center gap-3">
                <Utensils className="h-5 w-5 text-gold" />
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-gold/80">
                    Étape 2
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    Voir les recettes personnalisées
                  </h2>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr_220px]">
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Type de repas
                  </span>
                  <select
                    value={mealType}
                    onChange={(event) => setMealType(event.target.value as MealType)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-gold/50"
                  >
                    {RECIPE_MEAL_TYPE_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Recherche
                  </span>
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <Search className="h-4 w-4 text-white/35" />
                    <input
                      value={recipeSearch}
                      onChange={(event) => setRecipeSearch(event.target.value)}
                      placeholder="Bowl, transportable, halal, faible sucre..."
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Tri
                  </span>
                  <select
                    value={sortMode}
                    onChange={(event) =>
                      setSortMode(event.target.value as RecipeSortMode)
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-gold/50"
                  >
                    {RECIPE_SORT_MODE_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {getRecipeSortModeLabel(item.value)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {SEARCH_INTENTS.map((intent) => {
                  const isActive = selectedIntentCodes.includes(intent.code);
                  return (
                    <button
                      key={intent.code}
                      type="button"
                      onClick={() => toggleIntent(intent.code)}
                      className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition ${
                        isActive
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-white/10 bg-black/20 text-white/60 hover:border-white/25 hover:text-white"
                      }`}
                    >
                      {intent.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8">
                {candidatesLoading ? (
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-8 text-center text-white/50">
                    <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-gold" />
                    <p className="mt-3 text-sm">Chargement des recettes personnalisées...</p>
                  </div>
                ) : visibleRecipes.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-8 text-center text-white/55">
                    <Sparkles className="mx-auto h-7 w-7 text-gold/80" />
                    <p className="mt-3 text-sm">
                      Aucune recette ne correspond aux filtres actifs pour ce profil.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {visibleRecipes.map((recipe) => (
                      <RecipeCard
                        key={recipe.recipe_id}
                        recipe={recipe}
                        isSelected={selectedRecipeId === recipe.recipe_id}
                        onSelect={() => setSelectedRecipeId(recipe.recipe_id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {confirmationHistory.length > 0 ? (
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-8">
                <div className="flex items-center gap-3">
                  <History className="h-5 w-5 text-gold" />
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-gold/80">
                      Étape 6
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold">
                      Historique local des confirmations
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {confirmationHistory.map((entry) => (
                    <HistoryCard
                      key={entry.meal_slot_id}
                      entry={entry}
                      isActive={activeHistoryMealSlotId === entry.meal_slot_id}
                      onOpen={() => openHistoryEntry(entry)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <aside className="space-y-8">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-8">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-gold" />
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-gold/80">
                    Étape 3
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    Aperçu quantitatif
                  </h2>
                </div>
              </div>

              {previewLoading ? (
                <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-8 text-center text-white/50">
                  <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-gold" />
                  <p className="mt-3 text-sm">Calcul des quantités personnalisées...</p>
                </div>
              ) : selectedRecipe && recipePreview ? (
                <div className="mt-6">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-gold/80">
                      {selectedProfile?.display_name ?? "Profil sélectionné"}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">{recipePreview.title}</h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <ToneBadge label={getRecipeFitStatusLabel(recipePreview.fit_status)} />
                      <ToneBadge label={`Score ${recipePreview.fit_score}`} />
                      <ToneBadge label={`Facteur ${recipePreview.portion_factor.toFixed(2)}x`} />
                    </div>

                    {recipePreview.fit_reasons.length > 0 ? (
                      <div className="mt-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                          Raisons
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-white/70">
                          {recipePreview.fit_reasons.map((reason) => (
                            <li key={reason} className="flex gap-2">
                              <Target className="mt-0.5 h-4 w-4 shrink-0 text-gold/80" />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {recipePreview.warnings.length > 0 ? (
                      <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-amber-100/80">
                          Vigilances
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-amber-50">
                          {recipePreview.warnings.map((warning) => (
                            <li key={warning} className="flex gap-2">
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                              <span>{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                        Ingrédients recalculés
                      </p>
                      <ToneBadge
                        label={`${mappedIngredientCount}/${currentRecipeMappingTargets.length} mappés`}
                        tone={
                          mappedIngredientCount === currentRecipeMappingTargets.length
                            ? "success"
                            : "warning"
                        }
                      />
                    </div>

                    <div className="mt-4">
                      {recipePreview.ingredients.length > 0 ? (
                        recipePreview.ingredients.map((ingredient) => (
                          <IngredientLine
                            key={
                              ingredient.recipe_ingredient_id ??
                              `${ingredient.ingredient_code}-${ingredient.sort_order}`
                            }
                            ingredient={ingredient}
                          />
                        ))
                      ) : (
                        <p className="text-sm text-white/45">
                          Aucun détail ingrédient n’a été renvoyé pour cette recette.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-8 text-center text-white/50">
                  <p className="text-sm">
                    Sélectionne un profil actif puis une recette pour afficher le
                    preview quantitatif Meals V3.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-8">
              <div className="flex items-center gap-3">
                <Link2 className="h-5 w-5 text-gold" />
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-gold/80">
                    Étape 3B
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    Mapping inventaire
                  </h2>
                </div>
              </div>

              {recipePreview?.ingredients.length ? (
                <div className="mt-6">
                  <div className="grid gap-3">
                    {currentRecipeMappingTargets.map((target) => (
                      <MappingStatusCard
                        key={target.ingredient_code}
                        target={target}
                        isActive={activeMappingIngredientCode === target.ingredient_code}
                        onSelect={() => setActiveMappingIngredientCode(target.ingredient_code)}
                      />
                    ))}
                  </div>

                  {activeMappingTarget ? (
                    <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                        Ingrédient actif
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">
                        {activeMappingTarget.ingredient_label}
                      </h3>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gold/80">
                        {activeMappingTarget.ingredient_code}
                      </p>

                      <label className="mt-5 block">
                        <span className="text-xs uppercase tracking-[0.18em] text-white/45">
                          Recherche article stock
                        </span>
                        <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                          <Search className="h-4 w-4 text-white/35" />
                          <input
                            value={mappingSearch}
                            onChange={(event) => setMappingSearch(event.target.value)}
                            placeholder="huile, tomate, quinoa, sel..."
                            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                          />
                        </div>
                      </label>

                      <label className="mt-4 block">
                        <span className="text-xs uppercase tracking-[0.18em] text-white/45">
                          Note mapping
                        </span>
                        <input
                          value={mappingNotes}
                          onChange={(event) => setMappingNotes(event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-gold/50"
                          placeholder="Ex. mapping manuel validé"
                        />
                      </label>

                      <div className="mt-4 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            void refreshInventoryMappingCandidates(mappingSearch)
                          }
                          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/70 transition hover:border-white/30 hover:text-white"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Rechercher
                        </button>

                        {lastInventoryMappingResult?.ingredient_code ===
                        activeMappingTarget.ingredient_code ? (
                          <ToneBadge label="Dernier mapping enregistré" tone="success" />
                        ) : null}
                      </div>

                      <div className="mt-5">
                        {mappingCandidatesLoading ? (
                          <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-center text-white/50">
                            <LoaderCircle className="mx-auto h-5 w-5 animate-spin text-gold" />
                            <p className="mt-3 text-sm">Recherche des candidats stock...</p>
                          </div>
                        ) : inventoryMappingCandidates.length > 0 ? (
                          <div className="space-y-3">
                            {inventoryMappingCandidates.map((candidate) => (
                              <button
                                key={candidate.inventory_item_id}
                                type="button"
                                onClick={() =>
                                  void handleMapCandidate(candidate.inventory_item_id)
                                }
                                disabled={mappingSaving}
                                className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-left transition hover:border-gold/35 hover:bg-black/40 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="text-sm font-semibold text-white">
                                      {candidate.item_label}
                                    </p>
                                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">
                                      {candidate.item_code || "Sans code article"}
                                    </p>
                                  </div>
                                  <ToneBadge
                                    label={
                                      candidate.qty_on_hand != null
                                        ? `${candidate.qty_on_hand} dispo`
                                        : "Stock inconnu"
                                    }
                                  />
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-white/45">
                            Aucun candidat stock trouvé pour cette recherche.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-8 text-center text-white/50">
                  <p className="text-sm">
                    Le mapping inventaire s’active dès qu’une recette affiche ses
                    ingrédients recalculés.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-8">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-gold" />
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-gold/80">
                    Étape 4
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    Créer ou confirmer
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Date
                  </span>
                  <input
                    type="date"
                    value={plannedFor}
                    onChange={(event) => setPlannedFor(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-gold/50"
                  />
                </label>

                <label className="block">
                  <span className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Notes opérateur
                  </span>
                  <textarea
                    value={operatorNotes}
                    onChange={(event) => setOperatorNotes(event.target.value)}
                    rows={5}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-gold/50"
                    placeholder="Contexte, préférence, précision utile..."
                  />
                </label>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Résumé
                  </p>
                  <div className="mt-4 space-y-3 text-sm text-white/75">
                    <div className="flex items-center justify-between gap-4">
                      <span>Profil</span>
                      <span className="text-right font-medium text-white">
                        {selectedProfile?.display_name ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Recette</span>
                      <span className="text-right font-medium text-white">
                        {selectedRecipe?.title ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Repas</span>
                      <span className="text-right font-medium text-white">
                        {
                          RECIPE_MEAL_TYPE_OPTIONS.find((item) => item.value === mealType)
                            ?.label
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Meal slot</span>
                      <span className="text-right font-medium text-gold">
                        {effectiveMealSlotId || "Nouveau"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Mapping stock</span>
                      <span className="text-right font-medium text-white">
                        {mappedIngredientCount}/{currentRecipeMappingTargets.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => void handleCreateOrUpdate()}
                    disabled={!canSubmit || saving}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/30 px-6 py-3 text-sm uppercase tracking-[0.2em] text-gold transition hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {effectiveMealSlotId ? "Mettre à jour le repas" : "Créer le repas"}
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleConfirm()}
                    disabled={!canConfirm || confirming}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm uppercase tracking-[0.2em] text-white/75 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {confirming ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Confirmer le repas
                  </button>
                </div>
              </div>
            </div>

            {lastConfirmResult ? (
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-gold/80">
                      Étape 5
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">
                      Exécution confirmée
                    </h2>
                  </div>
                  <ToneBadge
                    label={lastConfirmResult.status ?? "CONFIRMED"}
                    tone="success"
                  />
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                      Consommés
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-emerald-100">
                      {confirmationSummary.consumed}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                      Partiels
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-amber-100">
                      {confirmationSummary.partial}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                      Non mappés
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-red-100">
                      {confirmationSummary.unmapped}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                      Rebuild shopping
                    </p>
                    <div className="mt-3">
                      <ToneBadge
                        label={
                          lastConfirmResult.shopping_rebuild_status ??
                          "NON_RENSEIGNÉ"
                        }
                        tone={getShoppingStatusTone(
                          lastConfirmResult.shopping_rebuild_status,
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                      Alertes synchronisées
                    </p>
                    <ToneBadge
                      label={`${lastConfirmResult.alerts.length} alertes`}
                      tone={
                        lastConfirmResult.alerts.length > 0 ? "warning" : "default"
                      }
                    />
                  </div>

                  {lastConfirmResult.alerts.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {lastConfirmResult.alerts.map((alert) => (
                        <div
                          key={`${alert.ingredient_code}-${alert.inventory_item_id ?? "none"}`}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                        >
                          <p className="text-sm font-semibold text-white">
                            {alert.ingredient_code}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gold/80">
                            {alert.alert_sync_status ?? "Statut non renseigné"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-white/45">
                      Aucune alerte renvoyée pour cette confirmation.
                    </p>
                  )}
                </div>

                <div className="mt-6">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Lignes de consommation
                  </p>
                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {lastConfirmResult.consumption_lines.map((line) => (
                      <ConsumptionLineCard
                        key={`${line.ingredient_code}-${line.inventory_item_id ?? "none"}`}
                        line={line}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {activeHistoryEntry ? (
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-8">
                <div className="flex items-center gap-3">
                  <History className="h-5 w-5 text-gold" />
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-gold/80">
                      Étape 7
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold">
                      Relecture d’une confirmation
                    </h2>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Meal slot
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {activeHistoryEntry.meal_slot_id}
                  </p>

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                        Titre
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {activeHistoryEntry.title ?? "Repas DOMYLI"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                        Confirmé le
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {formatDateTime(activeHistoryEntry.confirmed_at)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                        Lignes
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {activeHistoryEntry.consumption_line_count}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                        Shopping
                      </p>
                      <div className="mt-2">
                        <ToneBadge
                          label={
                            activeHistoryEntry.shopping_rebuild_status ??
                            "NON_RENSEIGNÉ"
                          }
                          tone={getShoppingStatusTone(
                            activeHistoryEntry.shopping_rebuild_status,
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <ToneBadge
                      label={`${activeHistoryEntry.consumed_count} consommés`}
                      tone="success"
                    />
                    {activeHistoryEntry.partial_count > 0 ? (
                      <ToneBadge
                        label={`${activeHistoryEntry.partial_count} partiels`}
                        tone="warning"
                      />
                    ) : null}
                    {activeHistoryEntry.unmapped_count > 0 ? (
                      <ToneBadge
                        label={`${activeHistoryEntry.unmapped_count} non mappés`}
                        tone="danger"
                      />
                    ) : null}
                    {activeHistoryEntry.alert_count > 0 ? (
                      <ToneBadge
                        label={`${activeHistoryEntry.alert_count} alertes`}
                        tone="warning"
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {items.length > 0 ? (
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-8">
                <p className="text-sm uppercase tracking-[0.25em] text-gold/80">
                  Session
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Repas manipulés dans cette session
                </h2>

                <div className="mt-6 space-y-3">
                  {items.map((item) => (
                    <button
                      key={item.meal_slot_id}
                      type="button"
                      onClick={() => {
                        setSelectedMealSlotId(item.meal_slot_id);
                        setSelectedProfileId(item.profile_id ?? "");
                        setSelectedRecipeId(item.recipe_id ?? "");
                        setMealType(item.meal_type);
                        setPlannedFor(item.planned_for);
                        setOperatorNotes(item.notes ?? "");
                      }}
                      className={`w-full rounded-3xl border p-4 text-left transition ${
                        effectiveMealSlotId === item.meal_slot_id
                          ? "border-gold bg-gold/10"
                          : "border-white/10 bg-black/20 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                            {item.meal_slot_id}
                          </p>
                          <h3 className="mt-2 text-sm font-semibold text-white">
                            {item.title ?? "Repas DOMYLI"}
                          </h3>
                          <p className="mt-2 text-xs text-white/60">
                            {item.planned_for} · {item.meal_type}
                          </p>
                        </div>
                        <ToneBadge label={item.status ?? "PLANNED"} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}