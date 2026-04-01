import { useCallback, useEffect, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  readReadinessStatus,
  type ReadinessStatus,
} from "@/src/services/readiness/readinessService";

type ReadinessState = {
  loading: boolean;
  error: DomyliAppError | null;
  readiness: ReadinessStatus | null;
};

const initialState: ReadinessState = {
  loading: false,
  error: null,
  readiness: null,
};

export function useReadiness() {
  const [state, setState] = useState<ReadinessState>(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const readiness = await readReadinessStatus();
      setState({ loading: false, error: null, readiness });
      return readiness;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState({ loading: false, error: normalized, readiness: null });
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
