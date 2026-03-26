import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Play,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { useTasks } from "@/src/hooks/useTasks";
import { ROUTES } from "@/src/constants/routes";
import {
  buildTaskDescription,
  extractTaskOperatorNotes,
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
    <span className="inline-flex items-center border border-gold/30 bg-gold/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gold">
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
    saveTask,
    generateInstances,
    startTaskExecution,
    completeTaskExecution,
    creating,
    generating,
    starting,
    completing,
    error,
    tasks,
    lastCreatedTask,
    lastGenerated,
    lastStarted,
    lastCompleted,
  } = useTasks();

  const householdId = bootstrap?.active_household_id ?? null;

  const [areaCode, setAreaCode] = useState("");
  const [templateCode, setTemplateCode] = useState("");
  const [operatorNotes, setOperatorNotes] = useState("");
  const [dateFrom, setDateFrom] = useState(todayIsoDate());
  const [dateTo, setDateTo] = useState(todayIsoDate());
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedTaskInstanceId, setSelectedTaskInstanceId] = useState("");
  const [selectedTaskExecutionId, setSelectedTaskExecutionId] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const templateOptions = useMemo(
    () => getTaskTemplatesByArea(areaCode),
    [areaCode]
  );

  const selectedTemplate = useMemo(
    () => getTaskTemplateByCode(templateCode),
    [templateCode]
  );

  const effectiveTaskId = selectedTaskId.trim() || lastCreatedTask?.task_id || "";
  const effectiveTaskInstanceId =
    selectedTaskInstanceId.trim() || lastGenerated?.first_instance_id || "";
  const effectiveTaskExecutionId =
    selectedTaskExecutionId.trim() || lastStarted?.task_execution_id || "";

  const canCreate = useMemo(() => {
    return Boolean(householdId && selectedTemplate);
  }, [householdId, selectedTemplate]);

  if (authLoading || bootstrapLoading) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl border border-gold/20 bg-black/40 p-8">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/80">DOMYLI</div>
          <h1 className="mt-4 text-3xl font-semibold">Chargement des tâches...</h1>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !hasHousehold || !householdId) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl border border-gold/20 bg-black/40 p-8">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/80">DOMYLI</div>
          <h1 className="mt-4 text-3xl font-semibold">Foyer requis</h1>
          <p className="mt-4 text-white/70">
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
        p_household_id: householdId,
        p_title: selectedTemplate.label,
        p_description: buildTaskDescription(selectedTemplate, operatorNotes),
        p_effort_points: selectedTemplate.defaultEffortPoints,
        p_duration_min: selectedTemplate.defaultDurationMin,
      });

      setSelectedTaskId(result.task_id);
      setLocalMessage(`Tâche créée : ${result.task_id}`);
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  const handleGenerate = async () => {
    setLocalMessage(null);

    if (!effectiveTaskId) {
      setLocalMessage("Crée d’abord une tâche canonique.");
      return;
    }

    try {
      const result = await generateInstances({
        p_task_id: effectiveTaskId,
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

    if (!effectiveTaskInstanceId) {
      setLocalMessage("Génère d’abord une instance de tâche.");
      return;
    }

    try {
      const result = await startTaskExecution({
        p_task_instance_id: effectiveTaskInstanceId,
      });

      if (result.task_execution_id) {
        setSelectedTaskExecutionId(result.task_execution_id);
      }

      setLocalMessage(
        `Exécution démarrée : ${result.task_execution_id ?? "OK"}`
      );
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  const handleComplete = async () => {
    setLocalMessage(null);

    if (!effectiveTaskExecutionId) {
      setLocalMessage("Démarre d’abord une exécution.");
      return;
    }

    try {
      const result = await completeTaskExecution({
        p_task_execution_id: effectiveTaskExecutionId,
        p_proof_note: proofNote.trim() || null,
      });

      setLocalMessage(
        `Exécution terminée : ${result.task_execution_id ?? effectiveTaskExecutionId} (${result.status ?? "DONE"})`
      );
    } catch {
      // erreur déjà gérée par le hook
    }
  };

  const handlePickTask = (taskId: string) => {
    const task = tasks.find((entry) => entry.task_id === taskId);
    if (!task) return;

    setSelectedTaskId(task.task_id);
    setSelectedTaskInstanceId(task.task_instance_id ?? "");
    setSelectedTaskExecutionId(task.task_execution_id ?? "");
    setTemplateCode(inferTaskTemplateCodeFromTitle(task.title));
    setOperatorNotes(extractTaskOperatorNotes(task.description));
    setLocalMessage(`Tâche sélectionnée : ${task.task_id}`);
  };

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="mt-1 inline-flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
              aria-label="Retour"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="mt-6 text-xs uppercase tracking-[0.35em] text-gold/80">
              DOMYLI
            </div>
            <h1 className="mt-3 text-4xl font-semibold">Tasks</h1>
            <p className="mt-3 max-w-3xl text-white/65">
              Ici, une tâche n’est pas une simple ligne libre. C’est une action
              canonique du foyer, cadrée par une zone métier, un niveau d’effort,
              une durée attendue et une preuve d’exécution.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
            <div className="mb-6 flex items-center gap-3 text-gold/85">
              <Wrench className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.35em]">
                Exécution gouvernée
              </span>
            </div>

            <h2 className="text-3xl font-semibold">Créer et exécuter une tâche canonique</h2>

            <p className="mt-6 max-w-3xl text-lg leading-9 text-white/65">
              Sélectionne une zone métier puis un template DOMYLI. Le titre,
              l’effort et la durée sont normalisés, puis la tâche suit son cycle
              création → génération → démarrage → clôture.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Zone métier
                </label>
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
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Template de tâche
                </label>
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
              </div>

              <div className="md:col-span-2 rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                  Lecture template
                </div>
                <div className="mt-3 text-white/75">
                  {selectedTemplate?.description ??
                    "Sélectionne un template pour afficher sa lecture métier DOMYLI."}
                </div>

                {selectedTemplate ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.22em] text-gold/70">
                        Effort canonique
                      </div>
                      <div className="mt-2 text-xl">
                        {selectedTemplate.defaultEffortPoints} pts
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.22em] text-gold/70">
                        Durée canonique
                      </div>
                      <div className="mt-2 text-xl">
                        {selectedTemplate.defaultDurationMin} min
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.22em] text-gold/70">
                        Preuve attendue
                      </div>
                      <div className="mt-2 text-sm text-white/75">
                        {selectedTemplate.defaultProofGuideline}
                      </div>
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

              <div className="md:col-span-2">
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Note foyer optionnelle
                </label>
                <textarea
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  rows={4}
                  placeholder="Ex: priorité au salon avant l’arrivée d’invités."
                  className="w-full resize-none border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Date début génération
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Date fin génération
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Note de preuve
                </label>
                <textarea
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  rows={3}
                  placeholder="Ex: action terminée, zone contrôlée, résultat visible."
                  className="w-full resize-none border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>
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
                {completing ? "Clôture..." : "Clôturer l’exécution"}
              </button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Dashboard
                <ArrowRight className="h-4 w-4" />
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
                    IDs de cycle
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-white/75">
                    <div>task_id : {effectiveTaskId || "—"}</div>
                    <div>instance_id : {effectiveTaskInstanceId || "—"}</div>
                    <div>execution_id : {effectiveTaskExecutionId || "—"}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 text-white/45">
                <ShieldCheck className="h-4 w-4 text-gold/80" />
                <span className="text-sm">
                  Tâche gouvernée DOMYLI : template canonique, effort lisible, preuve traçable.
                </span>
              </div>
            </section>

            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <ClipboardCheck className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Tâches manipulées
                </span>
              </div>

              {tasks.length === 0 ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5 text-white/70">
                  Aucune tâche manipulée dans cette session.
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
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                              {inferredTemplate
                                ? getTaskAreaLabel(inferredTemplate.areaCode)
                                : "Tâche"}
                            </div>
                            <div className="mt-2 text-lg">{task.title}</div>
                            <div className="mt-2 text-xs text-white/60">
                              {getTaskStatusLabel(task.status)}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handlePickTask(task.task_id)}
                            className="inline-flex items-center justify-center gap-2 border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-white transition-colors hover:border-gold/40 hover:text-gold"
                          >
                            Sélectionner
                          </button>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <div className="text-xs uppercase tracking-[0.22em] text-gold/70">
                              Effort
                            </div>
                            <div className="mt-2 text-sm text-white/75">
                              {task.effort_points ?? "—"} pts
                            </div>
                          </div>

                          <div>
                            <div className="text-xs uppercase tracking-[0.22em] text-gold/70">
                              Durée
                            </div>
                            <div className="mt-2 text-sm text-white/75">
                              {task.duration_min ?? "—"} min
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 space-y-3 rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5 text-sm text-white/75">
                <div>Dernière tâche : {lastCreatedTask?.task_id ?? "—"}</div>
                <div>Instances générées : {lastGenerated?.generated_count ?? 0}</div>
                <div>Dernière exécution : {lastStarted?.task_execution_id ?? "—"}</div>
                <div>Dernier statut : {lastCompleted?.status ?? "—"}</div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedTaskId("");
                  setSelectedTaskInstanceId("");
                  setSelectedTaskExecutionId("");
                  setLocalMessage(null);
                }}
                className="mt-6 inline-flex w-full items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                <TimerReset className="h-4 w-4" />
                Réinitialiser la sélection
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}