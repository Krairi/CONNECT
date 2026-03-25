import { useMemo, useState } from "react";
import { ArrowRight, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { ROUTES } from "@/src/constants/routes";
import { getErrorMessage } from "./utils/getErrorMessage";

export default function LandingPage() {
  const navigate = useNavigate();
  const {
    authLoading,
    bootstrapLoading,
    isAuthenticated,
    hasHousehold,
    sessionEmail,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    createFirstHousehold,
  } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [busy, setBusy] = useState<"login" | "signup" | "household" | "logout" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const title = useMemo(() => {
    if (authLoading) return "Connexion DOMYLI";
    if (!isAuthenticated) return mode === "login" ? "Connexion DOMYLI" : "Créer votre accès";
    if (!hasHousehold) return "Créer votre foyer";
    return "DOMYLI connecté";
  }, [authLoading, isAuthenticated, hasHousehold, mode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setBusy("login");

    try {
      await signInWithPassword(email, password);
      setPassword("");
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setBusy("signup");

    try {
      await signUpWithPassword(email, password);
      setMessage("Compte créé. Connecte-toi maintenant.");
      setMode("login");
      setPassword("");
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setBusy("household");

    try {
      await createFirstHousehold(householdName);
      setHouseholdName("");
      navigate(ROUTES.PROFILES);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const handleLogout = async () => {
    setMessage(null);
    setBusy("logout");

    try {
      await signOut();
      navigate(ROUTES.HOME);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-xs uppercase tracking-[0.35em] text-amber-300">
          DOMYLI
        </div>

        <h1 className="mt-4 text-4xl md:text-6xl font-semibold leading-tight">
          {title}
        </h1>

        <p className="mt-6 max-w-2xl text-white/70 leading-8">
          Ce bloc remet CONNECT dans un parcours minimum réel :
          authentification Supabase, création du premier foyer, création du
          premier profil, puis accès au dashboard.
        </p>

        {(authLoading || bootstrapLoading) && (
          <div className="mt-8 border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/75">
            Chargement du contexte DOMYLI...
          </div>
        )}

        {!authLoading && !isAuthenticated && (
          <div className="mt-10 max-w-xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 px-4 py-3 text-xs uppercase tracking-[0.25em] border ${
                  mode === "login"
                    ? "border-amber-300 bg-amber-300 text-black"
                    : "border-white/10 text-white/70"
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 px-4 py-3 text-xs uppercase tracking-[0.25em] border ${
                  mode === "signup"
                    ? "border-amber-300 bg-amber-300 text-black"
                    : "border-white/10 text-white/70"
                }`}
              >
                Inscription
              </button>
            </div>

            <form
              onSubmit={mode === "login" ? handleLogin : handleSignup}
              className="mt-6 space-y-4"
            >
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-amber-300/50"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                required
                className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-amber-300/50"
              />
              <button
                type="submit"
                disabled={busy === "login" || busy === "signup"}
                className="inline-flex w-full items-center justify-center gap-3 border border-amber-300 bg-amber-300 px-5 py-4 text-sm uppercase tracking-[0.25em] text-black disabled:opacity-50"
              >
                {mode === "login"
                  ? busy === "login"
                    ? "Connexion..."
                    : "Se connecter"
                  : busy === "signup"
                  ? "Création..."
                  : "Créer mon compte"}
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        )}

        {!authLoading && isAuthenticated && !hasHousehold && (
          <form
            onSubmit={handleCreateHousehold}
            className="mt-10 max-w-xl border border-white/10 bg-white/[0.03] p-6 space-y-4"
          >
            <div className="text-sm text-white/70">
              Connecté en tant que <span className="text-amber-300">{sessionEmail}</span>
            </div>
            <input
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="Maison Krairi"
              required
              className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-amber-300/50"
            />
            <button
              type="submit"
              disabled={busy === "household"}
              className="inline-flex w-full items-center justify-center gap-3 border border-amber-300 bg-amber-300 px-5 py-4 text-sm uppercase tracking-[0.25em] text-black disabled:opacity-50"
            >
              {busy === "household" ? "Création..." : "Créer mon foyer"}
            </button>
          </form>
        )}

        {!authLoading && isAuthenticated && hasHousehold && (
          <div className="mt-10 max-w-xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <div className="text-sm text-white/70">
              Session active : <span className="text-amber-300">{sessionEmail}</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(ROUTES.PROFILES)}
                className="flex-1 border border-amber-300/40 px-5 py-4 text-sm uppercase tracking-[0.25em] text-amber-300 hover:bg-amber-300 hover:text-black transition-colors"
              >
                Ouvrir Profiles
              </button>
              <button
                type="button"
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="flex-1 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.25em] text-white hover:border-amber-300/40 hover:text-amber-300 transition-colors"
              >
                Ouvrir Dashboard
              </button>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={busy === "logout"}
              className="inline-flex w-full items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.25em] text-white hover:border-red-400/40 hover:text-red-300 transition-colors disabled:opacity-50"
            >
              <LogOut size={16} />
              {busy === "logout" ? "Déconnexion..." : "Se déconnecter"}
            </button>
          </div>
        )}

        {message && (
          <div className="mt-6 max-w-xl border border-amber-300/20 bg-amber-300/5 px-4 py-4 text-sm text-amber-200">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}