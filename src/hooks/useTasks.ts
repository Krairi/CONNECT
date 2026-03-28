import { useCallback, useEffect, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  completeTaskExecution,
  createTask,
  generateTaskInstances,
  listTaskInstances,
  listTasks,
  startTaskExecution,
  type CreateTaskInput,
  type GenerateTaskInstancesInput,
  type TaskDoneInput,
  type TaskDoneResult,
  type TaskDraft,
  type TaskGenerateResult,
  type TaskInstanceDraft,
  type TaskStartInput,
  type TaskStartResult,
} from "@/src/services/tasks/taskService";

type TasksState = {
  loading: boolean;
  creating: boolean;
  generating: boolean;
  starting: boolean;
  completing: boolean;
  error: DomyliAppError | null;
  tasks: TaskDraft[];
  instances: TaskInstanceDraft[];
  lastCreatedTask: TaskDraft | null;
  lastGenerated: TaskGenerateResult | null;
  lastStarted: TaskStartResult | null;
  lastCompleted: TaskDoneResult | null;
};

const initialState: TasksState = {
  loading: false,
  creating: false,
  generating: false,
  starting: false,
  completing: false,
  error: null,
  tasks: [],
  instances: [],
  lastCreatedTask: null,
  lastGenerated: null,
  lastStarted: null,
  lastCompleted: null,
};

export function useTasks() {
  const [state, setState] = useState<TasksState>(initialState);

  const loadAll = useCallback(async () => {
    const [tasks, instances] = await Promise.all([
      listTasks(),
      listTaskInstances(),
    ]);

    return { tasks, instances };
  }, []);

  const refresh = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const { tasks, instances } = await loadAll();

      setState((prev) => ({
        ...prev,
        loading: false,
        tasks,
        instances,
      }));

      return { tasks, instances };
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        loading: false,
        error: normalized,
      }));

      throw normalized;
    }
  }, [loadAll]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveTask = useCallback(async (payload: CreateTaskInput) => {
    setState((prev) => ({
      ...prev,
      creating: true,
      error: null,
      lastCreatedTask: null,
    }));

    try {
      const taskId = await createTask(payload);
      const { tasks, instances } = await loadAll();

      const createdTask =
        tasks.find((task) => task.task_id === taskId) ?? {
          task_id: taskId,
          title: payload.p_title,
          description: payload.p_description ?? null,
          effort_points: payload.p_effort_points ?? null,
          estimated_minutes: payload.p_estimated_minutes ?? null,
          is_active: payload.p_is_active ?? true,
        };

      setState((prev) => ({
        ...prev,
        creating: false,
        tasks,
        instances,
        lastCreatedTask: createdTask,
      }));

      return createdTask;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        creating: false,
        error: normalized,
      }));

      throw normalized;
    }
  }, [loadAll]);

  const generateInstances = useCallback(async (payload: GenerateTaskInstancesInput) => {
    setState((prev) => ({
      ...prev,
      generating: true,
      error: null,
      lastGenerated: null,
    }));

    try {
      const result = await generateTaskInstances(payload);
      const { tasks, instances } = await loadAll();

      setState((prev) => ({
        ...prev,
        generating: false,
        tasks,
        instances,
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
  }, [loadAll]);

  const startTask = useCallback(async (payload: TaskStartInput) => {
    setState((prev) => ({
      ...prev,
      starting: true,
      error: null,
      lastStarted: null,
    }));

    try {
      const result = await startTaskExecution(payload);
      const { tasks, instances } = await loadAll();

      setState((prev) => ({
        ...prev,
        starting: false,
        tasks,
        instances,
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
  }, [loadAll]);

  const completeTask = useCallback(async (payload: TaskDoneInput) => {
    setState((prev) => ({
      ...prev,
      completing: true,
      error: null,
      lastCompleted: null,
    }));

    try {
      const result = await completeTaskExecution(payload);
      const { tasks, instances } = await loadAll();

      setState((prev) => ({
        ...prev,
        completing: false,
        tasks,
        instances,
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
  }, [loadAll]);

  return {
    ...state,
    refresh,
    saveTask,
    generateInstances,
    startTaskExecution: startTask,
    completeTaskExecution: completeTask,
  };
}