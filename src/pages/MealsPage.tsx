import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Utensils,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { useMeals } from "@/src/hooks/useMeals";
import { ROUTES } from "@/src/constants/routes";
import type { MealType } from "@/src/services/meals/mealService";
import {
  buildMealNotes,
  extractOperatorNotes,
  findMealTemplateCodeFromDraft,
  getMealFlowLabel,
  getMealStatusLabel,
  getMealTemplateByCode,
  getMealTemplatesByType,
  getMealTypeLabel,
  MEAL_TYPE_OPTIONS,
} from "@/src/constants/mealCatalog";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function FlowBadge({ flow }: { flow: string }) {
  return (
    <span className="inline-flex items-center border border-gold/30 bg-gold/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gold">
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
  const [templateCode, setTemplateCode] = useState("");
  const [operatorNotes, setOperatorNotes] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const isEditMode = useMemo(() => Boolean(selectedMealSlotId), [selectedMealSlotId]);

  const templateOptions = useMemo(
    () => getMealTemplatesByType(mealType),
    [mealType]
  );

  const selectedTemplate = useMemo(
    () => getMealTemplateByCode(templateCode),
    [templateCode]
  );

  const canSubmit = useMemo(() => {
    return Boolean(plannedFor && mealType && templateCode);
  }, [plannedFor, mealType, templateCode]);

  if (authLoading || bootstrapLoading) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl border border-gold/20 bg-black/40 p-8">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/80">DOMYLI</div>
          <h1 className="mt-4 text-3xl font-semibold">Chargement des repas...</h1>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl border border-gold/20 bg-black/40 p-8">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/80">DOMYLI</div>
          <h1 className="mt-4 text-3xl font-semibold">Foyer requis</h1>
          <p className="mt-4 text-white/70">
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
    setTemplateCode("");
    setOperatorNotes("");
    setLocalMessage(null);
  };

  const handleMealTypeChange = (nextType: MealType) => {
    setMealType(nextType);
    setTemplateCode("");
    setOperatorNotes("");
    setLocalMessage(null);
  };

  const handleTemplateChange = (nextTemplateCode: string) => {
    setTemplateCode(nextTemplateCode);
    setLocalMessage(null);
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

    if (!selectedTemplate) {
      setLocalMessage("Sélectionne un template de repas DOMYLI.");
      return;
    }

    try {
      if (isEditMode) {
        const mealSlotId = await updateMeal({
          p_meal_slot_id: selectedMealSlotId,
          p_planned_for: plannedFor,
          p_meal_type: mealType,
          p_profile_id: null,
          p_recipe_id: null,
          p_title: selectedTemplate.label,
          p_notes: buildMealNotes(selectedTemplate, operatorNotes),
        });

        setLocalMessage(`Repas mis à jour : ${mealSlotId}`);
      } else {
        const mealSlotId = await createMeal({
          p_planned_for: plannedFor,
          p_meal_type: mealType,
          p_profile_id: null,
          p_recipe_id: null,
          p_title: selectedTemplate.label,
          p_notes: buildMealNotes(selectedTemplate, operatorNotes),
        });

        setSelectedMealSlotId(mealSlotId);
        setLocalMessage(`Repas créé : ${mealSlotId}`);
      }
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  const handleEdit = (mealSlotId: string) => {
    const meal = items.find((item) => item.meal_slot_id === mealSlotId);
    if (!meal) return;

    setSelectedMealSlotId(meal.meal_slot_id);
    setPlannedFor(meal.planned_for);
    setMealType(meal.meal_type);
    setTemplateCode(findMealTemplateCodeFromDraft(meal.meal_type, meal.title));
    setOperatorNotes(extractOperatorNotes(meal.notes));
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
      // erreur déjà gérée par le hook
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="mt-1 inline-flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
              aria-label="Retour"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="mt-6 text-xs uppercase tracking-[0.35em] text-gold/80">
              DOMYLI
            </div>
            <h1 className="mt-3 text-4xl font-semibold">Meals</h1>
            <p className="mt-3 max-w-3xl text-white/65">
              Ici, un repas n’est pas une simple ligne libre. C’est une intention
              canonique du foyer, cadrée par le type de repas, les contraintes
              humaines et l’exécution réelle.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
            <div className="mb-6 flex items-center gap-3 text-gold/85">
              <Utensils className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.35em]">
                Planification gouvernée
              </span>
            </div>

            <h2 className="text-3xl font-semibold">
              {isEditMode ? "Modifier un repas canonique" : "Créer un repas canonique"}
            </h2>

            <p className="mt-6 max-w-3xl text-lg leading-9 text-white/65">
              Sélectionne un type de repas puis un template DOMYLI. Le titre est
              généré de manière canonique et les notes sont structurées pour rester
              compatibles avec le contrat RPC actuel.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Date
                </label>
                <input
                  type="date"
                  value={plannedFor}
                  onChange={(e) => setPlannedFor(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Type de repas
                </label>
                <select
                  value={mealType}
                  onChange={(e) => handleMealTypeChange(e.target.value as MealType)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  {MEAL_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Template repas DOMYLI
                </label>
                <select
                  value={templateCode}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  <option value="">Sélectionner un template canonique</option>
                  {templateOptions.map((template) => (
                    <option key={template.code} value={template.code}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                  Titre canonique généré
                </div>
                <div className="mt-3 text-xl">
                  {selectedTemplate?.label ?? "—"}
                </div>
              </div>

              <div className="md:col-span-2 rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                  Lecture template
                </div>
                <div className="mt-3 text-white/75">
                  {selectedTemplate?.description ?? "Sélectionne un template pour afficher sa lecture métier."}
                </div>

                {selectedTemplate?.flows?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedTemplate.flows.map((flow) => (
                      <FlowBadge key={flow} flow={flow} />
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="md:col-span-2">
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Note foyer optionnelle
                </label>
                <textarea
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  rows={4}
                  placeholder="Ex: utiliser en priorité les produits frais déjà ouverts."
                  className="w-full resize-none border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
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

            <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
              <div className="flex items-center gap-3 text-gold/85">
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm">
                  Contrat RPC conservé, normalisation front renforcée.
                </span>
              </div>
            </div>
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
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Template sélectionné
                  </div>
                  <div className="mt-3 text-lg">
                    {selectedTemplate?.label ?? "—"}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 text-white/45">
                <ShieldCheck className="h-4 w-4 text-gold/80" />
                <span className="text-sm">
                  Meal gouverné DOMYLI : type canonique, template lisible, confirmation traçable.
                </span>
              </div>
            </section>

            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <Utensils className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Repas manipulés
                </span>
              </div>

              {items.length === 0 ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5 text-white/70">
                  Aucun repas créé ou modifié dans cette session.
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
                            {item.title ?? item.meal_slot_id}
                          </div>
                          <div className="mt-2 text-xs text-white/60">
                            {item.planned_for} · {getMealStatusLabel(item.status)}
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
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="mt-8 inline-flex w-full items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Retour dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}