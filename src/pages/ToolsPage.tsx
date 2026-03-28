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
import { useAuth } from "@/src/providers/AuthProvider";
import { useTools } from "@/src/hooks/useTools";
import { navigateTo } from "@/src/lib/navigation";
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
} from "@/src/constants/toolCatalog";
import { ROUTES } from "@/src/constants/routes";

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
    <span className="inline-flex items-center rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gold">
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
    bootstrapLoading,
  } = useAuth();

  const {
    saving,
    reserving,
    releasing,
    error,
    tools,
    assets,
    openReservations,
    lastUpsertResult,
    lastReservationId,
    lastReleaseId,
    saveTool,
    reserveToolAsset,
    releaseToolReservation,
  } = useTools();

  const [selectedToolId, setSelectedToolId] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [templateCode, setTemplateCode] = useState("");
  const [operatorNotes, setOperatorNotes] = useState("");
  const [toolIsActive, setToolIsActive] = useState(true);

  const [assetName, setAssetName] = useState("");
  const [assetStatus, setAssetStatus] =
    useState<ToolAssetStatusCode>("AVAILABLE");
  const [assetNotes, setAssetNotes] = useState("");

  const [reserveAssetId, setReserveAssetId] = useState("");
  const [reserveStartsAt, setReserveStartsAt] = useState(nowLocalPlus(1));
  const [reserveEndsAt, setReserveEndsAt] = useState(nowLocalPlus(2));
  const [reserveNotes, setReserveNotes] = useState("");

  const [releaseReservationId, setReleaseReservationId] = useState("");
  const [releaseStatus, setReleaseStatus] =
    useState<ToolReleaseStatusCode>("RELEASED");

  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const templateOptions = useMemo(
    () => getToolTemplatesByCategory(categoryCode),
    [categoryCode],
  );

  const selectedTemplate = useMemo(
    () => getToolTemplateByCode(templateCode),
    [templateCode],
  );

  const selectedTool = useMemo(
    () => tools.find((tool) => tool.tool_id === selectedToolId) ?? null,
    [tools, selectedToolId],
  );

  const selectedReserveAsset = useMemo(
    () => assets.find((asset) => asset.asset_id === reserveAssetId) ?? null,
    [assets, reserveAssetId],
  );

  const selectedReleaseReservation = useMemo(
    () =>
      openReservations.find(
        (reservation) => reservation.reservation_id === releaseReservationId,
      ) ?? null,
    [openReservations, releaseReservationId],
  );

  useEffect(() => {
    if (lastReservationId && !releaseReservationId) {
      setReleaseReservationId(lastReservationId);
    }
  }, [lastReservationId, releaseReservationId]);

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            DOMYLI
          </p>
          <h1 className="mt-4 text-3xl font-semibold">
            Chargement des outils...
          </h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            DOMYLI
          </p>
          <h1 className="mt-4 text-3xl font-semibold">Foyer requis</h1>
          <p className="mt-3 text-white/70">
            Il faut une session authentifiée et un foyer actif pour accéder aux
            outils.
          </p>
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.HOME)}
            className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-black"
          >
            Retour à l’accueil
          </button>
        </div>
      </div>
    );
  }

  const handleCategoryChange = (nextCategoryCode: string) => {
    setCategoryCode(nextCategoryCode);
    setTemplateCode("");
    setOperatorNotes("");
    setAssetName("");
    setAssetNotes("");
    setLocalMessage(null);
  };

  const handleTemplateChange = (nextTemplateCode: string) => {
    setTemplateCode(nextTemplateCode);
    setLocalMessage(null);

    const template = getToolTemplateByCode(nextTemplateCode);

    if (template) {
      setAssetName(template.defaultAssetName);
    }
  };

  const resetCreationState = () => {
    setSelectedToolId("");
    setCategoryCode("");
    setTemplateCode("");
    setOperatorNotes("");
    setToolIsActive(true);
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
        p_tool_id: selectedToolId || null,
        p_name: selectedTemplate.label,
        p_category: getToolCategoryLabel(categoryCode),
        p_description: buildToolDescription(selectedTemplate, operatorNotes),
        p_is_active: toolIsActive,
        p_asset_id: selectedTool?.asset_id ?? null,
        p_asset_name: (assetName.trim() || selectedTemplate.defaultAssetName).trim(),
        p_asset_status: assetStatus,
        p_asset_notes: assetNotes.trim() || null,
      });

      setLocalMessage(
        `Outil enregistré : ${selectedTemplate.label} · asset ${result.asset_id ?? "—"}`,
      );

      if (!selectedToolId) {
        resetCreationState();
      }
    } catch {
      // erreur gérée par le hook
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
        reserveNotes.trim() || null,
      );

      setReleaseReservationId(reservationId);
      setLocalMessage(`Réservation créée : ${reservationId}`);
    } catch {
      // erreur gérée par le hook
    }
  };

  const handleRelease = async () => {
    setLocalMessage(null);

    if (!releaseReservationId.trim()) {
      setLocalMessage("Sélectionne une réservation à libérer.");
      return;
    }

    try {
      const reservationId = await releaseToolReservation(
        releaseReservationId.trim(),
        releaseStatus,
      );

      setLocalMessage(`Réservation libérée : ${reservationId}`);
    } catch {
      // erreur gérée par le hook
    }
  };

  const preloadTool = (
    nextToolId: string,
    nextName: string,
    nextCategory: string,
    nextDescription: string,
    nextIsActive: boolean,
    nextAssetName: string,
    nextAssetStatus: string,
    nextAssetNotes: string,
  ) => {
    const inferredCategoryCode = inferToolCategoryCodeFromLabel(nextCategory);
    const inferredTemplateCode = inferToolTemplateCodeFromDraft(
      nextName,
      nextCategory,
    );

    setSelectedToolId(nextToolId);
    setCategoryCode(inferredCategoryCode);
    setTemplateCode(inferredTemplateCode);
    setOperatorNotes(extractToolOperatorNotes(nextDescription));
    setToolIsActive(nextIsActive);
    setAssetName(nextAssetName);
    setAssetStatus((nextAssetStatus as ToolAssetStatusCode) || "AVAILABLE");
    setAssetNotes(nextAssetNotes);
    setLocalMessage(`Édition outil : ${nextToolId}`);
  };

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <button
                type="button"
                onClick={() => navigateTo(ROUTES.DASHBOARD)}
                className="mt-1 inline-flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
                aria-label="Retour"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.24em] text-gold">
                  DOMYLI
                </p>
                <h1 className="mt-4 text-3xl font-semibold">Tools</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                  Ici, les outils ne sont pas de simples objets libres. Ce sont
                  des ressources gouvernées du foyer, réservables, libérables et
                  rattachées à l’exécution réelle.
                </p>
              </div>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-gold">
              <Wrench className="h-4 w-4" />
              Gouvernance matériel
            </div>

            <h2 className="mt-6 text-2xl font-semibold">
              Créer, réserver et libérer un outil gouverné
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
              Sélectionne une catégorie métier puis un outil canonique DOMYLI.
              L’asset est ensuite piloté par statut et peut être réservé dans
              une fenêtre temporelle traçable.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Outil existant</span>
                <select
                  value={selectedToolId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedToolId(nextId);

                    const tool =
                      tools.find((item) => item.tool_id === nextId) ?? null;

                    if (!tool) {
                      resetCreationState();
                      return;
                    }

                    preloadTool(
                      tool.tool_id,
                      tool.name,
                      tool.category,
                      tool.description,
                      tool.is_active,
                      tool.asset_name,
                      tool.asset_status,
                      tool.asset_notes,
                    );
                  }}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  <option value="">Créer un nouvel outil</option>
                  {tools.map((tool) => (
                    <option key={tool.tool_id} value={tool.tool_id}>
                      {tool.name} · {tool.asset_name || "sans asset"}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Catégorie métier</span>
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
              </label>

              <label className="block text-sm text-white/80 md:col-span-2">
                <span className="mb-2 block">Outil canonique</span>
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
              </label>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5 md:col-span-2">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Lecture outil
                </p>
                <p className="mt-3 text-sm leading-7 text-white/80">
                  {selectedTemplate?.description ??
                    "Sélectionne un outil canonique pour afficher sa lecture métier DOMYLI."}
                </p>

                {selectedTemplate?.flows?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedTemplate.flows.map((flow) => (
                      <FlowBadge
                        key={flow}
                        label={getToolFlowLabel(flow)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Actif</span>
                <select
                  value={toolIsActive ? "true" : "false"}
                  onChange={(e) => setToolIsActive(e.target.value === "true")}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  <option value="true">Actif</option>
                  <option value="false">Inactif</option>
                </select>
              </label>

              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Nom asset</span>
                <input
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder={selectedTemplate?.defaultAssetName ?? "Nom asset"}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </label>

              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Statut asset</span>
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
              </label>

              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Notes asset</span>
                <input
                  value={assetNotes}
                  onChange={(e) => setAssetNotes(e.target.value)}
                  placeholder="Commentaire opérateur asset"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </label>

              <label className="block text-sm text-white/80 md:col-span-2">
                <span className="mb-2 block">Notes opérateur outil</span>
                <textarea
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  rows={4}
                  placeholder="Ex. utiliser uniquement pour entretien salle de bain."
                  className="w-full resize-none border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </label>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleSaveTool}
                disabled={saving}
                className="inline-flex items-center justify-center gap-3 bg-gold px-6 py-4 text-sm uppercase tracking-[0.25em] text-black transition hover:opacity-90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Enregistrement..." : "Enregistrer l’outil"}
              </button>

              <button
                type="button"
                onClick={resetCreationState}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Reset
              </button>
            </div>

            <div className="mt-10 rounded-[28px] border border-white/10 bg-black/20 p-6">
              <div className="flex items-center gap-3 text-gold/85">
                <CalendarClock className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Réservation contrôlée
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-white/80 md:col-span-2">
                  <span className="mb-2 block">Asset à réserver</span>
                  <select
                    value={reserveAssetId}
                    onChange={(e) => setReserveAssetId(e.target.value)}
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  >
                    <option value="">Sélectionner un asset contrôlé</option>
                    {assets.map((asset) => (
                      <option key={asset.asset_id} value={asset.asset_id}>
                        {asset.asset_name} · {asset.tool_name} ·{" "}
                        {getToolAssetStatusLabel(asset.asset_status)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Début</span>
                  <input
                    type="datetime-local"
                    value={reserveStartsAt}
                    onChange={(e) => setReserveStartsAt(e.target.value)}
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </label>

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Fin</span>
                  <input
                    type="datetime-local"
                    value={reserveEndsAt}
                    onChange={(e) => setReserveEndsAt(e.target.value)}
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </label>

                <label className="block text-sm text-white/80 md:col-span-2">
                  <span className="mb-2 block">Notes réservation</span>
                  <textarea
                    value={reserveNotes}
                    onChange={(e) => setReserveNotes(e.target.value)}
                    rows={3}
                    placeholder="Commentaire opérateur réservation"
                    className="w-full resize-none border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </label>
              </div>

              {selectedReserveAsset ? (
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/80">
                  Asset sélectionné : {selectedReserveAsset.asset_name} ·{" "}
                  {selectedReserveAsset.tool_name} ·{" "}
                  {getToolAssetStatusLabel(selectedReserveAsset.asset_status)}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleReserve}
                  disabled={reserving}
                  className="inline-flex items-center justify-center gap-3 border border-gold/30 px-6 py-4 text-sm uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {reserving ? "Réservation..." : "Réserver"}
                </button>
              </div>
            </div>

            <div className="mt-10 rounded-[28px] border border-white/10 bg-black/20 p-6">
              <div className="flex items-center gap-3 text-gold/85">
                <ClipboardList className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Libération contrôlée
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-white/80 md:col-span-2">
                  <span className="mb-2 block">Réservation à libérer</span>
                  <select
                    value={releaseReservationId}
                    onChange={(e) => setReleaseReservationId(e.target.value)}
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  >
                    <option value="">Sélectionner une réservation contrôlée</option>
                    {openReservations.map((reservation) => (
                      <option
                        key={reservation.reservation_id}
                        value={reservation.reservation_id}
                      >
                        {reservation.asset_name} · {reservation.tool_name} ·{" "}
                        {toIsoDateTimeLocal(reservation.starts_at)} →{" "}
                        {toIsoDateTimeLocal(reservation.ends_at)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Statut de libération</span>
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
                </label>
              </div>

              {selectedReleaseReservation ? (
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/80">
                  Réservation sélectionnée : {selectedReleaseReservation.tool_name} ·{" "}
                  {selectedReleaseReservation.asset_name} · statut actuel{" "}
                  {selectedReleaseReservation.status}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleRelease}
                  disabled={releasing}
                  className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-white transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {releasing ? "Libération..." : "Libérer"}
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
                  (lastReleaseId
                    ? `Réservation libérée : ${lastReleaseId}`
                    : lastReservationId
                      ? `Réservation créée : ${lastReservationId}`
                      : lastUpsertResult?.tool_id
                        ? `Outil enregistré : ${lastUpsertResult.tool_id}`
                        : null)}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <ShieldCheck className="h-5 w-5" />
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
                  <div className="mt-3 text-2xl">
                    {activeMembership?.role ?? "—"}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Super Admin
                  </div>
                  <div className="mt-3 text-2xl">
                    {bootstrap?.is_super_admin ? "Oui" : "Non"}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Outils session
                  </div>
                  <div className="mt-3 text-2xl">{tools.length}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Assets contrôlés
                  </div>
                  <div className="mt-3 text-2xl">{assets.length}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Réservations ouvertes
                  </div>
                  <div className="mt-3 text-2xl">{openReservations.length}</div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <ClipboardList className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Éléments contrôlés
                </span>
              </div>

              <div className="space-y-4">
                {assets.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5 text-white/70">
                    Aucun asset contrôlé pour le moment.
                  </div>
                ) : (
                  assets.map((asset) => (
                    <div
                      key={asset.asset_id}
                      className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
                    >
                      <div className="text-sm text-white">{asset.asset_name}</div>
                      <div className="mt-2 text-xs text-white/60">
                        {asset.tool_name} · {asset.category} ·{" "}
                        {getToolAssetStatusLabel(asset.asset_status)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => navigateTo(ROUTES.TASKS)}
                className="mt-8 inline-flex w-full items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Continuer vers Tasks
                <ArrowRight className="h-4 w-4" />
              </button>

              {selectedReleaseReservation ? (
                <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm text-white/80">
                  Libération préparée : {selectedReleaseReservation.tool_name} ·{" "}
                  {selectedReleaseReservation.asset_name} · futur statut{" "}
                  {getToolReleaseStatusLabel(releaseStatus)}
                </div>
              ) : null}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}