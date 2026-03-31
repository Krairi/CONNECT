import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";

export type MyProfileStatus = {
  household_id: string;
  has_profile: boolean;
  profile_id: string | null;
  profile_display_name: string | null;
};

type RawMyProfileStatus = {
  household_id?: string | null;
  has_profile?: boolean | null;
  profile_id?: string | null;
  profile_display_name?: string | null;
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
};

export type MyProfileUpsertInput = {
  p_display_name: string;
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
};

type RawMyProfileUpsertOutput = {
  profile_id?: string | null;
  household_id?: string | null;
  display_name?: string | null;
  updated_at?: string | null;
};

function firstRow<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function mapReadRow(row: RawMyProfileReadModel): MyProfileReadModel {
  return {
    profile_id: row.profile_id ?? null,
    household_id: row.household_id ?? null,
    display_name: row.display_name ?? "",
    birth_date: row.birth_date ?? null,
    sex: row.sex ?? null,
    height_cm: row.height_cm ?? null,
    weight_kg: row.weight_kg ?? null,
    is_pregnant: Boolean(row.is_pregnant),
    has_diabetes: Boolean(row.has_diabetes),
    goal: row.goal ?? null,
    activity_level: row.activity_level ?? null,
    allergies: row.allergies ?? [],
    food_constraints: row.food_constraints ?? [],
    cultural_constraints: row.cultural_constraints ?? [],
    updated_at: row.updated_at ?? null,
  };
}

function isReadCompatibilityIssue(error: ReturnType<typeof toDomyliError>) {
  const haystack = [
    error.message,
    error.details,
    error.hint,
    error.code,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes("birth_date") || haystack.includes("hp.birth_date");
}

export async function readMyProfileStatus(): Promise<MyProfileStatus> {
  try {
    const raw = (await callRpc("rpc_my_profile_status", {}, {
      unwrap: true,
      timeoutMs: 12_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RawMyProfileStatus | RawMyProfileStatus[] | null;

    const row = firstRow(raw);

    return {
      household_id: row?.household_id ?? "",
      has_profile: Boolean(row?.has_profile),
      profile_id: row?.profile_id ?? null,
      profile_display_name: row?.profile_display_name ?? null,
    };
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function readMyProfile(): Promise<MyProfileReadModel | null> {
  try {
    const raw = (await callRpc("rpc_my_profile_read", {}, {
      unwrap: true,
      timeoutMs: 12_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RawMyProfileReadModel | RawMyProfileReadModel[] | null;

    const row = firstRow(raw);

    if (!row?.profile_id) {
      return null;
    }

    return mapReadRow(row);
  } catch (error) {
    const normalized = toDomyliError(error);

    if (isReadCompatibilityIssue(normalized)) {
      console.warn(
        "DOMYLI rpc_my_profile_read compatibility fallback =>",
        normalized,
      );
      return null;
    }

    throw normalized;
  }
}

export async function saveMyProfile(
  payload: MyProfileUpsertInput,
): Promise<MyProfileUpsertOutput> {
  try {
    const raw = (await callRpc("rpc_my_profile_upsert", payload, {
      unwrap: true,
      timeoutMs: 20_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RawMyProfileUpsertOutput | RawMyProfileUpsertOutput[] | null;

    const row = firstRow(raw);

    if (row?.profile_id) {
      return {
        profile_id: row.profile_id ?? "",
        household_id: row.household_id ?? "",
        display_name: row.display_name ?? payload.p_display_name,
        updated_at: row.updated_at ?? new Date().toISOString(),
      };
    }

    const status = await readMyProfileStatus();

    return {
      profile_id: status.profile_id ?? "",
      household_id: status.household_id,
      display_name: status.profile_display_name ?? payload.p_display_name,
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    throw toDomyliError(error);
  }
}