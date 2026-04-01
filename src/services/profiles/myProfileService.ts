import { isMissingRpcError, toDomyliError } from "@/src/lib/errors";
import { callRpc } from "@/src/services/rpc";

export type MyProfileStatus = {
  household_id: string;
  active_role: string;
  has_household: boolean;
  has_profile: boolean;
  profile_completed: boolean;
  profile_id: string | null;
  profile_display_name: string | null;
  derived_display_name: string;
  required_fields: string[];
  completed_required_fields: string[];
  required_field_count: number;
  completed_field_count: number;
  profile_readiness_score: number;
  workflow_state: string;
  next_route: string;
  can_access_profiled_routes: boolean;
};

type RawMyProfileStatus = {
  household_id?: string | null;
  active_role?: string | null;
  has_household?: boolean | null;
  has_profile?: boolean | null;
  profile_completed?: boolean | null;
  profile_id?: string | null;
  profile_display_name?: string | null;
  derived_display_name?: string | null;
  required_fields?: string[] | null;
  completed_required_fields?: string[] | null;
  required_field_count?: number | null;
  completed_field_count?: number | null;
  profile_readiness_score?: number | null;
  workflow_state?: string | null;
  next_route?: string | null;
  can_access_profiled_routes?: boolean | null;
};

export type MyProfileReadModel = {
  profile_id: string | null;
  household_id: string | null;
  display_name: string;
  birth_date: string | null;
  sex: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  is_pregnant: boolean;
  has_diabetes: boolean;
  goal: string | null;
  activity_level: string | null;
  allergies: string[];
  food_constraints: string[];
  cultural_constraints: string[];
  updated_at: string | null;
  required_fields: string[];
  completed_required_fields: string[];
  profile_readiness_score: number;
  workflow_state: string;
};

type RawMyProfileReadModel = {
  profile_id?: string | null;
  household_id?: string | null;
  display_name?: string | null;
  birth_date?: string | null;
  sex?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  is_pregnant?: boolean | null;
  has_diabetes?: boolean | null;
  goal?: string | null;
  activity_level?: string | null;
  allergies?: string[] | null;
  food_constraints?: string[] | null;
  cultural_constraints?: string[] | null;
  updated_at?: string | null;
  required_fields?: string[] | null;
  completed_required_fields?: string[] | null;
  profile_readiness_score?: number | null;
  workflow_state?: string | null;
};

export type MyProfileUpsertInput = {
  p_display_name?: string | null;
  p_birth_date?: string | null;
  p_sex?: string | null;
  p_height_cm?: number | null;
  p_weight_kg?: number | null;
  p_is_pregnant?: boolean | null;
  p_has_diabetes?: boolean | null;
  p_goal?: string | null;
  p_activity_level?: string | null;
  p_allergies?: string[] | null;
  p_food_constraints?: string[] | null;
  p_cultural_constraints?: string[] | null;
};

export type MyProfileUpsertOutput = {
  profile_id: string;
  household_id: string;
  display_name: string;
  updated_at: string;
  profile_completed: boolean;
  required_fields: string[];
  workflow_state: string;
  profile_readiness_score: number;
};

type RawMyProfileUpsertOutput = {
  profile_id?: string | null;
  household_id?: string | null;
  display_name?: string | null;
  updated_at?: string | null;
  profile_completed?: boolean | null;
  required_fields?: string[] | null;
  workflow_state?: string | null;
  profile_readiness_score?: number | null;
};

function firstRow<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function normalizeTextArray(value: string[] | null | undefined): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function buildDerivedDisplayName(
  candidate: string | null | undefined,
  fallback = "Profil DOMYLI",
): string {
  const normalized = typeof candidate === "string" ? candidate.trim() : "";
  return normalized.length > 0 ? normalized : fallback;
}

