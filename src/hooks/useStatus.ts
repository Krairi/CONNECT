import { useCallback, useEffect, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  getTodayHealth,
  getTodayLoadFeed,
  type TodayHealthOutput,
  type TodayLoadFeedItem,
} from "@/src/services/status/statusService";

type StatusState = {
  loading: boolean;
  degraded: boolean;
  error: DomyliAppError | null;
  health: TodayHealthOutput | null;
  feed: TodayLoadFeedItem[];
};

const initialState: StatusState = {
  loading: false,
  degraded: false,
  error: null,
  health: null,
  feed: [],
};

export function useStatus(householdId: string | null) {
  const [state, setState] = useState<StatusState>(initialState);

  const refresh = useCallback(async () => {
    if (!householdId) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: null,
        health: null,
        feed: [],
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const [healthResult, feedResult] = await Promise.allSettled([
        getTodayHealth(),
        getTodayLoadFeed(),
      ]);

      const health = healthResult.status === "fulfilled" ? healthResult.value : null;
      const feed = feedResult.status === "fulfilled" ? feedResult.value : [];
      const healthError = healthResult.status === "rejected" ? healthResult.reason : null;
      const feedError = feedResult.status === "rejected" ? feedResult.reason : null;

      const isDegraded = healthResult.status === "rejected" || feedResult.status === "rejected";
      const mainError = healthError || feedError;

      setState({
        loading: false,
        degraded: isDegraded,
        error: isDegraded && !health && feed.length === 0 ? toDomyliError(mainError) : null,
        health,
        feed,
      });

      return { health, feed };
    } catch (error) {
      const normalized = toDomyliError(error);

      setState({
        loading: false,
        degraded: false,
        error: normalized,
        health: null,
        feed: [],
      });

      throw normalized;
    }
  }, [householdId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}
