import { useState } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Save,
  Wrench,
  CalendarClock,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { useDomyliConnection } from "../hooks/useDomyliConnection";
import { useTools } from "../hooks/useTools";
import { navigateTo } from "../lib/navigation";

function toIsoDateTimeLocal(value: string) {
  return value ? value.slice(0, 16) : "";
}

function fromDateTimeLocalToIso(value: string) {
  if (!value) return "";
  return new Date(value).toISOString();
}

function nowLocalPlus(hours: number) {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return toIsoDateTimeLocal(d.toISOString());
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
    saving,
    reserving,
    releasing,
    error,
    tools,
    lastUpsertResult,
    lastReservationId,
    lastReleaseId,
    saveTool,
    reserveToolAsset,
    releaseToolReservation,
  } = useTools();

  const [toolId, setToolId] = useState("");
  const [toolName, setToolName] = useState("");
  const [toolCategory, setToolCategory] = useState("");
  const [toolDescription, setToolDescription] = useState("");
  const [toolIsActive, setToolIsActive] = useState(true);

  const [assetId, setAssetId] = useState("");
  const [assetName, setAssetName] = useState("");
  const [assetStatus, setAssetStatus] = useState("AVAILABLE");
  const [assetNotes, setAssetNotes] = useState("");

  const [reserveAssetId, setReserveAssetId] = useState("");
  const [reserveStartsAt, setReserveStartsAt] = useState(nowLocalPlus(1));
  const [reserveEndsAt, setReserveEndsAt] = useState(nowLocalPlus(2));
  const [reserveTaskInstanceId, setReserveTaskInstanceId] = useState("");
  const [reserveNotes, setReserveNotes] = useState("");

  const [releaseReservationId, setReleaseReservationId] = useState("");
  const [releaseStatus, setReleaseStatus] = useState("RELEASED");

  const [localMessage, setLocalMessage] = useState<string | null>(null);

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

  if (!isAuthenticated || !hasHousehold) {
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

  const handleSaveTool = async () => {
    setLocalMessage(null);

    if (!toolName.trim()) {
      setLocalMessage("Le nom de l’outil est obligatoire.");
      return;
    }

    try {
      const result = await saveTool({
        p_tool_id: toolId.trim() || null,
        p_name: toolName.trim(),
        p_category: toolCategory.trim() || null,
        p_description: toolDescription.trim() || null,
        p_is_active: toolIsActive,
        p_asset_id: assetId.trim() || null,
        p_asset_name: assetName.trim() || null,
        p_asset_status: assetStatus,
        p_asset_notes: assetNotes.trim() || null,
      });

      if (result.tool_id) {
        setToolId(result.tool_id);
      }
      if (result.asset_id) {
        setAssetId(result.asset_id);
        setReserveAssetId(result.asset_id);
      }

      setLocalMessage(
        `Outil enregistré : ${result.tool_id ?? "—"} / Asset : ${result.asset_id ?? "—"}`
      );
    } catch {
      //
    }
  };

  const handleReserve = async () => {
    setLocalMessage(null);

    if (!reserveAssetId.trim()) {
      setLocalMessage("Tool asset ID requis pour réserver.");
      return;
    }

    if (!reserveStartsAt || !reserveEndsAt) {
      setLocalMessage("Fenêtre de réservation obligatoire.");
      return;
    }

    try {
      const reservationId = await reserveToolAsset(
        reserveAssetId.trim(),
        fromDateTimeLocalToIso(reserveStartsAt),
        fromDateTimeLocalToIso(reserveEndsAt),
        reserveTaskInstanceId.trim() || null,
        reserveNotes.trim() || null
      );

      setReleaseReservationId(reservationId);
      setLocalMessage(`Réservation créée : ${reservationId}`);
    } catch {
      //
    }
  };

  const handleRelease = async () => {
    setLocalMessage(null);

    if (!releaseReservationId.trim()) {
      setLocalMessage("Reservation ID requis.");
      return;
    }

    try {
      const reservationId = await releaseToolReservation(
        releaseReservationId.trim(),
        releaseStatus
      );
      setLocalMessage(`Réservation libérée : ${reservationId}`);
    } catch {
      //
    }
  };

  const preloadTool = (
    nextToolId: string,
    nextName: string,
    nextCategory: string,
    nextDescription: string,
    nextIsActive: boolean,
    nextAssetId: string | null,
    nextAssetName: string,
    nextAssetStatus: string,
    nextAssetNotes: string
  ) => {
    setToolId(nextToolId);
    setToolName(nextName);
    setToolCategory(nextCategory);
    setToolDescription(nextDescription);
    setToolIsActive(nextIsActive);
    setAssetId(nextAssetId ?? "");
    setAssetName(nextAssetName);
    setAssetStatus(nextAssetStatus);
    setAssetNotes(nextAssetNotes);
    if (nextAssetId) {
      setReserveAssetId(nextAssetId);
    }
    setLocalMessage(`Édition outil : ${nextToolId}`);
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
            <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Gouvernance matériel</p>
            <h2 className="mt-4 text-4xl font-serif italic">Créer, réserver et libérer un outil</h2>

            <div className="mt-10 grid md:grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Tool ID
                </label>
                <input
                  type="text"
                  value={toolId}
                  onChange={(e) => setToolId(e.target.value)}
                  placeholder="uuid optionnel"
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Nom outil
                </label>
                <input
                  type="text"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  placeholder="Ex: Aspirateur"
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Catégorie
                </label>
                <input
                  type="text"
                  value={toolCategory}
                  onChange={(e) => setToolCategory(e.target.value)}
                  placeholder="Ex: Nettoyage"
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Actif
                </label>
                <select
                  value={toolIsActive ? "true" : "false"}
                  onChange={(e) => setToolIsActive(e.target.value === "true")}
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Description
                </label>
                <textarea
                  value={toolDescription}
                  onChange={(e) => setToolDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50 resize-none"
                />
              </div>
            </div>

            <div className="mt-10 border border-white/10 bg-black/20 p-6">
              <h3 className="text-xl font-serif italic mb-4">Asset lié</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Asset ID
                  </label>
                  <input
                    type="text"
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                    placeholder="uuid optionnel"
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Asset name
                  </label>
                  <input
                    type="text"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    placeholder="Ex: Aspirateur #1"
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Asset status
                  </label>
                  <select
                    value={assetStatus}
                    onChange={(e) => setAssetStatus(e.target.value)}
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="UNAVAILABLE">UNAVAILABLE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="RETIRED">RETIRED</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Asset notes
                  </label>
                  <input
                    type="text"
                    value={assetNotes}
                    onChange={(e) => setAssetNotes(e.target.value)}
                    placeholder="Notes"
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleSaveTool}
                  disabled={saving}
                  className="flex items-center justify-center gap-3 bg-gold px-6 py-4 text-sm font-medium uppercase tracking-[0.25em] text-obsidian transition hover:opacity-90 disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? "Enregistrement..." : "Créer / mettre à jour l’outil"}
                </button>
              </div>
            </div>

            <div className="mt-10 border border-white/10 bg-black/20 p-6">
              <h3 className="text-xl font-serif italic mb-4">Réservation d’un asset</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Tool Asset ID
                  </label>
                  <input
                    type="text"
                    value={reserveAssetId}
                    onChange={(e) => setReserveAssetId(e.target.value)}
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Task Instance ID
                  </label>
                  <input
                    type="text"
                    value={reserveTaskInstanceId}
                    onChange={(e) => setReserveTaskInstanceId(e.target.value)}
                    placeholder="uuid optionnel"
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Starts at
                  </label>
                  <input
                    type="datetime-local"
                    value={reserveStartsAt}
                    onChange={(e) => setReserveStartsAt(e.target.value)}
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Ends at
                  </label>
                  <input
                    type="datetime-local"
                    value={reserveEndsAt}
                    onChange={(e) => setReserveEndsAt(e.target.value)}
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Notes
                  </label>
                  <textarea
                    value={reserveNotes}
                    onChange={(e) => setReserveNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50 resize-none"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleReserve}
                  disabled={reserving}
                  className="border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-50"
                >
                  <CalendarClock size={16} className="inline mr-2" />
                  {reserving ? "Réservation..." : "Réserver l’asset"}
                </button>
              </div>
            </div>

            <div className="mt-10 border border-white/10 bg-black/20 p-6">
              <h3 className="text-xl font-serif italic mb-4">Libération d’une réservation</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Reservation ID
                  </label>
                  <input
                    type="text"
                    value={releaseReservationId}
                    onChange={(e) => setReleaseReservationId(e.target.value)}
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Status
                  </label>
                  <select
                    value={releaseStatus}
                    onChange={(e) => setReleaseStatus(e.target.value)}
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  >
                    <option value="RELEASED">RELEASED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleRelease}
                  disabled={releasing}
                  className="border border-gold/30 px-6 py-4 text-sm uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 size={16} className="inline mr-2" />
                  {releasing ? "Libération..." : "Libérer la réservation"}
                </button>
              </div>
            </div>

            {(localMessage ||
              error ||
              lastUpsertResult ||
              lastReservationId ||
              lastReleaseId) && (
              <div className="mt-8 border border-white/10 bg-black/20 p-4 text-sm text-alabaster/75">
                {localMessage ??
                  error?.message ??
                  (lastUpsertResult
                    ? `Outil enregistré : ${lastUpsertResult.tool_id ?? "—"} / Asset : ${lastUpsertResult.asset_id ?? "—"}`
                    : lastReservationId
                      ? `Réservation créée : ${lastReservationId}`
                      : lastReleaseId
                        ? `Réservation libérée : ${lastReleaseId}`
                        : null)}
              </div>
            )}

            <div className="mt-10 border border-white/10 bg-black/20 p-6">
              <h3 className="text-xl font-serif italic mb-4">Outils manipulés dans cette session</h3>

              {tools.length === 0 ? (
                <div className="text-sm text-alabaster/70">
                  Aucun outil créé ou modifié dans cette session.
                </div>
              ) : (
                <div className="grid gap-4">
                  {tools.map((tool) => (
                    <div
                      key={tool.tool_id}
                      className="border border-white/10 bg-obsidian p-4 grid md:grid-cols-6 gap-4 text-sm"
                    >
                      <div>
                        <div className="text-alabaster/50">Tool ID</div>
                        <div className="mt-1 text-alabaster break-all">{tool.tool_id}</div>
                      </div>
                      <div>
                        <div className="text-alabaster/50">Nom</div>
                        <div className="mt-1 text-alabaster">{tool.name}</div>
                      </div>
                      <div>
                        <div className="text-alabaster/50">Catégorie</div>
                        <div className="mt-1 text-alabaster">{tool.category || "—"}</div>
                      </div>
                      <div>
                        <div className="text-alabaster/50">Asset ID</div>
                        <div className="mt-1 text-alabaster break-all">{tool.asset_id ?? "—"}</div>
                      </div>
                      <div>
                        <div className="text-alabaster/50">Asset status</div>
                        <div className="mt-1 text-alabaster">{tool.asset_status}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            preloadTool(
                              tool.tool_id,
                              tool.name,
                              tool.category,
                              tool.description,
                              tool.is_active,
                              tool.asset_id,
                              tool.asset_name,
                              tool.asset_status,
                              tool.asset_notes
                            )
                          }
                          className="border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
                        >
                          Éditer
                        </button>

                        {tool.asset_id && (
                          <button
                            type="button"
                            onClick={() => {
                              setReserveAssetId(tool.asset_id ?? "");
                              setLocalMessage(`Asset chargé pour réservation : ${tool.asset_id}`);
                            }}
                            className="border border-gold/30 px-4 py-2 text-xs uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
                          >
                            Charger asset
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                Les outils sont maintenant branchés sur les RPC réelles de réservation DOMYLI.
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3 text-sm">
                  <Wrench size={18} className="text-gold" />
                  <span>RPC : app.rpc_tool_upsert</span>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3 text-sm">
                  <CalendarClock size={18} className="text-gold" />
                  <span>RPC : app.rpc_tool_reserve</span>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck size={18} className="text-gold" />
                  <span>RPC : app.rpc_tool_release</span>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}