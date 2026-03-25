import { useState } from "react";

import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  buildSessionMealDraft,
  confirmMealSlot,
  createMeal,
  updateMeal,
  type CreateMealInput,
  type MealConfirmResult,
  type MealDraft,
  type UpdateMealInput,
} from "@/src/services/meals/mealService";

type MealsState = {
  saving: boolean;
  confirming: boolean;
  error: DomyliAppError | null;
  items: MealDraft[];
  lastCreatedMealSlotId: string | null;
  lastUpdatedMealSlotId: string | null;
  lastConfirmResult: MealConfirmResult | null;
};

const initialState: MealsState = {
  saving: false,
  confirming: false,
  error: null,
  items: [],
  lastCreatedMealSlotId: null,
  lastUpdatedMealSlotId: null,
  lastConfirmResult: null,
};

export function useMeals() {
  const [state, setState] = useState<MealsState>(initialState);

  const createMealAction = async (payload: CreateMealInput) => {
    setState((prev) => ({
      ...prev,
      saving: true,
      error: null,
      lastCreatedMealSlotId: null,
      lastUpdatedMealSlotId: null,
    }));

    try {
      const mealSlotId = await createMeal(payload);

      setState((prev) => ({
        ...prev,
        saving: false,
        lastCreatedMealSlotId: mealSlotId,
        items: mealSlotId
          ? [
              buildSessionMealDraft({
                ...payload,
                meal_slot_id: mealSlotId,
                status: "DRAFT",
              }),
              ...prev.items.filter((item) => item.meal_slot_id !== mealSlotId),
            ]
          : prev.items,
      }));

      return mealSlotId;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        saving: false,
        error: normalized,
      }));

      throw normalized;
    }
  };

  const updateMealAction = async (payload: UpdateMealInput) => {
    setState((prev) => ({
      ...prev,
      saving: true,
      error: null,
      lastCreatedMealSlotId: null,
      lastUpdatedMealSlotId: null,
    }));

    try {
      const mealSlotId = await updateMeal(payload);

      setState((prev) => ({
        ...prev,
        saving: false,
        lastUpdatedMealSlotId: mealSlotId,
        items: prev.items.map((item) =>
          item.meal_slot_id === mealSlotId
            ? {
                ...item,
                planned_for: payload.p_planned_for,
                meal_type: payload.p_meal_type,
                profile_id: payload.p_profile_id ?? null,
                recipe_id: payload.p_recipe_id ?? null,
                title: payload.p_title ?? null,
                notes: payload.p_notes ?? null,
              }
            : item
        ),
      }));

      return mealSlotId;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        saving: false,
        error: normalized,
      }));

      throw normalized;
    }
  };

  const confirmMealSlotAction = async (mealSlotId: string) => {
    setState((prev) => ({
      ...prev,
      confirming: true,
      error: null,
      lastConfirmResult: null,
    }));

    try {
      const result = await confirmMealSlot(mealSlotId);

      setState((prev) => ({
        ...prev,
        confirming: false,
        lastConfirmResult: result,
        items: prev.items.map((item) =>
          item.meal_slot_id === mealSlotId
            ? { ...item, status: result.status }
            : item
        ),
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
  };

  return {
    ...state,
    createMeal: createMealAction,
    updateMeal: updateMealAction,
    confirmMealSlot: confirmMealSlotAction,
  };
}