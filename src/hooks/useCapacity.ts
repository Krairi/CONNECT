import { useEffect, useState } from "react";

import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  getTeamCapacity,
  setMemberCapacityDaily,
  type TeamCapacity,
  type CapacitySetResult,
} from "@/src/services/capacity/capacityService";

type CapacityState = {
  loading: boolean;
  saving: boolean;
  error: DomyliAppError | null;
  capacity: TeamCapacity | null;
  lastSaved: CapacitySetResult | null;
};

const initialState: CapacityState = {
  loading: false,
  saving: false,
  error: null,
  capacity: null,
  lastSaved: null,
};

export function useCapacity(day: string) {
  const [state, setState] = useState<CapacityState>(initialState);

  const refresh = async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const result = await getTeamCapacity(day);

      setState((prev) => ({
        ...prev,
        loading: false,
        capacity: result,
      }));

      return result;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: normalized,
      }));
      throw normalized;
    }
  };

  useEffect(() => {
    void refresh();
  }, [day]);

  const saveMemberCapacity = async (
    memberUserId: string,
    capacityPointsDaily: number
  ) => {
    setState((prev) => ({
      ...prev,
      saving: true,
      error: null,
      lastSaved: null,
    }));

    try {
      const result = await setMemberCapacityDaily(
        memberUserId,
        capacityPointsDaily
      );

      setState((prev) => ({
        ...prev,
        saving: false,
        lastSaved: result,
      }));

      await refresh();

      return result;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({
        ...prev,
        saving: false,
        error: normalized,
      }));
      throw normalized;
    }
  };

  return {
    ...state,
    refresh,
    saveMemberCapacity,
  };
}