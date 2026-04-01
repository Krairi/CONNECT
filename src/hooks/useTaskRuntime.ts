import { useCallback, useEffect, useMemo, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  completeTaskExecution,
  planTaskFromLibrary,
  readTaskExecutionContext,
  readTaskInstancesFeed,
  startTaskInstance,
  type PlannedTaskInstance,
  type TaskCompleteReceipt,
  type TaskExecutionContext,
  type TaskInstancesFeed,
  type TaskPlanningReceipt,
  type TaskStartReceipt,
} from "@/src/services/tasks/taskRuntimeService";

type TaskRuntimeState = {
  contextLoading: boolean;
  feedLoading: boolean;
  planning: boolean;
  starting: boolean;
  completing: boolean;
  contextError: DomyliAppError | null;
  feedError: DomyliAppError | null;
  actionError: DomyliAppError | null;
  context: TaskExecutionContext | null;
  feed: TaskInstancesFeed;
  lastPlanningReceipt: TaskPlanningReceipt | null;
  lastStartReceipt: TaskStartReceipt | null;
  lastCompleteReceipt: TaskCompleteReceipt | null;
};

const initialState: TaskRuntimeState = {
  contextLoading: false,
  feedLoading: false,
  planning: false,
  starting: false,
  completing: false,
  contextError: null,
  feedError: null,
  actionError: null,
  context: null,
  feed: {
    items: [],
    summary: { total: 0, planned: 0, started: 0, done: 0 },
  },
  lastPlanningReceipt: null,
  lastStartReceipt: null,
  lastCompleteReceipt: null,
};

export function useTaskRuntime(input: {
  taskTemplateCode: string;
  profileId: string;
}) {
  const [state, setState] = useState<TaskRuntimeState>(initialState);

  const refreshContext = useCallback(async () => {
    if (!input.taskTemplateCode.trim()) {
      setState((prev) => ({ ...prev, context: null, contextError: null }));
      return null;
    }

    setState((prev) => ({ ...prev, contextLoading: true, contextError: null }));
    try {
      const context = await readTaskExecutionContext({
        taskTemplateCode: input.taskTemplateCode,
        profileId: input.profileId.trim() || null,
      });
      setState((prev) => ({ ...prev, contextLoading: false, context }));
      return context;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({ ...prev, contextLoading: false, contextError: normalized }));
      throw normalized;
    }
  }, [input.profileId, input.taskTemplateCode]);

  const refreshFeed = useCallback(async () => {
    setState((prev) => ({ ...prev, feedLoading: true, feedError: null }));
    try {
      const feed = await readTaskInstancesFeed({
        profileId: input.profileId.trim() || null,
        limit: 40,
      });
      setState((prev) => ({ ...prev, feedLoading: false, feed }));
      return feed;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({ ...prev, feedLoading: false, feedError: normalized }));
      throw normalized;
    }
  }, [input.profileId]);

  useEffect(() => {
    void refreshContext();
  }, [refreshContext]);

  useEffect(() => {
    void refreshFeed();
  }, [refreshFeed]);

  const plan = useCallback(
    async (payload: { dateFrom: string; dateTo: string }) => {
      if (!input.taskTemplateCode.trim()) {
        throw toDomyliError(new Error("Sélectionne une tâche publiée avant planification."));
      }

      setState((prev) => ({ ...prev, planning: true, actionError: null, lastPlanningReceipt: null }));
      try {
        const receipt = await planTaskFromLibrary({
          taskTemplateCode: input.taskTemplateCode,
          profileId: input.profileId.trim() || null,
          dateFrom: payload.dateFrom,
          dateTo: payload.dateTo,
        });

        const feed = await readTaskInstancesFeed({
          profileId: input.profileId.trim() || null,
          limit: 40,
        });

        setState((prev) => ({
          ...prev,
          planning: false,
          feed,
          lastPlanningReceipt: receipt,
        }));

        return receipt;
      } catch (error) {
        const normalized = toDomyliError(error);
        setState((prev) => ({ ...prev, planning: false, actionError: normalized }));
        throw normalized;
      }
    },
    [input.profileId, input.taskTemplateCode],
  );

  const start = useCallback(async (taskInstanceId: string) => {
    setState((prev) => ({ ...prev, starting: true, actionError: null, lastStartReceipt: null }));
    try {
      const receipt = await startTaskInstance({ taskInstanceId });
      const feed = await readTaskInstancesFeed({
        profileId: input.profileId.trim() || null,
        limit: 40,
      });
      setState((prev) => ({
        ...prev,
        starting: false,
        feed,
        lastStartReceipt: receipt,
      }));
      return receipt;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({ ...prev, starting: false, actionError: normalized }));
      throw normalized;
    }
  }, [input.profileId]);

  const complete = useCallback(async (taskExecutionId: string) => {
    setState((prev) => ({ ...prev, completing: true, actionError: null, lastCompleteReceipt: null }));
    try {
      const receipt = await completeTaskExecution({ taskExecutionId });
      const feed = await readTaskInstancesFeed({
        profileId: input.profileId.trim() || null,
        limit: 40,
      });
      setState((prev) => ({
        ...prev,
        completing: false,
        feed,
        lastCompleteReceipt: receipt,
      }));
      return receipt;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({ ...prev, completing: false, actionError: normalized }));
      throw normalized;
    }
  }, [input.profileId]);

  const instancesByTemplate = useMemo(() => {
    if (!input.taskTemplateCode.trim()) return state.feed.items;
    return state.feed.items.filter((item) => item.task_template_code === input.taskTemplateCode);
  }, [input.taskTemplateCode, state.feed.items]);

  const latestPlannedInstance = useMemo<PlannedTaskInstance | null>(() => {
    return instancesByTemplate[0] ?? null;
  }, [instancesByTemplate]);

  return {
    ...state,
    instancesByTemplate,
    latestPlannedInstance,
    refreshContext,
    refreshFeed,
    planTaskFromLibrary: plan,
    startTaskInstance: start,
    completeTaskExecution: complete,
  };
}
