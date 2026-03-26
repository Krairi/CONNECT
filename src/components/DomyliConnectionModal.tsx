import React, { useMemo, useState } from "react";
import { Check, LoaderCircle, X, LogOut } from "lucide-react";

import { useDomyliConnection } from "../hooks/useDomyliConnection";
import { navigateTo } from "../lib/navigation";
import { ROUTES } from "@/src/constants/routes";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

function getErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "message" in err) {
    const value = (err as { message?: unknown }).message;
    if (typeof value === "string") {
      return value;
    }
  }

  if (err instanceof Error) {
    return err.message;
  }

  return "Une erreur est survenue.";
}

export default function DomyliConnectionModal({
  isOpen,
  onClose,
}: Props) {
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
  } = useDomyliConnection();

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
      setLocalMessage("Compte créé.\nVous pouvez maintenant vous connecter.");
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
      onClose();
      navigateTo(ROUTES.PROFILES, true);
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
      navigateTo(ROUTES.HOME, true);
    } catch (err) {
      setLocalMessage(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl rounded-[2.5rem] border border-gold/20 bg-black px-8 py-10 text-white shadow-[0_0_80px_rgba(212,175,55,0.08)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-white/70 transition-colors hover:border-gold/40 hover:text-gold"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-xs uppercase tracking-[0.35em] text-gold/80">
          DOMYLI
        </div>

        <h3 className="mt-3 text-5xl font-semibold">{title}</h3>

        <p className="mt-6 max-w-3xl text-2xl text-white/60">
          Connexion réelle à la base DOMYLI via Supabase, sans casser la landing.
        </p>

        {authLoading && (
          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-6 py-5 text-lg text-white/70">
            Chargement de la session DOMYLI...
          </div>
        )}

        {!authLoading && isAuthenticated && (
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={handleLogout}
              disabled={busy === "logout"}
              className="inline-flex items-center gap-3 border border-white/10 px-8 py-4 text-sm uppercase tracking-[0.25em] text-white transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
            >
              {busy === "logout" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              {busy === "logout" ? "Déconnexion..." : "Se déconnecter"}
            </button>
          </div>
        )}

        {bootstrapLoading && isAuthenticated && (
          <div className="mt-6 rounded-[1.5rem] border border-gold/15 bg-gold/5 px-6 py-5 text-lg text-gold">
            Synchronisation du contexte DOMYLI...
          </div>
        )}

        {!authLoading && !isAuthenticated && (
          <>
            <div className="mt-8 flex overflow-hidden rounded-[1.2rem] border border-white/10">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 py-3 text-xs uppercase tracking-[0.25em] ${
                  mode === "login"
                    ? "border-gold bg-gold text-black"
                    : "border-white/10 text-white/70"
                }`}
              >
                Connexion
              </button>

              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 py-3 text-xs uppercase tracking-[0.25em] ${
                  mode === "signup"
                    ? "border-gold bg-gold text-black"
                    : "border-white/10 text-white/70"
                }`}
              >
                Inscription
              </button>
            </div>

            <form
              onSubmit={mode === "login" ? handleLogin : handleSignup}
              className="mt-8 space-y-6"
            >
              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
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
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
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
                className="inline-flex w-full items-center justify-center gap-3 bg-gold px-6 py-5 text-sm uppercase tracking-[0.24em] text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy === "login" || busy === "signup" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
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
          <form onSubmit={handleHouseholdCreate} className="mt-8 space-y-6">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-6 py-5 text-lg text-white/80">
              Connecté en tant que {sessionEmail}
            </div>

            <div>
              <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
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
              className="inline-flex w-full items-center justify-center gap-3 bg-gold px-6 py-5 text-sm uppercase tracking-[0.24em] text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy === "household" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {busy === "household" ? "Création..." : "Créer mon foyer"}
            </button>
          </form>
        )}

        {!authLoading && isAuthenticated && hasHousehold && (
          <div className="mt-8 space-y-6">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-6 py-6">
              <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                Connexion active
              </div>

              <div className="mt-4 text-lg text-white/80">
                {activeMembership?.household_name ? (
                  <>
                    {sessionEmail} est relié au foyer{" "}
                    {activeMembership.household_name}.
                  </>
                ) : (
                  <>
                    {sessionEmail} est connecté à DOMYLI, mais aucun foyer
                    exploitable n’a encore été résolu.
                  </>
                )}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-[1rem] border border-white/10 bg-black/30 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                    Foyer actif
                  </div>
                  <div className="mt-2 text-xl">
                    {activeMembership?.household_name ?? "—"}
                  </div>
                </div>

                <div className="rounded-[1rem] border border-white/10 bg-black/30 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                    Rôle
                  </div>
                  <div className="mt-2 text-xl">{activeMembership?.role ?? "—"}</div>
                </div>

                <div className="rounded-[1rem] border border-white/10 bg-black/30 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                    Super Admin
                  </div>
                  <div className="mt-2 text-xl">
                    {bootstrap?.is_super_admin ? "Oui" : "Non"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigateTo(ROUTES.PROFILES, true);
                }}
                className="border border-gold/40 px-5 py-4 text-sm uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-black"
              >
                Ouvrir Profiles
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigateTo(ROUTES.DASHBOARD, true);
                }}
                className="border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.25em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Ouvrir Dashboard
              </button>
            </div>
          </div>
        )}

        {(localMessage || error) && (
          <div className="mt-8 border border-gold/20 bg-gold/10 px-6 py-5 text-lg text-gold whitespace-pre-line">
            {localMessage ?? error?.message}
          </div>
        )}
      </div>
    </div>
  );
}