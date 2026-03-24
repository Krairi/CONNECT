import { useCallback, useEffect, useState } from "react";
import { toDomyliError, type DomyliAppError } from "../lib/errors";
import {
  getTeamCapacity,
  setMemberCapacityDaily,
  type TeamCapacityOutput,
  type CapacitySetMemberDailyOutput,
} from "../services/capacity/capacityService";

type CapacityState = {
  loading: boolean;
  saving: boolean;
  error: DomyliAppError | null;
  capacity: TeamCapacityOutput | null;
  lastSaved: CapacitySetMemberDailyOutput | null;
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

  const refresh = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const result = await getTeamCapacity({
        p_capacity_date: day,
      });

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
  }, [day]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveMemberCapacity = useCallback(
    async (memberUserId: string, capacityPointsDaily: number, reason?: string | null) => {
      setState((prev) => ({
        ...prev,
        saving: true,
        error: null,
      }));

      try {
        const result = await setMemberCapacityDaily({
          p_user_id: memberUserId,
          p_capacity_date: day,
          p_capacity_points: capacityPointsDaily,
          p_reason: reason ?? null,
        });

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
    },
    [day, refresh]
  );

  return {
    ...state,
    refresh,
    saveMemberCapacity,
  };
}