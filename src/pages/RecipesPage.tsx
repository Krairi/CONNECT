import { useMemo } from "react";
import {
  ArrowLeft,
  BookOpen,
  CookingPot,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { useCatalog } from "@/src/hooks/useCatalog";
import { ROUTES } from "@/src/constants/routes";
import {
  getRecipeDifficultyLabel,
  getRecipeFitLabel,
  getRecipeMealTypeLabel,
  getRecipeStockIntensityLabel,
} from "@/src/constants/recipeCatalog";

function FlowBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gold">
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

  const { loading, error, recipes, recipeCount } = useCatalog();

  const highlightedRecipes = useMemo(() => recipes.slice(0, 8), [recipes]);
  const breakfastCount = useMemo(
    () => recipes.filter((recipe) => recipe.meal_type === "BREAKFAST").length,
    [recipes],
  );
  const lunchDinnerCount = useMemo(
    () =>
      recipes.filter(
        (recipe) => recipe.meal_type === "LUNCH" || recipe.meal_type === "DINNER",
      ).length,
    [recipes],
  );

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
                  Bibliothèque mondiale gouvernée par le Super Admin : recettes
                  lisibles, structurées, publiées et directement réutilisables
                  dans les prochains flux repas.
                </p>
              </div>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-gold">
              <BookOpen className="h-4 w-4" />
              Catalogue DOMYLI
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Recettes publiées
                </p>
                <p className="mt-3 text-3xl font-semibold">{recipeCount}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Bases matin
                </p>
                <p className="mt-3 text-3xl font-semibold">{breakfastCount}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Déjeuners / dîners
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {lunchDinnerCount}
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6">
              <div className="flex items-center gap-3">
                <CookingPot className="h-5 w-5 text-gold" />
                <h2 className="text-xl font-medium">Recettes publiées</h2>
              </div>

              <div className="mt-6 space-y-4">
                {highlightedRecipes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/60">
                    Aucune recette publiée pour le moment.
                  </div>
                ) : (
                  highlightedRecipes.map((recipe) => (
                    <article
                      key={recipe.recipe_id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-medium">{recipe.title}</h3>
                          <p className="mt-3 text-sm leading-7 text-white/70">
                            {recipe.description || "Description non renseignée."}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <FlowBadge label={getRecipeMealTypeLabel(recipe.meal_type)} />
                          <FlowBadge label={getRecipeFitLabel(recipe.fit)} />
                          <FlowBadge
                            label={getRecipeDifficultyLabel(recipe.difficulty)}
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
                            {recipe.prep_minutes} min
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
                            {recipe.servings}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                            Impact stock
                          </p>
                          <p className="mt-2 text-sm text-white">
                            {getRecipeStockIntensityLabel(recipe.stock_intensity)}
                          </p>
                        </div>
                      </div>

                      {recipe.tags.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {recipe.tags.map((tag) => (
                            <FlowBadge key={`${recipe.recipe_id}-${tag}`} label={tag} />
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                            Ingrédients clés
                          </p>
                          <ul className="mt-3 space-y-2 text-sm text-white/80">
                            {recipe.ingredients.slice(0, 5).map((ingredient) => (
                              <li key={`${recipe.recipe_id}-${ingredient}`}>• {ingredient}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                            Étapes clés
                          </p>
                          <ul className="mt-3 space-y-2 text-sm text-white/80">
                            {recipe.steps.slice(0, 4).map((step, index) => (
                              <li key={`${recipe.recipe_id}-${index}`}>{index + 1}. {step}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </article>
                  ))
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
                    Lecture cible DOMYLI
                  </p>
                </div>

                <p className="mt-3 text-sm leading-7 text-gold/90">
                  Cette bibliothèque prépare un pilotage repas plus robuste :
                  recettes normalisées, portions connues, temps lisible,
                  ingrédients structurés et tags exploitables.
                </p>
              </div>

              {error ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/85">
                  {error.message}
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