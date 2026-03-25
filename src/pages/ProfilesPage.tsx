import { useMemo, useState } from "react";
import { ArrowLeft, Save, ChevronRight } from "lucide-react";
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

type ProfileUpsertOutput = {
  profile_id?: string | null;
  display_name?: string | null;
};

export default function ProfilesPage() {
  const navigate = useNavigate();
  const { bootstrap, activeMembership, isAuthenticated, hasHousehold } =
    useAuth();

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

  if (!isAuthenticated || !hasHousehold || !householdId) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold">
            DOMYLI
          </div>

          <h1 className="mt-4 text-4xl font-semibold">
            Foyer requis
          </h1>

          <p className="mt-5 max-w-2xl text-alabaster/70 leading-8">
            La page Profiles nécessite un foyer actif résolu par le bootstrap
            DOMYLI.
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

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const result = await callRpc<ProfileUpsertOutput | null>(
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
      );

      setMessage(
        `Profil enregistré : ${result?.display_name ?? displayName.trim()}`
      );
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-alabaster px-6 py-10">
      <div className="mx-auto max-w-6xl">
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
            <div className="text-xs uppercase tracking-[0.35em] text-gold">
              DOMYLI
            </div>
            <h1 className="mt-2 text-4xl font-semibold">Profiles</h1>
            <p className="mt-3 max-w-2xl text-alabaster/70 leading-8">
              Structure le premier profil humain du foyer pour rendre le système
              exploitable sur les prochaines capacités DOMYLI.
            </p>
            <p className="mt-2 text-sm text-alabaster/50">
              Foyer actif : {activeMembership?.household_name ?? "—"}
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <form
            onSubmit={handleSubmit}
            className="glass metallic-border rounded-[2rem] p-6 grid gap-5 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
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
              <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
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
              <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                Sexe
              </label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
              >
                <option value="">Non renseigné</option>
                <option value="FEMALE">Femme</option>
                <option value="MALE">Homme</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                Taille (cm)
              </label>
              <input
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                Poids (kg)
              </label>
              <input
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                Objectif
              </label>
              <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                Activité
              </label>
              <input
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                Allergies (CSV)
              </label>
              <input
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                Contraintes alimentaires (CSV)
              </label>
              <input
                value={foodConstraints}
                onChange={(e) => setFoodConstraints(e.target.value)}
                className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                Contraintes culturelles (CSV)
              </label>
              <input
                value={culturalConstraints}
                onChange={(e) => setCulturalConstraints(e.target.value)}
                className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
              />
            </div>

            <label className="flex items-center gap-3 border border-white/10 px-4 py-4 text-sm text-alabaster/75">
              <input
                type="checkbox"
                checked={isPregnant}
                onChange={(e) => setIsPregnant(e.target.checked)}
              />
              Grossesse
            </label>

            <label className="flex items-center gap-3 border border-white/10 px-4 py-4 text-sm text-alabaster/75">
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
                className="inline-flex w-full items-center justify-center gap-3 border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.24em] text-obsidian disabled:opacity-50 gold-glow"
              >
                <Save size={16} />
                {saving ? "Enregistrement..." : "Enregistrer le profil"}
              </button>
            </div>
          </form>

          <aside className="glass metallic-border rounded-[2rem] p-7">
            <div className="text-xs uppercase tracking-[0.3em] text-gold/80">
              Étape P0
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-alabaster">
              Première structuration humaine
            </h2>

            <p className="mt-4 text-sm leading-8 text-alabaster/65">
              Ce premier profil sert de base à la suite du système : repas,
              compatibilités, contraintes, organisation domestique.
            </p>

            <div className="mt-8 space-y-4">
              {[
                ["Foyer", activeMembership?.household_name ?? "—"],
                ["Role", activeMembership?.role ?? "—"],
                ["Household ID", householdId],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4"
                >
                  <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                    {label}
                  </div>
                  <div className="mt-2 text-sm text-alabaster">{value}</div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="mt-8 inline-flex w-full items-center justify-center gap-3 border border-gold/40 px-5 py-4 text-sm uppercase tracking-[0.24em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
            >
              Retour au dashboard
              <ChevronRight size={16} />
            </button>

            {message && (
              <div className="mt-6 border border-gold/20 bg-gold/5 px-4 py-4 text-sm text-gold">
                {message}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}