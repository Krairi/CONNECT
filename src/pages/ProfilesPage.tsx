import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  HeartPulse,
  Save,
  ShieldCheck,
  UserRoundCog,
  UtensilsCrossed,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/providers/AuthProvider";
import { ROUTES } from "@/src/constants/routes";
import { useProfiles } from "@/src/hooks/useProfiles";
import { getErrorMessage } from "./utils/getErrorMessage";
import {
  PROFILE_ACTIVITY_OPTIONS,
  PROFILE_ALLERGY_OPTIONS,
  PROFILE_CULTURAL_CONSTRAINT_OPTIONS,
  PROFILE_FOOD_CONSTRAINT_OPTIONS,
  PROFILE_GOAL_OPTIONS,
  PROFILE_IMPACT_FLOWS,
  PROFILE_SEX_OPTIONS,
  type ProfileFlow,
  type ProfileOption,
  getOptionLabel,
  getOptionLabels,
} from "@/src/constants/profileCatalog";

function toNullableArray(values: string[]): string[] | null {
  return values.length > 0 ? values : null;
}

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
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-white/45">
        {label}
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {options.map((option) => {
          const checked = values.includes(option.value);

          return (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-gold/30"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleValue(option.value)}
                className="mt-1 h-4 w-4"
              />
              <div>
                <p className="text-sm font-medium text-white">{option.label}</p>
                {option.description ? (
                  <p className="mt-1 text-xs text-white/55">
                    {option.description}
                  </p>
                ) : null}
              </div>
            </label>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-white/55">
        {renderSelectedSummary(values, options)}
      </p>
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
    <span className="inline-flex items-center rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gold">
      {labels[flow]}
    </span>
  );
}

export default function ProfilesPage() {
  const navigate = useNavigate();
  const { bootstrap, activeMembership, isAuthenticated, hasHousehold } =
    useAuth();
  const { saveProfile, saving, lastSavedProfile } = useProfiles();

  const householdId = bootstrap?.active_household_id ?? null;

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
  const [message, setMessage] = useState<string | null>(null);

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

  if (!isAuthenticated || !hasHousehold || !householdId) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-5xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            DOMYLI
          </p>
          <h1 className="mt-4 text-3xl font-semibold">Foyer requis</h1>
          <p className="mt-3 max-w-2xl text-white/70">
            La page Profiles nécessite un foyer actif résolu par le bootstrap
            DOMYLI.
          </p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-black"
          >
            Retour à l’accueil
          </button>
        </div>
      </div>
    );
  }

  const goNext = () => {
    window.setTimeout(() => {
      navigate(ROUTES.INVENTORY);
    }, 500);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    try {
      const result = await saveProfile({
        p_household_id: householdId,
        p_display_name: displayName.trim(),
        p_birth_date: birthDate || null,
        p_sex: sex || null,
        p_height_cm: heightCm ? Number(heightCm) : null,
        p_weight_kg: weightKg ? Number(weightKg) : null,
        p_is_pregnant: isPregnant,
        p_has_diabetes: hasDiabetes,
        p_goal: goal || null,
        p_activity_level: activityLevel || null,
        p_allergies: toNullableArray(allergies),
        p_food_constraints: toNullableArray(foodConstraints),
        p_cultural_constraints: toNullableArray(culturalConstraints),
      });

      setMessage(
        `Profil enregistré : ${result.display_name ?? displayName.trim()}`,
      );
      goNext();
    } catch (error) {
      const msg = getErrorMessage(error);

      if (
        msg.includes("uq_human_profiles_household_member") ||
        msg.includes("already exists") ||
        msg.includes("duplicate")
      ) {
        setMessage("Profil déjà présent pour ce foyer. Passage à l’inventaire.");
        goNext();
        return;
      }

      setMessage(msg);
    }
  };

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white">
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
                <p className="text-xs uppercase tracking-[0.24em] text-gold">
                  DOMYLI
                </p>
                <h1 className="mt-4 text-3xl font-semibold">Profiles</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                  Ici, le profil humain n’est pas un simple formulaire. C’est
                  une base structurée qui gouverne les repas, les règles, les
                  tâches et les contraintes du foyer.
                </p>
              </div>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-gold">
              <UserRoundCog className="h-4 w-4" />
              Profil humain gouverné
            </div>

            <h2 className="mt-6 text-2xl font-semibold">
              Structurer un profil canonique
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
              Sélectionne les objectifs, le niveau d’activité et les contraintes
              structurantes du profil. Cette normalisation prépare des décisions
              fiables côté repas, courses, règles et exécution domestique.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Nom affiché</span>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </label>

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Date de naissance</span>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </label>

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Sexe</span>
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
                </label>

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Taille (cm)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </label>

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Poids (kg)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </label>

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Objectif</span>
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
                </label>

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Activité</span>
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
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={isPregnant}
                    onChange={(e) => setIsPregnant(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Grossesse
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={hasDiabetes}
                    onChange={(e) => setHasDiabetes(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Diabète
                </label>
              </div>

              <MultiChoiceGroup
                label="Allergies"
                options={PROFILE_ALLERGY_OPTIONS}
                values={allergies}
                onChange={setAllergies}
              />

              <MultiChoiceGroup
                label="Contraintes alimentaires"
                options={PROFILE_FOOD_CONSTRAINT_OPTIONS}
                values={foodConstraints}
                onChange={setFoodConstraints}
              />

              <MultiChoiceGroup
                label="Contraintes culturelles"
                options={PROFILE_CULTURAL_CONSTRAINT_OPTIONS}
                values={culturalConstraints}
                onChange={setCulturalConstraints}
              />

              <button
                type="submit"
                disabled={!canSubmit || saving}
                className="inline-flex w-full items-center justify-center gap-3 border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.24em] text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <HeartPulse className="h-4 w-4 animate-pulse" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Enregistrer le profil
                  </>
                )}
              </button>
            </form>
          </section>

          <aside className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/70">
              <ShieldCheck className="h-4 w-4" />
              Lecture métier DOMYLI
            </div>

            <div className="mt-8 space-y-5">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Foyer
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {activeMembership?.household_name ?? "—"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Rôle
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {activeMembership?.role ?? "—"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Household ID
                </p>
                <p className="mt-2 break-all text-xs text-white/60">
                  {householdId}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Sexe
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {selectedSexLabel ?? "—"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Objectif canonique
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {selectedGoalLabel ?? "—"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Activité
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {selectedActivityLabel ?? "—"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Allergies
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {selectedAllergyLabels.length
                    ? selectedAllergyLabels.join(", ")
                    : "Aucune"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Contraintes alimentaires
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {selectedFoodConstraintLabels.length
                    ? selectedFoodConstraintLabels.join(", ")
                    : "Aucune"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Contraintes culturelles
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {selectedCulturalConstraintLabels.length
                    ? selectedCulturalConstraintLabels.join(", ")
                    : "Aucune"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Conditions structurantes
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {[isPregnant ? "Grossesse" : null, hasDiabetes ? "Diabète" : null]
                    .filter(Boolean)
                    .join(", ") || "Aucune"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Flux impactés
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PROFILE_IMPACT_FLOWS.map((flow) => (
                    <FlowBadge key={flow} flow={flow} />
                  ))}
                </div>
                <p className="mt-4 text-sm text-white/60">
                  Profil gouverné DOMYLI : objectif canonique, activité
                  normalisée, contraintes exploitables.
                </p>
              </div>

              <div className="rounded-3xl border border-gold/20 bg-gold/10 p-5">
                <div className="inline-flex items-center gap-2 text-gold">
                  <UtensilsCrossed className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.24em]">
                    Suite de parcours
                  </p>
                </div>

                <p className="mt-3 text-sm leading-7 text-gold/90">
                  Une fois le profil structuré, DOMYLI peut passer à l’inventaire
                  gouverné pour fermer le premier chaînage métier.
                </p>

                <button
                  type="button"
                  onClick={() => navigate(ROUTES.DASHBOARD)}
                  className="mt-8 inline-flex w-full items-center justify-center gap-3 border border-gold/40 px-5 py-4 text-sm uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold hover:text-black"
                >
                  Retour au dashboard
                </button>
              </div>

              {lastSavedProfile ? (
                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm text-emerald-100">
                  Dernier profil persisté : {lastSavedProfile.display_name}
                </div>
              ) : null}

              {message ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/85">
                  {message}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => navigate(ROUTES.INVENTORY)}
                className="inline-flex w-full items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Continuer vers Inventory
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}