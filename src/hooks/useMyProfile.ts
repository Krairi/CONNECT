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

function buildFallbackProfile(
  status: MyProfileStatus | null,
  profile: MyProfileReadModel | null,
): MyProfileReadModel | null {
  if (profile) {
    return profile;
  }

  if (!status?.has_profile) {
    return {
      profile_id: null,
      household_id: status?.household_id ?? null,
      display_name: status?.derived_display_name ?? "Profil DOMYLI",
      birth_date: null,
      sex: null,
      height_cm: null,
      weight_kg: null,
      is_pregnant: false,
      has_diabetes: false,
      goal: null,
      activity_level: null,
      allergies: [],
      food_constraints: [],
      cultural_constraints: [],
      updated_at: null,
      required_fields: status?.required_fields ?? [],
      completed_required_fields: status?.completed_required_fields ?? [],
      profile_readiness_score: status?.profile_readiness_score ?? 0,
      workflow_state: status?.workflow_state ?? "PROFILE_REQUIRED",
    };
  }

  return {
    profile_id: status.profile_id ?? null,
    household_id: status.household_id ?? null,
    display_name: status.derived_display_name,
    birth_date: null,
    sex: null,
    height_cm: null,
    weight_kg: null,
    is_pregnant: false,
    has_diabetes: false,
    goal: null,
    activity_level: null,
    allergies: [],
    food_constraints: [],
    cultural_constraints: [],
    updated_at: null,
    required_fields: status.required_fields,
    completed_required_fields: status.completed_required_fields,
    profile_readiness_score: status.profile_readiness_score,
    workflow_state: status.workflow_state,
  };
}

async function loadProfileSafely(
  status: MyProfileStatus,
): Promise<MyProfileReadModel | null> {
  try {
    const profile = await readMyProfile();
    return buildFallbackProfile(status, profile);
  } catch (error) {
    console.warn("DOMYLI useMyProfile fallback =>", error);
    return buildFallbackProfile(status, null);
  }
}

export function useMyProfile() {
  const [state, setState] = useState(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const status = await readMyProfileStatus();
      const profile = await loadProfileSafely(status);

      setState((prev) => ({
        ...prev,
        loading: false,
        error: null,
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
      const status = await readMyProfileStatus();
      const profile = await loadProfileSafely(status);

      setState((prev) => ({
        ...prev,
        saving: false,
        error: null,
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
