import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  HeartPulse,
  Save,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/src/constants/routes";
import { useMyProfile } from "@/src/hooks/useMyProfile";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  readMyProfileStatus,
  type MyProfileStatus,
} from "@/src/services/profiles/myProfileService";
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

type MyProfileFormState = {
  displayName: string;
  birthDate: string;
  sex: string;
  heightCm: string;
  weightKg: string;
  isPregnant: boolean;
  hasDiabetes: boolean;
  goal: string;
  activityLevel: string;
  allergies: string[];
  foodConstraints: string[];
  culturalConstraints: string[];
};

const defaultFormState: MyProfileFormState = {
  displayName: "",
  birthDate: "",
  sex: "",
  heightCm: "",
  weightKg: "",
  isPregnant: false,
  hasDiabetes: false,
  goal: "",
  activityLevel: "",
  allergies: [],
  foodConstraints: [],
  culturalConstraints: [],
};

const REQUIRED_FIELD_LABELS: Record<string, string> = {
  DISPLAY_NAME: "Nom affiché",
  BIRTH_DATE: "Date de naissance",
  SEX: "Sexe",
  HEIGHT_CM: "Taille",
  WEIGHT_KG: "Poids",
  GOAL: "Objectif",
  ACTIVITY_LEVEL: "Niveau d’activité",
};

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

