import { callRpc } from "../rpc";
import { unwrapRpcRow } from "../unwrapRpcRow";

export type HumanProfileUpsertInput = {
  p_household_id: string;
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

export async function upsertHumanProfile(
  payload: HumanProfileUpsertInput,
): Promise<HumanProfileUpsertOutput> {
  const rawResult = await callRpc("rpc_human_profile_upsert", payload);
  const raw = unwrapRpcRow<RawHumanProfileUpsertOutput>(rawResult);

  console.log("DOMYLI rpc_human_profile_upsert raw =>", rawResult);
  console.log("DOMYLI rpc_human_profile_upsert normalized =>", raw);

  return {
    profile_id: raw?.profile_id ?? "",
    household_id: raw?.household_id ?? payload.p_household_id,
    display_name: raw?.display_name ?? payload.p_display_name,
    updated_at: raw?.updated_at ?? new Date().toISOString(),
  };
}