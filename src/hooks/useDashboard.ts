import { useCallback, useEffect, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  getActivationStatus,
  getTodayHealth,
  getTodayLoadFeed,
  getValueChainStatus,
  type ActivationStatus,
  type DashboardFeedItem,
  type TodayHealth,
  type ValueChainStatus,
} from "@/src/services/dashboard/dashboardService";

type DashboardState = {
  loading: boolean;
  error: DomyliAppError | null;
  health: TodayHealth | null;
  feed: DashboardFeedItem[];
  activation: ActivationStatus | null;
  valueChain: ValueChainStatus | null;
};

const initialState: DashboardState = {
  loading: false,
  error: null,
  health: null,
  feed: [],
  activation: null,
  valueChain: null,
};

export function useDashboard() {
  const [state, setState] = useState(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const [health, feed, activation, valueChain] = await Promise.all([
        getTodayHealth(),
        getTodayLoadFeed(),
        getActivationStatus(),
        getValueChainStatus(),
      ]);

      setState({
        loading: false,
        error: null,
        health,
        feed,
        activation,
        valueChain,
      });

      return { health, feed, activation, valueChain };
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        loading: false,
        error: normalized,
      }));

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