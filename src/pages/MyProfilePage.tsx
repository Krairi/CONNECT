import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  HeartPulse,
  Save,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/providers/AuthProvider";
import { useMyProfile } from "@/src/hooks/useMyProfile";
import { ROUTES } from "@/src/constants/routes";
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
      <p className="text-xs uppercase tracking-[0.24em] text-white/45">{label}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {options.map((option) => {
          const checked = values.includes(option.value);

          return (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
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
                  <p className="mt-1 text-xs text-white/55">{option.description}</p>
                ) : null}
              </div>
            </label>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-white/55">
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

export default function MyProfilePage() {
  const navigate = useNavigate();
  const { isAuthenticated, hasHousehold, authLoading, bootstrapLoading } = useAuth();
  const { loading, saving, error, status, profile, lastSavedProfile, save } = useMyProfile();

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

  useEffect(() => {
    if (!profile) return;

    setDisplayName(profile.display_name ?? "");
    setBirthDate(profile.birth_date ?? "");
    setSex(profile.sex ?? "");
    setHeightCm(profile.height_cm != null ? String(profile.height_cm) : "");
    setWeightKg(profile.weight_kg != null ? String(profile.weight_kg) : "");
    setIsPregnant(Boolean(profile.is_pregnant));
    setHasDiabetes(Boolean(profile.has_diabetes));
    setGoal(profile.goal ?? "");
    setActivityLevel(profile.activity_level ?? "");
    setAllergies(profile.allergies ?? []);
    setFoodConstraints(profile.food_constraints ?? []);
    setCulturalConstraints(profile.cultural_constraints ?? []);
  }, [profile]);

  const canSubmit = useMemo(() => Boolean(displayName.trim()), [displayName]);

  const selectedGoalLabel = getOptionLabel(PROFILE_GOAL_OPTIONS, goal);
  const selectedActivityLabel = getOptionLabel(PROFILE_ACTIVITY_OPTIONS, activityLevel);
  const selectedAllergyLabels = getOptionLabels(PROFILE_ALLERGY_OPTIONS, allergies);
  const selectedFoodConstraintLabels = getOptionLabels(
    PROFILE_FOOD_CONSTRAINT_OPTIONS,
    foodConstraints,
  );
  const selectedCulturalConstraintLabels = getOptionLabels(
    PROFILE_CULTURAL_CONSTRAINT_OPTIONS,
    culturalConstraints,
  );
  const selectedSexLabel = getOptionLabel(PROFILE_SEX_OPTIONS, sex);

  if (authLoading || bootstrapLoading || loading) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          Chargement du profil...
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !hasHousehold || !status) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          Contexte requis.
        </div>
      </main>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    try {
      const result = await save({
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

      setMessage(`Profil enregistré : ${result.display_name}`);
      navigate(ROUTES.DASHBOARD);
    } catch {
      // erreur gérée par le hook
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
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
              <h1 className="mt-4 text-3xl font-semibold">Mon profil</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                Cette étape est obligatoire pour tout membre adulte connecté qui
                rejoint le foyer. Le profil humain devient ensuite exploitable
                par les repas, règles, tâches et arbitrages DOMYLI.
              </p>
            </div>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-gold">
            <UserRoundCog className="h-4 w-4" />
            Profil requis
          </div>

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
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </label>

              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Poids (kg)</span>
                <input
                  type="number"
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
              className="inline-flex w-full items-center justify-center gap-3 border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.24em] text-black disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving
                ? "Enregistrement..."
                : status.has_profile
                  ? "Mettre à jour mon profil"
                  : "Enregistrer mon profil"}
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
                Statut d’entrée
              </p>
              <p className="mt-2 text-sm text-white/85">
                {status.has_profile
                  ? `Profil déjà lié : ${status.profile_display_name ?? "Oui"}`
                  : "Aucun profil encore lié à ton compte dans ce foyer."}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Sexe
              </p>
              <p className="mt-2 text-sm text-white/85">{selectedSexLabel ?? "—"}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Objectif canonique
              </p>
              <p className="mt-2 text-sm text-white/85">{selectedGoalLabel ?? "—"}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Activité
              </p>
              <p className="mt-2 text-sm text-white/85">{selectedActivityLabel ?? "—"}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Allergies
              </p>
              <p className="mt-2 text-sm text-white/85">
                {selectedAllergyLabels.length ? selectedAllergyLabels.join(", ") : "Aucune"}
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
            </div>

            <div className="rounded-3xl border border-gold/20 bg-gold/10 p-5">
              <div className="inline-flex items-center gap-2 text-gold">
                <HeartPulse className="h-4 w-4" />
                <p className="text-xs uppercase tracking-[0.24em]">
                  Profil humain exploitable
                </p>
              </div>

              <p className="mt-3 text-sm leading-7 text-gold/90">
                Le profil membre devient la base réelle utilisée par DOMYLI pour
                les repas, tâches, règles, contraintes et arbitrages du foyer.
              </p>
            </div>

            {(message || error || lastSavedProfile) && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/85">
                {message ??
                  error?.message ??
                  (lastSavedProfile
                    ? `Profil enregistré : ${lastSavedProfile.display_name}`
                    : null)}
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}