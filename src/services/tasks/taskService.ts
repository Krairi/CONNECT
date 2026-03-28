import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";

export type TaskDraft = {
  task_id: string;
  title: string;
  description: string | null;
  effort_points: number | null;
  estimated_minutes: number | null;
  is_active: boolean;
};

export type TaskInstanceDraft = {
  task_instance_id: string;
  task_id: string;
  scheduled_for: string | null;
  status: string | null;
};

type RawTaskListRow = {
  task_id?: string | null;
  title?: string | null;
  description?: string | null;
  effort_points?: number | null;
  estimated_minutes?: number | null;
  is_active?: boolean | null;
};

type RawTaskInstanceRow = {
  task_instance_id?: string | null;
  task_id?: string | null;
  scheduled_for?: string | null;
  status?: string | null;
};

type RawGenerateInstancesOutput = {
  generated_count?: number | null;
  first_instance_id?: string | null;
};

type RawTaskDoneV2Output = {
  task_instance_id?: string | null;
  task_execution_id?: string | null;
  status?: string | null;
  proof_id?: string | null;
};

export type CreateTaskInput = {
  p_task_id?: string | null;
  p_title: string;
  p_description?: string | null;
  p_effort_points?: number | null;
  p_estimated_minutes?: number | null;
  p_start_on?: string | null;
  p_recurrence_rule?: Record<string, unknown> | null;
  p_required_tools?: unknown[] | null;
  p_checklist?: unknown[] | null;
  p_is_active?: boolean | null;
};

export type GenerateTaskInstancesInput = {
  p_task_id: string;
  p_date_from: string;
  p_date_to: string;
};

export type TaskStartInput = {
  p_task_instance_id: string;
  p_idempotency_key?: string | null;
};

export type TaskDoneInput = {
  p_task_instance_id: string;
  p_notes?: string | null;
  p_proof_payload?: Record<string, unknown> | null;
  p_idempotency_key?: string | null;
};

export type TaskGenerateResult = {
  generated_count: number;
  first_instance_id: string | null;
};

export type TaskStartResult = {
  task_execution_id: string | null;
  task_instance_id: string | null;
  status: string | null;
};

export type TaskDoneResult = {
  task_instance_id: string | null;
  task_execution_id: string | null;
  status: string | null;
  proof_id: string | null;
};

function pickRows<T>(value: T[] | T | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function extractUuid(raw: unknown, fallback = ""): string {
  if (typeof raw === "string") {
    return raw;
  }

  if (Array.isArray(raw) && typeof raw[0] === "string") {
    return raw[0];
  }

  if (raw && typeof raw === "object") {
    const direct =
      ("task_id" in raw && typeof (raw as { task_id?: unknown }).task_id === "string"
        ? (raw as { task_id?: string }).task_id
        : null) ??
      ("task_execution_id" in raw &&
      typeof (raw as { task_execution_id?: unknown }).task_execution_id === "string"
        ? (raw as { task_execution_id?: string }).task_execution_id
        : null) ??
      ("id" in raw && typeof (raw as { id?: unknown }).id === "string"
        ? (raw as { id?: string }).id
        : null);

    return direct ?? fallback;
  }

  return fallback;
}

export async function listTasks(): Promise<TaskDraft[]> {
  try {
    const raw = (await callRpc("rpc_task_list", {})) as
      | RawTaskListRow[]
      | RawTaskListRow
      | null;

    return pickRows(raw).map((row) => ({
      task_id: row.task_id ?? "",
      title: row.title ?? "Tâche DOMYLI",
      description: row.description ?? null,
      effort_points: row.effort_points ?? null,
      estimated_minutes: row.estimated_minutes ?? null,
      is_active: Boolean(row.is_active ?? true),
    }));
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function listTaskInstances(): Promise<TaskInstanceDraft[]> {
  try {
    const raw = (await callRpc("rpc_task_instance_list", {})) as
      | RawTaskInstanceRow[]
      | RawTaskInstanceRow
      | null;

    return pickRows(raw).map((row) => ({
      task_instance_id: row.task_instance_id ?? "",
      task_id: row.task_id ?? "",
      scheduled_for: row.scheduled_for ?? null,
      status: row.status ?? null,
    }));
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function createTask(
  payload: CreateTaskInput,
): Promise<string> {
  try {
    const raw = await callRpc("rpc_task_create", {
      p_task_id: payload.p_task_id ?? null,
      p_title: payload.p_title,
      p_description: payload.p_description ?? null,
      p_effort_points: payload.p_effort_points ?? null,
      p_estimated_minutes: payload.p_estimated_minutes ?? null,
      p_start_on: payload.p_start_on ?? null,
      p_recurrence_rule: payload.p_recurrence_rule ?? null,
      p_required_tools: payload.p_required_tools ?? [],
      p_checklist: payload.p_checklist ?? [],
      p_is_active: payload.p_is_active ?? true,
    }, { unwrap: true });

    return extractUuid(raw, "");
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function generateTaskInstances(
  payload: GenerateTaskInstancesInput,
): Promise<TaskGenerateResult> {
  try {
    const raw = (await callRpc("rpc_task_generate_instances", payload, {
      unwrap: true,
    })) as RawGenerateInstancesOutput | null;

    return {
      generated_count: Number(raw?.generated_count ?? 0),
      first_instance_id: raw?.first_instance_id ?? null,
    };
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function startTaskExecution(
  payload: TaskStartInput,
): Promise<TaskStartResult> {
  try {
    const executionId = await callRpc("rpc_task_start", {
      p_task_instance_id: payload.p_task_instance_id,
      p_idempotency_key: payload.p_idempotency_key ?? crypto.randomUUID(),
    }, { unwrap: true });

    return {
      task_execution_id: extractUuid(executionId, ""),
      task_instance_id: payload.p_task_instance_id,
      status: "STARTED",
    };
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function completeTaskExecution(
  payload: TaskDoneInput,
): Promise<TaskDoneResult> {
  try {
    const raw = (await callRpc("rpc_task_done_v2", {
      p_task_instance_id: payload.p_task_instance_id,
      p_notes: payload.p_notes ?? null,
      p_proof_payload: payload.p_proof_payload ?? null,
      p_idempotency_key: payload.p_idempotency_key ?? crypto.randomUUID(),
    }, { unwrap: true })) as RawTaskDoneV2Output | null;

    return {
      task_instance_id: raw?.task_instance_id ?? payload.p_task_instance_id,
      task_execution_id: raw?.task_execution_id ?? null,
      status: raw?.status ?? "DONE",
      proof_id: raw?.proof_id ?? null,
    };
  } catch (error) {
    throw toDomyliError(error);
  }
}