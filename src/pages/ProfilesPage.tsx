import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Save, ShieldCheck, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { useProfiles } from "@/src/hooks/useProfiles";
import { ROUTES } from "@/src/constants/routes";

function parseCsv(input: string): string[] | null {
  const values = input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length > 0 ? values : null;
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
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(householdId && displayName.trim());
  }, [householdId, displayName]);

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
            La page Profiles nécessite une session authentifiée et un foyer actif
            résolu par le bootstrap DOMYLI.
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalMessage(null);

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
        p_allergies: parseCsv(allergies),
        p_food_constraints: parseCsv(foodConstraints),
        p_cultural_constraints: parseCsv(culturalConstraints),
      });

      setLocalMessage(`Profil enregistré : ${result.display_name}`);
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="inline-flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="mt-6 text-xs uppercase tracking-[0.35em] text-gold/80">
            DOMYLI
          </div>
          <h1 className="mt-3 text-4xl font-semibold">Profiles</h1>
          <p className="mt-3 max-w-3xl text-white/65">
            Structure le premier profil humain du foyer pour rendre les repas,
            contraintes, compatibilités et prochaines capacités DOMYLI réellement
            exploitables.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
            <div className="mb-6 flex items-center gap-3 text-gold/85">
              <UserRound className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.35em]">
                Premier profil humain
              </span>
            </div>

            <h2 className="text-3xl font-semibold">Créer un profil exploitable</h2>

            <p className="mt-6 max-w-3xl text-lg leading-9 text-white/65">
              Ce profil devient la base déterministe des contraintes alimentaires,
              des repas, de la charge domestique et de la gouvernance future du foyer.
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
                  <option value="">Non renseigné</option>
                  <option value="FEMALE">Femme</option>
                  <option value="MALE">Homme</option>
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
                <input
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Perte de poids, prise de masse, maintien..."
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Activité
                </label>
                <input
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  placeholder="LOW, MODERATE, HIGH..."
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Allergies (CSV)
                </label>
                <input
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="arachide, gluten, lactose"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Contraintes alimentaires (CSV)
                </label>
                <input
                  value={foodConstraints}
                  onChange={(e) => setFoodConstraints(e.target.value)}
                  placeholder="halal, sans_porc"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Contraintes culturelles (CSV)
                </label>
                <input
                  value={culturalConstraints}
                  onChange={(e) => setCulturalConstraints(e.target.value)}
                  placeholder="ramadan, habitudes_famille"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
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
                  Contexte actif
                </span>
              </div>

              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Foyer actif
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
                    {lastSavedProfile?.display_name ?? "—"}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="text-xs uppercase tracking-[0.35em] text-gold/80">
                Étape P0
              </div>
              <h2 className="mt-4 text-3xl font-semibold">
                Première structuration humaine
              </h2>
              <p className="mt-5 text-white/65">
                Une fois ce profil enregistré, tu peux enchaîner proprement vers
                Inventory sans casser la cohérence du parcours DOMYLI.
              </p>

              <button
                type="button"
                onClick={() => navigate(ROUTES.INVENTORY)}
                className="mt-8 inline-flex w-full items-center justify-center gap-3 border border-gold/40 px-5 py-4 text-sm uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold hover:text-black"
              >
                Continuer vers Inventory
                <ChevronRight className="h-4 w-4" />
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}