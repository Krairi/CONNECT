import { callRpc } from "@/src/services/rpc";

type RpcObject = Record<string, unknown>;

async function callRpcFallback<T>(names: string[], payload: RpcObject, options: RpcObject = {}): Promise<T> {
  let lastError: unknown = null;
  for (const name of names) {
    try {
      return (await callRpc(name, payload, options as never)) as T;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export type TaskCapacitySummary = {
  status: string;
  label: string;
  score: number | null;
  profile_label: string;
  reasons: string[];
};

export type TaskToolReadiness = {
  tool_code: string;
  tool_label: string;
  status: string;
  status_label: string;
  available_count: number | null;
};

export type TaskExecutionContext = {
  task_template_code: string;
  selected_profile_id: string | null;
  context_mode: string;
  next_step_label: string;
  capacity_summary: TaskCapacitySummary;
  tools_readiness: TaskToolReadiness[];
};

export type PlannedTaskInstance = {
  task_instance_id: string;
  task_id: string;
  task_title: string;
  task_template_code: string;
  status: string;
  planned_for: string;
  profile_id: string | null;
  profile_label: string;
  task_execution_id: string | null;
  execution_status: string | null;
};

export type TaskInstancesFeed = {
  items: PlannedTaskInstance[];
  summary: {
    total: number;
    planned: number;
    started: number;
    done: number;
  };
};

export type TaskPlanningReceipt = {
  task_id: string | null;
  task_title: string;
  task_template_code: string;
  selected_profile_id: string | null;
  generated_count: number;
  first_instance_id: string | null;
  planning_status: string;
  capacity_status: string | null;
  proof_type_code: string | null;
};

export type TaskStartReceipt = {
  task_instance_id: string;
  task_execution_id: string | null;
  status: string;
};

export type TaskCompleteReceipt = {
  task_execution_id: string;
  status: string;
  proof_mode: string;
};

function normalizeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function normalizeCapacitySummary(value: unknown): TaskCapacitySummary {
  const item = (value ?? {}) as RpcObject;
  return {
    status: normalizeString(item.status, "HOUSEHOLD"),
    label: normalizeString(item.label, "Lecture foyer"),
    score: typeof item.score === "number" ? item.score : item.score == null ? null : Number(item.score),
    profile_label: normalizeString(item.profile_label, "Lecture foyer"),
    reasons: normalizeStringArray(item.reasons),
  };
}

function normalizeTools(value: unknown): TaskToolReadiness[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    const item = (entry ?? {}) as RpcObject;
    return {
      tool_code: normalizeString(item.tool_code, ""),
      tool_label: normalizeString(item.tool_label, "Outil DOMYLI"),
      status: normalizeString(item.status, "CATALOG_ONLY"),
      status_label: normalizeString(item.status_label, "Catalogue gouverné"),
      available_count:
        typeof item.available_count === "number"
          ? item.available_count
          : item.available_count == null
            ? null
            : Number(item.available_count),
    };
  });
}

function normalizeExecutionContext(value: unknown): TaskExecutionContext {
  const item = (value ?? {}) as RpcObject;
  return {
    task_template_code: normalizeString(item.task_template_code),
    selected_profile_id: typeof item.selected_profile_id === "string" ? item.selected_profile_id : null,
    context_mode: normalizeString(item.context_mode, "HOUSEHOLD"),
    next_step_label: normalizeString(item.next_step_label, "Planification possible depuis la bibliothèque"),
    capacity_summary: normalizeCapacitySummary(item.capacity_summary),
    tools_readiness: normalizeTools(item.tools_readiness),
  };
}

function normalizeTaskInstance(value: unknown): PlannedTaskInstance {
  const item = (value ?? {}) as RpcObject;
  return {
    task_instance_id: normalizeString(item.task_instance_id),
    task_id: normalizeString(item.task_id),
    task_title: normalizeString(item.task_title, "Tâche DOMYLI"),
    task_template_code: normalizeString(item.task_template_code),
    status: normalizeString(item.status, "PLANNED"),
    planned_for: normalizeString(item.planned_for, new Date().toISOString().slice(0, 10)),
    profile_id: typeof item.profile_id === "string" ? item.profile_id : null,
    profile_label: normalizeString(item.profile_label, "Lecture foyer"),
    task_execution_id: typeof item.task_execution_id === "string" ? item.task_execution_id : null,
    execution_status: typeof item.execution_status === "string" ? item.execution_status : null,
  };
}

function normalizeFeed(value: unknown): TaskInstancesFeed {
  const item = (value ?? {}) as RpcObject;
  const items = Array.isArray(item.items) ? item.items.map(normalizeTaskInstance) : [];
  const summary = (item.summary ?? {}) as RpcObject;
  return {
    items,
    summary: {
      total: typeof summary.total === "number" ? summary.total : Number(summary.total ?? items.length),
      planned: typeof summary.planned === "number" ? summary.planned : Number(summary.planned ?? 0),
      started: typeof summary.started === "number" ? summary.started : Number(summary.started ?? 0),
      done: typeof summary.done === "number" ? summary.done : Number(summary.done ?? 0),
    },
  };
}

function normalizePlanningReceipt(value: unknown): TaskPlanningReceipt {
  const item = (value ?? {}) as RpcObject;
  return {
    task_id: typeof item.task_id === "string" ? item.task_id : null,
    task_title: normalizeString(item.task_title, "Tâche DOMYLI"),
    task_template_code: normalizeString(item.task_template_code),
    selected_profile_id: typeof item.selected_profile_id === "string" ? item.selected_profile_id : null,
    generated_count: typeof item.generated_count === "number" ? item.generated_count : Number(item.generated_count ?? 0),
    first_instance_id: typeof item.first_instance_id === "string" ? item.first_instance_id : null,
    planning_status: normalizeString(item.planning_status, "TASK_CREATED"),
    capacity_status: typeof item.capacity_status === "string" ? item.capacity_status : null,
    proof_type_code: typeof item.proof_type_code === "string" ? item.proof_type_code : null,
  };
}

function normalizeStartReceipt(value: unknown): TaskStartReceipt {
  const item = (value ?? {}) as RpcObject;
  return {
    task_instance_id: normalizeString(item.task_instance_id),
    task_execution_id: typeof item.task_execution_id === "string" ? item.task_execution_id : null,
    status: normalizeString(item.status, "STARTED"),
  };
}

function normalizeCompleteReceipt(value: unknown): TaskCompleteReceipt {
  const item = (value ?? {}) as RpcObject;
  return {
    task_execution_id: normalizeString(item.task_execution_id),
    status: normalizeString(item.status, "DONE"),
    proof_mode: normalizeString(item.proof_mode, "GOVERNED_NO_FREE_TEXT"),
  };
}

export async function readTaskExecutionContext(input: {
  taskTemplateCode: string;
  profileId?: string | null;
}): Promise<TaskExecutionContext> {
  const raw = await callRpcFallback<unknown>(
    ["rpc_task_execution_context_v1"],
    {
      p_task_template_code: input.taskTemplateCode,
      p_profile_id: input.profileId ?? null,
    },
    { unwrap: true },
  );
  return normalizeExecutionContext(raw);
}

export async function planTaskFromLibrary(input: {
  taskTemplateCode: string;
  profileId?: string | null;
  dateFrom: string;
  dateTo: string;
}): Promise<TaskPlanningReceipt> {
  const raw = await callRpcFallback<unknown>(
    ["rpc_task_plan_from_library_v1"],
    {
      p_task_template_code: input.taskTemplateCode,
      p_profile_id: input.profileId ?? null,
      p_date_from: input.dateFrom,
      p_date_to: input.dateTo,
    },
    { unwrap: true },
  );
  return normalizePlanningReceipt(raw);
}

export async function readTaskInstancesFeed(input: {
  profileId?: string | null;
  limit?: number;
}): Promise<TaskInstancesFeed> {
  const raw = await callRpcFallback<unknown>(
    ["rpc_task_instances_feed_v1"],
    {
      p_profile_id: input.profileId ?? null,
      p_limit: input.limit ?? 40,
    },
    { unwrap: true },
  );
  return normalizeFeed(raw);
}

export async function startTaskInstance(input: { taskInstanceId: string }): Promise<TaskStartReceipt> {
  const raw = await callRpcFallback<unknown>(
    ["rpc_task_instance_start_v1"],
    { p_task_instance_id: input.taskInstanceId },
    { unwrap: true },
  );
  return normalizeStartReceipt(raw);
}

export async function completeTaskExecution(input: { taskExecutionId: string }): Promise<TaskCompleteReceipt> {
  const raw = await callRpcFallback<unknown>(
    ["rpc_task_execution_complete_v1"],
    { p_task_execution_id: input.taskExecutionId },
    { unwrap: true },
  );
  return normalizeCompleteReceipt(raw);
}
