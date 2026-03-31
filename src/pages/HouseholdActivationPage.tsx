import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
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
import { readMyProfileStatus } from "@/src/services/profiles/myProfileService";

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

  const memberships = useMemo(
    () => bootstrap?.memberships ?? [],
    [bootstrap],
  );

  const resolveNextRoute = useCallback(async () => {
    try {
      const status = await readMyProfileStatus();

      navigate(
        status.has_profile ? ROUTES.DASHBOARD : ROUTES.MY_PROFILE,
        { replace: true },
      );
    } catch {
      navigate(ROUTES.MY_PROFILE, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (
      !authLoading &&
      !bootstrapLoading &&
      isAuthenticated &&
      hasHousehold
    ) {
      void resolveNextRoute();
    }
  }, [
    authLoading,
    bootstrapLoading,
    isAuthenticated,
    hasHousehold,
    resolveNextRoute,
  ]);

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            Activation DOMYLI
          </p>
          <h1 className="mt-4 text-3xl font-semibold">
            Résolution du contexte foyer…
          </h1>
          <p className="mt-3 max-w-2xl text-white/70">
            Synchronisation de la session, des memberships et du foyer
            actif.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            DOMYLI
          </p>
          <h1 className="mt-4 text-3xl font-semibold">
            Session requise
          </h1>
          <p className="mt-3 text-white/70">
            Connecte-toi d’abord à DOMYLI pour activer ou créer ton
            foyer.
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
    );
  }

  const handleActivate = async (householdId: string) => {
    setMessage(null);
    setBusy("activate");

    try {
      await setActiveHousehold(householdId);
      await resolveNextRoute();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage(null);
    setBusy("create");

    try {
      await createFirstHousehold(householdName);
      setHouseholdName("");
      navigate(ROUTES.MY_PROFILE, { replace: true });
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            Activation du foyer
          </p>
          <h1 className="mt-4 text-3xl font-semibold">
            Choisir ou créer le foyer actif DOMYLI
          </h1>
          <p className="mt-3 max-w-3xl text-white/70">
            Cette étape stabilise l’entrée dans DOMYLI. Un utilisateur
            connecté doit avoir un foyer actif explicite, puis un
            profil humain lié avant d’entrer dans le cockpit.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="flex items-center gap-3">
              <House className="h-5 w-5 text-gold" />
              <p className="text-sm uppercase tracking-[0.24em] text-gold">
                Foyers disponibles
              </p>
            </div>

            <h2 className="mt-4 text-2xl font-semibold">
              Memberships détectés
            </h2>

            <p className="mt-3 text-sm leading-7 text-white/70">
              DOMYLI a besoin d’un foyer actif avant toute navigation
              métier. Une fois le foyer activé, le système contrôle
              immédiatement si ton profil humain existe.
            </p>

            <div className="mt-8 grid gap-4">
              {memberships.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/70">
                  Aucun foyer existant n’a été trouvé pour cette
                  session. Crée le premier foyer dans le bloc de
                  droite.
                </div>
              ) : (
                memberships.map((membership) => (
                  <div
                    key={membership.household_id}
                    className="rounded-[24px] border border-white/10 bg-black/20 p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-gold">
                          Foyer
                        </p>
                        <h3 className="mt-2 text-xl font-semibold">
                          {membership.household_name}
                        </h3>
                        <p className="mt-2 text-sm text-white/70">
                          Rôle : {membership.role}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleActivate(membership.household_id)
                        }
                        disabled={busy !== null}
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
                  </div>
                ))
              )}
            </div>
          </section>

          <aside className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="flex items-center gap-3">
              <Plus className="h-5 w-5 text-gold" />
              <p className="text-sm uppercase tracking-[0.24em] text-gold">
                Création foyer
              </p>
            </div>

            <h2 className="mt-4 text-2xl font-semibold">
              Créer un nouveau foyer
            </h2>

            <p className="mt-3 text-sm leading-7 text-white/70">
              Si aucun foyer n’existe encore, crée le premier ici.
              DOMYLI le définira comme foyer actif puis t’enverra vers
              <strong className="text-white"> Mon profil</strong> pour
              verrouiller l’identité métier du compte connecté.
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleCreate}>
              <label className="block">
                <span className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/60">
                  Nom du foyer
                </span>
                <input
                  value={householdName}
                  onChange={(event) =>
                    setHouseholdName(event.target.value)
                  }
                  placeholder="Maison Krairi"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none transition-colors focus:border-gold/50"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={busy !== null}
                className="inline-flex w-full items-center justify-center gap-3 border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.24em] text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "create" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                {busy === "create"
                  ? "Création..."
                  : "Créer mon foyer"}
              </button>
            </form>

            {message ? (
              <div className="mt-6 rounded-[20px] border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
                {message}
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}