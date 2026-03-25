import { useMemo, useState } from "react";
import { ArrowLeft, CalendarClock, Hammer, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/contexts/AuthContext";
import { useTools } from "@/src/hooks/useTools";
import { ROUTES } from "@/src/constants/routes";

function toDatetimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60000);
  return adjusted.toISOString().slice(0, 16);
}

export default function ToolsPage() {
  const navigate = useNavigate();
  const { bootstrap, isAuthenticated, hasHousehold, authLoading, bootstrapLoading } =
    useAuth();

  const { saveTool, reserveToolSlot, releaseToolSlot, saving, reserving, releasing, error, lastSavedTool, lastReservation, lastRelease } =
    useTools();

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

  const canSave = useMemo(() => Boolean(householdId && toolName.trim()), [householdId, toolName]);

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-white px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/70">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold text-white">
            Chargement des outils...
          </h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold || !householdId) {
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
            Il faut une session authentifiée et un foyer actif pour accéder aux outils.
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

  const handleSaveTool = async () => {
    setLocalMessage(null);

    try {
      const result = await saveTool({
        name: toolName.trim(),
        category: toolCategory.trim() || null,
      });

      setLocalMessage(`Outil enregistré : ${result.tool_name}`);
      setToolName("");
      setToolCategory("");
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  const handleReserve = async () => {
    setLocalMessage(null);

    if (!toolAssetId.trim()) {
      setLocalMessage("Renseignez un tool_asset_id.");
      return;
    }

    try {
      const result = await reserveToolSlot({
        toolAssetId: toolAssetId.trim(),
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
      });

      setReservationId(result.reservation_id);
      setLocalMessage(`Réservation créée : ${result.reservation_id}`);
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  const handleRelease = async () => {
    setLocalMessage(null);

    if (!reservationId.trim()) {
      setLocalMessage("Renseignez un reservation_id.");
      return;
    }

    try {
      const result = await releaseToolSlot(reservationId.trim());
      setLocalMessage(
        result.released
          ? `Réservation libérée : ${result.reservation_id}`
          : "Libération non confirmée."
      );
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-white px-6 py-10">
      <div className="mx-auto max-w-7xl">
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
            <h1 className="mt-2 text-4xl font-semibold text-white">Tools</h1>
            <p className="mt-3 text-sm leading-7 text-white/65">
              Enregistrement d’outil et réservation de créneau.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="border border-white/10 bg-white/[0.03] p-6">
            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                  Nom outil
                </label>
                <input
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  placeholder="Aspirateur"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                  Catégorie
                </label>
                <input
                  value={toolCategory}
                  onChange={(e) => setToolCategory(e.target.value)}
                  placeholder="Ménage"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveTool}
                disabled={!canSave || saving}
                className="inline-flex w-full items-center justify-center gap-3 border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.25em] text-obsidian disabled:opacity-50"
              >
                <Hammer size={16} />
                {saving ? "Enregistrement..." : "Enregistrer l’outil"}
              </button>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                  Tool Asset ID
                </label>
                <input
                  value={toolAssetId}
                  onChange={(e) => setToolAssetId(e.target.value)}
                  placeholder="UUID du tool_asset"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                    Début
                  </label>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                    Fin
                  </label>
                  <input
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleReserve}
                disabled={reserving}
                className="inline-flex w-full items-center justify-center gap-3 border border-gold/40 px-5 py-4 text-sm uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors disabled:opacity-50"
              >
                <CalendarClock size={16} />
                {reserving ? "Réservation..." : "Réserver le créneau"}
              </button>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/70">
                  Reservation ID
                </label>
                <input
                  value={reservationId}
                  onChange={(e) => setReservationId(e.target.value)}
                  placeholder="UUID de réservation"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <button
                type="button"
                onClick={handleRelease}
                disabled={releasing}
                className="inline-flex w-full items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.25em] text-white hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-50"
              >
                <Wrench size={16} />
                {releasing ? "Libération..." : "Libérer la réservation"}
              </button>

              {(localMessage || error) && (
                <div className="border border-gold/20 bg-gold/5 px-4 py-4 text-sm text-gold/90">
                  {localMessage ?? error?.message}
                </div>
              )}
            </div>
          </section>

          <aside className="border border-white/10 bg-white/[0.03] p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-gold/70">
              Derniers résultats
            </div>

            <div className="mt-6 space-y-4 text-sm leading-7 text-white/70">
              <div>
                <span className="text-gold">Dernier outil :</span>{" "}
                {lastSavedTool?.tool_name ?? "—"}
              </div>
              <div>
                <span className="text-gold">Dernière réservation :</span>{" "}
                {lastReservation?.reservation_id ?? "—"}
              </div>
              <div>
                <span className="text-gold">Dernière libération :</span>{" "}
                {lastRelease?.reservation_id ?? "—"}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}