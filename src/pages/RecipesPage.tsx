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

const PROFILE_STORAGE_KEY = "domyli:meals:recent-profile-targets:v2";
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

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function recipeHasTag(recipe: RecipeCardData, code: string): boolean {
  return recipe.tags.some((tag) => tag.code.toUpperCase() === code);
}

function recipeMatchesIntent(recipe: RecipeCardData, intentCode: SearchIntentCode): boolean {
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

function getProjectionLabel(mode: ProjectionMode, profileLabel: string): string {
  if (mode === "TARGETED") {
    return profileLabel || "Projection ciblée sur un profil humain";
  }

  if (mode === "HOUSEHOLD") {
    return "Lecture foyer : recettes les plus consensuelles";
  }

  return "Compatibilité neutre sans profil";
}

type RecipeCardData = ReturnType<typeof useRecipeLibrary>["items"][number];

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
    summary,
    setMealType,
    setProfileId,
    setSearch,
    setSelectedTagCode,
    refresh,
  } = useRecipeLibrary();

  const [projectionMode, setProjectionMode] = useState<ProjectionMode>("NEUTRAL");
  const [recentProfileTargets, setRecentProfileTargets] = useState<RecentProfileTarget[]>([]);
  const [selectedIntentCodes, setSelectedIntentCodes] = useState<SearchIntentCode[]>([]);

  useEffect(() => {
    setRecentProfileTargets(readRecentProfileTargets());
  }, []);

  useEffect(() => {
    if (projectionMode !== "TARGETED" && profileId) {
      setProfileId("");
    }
  }, [projectionMode, profileId, setProfileId]);

  const activeProfileLabel = useMemo(() => {
    if (!profileId.trim()) return "";

    const matched = recentProfileTargets.find((item) => item.profileId === profileId.trim());
    return matched?.profileLabel ?? `Profil ciblé ${profileId.trim().slice(0, 8)}…`;
  }, [profileId, recentProfileTargets]);

  const visibleRecipes = useMemo(() => {
    const normalizedSearch = normalizeText(search.trim());

    return [...items]
      .filter((recipe) => {
        const matchesSearch = !normalizedSearch || getRecipeSearchDocument(recipe).includes(normalizedSearch);
        const matchesTag =
          !selectedTagCode || recipe.tags.some((tag) => tag.code === selectedTagCode);
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
          a.prep_minutes + a.cook_minutes - (b.prep_minutes + b.cook_minutes) ||
          a.title.localeCompare(b.title, "fr")
        );
      })
      .slice(0, 30);
  }, [items, projectionMode, search, selectedIntentCodes, selectedTagCode]);

  const computedSummary = useMemo(() => {
    return {
      total: visibleRecipes.length,
      blocked: visibleRecipes.filter((item) => item.fit.fit_status === "BLOCKED").length,
      warning: visibleRecipes.filter((item) => item.fit.fit_status === "WARNING").length,
      ok: visibleRecipes.filter((item) => item.fit.fit_status === "OK").length,
    };
  }, [visibleRecipes]);

  const searchPlaceholder = QUERY_PLACEHOLDERS[mealType];

  const toggleIntent = (code: SearchIntentCode) => {
    setSelectedIntentCodes((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code],
    );
  };

  const applyRecentProfile = (item: RecentProfileTarget) => {
    setProjectionMode("TARGETED");
    setProfileId(item.profileId);
  };

  if (authLoading || bootstrapLoading || loading) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-semibold">
            Chargement de la bibliothèque recettes...
          </h1>
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
            Il faut une session authentifiée et un foyer actif pour accéder à la
            bibliothèque DOMYLI.
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
                <p className="text-xs uppercase tracking-[0.24em] text-gold">
                  DOMYLI
                </p>
                <h1 className="mt-4 text-3xl font-semibold">
                  Bibliothèque recettes
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                  Bibliothèque publiée, gouvernée et déjà cadenassée côté back.
                  Ici, l’utilisateur ne cherche pas un simple mot-clé : il exprime
                  une intention domestique, un repas et éventuellement une cible
                  humaine.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Recettes visibles
                </p>
                <p className="mt-3 text-3xl font-semibold">{computedSummary.total}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Compatibles
                </p>
                <p className="mt-3 text-3xl font-semibold">{computedSummary.ok}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  À vérifier / bloquées
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {computedSummary.warning + computedSummary.blocked}
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-[24px] border border-white/10 bg-black/20 p-5">
              <div className="grid gap-4 xl:grid-cols-[0.75fr_1.1fr_1.15fr]">
                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Type de repas</span>
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

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Décrivez l’intention du repas</span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={searchPlaceholder}
                      className="w-full border border-white/10 bg-black/30 py-4 pl-11 pr-4 text-sm outline-none focus:border-gold/50"
                    />
                  </div>
                </label>

                <div>
                  <span className="mb-2 block text-sm text-white/80">
                    Pour qui cherchez-vous une recette ?
                  </span>
                  <div className="grid gap-2 sm:grid-cols-3">
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

                  {projectionMode === "TARGETED" ? (
                    <div className="mt-3 space-y-3">
                      <input
                        value={profileId}
                        onChange={(event) => setProfileId(event.target.value)}
                        placeholder="Coller un profil humain connu ou reprendre une cible récente"
                        className="w-full border border-white/10 bg-black/30 px-4 py-4 text-sm outline-none focus:border-gold/50"
                      />

                      {recentProfileTargets.length > 0 ? (
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
                      ) : (
                        <p className="text-xs leading-6 text-white/50">
                          Aucun profil récent mémorisé côté Meals. La projection ciblée
                          s’active dès qu’un identifiant métier est fourni.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
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

              <div className="mt-4 grid gap-4 md:grid-cols-[0.8fr_1.2fr_auto]">
                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Tag métier</span>
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

                <div className="rounded-3xl border border-white/10 bg-black/30 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                    Projection active
                  </p>
                  <p className="mt-2 text-sm text-white/85">
                    {getProjectionLabel(projectionMode, activeProfileLabel)}
                  </p>
                </div>

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

            <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-gold" />
                <h2 className="text-xl font-medium">
                  {visibleRecipes.length} recette(s) candidate(s) pour {getRecipeMealTypeLabel(mealType)}
                </h2>
              </div>

              <div className="mt-6 space-y-4">
                {visibleRecipes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/60">
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
                      <article
                        key={recipe.recipe_id}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-medium">{recipe.title}</h3>
                            <p className="mt-3 text-sm leading-7 text-white/70">
                              {recipe.short_description}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <MetaBadge
                              label={getRecipeFitStatusLabel(recipe.fit.fit_status)}
                              tone={fitTone}
                            />
                            <MetaBadge label={getRecipeDifficultyLabel(recipe.difficulty)} />
                            <MetaBadge label={getRecipeStockIntensityLabel(recipe.stock_intensity)} />
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <MetaBadge label={`${recipe.prep_minutes + recipe.cook_minutes} min`} />
                          <MetaBadge label={`${recipe.default_servings} portions`} />
                          {recipe.tags.slice(0, 4).map((tag) => (
                            <MetaBadge key={`${recipe.recipe_id}-${tag.code}`} label={tag.label} />
                          ))}
                        </div>

                        {recipe.fit.fit_reasons.length > 0 ? (
                          <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                            {recipe.fit.fit_reasons.join(" · ")}
                          </div>
                        ) : null}

                        {recipe.fit.warnings.length > 0 ? (
                          <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                            {recipe.fit.warnings.join(" · ")}
                          </div>
                        ) : null}

                        {recipe.fit.blocked_reasons.length > 0 ? (
                          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
                            {recipe.fit.blocked_reasons.join(" · ")}
                          </div>
                        ) : null}
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          <aside className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/70">
              <ShieldCheck className="h-4 w-4" />
              Lecture DOMYLI
            </div>

            <div className="mt-8 space-y-5">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Email
                </p>
                <p className="mt-2 text-sm text-white/85">{sessionEmail ?? "—"}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Foyer actif
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {activeMembership?.household_name ?? "—"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Projection profil
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {getProjectionLabel(projectionMode, activeProfileLabel)}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Super Admin
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {bootstrap?.is_super_admin ? "Oui" : "Non"}
                </p>
              </div>

              <div className="rounded-3xl border border-gold/20 bg-gold/10 p-5">
                <div className="inline-flex items-center gap-2 text-gold">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.24em]">
                    Logique cible
                  </p>
                </div>

                <p className="mt-3 text-sm leading-7 text-gold/90">
                  DOMYLI ne te demande plus un identifiant technique vide. Tu choisis
                  désormais une intention de repas, un mode de projection et, si besoin,
                  un profil humain déjà utilisé dans le système.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/85">
                <div className="flex items-center gap-3 text-white">
                  <Target className="h-4 w-4 text-gold" />
                  <span>Résumé de filtre</span>
                </div>
                <div className="mt-4 space-y-3 text-white/70">
                  <p className="flex items-start gap-2">
                    <BookOpen className="mt-0.5 h-4 w-4 text-gold" />
                    <span>{getRecipeMealTypeLabel(mealType)}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <UserRound className="mt-0.5 h-4 w-4 text-gold" />
                    <span>{getProjectionLabel(projectionMode, activeProfileLabel)}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Users className="mt-0.5 h-4 w-4 text-gold" />
                    <span>
                      {selectedIntentCodes.length > 0
                        ? selectedIntentCodes
                            .map(
                              (code) =>
                                SEARCH_INTENTS.find((intent) => intent.code === code)?.label ?? code,
                            )
                            .join(" · ")
                        : "Aucun filtre d’intention ajouté"}
                    </span>
                  </p>
                </div>
              </div>

              {error ? (
                <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-100">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                    <span>{error.message}</span>
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => navigate(ROUTES.MEALS)}
                className="inline-flex w-full items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                <CheckCircle2 className="h-4 w-4" />
                Continuer vers Meals
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
