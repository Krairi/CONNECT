import React, { useMemo, useState } from "react";
import { Check, LoaderCircle, X, LogOut } from "lucide-react";
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

export default function DomyliConnectionModal({ isOpen, onClose }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<"login" | "signup" | "household" | "logout" | null>(null);

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
    if (!isAuthenticated) return mode === "login" ? "Connexion DOMYLI" : "Créer votre accès DOMYLI";
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

      setTimeout(() => {
        setLocalMessage(null);
        onClose();
        navigateTo("/profiles");
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
      navigateTo("/");
    } catch (err) {
      setLocalMessage(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl border border-white/10 bg-[#0A0A0B] text-alabaster shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-alabaster/60 hover:text-alabaster transition-colors"
          aria-label="Fermer"
        >
          <X />
        </button>

        <div className="border-b border-white/10 px-8 py-6">
          <p className="text-xs uppercase tracking-[0.35em] text-gold/80">DOMYLI</p>
          <h3 className="mt-3 font-serif text-3xl">{title}</h3>
          <p className="mt-3 text-sm text-alabaster/70">
            Connexion réelle à la base DOMYLI via Supabase, sans casser la landing.
          </p>
        </div>

        <div className="px-8 py-8 space-y-6">
          {authLoading && (
            <div className="flex items-center gap-3 text-sm text-alabaster/80">
              <LoaderCircle className="animate-spin" size={18} />
              Chargement de la session DOMYLI...
            </div>
          )}

          {!authLoading && isAuthenticated && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleLogout}
                disabled={busy === "logout"}
                className="flex items-center gap-2 border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-50"
              >
                <LogOut size={14} />
                {busy === "logout" ? "Déconnexion..." : "Se déconnecter"}
              </button>
            </div>
          )}

          {bootstrapLoading && isAuthenticated && (
            <div className="flex items-center gap-3 text-sm text-alabaster/80">
              <LoaderCircle className="animate-spin" size={18} />
              Synchronisation du contexte DOMYLI...
            </div>
          )}

          {!authLoading && !isAuthenticated && (
            <>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`flex-1 py-3 text-xs uppercase tracking-[0.25em] border ${
                    mode === "login"
                      ? "border-gold bg-gold text-obsidian"
                      : "border-white/10 text-alabaster/70"
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
                      : "border-white/10 text-alabaster/70"
                  }`}
                >
                  Inscription
                </button>
              </div>

              <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
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
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
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
                  className="w-full bg-gold px-5 py-4 text-sm font-medium uppercase tracking-[0.25em] text-obsidian transition hover:opacity-90 disabled:opacity-50"
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
            <form onSubmit={handleHouseholdCreate} className="space-y-4">
              <div className="rounded border border-gold/20 bg-gold/5 px-4 py-4 text-sm text-alabaster/80">
                Connecté en tant que <span className="text-gold">{sessionEmail}</span>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
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
                disabled={busy === "household"}
                className="w-full bg-gold px-5 py-4 text-sm font-medium uppercase tracking-[0.25em] text-obsidian transition hover:opacity-90 disabled:opacity-50"
              >
                {busy === "household" ? "Création..." : "Créer mon foyer"}
              </button>
            </form>
          )}

          {!authLoading && isAuthenticated && hasHousehold && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-sm">
                <Check className="mt-0.5 text-emerald-300" size={18} />
                <div>
                  <div className="font-medium text-alabaster">Connexion active</div>
                  <div className="mt-1 text-alabaster/75">
                    {activeMembership?.household_name ? (
                      <>
                        {sessionEmail} est relié au foyer{" "}
                        <span className="text-gold">{activeMembership.household_name}</span>.
                      </>
                    ) : (
                      <>
                        {sessionEmail} est connecté à DOMYLI, mais aucun foyer exploitable n’a encore été résolu.
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 border border-white/10 bg-white/5 p-4 text-sm">
                <div>
                  <span className="text-alabaster/50">Foyer actif :</span>{" "}
                  <span className="text-alabaster">{activeMembership?.household_name ?? "—"}</span>
                </div>
                <div>
                  <span className="text-alabaster/50">Rôle :</span>{" "}
                  <span className="text-alabaster">{activeMembership?.role ?? "—"}</span>
                </div>
                <div>
                  <span className="text-alabaster/50">Super Admin :</span>{" "}
                  <span className={bootstrap?.is_super_admin ? "text-gold" : "text-alabaster"}>
                    {bootstrap?.is_super_admin ? "Oui" : "Non"}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigateTo("/profiles");
                  }}
                  className="border border-gold/40 px-5 py-4 text-sm uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
                >
                  Ouvrir Profiles
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigateTo("/dashboard");
                  }}
                  className="border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
                >
                  Ouvrir Dashboard
                </button>
              </div>
            </div>
          )}

          {(localMessage || error) && (
            <div className="border border-white/10 bg-white/5 px-4 py-4 text-sm text-alabaster/75">
              {localMessage ?? error?.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}