function normalizeStatus(row: RawMyProfileStatus | null): MyProfileStatus {
  const requiredFields = normalizeTextArray(row?.required_fields);
  const completedFields = normalizeTextArray(row?.completed_required_fields);
  const requiredFieldCount =
    typeof row?.required_field_count === "number"
      ? row.required_field_count
      : Math.max(requiredFields.length + completedFields.length, 6);
  const completedFieldCount =
    typeof row?.completed_field_count === "number"
      ? row.completed_field_count
      : completedFields.length;

  return {
    household_id: row?.household_id ?? "",
    active_role: row?.active_role ?? "MEMBER",
    has_household: row?.has_household ?? Boolean(row?.household_id),
    has_profile: Boolean(row?.has_profile),
    profile_completed: Boolean(row?.profile_completed),
    profile_id: row?.profile_id ?? null,
    profile_display_name: row?.profile_display_name ?? null,
    derived_display_name: buildDerivedDisplayName(
      row?.derived_display_name ?? row?.profile_display_name,
    ),
    required_fields: requiredFields,
    completed_required_fields: completedFields,
    required_field_count: requiredFieldCount,
    completed_field_count: completedFieldCount,
    profile_readiness_score:
      typeof row?.profile_readiness_score === "number"
        ? row.profile_readiness_score
        : requiredFieldCount > 0
          ? Math.round((completedFieldCount / requiredFieldCount) * 100)
          : 0,
    workflow_state:
      row?.workflow_state ??
      (row?.has_profile
        ? row?.profile_completed
          ? "READY"
          : "PROFILE_INCOMPLETE"
        : "PROFILE_REQUIRED"),
    next_route:
      row?.next_route ??
      (row?.profile_completed ? "/dashboard" : "/my-profile"),
    can_access_profiled_routes:
      row?.can_access_profiled_routes ?? Boolean(row?.profile_completed),
  };
}

function mapReadRow(row: RawMyProfileReadModel): MyProfileReadModel {
  return {
    profile_id: row.profile_id ?? null,
    household_id: row.household_id ?? null,
    display_name: buildDerivedDisplayName(row.display_name),
    birth_date: row.birth_date ?? null,
    sex: row.sex ?? null,
    height_cm: row.height_cm ?? null,
    weight_kg: row.weight_kg ?? null,
    is_pregnant: Boolean(row.is_pregnant),
    has_diabetes: Boolean(row.has_diabetes),
    goal: row.goal ?? null,
    activity_level: row.activity_level ?? null,
    allergies: normalizeTextArray(row.allergies),
    food_constraints: normalizeTextArray(row.food_constraints),
    cultural_constraints: normalizeTextArray(row.cultural_constraints),
    updated_at: row.updated_at ?? null,
    required_fields: normalizeTextArray(row.required_fields),
    completed_required_fields: normalizeTextArray(row.completed_required_fields),
    profile_readiness_score:
      typeof row.profile_readiness_score === "number" ? row.profile_readiness_score : 0,
    workflow_state: row.workflow_state ?? "PROFILE_REQUIRED",
  };
}

function normalizeLegacyStatus(row: RawMyProfileStatus | null): MyProfileStatus {
  const requiredFields = normalizeTextArray(row?.required_fields).filter(
    (field) => field !== "DISPLAY_NAME",
  );
  const completedRequiredFields = [
    "BIRTH_DATE",
    "SEX",
    "HEIGHT_CM",
    "WEIGHT_KG",
    "GOAL",
    "ACTIVITY_LEVEL",
  ].filter((field) => !requiredFields.includes(field));

  return normalizeStatus({
    ...row,
    derived_display_name: row?.profile_display_name ?? row?.derived_display_name ?? "Profil DOMYLI",
    required_fields: requiredFields,
    completed_required_fields: completedRequiredFields,
    required_field_count: 6,
    completed_field_count: completedRequiredFields.length,
    profile_readiness_score: Math.round((completedRequiredFields.length / 6) * 100),
    workflow_state:
      row?.has_profile === false
        ? "PROFILE_REQUIRED"
        : requiredFields.length === 0
          ? "READY"
          : "PROFILE_INCOMPLETE",
    next_route: requiredFields.length === 0 ? "/dashboard" : "/my-profile",
    can_access_profiled_routes: requiredFields.length === 0,
  });
}

