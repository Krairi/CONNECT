import { useCallback, useState } from "react";

import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  createMealPlan,
  upsertMealSlot,
  confirmMeal,
  type MealPlanCreateOutput,
  type MealSlotUpsertInput,
  type MealSlotUpsertOutput,
  type MealConfirmOutput,
} from "@/src/services/meals/mealService";

type MealsState = {
  creatingPlan: boolean;
  savingSlot: boolean;
  confirming: boolean;
  error: DomyliAppError | null;
  lastCreatedPlan: MealPlanCreateOutput | null;
  lastSavedSlot: MealSlotUpsertOutput | null;
  lastConfirmedMeal: MealConfirmOutput | null;
};

const initialState: MealsState = {
  creatingPlan: false,
  savingSlot: false,
  confirming: false,
  error: null,
  lastCreatedPlan: null,
  lastSavedSlot: null,
  lastConfirmedMeal: null,
};

export function useMeals() {
  const [state, setState] = useState(initialState);

  const createPlan = useCallback(async (day: string) => {
    setState((prev) => ({
      ...prev,
      creatingPlan: true,
      error: null,
    }));

    try {
      const result = await createMealPlan({
        p_day: day,
      });

      setState((prev) => ({
        ...prev,
        creatingPlan: false,
        lastCreatedPlan: result,
      }));

      return result;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        creatingPlan: false,
        error: normalized,
      }));

      throw normalized;
    }
  }, []);

  const saveSlot = useCallback(async (payload: {
    mealPlanId: string;
    day: string;
    slotCode: string;
    profileId?: string | null;
    recipeId?: string | null;
    status?: string | null;
  }) => {
    setState((prev) => ({
      ...prev,
      savingSlot: true,
      error: null,
    }));

    try {
      const result = await upsertMealSlot({
        p_meal_plan_id: payload.mealPlanId,
        p_day: payload.day,
        p_slot_code: payload.slotCode,
        p_profile_id: payload.profileId ?? null,
        p_recipe_id: payload.recipeId ?? null,
        p_status: payload.status ?? "PENDING",
      } satisfies MealSlotUpsertInput);

      setState((prev) => ({
        ...prev,
        savingSlot: false,
        lastSavedSlot: result,
      }));

      return result;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        savingSlot: false,
        error: normalized,
      }));

      throw normalized;
    }
  }, []);

  const confirmMealAction = useCallback(async (mealSlotId: string) => {
    setState((prev) => ({
      ...prev,
      confirming: true,
      error: null,
    }));

    try {
      const result = await confirmMeal({
        p_meal_slot_id: mealSlotId,
      });

      setState((prev) => ({
        ...prev,
        confirming: false,
        lastConfirmedMeal: result,
      }));

      return result;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        confirming: false,
        error: normalized,
      }));

      throw normalized;
    }
  }, []);

  return {
    ...state,
    createPlan,
    saveSlot,
    confirmMeal: confirmMealAction,
  };
}
