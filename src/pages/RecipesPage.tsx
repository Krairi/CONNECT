import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChefHat,
  Clock3,
  ImageIcon,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { useRecipeLibrary } from "@/src/hooks/useRecipeLibrary";
import { useHouseholdProfileOptions } from "@/src/hooks/useHouseholdProfileOptions";
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
  RecipeInstructionStep,
  RecipeLibraryDetail,
  RecipeLibraryItem,
} from "@/src/services/catalog/catalogService";

type ProjectionMode = "HOUSEHOLD" | "TARGETED";

type SearchIntentCode =
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

type SearchIntent = {
  code: SearchIntentCode;
  label: string;
};

type RecentProfileTarget = {
  profileId: string;
  profileLabel: string;
  lastMealType: RecipeMealType;
  lastUsedAt: string;
};

const PROFILE_STORAGE_KEY = "domyli:recipes:recent-profile-targets:v1";

const QUERY_PLACEHOLDERS: Record<RecipeMealType, string> = {
  BREAKFAST: "Petit-déjeuner rassurant, enfant, satiété, sans porc...",
  LUNCH: "Bureau, transportable, protéiné, halal, batch...",
  SNACK: "Léger, rapide, frais, transportable...",
  DINNER: "Famille, simple, apaisant, stock, soirée calme...",
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
  const filtered = currentItems.filter((item) => item.profileId !== nextItem.profileId);

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

function recipeHasTag(recipe: RecipeLibraryItem, code: string): boolean {
  return recipe.tags.some((tag) => tag.code.toUpperCase() === code);
}

function recipeMatchesIntent(
  recipe: RecipeLibraryItem,
  intentCode: SearchIntentCode,
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

function getRecipeSearchDocument(recipe: RecipeLibraryItem): string {
  return normalizeText(
    [
      recipe.title,
      recipe.recipe_code,
      recipe.short_description,
      recipe.description,
      recipe.tags.map((tag) => `${tag.code} ${tag.label}`).join(" "),
      recipe.fit.fit_reasons.join(" "),
      recipe.fit.warnings.join(" "),
      recipe.fit.blocked_reasons.join(" "),
    ].join(" "),
  );
}

function getFitWeight(value: string): number {
  if (value === "OK") return 3;
  if (value === "WARNING") return 2;
  return 1;
}

function getProjectionLabel(
  mode: ProjectionMode,
  profileLabel: string,
): string {
  if (mode === "TARGETED") {
    return profileLabel || "Projection ciblée sur un profil humain";
  }

  return "Lecture foyer : recettes publiées les plus consensuelles";
}

function formatMetricValue(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return Number.isInteger(value) ? `${value}` : value.toFixed(2);
}

function formatCodeLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function MetaBadge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const className =
    tone === "danger"
      ? "border-red-400/20 bg-red-400/10 text-red-100"
      : tone === "warning"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-100"
        : tone === "success"
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
          : "border-gold/20 bg-gold/10 text-gold";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${className}`}>
      {label}
    </span>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-white/10 bg-black/20 p-5">
      <div className="mb-4 text-[11px] uppercase tracking-[0.24em] text-gold/80">
        {title}
      </div>
      {children}
    </section>
  );
}

function StepLine({ step }: { step: RecipeInstructionStep }) {
  return (
    <li className="flex gap-4 border-b border-white/5 py-3 last:border-none">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-gold/30 bg-gold/10 text-[11px] font-medium text-gold">
        {step.sort_order}
      </div>
      <div>
        <div className="text-sm text-white">{step.label}</div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/35">
          {formatCodeLabel(step.source)}
        </div>
      </div>
    </li>
  );
}

function getDetailHeaderTone(detail: RecipeLibraryDetail | null):
  | "default"
  | "warning"
  | "danger"
  | "success" {
  if (!detail) return "default";
  if (detail.fit.fit_status === "BLOCKED") return "danger";
  if (detail.fit.fit_status === "WARNING") return "warning";
  return "success";
}

export default function RecipesPage() {
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
    loading,
    detailLoading,
    error,
    detailError,
    items,
    detail,
    mealType,
    profileId,
    search,
    selectedTagCode,
    selectedRecipeId,
    allTagOptions,
    summary,
    setMealType,
    setProfileId,
    setSearch,
    setSelectedTagCode,
    setSelectedRecipeId,
    refresh,
    refreshDetail,
  } = useRecipeLibrary();

  const {
    loading: profilesLoading,
    error: profilesError,
    options: profileOptions,
    refresh: refreshProfiles,
  } = useHouseholdProfileOptions();

  const [projectionMode, setProjectionMode] = useState<ProjectionMode>("HOUSEHOLD");
  const [recentProfileTargets, setRecentProfileTargets] = useState<
    RecentProfileTarget[]
  >([]);
  const [selectedIntentCodes, setSelectedIntentCodes] = useState<
    SearchIntentCode[]
  >([]);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  useEffect(() => {
    setRecentProfileTargets(readRecentProfileTargets());
  }, []);

  useEffect(() => {
    if (projectionMode !== "TARGETED" && profileId) {
      setProfileId("");
    }
  }, [projectionMode, profileId, setProfileId]);

  const selectedProfileOption = useMemo(
    () =>
      profileOptions.find((item) => item.profile_id === profileId.trim()) ?? null,
    [profileId, profileOptions],
  );

  const activeProfileLabel = useMemo(() => {
    if (selectedProfileOption) {
      return selectedProfileOption.display_name;
    }

    if (!profileId.trim()) return "";

    const matched = recentProfileTargets.find(
      (item) => item.profileId === profileId.trim(),
    );
    return matched?.profileLabel ?? "Profil ciblé";
  }, [profileId, recentProfileTargets, selectedProfileOption]);

  const visibleRecipes = useMemo(() => {
    return [...items]
      .filter((recipe) => {
        const matchesSearch =
          !search.trim() || getRecipeSearchDocument(recipe).includes(normalizeText(search));
        const matchesTag =
          !selectedTagCode ||
          recipe.tags.some((tag) => tag.code === selectedTagCode);
        const matchesIntent = selectedIntentCodes.every((intentCode) =>
          recipeMatchesIntent(recipe, intentCode),
        );
        const matchesProjection =
          projectionMode !== "HOUSEHOLD" ||
          recipeHasTag(recipe, "FAMILY") ||
          recipeHasTag(recipe, "KID") ||
          recipe.default_servings >= 3;

        return matchesSearch && matchesTag && matchesIntent && matchesProjection;
      })
      .sort((a, b) => {
        return (
          getFitWeight(b.fit.fit_status) - getFitWeight(a.fit.fit_status) ||
          b.fit.fit_score - a.fit.fit_score ||
          a.prep_minutes + a.cook_minutes - (b.prep_minutes + b.cook_minutes) ||
          a.title.localeCompare(b.title, "fr")
        );
      });
  }, [items, projectionMode, search, selectedIntentCodes, selectedTagCode]);

  useEffect(() => {
    if (!selectedRecipeId && visibleRecipes[0]?.recipe_id) {
      setSelectedRecipeId(visibleRecipes[0].recipe_id);
      return;
    }

    if (
      selectedRecipeId &&
      visibleRecipes.length > 0 &&
      !visibleRecipes.some((item) => item.recipe_id === selectedRecipeId)
    ) {
      setSelectedRecipeId(visibleRecipes[0].recipe_id);
    }
  }, [selectedRecipeId, setSelectedRecipeId, visibleRecipes]);

  const computedSummary = useMemo(() => {
    return {
      total: visibleRecipes.length,
      blocked: visibleRecipes.filter((item) => item.fit.fit_status === "BLOCKED")
        .length,
      warning: visibleRecipes.filter((item) => item.fit.fit_status === "WARNING")
        .length,
      ok: visibleRecipes.filter((item) => item.fit.fit_status === "OK").length,
    };
  }, [visibleRecipes]);

  const searchPlaceholder = QUERY_PLACEHOLDERS[mealType];

  const selectedRecipeCard = useMemo(
    () =>
      visibleRecipes.find((item) => item.recipe_id === selectedRecipeId) ??
      visibleRecipes[0] ??
      null,
    [selectedRecipeId, visibleRecipes],
  );

  const selectedDetail = detail?.recipe_id === selectedRecipeCard?.recipe_id ? detail : null;

  const toggleIntent = (code: SearchIntentCode) => {
    setSelectedIntentCodes((prev) =>
      prev.includes(code)
        ? prev.filter((item) => item !== code)
        : [...prev, code],
    );
  };

  const applyRecentProfile = (item: RecentProfileTarget) => {
    const existsInHousehold = profileOptions.some(
      (option) => option.profile_id === item.profileId,
    );

    if (!existsInHousehold) {
      setLocalMessage(
        "Le profil récent n’existe plus dans le foyer actif. Recharge la liste des profils.",
      );
      return;
    }

    setProjectionMode("TARGETED");
    setProfileId(item.profileId);
    setLocalMessage(`Projection ciblée chargée : ${item.profileLabel}`);
  };

  const handleSelectProfile = (nextProfileId: string) => {
    setProfileId(nextProfileId);

    const option = profileOptions.find((item) => item.profile_id === nextProfileId);
    if (!option) return;

    const nextRecent = upsertRecentProfileTarget(recentProfileTargets, {
      profileId: option.profile_id,
      profileLabel: option.display_name,
      lastMealType: mealType,
      lastUsedAt: new Date().toISOString(),
    });

    setRecentProfileTargets(nextRecent);
    writeRecentProfileTargets(nextRecent);
  };

  const openMeals = () => {
    navigate(ROUTES.MEALS);
  };

  if (authLoading || bootstrapLoading || loading) {
    return (
      <div className="min-h-screen bg-black px-6 py-16 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-4 border border-white/10 bg-white/5 px-6 py-5 text-sm uppercase tracking-[0.24em] text-white/75">
          <RefreshCw className="h-4 w-4 animate-spin text-gold" />
          Chargement de la bibliothèque recettes...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <div className="min-h-screen bg-black px-6 py-16 text-white">
        <div className="mx-auto max-w-3xl border border-white/10 bg-white/5 p-8">
          <div className="text-[11px] uppercase tracking-[0.28em] text-gold/75">
            DOMYLI
          </div>
          <h1 className="mt-4 text-3xl font-light uppercase tracking-[0.18em] text-white">
            Foyer requis
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/70">
            Il faut une session authentifiée et un foyer actif pour accéder à la bibliothèque publiée DOMYLI.
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

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-white md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="text-[11px] uppercase tracking-[0.28em] text-gold/75">
                DOMYLI
              </div>
              <h1 className="mt-4 text-3xl font-light uppercase tracking-[0.18em] text-white md:text-4xl">
                Bibliothèque recettes
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
                Catalogue publié, gouverné et lisible avec image, fiches détaillées intelligentes, métadonnées normalisées, signaux de compatibilité et projection contextualisée sur un profil du foyer — jamais sur un identifiant saisi librement.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="inline-flex h-11 w-11 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
                aria-label="Retour"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => void refresh()}
                className="inline-flex items-center gap-3 border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.24em] text-white/75 transition-colors hover:border-gold/40 hover:text-gold"
              >
                <RefreshCw className="h-4 w-4" />
                Recharger
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="border border-white/10 bg-black/20 p-5">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                Recettes visibles
              </div>
              <div className="mt-3 text-3xl font-light text-white">{computedSummary.total}</div>
            </div>
            <div className="border border-white/10 bg-black/20 p-5">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                Compatibles
              </div>
              <div className="mt-3 text-3xl font-light text-emerald-100">{computedSummary.ok}</div>
            </div>
            <div className="border border-white/10 bg-black/20 p-5">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                À vérifier / bloquées
              </div>
              <div className="mt-3 text-3xl font-light text-amber-100">
                {computedSummary.warning + computedSummary.blocked}
              </div>
            </div>
            <div className="border border-white/10 bg-black/20 p-5">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                Projection active
              </div>
              <div className="mt-3 text-sm uppercase tracking-[0.2em] text-gold">
                {getProjectionLabel(projectionMode, activeProfileLabel)}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <div className="border border-white/10 bg-white/5 p-5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-gold/80">
                Filtres gouvernés
              </div>

              <div className="mt-5 space-y-5">
                <label className="block space-y-2">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                    Type de repas
                  </span>
                  <select
                    value={mealType}
                    onChange={(event) => setMealType(event.target.value as RecipeMealType)}
                    className="w-full border border-white/10 bg-black/30 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  >
                    {RECIPE_MEAL_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                    Intention gouvernée
                  </span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={searchPlaceholder}
                      className="w-full border border-white/10 bg-black/30 py-4 pl-11 pr-4 text-sm outline-none focus:border-gold/50"
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                    Tag métier
                  </span>
                  <select
                    value={selectedTagCode}
                    onChange={(event) => setSelectedTagCode(event.target.value)}
                    className="w-full border border-white/10 bg-black/30 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  >
                    <option value="">Tous les tags</option>
                    {allTagOptions.map((tag) => (
                      <option key={tag.code} value={tag.code}>
                        {tag.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="space-y-3">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                    Projection cible
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setProjectionMode("HOUSEHOLD")}
                      className={`border px-4 py-3 text-xs uppercase tracking-[0.22em] transition-colors ${
                        projectionMode === "HOUSEHOLD"
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-white/10 text-white/65 hover:border-gold/40 hover:text-gold"
                      }`}
                    >
                      <Users className="mx-auto mb-2 h-4 w-4" />
                      Foyer
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectionMode("TARGETED")}
                      className={`border px-4 py-3 text-xs uppercase tracking-[0.22em] transition-colors ${
                        projectionMode === "TARGETED"
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-white/10 text-white/65 hover:border-gold/40 hover:text-gold"
                      }`}
                    >
                      <UserRound className="mx-auto mb-2 h-4 w-4" />
                      Profil ciblé
                    </button>
                  </div>
                </div>

                {projectionMode === "TARGETED" ? (
                  <div className="space-y-4 border border-gold/15 bg-gold/5 p-4">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-gold/80">
                      Profil humain du foyer
                    </div>

                    {profilesLoading ? (
                      <div className="text-sm text-white/60">
                        Chargement des profils gouvernés...
                      </div>
                    ) : profileOptions.length > 0 ? (
                      <select
                        value={profileId}
                        onChange={(event) => handleSelectProfile(event.target.value)}
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
                      <div className="text-sm text-white/60">
                        Aucun profil gouverné n’existe encore dans ce foyer.
                      </div>
                    )}

                    {selectedProfileOption ? (
                      <div className="text-xs leading-6 text-white/70">
                        Profil sélectionné : <span className="text-white">{selectedProfileOption.display_name}</span> — {selectedProfileOption.summary}
                      </div>
                    ) : null}

                    {profilesError ? (
                      <div className="border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">
                        {profilesError.message}
                      </div>
                    ) : null}

                    {profileOptions.length === 0 ? (
                      <div className="flex flex-wrap gap-3">
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

                    <div>
                      <div className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                        Profils récents
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {recentProfileTargets.length === 0 ? (
                          <div className="text-xs text-white/45">
                            Aucun profil récent. Le premier profil ciblé sera mémorisé ici.
                          </div>
                        ) : (
                          recentProfileTargets.map((item) => (
                            <button
                              key={item.profileId}
                              type="button"
                              onClick={() => applyRecentProfile(item)}
                              className="border border-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/70 transition-colors hover:border-gold/40 hover:text-gold"
                            >
                              {item.profileLabel}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                    Signaux de recherche
                  </div>
                  <div className="flex flex-wrap gap-2">
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
                </div>
              </div>
            </div>

            <div className="border border-white/10 bg-white/5 p-5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-gold/80">
                Lecture métier DOMYLI
              </div>
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                    Email
                  </dt>
                  <dd className="mt-1 text-white">{sessionEmail ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                    Foyer actif
                  </dt>
                  <dd className="mt-1 text-white">{activeMembership?.household_name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                    Projection profil
                  </dt>
                  <dd className="mt-1 text-white">{getProjectionLabel(projectionMode, activeProfileLabel)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                    Super Admin
                  </dt>
                  <dd className="mt-1 text-white">{bootstrap?.is_super_admin ? "Oui" : "Non"}</dd>
                </div>
                <div className="rounded-sm border border-gold/15 bg-gold/5 p-4 text-xs leading-6 text-white/70">
                  La bibliothèque recette DOMYLI n’accepte aucun champ libre métier. La lecture détaillée est structurée, gouvernée et contextualisée — foyer ou profil ciblé.
                </div>
              </dl>
            </div>
          </aside>

          <div className="space-y-6">
            {localMessage ? (
              <div className="border border-gold/20 bg-gold/10 px-4 py-3 text-sm text-gold">
                {localMessage}
              </div>
            ) : null}

            {error ? (
              <div className="flex items-start gap-3 border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error.message}</span>
              </div>
            ) : null}

            <div className="grid gap-6 2xl:grid-cols-[420px_minmax(0,1fr)]">
              <section className="border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.24em] text-gold/80">
                      Catalogue publié
                    </div>
                    <h2 className="mt-2 text-lg uppercase tracking-[0.18em] text-white">
                      {visibleRecipes.length} recette(s) pour {getRecipeMealTypeLabel(mealType)}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => void refresh()}
                    className="inline-flex h-11 w-11 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
                    aria-label="Recharger la bibliothèque"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {visibleRecipes.length === 0 ? (
                    <div className="border border-white/10 bg-black/20 p-5 text-sm leading-7 text-white/60">
                      Aucune recette publiée pour cette combinaison repas / intention / projection.
                    </div>
                  ) : (
                    visibleRecipes.map((recipe) => {
                      const isActive = recipe.recipe_id === selectedRecipeCard?.recipe_id;
                      const fitTone =
                        recipe.fit.fit_status === "BLOCKED"
                          ? "danger"
                          : recipe.fit.fit_status === "WARNING"
                            ? "warning"
                            : "success";

                      return (
                        <button
                          key={recipe.recipe_id}
                          type="button"
                          onClick={() => setSelectedRecipeId(recipe.recipe_id)}
                          className={`w-full border p-4 text-left transition-colors ${
                            isActive
                              ? "border-gold bg-gold/10"
                              : "border-white/10 bg-black/20 hover:border-gold/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.2em] text-white/35">
                                {recipe.recipe_code || "RECIPE"}
                              </div>
                              <h3 className="mt-2 text-base uppercase tracking-[0.14em] text-white">
                                {recipe.title}
                              </h3>
                              <p className="mt-2 text-sm leading-6 text-white/65">
                                {recipe.short_description}
                              </p>
                            </div>
                            <MetaBadge
                              label={getRecipeFitStatusLabel(recipe.fit.fit_status)}
                              tone={fitTone}
                            />
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <MetaBadge label={getRecipeDifficultyLabel(recipe.difficulty)} />
                            <MetaBadge
                              label={`${recipe.prep_minutes + recipe.cook_minutes} min`}
                            />
                            <MetaBadge
                              label={getRecipeStockIntensityLabel(recipe.stock_intensity)}
                            />
                            {recipe.image_url ? (
                              <MetaBadge label="Image gouvernée" tone="success" />
                            ) : (
                              <MetaBadge label="Image placeholder" tone="warning" />
                            )}
                          </div>

                          {recipe.tags.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {recipe.tags.slice(0, 4).map((tag) => (
                                <span
                                  key={`${recipe.recipe_id}-${tag.code}`}
                                  className="border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-white/55"
                                >
                                  {tag.label}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </button>
                      );
                    })
                  )}
                </div>
              </section>

              <section className="space-y-6">
                {selectedRecipeCard ? (
                  <>
                    <div className="border border-white/10 bg-white/5 p-5 md:p-6">
                      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
                        <div className="overflow-hidden border border-white/10 bg-black/20">
                          {selectedDetail?.image_url || selectedRecipeCard.image_url ? (
                            <img
                              src={selectedDetail?.image_url ?? selectedRecipeCard.image_url ?? undefined}
                              alt={selectedDetail?.image_alt ?? selectedRecipeCard.image_alt}
                              className="h-full min-h-[260px] w-full object-cover"
                            />
                          ) : (
                            <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 bg-gradient-to-br from-gold/15 via-black to-black text-center text-white/65">
                              <ImageIcon className="h-10 w-10 text-gold/60" />
                              <div>
                                <div className="text-[11px] uppercase tracking-[0.24em] text-gold/70">
                                  Visuel gouverné
                                </div>
                                <div className="mt-2 text-sm uppercase tracking-[0.18em] text-white">
                                  {selectedRecipeCard.recipe_code || "RECETTE"}
                                </div>
                                <div className="mt-2 text-xs leading-6 text-white/45">
                                  Image publiée en attente ou indisponible pour cette recette.
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap gap-2">
                            <MetaBadge
                              label={getRecipeFitStatusLabel(
                                (selectedDetail ?? selectedRecipeCard).fit.fit_status,
                              )}
                              tone={getDetailHeaderTone(selectedDetail ?? null)}
                            />
                            <MetaBadge
                              label={getRecipeDifficultyLabel(selectedRecipeCard.difficulty)}
                            />
                            <MetaBadge label={`${selectedRecipeCard.default_servings} portions`} />
                            <MetaBadge
                              label={getRecipeStockIntensityLabel(
                                selectedRecipeCard.stock_intensity,
                              )}
                            />
                            <MetaBadge
                              label={
                                selectedDetail?.detail_context === "PROFILE_TARGETED"
                                  ? "Lecture profil ciblé"
                                  : "Lecture foyer"
                              }
                            />
                          </div>

                          <h2 className="mt-4 text-2xl font-light uppercase tracking-[0.16em] text-white md:text-3xl">
                            {selectedRecipeCard.title}
                          </h2>
                          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70">
                            {(selectedDetail ?? selectedRecipeCard).description}
                          </p>

                          {(selectedDetail ?? selectedRecipeCard).hero_badges.length > 0 ? (
                            <div className="mt-5 flex flex-wrap gap-2">
                              {(selectedDetail ?? selectedRecipeCard).hero_badges.map((badge) => (
                                <MetaBadge
                                  key={`${selectedRecipeCard.recipe_id}-${badge.code}-${badge.label}`}
                                  label={badge.label}
                                />
                              ))}
                            </div>
                          ) : null}

                          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="border border-white/10 bg-black/20 p-4">
                              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/45">
                                <Clock3 className="h-4 w-4 text-gold/70" /> Durée
                              </div>
                              <div className="mt-3 text-lg text-white">
                                {selectedRecipeCard.prep_minutes + selectedRecipeCard.cook_minutes} min
                              </div>
                            </div>
                            <div className="border border-white/10 bg-black/20 p-4">
                              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/45">
                                <ChefHat className="h-4 w-4 text-gold/70" /> Difficulté
                              </div>
                              <div className="mt-3 text-lg text-white">
                                {getRecipeDifficultyLabel(selectedRecipeCard.difficulty)}
                              </div>
                            </div>
                            <div className="border border-white/10 bg-black/20 p-4">
                              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/45">
                                <Target className="h-4 w-4 text-gold/70" /> Score fit
                              </div>
                              <div className="mt-3 text-lg text-white">
                                {formatMetricValue((selectedDetail ?? selectedRecipeCard).fit.fit_score)}
                              </div>
                            </div>
                            <div className="border border-white/10 bg-black/20 p-4">
                              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/45">
                                <Sparkles className="h-4 w-4 text-gold/70" /> Readiness
                              </div>
                              <div className="mt-3 text-lg text-white">
                                {(selectedDetail ?? selectedRecipeCard).detail_readiness}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-2">
                      <DetailSection title="Compatibilité & signaux">
                        <div className="space-y-5">
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                              Fit reasons
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {(selectedDetail ?? selectedRecipeCard).fit.fit_reasons.length > 0 ? (
                                (selectedDetail ?? selectedRecipeCard).fit.fit_reasons.map((reason) => (
                                  <MetaBadge key={reason} label={reason} tone="success" />
                                ))
                              ) : (
                                <span className="text-sm text-white/45">Aucun signal positif supplémentaire publié.</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                              Warnings
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {(selectedDetail ?? selectedRecipeCard).fit.warnings.length > 0 ? (
                                (selectedDetail ?? selectedRecipeCard).fit.warnings.map((warning) => (
                                  <MetaBadge key={warning} label={warning} tone="warning" />
                                ))
                              ) : (
                                <span className="text-sm text-white/45">Aucun avertissement publié.</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                              Blocked reasons
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {(selectedDetail ?? selectedRecipeCard).fit.blocked_reasons.length > 0 ? (
                                (selectedDetail ?? selectedRecipeCard).fit.blocked_reasons.map((blocked) => (
                                  <MetaBadge key={blocked} label={blocked} tone="danger" />
                                ))
                              ) : (
                                <span className="text-sm text-white/45">Aucun blocage publié.</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                              Tags gouvernés
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {selectedRecipeCard.tags.length > 0 ? (
                                selectedRecipeCard.tags.map((tag) => (
                                  <span
                                    key={`${selectedRecipeCard.recipe_id}-detail-${tag.code}`}
                                    className="border border-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/65"
                                  >
                                    {tag.label}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-white/45">Aucun tag gouverné publié.</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </DetailSection>

                      <DetailSection title="Ingrédients contextualisés">
                        {detailLoading ? (
                          <div className="flex items-center gap-3 text-sm text-white/60">
                            <RefreshCw className="h-4 w-4 animate-spin text-gold" />
                            Chargement de la lecture détaillée intelligente...
                          </div>
                        ) : selectedDetail?.ingredients.length ? (
                          <div className="space-y-3">
                            {selectedDetail.ingredients.map((ingredient) => (
                              <div
                                key={`${selectedDetail.recipe_id}-${ingredient.ingredient_code}`}
                                className="grid gap-3 border border-white/10 bg-black/20 p-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center"
                              >
                                <div>
                                  <div className="text-sm uppercase tracking-[0.12em] text-white">
                                    {ingredient.ingredient_label}
                                  </div>
                                  <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
                                    {ingredient.ingredient_code} · {formatCodeLabel(ingredient.nutrition_role)} · {formatCodeLabel(ingredient.scaling_policy)}
                                  </div>
                                </div>
                                <div className="text-sm text-white/70">
                                  base {formatMetricValue(ingredient.qty_base)} {ingredient.unit_code}
                                </div>
                                <div className="text-sm text-gold">
                                  cible {formatMetricValue(ingredient.qty_adjusted)} {ingredient.unit_code}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/55">
                            Aucun ingrédient contextualisé n’est publié pour cette combinaison. La bibliothèque reste lisible, mais la projection quantitative détaillée nécessite un profil ciblé et un couple recette/repas compatible.
                          </div>
                        )}
                      </DetailSection>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-2">
                      <DetailSection title="Étapes gouvernées">
                        {selectedDetail?.instruction_steps.length || selectedRecipeCard.instruction_steps.length ? (
                          <ol>
                            {(selectedDetail?.instruction_steps.length
                              ? selectedDetail.instruction_steps
                              : selectedRecipeCard.instruction_steps
                            ).map((step) => (
                              <StepLine key={`${selectedRecipeCard.recipe_id}-${step.step_code}`} step={step} />
                            ))}
                          </ol>
                        ) : (
                          <div className="border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/55">
                            Aucune étape gouvernée n’est encore publiée pour cette recette.
                          </div>
                        )}
                      </DetailSection>

                      <DetailSection title="Contexte de projection">
                        <div className="space-y-4 text-sm text-white/70">
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-4 w-4 text-gold/70" />
                            <span>
                              {selectedDetail?.detail_context === "PROFILE_TARGETED"
                                ? "Lecture intelligente projetée sur un profil humain du foyer."
                                : "Lecture foyer publiée, conçue pour explorer le catalogue avant planification détaillée."}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Target className="h-4 w-4 text-gold/70" />
                            <span>
                              Portion factor : {formatMetricValue(selectedDetail?.portion_factor ?? 1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <ShieldCheck className="h-4 w-4 text-gold/70" />
                            <span>
                              Publication : {(selectedDetail ?? selectedRecipeCard).publication_status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-4 w-4 text-gold/70" />
                            <span>
                              Zéro champ libre : lecture gouvernée, structurée et pilotée par catalogue.
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => void refreshDetail()}
                              className="inline-flex items-center gap-3 border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
                            >
                              <RefreshCw className="h-4 w-4" />
                              Relire le détail
                            </button>
                            <button
                              type="button"
                              onClick={openMeals}
                              className="inline-flex items-center gap-3 border border-gold/40 bg-gold/10 px-5 py-3 text-xs uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold hover:text-black"
                            >
                              <ChefHat className="h-4 w-4" />
                              Continuer vers Meals
                            </button>
                          </div>
                        </div>
                      </DetailSection>
                    </div>

                    {detailError ? (
                      <div className="flex items-start gap-3 border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-100">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{detailError.message}</span>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="border border-white/10 bg-white/5 p-6 text-sm text-white/60">
                    Sélectionne une recette publiée pour ouvrir sa fiche détaillée intelligente.
                  </div>
                )}
              </section>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
