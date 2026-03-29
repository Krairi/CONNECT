import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Search,
  ShieldCheck,
  Sparkles,
  Timer,
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
} from "@/src/constants/recipeCatalog";

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
  } = useRecipeLibrary();

  const highlightedRecipes = useMemo(() => items.slice(0, 24), [items]);

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
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
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
                  Bibliothèque gouvernée, alimentée par le cockpit Super Admin et
                  déjà cadenassée côté back. La lecture s’adapte au repas choisi
                  et peut être projetée sur un profil humain si tu fournis son
                  identifiant métier.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Recettes visibles
                </p>
                <p className="mt-3 text-3xl font-semibold">{summary.total}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Compatibles
                </p>
                <p className="mt-3 text-3xl font-semibold">{summary.ok}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  À vérifier / bloquées
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {summary.warning + summary.blocked}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 rounded-[24px] border border-white/10 bg-black/20 p-5 lg:grid-cols-[0.9fr_1.1fr_1fr_1fr]">
              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Repas</span>
                <select
                  value={mealType}
                  onChange={(event) =>
                    setMealType(event.target.value as typeof mealType)
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
                <span className="mb-2 block">Recherche</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Titre, code, description"
                    className="w-full border border-white/10 bg-black/30 py-4 pl-11 pr-4 text-sm outline-none focus:border-gold/50"
                  />
                </div>
              </label>

              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Tag</span>
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

              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Profil humain (UUID optionnel)</span>
                <input
                  value={profileId}
                  onChange={(event) => setProfileId(event.target.value)}
                  placeholder="Projection profil via RPC"
                  className="w-full border border-white/10 bg-black/30 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </label>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-gold" />
                <h2 className="text-xl font-medium">
                  {getRecipeMealTypeLabel(mealType)}
                </h2>
              </div>

              <div className="mt-6 space-y-4">
                {highlightedRecipes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/60">
                    Aucune recette publiée pour ce filtre.
                  </div>
                ) : (
                  highlightedRecipes.map((recipe) => {
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
                            <MetaBadge
                              label={getRecipeDifficultyLabel(recipe.difficulty)}
                            />
                            <MetaBadge
                              label={getRecipeStockIntensityLabel(
                                recipe.stock_intensity,
                              )}
                            />
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="inline-flex items-center gap-2 text-white/70">
                              <Timer className="h-4 w-4" />
                              <span className="text-xs uppercase tracking-[0.22em]">
                                Temps
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-white">
                              {recipe.prep_minutes} min prep · {recipe.cook_minutes} min cuisson
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="inline-flex items-center gap-2 text-white/70">
                              <Users className="h-4 w-4" />
                              <span className="text-xs uppercase tracking-[0.22em]">
                                Portions
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-white">
                              {recipe.default_servings}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                              Code recette
                            </p>
                            <p className="mt-2 text-sm text-white/85 break-all">
                              {recipe.recipe_code}
                            </p>
                          </div>
                        </div>

                        {recipe.tags.length > 0 ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {recipe.tags.map((tag) => (
                              <MetaBadge key={`${recipe.recipe_id}-${tag.code}`} label={tag.label} />
                            ))}
                          </div>
                        ) : null}

                        {(recipe.fit.warnings.length > 0 ||
                          recipe.fit.blocked_reasons.length > 0 ||
                          recipe.fit.fit_reasons.length > 0) && (
                          <div className="mt-4 grid gap-4 lg:grid-cols-3">
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                              <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                                Fit reasons
                              </p>
                              <ul className="mt-3 space-y-2 text-sm text-white/80">
                                {recipe.fit.fit_reasons.length === 0 ? (
                                  <li>—</li>
                                ) : (
                                  recipe.fit.fit_reasons.map((reason) => (
                                    <li key={`${recipe.recipe_id}-${reason}`}>• {reason}</li>
                                  ))
                                )}
                              </ul>
                            </div>

                            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
                              <p className="text-xs uppercase tracking-[0.22em] text-amber-100">
                                Warnings
                              </p>
                              <ul className="mt-3 space-y-2 text-sm text-amber-50">
                                {recipe.fit.warnings.length === 0 ? (
                                  <li>—</li>
                                ) : (
                                  recipe.fit.warnings.map((warning) => (
                                    <li key={`${recipe.recipe_id}-${warning}`}>
                                      • {warning}
                                    </li>
                                  ))
                                )}
                              </ul>
                            </div>

                            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
                              <p className="text-xs uppercase tracking-[0.22em] text-red-100">
                                Blocked reasons
                              </p>
                              <ul className="mt-3 space-y-2 text-sm text-red-50">
                                {recipe.fit.blocked_reasons.length === 0 ? (
                                  <li>—</li>
                                ) : (
                                  recipe.fit.blocked_reasons.map((reason) => (
                                    <li key={`${recipe.recipe_id}-${reason}`}>
                                      • {reason}
                                    </li>
                                  ))
                                )}
                              </ul>
                            </div>
                          </div>
                        )}
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
              Lecture métier DOMYLI
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
                  {profileId.trim()
                    ? "RPC personnalisée activée"
                    : "Lecture neutre sans profil"}
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
                    Chaîne de valeur DOMYLI
                  </p>
                </div>

                <p className="mt-3 text-sm leading-7 text-gold/90">
                  La recette n’est plus un texte libre. C’est un objet gouverné,
                  publié, filtré par repas, enrichi par compatibilité profil et
                  prêt à être injecté dans Meals.
                </p>
              </div>

              {error ? (
                <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-50">
                  <div className="inline-flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {error.message}
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => navigate(ROUTES.MEALS)}
                className="inline-flex w-full items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Continuer vers Meals
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