export async function readMyProfileStatus(): Promise<MyProfileStatus> {
  try {
    const raw = (await callRpc("rpc_my_profile_status_v2", {}, {
      unwrap: true,
      timeoutMs: 12_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RawMyProfileStatus | RawMyProfileStatus[] | null;

    return normalizeStatus(firstRow(raw));
  } catch (error) {
    if (!isMissingRpcError(error)) {
      throw toDomyliError(error);
    }

    try {
      const raw = (await callRpc("rpc_member_onboarding_status_v1", {}, {
        unwrap: true,
        timeoutMs: 12_000,
        retries: 1,
        retryDelayMs: 900,
      })) as RawMyProfileStatus | RawMyProfileStatus[] | null;

      return normalizeLegacyStatus(firstRow(raw));
    } catch (fallbackError) {
      if (!isMissingRpcError(fallbackError)) {
        throw toDomyliError(fallbackError);
      }

      try {
        const legacyRaw = (await callRpc("rpc_my_profile_status", {}, {
          unwrap: true,
          timeoutMs: 12_000,
          retries: 1,
          retryDelayMs: 900,
        })) as RawMyProfileStatus | RawMyProfileStatus[] | null;

        return normalizeLegacyStatus(firstRow(legacyRaw));
      } catch (legacyError) {
        throw toDomyliError(legacyError);
      }
    }
  }
}

export async function readMyProfile(): Promise<MyProfileReadModel | null> {
  try {
    const raw = (await callRpc("rpc_my_profile_read_v2", {}, {
      unwrap: true,
      timeoutMs: 12_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RawMyProfileReadModel | RawMyProfileReadModel[] | null;

    const row = firstRow(raw);
    if (!row?.profile_id && !row?.display_name) {
      return null;
    }

    return mapReadRow(row);
  } catch (error) {
    if (!isMissingRpcError(error)) {
      throw toDomyliError(error);
    }

    try {
      const legacyRaw = (await callRpc("rpc_my_profile_read", {}, {
        unwrap: true,
        timeoutMs: 12_000,
        retries: 1,
        retryDelayMs: 900,
      })) as RawMyProfileReadModel | RawMyProfileReadModel[] | null;

      const row = firstRow(legacyRaw);
      if (!row?.profile_id) {
        return null;
      }

      return mapReadRow({
        ...row,
        required_fields: [],
        completed_required_fields: [],
        profile_readiness_score: 0,
        workflow_state: "PROFILE_INCOMPLETE",
      });
    } catch (legacyError) {
      throw toDomyliError(legacyError);
    }
  }
}

export async function saveMyProfile(
  payload: MyProfileUpsertInput,
): Promise<MyProfileUpsertOutput> {
  try {
    const raw = (await callRpc("rpc_my_profile_upsert_v2", payload, {
      unwrap: true,
      timeoutMs: 20_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RawMyProfileUpsertOutput | RawMyProfileUpsertOutput[] | null;

    const row = firstRow(raw);

    if (!row?.profile_id && !row?.household_id) {
      throw new Error("DOMYLI_PROFILE_UPSERT_EMPTY");
    }

    return {
      profile_id: row?.profile_id ?? "",
      household_id: row?.household_id ?? "",
      display_name: buildDerivedDisplayName(row?.display_name),
      updated_at: row?.updated_at ?? new Date().toISOString(),
      profile_completed: Boolean(row?.profile_completed),
      required_fields: normalizeTextArray(row?.required_fields),
      workflow_state: row?.workflow_state ?? "PROFILE_INCOMPLETE",
      profile_readiness_score:
        typeof row?.profile_readiness_score === "number"
          ? row.profile_readiness_score
          : 0,
    };
  } catch (error) {
    if (!isMissingRpcError(error)) {
      throw toDomyliError(error);
    }

    const status = await readMyProfileStatus();
    const fallbackDisplayName = status.derived_display_name;

    try {
      const raw = (await callRpc(
        "rpc_my_profile_upsert",
        {
          p_display_name: payload.p_display_name ?? fallbackDisplayName,
          p_birth_date: payload.p_birth_date ?? null,
          p_sex: payload.p_sex ?? null,
          p_height_cm: payload.p_height_cm ?? null,
          p_weight_kg: payload.p_weight_kg ?? null,
          p_is_pregnant: payload.p_is_pregnant ?? false,
          p_has_diabetes: payload.p_has_diabetes ?? false,
          p_goal: payload.p_goal ?? null,
          p_activity_level: payload.p_activity_level ?? null,
          p_allergies: payload.p_allergies ?? null,
          p_food_constraints: payload.p_food_constraints ?? null,
          p_cultural_constraints: payload.p_cultural_constraints ?? null,
        },
        {
          unwrap: true,
          timeoutMs: 20_000,
          retries: 1,
          retryDelayMs: 900,
        },
      )) as RawMyProfileUpsertOutput | RawMyProfileUpsertOutput[] | null;

      const row = firstRow(raw);
      const refreshedStatus = await readMyProfileStatus();

      return {
        profile_id: row?.profile_id ?? refreshedStatus.profile_id ?? "",
        household_id: row?.household_id ?? refreshedStatus.household_id,
        display_name: buildDerivedDisplayName(
          row?.display_name ?? refreshedStatus.derived_display_name,
        ),
        updated_at: row?.updated_at ?? new Date().toISOString(),
        profile_completed: refreshedStatus.profile_completed,
        required_fields: refreshedStatus.required_fields,
        workflow_state: refreshedStatus.workflow_state,
        profile_readiness_score: refreshedStatus.profile_readiness_score,
      };
    } catch (legacyError) {
      throw toDomyliError(legacyError);
    }
  }
}
