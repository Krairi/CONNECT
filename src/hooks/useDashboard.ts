import { useCallback, useEffect, useMemo, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import { readDashboardSnapshot, type DashboardActivation, type DashboardFeedItem, type DashboardHealth, type DashboardNextAction, type DashboardValueChain } from "@/src/services/dashboard/dashboardService";

type DashboardState = {
  loading: boolean;
  error: DomyliAppError | null;
  activation: DashboardActivation | null;
  valueChain: DashboardValueChain | null;
  health: DashboardHealth | null;
  feed: DashboardFeedItem[];
  nextAction: DashboardNextAction | null;
};

const initialState: DashboardState = {
  loading: false,
  error: null,
  activation: null,
  valueChain: null,
  health: null,
  feed: [],
  nextAction: null,
};

export function useDashboard() {
  const [state, setState] = useState<DashboardState>(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const snapshot = await readDashboardSnapshot();
      setState({
        loading: false,
        error: null,
        activation: snapshot.activation,
        valueChain: snapshot.valueChain,
        health: snapshot.health,
        feed: snapshot.feed,
        nextAction: snapshot.nextAction,
      });
      return snapshot;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({ ...prev, loading: false, error: normalized }));
      throw normalized;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const summary = useMemo(() => {
    return {
      alerts: state.health?.open_alert_count ?? 0,
      shopping: state.health?.open_shopping_count ?? 0,
      missingStock: state.health?.missing_stock_count ?? 0,
      overdueTasks: state.health?.overdue_tasks_count ?? 0,
      invites: state.health?.pending_invites_count ?? 0,
      profiles: state.health?.profiles_incomplete_count ?? 0,
    };
  }, [state.health]);

  return {
    ...state,
    summary,
    refresh,
  };
}
