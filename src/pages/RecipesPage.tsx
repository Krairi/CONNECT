import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
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

type ProjectionMode = "NEUTRAL" | "TARGETED" | "HOUSEHOLD";

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

const PROFILE_STORAGE_KEY = "domyli:meals:recent-profile-targets:v3";

const QUERY_PLACEHOLDERS: Record<RecipeMealType, string> = {
  BREAKFAST: "Rapide, enfant, satiété, sans porc, matin doux...",
  LUNCH: "Bureau, transportable, protéiné, batch, halal...",
  SNACK: "Léger, enfant, rapide, satiété, transportable...",
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

type RecipeCardData = ReturnType<typeof useRecipeLibrary>["items"][number];

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

function recipeHasTag(recipe: RecipeCardData, code: string): boolean {
  return recipe.tags.some((tag) => tag.code.toUpperCase() === code);
}

function recipeMatchesIntent(
  recipe: RecipeCardData,
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

function getRecipeSearchDocument(recipe: RecipeCardData): string {
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

  if (mode === "HOUSEHOLD") {
    return "Lecture foyer : recettes les plus consensuelles";
  }

  return "Compatibilité neutre sans profil";
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
    error,
    items,
    mealType,
    profileId,
    search,
    selectedTagCode,
    allTagOptions,
    setMealType,
    setProfileId,
    setSearch,
    setSelectedTagCode,
    refresh,
  } = useRecipeLibrary();

  const {
    loading: profilesLoading,
    error: profilesError,
    options: profileOptions,
    refresh: refreshProfiles,
  } = useHouseholdProfileOptions();

  const [projectionMode, setProjectionMode] =
    useState<ProjectionMode>("NEUTRAL");
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
    () => profileOptions.find((item) => item.profile_id === profileId.trim()) ?? null,
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
    const normalizedSearch = normalizeText(search.trim());

    return [...items]
      .filter((recipe) => {
        const matchesSearch =
          !normalizedSearch ||
          getRecipeSearchDocument(recipe).includes(normalizedSearch);

        const matchesTag =
          !selectedTagCode ||
          recipe.tags.some((tag) => tag.code === selectedTagCode);

        const matchesIntent = selectedIntentCodes.every((intentCode) =>
          recipeMatchesIntent(recipe, intentCode),
        );

        if (projectionMode === "HOUSEHOLD") {
          const householdFit =
            recipeHasTag(recipe, "FAMILY") ||
            recipeHasTag(recipe, "KID") ||
            recipe.default_servings >= 3;

          return matchesSearch && matchesTag && matchesIntent && householdFit;
        }

        return matchesSearch && matchesTag && matchesIntent;
      })
      .sort((a, b) => {
        return (
          getFitWeight(b.fit.fit_status) - getFitWeight(a.fit.fit_status) ||
          b.fit.fit_score - a.fit.fit_score ||
          a.prep_minutes +
            a.cook_minutes -
            (b.prep_minutes + b.cook_minutes) ||
          a.title.localeCompare(b.title, "fr")
        );
      })
      .slice(0, 30);
  }, [items, projectionMode, search, selectedIntentCodes, selectedTagCode]);

  const computedSummary = useMemo(() => {
    return {
      total: visibleRecipes.length,
      blocked: visibleRecipes.filter(
        (item) => item.fit.fit_status === "BLOCKED",
      ).length,
      warning: visibleRecipes.filter(
        (item) => item.fit.fit_status === "WARNING",
      ).length,
      ok: visibleRecipes.filter((item) => item.fit.fit_status === "OK").length,
    };
  }, [visibleRecipes]);

  const searchPlaceholder = QUERY_PLACEHOLDERS[mealType];

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

    const option = profileOptions.find(
      (item) => item.profile_id === nextProfileId,
    );

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

  if (authLoading || bootstrapLoading || loading) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            DOMYLI
          </p>
          <h1 className="mt-4 text-3xl font-semibold">
            Chargement de la bibliothèque recettes...
          </h1>
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
            Il faut une session authentifiée et un foyer actif pour accéder à la bibliothèque DOMYLI.
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
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4 rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gold">
              DOMYLI
            </p>
            <h1 className="mt-4 text-3xl font-semibold">
              Bibliothèque recettes
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
              Bibliothèque publiée, gouvernée et projetée sur un profil métier
              sélectionné dans le foyer — jamais sur un UUID saisi librement.
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
          <div className="rounded-[28px] border border-white/10 bg-black/30 p-8">
            <BookOpen className="h-5 w-5 text-gold" />
            <p className="mt-6 text-sm uppercase tracking-[0.24em] text-gold">
              Recettes visibles
            </p>
            <h2 className="mt-3 text-4xl font-semibold">{computedSummary.total}</h2>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/30 p-8">
            <CheckCircle2 className="h-5 w-5 text-gold" />
            <p className="mt-6 text-sm uppercase tracking-[0.24em] text-gold">
              Compatibles
            </p>
            <h2 className="mt-3 text-4xl font-semibold">{computedSummary.ok}</h2>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/30 p-8">
            <AlertTriangle className="h-5 w-5 text-gold" />
            <p className="mt-6 text-sm uppercase tracking-[0.24em] text-gold">
              À vérifier / bloquées
            </p>
            <h2 className="mt-3 text-4xl font-semibold">
              {computedSummary.warning + computedSummary.blocked}
            </h2>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_380px]">
          <section className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)_220px]">
              <label className="block">
                <span className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/60">
                  Type de repas
                </span>
                <select
                  value={mealType}
                  onChange={(event) =>
                    setMealType(event.target.value as RecipeMealType)
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

              <label className="block">
                <span className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/60">
                  Décrivez l’intention du repas
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

              <label className="block">
                <span className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/60">
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
            </div>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                Pour qui cherchez-vous une recette ?
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setProjectionMode("NEUTRAL")}
                  className={`border px-4 py-3 text-xs uppercase tracking-[0.22em] transition-colors ${
                    projectionMode === "NEUTRAL"
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-white/10 text-white/65 hover:border-gold/40 hover:text-gold"
                  }`}
                >
                  Neutre
                </button>

                <button
                  type="button"
                  onClick={() => setProjectionMode("HOUSEHOLD")}
                  className={`border px-4 py-3 text-xs uppercase tracking-[0.22em] transition-colors ${
                    projectionMode === "HOUSEHOLD"
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-white/10 text-white/65 hover:border-gold/40 hover:text-gold"
                  }`}
                >
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
                  Profil ciblé
                </button>
              </div>
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
                      <div className="rounded-[20px] border border-amber-400/20 bg-amber-400/10 px-4 py-4 text-sm text-amber-100">
                        Aucun profil gouverné n’existe encore dans ce foyer.
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
                      {recentProfileTargets.length === 0 ? (
                        <p className="text-sm text-white/60">
                          Aucun profil récent. Le premier profil ciblé sera mémorisé ici.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {recentProfileTargets.map((item) => (
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
                  {getProjectionLabel(projectionMode, activeProfileLabel)}
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
                  onClick={() => void refresh()}
                  className="inline-flex items-center justify-center gap-3 border border-white/10 px-5 py-4 text-xs uppercase tracking-[0.24em] text-white/75 transition-colors hover:border-gold/40 hover:text-gold"
                >
                  <RefreshCw className="h-4 w-4" />
                  Recharger
                </button>
              </div>
            </div>

            {localMessage ? (
              <div className="mt-6 rounded-[20px] border border-gold/20 bg-gold/10 px-4 py-4 text-sm text-gold">
                {localMessage}
              </div>
            ) : null}

            <div className="mt-8">
              <h2 className="text-2xl font-semibold">
                {visibleRecipes.length} recette(s) candidate(s) pour{" "}
                {getRecipeMealTypeLabel(mealType)}
              </h2>

              <div className="mt-6 grid gap-4">
                {visibleRecipes.length === 0 ? (
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

                    return (
                      <div
                        key={recipe.recipe_id}
                        className="rounded-[28px] border border-white/10 bg-black/20 p-6"
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
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-gold" />
                <p className="text-sm uppercase tracking-[0.24em] text-gold">
                  Lecture métier DOMYLI
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
                    {getProjectionLabel(projectionMode, activeProfileLabel)}
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

                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                    Logique cible
                  </p>
                  <p className="mt-2 text-white/70">
                    Le ciblage passe maintenant par un profil du foyer déjà créé,
                    jamais par un identifiant technique saisi à la main.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(ROUTES.MEALS)}
              className="inline-flex w-full items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
            >
              <Target className="h-4 w-4" />
              Continuer vers Meals
            </button>

            {error ? (
              <div className="rounded-[20px] border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
                {error.message}
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}