import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Plus,
  Save,
  Utensils,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { useMeals } from "@/src/hooks/useMeals";
import { ROUTES } from "@/src/constants/routes";
import type { MealType } from "@/src/services/meals/mealService";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

const mealTypes: MealType[] = ["BREAKFAST", "LUNCH", "SNACK", "DINNER"];

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
    error,
    items,
    lastCreatedMealSlotId,
    lastUpdatedMealSlotId,
    lastConfirmResult,
    createMeal,
    updateMeal,
    confirmMealSlot,
  } = useMeals();

  const [selectedMealSlotId, setSelectedMealSlotId] = useState("");
  const [plannedFor, setPlannedFor] = useState(todayIsoDate());
  const [mealType, setMealType] = useState<MealType>("LUNCH");
  const [profileId, setProfileId] = useState("");
  const [recipeId, setRecipeId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const isEditMode = useMemo(
    () => Boolean(selectedMealSlotId),
    [selectedMealSlotId]
  );

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold">
            Chargement des repas...
          </h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold">Foyer requis</h1>
          <p className="mt-5 max-w-2xl text-alabaster/70 leading-8">
            Il faut une session authentifiée et un foyer actif pour accéder aux
            repas.
          </p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
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
    setProfileId("");
    setRecipeId("");
    setTitle("");
    setNotes("");
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

    if (!title.trim() && !recipeId.trim()) {
      setLocalMessage("Renseigne au moins un titre ou un recipe_id existant.");
      return;
    }

    try {
      if (isEditMode) {
        const mealSlotId = await updateMeal({
          p_meal_slot_id: selectedMealSlotId,
          p_planned_for: plannedFor,
          p_meal_type: mealType,
          p_profile_id: profileId.trim() || null,
          p_recipe_id: recipeId.trim() || null,
          p_title: title.trim() || null,
          p_notes: notes.trim() || null,
        });

        setLocalMessage(`Repas mis à jour : ${mealSlotId}`);
      } else {
        const mealSlotId = await createMeal({
          p_planned_for: plannedFor,
          p_meal_type: mealType,
          p_profile_id: profileId.trim() || null,
          p_recipe_id: recipeId.trim() || null,
          p_title: title.trim() || null,
          p_notes: notes.trim() || null,
        });

        setSelectedMealSlotId(mealSlotId);
        setLocalMessage(`Repas créé : ${mealSlotId}`);
      }
    } catch {
      // déjà géré dans le hook
    }
  };

  const handleEdit = (mealSlotId: string) => {
    const meal = items.find((item) => item.meal_slot_id === mealSlotId);
    if (!meal) return;

    setSelectedMealSlotId(meal.meal_slot_id);
    setPlannedFor(meal.planned_for);
    setMealType(meal.meal_type);
    setProfileId(meal.profile_id ?? "");
    setRecipeId(meal.recipe_id ?? "");
    setTitle(meal.title ?? "");
    setNotes(meal.notes ?? "");
    setLocalMessage(`Édition du repas : ${meal.meal_slot_id}`);
  };

  const handleConfirm = async (mealSlotId: string) => {
    setLocalMessage(null);

    try {
      const result = await confirmMealSlot(mealSlotId);
      setLocalMessage(
        `Repas confirmé : ${result.meal_slot_id ?? mealSlotId} (${result.status ?? "CONFIRMED"})`
      );
    } catch {
      // déjà géré dans le hook
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-alabaster px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="mt-1 h-10 w-10 border border-white/10 flex items-center justify-center hover:border-gold/40 transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-gold">
              DOMYLI
            </div>
            <h1 className="mt-2 text-4xl font-semibold">Meals</h1>
            <p className="mt-3 max-w-2xl text-alabaster/70 leading-8">
              Création, mise à jour et confirmation d’un repas sur le foyer
              actif.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="glass metallic-border rounded-[2rem] p-6">
            <div className="inline-flex items-center gap-3 text-gold">
              <Utensils size={18} />
              <span className="text-xs uppercase tracking-[0.3em]">
                Planification repas
              </span>
            </div>

            <h2 className="mt-5 text-2xl font-semibold text-alabaster">
              {isEditMode ? "Modifier un repas" : "Créer un repas"}
            </h2>

            <p className="mt-4 text-sm leading-8 text-alabaster/65">
              Cette page est alignée sur <code>rpc_meal_slot_upsert</code> et{" "}
              <code>rpc_meal_confirm_v3</code>.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                  Date
                </label>
                <input
                  type="date"
                  value={plannedFor}
                  onChange={(e) => setPlannedFor(e.target.value)}
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                  Type de repas
                </label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as MealType)}
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                >
                  {mealTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                  Profile ID
                </label>
                <input
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                  placeholder="uuid optionnel"
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                  Recipe ID
                </label>
                <input
                  value={recipeId}
                  onChange={(e) => setRecipeId(e.target.value)}
                  placeholder="uuid optionnel"
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                  Titre
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Déjeuner protéiné"
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Notes optionnelles"
                  className="w-full resize-none border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={handleCreateOrUpdate}
                disabled={saving}
                className="flex items-center justify-center gap-3 bg-gold px-6 py-4 text-sm font-medium uppercase tracking-[0.25em] text-obsidian transition hover:opacity-90 disabled:opacity-50"
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
                  className="flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 size={18} />
                  {confirming ? "Confirmation..." : "Confirmer le repas"}
                </button>
              )}

              <button
                type="button"
                onClick={resetForm}
                className="flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
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
              <div className="mt-8 border border-white/10 bg-black/20 p-4 text-sm text-alabaster/75">
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

          <aside className="glass metallic-border rounded-[2rem] p-7">
            <div className="text-xs uppercase tracking-[0.3em] text-gold/80">
              Session active
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                  Email
                </div>
                <div className="mt-2 text-sm text-alabaster">
                  {sessionEmail ?? "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                  Foyer
                </div>
                <div className="mt-2 text-sm text-alabaster">
                  {activeMembership?.household_name ?? "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                  Rôle
                </div>
                <div className="mt-2 text-sm text-alabaster">
                  {activeMembership?.role ?? "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                  Super Admin
                </div>
                <div className="mt-2 text-sm text-alabaster">
                  {bootstrap?.is_super_admin ? "Oui" : "Non"}
                </div>
              </div>
            </div>

            <div className="mt-8 border border-white/10 bg-black/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Utensils size={18} className="text-gold" />
                <h3 className="text-xl font-serif italic">
                  Repas manipulés dans cette session
                </h3>
              </div>

              {items.length === 0 ? (
                <div className="text-sm text-alabaster/70">
                  Aucun repas créé ou modifié dans cette session.
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <button
                      key={item.meal_slot_id}
                      type="button"
                      onClick={() => handleEdit(item.meal_slot_id)}
                      className="block w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-left hover:border-gold/30 transition-colors"
                    >
                      <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                        {item.meal_type}
                      </div>
                      <div className="mt-2 text-sm text-alabaster">
                        {item.title ?? item.recipe_id ?? item.meal_slot_id}
                      </div>
                      <div className="mt-2 text-xs text-alabaster/60">
                        {item.planned_for} · {item.status ?? "DRAFT"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}