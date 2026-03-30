import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Users,
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
import type { MealType, RecipeCandidate } from "@/src/services/meals/mealService";

type ProjectionMode = "NEUTRAL" | "HOUSEHOLD" | "TARGETED";

type SearchIntent = {
  code:
    | "FAST"
    | "FAMILY"
    | "PROTEIN"
    | "HALAL"
    | "NO_PORK"
    | "CHILD"
    | "BATCH"
    | "LIGHT"
    | "TRANSPORTABLE"
    | "FRESH";
  label: string;
};

type RecentProfileTarget = {
  profileId: string;
  profileLabel: string;
  lastMealType: MealType;
  lastUsedAt: string;
};

const PROFILE_STORAGE_KEY = "domyli:meals:recent-profile-targets:v2";
const QUERY_PLACEHOLDERS: Record<MealType, string> = {
  BREAKFAST: "Rapide, protéiné, enfant, sans porc, matin doux...",
  LUNCH: "Batch, bureau, halal, riche en protéines, transportable...",
  SNACK: "Léger, satiété, enfant, rapide, transportable...",
  DINNER: "Famille, simple, léger, stock, soirée calme...",
};

const SEARCH_INTENTS: SearchIntent[] = [
  { code: "FAST", label: "Rapide" },
  { code: "FAMILY", label: "Foyer" },
  { code: "PROTEIN", label: "Protéiné" },
  { code: "HALAL", label: "Halal" },
  { code: "NO_PORK", label: "Sans porc" },
  { code: "CHILD", label: "Enfant" },
  { code: "BATCH", label: "Batch" },
  { code: "LIGHT", label: "Léger" },
  { code: "TRANSPORTABLE", label: "Transportable" },
  { code: "FRESH", label: "Frais" },
];

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function readRecentProfileTargets(): RecentProfileTarget[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as RecentProfileTarget[];

    return Array.isArray(parsed)
      ? parsed
          .filter(
            (item) =>
              typeof item?.profileId === "string" &&
              item.profileId.trim() &&
              typeof item?.profileLabel === "string" &&
              item.profileLabel.trim(),
          )
          .slice(0, 8)
      : [];
  } catch {
    return [];
  }
}

function writeRecentProfileTargets(items: RecentProfileTarget[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify(items.slice(0, 8)),
    );
  } catch {
    // no-op
  }
}

