import React, { useMemo, useState } from "react";
import {
  Check,
  LoaderCircle,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";

import { useAuth } from "@/src/providers/AuthProvider";
import { navigateTo } from "@/src/lib/navigation";
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

export default function DomyliConnectionModal({ isOpen, onClose }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<"login" | "signup" | "logout" | null>(null);

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
  } = useAuth();

  const isSuperAdmin = Boolean(bootstrap?.is_super_admin);

  const title = useMemo(() => {
    if (authLoading) return "Connexion DOMYLI";
    if (!isAuthenticated) {
      return mode === "login"
        ? "Connexion DOMYLI"
        : "Créer votre accès DOMYLI";
    }
    if (isSuperAdmin) return "Cockpit Super Admin";
    if (!hasHousehold) return "Activer votre foyer";
    return "DOMYLI connecté";
  }, [authLoading, hasHousehold, isAuthenticated, isSuperAdmin, mode]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalMessage(null);
    setBusy("login");

    try {
      await signInWithPassword(email, password);
      setPassword("");
      setLocalMessage(
        "Connexion réussie.\nDOMYLI synchronise maintenant votre contexte.",
      );
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

  const handleLogout = async () => {
    setLocalMessage(null);
    setBusy("logout");

    try {
      await signOut();
      setEmail("");
      setPassword("");
      onClose();
      navigateTo(ROUTES.HOME, true);
    } catch (err) {
      setLocalMessage(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const openActivation = () => {
    onClose();
    navigateTo(ROUTES.ACTIVATE_HOUSEHOLD, true);
  };

  const openDashboard = () => {
    onClose();
    navigateTo(ROUTES.DASHBOARD, true);
  };

  const openProfiles = () => {
    onClose();
    navigateTo(ROUTES.PROFILES, true);
  };

  const openAdminCatalog = () => {
    onClose();
    navigateTo(ROUTES.ADMIN_CATALOG, true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6">
      <div className="relative w-full max-w-xl rounded-[32px] border border-white/10 bg-obsidian p-6 text-alabaster shadow-2xl shadow-black/40">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:border-gold/40 hover:text-gold"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pr-12">
          <p className="text-xs uppercase tracking-[0.28em] text-gold">
            DOMYLI
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-white">{title}</h3>
          <p className="mt-3 text-sm leading-7 text-white/70">
            Connexion réelle à la base DOMYLI via Supabase, sans casser la
            landing.
          </p>
        </div>

        {authLoading && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-3 text-white/80">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              <span className="text-sm">Chargement de la session DOMYLI...</span>
            </div>
          </div>
        )}

        {!authLoading && isAuthenticated && (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.24em] text-white/70 transition-colors hover:border-gold/40 hover:text-gold"
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
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-3 text-white/80">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              <span className="text-sm">
                Synchronisation du contexte DOMYLI...
              </span>
            </div>
          </div>
        )}

        {!authLoading && !isAuthenticated && (
          <>
            <div className="mt-8 flex overflow-hidden rounded-2xl border border-white/10">
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

            <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="mt-6 space-y-4">
              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Email</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="vous@exemple.com"
                  className="w-full border border-white/10 bg-white/5 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </label>

              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Mot de passe</span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                  placeholder="Votre mot de passe"
                  className="w-full border border-white/10 bg-white/5 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </label>

              <button
                type="submit"
                disabled={busy === "login" || busy === "signup"}
                className="inline-flex w-full items-center justify-center gap-3 border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.24em] text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
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

        {!authLoading && isAuthenticated && !hasHousehold && !isSuperAdmin && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm leading-7 text-white/75">
              Connecté en tant que {sessionEmail}. Aucun foyer actif n’est encore
              résolu pour cette session.
            </p>

            <button
              type="button"
              onClick={openActivation}
              className="mt-5 inline-flex items-center gap-2 border border-gold/40 px-5 py-3 text-xs uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold hover:text-black"
            >
              Activer mon foyer
            </button>
          </div>
        )}

        {!authLoading && isAuthenticated && isSuperAdmin && !hasHousehold && (
          <div className="mt-8 rounded-3xl border border-gold/20 bg-gold/10 p-6">
            <div className="flex items-center gap-2 text-gold">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.24em]">
                Super Admin détecté
              </span>
            </div>

            <p className="mt-3 text-sm leading-7 text-gold/90">
              Connecté en tant que {sessionEmail}. Aucun foyer actif n’est requis
              pour accéder au cockpit global DOMYLI.
            </p>

            <button
              type="button"
              onClick={openAdminCatalog}
              className="mt-5 inline-flex items-center gap-2 border border-gold bg-gold px-5 py-3 text-xs uppercase tracking-[0.24em] text-black transition-opacity hover:opacity-90"
            >
              <ShieldCheck className="h-4 w-4" />
              Ouvrir le cockpit admin
            </button>
          </div>
        )}

        {!authLoading && isAuthenticated && hasHousehold && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-gold">
              Connexion active
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                  Email
                </p>
                <p className="mt-2 text-sm text-white">{sessionEmail}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                  Foyer actif
                </p>
                <p className="mt-2 text-sm text-white">
                  {activeMembership?.household_name ?? "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                  Gouvernance
                </p>
                <p className="mt-2 text-sm text-white">
                  {activeMembership?.role ?? "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                  Super Admin
                </p>
                <p className="mt-2 text-sm text-white">
                  {isSuperAdmin ? "Oui" : "Non"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openProfiles}
                className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.24em] text-white/75 transition-colors hover:border-gold/40 hover:text-gold"
              >
                Ouvrir Profiles
              </button>

              <button
                type="button"
                onClick={openDashboard}
                className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.24em] text-white/75 transition-colors hover:border-gold/40 hover:text-gold"
              >
                Ouvrir Dashboard
              </button>

              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={openAdminCatalog}
                  className="inline-flex items-center gap-2 border border-gold bg-gold px-5 py-3 text-xs uppercase tracking-[0.24em] text-black transition-opacity hover:opacity-90"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Ouvrir le cockpit admin
                </button>
              )}
            </div>
          </div>
        )}

        {(localMessage || error) && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm whitespace-pre-line text-white/85">
            {localMessage ?? error?.message}
          </div>
        )}
      </div>
    </div>
  );
}