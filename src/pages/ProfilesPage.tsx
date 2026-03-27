import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  HeartPulse,
  Save,
  ShieldCheck,
  UserRoundCog,
  UtensilsCrossed,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { useProfiles } from "@/src/hooks/useProfiles";
import { ROUTES } from "@/src/constants/routes";
import { toDomyliError } from "@/src/lib/errors";
import {
  PROFILE_ACTIVITY_OPTIONS,
  PROFILE_ALLERGY_OPTIONS,
  PROFILE_CULTURAL_CONSTRAINT_OPTIONS,
  PROFILE_FOOD_CONSTRAINT_OPTIONS,
  PROFILE_GOAL_OPTIONS,
  PROFILE_IMPACT_FLOWS,
  PROFILE_SEX_OPTIONS,
  ProfileFlow,
  ProfileOption,
  getOptionLabel,
  getOptionLabels,
} from "@/src/constants/profileCatalog";

function renderSelectedSummary(
  values: string[],
  options: ProfileOption[],
): string {
  if (values.length === 0) return "Aucune sélection";

  const labels = getOptionLabels(options, values);
  return labels.length > 0 ? labels.join(", ") : "Aucune sélection";
}

function MultiChoiceGroup({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: ProfileOption[];
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const toggleValue = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value));
      return;
    }

    onChange([...values, value]);
  };

  return (
    <div>
      <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
        {label}
      </label>

      <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          {options.map((option) => {
            const checked = values.includes(option.value);

            return (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-3 rounded-[1rem] border px-4 py-3 text-sm transition-colors ${
                  checked
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-white/10 bg-black/20 text-white/75 hover:border-gold/25"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleValue(option.value)}
                  className="h-4 w-4 accent-[#d4af37]"
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>

        <div className="mt-4 text-sm text-white/45">
          {renderSelectedSummary(values, options)}
        </div>
      </div>
    </div>
  );
}

function FlowBadge({ flow }: { flow: ProfileFlow }) {
  const labels: Record<ProfileFlow, string> = {
    MEALS: "Repas",
    TASKS: "Tâches",
    RULES: "Règles",
    SHOPPING: "Courses",
  };

  return (
    <span className="inline-flex items-center border border-gold/30 bg-gold/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gold">
      {labels[flow]}
    </span>
  );
}

function isDuplicateProfileError(error: unknown): boolean {
  const normalized = toDomyliError(error);
  const haystack =
    `${normalized.code ?? ""} ${normalized.message ?? ""} ${normalized.details ?? ""} ${normalized.hint ?? ""}`.toLowerCase();

  return (
    normalized.code === "DOMYLI_PROFILE_ALREADY_EXISTS" ||
    haystack.includes("uq_human_profiles_household_member") ||
    (haystack.includes("duplicate key value violates unique constraint") &&
      haystack.includes("human_profiles"))
  );
}

export default function ProfilesPage() {
  const navigate = useNavigate();

  const {
    bootstrap,
    activeMembership,
    isAuthenticated,
    hasHousehold,
    authLoading,
    bootstrapLoading,
  } = useAuth();

  const { saveProfile, saving, error, lastSavedProfile } = useProfiles();

  const householdId = bootstrap?.active_household_id ?? null;
  const memberUserId = bootstrap?.user_id ?? null;

  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [isPregnant, setIsPregnant] = useState(false);
  const [hasDiabetes, setHasDiabetes] = useState(false);
  const [goal, setGoal] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [foodConstraints, setFoodConstraints] = useState<string[]>([]);
  const [culturalConstraints, setCulturalConstraints] = useState<string[]>([]);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(householdId && displayName.trim());
  }, [householdId, displayName]);

  const selectedGoalLabel = getOptionLabel(PROFILE_GOAL_OPTIONS, goal);
  const selectedActivityLabel = getOptionLabel(
    PROFILE_ACTIVITY_OPTIONS,
    activityLevel,
  );
  const selectedAllergyLabels = getOptionLabels(
    PROFILE_ALLERGY_OPTIONS,
    allergies,
  );
  const selectedFoodConstraintLabels = getOptionLabels(
    PROFILE_FOOD_CONSTRAINT_OPTIONS,
    foodConstraints,
  );
  const selectedCulturalConstraintLabels = getOptionLabels(
    PROFILE_CULTURAL_CONSTRAINT_OPTIONS,
    culturalConstraints,
  );
  const selectedSexLabel = getOptionLabel(PROFILE_SEX_OPTIONS, sex);

  if (authLoading || bootstrapLoading) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-gold/20 bg-black/40 p-8">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/80">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold">Chargement de Profiles...</h1>
          <p className="mt-4 text-white/65">
            Synchronisation du contexte foyer et du premier profil humain.
          </p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !hasHousehold || !householdId) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-gold/20 bg-black/40 p-8">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/80">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold">Foyer requis</h1>
          <p className="mt-4 text-white/65">
            La page Profiles nécessite un foyer actif résolu par le bootstrap DOMYLI.
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

  const goNext = () => {
    window.setTimeout(() => {
      navigate(ROUTES.INVENTORY);
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalMessage(null);

    try {
      const result = await saveProfile({
        p_household_id: householdId,
        p_member_user_id: memberUserId,
        p_display_name: displayName.trim(),
        p_birth_date: birthDate || null,
        p_sex: sex || null,
        p_height_cm: heightCm ? Number(heightCm) : null,
        p_weight_kg: weightKg ? Number(weightKg) : null,
        p_is_pregnant: isPregnant,
        p_has_diabetes: hasDiabetes,
        p_goal: goal || null,
        p_activity_level: activityLevel || null,
        p_allergies: allergies.length > 0 ? allergies : null,
        p_food_constraints: foodConstraints.length > 0 ? foodConstraints : null,
        p_cultural_constraints:
          culturalConstraints.length > 0 ? culturalConstraints : null,
      });

      setLocalMessage(
        `Profil enregistré : ${result.display_name || displayName.trim()}`,
      );
      goNext();
    } catch (caughtError) {
      if (isDuplicateProfileError(caughtError)) {
        setLocalMessage("Profil déjà présent pour ce foyer. Passage à l’inventaire.");
        goNext();
        return;
      }

      setLocalMessage(toDomyliError(caughtError).message);
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
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
          <h1 className="mt-3 text-4xl font-semibold">Profiles</h1>
          <p className="mt-3 max-w-3xl text-white/65">
            Ici, le profil humain n’est pas un simple formulaire. C’est une base
            structurée qui gouverne les repas, les règles, les tâches et les
            contraintes du foyer.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
            <div className="mb-6 flex items-center gap-3 text-gold/85">
              <UserRoundCog className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.35em]">
                Profil humain gouverné
              </span>
            </div>

            <h2 className="text-3xl font-semibold">Structurer un profil canonique</h2>

            <p className="mt-6 max-w-3xl text-lg leading-9 text-white/65">
              Sélectionne les objectifs, le niveau d’activité et les contraintes
              structurantes du profil. Cette normalisation prépare des décisions
              fiables côté repas, courses, règles et exécution domestique.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Nom affiché
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Date de naissance
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Sexe
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  <option value="">Sélectionner</option>
                  {PROFILE_SEX_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Taille (cm)
                </label>
                <input
                  type="number"
                  min="0"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Poids (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Objectif
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  <option value="">Sélectionner un objectif canonique</option>
                  {PROFILE_GOAL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Activité
                </label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  <option value="">Sélectionner un niveau d’activité</option>
                  {PROFILE_ACTIVITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-end gap-4">
                <label className="inline-flex items-center gap-3 text-sm text-white/75">
                  <input
                    type="checkbox"
                    checked={isPregnant}
                    onChange={(e) => setIsPregnant(e.target.checked)}
                    className="h-4 w-4 accent-[#d4af37]"
                  />
                  Grossesse
                </label>

                <label className="inline-flex items-center gap-3 text-sm text-white/75">
                  <input
                    type="checkbox"
                    checked={hasDiabetes}
                    onChange={(e) => setHasDiabetes(e.target.checked)}
                    className="h-4 w-4 accent-[#d4af37]"
                  />
                  Diabète
                </label>
              </div>

              <div className="md:col-span-2">
                <MultiChoiceGroup
                  label="Allergies"
                  options={PROFILE_ALLERGY_OPTIONS}
                  values={allergies}
                  onChange={setAllergies}
                />
              </div>

              <div className="md:col-span-2">
                <MultiChoiceGroup
                  label="Contraintes alimentaires"
                  options={PROFILE_FOOD_CONSTRAINT_OPTIONS}
                  values={foodConstraints}
                  onChange={setFoodConstraints}
                />
              </div>

              <div className="md:col-span-2">
                <MultiChoiceGroup
                  label="Contraintes culturelles"
                  options={PROFILE_CULTURAL_CONSTRAINT_OPTIONS}
                  values={culturalConstraints}
                  onChange={setCulturalConstraints}
                />
              </div>

              <div className="md:col-span-2 flex flex-wrap gap-4 pt-2">
                <button
                  type="submit"
                  disabled={!canSubmit || saving}
                  className="inline-flex items-center justify-center gap-3 bg-gold px-6 py-4 text-sm uppercase tracking-[0.24em] text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Enregistrement..." : "Enregistrer le profil"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(ROUTES.INVENTORY)}
                  className="inline-flex items-center justify-center gap-3 border border-gold/30 px-6 py-4 text-sm uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold/10"
                >
                  Ouvrir Inventory
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate(ROUTES.DASHBOARD)}
                  className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
                >
                  Retour Dashboard
                </button>
              </div>
            </form>

            {(localMessage || error) && (
              <div className="mt-8 border border-gold/20 bg-gold/10 px-5 py-4 text-lg text-gold">
                {localMessage ?? error?.message}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Lecture métier DOMYLI
                </span>
              </div>

              <div className="space-y-5">
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
                    Household ID
                  </div>
                  <div className="mt-3 break-all text-xl">{householdId}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Dernier profil
                  </div>
                  <div className="mt-3 text-2xl">
                    {lastSavedProfile?.display_name ?? displayName.trim() || "—"}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Sexe
                  </div>
                  <div className="mt-3 text-2xl">{selectedSexLabel ?? "—"}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Objectif canonique
                  </div>
                  <div className="mt-3 text-2xl">{selectedGoalLabel ?? "—"}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Activité
                  </div>
                  <div className="mt-3 text-2xl">{selectedActivityLabel ?? "—"}</div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <UtensilsCrossed className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Cohérence déterministe
                </span>
              </div>

              <div className="space-y-5 text-white/75">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                    Allergies
                  </div>
                  <div className="mt-3 text-base">
                    {selectedAllergyLabels.length
                      ? selectedAllergyLabels.join(", ")
                      : "Aucune"}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                    Contraintes alimentaires
                  </div>
                  <div className="mt-3 text-base">
                    {selectedFoodConstraintLabels.length
                      ? selectedFoodConstraintLabels.join(", ")
                      : "Aucune"}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                    Contraintes culturelles
                  </div>
                  <div className="mt-3 text-base">
                    {selectedCulturalConstraintLabels.length
                      ? selectedCulturalConstraintLabels.join(", ")
                      : "Aucune"}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                    Conditions structurantes
                  </div>
                  <div className="mt-3 text-base">
                    {[isPregnant ? "Grossesse" : null, hasDiabetes ? "Diabète" : null]
                      .filter(Boolean)
                      .join(", ") || "Aucune"}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                    Flux impactés
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {PROFILE_IMPACT_FLOWS.map((flow) => (
                      <FlowBadge key={flow} flow={flow} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3 text-white/45">
                <HeartPulse className="h-4 w-4 text-gold/80" />
                <span className="text-sm">
                  Profil gouverné DOMYLI : objectif canonique, activité normalisée,
                  contraintes exploitables.
                </span>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}