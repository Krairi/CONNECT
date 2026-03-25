import { useCallback, useState } from "react";

import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  upsertHumanProfile,
  type HumanProfileUpsertInput,
  type HumanProfileUpsertOutput,
} from "@/src/services/profiles/profileService";

type ProfilesState = {
  saving: boolean;
  error: DomyliAppError | null;
  lastSavedProfile: HumanProfileUpsertOutput | null;
};

const initialState: ProfilesState = {
  saving: false,
  error: null,
  lastSavedProfile: null,
};

export function useProfiles() {
  const [state, setState] = useState<ProfilesState>(initialState);

  const saveProfile = useCallback(async (payload: HumanProfileUpsertInput) => {
    setState((prev) => ({
      ...prev,
      saving: true,
      error: null,
    }));

    try {
      const result = await upsertHumanProfile(payload);

      setState((prev) => ({
        ...prev,
        saving: false,
        lastSavedProfile: result,
      }));

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
  }, []);

  return {
    ...state,
    saveProfile,
  };
}