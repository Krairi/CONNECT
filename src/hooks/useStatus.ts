import { useCallback, useEffect, useMemo, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import { readStatusSnapshot, type StatusSnapshot } from "@/src/services/status/statusService";

type StatusState = {
  loading: boolean;
  error: DomyliAppError | null;
  snapshot: StatusSnapshot | null;
};

const initialState: StatusState = {
  loading: false,
  error: null,
  snapshot: null,
};

export function useStatus() {
  const [state, setState] = useState<StatusState>(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const snapshot = await readStatusSnapshot();
      setState({ loading: false, error: null, snapshot });
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

  const priorityFeed = useMemo(() => {
    if (!state.snapshot) return [];
    return [...state.snapshot.feed].sort((a, b) => {
      const rank = (value: string) => {
        const upper = value.toUpperCase();
        if (["CRITICAL", "BLOCKED", "OVERDUE"].includes(upper)) return 0;
        if (["WARNING", "LOW", "PENDING", "PROFILE_REQUIRED"].includes(upper)) return 1;
        if (["OPEN", "PLANNED", "CONFIRMED"].includes(upper)) return 2;
        return 3;
      };
      return rank(a.status) - rank(b.status);
    });
  }, [state.snapshot]);

  return {
    ...state,
    health: state.snapshot?.health ?? null,
    feed: state.snapshot?.feed ?? [],
    globalStatus: state.snapshot?.globalStatus ?? "STABLE",
    flowSummary: state.snapshot?.flowSummary ?? null,
    priorityFeed,
    refresh,
  };
}
