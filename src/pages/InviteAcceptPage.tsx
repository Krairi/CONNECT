import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { ROUTES } from "@/src/constants/routes";
import { getErrorMessage } from "@/src/pages/utils/getErrorMessage";
import { useAuth } from "@/src/providers/AuthProvider";
import { acceptHouseholdInvite } from "@/src/services/households/householdMembersService";

function normalizeNextRoute(nextRoute: string | null | undefined) {
  switch ((nextRoute ?? "").trim()) {
    case ROUTES.DASHBOARD:
      return ROUTES.DASHBOARD;
    case ROUTES.MY_PROFILE:
      return ROUTES.MY_PROFILE;
    case ROUTES.ACTIVATE_HOUSEHOLD:
      return ROUTES.ACTIVATE_HOUSEHOLD;
    default:
      return ROUTES.MY_PROFILE;
  }
}

export default function InviteAcceptPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const { refreshBootstrap } = useAuth();

  const [message, setMessage] = useState("Traitement de l’invitation...");
  const [accepting, setAccepting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!token) {
        setAccepting(false);
        setError("Token d’invitation manquant.");
        return;
      }

      try {
        const accepted = await acceptHouseholdInvite(token);

        await refreshBootstrap({
          retries: 2,
          retryDelayMs: 800,
          bootstrapTimeoutMs: 15_000,
          activeTimeoutMs: 15_000,
        });

        if (cancelled) return;

        const nextRoute = normalizeNextRoute(accepted.next_route);
        const nextMessage = accepted.profile_completed
          ? "Invitation acceptée. Le foyer est actif et le profil humain est exploitable."
          : "Invitation acceptée. DOMYLI demande maintenant la création ou la complétion du profil humain.";

        setMessage(nextMessage);
        navigate(nextRoute, { replace: true });
      } catch (caught) {
        if (cancelled) return;
        setAccepting(false);
        setError(getErrorMessage(caught));
        setMessage("Impossible de finaliser l’acceptation de l’invitation.");
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [token, navigate, refreshBootstrap]);

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/70">
          <ShieldCheck className="h-4 w-4" />
          Invitation DOMYLI
        </div>

        <h1 className="mt-6 text-3xl font-semibold">Rejoindre le foyer</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
          DOMYLI rattache ton compte au foyer, active ce foyer pour la session
          courante, puis vérifie si ton profil humain est complet et exploitable.
        </p>

        <div className="mt-8 rounded-[28px] border border-white/10 bg-black/20 p-6">
          <div className="flex items-center gap-3 text-gold">
            {accepting ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            <p className="text-xs uppercase tracking-[0.24em]">
              {accepting ? "Traitement..." : "Terminé"}
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">
              État
            </p>
            <p className="mt-3 text-sm leading-7 text-white/85">
              {error ?? message}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