function buildFormStateFromProfile(
  profile:
    | {
        display_name: string;
        birth_date: string | null;
        sex: string | null;
        height_cm: number | null;
        weight_kg: number | null;
        is_pregnant: boolean;
        has_diabetes: boolean;
        goal: string | null;
        activity_level: string | null;
        allergies: string[];
        food_constraints: string[];
        cultural_constraints: string[];
      }
    | null
    | undefined,
): MyProfileFormState {
  if (!profile) {
    return defaultFormState;
  }

  return {
    displayName: profile.display_name ?? "",
    birthDate: profile.birth_date ?? "",
    sex: profile.sex ?? "",
    heightCm:
      profile.height_cm != null ? String(profile.height_cm) : "",
    weightKg:
      profile.weight_kg != null ? String(profile.weight_kg) : "",
    isPregnant: Boolean(profile.is_pregnant),
    hasDiabetes: Boolean(profile.has_diabetes),
    goal: profile.goal ?? "",
    activityLevel: profile.activity_level ?? "",
    allergies: profile.allergies ?? [],
    foodConstraints: profile.food_constraints ?? [],
    culturalConstraints: profile.cultural_constraints ?? [],
  };
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
    <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-white/60">
        {label}
      </p>

      <div className="mt-4 space-y-3">
        {options.map((option) => {
          const checked = values.includes(option.value);

          return (
            <label
              key={option.value}
              className="flex gap-3 text-sm text-white/85"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleValue(option.value)}
                className="mt-1 h-4 w-4"
              />

              <span>
                <span className="block">{option.label}</span>
                {option.description ? (
                  <span className="mt-1 block text-xs text-white/50">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-gold">
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
    <span className="inline-flex items-center rounded-full border border-gold/30 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gold">
      {labels[flow]}
    </span>
  );
}

function getMissingLabels(status: MyProfileStatus | null): string[] {
  if (!status?.required_fields?.length) {
    return [];
  }

  return status.required_fields.map(
    (field) => REQUIRED_FIELD_LABELS[field] ?? field,
  );
}

export default function MyProfilePage() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    hasHousehold,
    authLoading,
    bootstrapLoading,
    activeMembership,
  } = useAuth();

  const {
    loading,
    saving,
    error,
    status,
    profile,
    lastSavedProfile,
    save,
  } = useMyProfile();

  const [form, setForm] = useState<MyProfileFormState>(defaultFormState);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      if (status?.has_profile && status.profile_display_name) {
        setForm((prev) => ({
          ...prev,
          displayName: prev.displayName || status.profile_display_name || "",
        }));
      }
      return;
    }

    setForm(buildFormStateFromProfile(profile));
  }, [profile, status]);

  const missingLabels = useMemo(() => getMissingLabels(status), [status]);

  const canSubmit = useMemo(
    () =>
      Boolean(
        form.displayName.trim() &&
          form.birthDate &&
          form.sex &&
          form.heightCm &&
          form.weightKg &&
          form.goal &&
          form.activityLevel,
      ),
    [
      form.activityLevel,
      form.birthDate,
      form.displayName,
      form.goal,
      form.heightCm,
      form.sex,
      form.weightKg,
    ],
  );

  const selectedGoalLabel = getOptionLabel(
    PROFILE_GOAL_OPTIONS,
    form.goal,
  );
  const selectedActivityLabel = getOptionLabel(
    PROFILE_ACTIVITY_OPTIONS,
    form.activityLevel,
  );
  const selectedAllergyLabels = getOptionLabels(
    PROFILE_ALLERGY_OPTIONS,
    form.allergies,
  );
  const selectedFoodConstraintLabels = getOptionLabels(
    PROFILE_FOOD_CONSTRAINT_OPTIONS,
    form.foodConstraints,
  );
  const selectedCulturalConstraintLabels = getOptionLabels(
    PROFILE_CULTURAL_CONSTRAINT_OPTIONS,
    form.culturalConstraints,
  );
  const selectedSexLabel = getOptionLabel(
    PROFILE_SEX_OPTIONS,
    form.sex,
  );

  const setField = <K extends keyof MyProfileFormState>(
    field: K,
    value: MyProfileFormState[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (authLoading || bootstrapLoading || loading) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            DOMYLI
          </p>
          <h1 className="mt-4 text-3xl font-semibold">
            Chargement du profil...
          </h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold || !status) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            DOMYLI
          </p>
          <h1 className="mt-4 text-3xl font-semibold">Contexte requis</h1>
          <p className="mt-3 text-white/70">
            Un foyer actif et un contexte membre valide sont requis pour gérer
            le profil humain.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    try {
      const result = await save({
        p_display_name: form.displayName.trim(),
        p_birth_date: form.birthDate || null,
        p_sex: form.sex || null,
        p_height_cm: form.heightCm ? Number(form.heightCm) : null,
        p_weight_kg: form.weightKg ? Number(form.weightKg) : null,
        p_is_pregnant: form.isPregnant,
        p_has_diabetes: form.hasDiabetes,
        p_goal: form.goal || null,
        p_activity_level: form.activityLevel || null,
        p_allergies: toNullableArray(form.allergies),
        p_food_constraints: toNullableArray(form.foodConstraints),
        p_cultural_constraints: toNullableArray(
          form.culturalConstraints,
        ),
      });

      const refreshedStatus = await readMyProfileStatus();

      setMessage(
        refreshedStatus.profile_completed
          ? `Profil enregistré : ${result.display_name}. DOMYLI débloque maintenant les parcours métier.`
          : `Profil enregistré : ${result.display_name}. DOMYLI attend encore ${getMissingLabels(refreshedStatus).join(", ")}.`,
      );

      window.setTimeout(() => {
        navigate(
          refreshedStatus.profile_completed
            ? ROUTES.DASHBOARD
            : ROUTES.MY_PROFILE,
          { replace: true },
        );
      }, 350);
    } catch {
      // erreur déjà normalisée dans le hook ou le service
    }
  };

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4 rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gold">
              DOMYLI
            </p>
            <h1 className="mt-4 text-3xl font-semibold">Mon profil</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
              Cette étape est obligatoire pour tout membre adulte connecté qui
              rejoint le foyer. Le profil humain devient ensuite exploitable par
              les repas, règles, tâches et arbitrages DOMYLI.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(ROUTES.ACTIVATE_HOUSEHOLD)}
            className="inline-flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_380px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <UserRoundCog className="h-5 w-5 text-gold" />
              <p className="text-sm uppercase tracking-[0.24em] text-gold">
                Profil requis
              </p>
            </div>

            <h2 className="mt-4 text-2xl font-semibold">
              Structurer mon profil canonique
            </h2>

            <p className="mt-3 text-sm leading-7 text-white/70">
              DOMYLI normalise ici l’identité métier du compte connecté. Cette
              structure sert ensuite de base aux repas, aux règles, à la
              faisabilité, aux tâches et aux arbitrages du foyer.
            </p>

            {missingLabels.length > 0 ? (
              <div className="mt-6 rounded-[24px] border border-amber-500/20 bg-amber-500/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-amber-300">
                  Complétion requise
                </p>
                <p className="mt-3 text-sm leading-7 text-white/80">
                  DOMYLI exige encore : {missingLabels.join(", ")}.
                </p>
              </div>
            ) : null}

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/60">
                  Nom affiché
                </span>
                <input
                  value={form.displayName}
                  onChange={(e) =>
                    setField("displayName", e.target.value)
                  }
                  required
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </label>

              <label className="block">
                <span className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/60">
                  Date de naissance
                </span>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) =>
                    setField("birthDate", e.target.value)
                  }
                  required
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </label>

              <label className="block">
                <span className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/60">
                  Sexe
                </span>
                <select
                  value={form.sex}
                  onChange={(e) => setField("sex", e.target.value)}
                  required
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

              <label className="block">
                <span className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/60">
                  Taille (cm)
                </span>
                <input
                  type="number"
                  min="0"
                  required
                  value={form.heightCm}
                  onChange={(e) =>
                    setField("heightCm", e.target.value)
                  }
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </label>

              <label className="block">
                <span className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/60">
                  Poids (kg)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  value={form.weightKg}
                  onChange={(e) =>
                    setField("weightKg", e.target.value)
                  }
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </label>

              <label className="block">
                <span className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/60">
                  Objectif
                </span>
                <select
                  value={form.goal}
                  onChange={(e) => setField("goal", e.target.value)}
                  required
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  <option value="">
                    Sélectionner un objectif canonique
                  </option>
                  {PROFILE_GOAL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/60">
                  Activité
                </span>
                <select
                  value={form.activityLevel}
                  onChange={(e) =>
                    setField("activityLevel", e.target.value)
                  }
                  required
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  <option value="">
                    Sélectionner un niveau d’activité
                  </option>
                  {PROFILE_ACTIVITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-6 rounded-[24px] border border-white/10 bg-black/20 p-5">
              <label className="inline-flex items-center gap-3 text-sm text-white/85">
                <input
                  type="checkbox"
                  checked={form.isPregnant}
                  onChange={(e) =>
                    setField("isPregnant", e.target.checked)
                  }
                  className="h-4 w-4"
                />
                Grossesse
              </label>

              <label className="inline-flex items-center gap-3 text-sm text-white/85">
                <input
                  type="checkbox"
                  checked={form.hasDiabetes}
                  onChange={(e) =>
                    setField("hasDiabetes", e.target.checked)
                  }
                  className="h-4 w-4"
                />
                Diabète
              </label>
            </div>

            <div className="mt-6 grid gap-6">
              <MultiChoiceGroup
                label="Allergies"
                options={PROFILE_ALLERGY_OPTIONS}
                values={form.allergies}
                onChange={(next) => setField("allergies", next)}
              />
              <MultiChoiceGroup
                label="Contraintes alimentaires"
                options={PROFILE_FOOD_CONSTRAINT_OPTIONS}
                values={form.foodConstraints}
                onChange={(next) => setField("foodConstraints", next)}
              />
              <MultiChoiceGroup
                label="Contraintes culturelles"
                options={PROFILE_CULTURAL_CONSTRAINT_OPTIONS}
                values={form.culturalConstraints}
                onChange={(next) => setField("culturalConstraints", next)}
              />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={saving || !canSubmit}
                className="inline-flex items-center justify-center gap-3 bg-gold px-6 py-4 text-sm uppercase tracking-[0.24em] text-black disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Enregistrement..." : "Enregistrer le profil"}
              </button>

              {(message || error?.message) && (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85">
                  {message ?? error?.message}
                </div>
              )}
            </div>
          </form>

          <aside className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/70">
              <ShieldCheck className="h-4 w-4" />
              Lecture profil
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Foyer
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {activeMembership?.household_name ?? "—"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="inline-flex items-center gap-2 text-gold">
                  <HeartPulse className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.24em]">
                    Synthèse contrôlée
                  </p>
                </div>

                <div className="mt-5 space-y-3 text-sm text-white/80">
                  <p>Sexe : {selectedSexLabel ?? "À sélectionner"}</p>
                  <p>Objectif : {selectedGoalLabel ?? "À sélectionner"}</p>
                  <p>
                    Activité : {selectedActivityLabel ?? "À sélectionner"}
                  </p>
                  <p>
                    Allergies :{" "}
                    {selectedAllergyLabels.length > 0
                      ? selectedAllergyLabels.join(", ")
                      : "Aucune sélection"}
                  </p>
                  <p>
                    Contraintes alimentaires :{" "}
                    {selectedFoodConstraintLabels.length > 0
                      ? selectedFoodConstraintLabels.join(", ")
                      : "Aucune sélection"}
                  </p>
                  <p>
                    Contraintes culturelles :{" "}
                    {selectedCulturalConstraintLabels.length > 0
                      ? selectedCulturalConstraintLabels.join(", ")
                      : "Aucune sélection"}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-gold/20 bg-gold/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-gold">
                  Domaines alimentés
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {PROFILE_IMPACT_FLOWS.map((flow) => (
                    <FlowBadge key={flow} flow={flow} />
                  ))}
                </div>
              </div>

              {lastSavedProfile ? (
                <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">
                    Dernier enregistrement
                  </p>
                  <p className="mt-3 text-sm text-white/80">
                    {lastSavedProfile.display_name}
                  </p>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
