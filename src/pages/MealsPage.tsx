import { useEffect, useMemo, useState } from "react";
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
  Utensils,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { useMeals } from "@/src/hooks/useMeals";
import { ROUTES } from "@/src/constants/routes";
import {
  RECIPE_MEAL_TYPE_OPTIONS,
  getRecipeDifficultyLabel,
  getRecipeFitStatusLabel,
  getRecipeStockIntensityLabel,
} from "@/src/constants/recipeCatalog";
import type { MealType, RecipeCandidate } from "@/src/services/meals/mealService";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
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

function buildMealNotes(recipe: RecipeCandidate, operatorNotes: string): string {
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
  ];

  if (operatorNotes.trim()) {
    lines.push("", "[DOMYLI_OPERATOR_NOTES]", operatorNotes.trim(), "[/DOMYLI_OPERATOR_NOTES]");
  }

  return lines.join("\n");
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
    selectedMealType,
    selectedProfileId,
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
  const [profileId, setProfileId] = useState("");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [operatorNotes, setOperatorNotes] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  useEffect(() => {
    void refreshRecipeCandidates(mealType, profileId);
  }, [mealType, profileId, refreshRecipeCandidates]);

  const isEditMode = useMemo(() => Boolean(selectedMealSlotId), [selectedMealSlotId]);

  const visibleRecipes = useMemo(() => {
    const normalizedSearch = recipeSearch.trim().toLowerCase();

    return recipeCandidates.filter((recipe) => {
      if (!normalizedSearch) return true;

      return (
        recipe.title.toLowerCase().includes(normalizedSearch) ||
        recipe.recipe_code.toLowerCase().includes(normalizedSearch) ||
        recipe.short_description.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [recipeCandidates, recipeSearch]);

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
            Il faut une session authentifiée et un foyer actif pour accéder aux
            repas.
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
    setProfileId("");
    setRecipeSearch("");
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

  const handleEdit = (mealSlotId: string) => {
    const meal = items.find((item) => item.meal_slot_id === mealSlotId);
    if (!meal) return;

    setSelectedMealSlotId(meal.meal_slot_id);
    setPlannedFor(meal.planned_for);
    setMealType(meal.meal_type);
    setProfileId(meal.profile_id ?? "");
    setSelectedRecipeId(meal.recipe_id ?? "");
    setOperatorNotes("");
    setLocalMessage(`Édition du repas : ${meal.meal_slot_id}`);
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

    if (!selectedRecipe) {
      setLocalMessage("Sélectionne une recette publiée DOMYLI.");
      return;
    }

    try {
      if (isEditMode) {
        const mealSlotId = await updateMeal({
          p_meal_slot_id: selectedMealSlotId,
          p_planned_for: plannedFor,
          p_meal_type: mealType,
          p_profile_id: profileId.trim() || null,
          p_recipe_id: selectedRecipe.recipe_id,
          p_title: selectedRecipe.title,
          p_notes: buildMealNotes(selectedRecipe, operatorNotes),
        });

        setLocalMessage(`Repas mis à jour : ${mealSlotId}`);
      } else {
        const mealSlotId = await createMeal({
          p_planned_for: plannedFor,
          p_meal_type: mealType,
          p_profile_id: profileId.trim() || null,
          p_recipe_id: selectedRecipe.recipe_id,
          p_title: selectedRecipe.title,
          p_notes: buildMealNotes(selectedRecipe, operatorNotes),
        });

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
                <p className="text-xs uppercase tracking-[0.24em] text-gold">
                  DOMYLI
                </p>
                <h1 className="mt-4 text-3xl font-semibold">Meals</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                  Ici, un repas n’est plus un template libre. C’est une recette
                  publiée, filtrée par type de repas, projetée sur un profil humain
                  si besoin, puis injectée dans le contrat RPC Meals.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 rounded-[24px] border border-white/10 bg-black/20 p-5 lg:grid-cols-[0.9fr_1fr_1fr_1.2fr]">
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

              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Profil humain (UUID optionnel)</span>
                <input
                  value={profileId}
                  onChange={(event) => setProfileId(event.target.value)}
                  placeholder="Projection compatibilité"
                  className="w-full border border-white/10 bg-black/30 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </label>

              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Recherche recette</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                  <input
                    value={recipeSearch}
                    onChange={(event) => setRecipeSearch(event.target.value)}
                    placeholder="Titre, code, lecture métier"
                    className="w-full border border-white/10 bg-black/30 py-4 pl-11 pr-4 text-sm outline-none focus:border-gold/50"
                  />
                </div>
              </label>
            </div>

            <div className="mt-8 rounded-[24px] border border-white/10 bg-black/20 p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-3 text-gold/85">
                  <Utensils className="h-5 w-5" />
                  <span className="text-sm">
                    {recipeCandidates.length} recette(s) candidate(s) pour{" "}
                    {mealType}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => void refreshRecipeCandidates(mealType, profileId)}
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
                    Aucune recette candidate pour ce filtre.
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
                            <p className="text-lg font-medium text-white">
                              {recipe.title}
                            </p>
                            <p className="mt-2 text-sm leading-7 text-white/70">
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
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <MetaBadge
                            label={`${recipe.prep_minutes + recipe.cook_minutes} min`}
                          />
                          <MetaBadge label={`${recipe.default_servings} portions`} />
                          <MetaBadge
                            label={getRecipeStockIntensityLabel(
                              recipe.stock_intensity,
                            )}
                          />
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
                        <p className="text-lg font-medium text-white">
                          {selectedRecipe.title}
                        </p>
                        <p className="mt-3 text-sm leading-7 text-white/70">
                          {selectedRecipe.short_description}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <MetaBadge
                            label={getRecipeFitStatusLabel(
                              selectedRecipe.fit.fit_status,
                            )}
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
                      {isEditMode ? <Save size={18} /> : <Plus size={18} />}
                      {saving
                        ? "Enregistrement..."
                        : isEditMode
                          ? "Mettre à jour le repas"
                          : "Créer le repas"}
                    </button>

                    {selectedMealSlotId && (
                      <button
                        type="button"
                        onClick={() => handleConfirm(selectedMealSlotId)}
                        disabled={confirming}
                        className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-white transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
                      >
                        <CheckCircle2 size={18} />
                        {confirming ? "Confirmation..." : "Confirmer le repas"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-white transition-colors hover:border-gold/40 hover:text-gold"
                    >
                      <CalendarDays size={18} />
                      Reset
                    </button>
                  </div>

                  {(localMessage ||
                    error ||
                    lastCreatedMealSlotId ||
                    lastUpdatedMealSlotId ||
                    lastConfirmResult) && (
                    <div className="mt-6 rounded-2xl border border-gold/20 bg-gold/10 px-5 py-4 text-sm text-gold">
                      {localMessage ??
                        error?.message ??
                        (lastCreatedMealSlotId
                          ? `Repas créé : ${lastCreatedMealSlotId}`
                          : lastUpdatedMealSlotId
                            ? `Repas mis à jour : ${lastUpdatedMealSlotId}`
                            : lastConfirmResult
                              ? `Repas confirmé : ${lastConfirmResult.meal_slot_id ?? "—"}`
                              : null)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {items.length > 0 && (
              <div className="mt-8 rounded-[24px] border border-white/10 bg-black/20 p-5">
                <div className="inline-flex items-center gap-3 text-gold/85">
                  <RefreshCw className="h-4 w-4" />
                  <span className="text-sm">Brouillon session repas</span>
                </div>

                <div className="mt-5 space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.meal_slot_id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {item.title ?? "Repas DOMYLI"}
                          </p>
                          <p className="mt-1 text-xs text-white/60">
                            {item.planned_for} · {item.meal_type} · {item.status ?? "DRAFT"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleEdit(item.meal_slot_id)}
                          className="inline-flex items-center gap-2 border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/75 transition-colors hover:border-gold/40 hover:text-gold"
                        >
                          Éditer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                  {selectedProfileId.trim()
                    ? "Compatibilité personnalisée activée"
                    : "Compatibilité neutre sans profil"}
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
                  <Utensils className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.24em]">
                    Contrat Meals
                  </p>
                </div>

                <p className="mt-3 text-sm leading-7 text-gold/90">
                  Le front sélectionne désormais une recette publiée et transmet
                  `recipe_id`, `title` et une note structurée au contrat RPC Meals.
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
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
