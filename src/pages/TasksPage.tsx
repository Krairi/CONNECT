import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Play,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTasks } from "@/src/hooks/useTasks";
import { ROUTES } from "@/src/constants/routes";
import {
  buildTaskDescription,
  getTaskAreaLabel,
  getTaskFlowLabel,
  getTaskStatusLabel,
  getTaskTemplateByCode,
  getTaskTemplatesByArea,
  inferTaskTemplateCodeFromTitle,
  TASK_AREA_OPTIONS,
} from "@/src/constants/taskCatalog";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function FlowBadge({ flow }: { flow: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gold">
      {getTaskFlowLabel(flow)}
    </span>
  );
}

export default function TasksPage() {
  const navigate = useNavigate();
  const {
    bootstrap,
    activeMembership,
    sessionEmail,
    isAuthenticated,
    hasHousehold,
    authLoading,
    bootstrapLoading,
  } = useAuth();

  const {
    refresh,
    saveTask,
    generateInstances,
    startTaskExecution,
    completeTaskExecution,
    loading,
    creating,
    generating,
    starting,
    completing,
    error,
    tasks,
    instances,
    lastCreatedTask,
    lastGenerated,
    lastStarted,
    lastCompleted,
  } = useTasks();

  const householdId = bootstrap?.active_household_id ?? null;

  const [areaCode, setAreaCode] = useState("");
  const [templateCode, setTemplateCode] = useState("");
  const [operatorNotes, setOperatorNotes] = useState("");
  const [startOn, setStartOn] = useState(todayIsoDate());
  const [dateFrom, setDateFrom] = useState(todayIsoDate());
  const [dateTo, setDateTo] = useState(todayIsoDate());
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedTaskInstanceId, setSelectedTaskInstanceId] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const templateOptions = useMemo(
    () => getTaskTemplatesByArea(areaCode),
    [areaCode],
  );

  const selectedTemplate = useMemo(
    () => getTaskTemplateByCode(templateCode),
    [templateCode],
  );

  const selectedTask = useMemo(
    () => tasks.find((task) => task.task_id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  );

  const taskInstances = useMemo(
    () => instances.filter((item) => item.task_id === selectedTaskId),
    [instances, selectedTaskId],
  );

  const selectedInstance = useMemo(
    () =>
      taskInstances.find(
        (instance) => instance.task_instance_id === selectedTaskInstanceId,
      ) ?? null,
    [taskInstances, selectedTaskInstanceId],
  );

  const canCreate = useMemo(() => {
    return Boolean(householdId && selectedTemplate);
  }, [householdId, selectedTemplate]);

  if (authLoading || bootstrapLoading || loading) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            DOMYLI
          </p>
          <h1 className="mt-4 text-3xl font-semibold">Chargement des tâches...</h1>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !hasHousehold || !householdId) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            DOMYLI
          </p>
          <h1 className="mt-4 text-3xl font-semibold">Foyer requis</h1>
          <p className="mt-3 text-white/70">
            Il faut une session authentifiée et un foyer actif pour accéder aux tâches.
          </p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-black"
          >
            Retour à l’accueil
          </button>
        </div>
      </main>
    );
  }

  const handleAreaChange = (nextAreaCode: string) => {
    setAreaCode(nextAreaCode);
    setTemplateCode("");
    setOperatorNotes("");
    setLocalMessage(null);
  };

  const handleTemplateChange = (nextTemplateCode: string) => {
    setTemplateCode(nextTemplateCode);
    setLocalMessage(null);
  };

  const handleCreate = async () => {
    setLocalMessage(null);

    if (!selectedTemplate) {
      setLocalMessage("Sélectionne un template DOMYLI.");
      return;
    }

    try {
      const result = await saveTask({
        p_task_id: null,
        p_title: selectedTemplate.label,
        p_description: buildTaskDescription(selectedTemplate, operatorNotes),
        p_effort_points: selectedTemplate.defaultEffortPoints,
        p_estimated_minutes: selectedTemplate.defaultDurationMin,
        p_start_on: startOn,
        p_recurrence_rule: null,
        p_required_tools: [],
        p_checklist: [],
        p_is_active: true,
      });

      setSelectedTaskId(result.task_id);
      setLocalMessage(`Tâche créée : ${result.task_id}`);
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  const handleGenerate = async () => {
    setLocalMessage(null);

    if (!selectedTaskId) {
      setLocalMessage("Sélectionne d’abord une tâche persistée.");
      return;
    }

    try {
      const result = await generateInstances({
        p_task_id: selectedTaskId,
        p_date_from: dateFrom,
        p_date_to: dateTo,
      });

      if (result.first_instance_id) {
        setSelectedTaskInstanceId(result.first_instance_id);
      }

      setLocalMessage(`Instances générées : ${result.generated_count}`);
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  const handleStart = async () => {
    setLocalMessage(null);

    if (!selectedTaskInstanceId) {
      setLocalMessage("Sélectionne d’abord une instance de tâche.");
      return;
    }

    try {
      const result = await startTaskExecution({
        p_task_instance_id: selectedTaskInstanceId,
      });

      setLocalMessage(
        `Exécution démarrée : ${result.task_execution_id ?? "OK"}`,
      );
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  const handleComplete = async () => {
    setLocalMessage(null);

    if (!selectedTaskInstanceId) {
      setLocalMessage("Sélectionne d’abord une instance de tâche.");
      return;
    }

    const inferredTemplate =
      selectedTemplate ??
      getTaskTemplateByCode(inferTaskTemplateCodeFromTitle(selectedTask?.title));

    try {
      const result = await completeTaskExecution({
        p_task_instance_id: selectedTaskInstanceId,
        p_notes: proofNote.trim() || null,
        p_proof_payload: {
          proof_note: proofNote.trim() || null,
          template_code: inferredTemplate?.code ?? null,
          proof_guideline: inferredTemplate?.defaultProofGuideline ?? null,
        },
      });

      setLocalMessage(
        `Exécution terminée : ${result.task_instance_id ?? selectedTaskInstanceId} (${result.status ?? "DONE"})`,
      );
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  const handlePickTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setSelectedTaskInstanceId("");
    setLocalMessage(null);

    const task = tasks.find((entry) => entry.task_id === taskId);
    if (!task) return;

    const inferredTemplateCode = inferTaskTemplateCodeFromTitle(task.title);
    const inferredTemplate = getTaskTemplateByCode(inferredTemplateCode);

    setTemplateCode(inferredTemplateCode);

    if (inferredTemplate) {
      setAreaCode(inferredTemplate.areaCode);
    }
  };

  const handleRefresh = async () => {
    setLocalMessage(null);

    try {
      await refresh();
      setLocalMessage("Lecture tasks actualisée.");
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <button
                type="button"
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="mt-1 inline-flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
                aria-label="Retour"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.24em] text-gold">
                  DOMYLI
                </p>
                <h1 className="mt-4 text-3xl font-semibold">Tasks</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                  Ici, une tâche n’est plus une simple manipulation de session.
                  C’est une unité d’exécution persistée, générée en instances,
                  démarrée puis clôturée avec preuve traçable.
                </p>
              </div>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-gold">
              <ClipboardCheck className="h-4 w-4" />
              Exécution gouvernée
            </div>

            <h2 className="mt-6 text-2xl font-semibold">
              Créer, générer, démarrer et prouver une tâche canonique
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
              Le titre, l’effort et la preuve attendue viennent du template DOMYLI.
              L’instance sélectionnée pilote ensuite le démarrage et la clôture.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Zone métier</span>
                <select
                  value={areaCode}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  <option value="">Sélectionner une zone métier</option>
                  {TASK_AREA_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Template de tâche</span>
                <select
                  value={templateCode}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  disabled={!areaCode}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {areaCode
                      ? "Sélectionner une tâche canonique"
                      : "Choisir d’abord une zone métier"}
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
                  Lecture template
                </p>

                <p className="mt-3 text-sm leading-7 text-white/80">
                  {selectedTemplate?.description ??
                    "Sélectionne un template pour afficher sa lecture métier DOMYLI."}
                </p>

                {selectedTemplate ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                        Effort canonique
                      </p>
                      <p className="mt-2 text-lg text-white">
                        {selectedTemplate.defaultEffortPoints} pts
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                        Durée canonique
                      </p>
                      <p className="mt-2 text-lg text-white">
                        {selectedTemplate.defaultDurationMin} min
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                        Preuve attendue
                      </p>
                      <p className="mt-2 text-sm text-white/80">
                        {selectedTemplate.defaultProofGuideline}
                      </p>
                    </div>
                  </div>
                ) : null}

                {selectedTemplate?.flows?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedTemplate.flows.map((flow) => (
                      <FlowBadge key={flow} flow={flow} />
                    ))}
                  </div>
                ) : null}
              </div>

              <label className="block text-sm text-white/80 md:col-span-2">
                <span className="mb-2 block">Note foyer optionnelle</span>
                <textarea
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  rows={4}
                  placeholder="Ex. priorité au salon avant l’arrivée d’invités."
                  className="w-full resize-none border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </label>

              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Date start_on</span>
                <input
                  type="date"
                  value={startOn}
                  onChange={(e) => setStartOn(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </label>

              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Date début génération</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </label>

              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Date fin génération</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </label>

              <label className="block text-sm text-white/80 md:col-span-2">
                <span className="mb-2 block">Tâche persistée</span>
                <select
                  value={selectedTaskId}
                  onChange={(e) => handlePickTask(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  <option value="">Sélectionner une tâche contrôlée</option>
                  {tasks.map((task) => (
                    <option key={task.task_id} value={task.task_id}>
                      {task.title} · {task.task_id}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-white/80 md:col-span-2">
                <span className="mb-2 block">Instance contrôlée</span>
                <select
                  value={selectedTaskInstanceId}
                  onChange={(e) => setSelectedTaskInstanceId(e.target.value)}
                  disabled={!selectedTaskId}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {selectedTaskId
                      ? "Sélectionner une instance"
                      : "Choisir d’abord une tâche"}
                  </option>
                  {taskInstances.map((instance) => (
                    <option
                      key={instance.task_instance_id}
                      value={instance.task_instance_id}
                    >
                      {instance.task_instance_id}
                      {instance.scheduled_for ? ` · ${instance.scheduled_for}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-white/80 md:col-span-2">
                <span className="mb-2 block">Note de preuve</span>
                <textarea
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  rows={3}
                  placeholder="Ex. action terminée, zone contrôlée, résultat visible."
                  className="w-full resize-none border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </label>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleCreate}
                disabled={!canCreate || creating}
                className="inline-flex items-center justify-center gap-3 bg-gold px-6 py-4 text-sm uppercase tracking-[0.24em] text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {creating ? "Création..." : "Créer la tâche"}
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center justify-center gap-3 border border-gold/30 px-6 py-4 text-sm uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {generating ? "Génération..." : "Générer les instances"}
              </button>

              <button
                type="button"
                onClick={handleStart}
                disabled={starting}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {starting ? "Démarrage..." : "Démarrer l’exécution"}
              </button>

              <button
                type="button"
                onClick={handleComplete}
                disabled={completing}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {completing ? "Clôture..." : "Clôturer avec preuve"}
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                <RefreshCw className="h-4 w-4" />
                Rafraîchir
              </button>
            </div>

            {(localMessage || error) && (
              <div className="mt-8 border border-gold/20 bg-gold/10 px-5 py-4 text-lg text-gold">
                {localMessage ?? error?.message}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <Settings2 className="h-5 w-5" />
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
                    Zone métier
                  </div>
                  <div className="mt-3 text-2xl">{getTaskAreaLabel(areaCode)}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Template sélectionné
                  </div>
                  <div className="mt-3 text-lg">{selectedTemplate?.label ?? "—"}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Cycle contrôlé
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-white/75">
                    <div>task_id : {selectedTaskId || lastCreatedTask?.task_id || "—"}</div>
                    <div>
                      instance_id : {selectedTaskInstanceId || lastGenerated?.first_instance_id || "—"}
                    </div>
                    <div>
                      status instance : {getTaskStatusLabel(selectedInstance?.status)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-white/45">
                  <ShieldCheck className="h-4 w-4 text-gold/80" />
                  <span className="text-sm">
                    Tâche gouvernée DOMYLI : template canonique, instance contrôlée, preuve traçable.
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <ClipboardCheck className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Tâches persistées
                </span>
              </div>

              {tasks.length === 0 ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5 text-white/70">
                  Aucune tâche persistée pour le moment.
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => {
                    const inferredTemplateCode = inferTaskTemplateCodeFromTitle(task.title);
                    const inferredTemplate = getTaskTemplateByCode(inferredTemplateCode);

                    return (
                      <div
                        key={task.task_id}
                        className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
                      >
                        <div className="text-lg text-white">{task.title}</div>
                        <div className="mt-2 text-sm text-white/60">
                          {task.description ?? "Description non renseignée."}
                        </div>

                        {inferredTemplate?.flows?.length ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {inferredTemplate.flows.map((flow) => (
                              <FlowBadge key={`${task.task_id}-${flow}`} flow={flow} />
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => handlePickTask(task.task_id)}
                            className="inline-flex items-center justify-center gap-2 border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-white transition-colors hover:border-gold/40 hover:text-gold"
                          >
                            Sélectionner
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm text-white/80">
                {lastStarted?.task_execution_id ? (
                  <div>Dernier démarrage : {lastStarted.task_execution_id}</div>
                ) : null}
                {lastCompleted?.proof_id ? (
                  <div className={lastStarted?.task_execution_id ? "mt-2" : ""}>
                    Dernière preuve : {lastCompleted.proof_id}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => navigate(ROUTES.STATUS)}
                className="mt-8 inline-flex w-full items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Continuer vers Status
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}