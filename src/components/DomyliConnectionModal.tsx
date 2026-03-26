import React, { useEffect, useMemo, useState } from "react";
import { Check, LoaderCircle, LogOut, X } from "lucide-react";

import { useDomyliConnection } from "../hooks/useDomyliConnection";
import { navigateTo } from "../lib/navigation";

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
  const [pendingHouseholdRedirect, setPendingHouseholdRedirect] =
    useState(false);

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

  useEffect(() => {
    if (!pendingHouseholdRedirect) return;
    if (!hasHousehold) return;
    if (!bootstrap?.active_household_id) return;

    setPendingHouseholdRedirect(false);
    setLocalMessage(null);
    onClose();
    navigateTo("/profiles");
  }, [
    pendingHouseholdRedirect,
    hasHousehold,
    bootstrap?.active_household_id,
    onClose,
  ]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
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

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
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

  const handleHouseholdCreate = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setLocalMessage(null);
    setBusy("household");

    try {
      const created = await createFirstHousehold(householdName);
      setLocalMessage(`Foyer créé : ${created.household_name}`);
      setHouseholdName("");
      setPendingHouseholdRedirect(true);
    } catch (err) {
      setLocalMessage(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleLogout = async () => {
    setLocalMessage(null);
    setBusy("logout");
    setPendingHouseholdRedirect(false);

    try {
      await signOut();
      setEmail("");
      setPassword("");
      setHouseholdName("");
      onClose();
      navigateTo("/");
    } catch (err) {
      setLocalMessage(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-[2rem] border border-gold/20 bg-obsidian px-6 py-6 text-alabaster shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-alabaster/70 transition-colors hover:border-gold/40 hover:text-gold"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/80">
            DOMYLI
          </div>
          <h3 className="mt-3 text-3xl font-semibold">{title}</h3>
          <p className="mt-3 max-w-2xl text-base text-alabaster/65">
            Connexion réelle à la base DOMYLI via Supabase, sans casser la
            landing.
          </p>
        </div>

        {authLoading && (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-5 text-alabaster/75">
            <div className="flex items-center gap-3">
              <LoaderCircle className="h-5 w-5 animate-spin text-gold" />
              <span>Chargement de la session DOMYLI...</span>
            </div>
          </div>
        )}

        {!authLoading && isAuthenticated && (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={handleLogout}
              disabled={busy === "logout"}
              className="inline-flex items-center gap-3 border border-white/10 px-5 py-3 text-sm uppercase tracking-[0.22em] text-alabaster transition-colors hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {busy === "logout" ? "Déconnexion..." : "Se déconnecter"}
            </button>
          </div>
        )}

        {bootstrapLoading && isAuthenticated && (
          <div className="mb-4 rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-5 text-alabaster/75">
            <div className="flex items-center gap-3">
              <LoaderCircle className="h-5 w-5 animate-spin text-gold" />
              <span>Synchronisation du contexte DOMYLI...</span>
            </div>
          </div>
        )}

        {!authLoading && !isAuthenticated && (
          <>
            <div className="mb-6 flex gap-3">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 py-3 text-xs uppercase tracking-[0.25em] border transition-colors ${
                  mode === "login"
                    ? "border-gold bg-gold text-obsidian"
                    : "border-white/10 text-alabaster/70 hover:border-gold/30"
                }`}
              >
                Connexion
              </button>

              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 py-3 text-xs uppercase tracking-[0.25em] border transition-colors ${
                  mode === "signup"
                    ? "border-gold bg-gold text-obsidian"
                    : "border-white/10 text-alabaster/70 hover:border-gold/30"
                }`}
              >
                Inscription
              </button>
            </div>

            <form
              onSubmit={mode === "login" ? handleLogin : handleSignup}
              className="space-y-5"
            >
              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.25em] text-gold/80">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="vous@exemple.com"
                  className="w-full border border-white/10 bg-white/5 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.25em] text-gold/80">
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
                className="inline-flex w-full items-center justify-center gap-3 bg-gold px-6 py-4 text-sm uppercase tracking-[0.24em] text-obsidian transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
          <form onSubmit={handleHouseholdCreate} className="space-y-5">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-5 text-alabaster/80">
              Connecté en tant que {sessionEmail}
            </div>

            <div>
              <label className="mb-3 block text-xs uppercase tracking-[0.25em] text-gold/80">
                Nom du foyer
              </label>
              <input
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                required
                placeholder="Maison Krairi"
                className="w-full border border-white/10 bg-white/5 px-4 py-4 text-sm outline-none focus:border-gold/50"
              />
            </div>

            <button
              type="submit"
              disabled={busy === "household" || pendingHouseholdRedirect}
              className="inline-flex w-full items-center justify-center gap-3 bg-gold px-6 py-4 text-sm uppercase tracking-[0.24em] text-obsidian transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "household" || pendingHouseholdRedirect ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}

              {busy === "household"
                ? "Création..."
                : pendingHouseholdRedirect
                ? "Stabilisation du foyer..."
                : "Créer mon foyer"}
            </button>
          </form>
        )}

        {!authLoading && isAuthenticated && hasHousehold && (
          <div className="space-y-5">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-5">
              <div className="text-xs uppercase tracking-[0.25em] text-gold/80">
                Connexion active
              </div>

              <div className="mt-4 text-alabaster/80">
                {activeMembership?.household_name ? (
                  <>
                    {sessionEmail} est relié au foyer{" "}
                    <span className="text-gold">
                      {activeMembership.household_name}
                    </span>
                    .
                  </>
                ) : (
                  <>
                    {sessionEmail} est connecté à DOMYLI, mais aucun foyer
                    exploitable n’a encore été résolu.
                  </>
                )}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-gold/75">
                    Foyer actif
                  </div>
                  <div className="mt-2 text-sm">
                    {activeMembership?.household_name ?? "—"}
                  </div>
                </div>

                <div className="border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-gold/75">
                    Rôle
                  </div>
                  <div className="mt-2 text-sm">
                    {activeMembership?.role ?? "—"}
                  </div>
                </div>

                <div className="border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-gold/75">
                    Super Admin
                  </div>
                  <div className="mt-2 text-sm">
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
                  navigateTo("/profiles");
                }}
                className="border border-gold/40 px-5 py-4 text-sm uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-obsidian"
              >
                Ouvrir Profiles
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigateTo("/dashboard");
                }}
                className="border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.25em] text-alabaster transition-colors hover:border-gold/40 hover:text-gold"
              >
                Ouvrir Dashboard
              </button>
            </div>
          </div>
        )}

        {(localMessage || error) && (
          <div className="mt-6 border border-gold/20 bg-gold/10 px-5 py-4 text-base text-gold">
            {localMessage ?? error?.message}
          </div>
        )}
      </div>
    </div>
  );
}