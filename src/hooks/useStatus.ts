import { useCallback, useEffect, useState } from "react";
import { toDomyliError, type DomyliAppError } from "../lib/errors";
import {
  getTodayHealth,
  getTodayLoadFeed,
  type TodayHealthOutput,
  type TodayLoadFeedItem,
} from "../services/status/statusService";

type StatusState = {
  loading: boolean;
  error: DomyliAppError | null;
  health: TodayHealthOutput | null;
  feed: TodayLoadFeedItem[];
};

const initialState: StatusState = {
  loading: false,
  error: null,
  health: null,
  feed: [],
};

export function useStatus(householdId: string | null) {
  const [state, setState] = useState<StatusState>(initialState);

  const refresh = useCallback(async () => {
    if (!householdId) {
      setState({
        loading: false,
        error: null,
        health: null,
        feed: [],
      });
      return;
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const [health, feed] = await Promise.all([
        getTodayHealth({ p_household_id: householdId }),
        getTodayLoadFeed({ p_household_id: householdId }),
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
  }, [householdId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}