function upsertRecentProfileTarget(
  currentItems: RecentProfileTarget[],
  nextItem: RecentProfileTarget,
): RecentProfileTarget[] {
  const filtered = currentItems.filter(
    (item) => item.profileId !== nextItem.profileId,
  );

  return [nextItem, ...filtered]
    .sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt))
    .slice(0, 8);
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getRecipeSearchDocument(recipe: RecipeCandidate): string {
  return normalizeText(
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
}

function recipeHasTag(recipe: RecipeCandidate, code: string): boolean {
  return recipe.tags.some((tag) => tag.code.toUpperCase() === code);
}

function recipeMatchesIntent(recipe: RecipeCandidate, intentCode: SearchIntent["code"]): boolean {
  switch (intentCode) {
    case "FAST":
      return recipe.prep_minutes + recipe.cook_minutes <= 20;
    case "FAMILY":
      return (
        recipeHasTag(recipe, "FAMILY") ||
        recipeHasTag(recipe, "KID") ||
        recipe.default_servings >= 3
      );
    case "PROTEIN":
      return recipeHasTag(recipe, "PROTEIN");
    case "HALAL":
      return recipeHasTag(recipe, "HALAL_OK");
    case "NO_PORK":
      return recipeHasTag(recipe, "NO_PORK");
    case "CHILD":
      return recipeHasTag(recipe, "KID");
    case "BATCH":
      return recipeHasTag(recipe, "BATCH");
    case "LIGHT":
      return (
        recipeHasTag(recipe, "LOW_SUGAR") ||
        recipeHasTag(recipe, "FIBER") ||
        recipe.stock_intensity === "LOW"
      );
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

function sortRecipes(recipes: RecipeCandidate[], sortMode: RecipeSortMode): RecipeCandidate[] {
  const cloned = [...recipes];

  cloned.sort((a, b) => {
    if (sortMode === "FAST") {
      const aTime = a.prep_minutes + a.cook_minutes;
      const bTime = b.prep_minutes + b.cook_minutes;
      return aTime - bTime || b.fit.fit_score - a.fit.fit_score || a.title.localeCompare(b.title, "fr");
    }

    if (sortMode === "STOCK") {
      return (
        getStockWeight(a.stock_intensity) - getStockWeight(b.stock_intensity) ||
        b.fit.fit_score - a.fit.fit_score ||
        a.title.localeCompare(b.title, "fr")
      );
    }

    if (sortMode === "FAMILY") {
      const aFamily = recipeHasTag(a, "FAMILY") || recipeHasTag(a, "KID") ? 1 : 0;
      const bFamily = recipeHasTag(b, "FAMILY") || recipeHasTag(b, "KID") ? 1 : 0;

      return (
        bFamily - aFamily ||
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

function buildMealNotes(
  recipe: RecipeCandidate,
  operatorNotes: string,
  projectionMode: ProjectionMode,
  profileLabel: string,
  searchIntentCodes: SearchIntent["code"][],
  sortMode: RecipeSortMode,
): string {
  const lines = [
    "[DOMYLI_RECIPE_SELECTION]",
    `recipe_id=${recipe.recipe_id}`,
    `recipe_code=${recipe.recipe_code}`,
    `fit_status=${recipe.fit.fit_status}`,
    `fit_score=${recipe.fit.fit_score}`,
    `default_servings=${recipe.default_servings}`,
    `prep_minutes=${recipe.prep_minutes}`,
    `cook_minutes=${recipe.cook_minutes}`,
    "[/DOMYLI_RECIPE_SELECTION]",
    "",
    "[DOMYLI_MEAL_PROJECTION]",
    `projection_mode=${projectionMode}`,
    `projection_label=${profileLabel || "Compatibilite neutre du foyer"}`,
    `selection_mode=${sortMode}`,
    `intent_filters=${searchIntentCodes.join("|") || "NONE"}`,
    "[/DOMYLI_MEAL_PROJECTION]",
  ];

  if (operatorNotes.trim()) {
    lines.push("", "[DOMYLI_OPERATOR_NOTES]", operatorNotes.trim(), "[/DOMYLI_OPERATOR_NOTES]");
  }

  return lines.join("\n");
}

function getProjectionHeadline(mode: ProjectionMode, label: string): string {
  if (mode === "TARGETED") {
    return label.trim() || "Profil ciblé à confirmer";
  }

  if (mode === "HOUSEHOLD") {
    return "Repas pensé pour le foyer";
  }

  return "Compatibilité neutre du foyer";
}

function getProjectionDescription(mode: ProjectionMode): string {
  if (mode === "TARGETED") {
    return "DOMYLI projette les recettes sur un profil humain précis dès qu’un profil lié est fourni.";
  }

  if (mode === "HOUSEHOLD") {
    return "DOMYLI privilégie les recettes plus consensuelles, simples et utilisables pour plusieurs personnes.";
  }

  return "DOMYLI n’applique pas de contrainte profil précise et affiche la lecture la plus neutre.";
}

function ModeCard({
  isActive,
  icon,
  title,
  description,
  onClick,
}: {
  isActive: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition-colors ${
        isActive
          ? "border-gold/50 bg-gold/10"
          : "border-white/10 bg-white/[0.03] hover:border-gold/30"
      }`}
    >
      <div className="inline-flex items-center gap-2 text-gold">{icon}</div>
      <p className="mt-3 text-sm font-medium text-white">{title}</p>
      <p className="mt-2 text-xs leading-6 text-white/60">{description}</p>
    </button>
  );
}

function MetaBadge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "warning" | "danger";
}) {
  const className =
    tone === "danger"
      ? "border-red-400/20 bg-red-400/10 text-red-100"
      : tone === "warning"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-100"
        : "border-gold/20 bg-gold/10 text-gold";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${className}`}
    >
      {label}
    </span>
  );
}

export default function MealsPage() {
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
    saving,
    confirming,
    candidatesLoading,
    error,
    items,
    recipeCandidates,
    lastCreatedMealSlotId,
    lastUpdatedMealSlotId,
    lastConfirmResult,
    createMeal,
    updateMeal,
    confirmMealSlot,
    refreshRecipeCandidates,
  } = useMeals();

  const [selectedMealSlotId, setSelectedMealSlotId] = useState("");
  const [plannedFor, setPlannedFor] = useState(todayIsoDate());
  const [mealType, setMealType] = useState<MealType>("LUNCH");
  const [projectionMode, setProjectionMode] = useState<ProjectionMode>("NEUTRAL");
  const [profileLabel, setProfileLabel] = useState("");
  const [profileId, setProfileId] = useState("");
  const [showProfileIdentifier, setShowProfileIdentifier] = useState(false);
  const [recentProfiles, setRecentProfiles] = useState<RecentProfileTarget[]>([]);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [selectedIntentCodes, setSelectedIntentCodes] = useState<SearchIntent["code"][]>([]);
  const [sortMode, setSortMode] = useState<RecipeSortMode>("COMPATIBILITY");
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [operatorNotes, setOperatorNotes] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  useEffect(() => {
    setRecentProfiles(readRecentProfileTargets());
  }, []);

  const effectiveProfileId = useMemo(() => {
    if (projectionMode !== "TARGETED") return "";
    return profileId.trim();
  }, [profileId, projectionMode]);

  useEffect(() => {
    void refreshRecipeCandidates(mealType, effectiveProfileId);
  }, [effectiveProfileId, mealType, refreshRecipeCandidates]);

  const isEditMode = useMemo(() => Boolean(selectedMealSlotId), [selectedMealSlotId]);

  const filteredRecipes = useMemo(() => {
    const normalizedSearch = normalizeText(recipeSearch.trim());

    return recipeCandidates.filter((recipe) => {
      if (normalizedSearch) {
        const searchDocument = getRecipeSearchDocument(recipe);
        if (!searchDocument.includes(normalizedSearch)) {
          return false;
        }
      }

      if (projectionMode === "HOUSEHOLD") {
        const householdFriendly =
          recipeHasTag(recipe, "FAMILY") ||
          recipeHasTag(recipe, "KID") ||
          recipe.default_servings >= 3;

        if (!householdFriendly) {
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
  }, [projectionMode, recipeCandidates, recipeSearch, selectedIntentCodes]);

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

  const canSubmit = useMemo(() => {
    return Boolean(plannedFor && mealType && selectedRecipe);
  }, [plannedFor, mealType, selectedRecipe]);

  if (authLoading || bootstrapLoading) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-semibold">Chargement des repas...</h1>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-semibold">Foyer requis</h1>
          <p className="mt-3 text-white/70">
            Il faut une session authentifiée et un foyer actif pour accéder aux repas.
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

  const resetForm = () => {
    setSelectedMealSlotId("");
    setPlannedFor(todayIsoDate());
    setMealType("LUNCH");
    setProjectionMode("NEUTRAL");
    setProfileLabel("");
    setProfileId("");
    setShowProfileIdentifier(false);
    setRecipeSearch("");
    setSelectedIntentCodes([]);
    setSortMode("COMPATIBILITY");
    setSelectedRecipeId("");
    setOperatorNotes("");
    setLocalMessage(null);
  };

  const handleMealTypeChange = (nextType: MealType) => {
    setMealType(nextType);
    setSelectedRecipeId("");
    setRecipeSearch("");
    setLocalMessage(null);
  };

  const toggleIntent = (intentCode: SearchIntent["code"]) => {
    setSelectedIntentCodes((prev) =>
      prev.includes(intentCode)
        ? prev.filter((code) => code !== intentCode)
        : [...prev, intentCode],
    );
  };

  const applyRecentProfile = (recentProfile: RecentProfileTarget) => {
    setProjectionMode("TARGETED");
    setProfileLabel(recentProfile.profileLabel);
    setProfileId(recentProfile.profileId);
    setShowProfileIdentifier(true);
    setLocalMessage(`Projection ciblée chargée : ${recentProfile.profileLabel}`);
  };

  const handleEdit = (mealSlotId: string) => {
    const meal = items.find((item) => item.meal_slot_id === mealSlotId);
    if (!meal) return;

    setSelectedMealSlotId(meal.meal_slot_id);
    setPlannedFor(meal.planned_for);
    setMealType(meal.meal_type);
    setProjectionMode(meal.profile_id ? "TARGETED" : "NEUTRAL");
    setProfileId(meal.profile_id ?? "");
    setSelectedRecipeId(meal.recipe_id ?? "");
    setOperatorNotes("");
    setLocalMessage(`Édition du repas : ${meal.meal_slot_id}`);
  };

  const persistRecentProfile = () => {
    if (projectionMode !== "TARGETED") return;
    if (!profileId.trim()) return;
    if (!profileLabel.trim()) return;

    const nextItem: RecentProfileTarget = {
      profileId: profileId.trim(),
      profileLabel: profileLabel.trim(),
      lastMealType: mealType,
      lastUsedAt: new Date().toISOString(),
    };

    const nextItems = upsertRecentProfileTarget(recentProfiles, nextItem);
    setRecentProfiles(nextItems);
    writeRecentProfileTargets(nextItems);
  };

  const handleCreateOrUpdate = async () => {
    setLocalMessage(null);

    if (!plannedFor) {
      setLocalMessage("La date est obligatoire.");
      return;
    }

    if (!mealType) {
      setLocalMessage("Le type de repas est obligatoire.");
      return;
    }

    if (projectionMode === "TARGETED" && !profileId.trim()) {
      setLocalMessage(
        "Pour une projection ciblée, sélectionne un profil récent ou renseigne l’identifiant du profil DOMYLI lié.",
      );
      return;
    }

    if (!selectedRecipe) {
      setLocalMessage("Sélectionne une recette publiée DOMYLI.");
      return;
    }

    try {
      const notes = buildMealNotes(
        selectedRecipe,
        operatorNotes,
        projectionMode,
        profileLabel,
        selectedIntentCodes,
        sortMode,
      );

      if (isEditMode) {
        const mealSlotId = await updateMeal({
          p_meal_slot_id: selectedMealSlotId,
          p_planned_for: plannedFor,
          p_meal_type: mealType,
          p_profile_id: effectiveProfileId || null,
          p_recipe_id: selectedRecipe.recipe_id,
          p_title: selectedRecipe.title,
          p_notes: notes,
        });

        persistRecentProfile();
        setLocalMessage(`Repas mis à jour : ${mealSlotId}`);
      } else {
        const mealSlotId = await createMeal({
          p_planned_for: plannedFor,
          p_meal_type: mealType,
          p_profile_id: effectiveProfileId || null,
          p_recipe_id: selectedRecipe.recipe_id,
          p_title: selectedRecipe.title,
          p_notes: notes,
        });

        persistRecentProfile();
        setSelectedMealSlotId(mealSlotId);
        setLocalMessage(`Repas créé : ${mealSlotId}`);
      }
    } catch {
      // erreur déjà normalisée dans le hook
    }
  };

  const handleConfirm = async (mealSlotId: string) => {
    setLocalMessage(null);

    try {
      const result = await confirmMealSlot(mealSlotId);
      setLocalMessage(
        `Repas confirmé : ${result.meal_slot_id ?? mealSlotId} (${result.status ?? "CONFIRMED"})`,
      );
    } catch {
      // erreur déjà normalisée dans le hook
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
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
                <p className="text-xs uppercase tracking-[0.24em] text-gold">DOMYLI</p>
                <h1 className="mt-4 text-3xl font-semibold">Meals</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                  Ici, DOMYLI transforme une intention de repas en sélection structurée :
                  pour qui, dans quel contexte, avec quel niveau de compatibilité et
                  quelle recette publiée réellement exploitable.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 rounded-[24px] border border-white/10 bg-black/20 p-5 lg:grid-cols-[0.95fr_1.05fr]">
              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Date</span>
                <input
                  type="date"
                  value={plannedFor}
                  onChange={(event) => setPlannedFor(event.target.value)}
                  className="w-full border border-white/10 bg-black/30 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </label>

              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Type de repas</span>
                <select
                  value={mealType}
                  onChange={(event) =>
                    handleMealTypeChange(event.target.value as MealType)
                  }
                  className="w-full border border-white/10 bg-black/30 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  {RECIPE_MEAL_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-8 rounded-[24px] border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-3 text-gold">
                <Target className="h-5 w-5" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em]">Pour qui est ce repas ?</p>
                  <p className="mt-1 text-sm text-white/60">
                    DOMYLI guide la projection au lieu de te laisser un champ technique vide.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <ModeCard
                  isActive={projectionMode === "NEUTRAL"}
                  icon={<ShieldCheck className="h-4 w-4" />}
                  title="Compatibilité neutre"
                  description="Lecture simple du foyer, sans profil spécifique."
                  onClick={() => setProjectionMode("NEUTRAL")}
                />

                <ModeCard
                  isActive={projectionMode === "HOUSEHOLD"}
                  icon={<Users className="h-4 w-4" />}
                  title="Repas foyer"
                  description="DOMYLI privilégie les recettes plus consensuelles et partageables."
                  onClick={() => setProjectionMode("HOUSEHOLD")}
                />

                <ModeCard
                  isActive={projectionMode === "TARGETED"}
                  icon={<UserRound className="h-4 w-4" />}
                  title="Profil ciblé"
                  description="DOMYLI projette la compatibilité sur un profil humain précis."
                  onClick={() => setProjectionMode("TARGETED")}
                />
              </div>

              {projectionMode === "TARGETED" && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <label className="block text-sm text-white/80">
                      <span className="mb-2 block">Nom visible du profil</span>
                      <input
                        value={profileLabel}
                        onChange={(event) => setProfileLabel(event.target.value)}
                        placeholder="Ex: Mina — diabète — halal"
                        className="w-full border border-white/10 bg-black/30 px-4 py-4 text-sm outline-none focus:border-gold/50"
                      />
                    </label>

                    <div className="text-sm text-white/80">
                      <span className="mb-2 block">Profils récents</span>
                      <div className="flex min-h-[58px] flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/30 p-3">
                        {recentProfiles.length === 0 ? (
                          <p className="text-sm text-white/45">
                            Aucun profil récent. Le premier repas ciblé sera mémorisé ici.
                          </p>
                        ) : (
                          recentProfiles.map((recentProfile) => (
                            <button
                              key={recentProfile.profileId}
                              type="button"
                              onClick={() => applyRecentProfile(recentProfile)}
                              className="rounded-full border border-gold/20 bg-gold/10 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-gold transition-colors hover:border-gold/40"
                            >
                              {recentProfile.profileLabel}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowProfileIdentifier((prev) => !prev)}
                    className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-gold/80 transition-colors hover:text-gold"
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${showProfileIdentifier ? "rotate-180" : ""}`} />
                    Profil déjà lié dans DOMYLI
                  </button>

                  {showProfileIdentifier && (
                    <label className="mt-4 block text-sm text-white/80">
                      <span className="mb-2 block">Identifiant du profil DOMYLI</span>
                      <input
                        value={profileId}
                        onChange={(event) => setProfileId(event.target.value)}
                        placeholder="UUID du profil humain lié"
                        className="w-full border border-white/10 bg-black/30 px-4 py-4 text-sm outline-none focus:border-gold/50"
                      />
                      <p className="mt-2 text-xs leading-6 text-white/45">
                        Ce champ n’apparaît que si tu vises une projection réellement personnalisée.
                      </p>
                    </label>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 rounded-[24px] border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-3 text-gold">
                <Sparkles className="h-5 w-5" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em]">Décris l’intention du repas</p>
                  <p className="mt-1 text-sm text-white/60">
                    DOMYLI filtre les recettes comme un moteur domestique, pas comme une simple barre de recherche.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Recherche guidée</span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                    <input
                      value={recipeSearch}
                      onChange={(event) => setRecipeSearch(event.target.value)}
                      placeholder={QUERY_PLACEHOLDERS[mealType]}
                      className="w-full border border-white/10 bg-black/30 py-4 pl-11 pr-4 text-sm outline-none focus:border-gold/50"
                    />
                  </div>
                </label>

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Angle de sélection</span>
                  <select
                    value={sortMode}
                    onChange={(event) =>
                      setSortMode(event.target.value as RecipeSortMode)
                    }
                    className="w-full border border-white/10 bg-black/30 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  >
                    {RECIPE_SORT_MODE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {SEARCH_INTENTS.map((intent) => {
                  const isActive = selectedIntentCodes.includes(intent.code);

                  return (
                    <button
                      key={intent.code}
                      type="button"
                      onClick={() => toggleIntent(intent.code)}
                      className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                        isActive
                          ? "border-gold/50 bg-gold/10 text-gold"
                          : "border-white/10 bg-white/[0.03] text-white/70 hover:border-gold/30 hover:text-gold"
                      }`}
                    >
                      {intent.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 rounded-[24px] border border-white/10 bg-black/20 p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-3 text-gold/85">
                  <Utensils className="h-5 w-5" />
                  <span className="text-sm">
                    {visibleRecipes.length} recette(s) candidate(s) pour {mealType}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => void refreshRecipeCandidates(mealType, effectiveProfileId)}
                  className="inline-flex items-center gap-2 border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/75 transition-colors hover:border-gold/40 hover:text-gold"
                >
                  <RefreshCw className="h-4 w-4" />
                  Recharger
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {candidatesLoading ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/60">
                    Chargement des recettes candidates...
                  </div>
                ) : visibleRecipes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/60">
                    Aucune recette candidate pour cette intention.
                  </div>
                ) : (
                  visibleRecipes.slice(0, 18).map((recipe) => {
                    const fitTone =
                      recipe.fit.fit_status === "BLOCKED"
                        ? "danger"
                        : recipe.fit.fit_status === "WARNING"
                          ? "warning"
                          : "default";

                    const isSelected = selectedRecipeId === recipe.recipe_id;

                    return (
                      <button
                        key={recipe.recipe_id}
                        type="button"
                        onClick={() => setSelectedRecipeId(recipe.recipe_id)}
                        className={`block w-full rounded-2xl border p-5 text-left transition-colors ${
                          isSelected
                            ? "border-gold/50 bg-gold/10"
                            : "border-white/10 bg-white/[0.03] hover:border-gold/30"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-lg font-medium text-white">{recipe.title}</p>
                            <p className="mt-2 text-sm leading-7 text-white/70">
                              {recipe.short_description}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <MetaBadge
                              label={getRecipeFitStatusLabel(recipe.fit.fit_status)}
                              tone={fitTone}
                            />
                            <MetaBadge label={getRecipeDifficultyLabel(recipe.difficulty)} />
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <MetaBadge label={`${recipe.prep_minutes + recipe.cook_minutes} min`} />
                          <MetaBadge label={`${recipe.default_servings} portions`} />
                          <MetaBadge label={getRecipeStockIntensityLabel(recipe.stock_intensity)} />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-8 rounded-[24px] border border-white/10 bg-black/20 p-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-gold">
                    Recette sélectionnée
                  </p>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    {selectedRecipe ? (
                      <>
                        <p className="text-lg font-medium text-white">{selectedRecipe.title}</p>
                        <p className="mt-3 text-sm leading-7 text-white/70">
                          {selectedRecipe.short_description}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <MetaBadge
                            label={getRecipeFitStatusLabel(selectedRecipe.fit.fit_status)}
                            tone={
                              selectedRecipe.fit.fit_status === "BLOCKED"
                                ? "danger"
                                : selectedRecipe.fit.fit_status === "WARNING"
                                  ? "warning"
                                  : "default"
                            }
                          />
                          {selectedRecipe.tags.slice(0, 4).map((tag) => (
                            <MetaBadge key={tag.code} label={tag.label} />
                          ))}
                        </div>

                        {(selectedRecipe.fit.warnings.length > 0 ||
                          selectedRecipe.fit.blocked_reasons.length > 0) && (
                          <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-50">
                            <p className="mb-2 text-xs uppercase tracking-[0.2em]">
                              Lecture compatibilité
                            </p>

                            {selectedRecipe.fit.warnings.map((warning) => (
                              <p key={warning}>• {warning}</p>
                            ))}

                            {selectedRecipe.fit.blocked_reasons.map((reason) => (
                              <p key={reason}>• {reason}</p>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-white/60">
                        Sélectionne une recette publiée DOMYLI pour construire le repas.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-gold">
                    Note foyer optionnelle
                  </p>

                  <textarea
                    value={operatorNotes}
                    onChange={(event) => setOperatorNotes(event.target.value)}
                    rows={8}
                    placeholder="Ex: utiliser en priorité les produits frais déjà ouverts."
                    className="mt-4 w-full resize-none border border-white/10 bg-black/30 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />

                  <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleCreateOrUpdate}
                      disabled={!canSubmit || saving}
                      className="inline-flex items-center justify-center gap-3 bg-gold px-6 py-4 text-sm uppercase tracking-[0.25em] text-black transition hover:opacity-90 disabled:opacity-50"
                    >
                      {isEditMode ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {saving
                        ? "Enregistrement..."
                        : isEditMode
                          ? "Mettre à jour le repas"
                          : "Créer le repas"}
                    </button>

                    {isEditMode && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-white/80 transition-colors hover:border-gold/40 hover:text-gold"
                      >
                        Réinitialiser
                      </button>
                    )}
                  </div>

                  {(lastCreatedMealSlotId || lastUpdatedMealSlotId || lastConfirmResult) && (
                    <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                      {lastCreatedMealSlotId ? <p>Dernier repas créé : {lastCreatedMealSlotId}</p> : null}
                      {lastUpdatedMealSlotId ? <p>Dernier repas mis à jour : {lastUpdatedMealSlotId}</p> : null}
                      {lastConfirmResult?.meal_slot_id ? (
                        <p>
                          Dernière confirmation : {lastConfirmResult.meal_slot_id} ({lastConfirmResult.status})
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {items.length > 0 && (
              <div className="mt-8 rounded-[24px] border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-3 text-gold">
                  <CalendarDays className="h-5 w-5" />
                  <p className="text-xs uppercase tracking-[0.24em]">Repas manipulés dans cette session</p>
                </div>

                <div className="mt-5 space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.meal_slot_id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-sm uppercase tracking-[0.24em] text-gold">
                            {item.meal_type} · {item.planned_for}
                          </p>
                          <p className="mt-2 text-lg font-medium text-white">
                            {item.title ?? "Repas DOMYLI"}
                          </p>
                          <p className="mt-2 text-sm text-white/60">
                            Slot : {item.meal_slot_id}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => handleEdit(item.meal_slot_id)}
                            className="border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/75 transition-colors hover:border-gold/40 hover:text-gold"
                          >
                            Éditer
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleConfirm(item.meal_slot_id)}
                            disabled={confirming}
                            className="inline-flex items-center gap-2 border border-gold/40 px-4 py-2 text-xs uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold hover:text-black disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Confirmer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(localMessage || error?.message) && (
              <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-white/85">
                {localMessage ?? error?.message}
              </div>
            )}
          </section>

          <aside className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/70">
              <ShieldCheck className="h-4 w-4" />
              Lecture DOMYLI
            </div>

            <div className="mt-8 space-y-5">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Email</p>
                <p className="mt-2 text-sm text-white/85">{sessionEmail ?? "—"}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Foyer actif</p>
                <p className="mt-2 text-sm text-white/85">
                  {activeMembership?.household_name ?? "—"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Projection repas</p>
                <p className="mt-2 text-sm text-white/85">
                  {getProjectionHeadline(projectionMode, profileLabel)}
                </p>
                <p className="mt-2 text-sm leading-7 text-white/55">
                  {getProjectionDescription(projectionMode)}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Angle de sélection</p>
                <p className="mt-2 text-sm text-white/85">{getRecipeSortModeLabel(sortMode)}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedIntentCodes.length === 0 ? (
                    <MetaBadge label="Aucune contrainte active" />
                  ) : (
                    selectedIntentCodes.map((intentCode) => {
                      const intent = SEARCH_INTENTS.find((item) => item.code === intentCode);
                      return <MetaBadge key={intentCode} label={intent?.label ?? intentCode} />;
                    })
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Super Admin</p>
                <p className="mt-2 text-sm text-white/85">
                  {bootstrap?.is_super_admin ? "Oui" : "Non"}
                </p>
              </div>

              <div className="rounded-3xl border border-gold/20 bg-gold/10 p-5">
                <div className="inline-flex items-center gap-2 text-gold">
                  <Utensils className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.24em]">Contrat Meals</p>
                </div>

                <p className="mt-3 text-sm leading-7 text-gold/90">
                  Le front renseigne désormais le repas par intention : projection neutre,
                  repas foyer ou profil ciblé, recherche guidée, filtres métiers, puis
                  sélection d’une recette publiée compatible avec la cible DOMYLI.
                </p>
              </div>

              {selectedRecipe?.fit.fit_status === "BLOCKED" && (
                <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-100">
                  <div className="inline-flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-xs uppercase tracking-[0.24em]">Attention recette bloquée</p>
                  </div>
                  <p className="mt-3 leading-7">
                    La recette sélectionnée est marquée comme bloquante dans la projection
                    actuelle. Revois la cible du repas ou change de recette.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
