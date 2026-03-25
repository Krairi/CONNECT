import { useMemo, useState } from "react";
import { ArrowLeft, Gauge, RefreshCw, Save, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/contexts/AuthContext";
import { useCapacity } from "@/src/hooks/useCapacity";
import { ROUTES } from "@/src/constants/routes";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function CapacityPage() {
  const navigate = useNavigate();
  const { isAuthenticated, hasHousehold, authLoading, bootstrapLoading } =
    useAuth();

  const [day, setDay] = useState(todayIsoDate());
  const [selectedMemberUserId, setSelectedMemberUserId] = useState("");
  const [capacityPointsDaily, setCapacityPointsDaily] = useState("");
  const [reason, setReason] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const { loading, saving, error, capacity, lastSaved, refresh, saveMemberCapacity } =
    useCapacity(day);

  const selectedMember = useMemo(() => {
    return (
      capacity?.members.find((m) => m.member_user_id === selectedMemberUserId) ??
      null
    );
  }, [capacity?.members, selectedMemberUserId]);

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-white px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/70">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold text-white">
            Chargement de la capacité...
          </h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <div className="min-h-screen bg-obsidian text-white px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/70">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold text-white">
            Foyer requis
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/70">
            Il faut une session authentifiée et un foyer actif pour accéder à la
            capacité.
          </p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
          >
            Retour à l’accueil
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setLocalMessage(null);

    if (!selectedMemberUserId) {
      setLocalMessage("Sélectionnez un membre.");
      return;
    }

    if (capacityPointsDaily === "") {
      setLocalMessage("Renseignez une capacité quotidienne.");
      return;
    }

    try {
      const result = await saveMemberCapacity(
        selectedMemberUserId,
        Number(capacityPointsDaily),
        reason.trim() || null
      );

      setLocalMessage(`Capacité enregistrée : ${result.capacity_entry_id}`);
      setCapacityPointsDaily("");
      setReason("");
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-white px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="mt-1 h-10 w-10 border border-white/10 flex items-center justify-center hover:border-gold/40 transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <div className="text-xs uppercase tracking-[0.35em] text-gold/70">
                DOMYLI
              </div>
              <h1 className="mt-2 text-4xl font-semibold text-white">
                Capacity
              </h1>
              <p className="mt-3 text-sm leading-7 text-white/65">
                Pilotage de la capacité quotidienne par membre.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-3 border border-gold/40 px-5 py-3 text-xs uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Rafraîchir
          </button>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-6 flex items-center gap-3 text-gold">
              <Gauge size={18} />
              <span className="text-xs uppercase tracking-[0.3em]">
                Capacité du jour
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                  Jour
                </label>
                <input
                  type="date"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                  Membre
                </label>
                <select
                  value={selectedMemberUserId}
                  onChange={(e) => setSelectedMemberUserId(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  <option value="">Sélectionner</option>
                  {(capacity?.members ?? []).map((member) => (
                    <option
                      key={member.member_user_id}
                      value={member.member_user_id}
                    >
                      {member.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                  Capacité quotidienne
                </label>
                <input
                  value={capacityPointsDaily}
                  onChange={(e) => setCapacityPointsDaily(e.target.value)}
                  placeholder="8"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                  Raison
                </label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Charge réduite, déplacement..."
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="mt-6 inline-flex w-full items-center justify-center gap-3 border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.25em] text-obsidian disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Enregistrement..." : "Enregistrer la capacité"}
            </button>

            {(localMessage || error) && (
              <div className="mt-6 border border-gold/20 bg-gold/5 px-4 py-4 text-sm text-gold/90">
                {localMessage ?? error?.message}
              </div>
            )}
          </section>

          <aside className="border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-6 flex items-center gap-3 text-gold">
              <Users size={18} />
              <span className="text-xs uppercase tracking-[0.3em]">
                Synthèse
              </span>
            </div>

            <div className="space-y-4 text-sm leading-7 text-white/70">
              <div>
                <span className="text-gold">Total capacité :</span>{" "}
                {capacity?.total_capacity_points ?? 0}
              </div>
              <div>
                <span className="text-gold">Points assignés :</span>{" "}
                {capacity?.assigned_points ?? 0}
              </div>
              <div>
                <span className="text-gold">Restant :</span>{" "}
                {capacity?.remaining_points ?? 0}
              </div>
              {selectedMember && (
                <div className="border border-white/10 p-4">
                  <div className="text-white">{selectedMember.display_name}</div>
                  <div className="text-white/60">
                    Capacité: {selectedMember.capacity_points_daily}
                  </div>
                  <div className="text-white/60">
                    Assigné: {selectedMember.assigned_points}
                  </div>
                  <div className="text-white/60">
                    Restant: {selectedMember.remaining_points}
                  </div>
                </div>
              )}
            </div>

            {lastSaved && (
              <div className="mt-6 border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-300">
                Dernière entrée enregistrée : {lastSaved.capacity_entry_id}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}