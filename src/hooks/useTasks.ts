import { useState } from "react";

import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  createTask,
  generateTaskInstances,
  startTaskExecution,
  completeTaskExecution,
  type TaskDraft,
  type TaskGenerateResult,
  type TaskStartResult,
  type TaskDoneResult,
  type CreateTaskInput,
  type GenerateTaskInstancesInput,
  type TaskStartInput,
  type TaskDoneInput,
} from "@/src/services/tasks/taskService";

type TasksState = {
  creating: boolean;
  generating: boolean;
  starting: boolean;
  completing: boolean;
  error: DomyliAppError | null;
  tasks: TaskDraft[];
  lastCreatedTask: TaskDraft | null;
  lastGenerated: TaskGenerateResult | null;
  lastStarted: TaskStartResult | null;
  lastCompleted: TaskDoneResult | null;
};

const initialState: TasksState = {
  creating: false,
  generating: false,
  starting: false,
  completing: false,
  error: null,
  tasks: [],
  lastCreatedTask: null,
  lastGenerated: null,
  lastStarted: null,
  lastCompleted: null,
};

export function useTasks() {
  const [state, setState] = useState<TasksState>(initialState);

  const saveTask = async (payload: CreateTaskInput) => {
    setState((prev) => ({
      ...prev,
      creating: true,
      error: null,
      lastCreatedTask: null,
    }));

    try {
      const result = await createTask(payload);

      setState((prev) => ({
        ...prev,
        creating: false,
        lastCreatedTask: result,
        tasks: [result, ...prev.tasks.filter((t) => t.task_id !== result.task_id)],
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
  };

  const generateInstances = async (payload: GenerateTaskInstancesInput) => {
    setState((prev) => ({
      ...prev,
      generating: true,
      error: null,
      lastGenerated: null,
    }));

    try {
      const result = await generateTaskInstances(payload);

      setState((prev) => ({
        ...prev,
        generating: false,
        lastGenerated: result,
        tasks: prev.tasks.map((task) =>
          task.task_id === payload.p_task_id
            ? {
                ...task,
                task_instance_id: result.first_instance_id,
                status: result.generated_count > 0 ? "INSTANCES_GENERATED" : task.status,
              }
            : task
        ),
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
  };

  const startTask = async (payload: TaskStartInput) => {
    setState((prev) => ({
      ...prev,
      starting: true,
      error: null,
      lastStarted: null,
    }));

    try {
      const result = await startTaskExecution(payload);

      setState((prev) => ({
        ...prev,
        starting: false,
        lastStarted: result,
        tasks: prev.tasks.map((task) =>
          task.task_instance_id === result.task_instance_id
            ? {
                ...task,
                task_execution_id: result.task_execution_id,
                status: result.status,
              }
            : task
        ),
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
  };

  const completeTask = async (payload: TaskDoneInput) => {
    setState((prev) => ({
      ...prev,
      completing: true,
      error: null,
      lastCompleted: null,
    }));

    try {
      const result = await completeTaskExecution(payload);

      setState((prev) => ({
        ...prev,
        completing: false,
        lastCompleted: result,
        tasks: prev.tasks.map((task) =>
          task.task_execution_id === result.task_execution_id
            ? {
                ...task,
                status: result.status,
              }
            : task
        ),
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
  };

  return {
    ...state,
    saveTask,
    generateInstances,
    startTaskExecution: startTask,
    completeTaskExecution: completeTask,
  };
}