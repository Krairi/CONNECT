import { useCallback, useEffect, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  getTodayHealth,
  getTodayLoadFeed,
  type DashboardHealth,
  type DashboardFeedItem,
} from "@/src/services/dashboard/dashboardService";

type DashboardState = {
  loading: boolean;
  error: DomyliAppError | null;
  health: DashboardHealth | null;
  feed: DashboardFeedItem[];
};

const initialState: DashboardState = {
  loading: false,
  error: null,
  health: null,
  feed: [],
};

export function useDashboard(_householdId?: string | null) {
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