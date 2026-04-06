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
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/providers/AuthProvider";
import { ROUTES } from "@/src/constants/routes";
import { getErrorMessage } from "@/src/pages/utils/getErrorMessage";
import { readMyProfileStatus } from "@/src/services/profiles/myProfileService";
import {
  enterHouseholdByAccessCode,
  openHouseholdProfileSession,
  type HouseholdAccessEnterResponse,
  type HouseholdAccessProfile,
} from "@/src/services/householdAccessService";

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
  const [accessCode, setAccessCode] = useState("");
  const [busy, setBusy] = useState<"enter" | "open" | "create" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [accessPayload, setAccessPayload] =
    useState<HouseholdAccessEnterResponse | null>(null);

  const memberships = useMemo(
    () => bootstrap?.memberships ?? [],
    [bootstrap],
  );

  const hasResolvedProfileSession = useMemo(() => {
    const sessionKey = localStorage.getItem("domyli.householdSessionKey");
    const profileId = localStorage.getItem("domyli.profileId");

    return Boolean(sessionKey && profileId);
  }, []);

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
      hasHousehold &&
      hasResolvedProfileSession
    ) {
      void resolveNextRoute();
    }
  }, [
    authLoading,
    bootstrapLoading,
    isAuthenticated,
    hasHousehold,
    hasResolvedProfileSession,
    resolveNextRoute,
  ]);

  if (authLoading || bootstrapLoading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <section className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-3 border border-gold/30 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-gold/80">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Activation DOMYLI
            </div>
            <h1 className="mt-8 text-4xl font-light tracking-[0.08em] text-white sm:text-5xl">
              Résolution du contexte foyer…
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
              Synchronisation de la session, des memberships et du foyer actif.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-black text-white">
        <section className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-3 border border-gold/30 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-gold/80">
              <ShieldCheck className="h-4 w-4" />
              DOMYLI
            </div>
            <h1 className="mt-8 text-4xl font-light tracking-[0.08em] text-white sm:text-5xl">
              Session requise
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
              Connecte-toi d’abord à DOMYLI pour entrer dans ton foyer.
            </p>
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="mt-8 inline-flex items-center gap-3 border border-gold/40 px-5 py-4 text-sm uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold hover:text-black"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à l’accueil
            </button>
          </div>
        </section>
      </main>
    );
  }

  const handleEnterHousehold = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setBusy("enter");

    try {
      const payload = await enterHouseholdByAccessCode(accessCode);
      setAccessPayload(payload);
      setAccessCode(payload.access_code);
    } catch (error) {
      setAccessPayload(null);
      setMessage(getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const handleOpenProfile = async (profile: HouseholdAccessProfile) => {
    if (!accessPayload) return;

    setMessage(null);
    setBusy("open");

    try {
      const session = await openHouseholdProfileSession({
        accessCode: accessPayload.access_code,
        profileId: profile.profile_id,
        deviceLabel: "web",
      });

      await setActiveHousehold(session.household_id);
      await resolveNextRoute();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const handleCreate = async (event: FormEvent) => {
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
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <div className="mb-10 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-white/55 transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>

          <div className="inline-flex items-center gap-3 border border-gold/20 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-gold/80">
            <House className="h-4 w-4" />
            Activation du foyer
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.3em] text-gold/75">
                Entrée foyer canonique
              </p>
              <h1 className="mt-5 text-4xl font-light tracking-[0.06em] text-white sm:text-5xl">
                Entrer dans le foyer, puis choisir la bonne personne.
              </h1>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
                Cette étape stabilise l’entrée dans DOMYLI. L’utilisateur
                authentifié saisit l’identifiant du foyer, DOMYLI valide le
                contexte, puis ouvre la session du bon profil humain sans casser
                la continuité visuelle existante.
              </p>
            </div>

            <div className="mt-10 grid gap-6 border-t border-white/10 pt-8 md:grid-cols-3">
              <div className="border border-white/10 bg-black/20 p-5">
                <div className="text-[11px] uppercase tracking-[0.28em] text-gold/75">
                  01
                </div>
                <div className="mt-3 text-lg font-medium text-white">
                  Foyer
                </div>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  Saisie d’un identifiant unique, stable et partageable.
                </p>
              </div>

              <div className="border border-white/10 bg-black/20 p-5">
                <div className="text-[11px] uppercase tracking-[0.28em] text-gold/75">
                  02
                </div>
                <div className="mt-3 text-lg font-medium text-white">
                  Validation
                </div>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  DOMYLI vérifie l’accès, les sessions ouvertes et le contexte.
                </p>
              </div>

              <div className="border border-white/10 bg-black/20 p-5">
                <div className="text-[11px] uppercase tracking-[0.28em] text-gold/75">
                  03
                </div>
                <div className="mt-3 text-lg font-medium text-white">
                  Profil humain
                </div>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  La bonne personne entre dans sa vue, avec continuité immédiate.
                </p>
              </div>
            </div>

            <div className="mt-10 border border-white/10 bg-black/20 p-6">
              <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-gold/75">
                <Users className="h-4 w-4" />
                Accès au foyer
              </div>

              <form className="mt-6 space-y-5" onSubmit={handleEnterHousehold}>
                <div>
                  <label className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/55">
                    Identifiant unique de foyer
                  </label>
                  <input
                    value={accessCode}
                    onChange={(event) =>
                      setAccessCode(event.target.value.toUpperCase())
                    }
                    placeholder="Ex. 53F0-114B"
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none transition-colors focus:border-gold/50"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy !== null}
                  className="inline-flex items-center justify-center gap-3 border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.24em] text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy === "enter" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {busy === "enter" ? "Validation..." : "Valider le foyer"}
                </button>
              </form>

              {accessPayload ? (
                <div className="mt-8 border-t border-white/10 pt-6">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-gold/75">
                    Foyer reconnu
                  </div>
                  <div className="mt-3 text-2xl font-light text-white">
                    {accessPayload.household_name}
                  </div>
                  <p className="mt-2 text-sm text-white/55">
                    Code : {accessPayload.access_code} · Sessions ouvertes :{" "}
                    {accessPayload.open_session_count} /{" "}
                    {accessPayload.session_limit}
                  </p>

                  <div className="mt-6">
                    <div className="mb-4 text-xs uppercase tracking-[0.24em] text-white/55">
                      Choisir la personne
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {accessPayload.profiles.map((profile) => (
                        <button
                          key={profile.profile_id}
                          type="button"
                          onClick={() => void handleOpenProfile(profile)}
                          disabled={busy !== null}
                          className="flex items-center justify-between border border-white/10 bg-white/[0.04] px-5 py-5 text-left transition-colors hover:border-gold/40 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <div>
                            <div className="text-base font-medium text-white">
                              {profile.display_name}
                            </div>
                            <div className="mt-2 text-xs uppercase tracking-[0.22em] text-white/45">
                              {profile.is_connectable
                                ? "Profil connectable"
                                : "Profil non connectable"}
                            </div>
                          </div>

                          <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                            {busy === "open" ? "Ouverture..." : "Entrer"}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {message ? (
                <div className="mt-6 border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
                  {message}
                </div>
              ) : null}
            </div>
          </section>

          <aside className="grid gap-8">
            <section className="border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
              <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-gold/75">
                <ShieldCheck className="h-4 w-4" />
                Memberships détectés
              </div>

              <h2 className="mt-5 text-2xl font-light tracking-[0.05em] text-white">
                Contexte actuel
              </h2>

              <p className="mt-4 text-sm leading-7 text-white/60">
                DOMYLI a besoin d’un foyer actif explicite, puis d’un profil
                humain identifiable, avant toute navigation métier.
              </p>

              <div className="mt-6 space-y-3">
                {memberships.length === 0 ? (
                  <div className="border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/55">
                    Aucun membership détecté pour cette session.
                  </div>
                ) : (
                  memberships.map((membership) => (
                    <div
                      key={membership.household_id}
                      className="border border-white/10 bg-black/20 px-4 py-4"
                    >
                      <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                        Foyer
                      </div>
                      <div className="mt-2 text-base font-medium text-white">
                        {membership.household_name}
                      </div>
                      <div className="mt-2 text-sm text-white/55">
                        Rôle : {membership.role}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
              <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-gold/75">
                <Plus className="h-4 w-4" />
                Création foyer
              </div>

              <h2 className="mt-5 text-2xl font-light tracking-[0.05em] text-white">
                Créer un nouveau foyer
              </h2>

              <p className="mt-4 text-sm leading-7 text-white/60">
                Si aucun foyer n’existe encore, crée le premier ici. DOMYLI le
                définira comme foyer actif puis t’enverra vers Mon profil pour
                verrouiller l’identité métier du compte connecté.
              </p>

              <form className="mt-6 space-y-5" onSubmit={handleCreate}>
                <div>
                  <label className="mb-3 block text-xs uppercase tracking-[0.24em] text-white/55">
                    Nom du foyer
                  </label>
                  <input
                    value={householdName}
                    onChange={(event) => setHouseholdName(event.target.value)}
                    placeholder="Maison Krairi"
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none transition-colors focus:border-gold/50"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy !== null}
                  className="inline-flex items-center justify-center gap-3 border border-gold/40 px-5 py-4 text-sm uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy === "create" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <House className="h-4 w-4" />
                  )}
                  {busy === "create" ? "Création..." : "Créer mon foyer"}
                </button>
              </form>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}