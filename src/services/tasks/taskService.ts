import { callRpc } from "@/src/services/rpc";
import { unwrapRpcRow } from "@/src/services/unwrapRpcRow";

export type TaskCreateInput = {
  p_title: string;
  p_description?: string | null;
  p_effort_points?: number | null;
  p_duration_min?: number | null;
};

export type TaskCreateOutput = {
  task_id: string;
  title: string;
};

type RawTaskCreateOutput = {
  task_id?: string | null;
  title?: string | null;
};

export type TaskGenerateInstancesInput = {
  p_task_id: string;
  p_date_from: string;
  p_date_to: string;
};

export type TaskGenerateInstancesOutput = {
  generated_count: number;
  first_instance_id: string | null;
};

type RawTaskGenerateInstancesOutput = {
  generated_count?: number | null;
  first_instance_id?: string | null;
};

export type TaskStartInput = {
  p_task_instance_id: string;
};

export type TaskStartOutput = {
  task_execution_id: string;
  task_instance_id: string;
};

type RawTaskStartOutput = {
  task_execution_id?: string | null;
  task_instance_id?: string | null;
};

export type TaskDoneInput = {
  p_task_execution_id: string;
  p_proof_note?: string | null;
};

export type TaskDoneOutput = {
  task_execution_id: string;
  status: string;
};

type RawTaskDoneOutput = {
  task_execution_id?: string | null;
  status?: string | null;
};

export async function createTask(
  payload: TaskCreateInput
): Promise<TaskCreateOutput> {
  const rawResult = await callRpc<RawTaskCreateOutput | RawTaskCreateOutput[]>(
    "rpc_task_create",
    payload
  );

  const raw = unwrapRpcRow(rawResult);

  return {
    task_id: raw?.task_id ?? "",
    title: raw?.title ?? payload.p_title,
  };
}

export async function generateTaskInstances(
  payload: TaskGenerateInstancesInput
): Promise<TaskGenerateInstancesOutput> {
  const rawResult = await callRpc<
    RawTaskGenerateInstancesOutput | RawTaskGenerateInstancesOutput[]
  >("rpc_task_generate_instances", payload);

  const raw = unwrapRpcRow(rawResult);

  return {
    generated_count: Number(raw?.generated_count ?? 0),
    first_instance_id: raw?.first_instance_id ?? null,
  };
}

export async function startTask(
  payload: TaskStartInput
): Promise<TaskStartOutput> {
  const rawResult = await callRpc<RawTaskStartOutput | RawTaskStartOutput[]>(
    "rpc_task_start",
    payload
  );

  const raw = unwrapRpcRow(rawResult);

  return {
    task_execution_id: raw?.task_execution_id ?? "",
    task_instance_id: raw?.task_instance_id ?? payload.p_task_instance_id,
  };
}

export async function completeTask(
  payload: TaskDoneInput
): Promise<TaskDoneOutput> {
  const rawResult = await callRpc<RawTaskDoneOutput | RawTaskDoneOutput[]>(
    "rpc_task_done_v2",
    payload
  );

  const raw = unwrapRpcRow(rawResult);

  return {
    task_execution_id: raw?.task_execution_id ?? payload.p_task_execution_id,
    status: raw?.status ?? "DONE",
  };
}