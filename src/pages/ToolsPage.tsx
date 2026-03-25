import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Hammer,
  House,
  ShieldCheck,
  Wrench,
  CalendarClock,
  CheckCircle2,
} from "lucide-react";
import { useDomyliConnection } from "../hooks/useDomyliConnection";
import { useTools } from "../hooks/useTools";
import { navigateTo } from "../lib/navigation";

function toDatetimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60000);
  return adjusted.toISOString().slice(0, 16);
}

export default function ToolsPage() {
  const {
    sessionEmail,
    activeMembership,
    bootstrap,
    isAuthenticated,
    hasHousehold,
    authLoading,
  } = useDomyliConnection();

  const {
    saveTool,
    reserveToolSlot,
    releaseToolSlot,
    saving,
    reserving,
    releasing,
    error,
    lastSavedTool,
    lastReservation,
    lastRelease,
  } = useTools();

  const householdId = bootstrap?.active_household_id ?? null;

  const [toolName, setToolName] = useState("");
  const [toolCategory, setToolCategory] = useState("");
  const [toolAssetId, setToolAssetId] = useState("");
  const [startAt, setStartAt] = useState(toDatetimeLocalValue(new Date()));
  const [endAt, setEndAt] = useState(
    toDatetimeLocalValue(new Date(Date.now() + 60 * 60 * 1000))
  );
  const [reservationId, setReservationId] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const canSave = useMemo(() => {
    return Boolean(householdId && toolName.trim());
  }, [householdId, toolName]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/80">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-serif italic">Chargement des outils...</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold || !householdId) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
        <div className="max-w-xl w-full border border-white/10 bg-white/5 p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/80">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-serif italic">Foyer requis</h1>
          <p className="mt-4 text-alabaster/70">
            Il faut une session authentifiée et un foyer actif pour accéder aux outils.
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

  const handleSaveTool = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalMessage(null);

    try {
      const result = await saveTool({
        p_household_id: householdId,
        p_name: toolName.trim(),
        p_category: toolCategory.trim() || null,
      });

      setLocalMessage(`Outil enregistré : ${result.tool_key || toolName.trim()}`);
      setToolName("");
      setToolCategory("");
    } catch {
      //
    }
  };

  const handleReserve = async () => {
    setLocalMessage(null);

    if (!toolAssetId.trim()) {
      setLocalMessage("Renseignez un tool_asset_id pour réserver.");
      return;
    }

    try {
      const result = await reserveToolSlot({
        householdId,
        toolAssetId: toolAssetId.trim(),
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
      });

      setLocalMessage(`Réservation créée : ${result.reservation_id}`);
    } catch {
      //
    }
  };

  const handleRelease = async () => {
    setLocalMessage(null);

    if (!reservationId.trim()) {
      setLocalMessage("Renseignez un reservation_id pour libérer.");
      return;
    }

    try {
      const result = await releaseToolSlot({
        householdId,
        reservationId: reservationId.trim(),
      });

      setLocalMessage(`Réservation libérée : ${result.reservation_id}`);
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
              <h1 className="text-2xl font-serif italic">Tools</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo("/dashboard")}
              className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
            >
              Dashboard
            </button>

            <button
              onClick={() => navigateTo("/tasks")}
              className="border border-gold/40 px-5 py-3 text-xs uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
            >
              Tasks
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <section className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 border border-white/10 bg-white/5 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Matériel & réservations</p>
            <h2 className="mt-4 text-4xl font-serif italic">Créer et réserver un outil</h2>
            <p className="mt-6 text-alabaster/70 leading-relaxed">
              Cette page branche l’expérience DOMYLI sur
              <span className="text-gold"> rpc_tool_upsert</span>,
              <span className="text-gold"> rpc_tool_reserve</span> et
              <span className="text-gold"> rpc_tool_release</span>.
            </p>

            <form onSubmit={handleSaveTool} className="mt-10 grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Nom de l’outil
                </label>
                <input
                  type="text"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  required
                  placeholder="Aspirateur"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Catégorie
                </label>
                <input
                  type="text"
                  value={toolCategory}
                  onChange={(e) => setToolCategory(e.target.value)}
                  placeholder="Nettoyage, cuisine, entretien..."
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={!canSave || saving}
                  className="flex items-center justify-center gap-3 bg-gold px-6 py-4 text-sm font-medium uppercase tracking-[0.25em] text-obsidian transition hover:opacity-90 disabled:opacity-50"
                >
                  <Hammer size={18} />
                  {saving ? "Enregistrement..." : "Enregistrer l’outil"}
                </button>
              </div>
            </form>

            <div className="mt-10 grid md:grid-cols-2 gap-6">
              <div className="border border-white/10 bg-black/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CalendarClock size={18} className="text-gold" />
                  <h3 className="text-xl font-serif italic">Réserver un outil</h3>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                      Tool asset ID
                    </label>
                    <input
                      type="text"
                      value={toolAssetId}
                      onChange={(e) => setToolAssetId(e.target.value)}
                      placeholder="UUID d’asset"
                      className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                      Début
                    </label>
                    <input
                      type="datetime-local"
                      value={startAt}
                      onChange={(e) => setStartAt(e.target.value)}
                      className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                      Fin
                    </label>
                    <input
                      type="datetime-local"
                      value={endAt}
                      onChange={(e) => setEndAt(e.target.value)}
                      className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleReserve}
                    disabled={reserving || !toolAssetId.trim()}
                    className="flex items-center justify-center gap-3 border border-white/10 px-5 py-3 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-50"
                  >
                    <Wrench size={18} />
                    {reserving ? "Réservation..." : "Réserver"}
                  </button>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 size={18} className="text-gold" />
                  <h3 className="text-xl font-serif italic">Libérer une réservation</h3>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                      Reservation ID
                    </label>
                    <input
                      type="text"
                      value={reservationId}
                      onChange={(e) => setReservationId(e.target.value)}
                      placeholder="UUID de réservation"
                      className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRelease}
                    disabled={releasing || !reservationId.trim()}
                    className="flex items-center justify-center gap-3 bg-gold px-5 py-3 text-sm font-medium uppercase tracking-[0.25em] text-obsidian transition hover:opacity-90 disabled:opacity-50"
                  >
                    <CheckCircle2 size={18} />
                    {releasing ? "Libération..." : "Libérer"}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo("/dashboard")}
                    className="flex items-center justify-center gap-3 border border-white/10 px-5 py-3 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
                  >
                    <ArrowRight size={18} />
                    Retour dashboard
                  </button>
                </div>
              </div>
            </div>

            {(localMessage || error || lastSavedTool || lastReservation || lastRelease) && (
              <div className="mt-8 border border-white/10 bg-black/20 p-4 text-sm text-alabaster/75">
                {localMessage ??
                  error?.message ??
                  (lastSavedTool ? `Outil enregistré : ${lastSavedTool.tool_key}` : null) ??
                  (lastReservation ? `Réservation : ${lastReservation.reservation_id}` : null) ??
                  (lastRelease ? `Réservation libérée : ${lastRelease.reservation_id}` : null)}
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
                  <span>Les outils structurent l’exécution et les conflits d’usage du foyer.</span>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-gold" />
                  <span className="text-sm">RPC : app.rpc_tool_upsert</span>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-gold" />
                  <span className="text-sm">RPC : app.rpc_tool_reserve</span>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-gold" />
                  <span className="text-sm">RPC : app.rpc_tool_release</span>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}