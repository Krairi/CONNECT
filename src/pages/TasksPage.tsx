import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  House,
  Play,
  Save,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
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
    saveTask,
    generateInstances,
    startTaskExecution,
    completeTaskExecution,
    creating,
    generating,
    starting,
    completing,
    error,
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
  const [taskInstanceId, setTaskInstanceId] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const canCreate = useMemo(() => {
    return Boolean(householdId && title.trim());
  }, [householdId, title]);

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

  if (!isAuthenticated || !hasHousehold || !householdId) {
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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalMessage(null);

    try {
      const result = await saveTask({
        p_household_id: householdId,
        p_title: title.trim(),
        p_description: description.trim() || null,
        p_effort_points: effortPoints !== "" ? Number(effortPoints) : null,
        p_default_duration_min: durationMin !== "" ? Number(durationMin) : null,
        p_required_tools: null,
      });

      setLocalMessage(`Tâche créée : ${result.title}`);
    } catch {
      //
    }
  };

  const handleGenerateInstances = async () => {
    setLocalMessage(null);

    if (!lastCreatedTask?.task_id) {
      setLocalMessage("Créez d’abord une tâche.");
      return;
    }

    try {
      const result = await generateInstances({
        householdId,
        taskId: lastCreatedTask.task_id,
        dateFrom,
        dateTo,
      });

      setLocalMessage(`Instances générées : ${result.generated_count}`);
    } catch {
      //
    }
  };

  const handleStartTask = async () => {
    setLocalMessage(null);

    if (!taskInstanceId.trim()) {
      setLocalMessage("Renseignez un task_instance_id pour démarrer.");
      return;
    }

    try {
      const result = await startTaskExecution({
        householdId,
        taskInstanceId: taskInstanceId.trim(),
      });

      setLocalMessage(`Tâche démarrée : ${result.execution_id}`);
    } catch {
      //
    }
  };

  const handleCompleteTask = async () => {
    setLocalMessage(null);

    if (!taskInstanceId.trim()) {
      setLocalMessage("Renseignez un task_instance_id pour clôturer.");
      return;
    }

    try {
      const result = await completeTaskExecution({
        householdId,
        taskInstanceId: taskInstanceId.trim(),
        proofNote: proofNote.trim() || null,
      });

      setLocalMessage(
        result.run_status === "NOOP"
          ? "Exécution déjà traitée (NOOP)."
          : `Tâche terminée : ${result.execution_id ?? "OK"}`
      );
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
              className="border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors"
            >
              Dashboard
            </button>

            <button
              onClick={() => navigateTo("/inventory")}
              className="border border-gold/40 px-5 py-3 text-xs uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-obsidian transition-colors"
            >
              Inventory
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <section className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 border border-white/10 bg-white/5 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Exécution opérationnelle</p>
            <h2 className="mt-4 text-4xl font-serif italic">Créer et exécuter une tâche</h2>
            <p className="mt-6 text-alabaster/70 leading-relaxed">
              Cette page branche l’expérience DOMYLI sur
              <span className="text-gold"> rpc_task_create</span>,
              <span className="text-gold"> rpc_task_generate_instances</span>,
              <span className="text-gold"> rpc_task_start</span> et
              <span className="text-gold"> rpc_task_done_v2</span>.
            </p>

            <form onSubmit={handleCreateTask} className="mt-10 grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Titre
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Nettoyer la cuisine"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Checklist courte de l’action à réaliser"
                  className="w-full min-h-[120px] border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Effort (points)
                </label>
                <input
                  type="number"
                  value={effortPoints}
                  onChange={(e) => setEffortPoints(e.target.value)}
                  placeholder="3"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                  Durée (min)
                </label>
                <input
                  type="number"
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  placeholder="20"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={!canCreate || creating}
                  className="flex items-center justify-center gap-3 bg-gold px-6 py-4 text-sm font-medium uppercase tracking-[0.25em] text-obsidian transition hover:opacity-90 disabled:opacity-50"
                >
                  <Save size={18} />
                  {creating ? "Création..." : "Créer la tâche"}
                </button>
              </div>
            </form>

            <div className="mt-10 grid md:grid-cols-2 gap-6">
              <div className="border border-white/10 bg-black/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles size={18} className="text-gold" />
                  <h3 className="text-xl font-serif italic">Générer les instances</h3>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
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
                    <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                      Date fin
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateInstances}
                    disabled={generating || !lastCreatedTask?.task_id}
                    className="flex items-center justify-center gap-3 border border-white/10 px-5 py-3 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-50"
                  >
                    <ClipboardCheck size={18} />
                    {generating ? "Génération..." : "Générer les instances"}
                  </button>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Play size={18} className="text-gold" />
                  <h3 className="text-xl font-serif italic">Exécution</h3>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                      Task instance ID
                    </label>
                    <input
                      type="text"
                      value={taskInstanceId}
                      onChange={(e) => setTaskInstanceId(e.target.value)}
                      placeholder="UUID d'instance"
                      className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-alabaster/60">
                      Note de preuve
                    </label>
                    <input
                      type="text"
                      value={proofNote}
                      onChange={(e) => setProofNote(e.target.value)}
                      placeholder="Cuisine nettoyée, surfaces faites"
                      className="w-full border border-white/10 bg-obsidian px-4 py-3 text-sm outline-none focus:border-gold/50"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleStartTask}
                      disabled={starting || !taskInstanceId.trim()}
                      className="flex items-center justify-center gap-3 border border-white/10 px-5 py-3 text-sm uppercase tracking-[0.25em] text-alabaster hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-50"
                    >
                      <Play size={18} />
                      {starting ? "Démarrage..." : "Démarrer"}
                    </button>

                    <button
                      type="button"
                      onClick={handleCompleteTask}
                      disabled={completing || !taskInstanceId.trim()}
                      className="flex items-center justify-center gap-3 bg-gold px-5 py-3 text-sm font-medium uppercase tracking-[0.25em] text-obsidian transition hover:opacity-90 disabled:opacity-50"
                    >
                      <CheckCircle2 size={18} />
                      {completing ? "Clôture..." : "Terminer"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {(localMessage || error || lastCreatedTask || lastGenerated || lastStarted || lastCompleted) && (
              <div className="mt-8 border border-white/10 bg-black/20 p-4 text-sm text-alabaster/75">
                {localMessage ??
                  error?.message ??
                  (lastCreatedTask ? `Tâche créée : ${lastCreatedTask.title}` : null) ??
                  (lastGenerated ? `Instances générées : ${lastGenerated.generated_count}` : null) ??
                  (lastStarted ? `Tâche démarrée : ${lastStarted.execution_id}` : null) ??
                  (lastCompleted ? `Tâche terminée : ${lastCompleted.run_status}` : null)}
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
                  <span>Les tâches structurent l’exécution concrète du foyer.</span>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-gold" />
                  <span className="text-sm">RPC : app.rpc_task_create</span>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-gold" />
                  <span className="text-sm">RPC : app.rpc_task_generate_instances</span>
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-gold" />
                  <span className="text-sm">RPC : app.rpc_task_start / rpc_task_done_v2</span>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}