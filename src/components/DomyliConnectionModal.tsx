import { useMemo, useState } from "react";
import { Check, LoaderCircle, LogOut, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/contexts/AuthContext";
import { ROUTES } from "@/src/constants/routes";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

function getErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "message" in err) {
    const value = (err as { message?: unknown }).message;
    if (typeof value === "string") return value;
  }

  if (err instanceof Error) return err.message;

  return "Une erreur est survenue.";
}

export default function DomyliConnectionModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<
    "login" | "signup" | "household" | "logout" | null
  >(null);

  const {
    authLoading,
    bootstrapLoading,
    sessionEmail,
    bootstrap,
    activeMembership,
    error,
    isAuthenticated,
    hasHousehold,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    createFirstHousehold,
  } = useAuth();

  const title = useMemo(() => {
    if (authLoading) return "Connexion DOMYLI";
    if (!isAuthenticated) {
      return mode === "login"
        ? "Connexion DOMYLI"
        : "Créer votre accès DOMYLI";
    }
    if (!hasHousehold) return "Créer votre foyer";
    return "DOMYLI connecté";
  }, [authLoading, isAuthenticated, hasHousehold, mode]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalMessage(null);
    setBusy("login");

    try {
      await signInWithPassword(email, password);
      setPassword("");
    } catch (err) {
      setLocalMessage(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalMessage(null);
    setBusy("signup");

    try {
      await signUpWithPassword(email, password);
      setLocalMessage("Compte créé. Vous pouvez maintenant vous connecter.");
      setMode("login");
      setPassword("");
    } catch (err) {
      setLocalMessage(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleHouseholdCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalMessage(null);
    setBusy("household");

    try {
      const created = await createFirstHousehold(householdName);
      setLocalMessage(`Foyer créé : ${created.household_name}`);
      setHouseholdName("");

      window.setTimeout(() => {
        setLocalMessage(null);
        onClose();
        navigate(ROUTES.PROFILES);
      }, 800);
    } catch (err) {
      setLocalMessage(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleLogout = async () => {
    setLocalMessage(null);
    setBusy("logout");

    try {
      await signOut();
      setEmail("");
      setPassword("");
      setHouseholdName("");
      onClose();
      navigate(ROUTES.HOME);
    } catch (err) {
      setLocalMessage(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 px-4">
      <div className="relative w-full max-w-2xl border border-gold/15 bg-obsidian p-8 text-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center border border-white/10 text-white/70 hover:border-gold/40 hover:text-gold"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        <div className="mb-3 text-xs uppercase tracking-[0.35em] text-gold/70">
          DOMYLI
        </div>

        <h2 className="text-3xl font-semibold text-white">{title}</h2>

        <p className="mt-3 text-sm leading-7 text-white/70">
          Connexion réelle à la base DOMYLI via Supabase, avec un contexte auth
          centralisé.
        </p>

        {authLoading && (
          <div className="mt-6 flex items-center gap-3 border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/75">
            <LoaderCircle size={18} className="animate-spin text-gold" />
            Chargement de la session DOMYLI...
          </div>
        )}

        {!authLoading && isAuthenticated && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              disabled={busy === "logout"}
              className="inline-flex items-center gap-2 border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.25em] text-white/75 hover:border-gold/40 hover:text-gold disabled:opacity-50"
            >
              <LogOut size={16} />
              {busy === "logout" ? "Déconnexion..." : "Se déconnecter"}
            </button>
          </div>
        )}

        {bootstrapLoading && isAuthenticated && (
          <div className="mt-6 flex items-center gap-3 border border-gold/20 bg-gold/5 px-4 py-4 text-sm text-gold/90">
            <LoaderCircle size={18} className="animate-spin" />
            Synchronisation du contexte DOMYLI...
          </div>
        )}

        {!authLoading && !isAuthenticated && (
          <>
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 py-3 text-xs uppercase tracking-[0.25em] border ${
                  mode === "login"
                    ? "border-gold bg-gold text-obsidian"
                    : "border-white/10 text-white/70"
                }`}
              >
                Connexion
              </button>

              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 py-3 text-xs uppercase tracking-[0.25em] border ${
                  mode === "signup"
                    ? "border-gold bg-gold text-obsidian"
                    : "border-white/10 text-white/70"
                }`}
              >
                Inscription
              </button>
            </div>

            <form
              onSubmit={mode === "login" ? handleLogin : handleSignup}
              className="mt-8 space-y-5"
            >
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="vous@exemple.com"
                  className="w-full border border-white/10 bg-white/5 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Votre mot de passe"
                  className="w-full border border-white/10 bg-white/5 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <button
                type="submit"
                disabled={busy === "login" || busy === "signup"}
                className="w-full border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.25em] text-obsidian disabled:opacity-50"
              >
                {mode === "login"
                  ? busy === "login"
                    ? "Connexion..."
                    : "Se connecter"
                  : busy === "signup"
                  ? "Création du compte..."
                  : "Créer mon compte"}
              </button>
            </form>
          </>
        )}

        {!authLoading && isAuthenticated && !hasHousehold && (
          <form onSubmit={handleHouseholdCreate} className="mt-8 space-y-5">
            <div className="rounded-2xl border border-gold/15 bg-gold/5 px-5 py-4 text-sm text-white/80">
              Connecté en tant que <span className="text-gold">{sessionEmail}</span>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                Nom du foyer
              </label>
              <input
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                required
                placeholder="Maison Krairi"
                className="w-full border border-white/10 bg-white/5 px-4 py-4 text-sm outline-none focus:border-gold/50"
              />
            </div>

            <button
              type="submit"
              disabled={busy === "household"}
              className="w-full border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.25em] text-obsidian disabled:opacity-50"
            >
              {busy === "household" ? "Création..." : "Créer mon foyer"}
            </button>
          </form>
        )}

        {!authLoading && isAuthenticated && hasHousehold && (
          <div className="mt-8 space-y-5">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
              <Check size={18} />
              Connexion active
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-white/75">
              {activeMembership?.household_name ? (
                <>
                  <strong className="text-white">{sessionEmail}</strong> est relié
                  au foyer{" "}
                  <strong className="text-gold">
                    {activeMembership.household_name}
                  </strong>
                  .
                </>
              ) : (
                <>
                  <strong className="text-white">{sessionEmail}</strong> est
                  connecté à DOMYLI, mais aucun foyer exploitable n’a encore été
                  résolu.
                </>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="border border-white/10 p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-gold/70">
                  Foyer actif
                </div>
                <div className="mt-2 text-sm text-white">
                  {activeMembership?.household_name ?? "—"}
                </div>
              </div>

              <div className="border border-white/10 p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-gold/70">
                  Rôle
                </div>
                <div className="mt-2 text-sm text-white">
                  {activeMembership?.role ?? "—"}
                </div>
              </div>

              <div className="border border-white/10 p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-gold/70">
                  Super Admin
                </div>
                <div className="mt-2 text-sm text-white">
                  {bootstrap?.is_super_admin ? "Oui" : "Non"}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(ROUTES.PROFILES);
                }}
                className="border border-gold/40 px-5 py-4 text-sm uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
              >
                Ouvrir Profiles
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(ROUTES.DASHBOARD);
                }}
                className="border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.25em] text-white hover:border-gold/40 hover:text-gold transition-colors"
              >
                Ouvrir Dashboard
              </button>
            </div>
          </div>
        )}

        {(localMessage || error) && (
          <div className="mt-6 border border-gold/20 bg-gold/5 px-4 py-4 text-sm text-gold/90">
            {localMessage ?? error?.message}
          </div>
        )}
      </div>
    </div>
  );
}