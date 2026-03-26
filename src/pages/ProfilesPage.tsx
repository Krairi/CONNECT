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
import { callRpc } from "@/src/services/rpc";
import { getErrorMessage } from "./utils/getErrorMessage";
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

type ProfileUpsertOutput = {
  profile_id?: string | null;
  display_name?: string | null;
};

function toNullableArray(values: string[]): string[] | null {
  return values.length > 0 ? values : null;
}

function renderSelectedSummary(values: string[], options: ProfileOption[]): string {
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
    <div className="md:col-span-2">
      <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
        {label}
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        {options.map((option) => {
          const checked = values.includes(option.value);

          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-3 border px-4 py-4 transition-colors ${
                checked
                  ? "border-gold/60 bg-gold/10"
                  : "border-white/10 bg-black/20 hover:border-gold/30"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleValue(option.value)}
                className="h-4 w-4"
              />
              <span className="text-sm text-white">{option.label}</span>
            </label>
          );
        })}
      </div>

      <p className="mt-3 text-sm text-gold/80">
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
    <span className="inline-flex items-center border border-gold/30 bg-gold/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gold">
      {labels[flow]}
    </span>
  );
}

export default function ProfilesPage() {
  const navigate = useNavigate();
  const { bootstrap, activeMembership, isAuthenticated, hasHousehold } = useAuth();

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

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(householdId && displayName.trim());
  }, [householdId, displayName]);

  const selectedGoalLabel = getOptionLabel(PROFILE_GOAL_OPTIONS, goal);
  const selectedActivityLabel = getOptionLabel(
    PROFILE_ACTIVITY_OPTIONS,
    activityLevel
  );
  const selectedAllergyLabels = getOptionLabels(PROFILE_ALLERGY_OPTIONS, allergies);
  const selectedFoodConstraintLabels = getOptionLabels(
    PROFILE_FOOD_CONSTRAINT_OPTIONS,
    foodConstraints
  );
  const selectedCulturalConstraintLabels = getOptionLabels(
    PROFILE_CULTURAL_CONSTRAINT_OPTIONS,
    culturalConstraints
  );
  const selectedSexLabel = getOptionLabel(PROFILE_SEX_OPTIONS, sex);

  if (!isAuthenticated || !hasHousehold || !householdId) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl border border-gold/20 bg-black/40 p-8">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/80">DOMYLI</div>
          <h1 className="mt-4 text-3xl font-semibold">Foyer requis</h1>
          <p className="mt-4 text-white/70">
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const result = (await callRpc(
        "rpc_human_profile_upsert",
        {
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
        },
        { unwrap: true }
      )) as ProfileUpsertOutput | null;

      setMessage(`Profil enregistré : ${result?.display_name ?? displayName.trim()}`);
      goNext();
    } catch (error) {
      const msg = getErrorMessage(error);

      if (msg.includes("uq_human_profiles_household_member")) {
        setMessage("Profil déjà présent pour ce foyer. Passage à l’inventaire.");
        goNext();
        return;
      }

      setMessage(msg);
    } finally {
      setSaving(false);
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
            <h1 className="mt-3 text-4xl font-semibold">Profiles</h1>
            <p className="mt-3 max-w-3xl text-white/65">
              Ici, le profil humain n’est pas un simple formulaire. C’est une base
              structurée qui gouverne les repas, les règles, les tâches et les
              contraintes du foyer.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
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

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
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

              <label className="flex items-center gap-3 border border-white/10 bg-black/20 px-4 py-5">
                <input
                  type="checkbox"
                  checked={isPregnant}
                  onChange={(e) => setIsPregnant(e.target.checked)}
                />
                <span className="text-lg">Grossesse</span>
              </label>

              <label className="flex items-center gap-3 border border-white/10 bg-black/20 px-4 py-5">
                <input
                  type="checkbox"
                  checked={hasDiabetes}
                  onChange={(e) => setHasDiabetes(e.target.checked)}
                />
                <span className="text-lg">Diabète</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!canSubmit || saving}
              className="mt-8 inline-flex w-full items-center justify-center gap-3 bg-gold px-6 py-5 text-sm uppercase tracking-[0.28em] text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Enregistrement..." : "Enregistrer le profil"}
            </button>
          </form>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <HeartPulse className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Lecture métier DOMYLI
                </span>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5 text-white/75">
                <div className="space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                      Foyer
                    </div>
                    <div className="mt-2 text-xl">
                      {activeMembership?.household_name ?? "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                      Rôle
                    </div>
                    <div className="mt-2 text-xl">{activeMembership?.role ?? "—"}</div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                      Household ID
                    </div>
                    <div className="mt-2 break-all text-xl">{householdId}</div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                      Sexe
                    </div>
                    <div className="mt-2 text-xl">{selectedSexLabel ?? "—"}</div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                      Objectif canonique
                    </div>
                    <div className="mt-2 text-xl">{selectedGoalLabel ?? "—"}</div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                      Activité
                    </div>
                    <div className="mt-2 text-xl">{selectedActivityLabel ?? "—"}</div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                      Allergies
                    </div>
                    <div className="mt-2 text-base">
                      {selectedAllergyLabels.length
                        ? selectedAllergyLabels.join(", ")
                        : "Aucune"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                      Contraintes alimentaires
                    </div>
                    <div className="mt-2 text-base">
                      {selectedFoodConstraintLabels.length
                        ? selectedFoodConstraintLabels.join(", ")
                        : "Aucune"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                      Contraintes culturelles
                    </div>
                    <div className="mt-2 text-base">
                      {selectedCulturalConstraintLabels.length
                        ? selectedCulturalConstraintLabels.join(", ")
                        : "Aucune"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                      Conditions structurantes
                    </div>
                    <div className="mt-2 text-base">
                      {[
                        isPregnant ? "Grossesse" : null,
                        hasDiabetes ? "Diabète" : null,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Aucune"}
                    </div>
                  </div>
                </div>

                <div className="mt-8">
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

              <div className="mt-6 flex items-center gap-3 text-white/45">
                <ShieldCheck className="h-4 w-4 text-gold/80" />
                <span className="text-sm">
                  Profil gouverné DOMYLI : objectif canonique, activité normalisée,
                  contraintes exploitables.
                </span>
              </div>
            </section>

            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <UtensilsCrossed className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Suite de parcours
                </span>
              </div>

              <p className="text-white/65">
                Une fois le profil structuré, DOMYLI peut passer à l’inventaire
                gouverné pour fermer le premier chaînage métier.
              </p>

              <button
                type="button"
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="mt-8 inline-flex w-full items-center justify-center gap-3 border border-gold/40 px-5 py-4 text-sm uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold hover:text-black"
              >
                Retour au dashboard
                <ArrowRight className="h-4 w-4" />
              </button>

              {message && (
                <div className="mt-6 border border-gold/20 bg-gold/10 px-5 py-4 text-base text-gold">
                  {message}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}