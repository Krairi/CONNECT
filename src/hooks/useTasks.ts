import { useCallback, useState } from "react";
import { toDomyliError, type DomyliAppError } from "../lib/errors";
import {
  createTask,
  generateTaskInstances,
  startTask,
  doneTaskV2,
  type TaskCreateInput,
  type TaskCreateOutput,
  type TaskGenerateInstancesOutput,
  type TaskStartOutput,
  type TaskDoneV2Output,
} from "../services/tasks/taskService";

type TasksState = {
  creating: boolean;
  generating: boolean;
  starting: boolean;
  completing: boolean;
  error: DomyliAppError | null;
  lastCreatedTask: TaskCreateOutput | null;
  lastGenerated: TaskGenerateInstancesOutput | null;
  lastStarted: TaskStartOutput | null;
  lastCompleted: TaskDoneV2Output | null;
};

const initialState: TasksState = {
  creating: false,
  generating: false,
  starting: false,
  completing: false,
  error: null,
  lastCreatedTask: null,
  lastGenerated: null,
  lastStarted: null,
  lastCompleted: null,
};

function makeIdempotencyKey(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function useTasks() {
  const [state, setState] = useState<TasksState>(initialState);

  const saveTask = useCallback(async (payload: TaskCreateInput) => {
    setState((prev) => ({ ...prev, creating: true, error: null }));

    try {
      const result = await createTask(payload);

      setState((prev) => ({
        ...prev,
        creating: false,
        lastCreatedTask: result,
      }));

      return result;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({
        ...prev,
        creating: false,
        error: normalized,
      }));
      throw normalized;
    }
  }, []);

  const generateInstances = useCallback(
    async (payload: { householdId: string; taskId: string; dateFrom: string; dateTo: string }) => {
      setState((prev) => ({ ...prev, generating: true, error: null }));

      try {
        const result = await generateTaskInstances({
          p_household_id: payload.householdId,
          p_task_id: payload.taskId,
          p_date_from: payload.dateFrom,
          p_date_to: payload.dateTo,
        });

        setState((prev) => ({
          ...prev,
          generating: false,
          lastGenerated: result,
        }));

        return result;
      } catch (error) {
        const normalized = toDomyliError(error);
        setState((prev) => ({
          ...prev,
          generating: false,
          error: normalized,
        }));
        throw normalized;
      }
    },
    []
  );

  const startTaskExecution = useCallback(
    async (payload: { householdId: string; taskInstanceId: string }) => {
      setState((prev) => ({ ...prev, starting: true, error: null }));

      try {
        const result = await startTask({
          p_household_id: payload.householdId,
          p_task_instance_id: payload.taskInstanceId,
          p_idempotency_key: makeIdempotencyKey("task_start"),
        });

        setState((prev) => ({
          ...prev,
          starting: false,
          lastStarted: result,
        }));

        return result;
      } catch (error) {
        const normalized = toDomyliError(error);
        setState((prev) => ({
          ...prev,
          starting: false,
          error: normalized,
        }));
        throw normalized;
      }
    },
    []
  );

  const completeTaskExecution = useCallback(
    async (payload: {
      householdId: string;
      taskInstanceId: string;
      proofNote?: string | null;
    }) => {
      setState((prev) => ({ ...prev, completing: true, error: null }));

      try {
        const result = await doneTaskV2({
          p_household_id: payload.householdId,
          p_task_instance_id: payload.taskInstanceId,
          p_idempotency_key: makeIdempotencyKey("task_done"),
          p_proof_note: payload.proofNote ?? null,
        });

        setState((prev) => ({
          ...prev,
          completing: false,
          lastCompleted: result,
        }));

        return result;
      } catch (error) {
        const normalized = toDomyliError(error);
        setState((prev) => ({
          ...prev,
          completing: false,
          error: normalized,
        }));
        throw normalized;
      }
    },
    []
  );

  return {
    ...state,
    saveTask,
    generateInstances,
    startTaskExecution,
    completeTaskExecution,
  };
}