import { useCallback, useState } from "react";
import {
  upsertHumanProfile,
  type HumanProfileUpsertInput,
  type HumanProfileUpsertOutput,
} from "../services/profiles/profileService";
import { toDomyliError, type DomyliAppError } from "../lib/errors";

type UseProfilesState = {
  saving: boolean;
  error: DomyliAppError | null;
  lastSavedProfile: HumanProfileUpsertOutput | null;
};

const initialState: UseProfilesState = {
  saving: false,
  error: null,
  lastSavedProfile: null,
};

export function useProfiles() {
  const [state, setState] = useState<UseProfilesState>(initialState);

  const saveProfile = useCallback(
    async (payload: HumanProfileUpsertInput) => {
      setState((prev) => ({
        ...prev,
        saving: true,
        error: null,
      }));

      try {
        const result = await upsertHumanProfile(payload);

        setState({
          saving: false,
          error: null,
          lastSavedProfile: result,
        });

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
    [],
  );

  return {
    ...state,
    saveProfile,
  };
}