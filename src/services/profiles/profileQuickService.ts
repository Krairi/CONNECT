import { callRpc } from "../rpc";

export type QuickHumanProfile = {
  profile_id: string;
  household_id: string;
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
  is_active: boolean;
  is_connectable: boolean;
  member_user_id: string | null;
  updated_at: string | null;
};

export type QuickHumanProfileUpsertInput = {
  p_profile_id?: string | null;
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
  p_is_connectable?: boolean | null;
  p_member_user_id?: string | null;
};

function toArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function mapProfile(value: unknown): QuickHumanProfile {
  const raw = (value ?? {}) as Record<string, unknown>;

  return {
    profile_id: String(raw.profile_id ?? ""),
    household_id: String(raw.household_id ?? ""),
    display_name: String(raw.display_name ?? ""),
    birth_date: typeof raw.birth_date === "string" ? raw.birth_date : null,
    sex: typeof raw.sex === "string" ? raw.sex : null,
    height_cm: typeof raw.height_cm === "number" ? raw.height_cm : raw.height_cm == null ? null : Number(raw.height_cm),
    weight_kg: typeof raw.weight_kg === "number" ? raw.weight_kg : raw.weight_kg == null ? null : Number(raw.weight_kg),
    is_pregnant: Boolean(raw.is_pregnant),
    has_diabetes: Boolean(raw.has_diabetes),
    goal: typeof raw.goal === "string" ? raw.goal : null,
    activity_level: typeof raw.activity_level === "string" ? raw.activity_level : null,
    allergies: toArray(raw.allergies),
    food_constraints: toArray(raw.food_constraints),
    cultural_constraints: toArray(raw.cultural_constraints),
    is_active: Boolean(raw.is_active),
    is_connectable: Boolean(raw.is_connectable),
    member_user_id: typeof raw.member_user_id === "string" ? raw.member_user_id : null,
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : null,
  };
}

export async function listQuickHumanProfiles(): Promise<QuickHumanProfile[]> {
  const raw = await callRpc("rpc_human_profile_quick_list", {});
  const array = Array.isArray(raw) ? raw : raw ?? [];
  return Array.isArray(array) ? array.map(mapProfile) : [];
}

export async function upsertQuickHumanProfile(
  payload: QuickHumanProfileUpsertInput,
): Promise<QuickHumanProfile> {
  const raw = await callRpc("rpc_human_profile_quick_upsert", payload);
  return mapProfile(raw);
}