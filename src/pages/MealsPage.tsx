import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
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
import { useHouseholdProfileOptions } from "@/src/hooks/useHouseholdProfileOptions";
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

const PROFILE_STORAGE_KEY = "domyli:meals:recent-profile-targets:v3";

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

function recipeMatchesIntent(
  recipe: RecipeCandidate,
  intentCode: SearchIntent["code"],
): boolean {
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
        getStockWeight(a.stock_intensity) -
          getStockWeight(b.stock_intensity) ||
        b.fit.fit_score - a.fit.fit_score ||
        a.title.localeCompare(b.title, "fr")
      );
    }

    if (sortMode === "FAMILY") {
      const aFamily =
        recipeHasTag(a, "FAMILY") || recipeHasTag(a, "KID") ? 1 : 0;
      const bFamily =
        recipeHasTag(b, "FAMILY") || recipeHasTag(b, "KID") ? 1 : 0;

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
    lines.push(
      "",
      "[DOMYLI_OPERATOR_NOTES]",
      operatorNotes.trim(),
      "[/DOMYLI_OPERATOR_NOTES]",
    );
  }

  return lines.join("\n");
}

function getProjectionHeadline(
  mode: ProjectionMode,
  label: string,
): string {
  if (mode === "TARGETED") {
    return label.trim() || "Profil ciblé à confirmer";
  }

  if (mode === "HOUSEHOLD") {
    return "Repas foyer";
  }

  return "Compatibilité neutre";
}

