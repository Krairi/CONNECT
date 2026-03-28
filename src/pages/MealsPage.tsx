import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CookingPot,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/providers/AuthProvider";
import { useMeals } from "@/src/hooks/useMeals";
import { ROUTES } from "@/src/constants/routes";
import type { MealType } from "@/src/services/meals/mealService";
import {
  getMealFlowLabel,
  getMealStatusLabel,
  getMealTypeLabel,
  MEAL_TYPE_OPTIONS,
} from "@/src/constants/mealCatalog";
import { getErrorMessage } from "./utils/getErrorMessage";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function FlowBadge({ flow }: { flow: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gold">
      {getMealFlowLabel(flow)}
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
    loading,
    saving,
    confirming,
    error,
    items,
    profiles,
    recipes,
    lastCreatedMealSlotId,
    lastUpdatedMealSlotId,
    lastConfirmResult,
    createMeal,
    updateMeal,
    confirmMealSlot,
    refresh,
  } = useMeals();

  const [selectedMealSlotId, setSelectedMealSlotId] = useState("");
  const [plannedFor, setPlannedFor] = useState(todayIsoDate());
  const [mealType, setMealType] = useState<MealType>("LUNCH");
  const [profileId, setProfileId] = useState("");
  const [recipeId, setRecipeId] = useState("");
  const [operatorNotes, setOperatorNotes] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const isEditMode = useMemo(() => Boolean(selectedMealSlotId), [selectedMealSlotId]);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.profile_id === profileId) ?? null,
    [profiles, profileId],
  );

  const selectedRecipe = useMemo(
    () => recipes.find((recipe) => recipe.recipe_id === recipeId) ?? null,
    [recipes, recipeId],
  );

  const canSubmit = useMemo(() => {
    return Boolean(plannedFor && mealType && profileId && recipeId);
  }, [plannedFor, mealType, profileId, recipeId]);

  if (authLoading || bootstrapLoading || loading) {
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
    setProfileId("");
    setRecipeId("");
    setOperatorNotes("");
    setLocalMessage(null);
  };

  const handleEdit = (mealSlotId: string) => {
    const meal = items.find((item) => item.meal_slot_id === mealSlotId);
    if (!meal) return;

    setSelectedMealSlotId(meal.meal_slot_id);
    setPlannedFor(meal.planned_for);
    setMealType(meal.meal_type);
    setProfileId(meal.profile_id ?? "");
    setRecipeId(meal.recipe_id ?? "");
    setOperatorNotes(meal.notes ?? "");
    setLocalMessage(`Édition du repas : ${meal.meal_slot_id}`);
  };

  const handleCreateOrUpdate = async () => {
    setLocalMessage(null);

    if (!plannedFor) {
      setLocalMessage("La date est obligatoire.");
      return;
    }

    if (!profileId) {
      setLocalMessage("Sélectionne un profil humain DOMYLI.");
      return;
    }

    if (!recipeId) {
      setLocalMessage("Sélectionne une recette publiée DOMYLI.");
      return;
    }

    if (!selectedRecipe) {
      setLocalMessage("La recette sélectionnée est introuvable.");
      return;
    }

    try {
      if (isEditMode) {
        const mealSlotId = await updateMeal({
          p_meal_slot_id: selectedMealSlotId,
          p_planned_for: plannedFor,
          p_meal_type: mealType,
          p_profile_id: profileId,
          p_recipe_id: recipeId,
          p_title: selectedRecipe.title,
          p_notes: operatorNotes.trim() || null,
        });

        setLocalMessage(`Repas mis à jour : ${mealSlotId}`);
      } else {
        const mealSlotId = await createMeal({
          p_planned_for: plannedFor,
          p_meal_type: mealType,
          p_profile_id: profileId,
          p_recipe_id: recipeId,
          p_title: selectedRecipe.title,
          p_notes: operatorNotes.trim() || null,
        });

        setSelectedMealSlotId(mealSlotId);
        setLocalMessage(`Repas créé : ${mealSlotId}`);
      }
    } catch {
      // erreur déjà gérée par le hook
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
      // erreur déjà gérée par le hook
    }
  };

  const handleRefresh = async () => {
    setLocalMessage(null);

    try {
      await refresh();
      setLocalMessage("Lecture meals actualisée.");
    } catch {
      // erreur déjà gérée par le hook
    }
  };

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
                <p className="text-xs uppercase tracking-[0.24em] text-gold">DOMYLI</p>
                <h1 className="mt-4 text-3xl font-semibold">Meals</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                  Ici, un repas devient une opération domestique réelle :
                  type canonique, profil humain réel, recette publiée réelle,
                  puis confirmation métier.
                </p>
              </div>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-gold">
              <CookingPot className="h-4 w-4" />
              Planification gouvernée
            </div>

            <h2 className="mt-6 text-2xl font-semibold">
              {isEditMode ? "Modifier un repas persisté" : "Créer un repas persisté"}
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
              Le titre n’est plus libre. DOMYLI lie maintenant le repas à un profil humain
              et à une recette publiée, puis confirme l’exécution côté système.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Date</span>
                <input
                  type="date"
                  value={plannedFor}
                  onChange={(e) => setPlannedFor(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </label>

              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Type de repas</span>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as MealType)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  {MEAL_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Profil humain</span>
                <select
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  <option value="">Sélectionner un profil réel</option>
                  {profiles.map((profile) => (
                    <option key={profile.profile_id} value={profile.profile_id}>
                      {profile.display_name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Recette publiée</span>
                <select
                  value={recipeId}
                  onChange={(e) => setRecipeId(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  <option value="">Sélectionner une recette publiée</option>
                  {recipes.map((recipe) => (
                    <option key={recipe.recipe_id} value={recipe.recipe_id}>
                      {recipe.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Profil sélectionné
                </p>
                <p className="mt-3 text-lg text-white">
                  {selectedProfile?.display_name ?? "—"}
                </p>
                <p className="mt-2 text-sm text-white/60">
                  {selectedProfile?.goal ?? "Objectif non renseigné"} ·{" "}
                  {selectedProfile?.activity_level ?? "Activité non renseignée"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Recette sélectionnée
                </p>
                <p className="mt-3 text-lg text-white">
                  {selectedRecipe?.title ?? "—"}
                </p>
                <p className="mt-2 text-sm text-white/60">
                  {selectedRecipe?.description || "Description non renseignée."}
                </p>
              </div>
            </div>

            <label className="mt-6 block text-sm text-white/80">
              <span className="mb-2 block">Note opérateur</span>
              <textarea
                value={operatorNotes}
                onChange={(e) => setOperatorNotes(e.target.value)}
                rows={4}
                placeholder="Ex : utiliser en priorité les produits frais déjà ouverts."
                className="w-full resize-none border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
              />
            </label>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={handleCreateOrUpdate}
                disabled={!canSubmit || saving}
                className="inline-flex items-center justify-center gap-3 bg-gold px-6 py-4 text-sm uppercase tracking-[0.25em] text-black transition hover:opacity-90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving
                  ? "Enregistrement..."
                  : isEditMode
                    ? "Mettre à jour le repas"
                    : "Créer le repas"}
              </button>

              {selectedMealSlotId ? (
                <button
                  type="button"
                  onClick={() => handleConfirm(selectedMealSlotId)}
                  disabled={confirming}
                  className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-white transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {confirming ? "Confirmation..." : "Confirmer le repas"}
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                <RefreshCw className="h-4 w-4" />
                Rafraîchir
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                <CalendarDays className="h-4 w-4" />
                Reset
              </button>
            </div>

            {(localMessage || error || lastCreatedMealSlotId || lastUpdatedMealSlotId || lastConfirmResult) && (
              <div className="mt-8 border border-gold/20 bg-gold/10 px-5 py-4 text-base text-gold">
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
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <ClipboardList className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Lecture métier DOMYLI
                </span>
              </div>

              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Email
                  </div>
                  <div className="mt-3 text-2xl">{sessionEmail ?? "—"}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Foyer
                  </div>
                  <div className="mt-3 text-2xl">
                    {activeMembership?.household_name ?? "—"}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Rôle
                  </div>
                  <div className="mt-3 text-2xl">{activeMembership?.role ?? "—"}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Super Admin
                  </div>
                  <div className="mt-3 text-2xl">
                    {bootstrap?.is_super_admin ? "Oui" : "Non"}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Type canonique
                  </div>
                  <div className="mt-3 text-2xl">{getMealTypeLabel(mealType)}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="flex items-center gap-3">
                    <UserRound className="h-4 w-4 text-gold/80" />
                    <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                      Profil sélectionné
                    </div>
                  </div>
                  <div className="mt-3 text-lg">
                    {selectedProfile?.display_name ?? "—"}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="flex items-center gap-3">
                    <CookingPot className="h-4 w-4 text-gold/80" />
                    <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                      Recette publiée
                    </div>
                  </div>
                  <div className="mt-3 text-lg">
                    {selectedRecipe?.title ?? "—"}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Flux impactés
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["PROFILES", "INVENTORY", "SHOPPING", "RULES"].map((flow) => (
                      <FlowBadge key={flow} flow={flow} />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-white/45">
                  <ShieldCheck className="h-4 w-4 text-gold/80" />
                  <span className="text-sm">
                    Meal gouverné DOMYLI : profil réel, recette publiée, confirmation traçable.
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <ClipboardList className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Repas persistés
                </span>
              </div>

              {items.length === 0 ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5 text-white/70">
                  Aucun repas persisté pour le moment.
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.meal_slot_id}
                      className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                            {getMealTypeLabel(item.meal_type)}
                          </div>
                          <div className="mt-2 text-base text-white">
                            {item.recipe_title ?? item.title ?? item.meal_slot_id}
                          </div>
                          <div className="mt-2 text-xs text-white/60">
                            {item.planned_for} · {getMealStatusLabel(item.status)}
                          </div>
                          <div className="mt-2 text-xs text-white/45">
                            Profil : {item.profile_display_name ?? "—"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleEdit(item.meal_slot_id)}
                          className="inline-flex items-center justify-center gap-2 border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-white transition-colors hover:border-gold/40 hover:text-gold"
                        >
                          Éditer
                        </button>

                        <button
                          type="button"
                          onClick={() => handleConfirm(item.meal_slot_id)}
                          disabled={confirming}
                          className="inline-flex items-center justify-center gap-2 border border-gold/30 px-4 py-3 text-xs uppercase tracking-[0.18em] text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
                        >
                          Confirmer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => navigate(ROUTES.TOOLS)}
                className="mt-8 inline-flex w-full items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Continuer vers Tools
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}