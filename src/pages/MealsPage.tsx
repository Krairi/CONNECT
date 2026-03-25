import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChefHat,
  CheckCircle2,
  Plus,
  RefreshCw,
  Save,
  Utensils,
} from "lucide-react";
import { useDomyliConnection } from "../hooks/useDomyliConnection";
import { useMeals } from "../hooks/useMeals";
import { navigateTo } from "../lib/navigation";
import type { MealType } from "../services/meals/mealService";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

const mealTypes: MealType[] = ["BREAKFAST", "LUNCH", "SNACK", "DINNER"];

export default function MealsPage() {
  const {
    sessionEmail,
    activeMembership,
    bootstrap,
    isAuthenticated,
    hasHousehold,
    authLoading,
  } = useDomyliConnection();

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

  const [selectedMealSlotId, setSelectedMealSlotId] = useState<string>("");
  const [plannedFor, setPlannedFor] = useState(todayIsoDate());
  const [mealType, setMealType] = useState<MealType>("LUNCH");
  const [profileId, setProfileId] = useState("");
  const [recipeId, setRecipeId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const isEditMode = useMemo(() => Boolean(selectedMealSlotId), [selectedMealSlotId]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/80">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-serif italic">Chargement des repas...</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
        <div className="max-w-xl w-full border border-white/10 bg-white/5 p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/80">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-serif italic">Foyer requis</h1>
          <p className="mt-4 text-alabaster/70">
            Il faut une session authentifiée et un foyer actif pour accéder aux repas.
          </p>
          <button
            onClick={() => navigateTo("/")}
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

        setLocalMessage(`Repas créé : ${mealSlotId}`);
        setSelectedMealSlotId(mealSlotId);
      }
    } catch {
      //
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
      //
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-alabaster">
      <header className="border-b border-white/5 glass">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo("/dashboard")}
              className="w-10 h-10 border border-white/10 flex items-center justify-center hover:border-gold/40 transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft size={18} className="text-gold" />
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold/80">DOMYLI</p>
              <h1 className="text-2xl font-serif italic">Meals</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={resetForm}
              className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Reset
            </button>

            <button
              onClick={() => navigateTo("/dashboard")}
              className="border border-gold/40 px-5 py-3 text-xs uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <section className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 border border-white/10 bg-white/5 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Planification repas</p>
            <h2 className="mt-4 text-4xl font-serif italic">
              {isEditMode ? "Modifier un repas" : "Créer un repas"}
            </h2>
            <p className="mt-6 text-alabaster/70 leading-relaxed">
              Cette page est alignée sur
              <span className="text-gold"> rpc_meal_plan_create</span>,
              <span className="text-gold"> rpc_meal_slot_upsert</span> et
              <span className="text-gold"> rpc_meal_confirm_v3</span>.
            </p>

            <div className="mt-10 grid md:grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
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
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Type de repas
                </label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
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
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Profile ID
                </label>
                <input
                  type="text"
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                  placeholder="uuid optionnel"
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Recipe ID
                </label>
                <input
                  type="text"
                  value={recipeId}
                  onChange={(e) => setRecipeId(e.target.value)}
                  placeholder="uuid optionnel"
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Titre
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Déjeuner protéiné"
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Notes optionnelles"
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50 resize-none"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
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
            </div>

            {(localMessage || error || lastCreatedMealSlotId || lastUpdatedMealSlotId || lastConfirmResult) && (
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

            <div className="mt-10 border border-white/10 bg-black/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Utensils size={18} className="text-gold" />
                <h3 className="text-xl font-serif italic">Repas manipulés dans cette session</h3>
              </div>

              {items.length === 0 ? (
                <div className="text-sm text-alabaster/70">
                  Aucun repas créé ou modifié dans cette session.
                </div>
              ) : (
                <div className="grid gap-4">
                  {items.map((meal) => (
                    <div
                      key={meal.meal_slot_id}
                      className="border border-white/10 bg-obsidian p-4 grid md:grid-cols-6 gap-4 text-sm"
                    >
                      <div>
                        <div className="text-alabaster/50">Meal Slot</div>
                        <div className="mt-1 text-alabaster break-all">{meal.meal_slot_id}</div>
                      </div>
                      <div>
                        <div className="text-alabaster/50">Date</div>
                        <div className="mt-1 text-alabaster">{meal.planned_for}</div>
                      </div>
                      <div>
                        <div className="text-alabaster/50">Type</div>
                        <div className="mt-1 text-alabaster">{meal.meal_type}</div>
                      </div>
                      <div>
                        <div className="text-alabaster/50">Titre</div>
                        <div className="mt-1 text-alabaster">{meal.title}</div>
                      </div>
                      <div>
                        <div className="text-alabaster/50">Statut</div>
                        <div className="mt-1 text-alabaster">{meal.status}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(meal.meal_slot_id)}
                          className="border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
                        >
                          Éditer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirm(meal.meal_slot_id)}
                          className="border border-gold/30 px-4 py-2 text-xs uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
                        >
                          Confirmer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="border border-white/10 bg-white/5 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Contexte actif</p>

            <div className="mt-6 space-y-4 text-sm">
              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Email :</span>
                <div className="mt-1 text-alabaster">{sessionEmail ?? "—"}</div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Foyer :</span>
                <div className="mt-1 text-alabaster">{activeMembership?.household_name ?? "—"}</div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Rôle :</span>
                <div className="mt-1 text-alabaster">{activeMembership?.role ?? "—"}</div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Super Admin :</span>
                <div className="mt-1 text-alabaster">{bootstrap?.is_super_admin ? "Oui" : "Non"}</div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="border border-gold/20 bg-gold/5 p-4 text-sm text-alabaster/75">
                <div className="flex items-center gap-3">
                  <ChefHat size={18} className="text-gold" />
                  <span>Le module Meals prépare ensuite le vrai chaînage avec stock, shopping et tâches.</span>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <CalendarDays size={18} className="text-gold" />
                  <span className="text-sm">RPC : app.rpc_meal_plan_create / app.rpc_meal_slot_upsert</span>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-gold" />
                  <span className="text-sm">RPC : app.rpc_meal_confirm_v3</span>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}