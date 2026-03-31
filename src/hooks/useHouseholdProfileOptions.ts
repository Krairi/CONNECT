import { useCallback, useEffect, useState } from "react";

import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  listHouseholdProfileOptions,
  type HouseholdProfileOption,
} from "@/src/services/profiles/householdProfileOptionsService";

type State = {
  loading: boolean;
  error: DomyliAppError | null;
  options: HouseholdProfileOption[];
};

const initialState: State = {
  loading: false,
  error: null,
  options: [],
};

export function useHouseholdProfileOptions() {
  const [state, setState] = useState<State>(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const options = await listHouseholdProfileOptions();

      setState({
        loading: false,
        error: null,
        options,
      });

      return options;
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