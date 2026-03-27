import { callRpc } from "@/src/services/rpc";
import { unwrapRpcRow } from "@/src/services/unwrapRpcRow";
import { toDomyliError } from "@/src/lib/errors";

export type HumanProfileUpsertInput = {
  p_household_id: string;
  p_member_user_id?: string | null;
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

export type HumanProfileUpsertOutput = {
  profile_id: string;
  household_id: string;
  display_name: string;
  updated_at: string;
};

type RawHumanProfileUpsertOutput = {
  profile_id?: string | null;
  household_id?: string | null;
  display_name?: string | null;
  updated_at?: string | null;
};

function trimToNull(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function uniquePayloads(
  payloads: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  const seen = new Set<string>();
  const result: Array<Record<string, unknown>> = [];

  for (const payload of payloads) {
    const key = JSON.stringify(payload);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(payload);
  }

  return result;
}

function shouldRetryMissingRpc(error: unknown): boolean {
  const normalized = toDomyliError(error);
  const haystack =
    `${normalized.message ?? ""} ${normalized.details ?? ""} ${normalized.hint ?? ""}`.toLowerCase();

  return (
    normalized.code === "PGRST202" ||
    haystack.includes("could not find the function") ||
    haystack.includes("schema cache") ||
    haystack.includes("rpc_human_profile_upsert")
  );
}

function buildPayloadVariants(
  payload: HumanProfileUpsertInput,
): Array<Record<string, unknown>> {
  const fullPayload: Record<string, unknown> = {
    p_household_id: payload.p_household_id,
    p_member_user_id: payload.p_member_user_id ?? null,
    p_display_name: payload.p_display_name.trim(),
    p_birth_date: trimToNull(payload.p_birth_date),
    p_sex: trimToNull(payload.p_sex),
    p_height_cm: payload.p_height_cm ?? null,
    p_weight_kg: payload.p_weight_kg ?? null,
    p_is_pregnant: payload.p_is_pregnant ?? null,
    p_has_diabetes: payload.p_has_diabetes ?? null,
    p_goal: trimToNull(payload.p_goal),
    p_activity_level: trimToNull(payload.p_activity_level),
    p_allergies: payload.p_allergies ?? null,
    p_food_constraints: payload.p_food_constraints ?? null,
    p_cultural_constraints: payload.p_cultural_constraints ?? null,
  };

  const scalarPayload: Record<string, unknown> = {
    p_household_id: payload.p_household_id,
    p_display_name: payload.p_display_name.trim(),
    p_birth_date: trimToNull(payload.p_birth_date),
    p_sex: trimToNull(payload.p_sex),
    p_height_cm: payload.p_height_cm ?? null,
    p_weight_kg: payload.p_weight_kg ?? null,
    p_is_pregnant: payload.p_is_pregnant ?? null,
    p_has_diabetes: payload.p_has_diabetes ?? null,
    p_goal: trimToNull(payload.p_goal),
    p_activity_level: trimToNull(payload.p_activity_level),
  };

  const minimalPayload: Record<string, unknown> = {
    p_household_id: payload.p_household_id,
    p_display_name: payload.p_display_name.trim(),
  };

  return uniquePayloads([fullPayload, scalarPayload, minimalPayload]);
}

function normalizeProfile(
  raw: RawHumanProfileUpsertOutput | RawHumanProfileUpsertOutput[] | null | undefined,
  payload: HumanProfileUpsertInput,
): HumanProfileUpsertOutput {
  const row = unwrapRpcRow(raw);

  return {
    profile_id: row?.profile_id ?? "",
    household_id: row?.household_id ?? payload.p_household_id,
    display_name: row?.display_name ?? payload.p_display_name,
    updated_at: row?.updated_at ?? new Date().toISOString(),
  };
}

export async function upsertHumanProfile(
  payload: HumanProfileUpsertInput,
): Promise<HumanProfileUpsertOutput> {
  const candidates = buildPayloadVariants(payload);
  let lastError: unknown = null;

  for (const candidate of candidates) {
    try {
      const rawResult = await callRpc<
        RawHumanProfileUpsertOutput | RawHumanProfileUpsertOutput[] | null
      >("rpc_human_profile_upsert", candidate, {
        unwrap: false,
      });

      return normalizeProfile(rawResult, payload);
    } catch (error) {
      lastError = error;

      if (!shouldRetryMissingRpc(error)) {
        throw toDomyliError(error);
      }
    }
  }

  throw toDomyliError(lastError);
}