import { useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { ROUTES } from "@/src/constants/routes";
import { callRpc } from "@/src/services/rpc";
import { getErrorMessage } from "./utils/getErrorMessage";

function parseCsv(input: string): string[] | null {
  const values = input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length > 0 ? values : null;
}

export default function ProfilesPage() {
  const navigate = useNavigate();
  const { bootstrap, activeMembership } = useAuth();

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
  const [allergies, setAllergies] = useState("");
  const [foodConstraints, setFoodConstraints] = useState("");
  const [culturalConstraints, setCulturalConstraints] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(householdId && displayName.trim());
  }, [householdId, displayName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const result = (await callRpc<{
        profile_id?: string | null;
        display_name?: string | null;
      } | {
        profile_id?: string | null;
        display_name?: string | null;
      }[]>(
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
          p_allergies: parseCsv(allergies),
          p_food_constraints: parseCsv(foodConstraints),
          p_cultural_constraints: parseCsv(culturalConstraints),
        },
        { unwrap: true }
      )) as { profile_id?: string | null; display_name?: string | null };

      setMessage(`Profil enregistré : ${result?.display_name ?? displayName.trim()}`);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="mt-1 h-10 w-10 border border-white/10 flex items-center justify-center hover:border-amber-300/40 transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-amber-300">
              DOMYLI
            </div>
            <h1 className="mt-2 text-4xl font-semibold">Profiles</h1>
            <p className="mt-3 text-white/70 leading-7">
              Premier profil réel du foyer actif.
            </p>
            <p className="mt-2 text-sm text-white/50">
              Foyer : {activeMembership?.household_name ?? "—"}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 border border-white/10 bg-white/[0.03] p-6 grid gap-5 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-amber-300/80">
              Nom affiché
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-amber-300/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-amber-300/80">
              Date de naissance
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-amber-300/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-amber-300/80">
              Sexe
            </label>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-amber-300/50"
            >
              <option value="">Non renseigné</option>
              <option value="FEMALE">Femme</option>
              <option value="MALE">Homme</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-amber-300/80">
              Taille (cm)
            </label>
            <input
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-amber-300/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-amber-300/80">
              Poids (kg)
            </label>
            <input
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-amber-300/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-amber-300/80">
              Objectif
            </label>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-amber-300/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-amber-300/80">
              Activité
            </label>
            <input
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value)}
              className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-amber-300/50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-amber-300/80">
              Allergies (CSV)
            </label>
            <input
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-amber-300/50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-amber-300/80">
              Contraintes alimentaires (CSV)
            </label>
            <input
              value={foodConstraints}
              onChange={(e) => setFoodConstraints(e.target.value)}
              className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-amber-300/50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-amber-300/80">
              Contraintes culturelles (CSV)
            </label>
            <input
              value={culturalConstraints}
              onChange={(e) => setCulturalConstraints(e.target.value)}
              className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-amber-300/50"
            />
          </div>

          <label className="flex items-center gap-3 border border-white/10 px-4 py-4 text-sm text-white/75">
            <input
              type="checkbox"
              checked={isPregnant}
              onChange={(e) => setIsPregnant(e.target.checked)}
            />
            Grossesse
          </label>

          <label className="flex items-center gap-3 border border-white/10 px-4 py-4 text-sm text-white/75">
            <input
              type="checkbox"
              checked={hasDiabetes}
              onChange={(e) => setHasDiabetes(e.target.checked)}
            />
            Diabète
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={!canSubmit || saving}
              className="inline-flex w-full items-center justify-center gap-3 border border-amber-300 bg-amber-300 px-5 py-4 text-sm uppercase tracking-[0.25em] text-black disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Enregistrement..." : "Enregistrer le profil"}
            </button>
          </div>
        </form>

        {message && (
          <div className="mt-6 border border-amber-300/20 bg-amber-300/5 px-4 py-4 text-sm text-amber-200">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}