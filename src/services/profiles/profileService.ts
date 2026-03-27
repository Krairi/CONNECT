import { callRpc } from "@/src/services/rpc";
import { unwrapRpcRow } from "@/src/services/unwrapRpcRow";
import {
  createDomyliError,
  toDomyliError,
} from "@/src/lib/errors";

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

function isDuplicateProfileError(error: unknown): boolean {
  const normalized = toDomyliError(error);
  const haystack =
    `${normalized.code ?? ""} ${normalized.message ?? ""} ${normalized.details ?? ""} ${normalized.hint ?? ""}`.toLowerCase();

  return (
    haystack.includes("uq_human_profiles_household_member") ||
    (haystack.includes("duplicate key value violates unique constraint") &&
      haystack.includes("human_profiles"))
  );
}

export async function upsertHumanProfile(
  payload: HumanProfileUpsertInput,
): Promise<HumanProfileUpsertOutput> {
  try {
    const rawResult = await callRpc<
      RawHumanProfileUpsertOutput | RawHumanProfileUpsertOutput[] | null
    >("rpc_human_profile_upsert", payload, {
      unwrap: false,
    });

    const raw = unwrapRpcRow(rawResult);

    return {
      profile_id: raw?.profile_id ?? "",
      household_id: raw?.household_id ?? payload.p_household_id,
      display_name: raw?.display_name ?? payload.p_display_name,
      updated_at: raw?.updated_at ?? new Date().toISOString(),
    };
  } catch (error) {
    if (isDuplicateProfileError(error)) {
      throw createDomyliError({
        message: "Profil déjà présent pour ce foyer.",
        code: "DOMYLI_PROFILE_ALREADY_EXISTS",
        details: toDomyliError(error).message,
        hint: "Passage à l’inventaire possible sans recréer un second profil.",
      });
    }

    throw toDomyliError(error);
  }
}