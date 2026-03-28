import { useCallback, useEffect, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  readStatusFeed,
  readStatusHealth,
  type TodayHealthOutput,
  type TodayLoadFeedItem,
} from "@/src/services/status/statusService";

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
        readStatusHealth(),
        readStatusFeed(),
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