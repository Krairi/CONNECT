import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Save,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { useDomyliConnection } from "../hooks/useDomyliConnection";
import { useTools } from "../hooks/useTools";
import { navigateTo } from "../lib/navigation";
import {
  buildToolDescription,
  extractToolOperatorNotes,
  getToolAssetStatusLabel,
  getToolAssetStatusOptions,
  getToolCategoryLabel,
  getToolFlowLabel,
  getToolReleaseStatusLabel,
  getToolReleaseStatusOptions,
  getToolTemplateByCode,
  getToolTemplatesByCategory,
  inferToolCategoryCodeFromLabel,
  inferToolTemplateCodeFromDraft,
  TOOL_CATEGORY_OPTIONS,
  type ToolAssetStatusCode,
  type ToolReleaseStatusCode,
} from "../constants/toolCatalog";

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

function FlowBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center border border-gold/30 bg-gold/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gold">
      {label}
    </span>
  );
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
  const [categoryCode, setCategoryCode] = useState("");
  const [templateCode, setTemplateCode] = useState("");
  const [operatorNotes, setOperatorNotes] = useState("");
  const [toolIsActive, setToolIsActive] = useState(true);

  const [assetId, setAssetId] = useState("");
  const [assetName, setAssetName] = useState("");
  const [assetStatus, setAssetStatus] =
    useState<ToolAssetStatusCode>("AVAILABLE");
  const [assetNotes, setAssetNotes] = useState("");

  const [reserveAssetId, setReserveAssetId] = useState("");
  const [reserveStartsAt, setReserveStartsAt] = useState(nowLocalPlus(1));
  const [reserveEndsAt, setReserveEndsAt] = useState(nowLocalPlus(2));
  const [reserveTaskInstanceId, setReserveTaskInstanceId] = useState("");
  const [reserveNotes, setReserveNotes] = useState("");

  const [releaseReservationId, setReleaseReservationId] = useState("");
  const [releaseStatus, setReleaseStatus] =
    useState<ToolReleaseStatusCode>("RELEASED");

  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const templateOptions = useMemo(
    () => getToolTemplatesByCategory(categoryCode),
    [categoryCode]
  );

  const selectedTemplate = useMemo(
    () => getToolTemplateByCode(templateCode),
    [templateCode]
  );

  const sessionAssets = useMemo(
    () =>
      tools.filter((tool) => Boolean(tool.asset_id)).map((tool) => ({
        tool_id: tool.tool_id,
        tool_name: tool.name,
        category: tool.category,
        asset_id: tool.asset_id as string,
        asset_name: tool.asset_name,
        asset_status: tool.asset_status,
        asset_notes: tool.asset_notes,
      })),
    [tools]
  );

  const selectedReserveAsset = useMemo(
    () => sessionAssets.find((asset) => asset.asset_id === reserveAssetId) ?? null,
    [sessionAssets, reserveAssetId]
  );

  useEffect(() => {
    if (lastReservationId && !releaseReservationId) {
      setReleaseReservationId(lastReservationId);
    }
  }, [lastReservationId, releaseReservationId]);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl border border-gold/20 bg-black/40 p-8">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/80">
            DOMYLI
          </div>
          <h1 className="mt-4 text-3xl font-semibold">Chargement des outils...</h1>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl border border-gold/20 bg-black/40 p-8">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/80">
            DOMYLI
          </div>
          <h1 className="mt-4 text-3xl font-semibold">Foyer requis</h1>
          <p className="mt-4 text-white/70">
            Il faut une session authentifiée et un foyer actif pour accéder aux outils.
          </p>

          <button
            type="button"
            onClick={() => navigateTo("/")}
            className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-black"
          >
            Retour à l’accueil
          </button>
        </div>
      </main>
    );
  }

  const handleCategoryChange = (nextCategoryCode: string) => {
    setCategoryCode(nextCategoryCode);
    setTemplateCode("");
    setOperatorNotes("");
    setLocalMessage(null);
  };

  const handleTemplateChange = (nextTemplateCode: string) => {
    setTemplateCode(nextTemplateCode);
    setLocalMessage(null);

    const template = getToolTemplateByCode(nextTemplateCode);
    if (template && !assetId) {
      setAssetName(template.defaultAssetName);
    }
  };

  const resetCreationState = () => {
    setToolId("");
    setCategoryCode("");
    setTemplateCode("");
    setOperatorNotes("");
    setToolIsActive(true);
    setAssetId("");
    setAssetName("");
    setAssetStatus("AVAILABLE");
    setAssetNotes("");
  };

  const handleSaveTool = async () => {
    setLocalMessage(null);

    if (!selectedTemplate) {
      setLocalMessage("Sélectionne une catégorie puis un outil canonique.");
      return;
    }

    try {
      const result = await saveTool({
        p_tool_id: toolId.trim() || null,
        p_name: selectedTemplate.label,
        p_category: getToolCategoryLabel(categoryCode),
        p_description: buildToolDescription(selectedTemplate, operatorNotes),
        p_is_active: toolIsActive,
        p_asset_id: assetId.trim() || null,
        p_asset_name: (assetName.trim() || selectedTemplate.defaultAssetName).trim(),
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
        `Outil enregistré : ${selectedTemplate.label} · asset ${result.asset_id ?? "—"}`
      );
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  const handleReserve = async () => {
    setLocalMessage(null);

    if (!reserveAssetId.trim()) {
      setLocalMessage("Sélectionne un asset à réserver.");
      return;
    }

    if (!reserveStartsAt || !reserveEndsAt) {
      setLocalMessage("La fenêtre de réservation est obligatoire.");
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
      // erreur déjà gérée par le hook
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
      // erreur déjà gérée par le hook
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
    const inferredCategoryCode = inferToolCategoryCodeFromLabel(nextCategory);
    const inferredTemplateCode = inferToolTemplateCodeFromDraft(
      nextName,
      nextCategory
    );

    setToolId(nextToolId);
    setCategoryCode(inferredCategoryCode);
    setTemplateCode(inferredTemplateCode);
    setOperatorNotes(extractToolOperatorNotes(nextDescription));
    setToolIsActive(nextIsActive);

    setAssetId(nextAssetId ?? "");
    setAssetName(nextAssetName);
    setAssetStatus((nextAssetStatus as ToolAssetStatusCode) || "AVAILABLE");
    setAssetNotes(nextAssetNotes);

    if (nextAssetId) {
      setReserveAssetId(nextAssetId);
    }

    setLocalMessage(`Édition outil : ${nextToolId}`);
  };

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigateTo("/dashboard")}
              className="mt-1 inline-flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
              aria-label="Retour"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="mt-6 text-xs uppercase tracking-[0.35em] text-gold/80">
              DOMYLI
            </div>
            <h1 className="mt-3 text-4xl font-semibold">Tools</h1>
            <p className="mt-3 max-w-3xl text-white/65">
              Ici, les outils ne sont pas de simples objets libres. Ce sont des
              ressources gouvernées du foyer, réservables, libérables et
              rattachées à l’exécution réelle.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
            <div className="mb-6 flex items-center gap-3 text-gold/85">
              <Wrench className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.35em]">
                Gouvernance matériel
              </span>
            </div>

            <h2 className="text-3xl font-semibold">
              Créer, réserver et libérer un outil gouverné
            </h2>

            <p className="mt-6 max-w-3xl text-lg leading-9 text-white/65">
              Sélectionne une catégorie métier puis un outil canonique DOMYLI.
              L’asset est ensuite piloté par statut et peut être réservé dans une
              fenêtre temporelle traçable.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Catégorie métier
                </label>
                <select
                  value={categoryCode}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {TOOL_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Outil canonique
                </label>
                <select
                  value={templateCode}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  disabled={!categoryCode}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {categoryCode
                      ? "Sélectionner un outil canonique"
                      : "Choisir d’abord une catégorie"}
                  </option>
                  {templateOptions.map((template) => (
                    <option key={template.code} value={template.code}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                  Lecture outil
                </div>
                <div className="mt-3 text-white/75">
                  {selectedTemplate?.description ??
                    "Sélectionne un outil canonique pour afficher sa lecture métier DOMYLI."}
                </div>

                {selectedTemplate?.flows?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedTemplate.flows.map((flow) => (
                      <FlowBadge key={flow} label={getToolFlowLabel(flow)} />
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Actif
                </label>
                <select
                  value={String(toolIsActive)}
                  onChange={(e) => setToolIsActive(e.target.value === "true")}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  <option value="true">Actif</option>
                  <option value="false">Inactif</option>
                </select>
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Asset ID
                </label>
                <input
                  type="text"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  placeholder="uuid optionnel"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Nom asset
                </label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder={selectedTemplate?.defaultAssetName ?? "Nom asset"}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Statut asset
                </label>
                <select
                  value={assetStatus}
                  onChange={(e) =>
                    setAssetStatus(e.target.value as ToolAssetStatusCode)
                  }
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  {getToolAssetStatusOptions().map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Note foyer outil
                </label>
                <textarea
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  rows={3}
                  placeholder="Ex: à privilégier pour le nettoyage du salon."
                  className="w-full resize-none border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Note asset
                </label>
                <input
                  type="text"
                  value={assetNotes}
                  onChange={(e) => setAssetNotes(e.target.value)}
                  placeholder="Ex: câble neuf, batterie faible, bac remplacé."
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleSaveTool}
                disabled={saving}
                className="inline-flex items-center justify-center gap-3 bg-gold px-6 py-4 text-sm uppercase tracking-[0.24em] text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Enregistrement..." : "Créer / mettre à jour l’outil"}
              </button>

              <button
                type="button"
                onClick={resetCreationState}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Reset création
              </button>

              <button
                type="button"
                onClick={() => navigateTo("/dashboard")}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-10 rounded-[1.5rem] border border-white/10 bg-black/20 p-6">
              <h3 className="mb-4 text-xl italic">Réservation d’un asset</h3>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                    Asset à réserver
                  </label>
                  <select
                    value={reserveAssetId}
                    onChange={(e) => setReserveAssetId(e.target.value)}
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  >
                    <option value="">Sélectionner un asset connu</option>
                    {sessionAssets.map((asset) => (
                      <option key={asset.asset_id} value={asset.asset_id}>
                        {asset.asset_name || asset.tool_name} · {getToolAssetStatusLabel(asset.asset_status)} · {asset.asset_id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                    Début
                  </label>
                  <input
                    type="datetime-local"
                    value={reserveStartsAt}
                    onChange={(e) => setReserveStartsAt(e.target.value)}
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                    Fin
                  </label>
                  <input
                    type="datetime-local"
                    value={reserveEndsAt}
                    onChange={(e) => setReserveEndsAt(e.target.value)}
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                    Task Instance ID
                  </label>
                  <input
                    type="text"
                    value={reserveTaskInstanceId}
                    onChange={(e) => setReserveTaskInstanceId(e.target.value)}
                    placeholder="uuid optionnel"
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                    Note réservation
                  </label>
                  <input
                    type="text"
                    value={reserveNotes}
                    onChange={(e) => setReserveNotes(e.target.value)}
                    placeholder="Ex: réservé pour tâche cuisine."
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              {selectedReserveAsset && (
                <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-black/30 px-5 py-4 text-sm text-white/75">
                  Asset sélectionné : {selectedReserveAsset.asset_name || selectedReserveAsset.tool_name} ·{" "}
                  {getToolAssetStatusLabel(selectedReserveAsset.asset_status)}
                </div>
              )}

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleReserve}
                  disabled={reserving}
                  className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CalendarClock className="h-4 w-4" />
                  {reserving ? "Réservation..." : "Réserver l’asset"}
                </button>
              </div>
            </div>

            <div className="mt-10 rounded-[1.5rem] border border-white/10 bg-black/20 p-6">
              <h3 className="mb-4 text-xl italic">Libération d’une réservation</h3>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                    Reservation ID
                  </label>
                  <input
                    type="text"
                    value={releaseReservationId}
                    onChange={(e) => setReleaseReservationId(e.target.value)}
                    placeholder="uuid réservation"
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                    Statut de libération
                  </label>
                  <select
                    value={releaseStatus}
                    onChange={(e) =>
                      setReleaseStatus(e.target.value as ToolReleaseStatusCode)
                    }
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  >
                    {getToolReleaseStatusOptions().map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleRelease}
                  disabled={releasing}
                  className="inline-flex items-center justify-center gap-3 border border-gold/30 px-6 py-4 text-sm uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {releasing ? "Libération..." : "Libérer la réservation"}
                </button>
              </div>
            </div>

            {(localMessage ||
              error ||
              lastUpsertResult ||
              lastReservationId ||
              lastReleaseId) && (
              <div className="mt-8 border border-gold/20 bg-gold/10 px-5 py-4 text-base text-gold">
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
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <ClipboardList className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Lecture métier DOMYLI
                </span>
              </div>

              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Email
                  </div>
                  <div className="mt-3 text-2xl">{sessionEmail ?? "—"}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Foyer
                  </div>
                  <div className="mt-3 text-2xl">
                    {activeMembership?.household_name ?? "—"}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Rôle
                  </div>
                  <div className="mt-3 text-2xl">{activeMembership?.role ?? "—"}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Catégorie
                  </div>
                  <div className="mt-3 text-2xl">{getToolCategoryLabel(categoryCode)}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Outil canonique
                  </div>
                  <div className="mt-3 text-lg">{selectedTemplate?.label ?? "—"}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Statut asset
                  </div>
                  <div className="mt-3 text-lg">{getToolAssetStatusLabel(assetStatus)}</div>
                </div>

                {selectedTemplate?.flows?.length ? (
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                    <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                      Flux impactés
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedTemplate.flows.map((flow) => (
                        <FlowBadge key={flow} label={getToolFlowLabel(flow)} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex items-center gap-3 text-white/45">
                <ShieldCheck className="h-4 w-4 text-gold/80" />
                <span className="text-sm">
                  Tools gouvernés DOMYLI : outil canonique, asset lisible, réservation traçable.
                </span>
              </div>
            </section>

            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <Wrench className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Outils manipulés
                </span>
              </div>

              {tools.length === 0 ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5 text-white/70">
                  Aucun outil créé ou modifié dans cette session.
                </div>
              ) : (
                <div className="space-y-4">
                  {tools.map((tool) => (
                    <div
                      key={tool.tool_id}
                      className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                            {tool.category || "Outil"}
                          </div>
                          <div className="mt-2 text-lg">{tool.name}</div>
                          <div className="mt-2 text-xs text-white/60">
                            {tool.is_active ? "Actif" : "Inactif"} · asset{" "}
                            {getToolAssetStatusLabel(tool.asset_status)}
                          </div>
                        </div>

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
                          className="inline-flex items-center justify-center gap-2 border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-white transition-colors hover:border-gold/40 hover:text-gold"
                        >
                          Éditer
                        </button>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <div className="text-xs uppercase tracking-[0.22em] text-gold/70">
                            Asset
                          </div>
                          <div className="mt-2 text-sm text-white/75">
                            {tool.asset_name || "—"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs uppercase tracking-[0.22em] text-gold/70">
                            Asset ID
                          </div>
                          <div className="mt-2 break-all text-sm text-white/75">
                            {tool.asset_id ?? "—"}
                          </div>
                        </div>
                      </div>

                      {tool.asset_id && (
                        <button
                          type="button"
                          onClick={() => {
                            setReserveAssetId(tool.asset_id ?? "");
                            setLocalMessage(`Asset sélectionné : ${tool.asset_name || tool.name}`);
                          }}
                          className="mt-4 inline-flex items-center justify-center gap-2 border border-gold/30 px-4 py-3 text-xs uppercase tracking-[0.18em] text-gold transition-colors hover:bg-gold/10"
                        >
                          Utiliser pour réservation
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5 text-sm text-white/75">
                <div>Dernière réservation : {lastReservationId ?? "—"}</div>
                <div className="mt-2">
                  Dernière libération :{" "}
                  {lastReleaseId
                    ? `${lastReleaseId} · ${getToolReleaseStatusLabel(releaseStatus)}`
                    : "—"}
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}