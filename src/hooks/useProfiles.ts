import { useCallback, useEffect, useMemo, useState } from "react";

import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  listHouseholdProfileReadiness,
  type HouseholdProfileReadinessItem,
} from "@/src/services/profiles/householdProfilesService";

type ProfilesState = {
  loading: boolean;
  error: DomyliAppError | null;
  profiles: HouseholdProfileReadinessItem[];
};

const initialState: ProfilesState = {
  loading: false,
  error: null,
  profiles: [],
};

export function useProfiles() {
  const [state, setState] = useState<ProfilesState>(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const profiles = await listHouseholdProfileReadiness();

      setState({
        loading: false,
        error: null,
        profiles,
      });

      return profiles;
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

  const summary = useMemo(() => {
    const total = state.profiles.length;
    const ready = state.profiles.filter((item) => item.onboarding_state === "READY").length;
    const incomplete = state.profiles.filter(
      (item) => item.onboarding_state === "PROFILE_INCOMPLETE",
    ).length;
    const required = state.profiles.filter(
      (item) => item.onboarding_state === "PROFILE_REQUIRED",
    ).length;

    return {
      total,
      ready,
      incomplete,
      required,
      readinessRate: total > 0 ? Math.round((ready / total) * 100) : 0,
    };
  }, [state.profiles]);

  return {
    ...state,
    summary,
    refresh,
  };
}
