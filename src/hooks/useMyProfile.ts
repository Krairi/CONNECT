import { useCallback, useEffect, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  readMyProfile,
  readMyProfileStatus,
  saveMyProfile,
  type MyProfileReadModel,
  type MyProfileStatus,
  type MyProfileUpsertInput,
  type MyProfileUpsertOutput,
} from "@/src/services/profiles/myProfileService";

type MyProfileState = {
  loading: boolean;
  saving: boolean;
  error: DomyliAppError | null;
  status: MyProfileStatus | null;
  profile: MyProfileReadModel | null;
  lastSavedProfile: MyProfileUpsertOutput | null;
};

const initialState: MyProfileState = {
  loading: false,
  saving: false,
  error: null,
  status: null,
  profile: null,
  lastSavedProfile: null,
};

export function useMyProfile() {
  const [state, setState] = useState<MyProfileState>(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const [status, profile] = await Promise.all([
        readMyProfileStatus(),
        readMyProfile(),
      ]);

      setState((prev) => ({
        ...prev,
        loading: false,
        status,
        profile,
      }));

      return { status, profile };
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

  const save = useCallback(async (payload: MyProfileUpsertInput) => {
    setState((prev) => ({
      ...prev,
      saving: true,
      error: null,
      lastSavedProfile: null,
    }));

    try {
      const result = await saveMyProfile(payload);
      const [status, profile] = await Promise.all([
        readMyProfileStatus(),
        readMyProfile(),
      ]);

      setState((prev) => ({
        ...prev,
        saving: false,
        status,
        profile,
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
    refresh,
    save,
  };
}