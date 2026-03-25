import { callRpc } from "../rpc";
import { unwrapRpcRow } from "../unwrapRpcRow";

export type TaskCreateInput = {
  p_household_id: string;
  p_title: string;
  p_description?: string | null;
  p_effort_points?: number | null;
  p_default_duration_min?: number | null;
  p_required_tools?: string[] | null;
};

export type TaskCreateOutput = {
  task_id: string;
  task_key: string;
  title: string;
  created_at: string;
};

type RawTaskCreateOutput = {
  task_id?: string | null;
  task_key?: string | null;
  title?: string | null;
  created_at?: string | null;
};

export type TaskGenerateInstancesInput = {
  p_household_id: string;
  p_task_id: string;
  p_date_from: string;
  p_date_to: string;
};

export type TaskGenerateInstancesOutput = {
  generated_count: number;
};

type RawTaskGenerateInstancesOutput = {
  generated_count?: number | null;
};

export type TaskStartInput = {
  p_household_id: string;
  p_task_instance_id: string;
  p_idempotency_key: string;
};

export type TaskStartOutput = {
  execution_id: string;
  started_at: string;
};

type RawTaskStartOutput = {
  execution_id?: string | null;
  started_at?: string | null;
};

export type TaskDoneV2Input = {
  p_household_id: string;
  p_task_instance_id: string;
  p_idempotency_key: string;
  p_proof_note?: string | null;
};

export type TaskDoneV2Output = {
  run_status: "OK" | "NOOP" | string;
  execution_id: string | null;
  proof_id?: string | null;
  completed_at?: string | null;
};

type RawTaskDoneV2Output = {
  run_status?: string | null;
  execution_id?: string | null;
  proof_id?: string | null;
  completed_at?: string | null;
};

export async function createTask(payload: TaskCreateInput): Promise<TaskCreateOutput> {
  const rawResult = await callRpc<TaskCreateInput, RawTaskCreateOutput | RawTaskCreateOutput[]>(
    "rpc_task_create",
    payload
  );

  const raw = unwrapRpcRow(rawResult);

  console.log("DOMYLI rpc_task_create raw =>", rawResult);
  console.log("DOMYLI rpc_task_create normalized =>", raw);

  return {
    task_id: raw?.task_id ?? "",
    task_key: raw?.task_key ?? "",
    title: raw?.title ?? payload.p_title,
    created_at: raw?.created_at ?? new Date().toISOString(),
  };
}

export async function generateTaskInstances(
  payload: TaskGenerateInstancesInput
): Promise<TaskGenerateInstancesOutput> {
  const rawResult = await callRpc<
    TaskGenerateInstancesInput,
    RawTaskGenerateInstancesOutput | RawTaskGenerateInstancesOutput[]
  >("rpc_task_generate_instances", payload);

  const raw = unwrapRpcRow(rawResult);

  console.log("DOMYLI rpc_task_generate_instances raw =>", rawResult);
  console.log("DOMYLI rpc_task_generate_instances normalized =>", raw);

  return {
    generated_count: Number(raw?.generated_count ?? 0),
  };
}

export async function startTask(payload: TaskStartInput): Promise<TaskStartOutput> {
  const rawResult = await callRpc<TaskStartInput, RawTaskStartOutput | RawTaskStartOutput[]>(
    "rpc_task_start",
    payload
  );

  const raw = unwrapRpcRow(rawResult);

  console.log("DOMYLI rpc_task_start raw =>", rawResult);
  console.log("DOMYLI rpc_task_start normalized =>", raw);

  return {
    execution_id: raw?.execution_id ?? "",
    started_at: raw?.started_at ?? new Date().toISOString(),
  };
}

export async function doneTaskV2(payload: TaskDoneV2Input): Promise<TaskDoneV2Output> {
  const rawResult = await callRpc<TaskDoneV2Input, RawTaskDoneV2Output | RawTaskDoneV2Output[]>(
    "rpc_task_done_v2",
    payload
  );

  const raw = unwrapRpcRow(rawResult);

  console.log("DOMYLI rpc_task_done_v2 raw =>", rawResult);
  console.log("DOMYLI rpc_task_done_v2 normalized =>", raw);

  return {
    run_status: raw?.run_status ?? "OK",
    execution_id: raw?.execution_id ?? null,
    proof_id: raw?.proof_id ?? null,
    completed_at: raw?.completed_at ?? null,
  };
}