import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Filter,
  ImageIcon,
  PlayCircle,
  ShieldAlert,
  Sparkles,
  Wrench,
} from "lucide-react";

import { useTaskLibrary } from "@/src/hooks/useTaskLibrary";
import { useTaskRuntime } from "@/src/hooks/useTaskRuntime";
import { useHouseholdProfileOptions } from "@/src/hooks/useHouseholdProfileOptions";
import type { PlannedTaskInstance } from "@/src/services/tasks/taskRuntimeService";
import type { TaskLibraryItem } from "@/src/services/tasks/taskLibraryService";

type Tone = "neutral" | "warning" | "danger" | "success";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getToneClasses(tone: Tone): string {
  switch (tone) {
    case "danger":
      return "border-red-400/35 bg-red-400/12 text-red-100";
    case "warning":
      return "border-amber-400/35 bg-amber-400/12 text-amber-100";
    case "success":
      return "border-emerald-400/30 bg-emerald-400/12 text-emerald-100";
    default:
      return "border-white/15 bg-white/8 text-white/80";
  }
}

function ToneBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${getToneClasses(tone)}`}>
      {label}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon: typeof BookOpenCheck;
  tone?: Tone;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
        </div>
        <div className={`rounded-2xl border p-3 ${getToneClasses(tone)}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function getFitLabel(value: string): string {
  switch (value) {
    case "OK":
      return "Compatible";
    case "WARNING":
      return "À valider";
    case "BLOCKED":
      return "Bloqué";
    default:
      return "Lecture foyer";
  }
}

function getFitTone(value: string): Tone {
  switch (value) {
    case "OK":
      return "success";
    case "WARNING":
      return "warning";
    case "BLOCKED":
      return "danger";
    default:
      return "neutral";
  }
}

function getToolTone(value: string): Tone {
  switch (value) {
    case "READY":
      return "success";
    case "MISSING":
      return "danger";
    default:
      return "neutral";
  }
}

function getExecutionTone(value: string | null | undefined): Tone {
  switch (String(value ?? "").toUpperCase()) {
    case "DONE":
    case "COMPLETED":
      return "success";
    case "STARTED":
    case "IN_PROGRESS":
    case "RUNNING":
      return "warning";
    default:
      return "neutral";
  }
}

function TaskCard({
  item,
  isSelected,
  onSelect,
}: {
  item: TaskLibraryItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[28px] border p-5 text-left transition ${
        isSelected
          ? "border-gold/45 bg-gold/10 shadow-[0_24px_60px_rgba(212,175,55,0.08)]"
          : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-lg font-semibold text-white">{item.title}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.16em] text-white/45">
            {item.zone_label} · {item.family_label}
          </div>
        </div>
        <ToneBadge label={getFitLabel(item.fit_status)} tone={getFitTone(item.fit_status)} />
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-6 text-white/70">{item.short_description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.hero_badges.slice(0, 3).map((badge) => (
          <ToneBadge key={`${item.task_template_code}-${badge.code}`} label={badge.label} />
        ))}
        <ToneBadge label={`${item.estimated_duration_minutes} min`} />
      </div>
    </button>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-black/20 p-5">
      <div className="mb-4 text-[11px] uppercase tracking-[0.24em] text-gold/80">{title}</div>
      {children}
    </section>
  );
}

function DetailStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-gold/20 bg-gold/10 p-3 text-gold">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">{label}</div>
          <div className="mt-1 text-sm font-medium text-white">{value}</div>
        </div>
      </div>
    </div>
  );
}

