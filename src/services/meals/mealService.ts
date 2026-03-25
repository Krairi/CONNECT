import { callRpc } from "../rpc";
import { unwrapRpcRow } from "../unwrapRpcRow";

export type MealPlanCreateInput = {
  p_household_id: string;
  p_day: string;
};

export type MealPlanCreateOutput = {
  meal_plan_id: string;
  household_id: string;
  day: string;
  created_at: string;
};

type RawMealPlanCreateOutput = {
  meal_plan_id?: string | null;
  household_id?: string | null;
  day?: string | null;
  created_at?: string | null;
};

export type MealSlotUpsertInput = {
  p_household_id: string;
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
  day: string;
  slot_code: string;
  status: string;
  updated_at: string;
};

type RawMealSlotUpsertOutput = {
  meal_slot_id?: string | null;
  meal_plan_id?: string | null;
  day?: string | null;
  slot_code?: string | null;
  status?: string | null;
  updated_at?: string | null;
};

export type MealConfirmV3Input = {
  p_household_id: string;
  p_meal_slot_id: string;
  p_idempotency_key: string;
};

export type MealConfirmV3Output = {
  run_status: "OK" | "NOOP" | string;
  meal_slot_id: string | null;
  proof_id?: string | null;
  confirmed_at?: string | null;
};

type RawMealConfirmV3Output = {
  run_status?: string | null;
  meal_slot_id?: string | null;
  proof_id?: string | null;
  confirmed_at?: string | null;
};

export async function createMealPlan(
  payload: MealPlanCreateInput
): Promise<MealPlanCreateOutput> {
  const rawResult = await callRpc<
    MealPlanCreateInput,
    RawMealPlanCreateOutput | RawMealPlanCreateOutput[]
  >("rpc_meal_plan_create", payload);

  const raw = unwrapRpcRow(rawResult);

  console.log("DOMYLI rpc_meal_plan_create raw =>", rawResult);
  console.log("DOMYLI rpc_meal_plan_create normalized =>", raw);

  return {
    meal_plan_id: raw?.meal_plan_id ?? "",
    household_id: raw?.household_id ?? payload.p_household_id,
    day: raw?.day ?? payload.p_day,
    created_at: raw?.created_at ?? new Date().toISOString(),
  };
}

export async function upsertMealSlot(
  payload: MealSlotUpsertInput
): Promise<MealSlotUpsertOutput> {
  const rawResult = await callRpc<
    MealSlotUpsertInput,
    RawMealSlotUpsertOutput | RawMealSlotUpsertOutput[]
  >("rpc_meal_slot_upsert", payload);

  const raw = unwrapRpcRow(rawResult);

  console.log("DOMYLI rpc_meal_slot_upsert raw =>", rawResult);
  console.log("DOMYLI rpc_meal_slot_upsert normalized =>", raw);

  return {
    meal_slot_id: raw?.meal_slot_id ?? "",
    meal_plan_id: raw?.meal_plan_id ?? payload.p_meal_plan_id,
    day: raw?.day ?? payload.p_day,
    slot_code: raw?.slot_code ?? payload.p_slot_code,
    status: raw?.status ?? payload.p_status ?? "PENDING",
    updated_at: raw?.updated_at ?? new Date().toISOString(),
  };
}

export async function confirmMealV3(
  payload: MealConfirmV3Input
): Promise<MealConfirmV3Output> {
  const rawResult = await callRpc<
    MealConfirmV3Input,
    RawMealConfirmV3Output | RawMealConfirmV3Output[]
  >("rpc_meal_confirm_v3", payload);

  const raw = unwrapRpcRow(rawResult);

  console.log("DOMYLI rpc_meal_confirm_v3 raw =>", rawResult);
  console.log("DOMYLI rpc_meal_confirm_v3 normalized =>", raw);

  return {
    run_status: raw?.run_status ?? "OK",
    meal_slot_id: raw?.meal_slot_id ?? payload.p_meal_slot_id,
    proof_id: raw?.proof_id ?? null,
    confirmed_at: raw?.confirmed_at ?? null,
  };
}