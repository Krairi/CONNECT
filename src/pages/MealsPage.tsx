import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  House,
  Save,
  ShieldCheck,
  Utensils,
  Sparkles,
} from "lucide-react";
import { useDomyliConnection } from "../hooks/useDomyliConnection";
import { useMeals } from "../hooks/useMeals";
import { navigateTo } from "../lib/navigation";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

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

  if (!isAuthenticated || !hasHousehold || !householdId) {
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

  const handleCreatePlan = async () => {
    setLocalMessage(null);

    try {
      const result = await createPlan(householdId, day);
      setMealPlanId(result.meal_plan_id);
      setLocalMessage(`Plan repas créé : ${result.meal_plan_id}`);
    } catch {
      //
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
        householdId,
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
      //
    }
  };

  const handleConfirmMeal = async () => {
    setLocalMessage(null);

    if (!mealSlotId.trim()) {
      setLocalMessage("Renseignez un meal_slot_id pour confirmer.");
      return;
    }

    try {
      const result = await confirmMeal({
        householdId,
        mealSlotId: mealSlotId.trim(),
      });

      setLocalMessage(
        result.run_status === "NOOP"
          ? "Repas déjà confirmé (NOOP)."
          : `Repas confirmé : ${result.meal_slot_id ?? "OK"}`
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
              onClick={() => navigateTo("/capacity")}
              className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
            >
              Capacity
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
            <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Orchestration repas</p>
            <h2 className="mt-4 text-4xl font-serif italic">Créer, planifier et confirmer un repas</h2>
            <p className="mt-6 text-alabaster/70 leading-relaxed">
              Cette page branche l’expérience DOMYLI sur
              <span className="text-gold"> rpc_meal_plan_create</span>,
              <span className="text-gold"> rpc_meal_slot_upsert</span> et
              <span className="text-gold"> rpc_meal_confirm_v3</span>.
            </p>

            <div className="mt-10 border border-white/10 bg-black/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={18} className="text-gold" />
                <h3 className="text-xl font-serif italic">Créer le plan du jour</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Date
                  </label>
                  <input
                    type="date"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCreatePlan}
                  disabled={!canCreatePlan || creatingPlan}
                  className="flex items-center justify-center gap-3 bg-gold px-6 py-4 text-sm font-medium uppercase tracking-[0.25em] text-obsidian transition hover:opacity-90 disabled:opacity-50"
                >
                  <Utensils size={18} />
                  {creatingPlan ? "Création..." : "Créer le meal plan"}
                </button>
              </div>
            </div>

            <div className="mt-10 border border-white/10 bg-black/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Save size={18} className="text-gold" />
                <h3 className="text-xl font-serif italic">Créer / mettre à jour un slot</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Meal plan ID
                  </label>
                  <input
                    type="text"
                    value={mealPlanId}
                    onChange={(e) => setMealPlanId(e.target.value)}
                    placeholder="UUID du plan"
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Slot code
                  </label>
                  <select
                    value={slotCode}
                    onChange={(e) => setSlotCode(e.target.value)}
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  >
                    <option value="BREAKFAST">BREAKFAST</option>
                    <option value="LUNCH">LUNCH</option>
                    <option value="SNACK">SNACK</option>
                    <option value="DINNER">DINNER</option>
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
                    placeholder="UUID profil"
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
                    placeholder="UUID recette"
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleSaveSlot}
                  disabled={savingSlot}
                  className="flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-50"
                >
                  <Save size={18} />
                  {savingSlot ? "Enregistrement..." : "Enregistrer le slot"}
                </button>
              </div>
            </div>

            <div className="mt-10 border border-white/10 bg-black/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 size={18} className="text-gold" />
                <h3 className="text-xl font-serif italic">Confirmer le repas</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Meal slot ID
                  </label>
                  <input
                    type="text"
                    value={mealSlotId}
                    onChange={(e) => setMealSlotId(e.target.value)}
                    placeholder="UUID slot repas"
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleConfirmMeal}
                  disabled={confirming}
                  className="flex items-center justify-center gap-3 bg-gold px-6 py-4 text-sm font-medium uppercase tracking-[0.25em] text-obsidian transition hover:opacity-90 disabled:opacity-50"
                >
                  <CheckCircle2 size={18} />
                  {confirming ? "Confirmation..." : "Confirmer le repas"}
                </button>
              </div>
            </div>

            {(localMessage || error || lastCreatedPlan || lastSavedSlot || lastConfirmedMeal) && (
              <div className="mt-8 border border-white/10 bg-black/20 p-4 text-sm text-alabaster/75">
                {localMessage ??
                  error?.message ??
                  (lastCreatedPlan ? `Plan créé : ${lastCreatedPlan.meal_plan_id}` : null) ??
                  (lastSavedSlot ? `Slot enregistré : ${lastSavedSlot.meal_slot_id}` : null) ??
                  (lastConfirmedMeal ? `Repas confirmé : ${lastConfirmedMeal.run_status}` : null)}
              </div>
            )}
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
                  <House size={18} className="text-gold" />
                  <span>Les repas ferment la boucle stock → shopping → exécution.</span>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-gold" />
                  <span className="text-sm">RPC : app.rpc_meal_plan_create</span>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-gold" />
                  <span className="text-sm">RPC : app.rpc_meal_slot_upsert</span>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-gold" />
                  <span className="text-sm">RPC : app.rpc_meal_confirm_v3</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigateTo("/dashboard")}
                className="w-full flex items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
              >
                <ArrowRight size={18} />
                Retour dashboard
              </button>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}