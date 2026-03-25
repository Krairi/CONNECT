import { useCallback, useState } from "react";

import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  createTask,
  generateTaskInstances,
  startTask,
  completeTask,
  type TaskCreateOutput,
  type TaskGenerateInstancesOutput,
  type TaskStartOutput,
  type TaskDoneOutput,
} from "@/src/services/tasks/taskService";

type TasksState = {
  creating: boolean;
  generating: boolean;
  starting: boolean;
  completing: boolean;
  error: DomyliAppError | null;
  lastCreatedTask: TaskCreateOutput | null;
  lastGenerated: TaskGenerateInstancesOutput | null;
  lastStarted: TaskStartOutput | null;
  lastCompleted: TaskDoneOutput | null;
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

export function useTasks() {
  const [state, setState] = useState(initialState);

  const saveTask = useCallback(async (payload: {
    title: string;
    description?: string | null;
    effortPoints?: number | null;
    durationMin?: number | null;
  }) => {
    setState((prev) => ({
      ...prev,
      creating: true,
      error: null,
    }));

    try {
      const result = await createTask({
        p_title: payload.title,
        p_description: payload.description ?? null,
        p_effort_points: payload.effortPoints ?? null,
        p_duration_min: payload.durationMin ?? null,
      });

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

  const generateInstances = useCallback(async (
    taskId: string,
    dateFrom: string,
    dateTo: string
  ) => {
    setState((prev) => ({
      ...prev,
      generating: true,
      error: null,
    }));

    try {
      const result = await generateTaskInstances({
        p_task_id: taskId,
        p_date_from: dateFrom,
        p_date_to: dateTo,
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
  }, []);

  const startTaskExecution = useCallback(async (taskInstanceId: string) => {
    setState((prev) => ({
      ...prev,
      starting: true,
      error: null,
    }));

    try {
      const result = await startTask({
        p_task_instance_id: taskInstanceId,
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
  }, []);

  const completeTaskExecution = useCallback(
    async (taskExecutionId: string, proofNote?: string | null) => {
      setState((prev) => ({
        ...prev,
        completing: true,
        error: null,
      }));

      try {
        const result = await completeTask({
          p_task_execution_id: taskExecutionId,
          p_proof_note: proofNote ?? null,
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