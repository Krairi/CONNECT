import { callRpc } from "@/src/services/rpc";

export type MealType = "BREAKFAST" | "LUNCH" | "SNACK" | "DINNER";

export type MealDraft = {
  meal_slot_id: string;
  planned_for: string;
  meal_type: MealType;
  profile_id: string | null;
  recipe_id: string | null;
  title: string | null;
  notes: string | null;
  status: string | null;
};

type RawMealOutput = {
  meal_slot_id?: string | null;
  planned_for?: string | null;
  meal_type?: MealType | null;
  profile_id?: string | null;
  recipe_id?: string | null;
  title?: string | null;
  notes?: string | null;
  status?: string | null;
};

type RawConfirmOutput = {
  meal_slot_id?: string | null;
  status?: string | null;
  run_status?: string | null;
};

export type MealConfirmResult = {
  meal_slot_id: string | null;
  status: string | null;
};

export type CreateMealInput = {
  p_planned_for: string;
  p_meal_type: MealType;
  p_profile_id?: string | null;
  p_recipe_id?: string | null;
  p_title?: string | null;
  p_notes?: string | null;
};

export type UpdateMealInput = {
  p_meal_slot_id: string;
  p_planned_for: string;
  p_meal_type: MealType;
  p_profile_id?: string | null;
  p_recipe_id?: string | null;
  p_title?: string | null;
  p_notes?: string | null;
};

function normalizeMeal(raw: RawMealOutput): MealDraft {
  return {
    meal_slot_id: raw.meal_slot_id ?? "",
    planned_for: raw.planned_for ?? "",
    meal_type: (raw.meal_type ?? "LUNCH") as MealType,
    profile_id: raw.profile_id ?? null,
    recipe_id: raw.recipe_id ?? null,
    title: raw.title ?? null,
    notes: raw.notes ?? null,
    status: raw.status ?? null,
  };
}

export async function createMeal(payload: CreateMealInput): Promise<string> {
  const raw = await callRpc<RawMealOutput | null>(
    "rpc_meal_slot_upsert",
    payload,
    { unwrap: true },
  );

  return raw?.meal_slot_id ?? "";
}

export async function updateMeal(payload: UpdateMealInput): Promise<string> {
  const raw = await callRpc<RawMealOutput | null>(
    "rpc_meal_slot_upsert",
    payload,
    { unwrap: true },
  );

  return raw?.meal_slot_id ?? payload.p_meal_slot_id;
}

export async function confirmMealSlot(
  mealSlotId: string,
): Promise<MealConfirmResult> {
  const raw = await callRpc<RawConfirmOutput | null>(
    "rpc_meal_confirm_v3",
    { p_meal_slot_id: mealSlotId },
    { unwrap: true },
  );

  return {
    meal_slot_id: raw?.meal_slot_id ?? mealSlotId,
    status: raw?.status ?? raw?.run_status ?? "CONFIRMED",
  };
}

export function buildSessionMealDraft(
  input: CreateMealInput & { meal_slot_id: string; status?: string | null },
): MealDraft {
  return normalizeMeal({
    meal_slot_id: input.meal_slot_id,
    planned_for: input.p_planned_for,
    meal_type: input.p_meal_type,
    profile_id: input.p_profile_id ?? null,
    recipe_id: input.p_recipe_id ?? null,
    title: input.p_title ?? null,
    notes: input.p_notes ?? null,
    status: input.status ?? "DRAFT",
  });
}