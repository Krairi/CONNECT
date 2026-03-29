import { useCallback, useEffect, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  getTodayHealth,
  getTodayLoadFeed,
  type TodayHealth,
  type DashboardFeedItem,
} from "@/src/services/dashboard/dashboardService";

type StatusState = {
  loading: boolean;
  error: DomyliAppError | null;
  health: TodayHealth | null;
  feed: DashboardFeedItem[];
};

const initialState: StatusState = {
  loading: false,
  error: null,
  health: null,
  feed: [],
};

export function useStatus() {
  const [state, setState] = useState<StatusState>(initialState);

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

      return { health, feed };
    } catch (error) {
      const normalized = toDomyliError(error);

      setState({
        loading: false,
        error: normalized,
        health: null,
        feed: [],
      });

      throw normalized;
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