import { useCallback, useEffect, useState } from "react";

import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  getTodayHealth,
  getTodayLoadFeed,
  type TodayHealth,
  type TodayLoadFeed,
} from "@/src/services/dashboard/dashboardService";

type DashboardState = {
  loading: boolean;
  error: DomyliAppError | null;
  health: TodayHealth | null;
  feed: TodayLoadFeed;
};

const initialState: DashboardState = {
  loading: false,
  error: null,
  health: null,
  feed: { members: [] },
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

      setState((prev) => ({
        ...prev,
        loading: false,
        error: normalized,
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}