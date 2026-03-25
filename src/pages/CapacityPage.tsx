import { useMemo, useState } from "react";
import { ArrowLeft, Gauge, RefreshCw, Save, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { useCapacity } from "@/src/hooks/useCapacity";
import { ROUTES } from "@/src/constants/routes";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function CapacityPage() {
  const navigate = useNavigate();

  const {
    isAuthenticated,
    hasHousehold,
    authLoading,
    bootstrapLoading,
  } = useAuth();

  const [day, setDay] = useState(todayIsoDate());
  const [selectedMemberUserId, setSelectedMemberUserId] = useState("");
  const [capacityPointsDaily, setCapacityPointsDaily] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const {
    loading,
    saving,
    error,
    capacity,
    lastSaved,
    refresh,
    saveMemberCapacity,
  } = useCapacity(day);

  const selectedMember = useMemo(() => {
    return (
      capacity?.members.find((m) => m.member_user_id === selectedMemberUserId) ??
      null
    );
  }, [capacity?.members, selectedMemberUserId]);

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold">
            Chargement de la capacité...
          </h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold">Foyer requis</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-alabaster/70">
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
      setLocalMessage("Sélectionne un membre.");
      return;
    }

    if (!capacityPointsDaily.trim()) {
      setLocalMessage("Renseigne une capacité quotidienne.");
      return;
    }

    try {
      const result = await saveMemberCapacity(
        selectedMemberUserId,
        Number(capacityPointsDaily)
      );

      setLocalMessage(
        `Capacité enregistrée : ${result.member_user_id ?? selectedMemberUserId} → ${result.capacity_points_daily ?? capacityPointsDaily}`
      );
      setCapacityPointsDaily("");
    } catch {
      // déjà géré dans le hook
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-alabaster px-6 py-10">
      <div className="mx-auto max-w-6xl">
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
            <div className="text-xs uppercase tracking-[0.35em] text-gold">
              DOMYLI
            </div>
            <h1 className="mt-2 text-4xl font-semibold">Capacity</h1>
            <p className="mt-3 text-sm leading-7 text-alabaster/65">
              Pilotage de la capacité quotidienne par membre.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void refresh()}
            className="border border-gold/40 px-5 py-3 text-xs uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Rafraîchir
            </span>
          </button>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="glass metallic-border rounded-[2rem] p-6">
            <div className="mb-6 flex items-center gap-3 text-gold">
              <Gauge size={18} />
              <span className="text-xs uppercase tracking-[0.3em]">
                Capacité du jour
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                  Jour
                </label>
                <input
                  type="date"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                  Membre
                </label>
                <select
                  value={selectedMemberUserId}
                  onChange={(e) => setSelectedMemberUserId(e.target.value)}
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                >
                  <option value="">Sélectionner</option>
                  {(capacity?.members ?? []).map((member) => (
                    <option
                      key={member.member_user_id}
                      value={member.member_user_id}
                    >
                      {member.role} · {member.member_user_id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                  Capacité quotidienne
                </label>
                <input
                  value={capacityPointsDaily}
                  onChange={(e) => setCapacityPointsDaily(e.target.value)}
                  placeholder="8"
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-6 inline-flex w-full items-center justify-center gap-3 border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.25em] text-obsidian disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Enregistrement..." : "Enregistrer la capacité"}
            </button>

            {(localMessage || error) && (
              <div className="mt-6 border border-gold/20 bg-gold/5 px-4 py-4 text-sm text-gold">
                {localMessage ?? error?.message}
              </div>
            )}
          </section>

          <aside className="glass metallic-border rounded-[2rem] p-7">
            <div className="mb-6 flex items-center gap-3 text-gold">
              <Users size={18} />
              <span className="text-xs uppercase tracking-[0.3em]">
                Synthèse
              </span>
            </div>

            <div className="space-y-4 text-sm leading-7 text-alabaster/70">
              <div>
                <span className="text-gold">Jour :</span>{" "}
                {capacity?.day ?? day}
              </div>
              <div>
                <span className="text-gold">Total capacité :</span>{" "}
                {capacity?.total_capacity_points ?? 0}
              </div>
              <div>
                <span className="text-gold">Membres :</span>{" "}
                {capacity?.members.length ?? 0}
              </div>

              {selectedMember && (
                <div className="border border-white/10 p-4">
                  <div className="text-alabaster">
                    {selectedMember.member_user_id}
                  </div>
                  <div className="text-alabaster/60">
                    Rôle : {selectedMember.role}
                  </div>
                  <div className="text-alabaster/60">
                    Capacité : {selectedMember.capacity_points_daily}
                  </div>
                </div>
              )}
            </div>

            {lastSaved && (
              <div className="mt-6 border border-gold/20 bg-gold/5 px-4 py-4 text-sm text-gold">
                Dernière capacité enregistrée :{" "}
                {lastSaved.member_user_id ?? "—"} →{" "}
                {lastSaved.capacity_points_daily ?? "—"}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}