function getProjectionDescription(mode: ProjectionMode): string {
  if (mode === "TARGETED") {
    return "DOMYLI projette la compatibilité sur un profil humain précis déjà créé dans le foyer.";
  }

  if (mode === "HOUSEHOLD") {
    return "DOMYLI privilégie les recettes plus consensuelles et partageables.";
  }

  return "Lecture simple du foyer, sans profil spécifique.";
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
      className={`rounded-[28px] border p-8 text-left transition-colors ${
        isActive
          ? "border-gold bg-gold/10 text-gold"
          : "border-white/10 bg-black/30 text-white hover:border-gold/40 hover:text-gold"
      }`}
    >
      <div className="mb-6">{icon}</div>
      <h3 className="text-3xl font-semibold">{title}</h3>
      <p className="mt-4 max-w-sm text-base leading-8 text-white/70">
        {description}
      </p>
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
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${className}`}>
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

  const {
    loading: profilesLoading,
    error: profilesError,
    options: profileOptions,
    refresh: refreshProfiles,
  } = useHouseholdProfileOptions();

  const [selectedMealSlotId, setSelectedMealSlotId] = useState("");
  const [plannedFor, setPlannedFor] = useState(todayIsoDate());
  const [mealType, setMealType] = useState<MealType>("LUNCH");
  const [projectionMode, setProjectionMode] =
    useState<ProjectionMode>("NEUTRAL");
  const [profileId, setProfileId] = useState("");
  const [recentProfiles, setRecentProfiles] = useState<RecentProfileTarget[]>([]);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [selectedIntentCodes, setSelectedIntentCodes] = useState<
    SearchIntent["code"][]
  >([]);
  const [sortMode, setSortMode] = useState<RecipeSortMode>("COMPATIBILITY");
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [operatorNotes, setOperatorNotes] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  useEffect(() => {
    setRecentProfiles(readRecentProfileTargets());
  }, []);

  useEffect(() => {
    if (projectionMode !== "TARGETED" && profileId) {
      setProfileId("");
    }
  }, [projectionMode, profileId]);

  const effectiveProfileId = useMemo(() => {
    if (projectionMode !== "TARGETED") return "";
    return profileId.trim();
  }, [profileId, projectionMode]);

  useEffect(() => {
    void refreshRecipeCandidates(mealType, effectiveProfileId);
  }, [effectiveProfileId, mealType, refreshRecipeCandidates]);

  const selectedProfileOption = useMemo(
    () =>
      profileOptions.find((option) => option.profile_id === effectiveProfileId) ??
      null,
    [effectiveProfileId, profileOptions],
  );

  const selectedProfileLabel = useMemo(() => {
    if (selectedProfileOption) {
      return selectedProfileOption.display_name;
    }

    if (!effectiveProfileId) {
      return "";
    }

    const matchedRecent = recentProfiles.find(
      (item) => item.profileId === effectiveProfileId,
    );

    return matchedRecent?.profileLabel ?? "Profil ciblé";
  }, [effectiveProfileId, recentProfiles, selectedProfileOption]);

  const isEditMode = useMemo(
    () => Boolean(selectedMealSlotId),
    [selectedMealSlotId],
  );

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
  }, [mealType, plannedFor, selectedRecipe]);

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            DOMYLI
          </p>
          <h1 className="mt-4 text-3xl font-semibold">Chargement des repas...</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            DOMYLI
          </p>
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
      </div>
    );
  }

  const resetForm = () => {
    setSelectedMealSlotId("");
    setPlannedFor(todayIsoDate());
    setMealType("LUNCH");
    setProjectionMode("NEUTRAL");
    setProfileId("");
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
    const existsInHousehold = profileOptions.some(
      (option) => option.profile_id === recentProfile.profileId,
    );

    if (!existsInHousehold) {
      setLocalMessage(
        "Le profil récent n’existe plus dans le foyer actif. Recharge la liste des profils.",
      );
      return;
    }

    setProjectionMode("TARGETED");
    setProfileId(recentProfile.profileId);
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
    if (!selectedProfileOption) return;

    const nextItem: RecentProfileTarget = {
      profileId: selectedProfileOption.profile_id,
      profileLabel: selectedProfileOption.display_name,
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

    if (projectionMode === "TARGETED" && !effectiveProfileId) {
      setLocalMessage(
        "Pour une projection ciblée, sélectionne un profil existant du foyer.",
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
        selectedProfileLabel,
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
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4 rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gold">
              DOMYLI
            </p>
            <h1 className="mt-4 text-3xl font-semibold">Meals</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
              Ici, la projection repas doit être gouvernée par des profils déjà créés
              dans le foyer. Plus aucun UUID libre n’est demandé à l’utilisateur.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="mt-1 inline-flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <ModeCard
            isActive={projectionMode === "NEUTRAL"}
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Compatibilité neutre"
            description={getProjectionDescription("NEUTRAL")}
            onClick={() => setProjectionMode("NEUTRAL")}
          />

          <ModeCard
            isActive={projectionMode === "HOUSEHOLD"}
            icon={<Users className="h-5 w-5" />}
            title="Repas foyer"
            description={getProjectionDescription("HOUSEHOLD")}
            onClick={() => setProjectionMode("HOUSEHOLD")}
          />

          <ModeCard
            isActive={projectionMode === "TARGETED"}
            icon={<UserRound className="h-5 w-5" />}
            title="Profil ciblé"
            description={getProjectionDescription("TARGETED")}
            onClick={() => setProjectionMode("TARGETED")}
          />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_380px]">
          <section className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/60">
                  Date planifiée
                </span>
                <input
                  type="date"
                  value={plannedFor}
                  onChange={(event) => setPlannedFor(event.target.value)}
                  className="w-full border border-white/10 bg-black/30 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </label>

              <label className="block">
                <span className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/60">
                  Type de repas
                </span>
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

            {projectionMode === "TARGETED" ? (
              <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-6">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
                  <div>
                    <span className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/60">
                      Profil humain du foyer
                    </span>

                    {profilesLoading ? (
                      <div className="rounded-[20px] border border-white/10 bg-black/30 px-4 py-4 text-sm text-white/60">
                        Chargement des profils gouvernés...
                      </div>
                    ) : profileOptions.length > 0 ? (
                      <select
                        value={profileId}
                        onChange={(event) => setProfileId(event.target.value)}
                        className="w-full border border-white/10 bg-black/30 px-4 py-4 text-sm outline-none focus:border-gold/50"
                      >
                        <option value="">Choisir un profil créé</option>
                        {profileOptions.map((option) => (
                          <option key={option.profile_id} value={option.profile_id}>
                            {option.display_name} — {option.summary}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="rounded-[20px] border border-amber-400/20 bg-amber-400/10 px-4 py-4 text-sm text-amber-100">
                        Aucun profil gouverné n’existe encore dans ce foyer. Crée ou
                        complète d’abord un profil humain.
                      </div>
                    )}

                    {selectedProfileOption ? (
                      <p className="mt-4 text-sm text-gold">
                        Profil sélectionné : {selectedProfileOption.display_name} —{" "}
                        {selectedProfileOption.summary}
                      </p>
                    ) : null}

                    {profilesError ? (
                      <div className="mt-4 rounded-[20px] border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
                        {profilesError.message}
                      </div>
                    ) : null}

                    {profileOptions.length === 0 ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => navigate(ROUTES.MY_PROFILE)}
                          className="border border-gold/40 px-4 py-3 text-xs uppercase tracking-[0.22em] text-gold transition-colors hover:bg-gold hover:text-black"
                        >
                          Ouvrir Mon profil
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate(ROUTES.PROFILES)}
                          className="border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.22em] text-white transition-colors hover:border-gold/40 hover:text-gold"
                        >
                          Gérer Profiles
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <span className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/60">
                      Profils récents
                    </span>

                    <div className="rounded-[24px] border border-white/10 bg-black/30 p-4">
                      {recentProfiles.length === 0 ? (
                        <p className="text-sm text-white/60">
                          Aucun profil récent. Le premier repas ciblé sera mémorisé ici.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {recentProfiles.map((item) => (
                            <button
                              key={item.profileId}
                              type="button"
                              onClick={() => applyRecentProfile(item)}
                              className="border border-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/70 transition-colors hover:border-gold/40 hover:text-gold"
                            >
                              {item.profileLabel}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_220px]">
              <label className="block md:col-span-2">
                <span className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/60">
                  Décrivez l’intention du repas
                </span>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <input
                    value={recipeSearch}
                    onChange={(event) => setRecipeSearch(event.target.value)}
                    placeholder={QUERY_PLACEHOLDERS[mealType]}
                    className="w-full border border-white/10 bg-black/30 py-4 pl-11 pr-4 text-sm outline-none focus:border-gold/50"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/60">
                  Tri
                </span>
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

            <div className="mt-6 flex flex-wrap gap-2">
              {SEARCH_INTENTS.map((intent) => {
                const isActive = selectedIntentCodes.includes(intent.code);

                return (
                  <button
                    key={intent.code}
                    type="button"
                    onClick={() => toggleIntent(intent.code)}
                    className={`border px-3 py-2 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                      isActive
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-white/10 text-white/70 hover:border-gold/40 hover:text-gold"
                    }`}
                  >
                    {intent.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                  Projection active
                </p>
                <p className="mt-2 text-white">
                  {getProjectionHeadline(projectionMode, selectedProfileLabel)}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => void refreshProfiles()}
                  className="inline-flex items-center justify-center gap-3 border border-white/10 px-5 py-4 text-xs uppercase tracking-[0.24em] text-white/75 transition-colors hover:border-gold/40 hover:text-gold"
                >
                  <RefreshCw className="h-4 w-4" />
                  Profils
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void refreshRecipeCandidates(mealType, effectiveProfileId)
                  }
                  className="inline-flex items-center justify-center gap-3 border border-white/10 px-5 py-4 text-xs uppercase tracking-[0.24em] text-white/75 transition-colors hover:border-gold/40 hover:text-gold"
                >
                  <RefreshCw className="h-4 w-4" />
                  Recettes
                </button>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-semibold">
                {visibleRecipes.length} recette(s) candidate(s)
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Tri actuel : {getRecipeSortModeLabel(sortMode)} · repas :{" "}
                {mealType}
              </p>

              <div className="mt-6 grid gap-4">
                {candidatesLoading ? (
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-white/70">
                    Chargement des recettes candidates...
                  </div>
                ) : visibleRecipes.length === 0 ? (
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-white/70">
                    Aucune recette publiée pour cette combinaison repas / intention / projection.
                  </div>
                ) : (
                  visibleRecipes.map((recipe) => {
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
                        className={`rounded-[28px] border p-6 text-left transition-colors ${
                          isSelected
                            ? "border-gold bg-gold/10"
                            : "border-white/10 bg-black/20 hover:border-gold/40"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-xl font-semibold">{recipe.title}</h3>
                            <p className="mt-2 text-sm text-white/70">
                              {recipe.short_description}
                            </p>
                          </div>

                          <MetaBadge
                            label={getRecipeFitStatusLabel(recipe.fit.fit_status)}
                            tone={fitTone}
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <MetaBadge
                            label={`Difficulté ${getRecipeDifficultyLabel(recipe.difficulty)}`}
                          />
                          <MetaBadge
                            label={`Stock ${getRecipeStockIntensityLabel(
                              recipe.stock_intensity,
                            )}`}
                          />
                          <MetaBadge label={`${recipe.default_servings} portions`} />
                          <MetaBadge
                            label={`${recipe.prep_minutes + recipe.cook_minutes} min`}
                          />
                        </div>

                        {recipe.fit.fit_reasons.length > 0 ? (
                          <p className="mt-4 text-sm text-emerald-200">
                            {recipe.fit.fit_reasons.join(" · ")}
                          </p>
                        ) : null}

                        {recipe.fit.warnings.length > 0 ? (
                          <p className="mt-3 text-sm text-amber-200">
                            {recipe.fit.warnings.join(" · ")}
                          </p>
                        ) : null}

                        {recipe.fit.blocked_reasons.length > 0 ? (
                          <p className="mt-3 text-sm text-red-200">
                            {recipe.fit.blocked_reasons.join(" · ")}
                          </p>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
              <div className="flex items-center gap-3">
                <Utensils className="h-5 w-5 text-gold" />
                <p className="text-sm uppercase tracking-[0.24em] text-gold">
                  Construction du repas
                </p>
              </div>

              <div className="mt-6 space-y-5 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                    Projection
                  </p>
                  <p className="mt-2 text-white">
                    {getProjectionHeadline(projectionMode, selectedProfileLabel)}
                  </p>
                </div>

                {selectedProfileOption ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                      Profil cible
                    </p>
                    <p className="mt-2 text-white">
                      {selectedProfileOption.display_name}
                    </p>
                    <p className="mt-1 text-white/60">
                      {selectedProfileOption.summary}
                    </p>
                  </div>
                ) : null}

                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                    Recette choisie
                  </p>
                  <p className="mt-2 text-white">
                    {selectedRecipe?.title ?? "Aucune recette sélectionnée"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                    Notes opérateur
                  </p>
                  <textarea
                    value={operatorNotes}
                    onChange={(event) => setOperatorNotes(event.target.value)}
                    rows={5}
                    className="mt-3 w-full border border-white/10 bg-black/30 px-4 py-4 text-sm outline-none focus:border-gold/50"
                    placeholder="Contexte de service, précision foyer, arbitrage du jour..."
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={!canSubmit || saving}
                    onClick={handleCreateOrUpdate}
                    className="inline-flex items-center justify-center gap-3 border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.24em] text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isEditMode ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {saving
                      ? "Enregistrement..."
                      : isEditMode
                        ? "Mettre à jour"
                        : "Créer le repas"}
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
                  >
                    Réinitialiser
                  </button>
                </div>

                {localMessage ? (
                  <div className="rounded-[20px] border border-gold/20 bg-gold/10 px-4 py-4 text-sm text-gold">
                    {localMessage}
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-[20px] border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
                    {error.message}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-gold" />
                <p className="text-sm uppercase tracking-[0.24em] text-gold">
                  Lecture DOMYLI
                </p>
              </div>

              <div className="mt-6 space-y-5 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                    Email
                  </p>
                  <p className="mt-2 text-white">{sessionEmail ?? "—"}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                    Foyer actif
                  </p>
                  <p className="mt-2 text-white">
                    {activeMembership?.household_name ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                    Projection profil
                  </p>
                  <p className="mt-2 text-white">
                    {getProjectionHeadline(projectionMode, selectedProfileLabel)}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                    Super Admin
                  </p>
                  <p className="mt-2 text-white">
                    {bootstrap?.is_super_admin ? "Oui" : "Non"}
                  </p>
                </div>

                {(lastCreatedMealSlotId || lastUpdatedMealSlotId || lastConfirmResult) && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                      Dernière activité
                    </p>
                    <p className="mt-2 text-white">
                      {lastConfirmResult?.meal_slot_id ??
                        lastUpdatedMealSlotId ??
                        lastCreatedMealSlotId ??
                        "—"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-8 rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-gold" />
            <p className="text-sm uppercase tracking-[0.24em] text-gold">
              Repas planifiés
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            {items.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-white/70">
                Aucun repas planifié pour le moment.
              </div>
            ) : (
              items.map((meal) => (
                <div
                  key={meal.meal_slot_id}
                  className="rounded-[24px] border border-white/10 bg-black/20 p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {meal.title ?? "Repas DOMYLI"}
                      </h3>
                      <p className="mt-2 text-sm text-white/70">
                        {meal.planned_for} · {meal.meal_type}
                      </p>
                      <p className="mt-2 text-sm text-white/50">
                        {meal.status ?? "PENDING"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(meal.meal_slot_id)}
                        className="border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.22em] text-white transition-colors hover:border-gold/40 hover:text-gold"
                      >
                        Éditer
                      </button>

                      <button
                        type="button"
                        disabled={confirming}
                        onClick={() => void handleConfirm(meal.meal_slot_id)}
                        className="border border-gold/40 px-4 py-3 text-xs uppercase tracking-[0.22em] text-gold transition-colors hover:bg-gold hover:text-black disabled:opacity-60"
                      >
                        {confirming ? "Confirmation..." : "Confirmer"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}