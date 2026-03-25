import { useCallback, useEffect, useState } from "react";

import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  getTodayHealth,
  getTodayLoadFeed,
  type TodayHealthOutput,
  type TodayLoadFeedItem,
} from "@/src/services/dashboard/dashboardService";

type DashboardState = {
  loading: boolean;
  degraded: boolean;
  error: DomyliAppError | null;
  health: TodayHealthOutput | null;
  feed: TodayLoadFeedItem[];
};

const initialState: DashboardState = {
  loading: false,
  degraded: false,
  error: null,
  health: null,
  feed: [],
};

export function useDashboard(householdId: string | null) {
  const [state, setState] = useState<DashboardState>(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      degraded: false,
    }));

    const [healthResult, feedResult] = await Promise.allSettled([
      getTodayHealth(),
      householdId ? getTodayLoadFeed() : Promise.resolve([]),
    ]);

    const health =
      healthResult.status === "fulfilled" ? healthResult.value : null;
    const feed = feedResult.status === "fulfilled" ? feedResult.value : [];

    const errors = [healthResult, feedResult]
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => toDomyliError(result.reason));

    if (errors.length > 0) {
      setState({
        loading: false,
        degraded: Boolean(health || feed.length > 0),
        error: errors[0],
        health,
        feed,
      });
      return;
    }

    setState({
      loading: false,
      degraded: false,
      error: null,
      health,
      feed,
    });
  }, [householdId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}