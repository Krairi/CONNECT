import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Save, Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/contexts/AuthContext";
import { useMeals } from "@/src/hooks/useMeals";
import { ROUTES } from "@/src/constants/routes";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function MealsPage() {
  const navigate = useNavigate();
  const { bootstrap, isAuthenticated, hasHousehold, authLoading, bootstrapLoading } =
    useAuth();

  const {
    createPlan,
    saveSlot,
    confirmMeal,
    creatingPlan,
    savingSlot,
    confirming,
    error,
    lastCreatedPlan,
    lastSavedSlot,
    lastConfirmedMeal,
  } = useMeals();

  const householdId = bootstrap?.active_household_id ?? null;

  const [day, setDay] = useState(todayIsoDate());
  const [mealPlanId, setMealPlanId] = useState("");
  const [slotCode, setSlotCode] = useState("DINNER");
  const [profileId, setProfileId] = useState("");
  const [recipeId, setRecipeId] = useState("");
  const [mealSlotId, setMealSlotId] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const canCreatePlan = useMemo(() => Boolean(householdId && day), [householdId, day]);
  const effectiveMealPlanId = mealPlanId.trim() || lastCreatedPlan?.meal_plan_id || "";

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-white px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/70">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold text-white">
            Chargement des repas...
          </h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold || !householdId) {
    return (
      <div className="min-h-screen bg-obsidian text-white px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/70">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold text-white">
            Foyer requis
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/70">
            Il faut une session authentifiée et un foyer actif pour accéder aux repas.
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

  const handleCreatePlan = async () => {
    setLocalMessage(null);

    try {
      const result = await createPlan(day);
      setMealPlanId(result.meal_plan_id);
      setLocalMessage(`Plan repas créé : ${result.meal_plan_id}`);
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  const handleSaveSlot = async () => {
    setLocalMessage(null);

    if (!effectiveMealPlanId) {
      setLocalMessage("Créez d’abord un meal_plan_id.");
      return;
    }

    try {
      const result = await saveSlot({
        mealPlanId: effectiveMealPlanId,
        day,
        slotCode,
        profileId: profileId.trim() || null,
        recipeId: recipeId.trim() || null,
        status: "PENDING",
      });

      setMealSlotId(result.meal_slot_id);
      setLocalMessage(`Slot repas enregistré : ${result.meal_slot_id}`);
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  const handleConfirmMeal = async () => {
    setLocalMessage(null);

    if (!mealSlotId.trim()) {
      setLocalMessage("Renseignez un meal_slot_id pour confirmer.");
      return;
    }

    try {
      const result = await confirmMeal(mealSlotId.trim());

      setLocalMessage(
        result.run_status === "NOOP"
          ? "Repas déjà confirmé (NOOP)."
          : `Repas confirmé : ${result.meal_slot_id}`
      );
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-white px-6 py-10">
      <div className="mx-auto max-w-7xl">
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
            <div className="text-xs uppercase tracking-[0.35em] text-gold/70">
              DOMYLI
            </div>
            <h1 className="mt-2 text-4xl font-semibold text-white">Meals</h1>
            <p className="mt-3 text-sm leading-7 text-white/65">
              Création de plan, slot et confirmation de repas.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="border border-white/10 bg-white/[0.03] p-6">
            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                  Jour
                </label>
                <input
                  type="date"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <button
                type="button"
                onClick={handleCreatePlan}
                disabled={!canCreatePlan || creatingPlan}
                className="inline-flex w-full items-center justify-center gap-3 border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.25em] text-obsidian disabled:opacity-50"
              >
                <Utensils size={16} />
                {creatingPlan ? "Création..." : "Créer le plan repas"}
              </button>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                  Meal Plan ID
                </label>
                <input
                  value={mealPlanId}
                  onChange={(e) => setMealPlanId(e.target.value)}
                  placeholder="UUID du plan"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                  Slot code
                </label>
                <select
                  value={slotCode}
                  onChange={(e) => setSlotCode(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  <option value="BREAKFAST">BREAKFAST</option>
                  <option value="LUNCH">LUNCH</option>
                  <option value="SNACK">SNACK</option>
                  <option value="DINNER">DINNER</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                  Profile ID
                </label>
                <input
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                  placeholder="UUID du profil"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                  Recipe ID
                </label>
                <input
                  value={recipeId}
                  onChange={(e) => setRecipeId(e.target.value)}
                  placeholder="UUID de la recette"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveSlot}
                disabled={savingSlot}
                className="inline-flex w-full items-center justify-center gap-3 border border-gold/40 px-5 py-4 text-sm uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors disabled:opacity-50"
              >
                <Save size={16} />
                {savingSlot ? "Enregistrement..." : "Enregistrer le slot"}
              </button>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                  Meal Slot ID à confirmer
                </label>
                <input
                  value={mealSlotId}
                  onChange={(e) => setMealSlotId(e.target.value)}
                  placeholder="UUID du slot"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <button
                type="button"
                onClick={handleConfirmMeal}
                disabled={confirming}
                className="inline-flex w-full items-center justify-center gap-3 border border-emerald-500/40 px-5 py-4 text-sm uppercase tracking-[0.25em] text-emerald-300 hover:bg-emerald-500 hover:text-obsidian transition-colors disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                {confirming ? "Confirmation..." : "Confirmer le repas"}
              </button>

              {(localMessage || error) && (
                <div className="border border-gold/20 bg-gold/5 px-4 py-4 text-sm text-gold/90">
                  {localMessage ?? error?.message}
                </div>
              )}
            </div>
          </section>

          <aside className="border border-white/10 bg-white/[0.03] p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-gold/70">
              Derniers résultats
            </div>

            <div className="mt-6 space-y-4 text-sm leading-7 text-white/70">
              <div>
                <span className="text-gold">Dernier plan :</span>{" "}
                {lastCreatedPlan?.meal_plan_id ?? "—"}
              </div>
              <div>
                <span className="text-gold">Dernier slot :</span>{" "}
                {lastSavedSlot?.meal_slot_id ?? "—"}
              </div>
              <div>
                <span className="text-gold">Dernière confirmation :</span>{" "}
                {lastConfirmedMeal?.run_status ?? "—"}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}