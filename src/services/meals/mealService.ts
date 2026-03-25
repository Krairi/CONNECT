import { callRpc } from "../rpc";

export type MealType = "BREAKFAST" | "LUNCH" | "SNACK" | "DINNER" | string;

export type MealPlanCreateInput = {
  p_planned_for: string;
  p_meal_type: MealType;
  p_profile_id?: string | null;
  p_recipe_id?: string | null;
  p_title?: string | null;
  p_notes?: string | null;
};

export type MealSlotUpsertInput = {
  p_meal_slot_id?: string | null;
  p_planned_for: string;
  p_meal_type: MealType;
  p_profile_id?: string | null;
  p_recipe_id?: string | null;
  p_title?: string | null;
  p_notes?: string | null;
};

export type MealConfirmInput = {
  p_meal_slot_id: string;
};

export type MealConfirmOutput = {
  household_id: string | null;
  meal_slot_id: string | null;
  status: string | null;
  mode: string | null;
};

type RawMealConfirmOutput = {
  household_id?: string | null;
  meal_slot_id?: string | null;
  status?: string | null;
  mode?: string | null;
};

export async function createMealPlan(payload: MealPlanCreateInput): Promise<string> {
  const rawResult = await callRpc<MealPlanCreateInput, string>("rpc_meal_plan_create", {
    p_planned_for: payload.p_planned_for,
    p_meal_type: payload.p_meal_type,
    p_profile_id: payload.p_profile_id ?? null,
    p_recipe_id: payload.p_recipe_id ?? null,
    p_title: payload.p_title ?? null,
    p_notes: payload.p_notes ?? null,
  });

  console.log("DOMYLI rpc_meal_plan_create raw =>", rawResult);

  return rawResult ?? "";
}

export async function upsertMealSlot(payload: MealSlotUpsertInput): Promise<string> {
  const rawResult = await callRpc<MealSlotUpsertInput, string>("rpc_meal_slot_upsert", {
    p_meal_slot_id: payload.p_meal_slot_id ?? null,
    p_planned_for: payload.p_planned_for,
    p_meal_type: payload.p_meal_type,
    p_profile_id: payload.p_profile_id ?? null,
    p_recipe_id: payload.p_recipe_id ?? null,
    p_title: payload.p_title ?? null,
    p_notes: payload.p_notes ?? null,
  });

  console.log("DOMYLI rpc_meal_slot_upsert raw =>", rawResult);

  return rawResult ?? "";
}

export async function confirmMeal(payload: MealConfirmInput): Promise<MealConfirmOutput> {
  const rawResult = await callRpc<MealConfirmInput, RawMealConfirmOutput>(
    "rpc_meal_confirm_v3",
    {
      p_meal_slot_id: payload.p_meal_slot_id,
    }
  );

  console.log("DOMYLI rpc_meal_confirm_v3 raw =>", rawResult);

  const raw = rawResult ?? {};

  return {
    household_id: raw.household_id ?? null,
    meal_slot_id: raw.meal_slot_id ?? null,
    status: raw.status ?? null,
    mode: raw.mode ?? null,
  };
}