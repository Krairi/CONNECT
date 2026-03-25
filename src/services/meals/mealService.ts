import { callRpc } from "@/src/services/rpc";
import { unwrapRpcRow } from "@/src/services/unwrapRpcRow";

export type MealPlanCreateInput = {
  p_day: string;
};

export type MealPlanCreateOutput = {
  meal_plan_id: string;
  day: string;
};

type RawMealPlanCreateOutput = {
  meal_plan_id?: string | null;
  day?: string | null;
};

export type MealSlotUpsertInput = {
  p_meal_plan_id: string;
  p_day: string;
  p_slot_code: string;
  p_profile_id?: string | null;
  p_recipe_id?: string | null;
  p_status?: string | null;
};

export type MealSlotUpsertOutput = {
  meal_slot_id: string;
  meal_plan_id: string;
  status: string;
};

type RawMealSlotUpsertOutput = {
  meal_slot_id?: string | null;
  meal_plan_id?: string | null;
  status?: string | null;
};

export type MealConfirmInput = {
  p_meal_slot_id: string;
};

export type MealConfirmOutput = {
  meal_slot_id: string;
  run_status: string;
};

type RawMealConfirmOutput = {
  meal_slot_id?: string | null;
  run_status?: string | null;
  status?: string | null;
};

export async function createMealPlan(
  payload: MealPlanCreateInput
): Promise<MealPlanCreateOutput> {
  const rawResult = await callRpc<RawMealPlanCreateOutput | RawMealPlanCreateOutput[]>(
    "rpc_meal_plan_create",
    payload
  );

  const raw = unwrapRpcRow(rawResult);

  return {
    meal_plan_id: raw?.meal_plan_id ?? "",
    day: raw?.day ?? payload.p_day,
  };
}

export async function upsertMealSlot(
  payload: MealSlotUpsertInput
): Promise<MealSlotUpsertOutput> {
  const rawResult = await callRpc<RawMealSlotUpsertOutput | RawMealSlotUpsertOutput[]>(
    "rpc_meal_slot_upsert",
    payload
  );

  const raw = unwrapRpcRow(rawResult);

  return {
    meal_slot_id: raw?.meal_slot_id ?? "",
    meal_plan_id: raw?.meal_plan_id ?? payload.p_meal_plan_id,
    status: raw?.status ?? payload.p_status ?? "PENDING",
  };
}

export async function confirmMeal(
  payload: MealConfirmInput
): Promise<MealConfirmOutput> {
  const rawResult = await callRpc<RawMealConfirmOutput | RawMealConfirmOutput[]>(
    "rpc_meal_confirm_v3",
    payload
  );

  const raw = unwrapRpcRow(rawResult);

  return {
    meal_slot_id: raw?.meal_slot_id ?? payload.p_meal_slot_id,
    run_status: raw?.run_status ?? raw?.status ?? "OK",
  };
}
