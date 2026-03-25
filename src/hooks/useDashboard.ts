import { useCallback, useEffect, useState } from "react";
import { toDomyliError, type DomyliAppError } from "../lib/errors";
import {
  getTodayHealth,
  getTodayLoadFeed,
  type TodayHealthOutput,
  type TodayLoadFeedOutput,
} from "../services/dashboard/dashboardService";

type DashboardState = {
  loading: boolean;
  error: DomyliAppError | null;
  health: TodayHealthOutput | null;
  feed: TodayLoadFeedOutput | null;
};

const initialState: DashboardState = {
  loading: false,
  error: null,
  health: null,
  feed: null,
};

export function useDashboard() {
  const [state, setState] = useState<DashboardState>(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const [health, feed] = await Promise.all([
        getTodayHealth(),
        getTodayLoadFeed(),
      ]);

      setState({
        loading: false,
        error: null,
        health,
        feed,
      });
    } catch (error) {
      const normalized = toDomyliError(error);

      setState({
        loading: false,
        error: normalized,
        health: null,
        feed: null,
      });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}