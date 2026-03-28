import { useMemo } from "react";
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  CookingPot,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { useCatalog } from "@/src/hooks/useCatalog";
import { ROUTES } from "@/src/constants/routes";
import { getMealFlowLabel } from "@/src/constants/mealCatalog";
import { getTaskFlowLabel } from "@/src/constants/taskCatalog";

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

  const { loading, error, recipes, taskTemplates, recipeCount, taskTemplateCount } =
    useCatalog();

  const highlightedRecipes = useMemo(() => recipes.slice(0, 6), [recipes]);
  const highlightedTasks = useMemo(() => taskTemplates.slice(0, 6), [taskTemplates]);

  if (authLoading || bootstrapLoading || loading) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-semibold">
            Chargement de la bibliothèque...
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
                <h1 className="mt-4 text-3xl font-semibold">Bibliothèque</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                  Cette bibliothèque mondiale prépare les repas et les tâches
                  autour d’un socle gouverné : recettes publiées côté back,
                  templates de tâches structurés côté produit.
                </p>
              </div>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-gold">
              <BookOpen className="h-4 w-4" />
              Catalogue DOMYLI
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Recettes publiées
                </p>
                <p className="mt-3 text-3xl font-semibold">{recipeCount}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Templates de tâches
                </p>
                <p className="mt-3 text-3xl font-semibold">{taskTemplateCount}</p>
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
                      <h3 className="text-lg font-medium">{recipe.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-white/70">
                        {recipe.description || "Description non renseignée."}
                      </p>
                      <p className="mt-4 text-xs uppercase tracking-[0.22em] text-white/45">
                        Publiée : {recipe.is_active ? "Oui" : "Non"}
                      </p>
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

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="inline-flex items-center gap-2 text-white">
                  <ClipboardList className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.24em]">
                    Templates de tâches
                  </p>
                </div>

                <div className="mt-5 space-y-4">
                  {highlightedTasks.map((task) => (
                    <div
                      key={task.code}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <p className="text-sm font-medium text-white">{task.label}</p>
                      <p className="mt-2 text-xs text-white/60">
                        {task.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {task.flows.map((flow) => (
                          <FlowBadge key={`${task.code}-${flow}`} label={getTaskFlowLabel(flow)} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-gold/20 bg-gold/10 p-5">
                <div className="inline-flex items-center gap-2 text-gold">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.24em]">
                    Préparation des étapes suivantes
                  </p>
                </div>

                <p className="mt-3 text-sm leading-7 text-gold/90">
                  Cette bibliothèque prépare directement les prochains runs :
                  recettes publiées pour Meals, templates structurés pour Tasks.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <FlowBadge label={getMealFlowLabel("INVENTORY")} />
                  <FlowBadge label={getMealFlowLabel("SHOPPING")} />
                  <FlowBadge label={getMealFlowLabel("RULES")} />
                </div>
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