import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { ROUTES } from "@/src/constants/routes";
import { useAuth } from "@/src/providers/AuthProvider";
import { acceptHouseholdInvite } from "@/src/services/households/householdMembersService";
import { readMyProfileStatus } from "@/src/services/profiles/myProfileService";
import { getErrorMessage } from "@/src/pages/utils/getErrorMessage";

export default function InviteAcceptPage() {
  const navigate = useNavigate();
  const { token } = useParams();

  const { setActiveHousehold } = useAuth();

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
        const householdId = await acceptHouseholdInvite(token);
        await setActiveHousehold(householdId);

        const status = await readMyProfileStatus();

        if (cancelled) return;

        navigate(status.has_profile ? ROUTES.DASHBOARD : ROUTES.MY_PROFILE, {
          replace: true,
        });
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
  }, [token, navigate, setActiveHousehold]);

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-gold" />
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            Invitation DOMYLI
          </p>
        </div>

        <h1 className="mt-4 text-3xl font-semibold">Rejoindre le foyer</h1>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
          DOMYLI rattache ton compte au foyer, active ce foyer pour la session
          courante, puis vérifie si ton profil humain existe déjà.
        </p>

        <div className="mt-8 rounded-[24px] border border-white/10 bg-black/20 p-6">
          <div className="flex items-center gap-3 text-gold">
            {accepting ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            <span className="text-sm uppercase tracking-[0.24em]">État</span>
          </div>

          <p className="mt-4 text-base text-white">{error ?? message}</p>

          <p className="mt-3 text-sm text-white/60">
            {accepting ? "Traitement..." : "Terminé"}
          </p>
        </div>
      </div>
    </div>
  );
}