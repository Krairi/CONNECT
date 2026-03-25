import { useCallback, useState } from "react";
import { toDomyliError, type DomyliAppError } from "../lib/errors";
import {
  createTask,
  generateTaskInstances,
  autoAssignDay,
  assignTaskInstance,
  startTask,
  doneTaskV2,
  setTaskRecurrence,
  setTaskRequiredTools,
  setTaskChecklist,
  fixDayV2,
  type TaskCreateInput,
  type JsonResult,
} from "../services/tasks/taskService";

export type TaskDraft = {
  task_id: string;
  title: string;
  description: string;
  effort_points: number;
  estimated_minutes: number | null;
  start_on: string;
  recurrence_rule: Record<string, unknown>;
  required_tools: unknown[];
  checklist: unknown[];
  is_active: boolean;
};

type TasksState = {
  saving: boolean;
  running: boolean;
  error: DomyliAppError | null;
  tasks: TaskDraft[];
  lastTaskId: string | null;
  lastGenerateResult: JsonResult | null;
  lastAutoAssignResult: JsonResult | null;
  lastDoneResult: JsonResult | null;
  lastFixDayResult: JsonResult | null;
};

const initialState: TasksState = {
  saving: false,
  running: false,
  error: null,
  tasks: [],
  lastTaskId: null,
  lastGenerateResult: null,
  lastAutoAssignResult: null,
  lastDoneResult: null,
  lastFixDayResult: null,
};

