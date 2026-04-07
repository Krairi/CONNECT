import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  HeartPulse,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  UserRoundCog,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/src/constants/routes";
import { useAuth } from "@/src/providers/AuthProvider";
import { getErrorMessage } from "@/src/pages/utils/getErrorMessage";
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
import {
  listQuickHumanProfiles,
  upsertQuickHumanProfile,
  type QuickHumanProfile,
} from "@/src/services/profiles/profileQuickService";

type ProfileFormState = {
  profileId: string | null;
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
  isConnectable: boolean;
};

const defaultFormState: ProfileFormState = {
  profileId: null,
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
  isConnectable: true,
};

function toNullableArray(values: string[]): string[] | null {
  return values.length > 0 ? values : null;
}

function renderSelectedSummary(values: string[], options: ProfileOption[]): string {
  if (values.length === 0) return "Aucune sélection";
  const labels = getOptionLabels(options, values);
  return labels.length > 0 ? labels.join(", ") : "Aucune sélection";
}

function buildFormState(profile: QuickHumanProfile | null): ProfileFormState {
  if (!profile) return defaultFormState;

  return {
    profileId: profile.profile_id,
    displayName: profile.display_name ?? "",
    birthDate: profile.birth_date ?? "",
    sex: profile.sex ?? "",
    heightCm: profile.height_cm != null ? String(profile.height_cm) : "",
    weightKg: profile.weight_kg != null ? String(profile.weight_kg) : "",
    isPregnant: Boolean(profile.is_pregnant),
    hasDiabetes: Boolean(profile.has_diabetes),
    goal: profile.goal ?? "",
    activityLevel: profile.activity_level ?? "",
    allergies: profile.allergies ?? [],
    foodConstraints: profile.food_constraints ?? [],
    culturalConstraints: profile.cultural_constraints ?? [],
    isConnectable: Boolean(profile.is_connectable),
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
    <div className="space-y-3 border border-white/10 bg-black/20 p-4">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
      </div>

      <div className="grid gap-3">
        {options.map((option) => {
          const checked = values.includes(option.value);

          return (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 border border-white/10 bg-white/[0.02] px-4 py-3"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleValue(option.value)}
                className="mt-1 h-4 w-4"
              />
              <div>
                <div className="text-sm font-medium text-white">{option.label}</div>
                {option.description ? (
                  <div className="mt-1 text-xs leading-5 text-white/45">
                    {option.description}
                  </div>
                ) : null}
              </div>
            </label>
          );
        })}
      </div>

      <div className="text-xs leading-5 text-white/50">
        {renderSelectedSummary(values, options)}
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
    <span className="inline-flex items-center border border-gold/30 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-gold/85">
      {labels[flow]}
    </span>
  );
}

