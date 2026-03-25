import { callRpc } from "@/src/services/rpc";

export type TaskDraft = {
  task_id: string;
  title: string;
  description: string | null;
  effort_points: number | null;
  duration_min: number | null;
  status: string | null;
  task_instance_id: string | null;
  task_execution_id: string | null;
};

type RawTaskCreateOutput = {
  task_id?: string | null;
  title?: string | null;
  description?: string | null;
  effort_points?: number | null;
  duration_min?: number | null;
  status?: string | null;
};

type RawGenerateInstancesOutput = {
  generated_count?: number | null;
  first_instance_id?: string | null;
};

type RawTaskStartOutput = {
  task_execution_id?: string | null;
  task_instance_id?: string | null;
  status?: string | null;
};

type RawTaskDoneOutput = {
  task_execution_id?: string | null;
  status?: string | null;
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
  task_execution_id: string | null;
  status: string | null;
};

export type CreateTaskInput = {
  p_household_id: string;
  p_title: string;
  p_description?: string | null;
  p_effort_points?: number | null;
  p_duration_min?: number | null;
};

export type GenerateTaskInstancesInput = {
  p_task_id: string;
  p_date_from: string;
  p_date_to: string;
};

export type TaskStartInput = {
  p_task_instance_id: string;
};

export type TaskDoneInput = {
  p_task_execution_id: string;
  p_proof_note?: string | null;
};

export async function createTask(
  payload: CreateTaskInput
): Promise<TaskDraft> {
  const raw = await callRpc<RawTaskCreateOutput | null>(
    "rpc_task_create",
    payload,
    { unwrap: true }
  );

  return {
    task_id: raw?.task_id ?? "",
    title: raw?.title ?? payload.p_title,
    description: raw?.description ?? payload.p_description ?? null,
    effort_points: raw?.effort_points ?? payload.p_effort_points ?? null,
    duration_min: raw?.duration_min ?? payload.p_duration_min ?? null,
    status: raw?.status ?? "CREATED",
    task_instance_id: null,
    task_execution_id: null,
  };
}

export async function generateTaskInstances(
  payload: GenerateTaskInstancesInput
): Promise<TaskGenerateResult> {
  const raw = await callRpc<RawGenerateInstancesOutput | null>(
    "rpc_task_generate_instances",
    payload,
    { unwrap: true }
  );

  return {
    generated_count: Number(raw?.generated_count ?? 0),
    first_instance_id: raw?.first_instance_id ?? null,
  };
}

export async function startTaskExecution(
  payload: TaskStartInput
): Promise<TaskStartResult> {
  const raw = await callRpc<RawTaskStartOutput | null>(
    "rpc_task_start",
    payload,
    { unwrap: true }
  );

  return {
    task_execution_id: raw?.task_execution_id ?? null,
    task_instance_id: raw?.task_instance_id ?? payload.p_task_instance_id,
    status: raw?.status ?? "STARTED",
  };
}

export async function completeTaskExecution(
  payload: TaskDoneInput
): Promise<TaskDoneResult> {
  const raw = await callRpc<RawTaskDoneOutput | null>(
    "rpc_task_done_v2",
    payload,
    { unwrap: true }
  );

  return {
    task_execution_id: raw?.task_execution_id ?? payload.p_task_execution_id,
    status: raw?.status ?? "DONE",
  };
}