export function useTasks() {
  const [state, setState] = useState<TasksState>(initialState);

  const upsertTask = useCallback(async (payload: TaskCreateInput) => {
    setState((prev) => ({
      ...prev,
      saving: true,
      error: null,
      lastTaskId: null,
    }));

    try {
      const taskId = await createTask(payload);

      const task: TaskDraft = {
        task_id: taskId,
        title: payload.p_title,
        description: payload.p_description ?? "",
        effort_points: payload.p_effort_points,
        estimated_minutes: payload.p_estimated_minutes ?? null,
        start_on: payload.p_start_on,
        recurrence_rule: (payload.p_recurrence_rule ?? {}) as Record<string, unknown>,
        required_tools: payload.p_required_tools ?? [],
        checklist: payload.p_checklist ?? [],
        is_active: payload.p_is_active ?? true,
      };

      setState((prev) => {
        const exists = prev.tasks.some((item) => item.task_id === taskId);

        return {
          ...prev,
          saving: false,
          lastTaskId: taskId,
          tasks: exists
            ? prev.tasks.map((item) => (item.task_id === taskId ? task : item))
            : [task, ...prev.tasks],
        };
      });

      return taskId;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        saving: false,
        error: normalized,
      }));

      throw normalized;
    }
  }, []);

  const runGenerateInstances = useCallback(
    async (taskId: string | null, dateFrom: string, dateTo: string) => {
      setState((prev) => ({
        ...prev,
        running: true,
        error: null,
        lastGenerateResult: null,
      }));

      try {
        const result = await generateTaskInstances({
          p_task_id: taskId,
          p_date_from: dateFrom,
          p_date_to: dateTo,
        });

        setState((prev) => ({
          ...prev,
          running: false,
          lastGenerateResult: result,
        }));

        return result;
      } catch (error) {
        const normalized = toDomyliError(error);

        setState((prev) => ({
          ...prev,
          running: false,
          error: normalized,
        }));

        throw normalized;
      }
    },
    []
  );

  const runAutoAssignDay = useCallback(async (day: string) => {
    setState((prev) => ({
      ...prev,
      running: true,
      error: null,
      lastAutoAssignResult: null,
    }));

    try {
      const result = await autoAssignDay({ p_day: day });

      setState((prev) => ({
        ...prev,
        running: false,
        lastAutoAssignResult: result,
      }));

      return result;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        running: false,
        error: normalized,
      }));

      throw normalized;
    }
  }, []);

  const runAssignTaskInstance = useCallback(
    async (taskInstanceId: string, userId: string) => {
      setState((prev) => ({
        ...prev,
        running: true,
        error: null,
      }));

      try {
        const result = await assignTaskInstance({
          p_task_instance_id: taskInstanceId,
          p_user_id: userId,
        });

        setState((prev) => ({
          ...prev,
          running: false,
        }));

        return result;
      } catch (error) {
        const normalized = toDomyliError(error);

        setState((prev) => ({
          ...prev,
          running: false,
          error: normalized,
        }));

        throw normalized;
      }
    },
    []
  );

  const runStartTask = useCallback(async (taskInstanceId: string) => {
    setState((prev) => ({
      ...prev,
      running: true,
      error: null,
    }));

    try {
      const result = await startTask({
        p_task_instance_id: taskInstanceId,
        p_idempotency_key: `task-start-${taskInstanceId}-${Date.now()}`,
      });

      setState((prev) => ({
        ...prev,
        running: false,
      }));

      return result;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        running: false,
        error: normalized,
      }));

      throw normalized;
    }
  }, []);

  const runDoneTask = useCallback(
    async (taskInstanceId: string, notes?: string) => {
      setState((prev) => ({
        ...prev,
        running: true,
        error: null,
        lastDoneResult: null,
      }));

      try {
        const result = await doneTaskV2({
          p_task_instance_id: taskInstanceId,
          p_notes: notes ?? null,
          p_proof_payload: {},
          p_idempotency_key: `task-done-${taskInstanceId}-${Date.now()}`,
        });

        setState((prev) => ({
          ...prev,
          running: false,
          lastDoneResult: result,
        }));

        return result;
      } catch (error) {
        const normalized = toDomyliError(error);

        setState((prev) => ({
          ...prev,
          running: false,
          error: normalized,
        }));

        throw normalized;
      }
    },
    []
  );

  const runSetRecurrence = useCallback(
    async (taskId: string, startOn: string, recurrenceRule: Record<string, unknown>) => {
      setState((prev) => ({
        ...prev,
        running: true,
        error: null,
      }));

      try {
        const result = await setTaskRecurrence({
          p_task_id: taskId,
          p_start_on: startOn,
          p_recurrence_rule: recurrenceRule,
        });

        setState((prev) => ({
          ...prev,
          running: false,
          tasks: prev.tasks.map((item) =>
            item.task_id === taskId
              ? { ...item, start_on: startOn, recurrence_rule: recurrenceRule }
              : item
          ),
        }));

        return result;
      } catch (error) {
        const normalized = toDomyliError(error);

        setState((prev) => ({
          ...prev,
          running: false,
          error: normalized,
        }));

        throw normalized;
      }
    },
    []
  );

  const runSetRequiredTools = useCallback(async (taskId: string, requiredTools: unknown[]) => {
    setState((prev) => ({
      ...prev,
      running: true,
      error: null,
    }));

    try {
      const result = await setTaskRequiredTools({
        p_task_id: taskId,
        p_required_tools: requiredTools,
      });

      setState((prev) => ({
        ...prev,
        running: false,
        tasks: prev.tasks.map((item) =>
          item.task_id === taskId ? { ...item, required_tools: requiredTools } : item
        ),
      }));

      return result;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        running: false,
        error: normalized,
      }));

      throw normalized;
    }
  }, []);

  const runSetChecklist = useCallback(async (taskId: string, checklist: unknown[]) => {
    setState((prev) => ({
      ...prev,
      running: true,
      error: null,
    }));

    try {
      const result = await setTaskChecklist({
        p_task_id: taskId,
        p_checklist: checklist,
      });

      setState((prev) => ({
        ...prev,
        running: false,
        tasks: prev.tasks.map((item) =>
          item.task_id === taskId ? { ...item, checklist } : item
        ),
      }));

      return result;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        running: false,
        error: normalized,
      }));

      throw normalized;
    }
  }, []);

  const runFixDay = useCallback(async (day: string) => {
    setState((prev) => ({
      ...prev,
      running: true,
      error: null,
      lastFixDayResult: null,
    }));

    try {
      const result = await fixDayV2({
        p_day: day,
        p_idempotency_key: `fix-day-${day}-${Date.now()}`,
      });

      setState((prev) => ({
        ...prev,
        running: false,
        lastFixDayResult: result,
      }));

      return result;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        running: false,
        error: normalized,
      }));

      throw normalized;
    }
  }, []);

  return {
    ...state,
    upsertTask,
    runGenerateInstances,
    runAutoAssignDay,
    runAssignTaskInstance,
    runStartTask,
    runDoneTask,
    runSetRecurrence,
    runSetRequiredTools,
    runSetChecklist,
    runFixDay,
  };
}