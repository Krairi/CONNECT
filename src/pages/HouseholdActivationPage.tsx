import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  House,
  LoaderCircle,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/providers/AuthProvider";
import { ROUTES } from "@/src/constants/routes";
import { getErrorMessage } from "@/src/pages/utils/getErrorMessage";

export default function HouseholdActivationPage() {
  const navigate = useNavigate();
  const {
    authLoading,
    bootstrapLoading,
    isAuthenticated,
    hasHousehold,
    bootstrap,
    setActiveHousehold,
    createFirstHousehold,
  } = useAuth();

  const [householdName, setHouseholdName] = useState("");
  const [busy, setBusy] = useState<"activate" | "create" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const memberships = useMemo(() => bootstrap?.memberships ?? [], [bootstrap]);

  useEffect(() => {
    if (!authLoading && !bootstrapLoading && isAuthenticated && hasHousehold) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [authLoading, bootstrapLoading, hasHousehold, isAuthenticated, navigate]);

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-[#0b1020] px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/70">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Activation DOMYLI
            </div>
            <h1 className="mt-6 text-3xl font-semibold">
              Résolution du contexte foyer…
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/70">
              Synchronisation de la session, des memberships et du foyer actif.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b1020] px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 px-4 py-2 text-xs uppercase tracking-[0.24em] text-gold">
              DOMYLI
            </div>
            <h1 className="mt-6 text-3xl font-semibold">Session requise</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/70">
              Connecte-toi d’abord à DOMYLI pour activer ou créer ton foyer.
            </p>
            <button
              type="button"
              onClick={() => navigate(ROUTES.HOME)}
              className="mt-8 inline-flex items-center gap-3 border border-gold/40 px-5 py-4 text-sm uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold hover:text-black"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à l’accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleActivate = async (householdId: string) => {
    setMessage(null);
    setBusy("activate");

    try {
      await setActiveHousehold(householdId);
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setBusy("create");

    try {
      await createFirstHousehold(householdName);
      setHouseholdName("");
      navigate(ROUTES.PROFILES, { replace: true });
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1020] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 px-4 py-2 text-xs uppercase tracking-[0.24em] text-gold">
              <House className="h-4 w-4" />
              Activation du foyer
            </div>

            <h1 className="mt-6 text-3xl font-semibold">
              Choisir ou créer le foyer actif DOMYLI
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
              Cette étape stabilise l’entrée dans DOMYLI. Un utilisateur connecté
              doit avoir un foyer actif explicite avant d’entrer dans le cockpit,
              Profiles ou les domaines métier.
            </p>

            <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                    Foyers disponibles
                  </p>
                  <h2 className="mt-2 text-xl font-medium">
                    Memberships détectés
                  </h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.22em] text-white/60">
                  <ShieldCheck className="h-4 w-4" />
                  Bootstrap DOMYLI
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {memberships.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/60">
                    Aucun foyer existant n’a été trouvé pour cette session.
                    Crée le premier foyer ci-contre.
                  </div>
                ) : (
                  memberships.map((membership) => (
                    <div
                      key={membership.household_id}
                      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                          Foyer
                        </p>
                        <h3 className="mt-2 text-lg font-medium">
                          {membership.household_name}
                        </h3>
                        <p className="mt-2 text-sm text-white/60">
                          Rôle : {membership.role}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => handleActivate(membership.household_id)}
                        className="inline-flex items-center justify-center gap-3 border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.24em] text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busy === "activate" ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Activer ce foyer
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <aside className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/70">
              <Plus className="h-4 w-4" />
              Création foyer
            </div>

            <h2 className="mt-6 text-2xl font-semibold">
              Créer un nouveau foyer
            </h2>

            <p className="mt-3 text-sm leading-7 text-white/70">
              Si aucun foyer n’existe encore, crée le premier ici. DOMYLI le
              définira automatiquement comme foyer actif, puis t’enverra vers
              Profiles pour poursuivre l’activation.
            </p>

            <form onSubmit={handleCreate} className="mt-8 space-y-4">
              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Nom du foyer</span>
                <input
                  value={householdName}
                  onChange={(event) => setHouseholdName(event.target.value)}
                  placeholder="Maison Krairi"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none transition-colors focus:border-gold/50"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={busy !== null}
                className="inline-flex w-full items-center justify-center gap-3 border border-gold/40 px-5 py-4 text-sm uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "create" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {busy === "create" ? "Création..." : "Créer mon foyer"}
              </button>
            </form>

            {message ? (
              <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                {message}
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}