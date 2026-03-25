import { useCallback, useEffect, useState } from "react";
import { toDomyliError, type DomyliAppError } from "../lib/errors";
import {
  getTodayHealth,
  getTodayLoadFeed,
  type TodayHealthOutput,
  type TodayLoadFeedItem,
} from "../services/dashboard/dashboardService";

type DashboardState = {
  loading: boolean;
  error: DomyliAppError | null;
  health: TodayHealthOutput | null;
  feed: TodayLoadFeedItem[];
};

const initialState: DashboardState = {
  loading: false,
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
    }));

    try {
      const [health, feed] = await Promise.all([
        getTodayHealth(),
        householdId ? getTodayLoadFeed({ p_household_id: householdId }) : Promise.resolve([]),
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
        feed: [],
      });
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