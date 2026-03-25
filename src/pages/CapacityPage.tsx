import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Gauge,
  House,
  RefreshCw,
  Save,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useDomyliConnection } from "../hooks/useDomyliConnection";
import { useCapacity } from "../hooks/useCapacity";
import { navigateTo } from "../lib/navigation";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function CapacityPage() {
  const {
    sessionEmail,
    activeMembership,
    bootstrap,
    isAuthenticated,
    hasHousehold,
    authLoading,
  } = useDomyliConnection();

  const [day, setDay] = useState(todayIsoDate());
  const [selectedMemberUserId, setSelectedMemberUserId] = useState("");
  const [capacityPointsDaily, setCapacityPointsDaily] = useState("");
  const [reason, setReason] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const { loading, saving, error, capacity, lastSaved, refresh, saveMemberCapacity } =
    useCapacity(day);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/80">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-serif italic">Chargement de la capacité...</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
        <div className="max-w-xl w-full border border-white/10 bg-white/5 p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/80">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-serif italic">Foyer requis</h1>
          <p className="mt-4 text-alabaster/70">
            Il faut une session authentifiée et un foyer actif pour accéder à la capacité.
          </p>
          <button
            onClick={() => navigateTo("/")}
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
      //
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-alabaster">
      <header className="border-b border-white/5 glass">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo("/dashboard")}
              className="w-10 h-10 border border-white/10 flex items-center justify-center hover:border-gold/40 transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft size={18} className="text-gold" />
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold/80">DOMYLI</p>
              <h1 className="text-2xl font-serif italic">Capacity</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Rafraîchir
            </button>

            <button
              onClick={() => navigateTo("/tools")}
              className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
            >
              Tools
            </button>

            <button
              onClick={() => navigateTo("/dashboard")}
              className="border border-gold/40 px-5 py-3 text-xs uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <section className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 border border-white/10 bg-white/5 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Équilibrage du foyer</p>
            <h2 className="mt-4 text-4xl font-serif italic">Piloter la capacité quotidienne</h2>
            <p className="mt-6 text-alabaster/70 leading-relaxed">
              Cette page est alignée sur
              <span className="text-gold"> rpc_team_capacity(p_capacity_date)</span> et
              <span className="text-gold">
                {" "}
                rpc_capacity_set_member_daily(p_user_id, p_capacity_date, p_capacity_points, p_reason)
              </span>.
            </p>

            <div className="mt-10 grid md:grid-cols-4 gap-4">
              <div className="border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-alabaster/50">
                  Capacité de base
                </div>
                <div className="mt-2 text-3xl font-serif italic">
                  {capacity?.total_base_capacity_points ?? 0}
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-alabaster/50">
                  Capacité effective
                </div>
                <div className="mt-2 text-3xl font-serif italic">
                  {capacity?.total_effective_capacity_points ?? 0}
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-alabaster/50">
                  Effort assigné
                </div>
                <div className="mt-2 text-3xl font-serif italic">
                  {capacity?.total_assigned_effort_points ?? 0}
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-alabaster/50">
                  Restant
                </div>
                <div className="mt-2 text-3xl font-serif italic">
                  {capacity?.total_remaining_capacity_points ?? 0}
                </div>
              </div>
            </div>

            <div className="mt-10 border border-white/10 bg-black/20 p-6">
              <div className="grid md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Date
                  </label>
                  <input
                    type="date"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Membre
                  </label>
                  <select
                    value={selectedMemberUserId}
                    onChange={(e) => {
                      setSelectedMemberUserId(e.target.value);
                      const member = capacity?.members.find(
                        (m) => m.member_user_id === e.target.value
                      );
                      setCapacityPointsDaily(
                        member ? String(member.effective_capacity_points) : ""
                      );
                    }}
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  >
                    <option value="">Sélectionner</option>
                    {capacity?.members.map((member) => (
                      <option key={member.member_user_id} value={member.member_user_id}>
                        {member.member_user_id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Capacité quotidienne
                  </label>
                  <input
                    type="number"
                    value={capacityPointsDaily}
                    onChange={(e) => setCapacityPointsDaily(e.target.value)}
                    placeholder="10"
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Raison
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ajustement manuel"
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center justify-center gap-3 bg-gold px-6 py-4 text-sm font-medium uppercase tracking-[0.25em] text-obsidian transition hover:opacity-90 disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? "Enregistrement..." : "Enregistrer la capacité"}
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo("/dashboard")}
                  className="flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
                >
                  <ArrowRight size={18} />
                  Retour dashboard
                </button>
              </div>
            </div>

            <div className="mt-10 border border-white/10 bg-black/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users size={18} className="text-gold" />
                <h3 className="text-xl font-serif italic">Capacité par membre</h3>
              </div>

              {loading && (
                <div className="text-sm text-alabaster/70">Chargement de la capacité...</div>
              )}

              {!loading && (!capacity?.members || capacity.members.length === 0) && (
                <div className="text-sm text-alabaster/70">Aucun membre remonté pour cette date.</div>
              )}

              {!loading && capacity?.members && capacity.members.length > 0 && (
                <div className="grid gap-4">
                  {capacity.members.map((member) => (
                    <div
                      key={member.member_user_id}
                      className="border border-white/10 bg-obsidian p-4 grid md:grid-cols-6 gap-4 text-sm"
                    >
                      <div>
                        <div className="text-alabaster/50">Membre</div>
                        <div className="mt-1 text-alabaster">{member.member_user_id}</div>
                      </div>
                      <div>
                        <div className="text-alabaster/50">Rôle</div>
                        <div className="mt-1 text-alabaster">{member.role}</div>
                      </div>
                      <div>
                        <div className="text-alabaster/50">Base</div>
                        <div className="mt-1 text-alabaster">{member.base_capacity_points}</div>
                      </div>
                      <div>
                        <div className="text-alabaster/50">Effective</div>
                        <div className="mt-1 text-alabaster">{member.effective_capacity_points}</div>
                      </div>
                      <div>
                        <div className="text-alabaster/50">Assigné</div>
                        <div className="mt-1 text-alabaster">{member.assigned_effort_points}</div>
                      </div>
                      <div>
                        <div className="text-alabaster/50">Restant</div>
                        <div className="mt-1 text-alabaster">{member.remaining_capacity_points}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(localMessage || error || lastSaved) && (
              <div className="mt-8 border border-white/10 bg-black/20 p-4 text-sm text-alabaster/75">
                {localMessage ??
                  error?.message ??
                  (lastSaved ? `Capacité enregistrée : ${lastSaved.capacity_entry_id}` : null)}
              </div>
            )}
          </div>

          <aside className="border border-white/10 bg-white/5 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Contexte actif</p>

            <div className="mt-6 space-y-4 text-sm">
              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Email :</span>
                <div className="mt-1 text-alabaster">{sessionEmail ?? "—"}</div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Foyer :</span>
                <div className="mt-1 text-alabaster">{activeMembership?.household_name ?? "—"}</div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Rôle :</span>
                <div className="mt-1 text-alabaster">{activeMembership?.role ?? "—"}</div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <span className="text-alabaster/50">Super Admin :</span>
                <div className="mt-1 text-alabaster">{bootstrap?.is_super_admin ? "Oui" : "Non"}</div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="border border-gold/20 bg-gold/5 p-4 text-sm text-alabaster/75">
                <div className="flex items-center gap-3">
                  <House size={18} className="text-gold" />
                  <span>La capacité permet d’équilibrer l’effort domestique réel.</span>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <Gauge size={18} className="text-gold" />
                  <span className="text-sm">RPC : app.rpc_team_capacity(p_capacity_date)</span>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-gold" />
                  <span className="text-sm">
                    RPC : app.rpc_capacity_set_member_daily(p_user_id, p_capacity_date, p_capacity_points, p_reason)
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}