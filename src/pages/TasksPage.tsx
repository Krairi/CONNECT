import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Play,
  Save,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { useTasks } from "@/src/hooks/useTasks";
import { ROUTES } from "@/src/constants/routes";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function TasksPage() {
  const navigate = useNavigate();

  const {
    bootstrap,
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

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [effortPoints, setEffortPoints] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [dateFrom, setDateFrom] = useState(todayIsoDate());
  const [dateTo, setDateTo] = useState(todayIsoDate());
  const [taskId, setTaskId] = useState("");
  const [taskInstanceId, setTaskInstanceId] = useState("");
  const [taskExecutionId, setTaskExecutionId] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const canCreate = useMemo(
    () => Boolean(householdId && title.trim()),
    [householdId, title]
  );

  const effectiveTaskId = taskId.trim() || lastCreatedTask?.task_id || "";

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold">
            Chargement des tâches...
          </h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasHousehold || !householdId) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-xs uppercase tracking-[0.35em] text-gold">
            DOMYLI
          </div>
          <h1 className="mt-4 text-4xl font-semibold">Foyer requis</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-alabaster/70">
            Il faut une session authentifiée et un foyer actif pour accéder aux
            tâches.
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

  const handleCreate = async () => {
    setLocalMessage(null);

    try {
      const result = await saveTask({
        p_household_id: householdId,
        p_title: title.trim(),
        p_description: description.trim() || null,
        p_effort_points: effortPoints ? Number(effortPoints) : null,
        p_duration_min: durationMin ? Number(durationMin) : null,
      });

      setTaskId(result.task_id);
      setLocalMessage(`Tâche créée : ${result.task_id}`);
    } catch {
      // déjà géré dans le hook
    }
  };

  const handleGenerate = async () => {
    setLocalMessage(null);

    if (!effectiveTaskId) {
      setLocalMessage("Crée d’abord une tâche ou renseigne un task_id.");
      return;
    }

    try {
      const result = await generateInstances({
        p_task_id: effectiveTaskId,
        p_date_from: dateFrom,
        p_date_to: dateTo,
      });

      if (result.first_instance_id) {
        setTaskInstanceId(result.first_instance_id);
      }

      setLocalMessage(`Instances générées : ${result.generated_count}`);
    } catch {
      // déjà géré dans le hook
    }
  };

  const handleStart = async () => {
    setLocalMessage(null);

    if (!taskInstanceId.trim()) {
      setLocalMessage("Renseigne un task_instance_id.");
      return;
    }

    try {
      const result = await startTaskExecution({
        p_task_instance_id: taskInstanceId.trim(),
      });

      if (result.task_execution_id) {
        setTaskExecutionId(result.task_execution_id);
      }

      setLocalMessage(
        `Exécution démarrée : ${result.task_execution_id ?? "OK"}`
      );
    } catch {
      // déjà géré dans le hook
    }
  };

  const handleComplete = async () => {
    setLocalMessage(null);

    if (!taskExecutionId.trim()) {
      setLocalMessage("Renseigne un task_execution_id.");
      return;
    }

    try {
      const result = await completeTaskExecution({
        p_task_execution_id: taskExecutionId.trim(),
        p_proof_note: proofNote.trim() || null,
      });

      setLocalMessage(
        `Exécution terminée : ${result.task_execution_id ?? taskExecutionId} (${result.status ?? "DONE"})`
      );
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
            <h1 className="mt-2 text-4xl font-semibold">Tasks</h1>
            <p className="mt-3 max-w-2xl text-alabaster/70 leading-8">
              Création, génération, démarrage et clôture d’exécution d’une tâche.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="glass metallic-border rounded-[2rem] p-6">
            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                  Titre
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Passer l’aspirateur"
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                  Description
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Salon + couloir"
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                    Effort points
                  </label>
                  <input
                    value={effortPoints}
                    onChange={(e) => setEffortPoints(e.target.value)}
                    placeholder="3"
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                    Durée (min)
                  </label>
                  <input
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                    placeholder="20"
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreate}
                disabled={!canCreate || creating}
                className="inline-flex w-full items-center justify-center gap-3 border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.25em] text-obsidian disabled:opacity-50"
              >
                <Save size={16} />
                {creating ? "Création..." : "Créer la tâche"}
              </button>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                  Task ID
                </label>
                <input
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  placeholder="UUID de la tâche"
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                    Date début
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                    Date fin
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex w-full items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-50"
              >
                <Sparkles size={16} />
                {generating ? "Génération..." : "Générer les instances"}
              </button>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                  Task Instance ID
                </label>
                <input
                  value={taskInstanceId}
                  onChange={(e) => setTaskInstanceId(e.target.value)}
                  placeholder="UUID de l’instance"
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <button
                type="button"
                onClick={handleStart}
                disabled={starting}
                className="inline-flex w-full items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-50"
              >
                <Play size={16} />
                {starting ? "Démarrage..." : "Démarrer l’exécution"}
              </button>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                  Task Execution ID
                </label>
                <input
                  value={taskExecutionId}
                  onChange={(e) => setTaskExecutionId(e.target.value)}
                  placeholder="UUID de l’exécution"
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-gold/80">
                  Note de preuve
                </label>
                <input
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  placeholder="Photo prise / tâche terminée"
                  className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <button
                type="button"
                onClick={handleComplete}
                disabled={completing}
                className="inline-flex w-full items-center justify-center gap-3 border border-white/10 px-5 py-4 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                {completing ? "Clôture..." : "Clôturer l’exécution"}
              </button>

              {(localMessage || error) && (
                <div className="border border-gold/20 bg-gold/5 px-4 py-4 text-sm text-gold">
                  {localMessage ?? error?.message}
                </div>
              )}
            </div>
          </section>

          <aside className="glass metallic-border rounded-[2rem] p-7">
            <div className="mb-6 flex items-center gap-3 text-gold">
              <ClipboardCheck size={18} />
              <span className="text-xs uppercase tracking-[0.3em]">
                Derniers résultats
              </span>
            </div>

            <div className="space-y-4 text-sm leading-7 text-alabaster/70">
              <div>
                <span className="text-gold">Dernière tâche :</span>{" "}
                {lastCreatedTask?.task_id ?? "—"}
              </div>
              <div>
                <span className="text-gold">Instances générées :</span>{" "}
                {lastGenerated?.generated_count ?? 0}
              </div>
              <div>
                <span className="text-gold">Dernière exécution :</span>{" "}
                {lastStarted?.task_execution_id ?? "—"}
              </div>
              <div>
                <span className="text-gold">Dernier statut :</span>{" "}
                {lastCompleted?.status ?? "—"}
              </div>
            </div>

            <div className="mt-8 border border-white/10 bg-black/20 p-6">
              <h3 className="text-xl font-serif italic">Tâches manipulées</h3>

              {tasks.length === 0 ? (
                <div className="mt-4 text-sm text-alabaster/70">
                  Aucune tâche manipulée dans cette session.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.task_id}
                      className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4"
                    >
                      <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                        {task.status ?? "CREATED"}
                      </div>
                      <div className="mt-2 text-sm text-alabaster">
                        {task.title}
                      </div>
                      <div className="mt-2 text-xs text-alabaster/60">
                        {task.task_id}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}