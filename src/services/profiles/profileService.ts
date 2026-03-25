import { callRpc } from "@/src/services/rpc";
import { unwrapRpcRow } from "@/src/services/unwrapRpcRow";

export type HumanProfileUpsertInput = {
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
  display_name: string;
  updated_at: string;
};

type RawHumanProfileUpsertOutput = {
  profile_id?: string | null;
  display_name?: string | null;
  updated_at?: string | null;
};

export async function upsertHumanProfile(
  payload: HumanProfileUpsertInput
): Promise<HumanProfileUpsertOutput> {
  const rawResult = await callRpc<
    RawHumanProfileUpsertOutput | RawHumanProfileUpsertOutput[]
  >("rpc_human_profile_upsert", payload);

  const raw = unwrapRpcRow(rawResult);

  return {
    profile_id: raw?.profile_id ?? "",
    display_name: raw?.display_name ?? payload.p_display_name,
    updated_at: raw?.updated_at ?? new Date().toISOString(),
  };
}