import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookMarked,
  CookingPot,
  Layers3,
  Lock,
  Save,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { useCatalog } from "@/src/hooks/useCatalog";
import { ROUTES } from "@/src/constants/routes";
import {
  DOMYLI_RECIPE_DIFFICULTY_OPTIONS,
  DOMYLI_RECIPE_FIT_OPTIONS,
  DOMYLI_RECIPE_MEAL_TYPE_OPTIONS,
  DOMYLI_RECIPE_STOCK_INTENSITY_OPTIONS,
  getRecipeBlueprintByKey,
  getRecipeDifficultyLabel,
  getRecipeFitLabel,
  getRecipeMealTypeLabel,
  getRecipeStockIntensityLabel,
  type DomyliRecipeDifficulty,
  type DomyliRecipeFit,
  type DomyliRecipeMealType,
  type DomyliRecipeStockIntensity,
} from "@/src/constants/recipeCatalog";

function MetaBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/70">
      {label}
    </span>
  );
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    const value = (error as { message?: unknown }).message;
    return typeof value === "string" ? value : "Une erreur est survenue.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur est survenue.";
}

function linesToMultiline(values: string[]): string {
  return values.join("\n");
}

function multilineToList(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

const DEFAULT_BLUEPRINT_KEY = "breakfast-protein-omelet";
const DEFAULT_BLUEPRINT =
  getRecipeBlueprintByKey(DEFAULT_BLUEPRINT_KEY) ?? null;

export default function AdminCatalogPage() {
  const navigate = useNavigate();
  const {
    bootstrap,
    isAuthenticated,
    hasHousehold,
    authLoading,
    bootstrapLoading,
    activeMembership,
  } = useAuth();

  const {
    loading,
    saving,
    publishingPack,
    error,
    recipes,
    blueprints,
    recipeCount,
    blueprintCount,
    saveRecipe,
    publishBlueprintPack,
    lastSavedRecipeId,
    lastPublishedCount,
  } = useCatalog();

  const [blueprintKey, setBlueprintKey] = useState(DEFAULT_BLUEPRINT_KEY);
  const [title, setTitle] = useState(DEFAULT_BLUEPRINT?.title ?? "");
  const [description, setDescription] = useState(DEFAULT_BLUEPRINT?.description ?? "");
  const [mealType, setMealType] = useState<DomyliRecipeMealType>(
    DEFAULT_BLUEPRINT?.mealType ?? "BREAKFAST",
  );
  const [difficulty, setDifficulty] = useState<DomyliRecipeDifficulty>(
    DEFAULT_BLUEPRINT?.difficulty ?? "EASY",
  );
  const [stockIntensity, setStockIntensity] =
    useState<DomyliRecipeStockIntensity>(DEFAULT_BLUEPRINT?.stockIntensity ?? "LOW");
  const [fit, setFit] = useState<DomyliRecipeFit>(
    DEFAULT_BLUEPRINT?.fit ?? "FAMILY_BALANCED",
  );
  const [prepMinutes, setPrepMinutes] = useState(
    String(DEFAULT_BLUEPRINT?.prepMinutes ?? 15),
  );
  const [servings, setServings] = useState(String(DEFAULT_BLUEPRINT?.servings ?? 2));
  const [tagsText, setTagsText] = useState(
    linesToMultiline(DEFAULT_BLUEPRINT?.tags ?? []),
  );
  const [ingredientsText, setIngredientsText] = useState(
    linesToMultiline(DEFAULT_BLUEPRINT?.ingredients ?? []),
  );
  const [stepsText, setStepsText] = useState(
    linesToMultiline(DEFAULT_BLUEPRINT?.steps ?? []),
  );
  const [operatorNotes, setOperatorNotes] = useState(
    "Publication starter DOMYLI depuis le cockpit Super Admin.",
  );
  const [isActive, setIsActive] = useState(true);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const isSuperAdmin = Boolean(bootstrap?.is_super_admin);

  const publishedPreview = useMemo(() => recipes.slice(0, 8), [recipes]);
  const blueprintPreview = useMemo(() => blueprints.slice(0, 6), [blueprints]);

  const applyBlueprint = (targetKey: string) => {
    const blueprint = getRecipeBlueprintByKey(targetKey);

    if (!blueprint) {
      return;
    }

    setBlueprintKey(blueprint.key);
    setTitle(blueprint.title);
    setDescription(blueprint.description);
    setMealType(blueprint.mealType);
    setDifficulty(blueprint.difficulty);
    setStockIntensity(blueprint.stockIntensity);
    setFit(blueprint.fit);
    setPrepMinutes(String(blueprint.prepMinutes));
    setServings(String(blueprint.servings));
    setTagsText(linesToMultiline(blueprint.tags));
    setIngredientsText(linesToMultiline(blueprint.ingredients));
    setStepsText(linesToMultiline(blueprint.steps));
    setOperatorNotes(
      "Publication starter DOMYLI depuis le cockpit Super Admin.",
    );
    setIsActive(true);
  };

  const resetForm = () => {
    applyBlueprint(DEFAULT_BLUEPRINT_KEY);
  };

  const handlePublishPack = async () => {
    setLocalMessage(null);

    try {
      const ids = await publishBlueprintPack();
      setLocalMessage(
        ids.length > 0
          ? `${ids.length} recettes starter publiées dans la bibliothèque.`
          : "Aucune recette n’a été publiée.",
      );
    } catch (publishError) {
      setLocalMessage(getErrorMessage(publishError));
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalMessage(null);

    try {
      const recipeId = await saveRecipe({
        p_title: title,
        p_description: description,
        p_instructions: operatorNotes,
        p_is_active: isActive,
        p_meal_type: mealType,
        p_difficulty: difficulty,
        p_stock_intensity: stockIntensity,
        p_fit: fit,
        p_prep_minutes: Number(prepMinutes || 15),
        p_servings: Number(servings || 2),
        p_tags: multilineToList(tagsText),
        p_ingredients: multilineToList(ingredientsText),
        p_steps: multilineToList(stepsText),
      });

      setLocalMessage(
        recipeId
          ? `Recette publiée dans la bibliothèque : ${recipeId}`
          : "Recette publiée dans la bibliothèque.",
      );
    } catch (saveError) {
      setLocalMessage(getErrorMessage(saveError));
    }
  };

  if (authLoading || bootstrapLoading || loading) {
    return (
      <main className="min-h-screen bg-obsidian px-6 py-10 text-alabaster">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
              <ShieldCheck className="h-6 w-6 text-gold" />
            </div>
            <p className="text-xs uppercase tracking-[0.32em] text-gold">
              DOMYLI
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Chargement du cockpit recettes...
            </h1>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-obsidian px-6 py-10 text-alabaster">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-10 text-center backdrop-blur">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-black/20">
              <Lock className="h-6 w-6 text-white/80" />
            </div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold">
              Accès restreint
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-white">
              Session requise
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/70">
              Il faut une session authentifiée pour accéder au cockpit recettes.
            </p>
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-black"
            >
              Retour à l’accueil
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!isSuperAdmin) {
    return (
      <main className="min-h-screen bg-obsidian px-6 py-10 text-alabaster">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-10 text-center backdrop-blur">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-black/20">
              <Lock className="h-6 w-6 text-white/80" />
            </div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold">
              Accès restreint
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-white">
              Cockpit Super Admin
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/70">
              Cette surface de gouvernance recettes est réservée au Super Admin
              DOMYLI.
            </p>
            <button
              onClick={() =>
                navigate(hasHousehold ? ROUTES.DASHBOARD : ROUTES.HOME)
              }
              className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-black"
            >
              {hasHousehold ? "Retour au dashboard" : "Retour à l’accueil"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-obsidian px-6 py-10 text-alabaster">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div className="max-w-3xl">
            <button
              onClick={() =>
                navigate(hasHousehold ? ROUTES.DASHBOARD : ROUTES.HOME)
              }
              className="mb-6 inline-flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
              aria-label="Retour"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <p className="text-xs uppercase tracking-[0.28em] text-gold">
              DOMYLI
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              Bibliothèque Recettes · Super Admin
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
              Cette surface permet de construire une bibliothèque mondiale de
              recettes alignée sur la cible DOMYLI : repas structurés, lisibles,
              gouvernés, compatibles avec profils, stock, courses et exécution.
            </p>
          </div>

          <div className="rounded-3xl border border-gold/20 bg-gold/10 px-5 py-4 text-right">
            <div className="inline-flex items-center gap-2 text-gold">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.24em]">
                Super Admin
              </span>
            </div>
            <p className="mt-2 text-sm text-gold/90">
              {hasHousehold
                ? activeMembership?.household_name ?? "Foyer actif"
                : "Cockpit global sans foyer requis"}
            </p>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">
              Recettes publiées
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {recipeCount}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">
              Blueprints starter
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {blueprintCount}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">
              Dernier lot publié
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {lastPublishedCount}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">
              Dernière recette
            </p>
            <p className="mt-3 truncate text-sm text-white/85">
              {lastSavedRecipeId ?? "Aucune"}
            </p>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10">
                  <CookingPot className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-gold">
                    Publication recette
                  </p>
                  <p className="mt-1 text-sm text-white/65">
                    Contrat RPC conservé. Couche métier DOMYLI structurée côté
                    front.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePublishPack}
                disabled={publishingPack || saving}
                className="inline-flex items-center gap-3 border border-gold bg-gold px-5 py-3 text-xs uppercase tracking-[0.24em] text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {publishingPack
                  ? "Publication du starter pack..."
                  : "Publier le starter pack DOMYLI"}
              </button>
            </div>

            <div className="mb-6 rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-3">
                <Layers3 className="h-4 w-4 text-gold" />
                <p className="text-xs uppercase tracking-[0.24em] text-gold">
                  Préremplissage intelligent
                </p>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_auto]">
                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Blueprint starter</span>
                  <select
                    value={blueprintKey}
                    onChange={(event) => setBlueprintKey(event.target.value)}
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  >
                    {blueprints.map((blueprint) => (
                      <option key={blueprint.key} value={blueprint.key}>
                        {blueprint.title}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => applyBlueprint(blueprintKey)}
                  className="self-end border border-white/10 px-5 py-4 text-xs uppercase tracking-[0.24em] text-white/75 transition-colors hover:border-gold/40 hover:text-gold"
                >
                  Préremplir
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="self-end border border-white/10 px-5 py-4 text-xs uppercase tracking-[0.24em] text-white/75 transition-colors hover:border-gold/40 hover:text-gold"
                >
                  Reset
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block text-sm text-white/80 md:col-span-2">
                  <span className="mb-2 block">Titre de recette</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </label>

                <label className="block text-sm text-white/80 md:col-span-2">
                  <span className="mb-2 block">Promesse / description visible</span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={4}
                    className="w-full resize-none border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </label>

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Type de repas</span>
                  <select
                    value={mealType}
                    onChange={(event) =>
                      setMealType(event.target.value as DomyliRecipeMealType)
                    }
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  >
                    {DOMYLI_RECIPE_MEAL_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Difficulté</span>
                  <select
                    value={difficulty}
                    onChange={(event) =>
                      setDifficulty(event.target.value as DomyliRecipeDifficulty)
                    }
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  >
                    {DOMYLI_RECIPE_DIFFICULTY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Impact stock</span>
                  <select
                    value={stockIntensity}
                    onChange={(event) =>
                      setStockIntensity(
                        event.target.value as DomyliRecipeStockIntensity,
                      )
                    }
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  >
                    {DOMYLI_RECIPE_STOCK_INTENSITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Fit DOMYLI</span>
                  <select
                    value={fit}
                    onChange={(event) =>
                      setFit(event.target.value as DomyliRecipeFit)
                    }
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  >
                    {DOMYLI_RECIPE_FIT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Temps préparation (min)</span>
                  <input
                    value={prepMinutes}
                    onChange={(event) => setPrepMinutes(event.target.value)}
                    type="number"
                    min={1}
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </label>

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Portions</span>
                  <input
                    value={servings}
                    onChange={(event) => setServings(event.target.value)}
                    type="number"
                    min={1}
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </label>

                <label className="block text-sm text-white/80 md:col-span-2">
                  <span className="mb-2 block">Tags (une ligne = un tag)</span>
                  <textarea
                    value={tagsText}
                    onChange={(event) => setTagsText(event.target.value)}
                    rows={4}
                    className="w-full resize-none border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </label>

                <label className="block text-sm text-white/80 md:col-span-2">
                  <span className="mb-2 block">Ingrédients (une ligne = un ingrédient)</span>
                  <textarea
                    value={ingredientsText}
                    onChange={(event) => setIngredientsText(event.target.value)}
                    rows={6}
                    className="w-full resize-none border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </label>

                <label className="block text-sm text-white/80 md:col-span-2">
                  <span className="mb-2 block">Étapes (une ligne = une étape)</span>
                  <textarea
                    value={stepsText}
                    onChange={(event) => setStepsText(event.target.value)}
                    rows={7}
                    className="w-full resize-none border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </label>

                <label className="block text-sm text-white/80 md:col-span-2">
                  <span className="mb-2 block">Note opérateur / publication</span>
                  <textarea
                    value={operatorNotes}
                    onChange={(event) => setOperatorNotes(event.target.value)}
                    rows={3}
                    className="w-full resize-none border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/80 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) => setIsActive(event.target.checked)}
                    className="h-4 w-4"
                  />
                  Publier immédiatement dans la bibliothèque
                </label>
              </div>

              <button
                type="submit"
                disabled={saving || publishingPack}
                className="inline-flex w-full items-center justify-center gap-3 border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.24em] text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? "Publication en cours..." : "Publier la recette"}
              </button>

              {(localMessage || error?.message) && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/85">
                  {localMessage ?? error?.message}
                </div>
              )}
            </form>
          </section>

          <aside className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="inline-flex items-center gap-2 text-white">
                  <BookMarked className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.24em]">
                    Blueprints starter
                  </p>
                </div>

                <div className="mt-5 space-y-4">
                  {blueprintPreview.map((blueprint) => (
                    <div
                      key={blueprint.key}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {blueprint.title}
                          </p>
                          <p className="mt-2 text-xs leading-6 text-white/60">
                            {blueprint.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => applyBlueprint(blueprint.key)}
                          className="border border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-white/70 transition-colors hover:border-gold/40 hover:text-gold"
                        >
                          Utiliser
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <MetaBadge label={getRecipeMealTypeLabel(blueprint.mealType)} />
                        <MetaBadge label={getRecipeFitLabel(blueprint.fit)} />
                        <MetaBadge
                          label={getRecipeStockIntensityLabel(
                            blueprint.stockIntensity,
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="inline-flex items-center gap-2 text-white">
                  <CookingPot className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.24em]">
                    Recettes publiées
                  </p>
                </div>

                <div className="mt-5 space-y-4">
                  {publishedPreview.length === 0 ? (
                    <p className="text-sm text-white/60">
                      Aucune recette publiée.
                    </p>
                  ) : (
                    publishedPreview.map((recipe) => (
                      <div
                        key={recipe.recipe_id}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                      >
                        <p className="text-sm font-medium text-white">
                          {recipe.title}
                        </p>
                        <p className="mt-2 text-xs leading-6 text-white/60">
                          {recipe.description || "Description non renseignée."}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <MetaBadge label={getRecipeMealTypeLabel(recipe.meal_type)} />
                          <MetaBadge label={getRecipeDifficultyLabel(recipe.difficulty)} />
                          <MetaBadge label={getRecipeFitLabel(recipe.fit)} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-gold/20 bg-gold/10 p-5">
                <div className="inline-flex items-center gap-2 text-gold">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.24em]">
                    Lecture cible DOMYLI
                  </p>
                </div>
                <p className="mt-3 text-sm leading-7 text-gold/90">
                  La recette n’est plus un simple texte libre. Elle devient un
                  objet gouverné : type de repas, fit cible, impact stock,
                  portions, tags, ingrédients et étapes.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}