export default function ProfilesPage() {
  const navigate = useNavigate();
  const { isAuthenticated, hasHousehold, authLoading, bootstrapLoading, activeMembership } = useAuth();

  const [profiles, setProfiles] = useState<QuickHumanProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileFormState>(defaultFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.profile_id === selectedProfileId) ?? null,
    [profiles, selectedProfileId],
  );

  const selectedGoalLabel = getOptionLabel(PROFILE_GOAL_OPTIONS, form.goal);
  const selectedActivityLabel = getOptionLabel(PROFILE_ACTIVITY_OPTIONS, form.activityLevel);
  const selectedSexLabel = getOptionLabel(PROFILE_SEX_OPTIONS, form.sex);
  const selectedAllergyLabels = getOptionLabels(PROFILE_ALLERGY_OPTIONS, form.allergies);
  const selectedFoodConstraintLabels = getOptionLabels(PROFILE_FOOD_CONSTRAINT_OPTIONS, form.foodConstraints);
  const selectedCulturalConstraintLabels = getOptionLabels(
    PROFILE_CULTURAL_CONSTRAINT_OPTIONS,
    form.culturalConstraints,
  );

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const next = await listQuickHumanProfiles();
      setProfiles(next);

      if (next.length > 0 && !selectedProfileId) {
        setSelectedProfileId(next[0].profile_id);
        setForm(buildFormState(next[0]));
      } else if (selectedProfileId) {
        const resolved = next.find((profile) => profile.profile_id === selectedProfileId) ?? null;
        if (resolved) {
          setForm(buildFormState(resolved));
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !bootstrapLoading && isAuthenticated && hasHousehold) {
      void loadProfiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, bootstrapLoading, isAuthenticated, hasHousehold]);

  useEffect(() => {
    if (selectedProfile) {
      setForm(buildFormState(selectedProfile));
    }
  }, [selectedProfile]);

  const setField = <K extends keyof ProfileFormState>(field: K, value: ProfileFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const startCreate = () => {
    setSelectedProfileId(null);
    setForm(defaultFormState);
    setMessage(null);
    setError(null);
  };

  const startEdit = (profile: QuickHumanProfile) => {
    setSelectedProfileId(profile.profile_id);
    setForm(buildFormState(profile));
    setMessage(null);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const saved = await upsertQuickHumanProfile({
        p_profile_id: form.profileId,
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
        p_cultural_constraints: toNullableArray(form.culturalConstraints),
        p_is_connectable: form.isConnectable,
      });

      setMessage(
        form.profileId
          ? `Profil mis à jour : ${saved.display_name}`
          : `Profil créé : ${saved.display_name}`,
      );

      await loadProfiles();
      setSelectedProfileId(saved.profile_id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || bootstrapLoading || loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
          <div className="border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
            <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-gold/75">
              <ShieldCheck className="h-4 w-4" />
              DOMYLI
            </div>
            <h1 className="mt-6 text-4xl font-light tracking-[0.06em] text-white">
              Chargement des profils humains…
            </h1>
          </div>
        </section>
      </main>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <main className="min-h-screen bg-black text-white">
        <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
          <div className="border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
            <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-gold/75">
              <ShieldCheck className="h-4 w-4" />
              DOMYLI
            </div>
            <h1 className="mt-6 text-4xl font-light tracking-[0.06em] text-white">
              Contexte foyer requis
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60">
              Active d’abord un foyer pour gérer les profils humains du système.
            </p>
            <button
              onClick={() => navigate(ROUTES.ACTIVATE_HOUSEHOLD)}
              className="mt-8 inline-flex items-center gap-3 border border-gold/40 px-5 py-4 text-sm uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold hover:text-black"
            >
              <ArrowLeft className="h-4 w-4" />
              Activer mon foyer
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <div className="mb-10 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-white/55 transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour dashboard
          </button>

          <div className="inline-flex items-center gap-3 border border-gold/20 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-gold/80">
            <Users className="h-4 w-4" />
            Profils humains du foyer
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-gold/75">
                  Foyer actif
                </div>
                <h1 className="mt-4 text-3xl font-light tracking-[0.05em] text-white">
                  {activeMembership?.household_name ?? "Foyer"}
                </h1>
              </div>

              <button
                type="button"
                onClick={startCreate}
                className="inline-flex items-center gap-2 border border-gold/40 px-4 py-3 text-xs uppercase tracking-[0.22em] text-gold transition-colors hover:bg-gold hover:text-black"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
            </div>

            <p className="mt-5 text-sm leading-7 text-white/60">
              Cette page permet de créer ou modifier rapidement les profils
              humains du foyer sans casser la continuité visuelle existante.
            </p>

            <div className="mt-8 space-y-3">
              {profiles.length === 0 ? (
                <div className="border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/55">
                  Aucun profil humain actif pour ce foyer.
                </div>
              ) : (
                profiles.map((profile) => (
                  <button
                    key={profile.profile_id}
                    type="button"
                    onClick={() => startEdit(profile)}
                    className="flex w-full items-center justify-between border border-white/10 bg-black/20 px-4 py-4 text-left transition-colors hover:border-gold/40 hover:bg-white/[0.04]"
                  >
                    <div>
                      <div className="text-base font-medium text-white">{profile.display_name}</div>
                      <div className="mt-2 text-xs uppercase tracking-[0.22em] text-white/45">
                        {profile.is_connectable ? "Profil connectable" : "Profil dépendant"}
                      </div>
                    </div>
                    <Pencil className="h-4 w-4 text-gold/80" />
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
            <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-gold/75">
              <UserRoundCog className="h-4 w-4" />
              {form.profileId ? "Modification rapide" : "Création rapide"}
            </div>

            <h2 className="mt-5 text-3xl font-light tracking-[0.05em] text-white">
              {form.profileId ? "Modifier un profil humain" : "Ajouter un profil humain"}
            </h2>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/60">
              DOMYLI utilise ces profils pour personnaliser les repas, les tâches et les
              arbitrages du foyer. Cette version garde l’expérience sobre, structurée et
              directement exploitable.
            </p>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/55">
                    Nom affiché
                  </label>
                  <input
                    value={form.displayName}
                    onChange={(e) => setField("displayName", e.target.value)}
                    required
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/55">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => setField("birthDate", e.target.value)}
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/55">
                    Sexe
                  </label>
                  <select
                    value={form.sex}
                    onChange={(e) => setField("sex", e.target.value)}
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
                  <label className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/55">
                    Profil connectable
                  </label>
                  <label className="flex items-center gap-3 border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={form.isConnectable}
                      onChange={(e) => setField("isConnectable", e.target.checked)}
                      className="h-4 w-4"
                    />
                    Ce profil peut ouvrir une session personnelle
                  </label>
                </div>

                <div>
                  <label className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/55">
                    Taille (cm)
                  </label>
                  <input
                    value={form.heightCm}
                    onChange={(e) => setField("heightCm", e.target.value)}
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/55">
                    Poids (kg)
                  </label>
                  <input
                    value={form.weightKg}
                    onChange={(e) => setField("weightKg", e.target.value)}
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/55">
                    Objectif
                  </label>
                  <select
                    value={form.goal}
                    onChange={(e) => setField("goal", e.target.value)}
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
                  <label className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/55">
                    Activité
                  </label>
                  <select
                    value={form.activityLevel}
                    onChange={(e) => setField("activityLevel", e.target.value)}
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
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-3 border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={form.isPregnant}
                    onChange={(e) => setField("isPregnant", e.target.checked)}
                    className="h-4 w-4"
                  />
                  Grossesse
                </label>

                <label className="flex items-center gap-3 border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={form.hasDiabetes}
                    onChange={(e) => setField("hasDiabetes", e.target.checked)}
                    className="h-4 w-4"
                  />
                  Diabète
                </label>
              </div>

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

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={saving || !form.displayName.trim()}
                  className="inline-flex items-center gap-3 border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.24em] text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Enregistrement..." : form.profileId ? "Mettre à jour" : "Créer le profil"}
                </button>

                <button
                  type="button"
                  onClick={startCreate}
                  className="inline-flex items-center gap-3 border border-white/15 px-5 py-4 text-sm uppercase tracking-[0.24em] text-white/70 transition-colors hover:border-gold/40 hover:text-gold"
                >
                  <Plus className="h-4 w-4" />
                  Nouveau profil
                </button>
              </div>

              {(message || error) && (
                <div
                  className={`border px-4 py-4 text-sm ${
                    error
                      ? "border-red-500/30 bg-red-500/10 text-red-200"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  }`}
                >
                  {message ?? error}
                </div>
              )}
            </form>

            <div className="mt-10 grid gap-6 border-t border-white/10 pt-8 md:grid-cols-2">
              <div className="border border-white/10 bg-black/20 p-5">
                <div className="text-[11px] uppercase tracking-[0.28em] text-gold/75">
                  Synthèse contrôlée
                </div>
                <div className="mt-4 space-y-2 text-sm leading-6 text-white/65">
                  <div>Sexe : {selectedSexLabel ?? "À sélectionner"}</div>
                  <div>Objectif : {selectedGoalLabel ?? "À sélectionner"}</div>
                  <div>Activité : {selectedActivityLabel ?? "À sélectionner"}</div>
                  <div>
                    Allergies :{" "}
                    {selectedAllergyLabels.length > 0
                      ? selectedAllergyLabels.join(", ")
                      : "Aucune sélection"}
                  </div>
                  <div>
                    Contraintes alimentaires :{" "}
                    {selectedFoodConstraintLabels.length > 0
                      ? selectedFoodConstraintLabels.join(", ")
                      : "Aucune sélection"}
                  </div>
                  <div>
                    Contraintes culturelles :{" "}
                    {selectedCulturalConstraintLabels.length > 0
                      ? selectedCulturalConstraintLabels.join(", ")
                      : "Aucune sélection"}
                  </div>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-5">
                <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-gold/75">
                  <HeartPulse className="h-4 w-4" />
                  Domaines alimentés
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {PROFILE_IMPACT_FLOWS.map((flow) => (
                    <FlowBadge key={flow} flow={flow} />
                  ))}
                </div>

                <p className="mt-5 text-sm leading-7 text-white/55">
                  Chaque mise à jour de profil renforce directement la qualité des repas,
                  des tâches, des règles et du shopping sans casser l’expérience visuelle.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}