function InstanceCard({
  item,
  busy,
  onStart,
  onComplete,
}: {
  item: PlannedTaskInstance;
  busy: boolean;
  onStart: () => void;
  onComplete: () => void;
}) {
  const executionLabel = item.execution_status || item.status;
  const canStart = !item.task_execution_id && !["DONE", "COMPLETED"].includes(String(item.status).toUpperCase());
  const canComplete = Boolean(item.task_execution_id) && !["DONE", "COMPLETED"].includes(String(executionLabel).toUpperCase());

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{item.task_title}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/40">
            {item.task_template_code || "CATALOGUE"} · {item.profile_label}
          </div>
        </div>
        <ToneBadge label={executionLabel || "Planifiée"} tone={getExecutionTone(executionLabel)} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">Date prévue</div>
          <div className="mt-2 text-sm text-white">{item.planned_for}</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">Instance</div>
          <div className="mt-2 break-all text-sm text-white/80">{item.task_instance_id}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onStart}
          disabled={!canStart || busy}
          className="inline-flex items-center justify-center rounded-full border border-gold/30 bg-gold/15 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-gold transition hover:border-gold/50 hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Démarrer
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={!canComplete || busy}
          className="inline-flex items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/12 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-emerald-100 transition hover:border-emerald-400/45 hover:bg-emerald-400/18 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Clôturer
        </button>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const {
    loading,
    detailLoading,
    error,
    detailError,
    items,
    detail,
    zoneCode,
    frequencyCode,
    profileId,
    selectedTaskTemplateCode,
    summary,
    zoneOptions,
    frequencyOptions,
    setZoneCode,
    setFrequencyCode,
    setProfileId,
    setSelectedTaskTemplateCode,
    refresh,
  } = useTaskLibrary();

  const {
    contextLoading,
    feedLoading,
    planning,
    starting,
    completing,
    contextError,
    feedError,
    actionError,
    context,
    feed,
    instancesByTemplate,
    lastPlanningReceipt,
    lastStartReceipt,
    lastCompleteReceipt,
    planTaskFromLibrary,
    startTaskInstance,
    completeTaskExecution,
  } = useTaskRuntime({
    taskTemplateCode: selectedTaskTemplateCode,
    profileId,
  });

  const profileOptions = useHouseholdProfileOptions();
  const [dateFrom, setDateFrom] = useState(todayIsoDate());
  const [dateTo, setDateTo] = useState(todayIsoDate());

  const selectedProfileLabel = useMemo(() => {
    const matched = profileOptions.options.find((entry) => entry.id === profileId);
    return matched?.label ?? "Lecture foyer";
  }, [profileId, profileOptions.options]);

  const runtimeSummary = useMemo(() => feed.summary, [feed.summary]);
  const actionBusy = planning || starting || completing;

  return (
    <main className="min-h-screen bg-[#070b11] text-white">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8 px-6 py-10 lg:px-10">
        <header className="overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.16),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-[11px] uppercase tracking-[0.28em] text-gold/80">Tasks runtime · DOMYLI</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight text-white xl:text-[3.2rem]">
                Planifie, démarre et clôture une tâche publiée sans champ libre, avec outils requis et capacité visible.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">
                Ici, une tâche n’est plus une simple fiche. Elle devient une exécution gouvernée reliée à un profil,
                à une bibliothèque publiée, à une capacité lisible et à des outils requis contrôlés.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void refresh();
              }}
              className="inline-flex items-center justify-center rounded-full border border-gold/30 bg-gold/15 px-5 py-3 text-sm font-medium text-gold transition hover:border-gold/50 hover:bg-gold/20"
            >
              Recharger la bibliothèque
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Tâches publiées" value={String(summary.total)} icon={BookOpenCheck} />
          <SummaryCard label="Instances planifiées" value={String(runtimeSummary.planned)} icon={CalendarDays} tone="warning" />
          <SummaryCard label="Exécutions démarrées" value={String(runtimeSummary.started)} icon={PlayCircle} tone="warning" />
          <SummaryCard label="Exécutions terminées" value={String(runtimeSummary.done)} icon={CheckCircle2} tone="success" />
        </section>

        {error ? (
          <section className="rounded-[28px] border border-rose-400/25 bg-rose-400/10 p-5 text-sm text-rose-100">
            {error.message || "Une erreur Tasks est survenue."}
          </section>
        ) : null}
        {actionError ? (
          <section className="rounded-[28px] border border-rose-400/25 bg-rose-400/10 p-5 text-sm text-rose-100">
            {actionError.message || "Action Tasks indisponible."}
          </section>
        ) : null}
        {feedError ? (
          <section className="rounded-[28px] border border-amber-400/25 bg-amber-400/10 p-5 text-sm text-amber-100">
            {feedError.message || "Lecture des instances indisponible."}
          </section>
        ) : null}

        <section className="grid gap-8 xl:grid-cols-[0.9fr,1.1fr]">
          <div className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-gold" />
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-gold/80">Filtres gouvernés</div>
                  <h2 className="mt-2 text-xl font-semibold text-white">Zone, fréquence et projection profil</h2>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <label className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">Zone</div>
                  <select
                    value={zoneCode}
                    onChange={(event) => setZoneCode(event.target.value)}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-gold/40"
                  >
                    {zoneOptions.map((option) => (
                      <option key={option} value={option} className="bg-[#0b1220] text-white">
                        {option === "ALL" ? "Toutes les zones" : option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">Fréquence</div>
                  <select
                    value={frequencyCode}
                    onChange={(event) => setFrequencyCode(event.target.value)}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-gold/40"
                  >
                    {frequencyOptions.map((option) => (
                      <option key={option} value={option} className="bg-[#0b1220] text-white">
                        {option === "ALL" ? "Toutes les fréquences" : option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">Projection profil</div>
                  <select
                    value={profileId}
                    onChange={(event) => setProfileId(event.target.value)}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-gold/40"
                  >
                    <option value="" className="bg-[#0b1220] text-white">
                      Lecture foyer
                    </option>
                    {profileOptions.options.map((option) => (
                      <option key={option.id} value={option.id} className="bg-[#0b1220] text-white">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <div className="text-[11px] uppercase tracking-[0.24em] text-gold/80">Catalogue publié</div>
              <div className="mt-2 text-xl font-semibold text-white">Tâches disponibles</div>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Lecture actuelle : <span className="text-white">{selectedProfileLabel}</span>
              </p>

              <div className="mt-6 space-y-4">
                {loading ? (
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm text-white/65">
                    Chargement de la bibliothèque tâches…
                  </div>
                ) : items.length === 0 ? (
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm text-white/65">
                    Aucune tâche publiée pour ce filtre.
                  </div>
                ) : (
                  items.map((item) => (
                    <TaskCard
                      key={item.task_template_code}
                      item={item}
                      isSelected={item.task_template_code === selectedTaskTemplateCode}
                      onSelect={() => setSelectedTaskTemplateCode(item.task_template_code)}
                    />
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_28px_90px_rgba(0,0,0,0.32)]">
              <div className="aspect-[16/9] w-full overflow-hidden bg-black/30">
                {detail?.image_url ? (
                  <img src={detail.image_url} alt={detail.image_alt} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/40">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
              </div>

              <div className="p-6">
                {detailLoading ? (
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm text-white/65">
                    Lecture détaillée de la tâche…
                  </div>
                ) : detail ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      {detail.hero_badges.map((badge) => (
                        <ToneBadge key={`${detail.task_template_code}-${badge.code}`} label={badge.label} />
                      ))}
                      <ToneBadge label={getFitLabel(detail.fit_status)} tone={getFitTone(detail.fit_status)} />
                    </div>

                    <h2 className="mt-4 text-3xl font-semibold text-white">{detail.title}</h2>
                    <p className="mt-3 text-base leading-7 text-white/70">{detail.short_description}</p>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      <DetailStat icon={Clock3} label="Durée" value={`${detail.estimated_duration_minutes} min`} />
                      <DetailStat icon={ShieldAlert} label="Difficulté" value={detail.difficulty_label} />
                      <DetailStat icon={Sparkles} label="Preuve attendue" value={detail.proof_type_label} />
                    </div>
                  </>
                ) : (
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm text-white/65">
                    Sélectionne une tâche publiée pour lire sa fiche détaillée intelligente.
                  </div>
                )}
              </div>
            </section>

            {detailError ? (
              <section className="rounded-[28px] border border-amber-400/25 bg-amber-400/10 p-5 text-sm text-amber-100">
                {detailError.message || "Lecture détaillée indisponible."}
              </section>
            ) : null}
            {contextError ? (
              <section className="rounded-[28px] border border-amber-400/25 bg-amber-400/10 p-5 text-sm text-amber-100">
                {contextError.message || "Contexte d'exécution indisponible."}
              </section>
            ) : null}

            {detail ? (
              <>
                <DetailSection title="Checklist normalisée">
                  <div className="space-y-3">
                    {detail.checklist_items.map((item) => (
                      <div key={item.check_code} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">Étape {item.sort_order}</div>
                        <div className="mt-2 text-sm text-white">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </DetailSection>

                <DetailSection title="Capacité et outils requis">
                  {contextLoading ? (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
                      Calcul de la capacité et des outils requis…
                    </div>
                  ) : context ? (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">Capacité profil</div>
                            <div className="mt-2 text-sm font-medium text-white">{context.capacity_summary.profile_label}</div>
                          </div>
                          <ToneBadge label={context.capacity_summary.label} tone={getFitTone(context.capacity_summary.status)} />
                        </div>
                        {context.capacity_summary.score != null ? (
                          <div className="mt-3 text-xs uppercase tracking-[0.16em] text-white/45">
                            Score capacité : {context.capacity_summary.score}
                          </div>
                        ) : null}
                        <div className="mt-4 space-y-3">
                          {context.capacity_summary.reasons.map((reason, index) => (
                            <div
                              key={`capacity-${index}`}
                              className={`rounded-2xl border p-4 text-sm ${getToneClasses(getFitTone(context.capacity_summary.status))}`}
                            >
                              {reason}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {context.tools_readiness.map((tool) => (
                          <div key={tool.tool_code} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <Wrench className="h-4 w-4 text-gold" />
                                <div>
                                  <div className="text-sm font-medium text-white">{tool.tool_label}</div>
                                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">{tool.tool_code}</div>
                                </div>
                              </div>
                              <ToneBadge label={tool.status_label} tone={getToolTone(tool.status)} />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-gold/20 bg-gold/10 p-4 text-sm text-gold/90">
                        {context.next_step_label}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
                      Sélectionne une tâche pour charger le contexte d’exécution.
                    </div>
                  )}
                </DetailSection>

                <DetailSection title="Planification gouvernée">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">Date de début</div>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(event) => setDateFrom(event.target.value)}
                        className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-gold/40"
                      />
                    </label>
                    <label className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">Date de fin</div>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(event) => setDateTo(event.target.value)}
                        className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-gold/40"
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        void planTaskFromLibrary({ dateFrom, dateTo });
                      }}
                      disabled={!selectedTaskTemplateCode || actionBusy}
                      className="inline-flex items-center justify-center rounded-full border border-gold/30 bg-gold/15 px-5 py-3 text-sm font-medium text-gold transition hover:border-gold/50 hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Planifier depuis la bibliothèque
                    </button>
                    <ToneBadge label={selectedProfileLabel} />
                  </div>

                  {lastPlanningReceipt ? (
                    <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                      Planification enregistrée : {lastPlanningReceipt.task_title} · {lastPlanningReceipt.generated_count} instance(s) générée(s)
                    </div>
                  ) : null}
                  {lastStartReceipt ? (
                    <div className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                      Exécution démarrée : {lastStartReceipt.task_execution_id ?? lastStartReceipt.task_instance_id}
                    </div>
                  ) : null}
                  {lastCompleteReceipt ? (
                    <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                      Exécution clôturée : {lastCompleteReceipt.task_execution_id} · {lastCompleteReceipt.proof_mode}
                    </div>
                  ) : null}
                </DetailSection>

                <DetailSection title="Instances et exécution réelle">
                  {feedLoading ? (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
                      Lecture des instances en cours…
                    </div>
                  ) : instancesByTemplate.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
                      Aucune instance encore créée pour cette tâche publiée.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {instancesByTemplate.map((item) => (
                        <InstanceCard
                          key={item.task_instance_id}
                          item={item}
                          busy={actionBusy}
                          onStart={() => {
                            void startTaskInstance(item.task_instance_id);
                          }}
                          onComplete={() => {
                            if (item.task_execution_id) {
                              void completeTaskExecution(item.task_execution_id);
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}
                </DetailSection>
              </>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
