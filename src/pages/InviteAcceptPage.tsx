import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useHouseholdMembers } from "@/src/hooks/useHouseholdMembers";
import { readMyProfileStatus } from "@/src/services/profiles/myProfileService";
import { ROUTES } from "@/src/constants/routes";

export default function InviteAcceptPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const { acceptInvite, accepting, error } = useHouseholdMembers();
  const [message, setMessage] = useState("Traitement de l’invitation...");

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setMessage("Token d’invitation manquant.");
        return;
      }

      try {
        await acceptInvite(token);
        const status = await readMyProfileStatus();

        if (!status.has_profile) {
          navigate(ROUTES.MY_PROFILE);
          return;
        }

        navigate(ROUTES.DASHBOARD);
      } catch {
        // erreur gérée par le hook
      }
    };

    void run();
  }, [token, acceptInvite, navigate]);

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-gold">
          <ShieldCheck className="h-4 w-4" />
          Invitation DOMYLI
        </div>

        <h1 className="mt-6 text-3xl font-semibold">Rejoindre le foyer</h1>
        <p className="mt-3 text-sm leading-7 text-white/70">
          DOMYLI rattache ton compte au foyer, puis vérifie si ton profil humain
          existe déjà.
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-white/85">
          {error?.message ?? message}
        </div>

        <div className="mt-6 inline-flex items-center gap-3 text-gold">
          <CheckCircle2 className={`h-4 w-4 ${accepting ? "animate-pulse" : ""}`} />
          {accepting ? "Traitement..." : "En attente"}
        </div>
      </div>
    </main>
  );
}