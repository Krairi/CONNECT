import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ListTodo,
  Play,
  RefreshCw,
  Save,
  Settings2,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useDomyliConnection } from "../hooks/useDomyliConnection";
import { useTasks } from "../hooks/useTasks";
import { navigateTo } from "../lib/navigation";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function TasksPage() {
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
    running,
    error,
    tasks,
    lastTaskId,
    lastGenerateResult,
    lastAutoAssignResult,
    lastDoneResult,
    lastFixDayResult,
    upsertTask,
    runGenerateInstances,
    runAutoAssignDay,
    runAssignTaskInstance,
    runStartTask,
    runDoneTask,
    runSetRecurrence,
    runSetRequiredTools,
    runSetChecklist,
    runFixDay,
  } = useTasks();

  const [taskId, setTaskId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [effortPoints, setEffortPoints] = useState("1");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [startOn, setStartOn] = useState(todayIsoDate());
  const [recurrenceFreq, setRecurrenceFreq] = useState("DAILY");
  const [recurrenceInterval, setRecurrenceInterval] = useState("1");
  const [requiredToolsText, setRequiredToolsText] = useState("[]");
  const [checklistText, setChecklistText] = useState("[]");
  const [instanceTaskId, setInstanceTaskId] = useState("");
  const [generateFrom, setGenerateFrom] = useState(todayIsoDate());
  const [generateTo, setGenerateTo] = useState(todayIsoDate());
  const [assignTaskInstanceId, setAssignTaskInstanceId] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [actionTaskInstanceId, setActionTaskInstanceId] = useState("");
  const [doneNotes, setDoneNotes] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/80">DOMYLI</p>
          <h1 className="mt-4 text-3xl font-serif italic">Chargement des tâches...</h1>
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
            Il faut une session authentifiée et un foyer actif pour accéder aux tâches.
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

  const parseJsonArray = (text: string): unknown[] => {
    try {
      const parsed = JSON.parse(text || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const recurrenceRule = {
    freq: recurrenceFreq,
    interval: Number(recurrenceInterval || "1"),
  };

  const handleUpsertTask = async () => {
    setLocalMessage(null);

    if (!title.trim()) {
      setLocalMessage("Le titre de tâche est obligatoire.");
      return;
    }

    try {
      const createdTaskId = await upsertTask({
        p_task_id: taskId.trim() || null,
        p_title: title.trim(),
        p_description: description.trim() || null,
        p_effort_points: Number(effortPoints || "1"),
        p_estimated_minutes: estimatedMinutes ? Number(estimatedMinutes) : null,
        p_start_on: startOn,
        p_recurrence_rule: recurrenceRule,
        p_required_tools: parseJsonArray(requiredToolsText),
        p_checklist: parseJsonArray(checklistText),
        p_is_active: true,
      });

      setTaskId(createdTaskId);
      setInstanceTaskId(createdTaskId);
      setLocalMessage(`Tâche enregistrée : ${createdTaskId}`);
    } catch {
      //
    }
  };

  const handleGenerateInstances = async () => {
    setLocalMessage(null);

    try {
      const result = await runGenerateInstances(
        instanceTaskId.trim() || null,
        generateFrom,
        generateTo
      );
      setLocalMessage(`Instances générées : ${JSON.stringify(result)}`);
    } catch {
      //
    }
  };

  const handleAutoAssign = async () => {
    setLocalMessage(null);

    try {
      const result = await runAutoAssignDay(generateFrom);
      setLocalMessage(`Auto-assign exécuté : ${JSON.stringify(result)}`);
    } catch {
      //
    }
  };

  const handleAssignTaskInstance = async () => {
    setLocalMessage(null);

    if (!assignTaskInstanceId.trim() || !assignUserId.trim()) {
      setLocalMessage("Task instance ID et User ID sont obligatoires.");
      return;
    }

    try {
      const result = await runAssignTaskInstance(
        assignTaskInstanceId.trim(),
        assignUserId.trim()
      );
      setLocalMessage(`Assignation créée : ${result}`);
    } catch {
      //
    }
  };

  const handleStartTask = async () => {
    setLocalMessage(null);

    if (!actionTaskInstanceId.trim()) {
      setLocalMessage("Task instance ID requis pour démarrer.");
      return;
    }

    try {
      const result = await runStartTask(actionTaskInstanceId.trim());
      setLocalMessage(`Tâche démarrée : ${result}`);
    } catch {
      //
    }
  };

  const handleDoneTask = async () => {
    setLocalMessage(null);

    if (!actionTaskInstanceId.trim()) {
      setLocalMessage("Task instance ID requis pour terminer.");
      return;
    }

    try {
      const result = await runDoneTask(actionTaskInstanceId.trim(), doneNotes.trim() || undefined);
      setLocalMessage(`Tâche terminée : ${JSON.stringify(result)}`);
    } catch {
      //
    }
  };

  const handleSetRecurrence = async () => {
    setLocalMessage(null);

    if (!taskId.trim()) {
      setLocalMessage("Task ID requis.");
      return;
    }

    try {
      const result = await runSetRecurrence(taskId.trim(), startOn, recurrenceRule);
      setLocalMessage(`Récurrence mise à jour : ${result}`);
    } catch {
      //
    }
  };

  const handleSetTools = async () => {
    setLocalMessage(null);

    if (!taskId.trim()) {
      setLocalMessage("Task ID requis.");
      return;
    }

    try {
      const result = await runSetRequiredTools(taskId.trim(), parseJsonArray(requiredToolsText));
      setLocalMessage(`Required tools mis à jour : ${result}`);
    } catch {
      //
    }
  };

  const handleSetChecklist = async () => {
    setLocalMessage(null);

    if (!taskId.trim()) {
      setLocalMessage("Task ID requis.");
      return;
    }

    try {
      const result = await runSetChecklist(taskId.trim(), parseJsonArray(checklistText));
      setLocalMessage(`Checklist mise à jour : ${result}`);
    } catch {
      //
    }
  };

  const handleFixDay = async () => {
    setLocalMessage(null);

    try {
      const result = await runFixDay(generateFrom);
      setLocalMessage(`Fix day exécuté : ${JSON.stringify(result)}`);
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
              <h1 className="text-2xl font-serif italic">Tasks</h1>
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
            <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Orchestration des tâches</p>
            <h2 className="mt-4 text-4xl font-serif italic">Créer et exécuter le flux de tâches</h2>

            <div className="mt-10 grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Task ID
                </label>
                <input
                  type="text"
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  placeholder="uuid optionnel pour update"
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Titre
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Préparer la cuisine"
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50 resize-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Effort points
                </label>
                <input
                  type="number"
                  value={effortPoints}
                  onChange={(e) => setEffortPoints(e.target.value)}
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Estimated minutes
                </label>
                <input
                  type="number"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Start on
                </label>
                <input
                  type="date"
                  value={startOn}
                  onChange={(e) => setStartOn(e.target.value)}
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Recurrence freq
                  </label>
                  <select
                    value={recurrenceFreq}
                    onChange={(e) => setRecurrenceFreq(e.target.value)}
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  >
                    <option value="ONCE">ONCE</option>
                    <option value="DAILY">DAILY</option>
                    <option value="WEEKLY">WEEKLY</option>
                    <option value="MONTHLY">MONTHLY</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Interval
                  </label>
                  <input
                    type="number"
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(e.target.value)}
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Required tools JSON
                </label>
                <textarea
                  value={requiredToolsText}
                  onChange={(e) => setRequiredToolsText(e.target.value)}
                  rows={3}
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50 resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Checklist JSON
                </label>
                <textarea
                  value={checklistText}
                  onChange={(e) => setChecklistText(e.target.value)}
                  rows={3}
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50 resize-none"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleUpsertTask}
                disabled={saving}
                className="flex items-center justify-center gap-3 bg-gold px-6 py-4 text-sm font-medium uppercase tracking-[0.25em] text-obsidian transition hover:opacity-90 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? "Enregistrement..." : "Créer / mettre à jour"}
              </button>

              <button
                type="button"
                onClick={handleSetRecurrence}
                disabled={running}
                className="border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
              >
                <CalendarDays size={16} className="inline mr-2" />
                Set recurrence
              </button>

              <button
                type="button"
                onClick={handleSetTools}
                disabled={running}
                className="border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
              >
                <Wrench size={16} className="inline mr-2" />
                Set tools
              </button>

              <button
                type="button"
                onClick={handleSetChecklist}
                disabled={running}
                className="border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
              >
                <Settings2 size={16} className="inline mr-2" />
                Set checklist
              </button>
            </div>

            <div className="mt-10 border border-white/10 bg-black/20 p-6">
              <h3 className="text-xl font-serif italic mb-4">Instances / exécution</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                    Task ID pour générer
                  </label>
                  <input
                    type="text"
                    value={instanceTaskId}
                    onChange={(e) => setInstanceTaskId(e.target.value)}
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={generateFrom}
                    onChange={(e) => setGenerateFrom(e.target.value)}
                    className="border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                  <input
                    type="date"
                    value={generateTo}
                    onChange={(e) => setGenerateTo(e.target.value)}
                    className="border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={handleGenerateInstances}
                  disabled={running}
                  className="border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
                >
                  <ListTodo size={16} className="inline mr-2" />
                  Generate instances
                </button>

                <button
                  type="button"
                  onClick={handleAutoAssign}
                  disabled={running}
                  className="border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
                >
                  <Sparkles size={16} className="inline mr-2" />
                  Auto assign day
                </button>

                <button
                  type="button"
                  onClick={handleFixDay}
                  disabled={running}
                  className="border border-gold/30 px-6 py-4 text-sm uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
                >
                  <RefreshCw size={16} className="inline mr-2" />
                  Fix day
                </button>
              </div>
            </div>

            <div className="mt-10 border border-white/10 bg-black/20 p-6">
              <h3 className="text-xl font-serif italic mb-4">Assign / Start / Done</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <input
                    type="text"
                    value={assignTaskInstanceId}
                    onChange={(e) => setAssignTaskInstanceId(e.target.value)}
                    placeholder="Task instance ID"
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                  <input
                    type="text"
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                    placeholder="User ID"
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                  <button
                    type="button"
                    onClick={handleAssignTaskInstance}
                    disabled={running}
                    className="w-full border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
                  >
                    Assign task instance
                  </button>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    value={actionTaskInstanceId}
                    onChange={(e) => setActionTaskInstanceId(e.target.value)}
                    placeholder="Task instance ID"
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                  <textarea
                    value={doneNotes}
                    onChange={(e) => setDoneNotes(e.target.value)}
                    rows={3}
                    placeholder="Notes de clôture"
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50 resize-none"
                  />
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleStartTask}
                      disabled={running}
                      className="flex-1 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
                    >
                      <Play size={16} className="inline mr-2" />
                      Start
                    </button>
                    <button
                      type="button"
                      onClick={handleDoneTask}
                      disabled={running}
                      className="flex-1 border border-gold/30 px-6 py-4 text-sm uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
                    >
                      <CheckCircle2 size={16} className="inline mr-2" />
                      Done v2
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {(localMessage ||
              error ||
              lastTaskId ||
              lastGenerateResult ||
              lastAutoAssignResult ||
              lastDoneResult ||
              lastFixDayResult) && (
              <div className="mt-8 border border-white/10 bg-black/20 p-4 text-sm text-alabaster/75">
                {localMessage ??
                  error?.message ??
                  (lastTaskId
                    ? `Tâche enregistrée : ${lastTaskId}`
                    : lastGenerateResult
                      ? `Generate instances : ${JSON.stringify(lastGenerateResult)}`
                      : lastAutoAssignResult
                        ? `Auto assign : ${JSON.stringify(lastAutoAssignResult)}`
                        : lastDoneResult
                          ? `Done v2 : ${JSON.stringify(lastDoneResult)}`
                          : lastFixDayResult
                            ? `Fix day : ${JSON.stringify(lastFixDayResult)}`
                            : null)}
              </div>
            )}

            <div className="mt-10 border border-white/10 bg-black/20 p-6">
              <h3 className="text-xl font-serif italic mb-4">Tâches manipulées dans cette session</h3>

              {tasks.length === 0 ? (
                <div className="text-sm text-alabaster/70">
                  Aucune tâche créée ou modifiée dans cette session.
                </div>
              ) : (
                <div className="grid gap-4">
                  {tasks.map((task) => (
                    <div
                      key={task.task_id}
                      className="border border-white/10 bg-obsidian p-4 grid md:grid-cols-5 gap-4 text-sm"
                    >
                      <div>
                        <div className="text-alabaster/50">Task ID</div>
                        <div className="mt-1 text-alabaster break-all">{task.task_id}</div>
                      </div>
                      <div>
                        <div className="text-alabaster/50">Titre</div>
                        <div className="mt-1 text-alabaster">{task.title}</div>
                      </div>
                      <div>
                        <div className="text-alabaster/50">Effort</div>
                        <div className="mt-1 text-alabaster">{task.effort_points}</div>
                      </div>
                      <div>
                        <div className="text-alabaster/50">Start on</div>
                        <div className="mt-1 text-alabaster">{task.start_on}</div>
                      </div>
                      <div>
                        <div className="text-alabaster/50">Active</div>
                        <div className="mt-1 text-alabaster">{task.is_active ? "Oui" : "Non"}</div>
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
                Les tâches sont désormais branchées sur les RPC réelles d’orchestration DOMYLI.
              </div>

              <div className="border border-white/10 bg-black/20 p-4 text-sm">
                RPC : `rpc_task_create`, `rpc_task_generate_instances`, `rpc_task_auto_assign_day`
              </div>

              <div className="border border-white/10 bg-black/20 p-4 text-sm">
                RPC : `rpc_task_instance_assign`, `rpc_task_start`, `rpc_task_done_v2`
              </div>

              <div className="border border-white/10 bg-black/20 p-4 text-sm">
                RPC : `rpc_task_set_recurrence`, `rpc_task_required_tools_set`, `rpc_task_checklist_set`, `rpc_fix_day_v2`
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}