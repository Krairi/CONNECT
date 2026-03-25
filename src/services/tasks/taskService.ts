import { callRpc } from "../rpc";

export type TaskCreateInput = {
  p_task_id?: string | null;
  p_title: string;
  p_description?: string | null;
  p_effort_points: number;
  p_estimated_minutes?: number | null;
  p_start_on: string;
  p_recurrence_rule?: Record<string, unknown> | null;
  p_required_tools?: unknown[] | null;
  p_checklist?: unknown[] | null;
  p_is_active?: boolean | null;
};

export type TaskGenerateInstancesInput = {
  p_task_id?: string | null;
  p_date_from: string;
  p_date_to: string;
};

export type TaskAutoAssignDayInput = {
  p_day: string;
};

export type TaskInstanceAssignInput = {
  p_task_instance_id: string;
  p_user_id: string;
};

export type TaskStartInput = {
  p_task_instance_id: string;
  p_idempotency_key: string;
};

export type TaskDoneInput = {
  p_task_instance_id: string;
  p_notes?: string | null;
  p_proof_payload?: Record<string, unknown> | null;
  p_idempotency_key: string;
};

export type TaskSetRecurrenceInput = {
  p_task_id: string;
  p_start_on: string;
  p_recurrence_rule?: Record<string, unknown> | null;
};

export type TaskRequiredToolsSetInput = {
  p_task_id: string;
  p_required_tools?: unknown[] | null;
};

export type TaskChecklistSetInput = {
  p_task_id: string;
  p_checklist?: unknown[] | null;
};

export type FixDayInput = {
  p_day: string;
  p_idempotency_key: string;
};

export type JsonResult = Record<string, unknown>;

export async function createTask(payload: TaskCreateInput): Promise<string> {
  const rawResult = await callRpc<TaskCreateInput, string>("rpc_task_create", {
    p_task_id: payload.p_task_id ?? null,
    p_title: payload.p_title,
    p_description: payload.p_description ?? null,
    p_effort_points: payload.p_effort_points,
    p_estimated_minutes: payload.p_estimated_minutes ?? null,
    p_start_on: payload.p_start_on,
    p_recurrence_rule: payload.p_recurrence_rule ?? {},
    p_required_tools: payload.p_required_tools ?? [],
    p_checklist: payload.p_checklist ?? [],
    p_is_active: payload.p_is_active ?? true,
  });

  console.log("DOMYLI rpc_task_create raw =>", rawResult);

  return rawResult ?? "";
}

export async function generateTaskInstances(
  payload: TaskGenerateInstancesInput
): Promise<JsonResult> {
  const rawResult = await callRpc<TaskGenerateInstancesInput, JsonResult>(
    "rpc_task_generate_instances",
    {
      p_task_id: payload.p_task_id ?? null,
      p_date_from: payload.p_date_from,
      p_date_to: payload.p_date_to,
    }
  );

  console.log("DOMYLI rpc_task_generate_instances raw =>", rawResult);

  return rawResult ?? {};
}

export async function autoAssignDay(
  payload: TaskAutoAssignDayInput
): Promise<JsonResult> {
  const rawResult = await callRpc<TaskAutoAssignDayInput, JsonResult>(
    "rpc_task_auto_assign_day",
    {
      p_day: payload.p_day,
    }
  );

  console.log("DOMYLI rpc_task_auto_assign_day raw =>", rawResult);

  return rawResult ?? {};
}

export async function assignTaskInstance(
  payload: TaskInstanceAssignInput
): Promise<string> {
  const rawResult = await callRpc<TaskInstanceAssignInput, string>(
    "rpc_task_instance_assign",
    payload
  );

  console.log("DOMYLI rpc_task_instance_assign raw =>", rawResult);

  return rawResult ?? "";
}

export async function startTask(payload: TaskStartInput): Promise<string> {
  const rawResult = await callRpc<TaskStartInput, string>("rpc_task_start", payload);

  console.log("DOMYLI rpc_task_start raw =>", rawResult);

  return rawResult ?? "";
}

export async function doneTaskV2(payload: TaskDoneInput): Promise<JsonResult> {
  const rawResult = await callRpc<TaskDoneInput, JsonResult>("rpc_task_done_v2", {
    p_task_instance_id: payload.p_task_instance_id,
    p_notes: payload.p_notes ?? null,
    p_proof_payload: payload.p_proof_payload ?? {},
    p_idempotency_key: payload.p_idempotency_key,
  });

  console.log("DOMYLI rpc_task_done_v2 raw =>", rawResult);

  return rawResult ?? {};
}

export async function setTaskRecurrence(
  payload: TaskSetRecurrenceInput
): Promise<string> {
  const rawResult = await callRpc<TaskSetRecurrenceInput, string>(
    "rpc_task_set_recurrence",
    {
      p_task_id: payload.p_task_id,
      p_start_on: payload.p_start_on,
      p_recurrence_rule: payload.p_recurrence_rule ?? {},
    }
  );

  console.log("DOMYLI rpc_task_set_recurrence raw =>", rawResult);

  return rawResult ?? "";
}

export async function setTaskRequiredTools(
  payload: TaskRequiredToolsSetInput
): Promise<string> {
  const rawResult = await callRpc<TaskRequiredToolsSetInput, string>(
    "rpc_task_required_tools_set",
    {
      p_task_id: payload.p_task_id,
      p_required_tools: payload.p_required_tools ?? [],
    }
  );

  console.log("DOMYLI rpc_task_required_tools_set raw =>", rawResult);

  return rawResult ?? "";
}

export async function setTaskChecklist(
  payload: TaskChecklistSetInput
): Promise<string> {
  const rawResult = await callRpc<TaskChecklistSetInput, string>(
    "rpc_task_checklist_set",
    {
      p_task_id: payload.p_task_id,
      p_checklist: payload.p_checklist ?? [],
    }
  );

  console.log("DOMYLI rpc_task_checklist_set raw =>", rawResult);

  return rawResult ?? "";
}

export async function fixDayV2(payload: FixDayInput): Promise<JsonResult> {
  const rawResult = await callRpc<FixDayInput, JsonResult>("rpc_fix_day_v2", payload);

  console.log("DOMYLI rpc_fix_day_v2 raw =>", rawResult);

  return rawResult ?? {};
}