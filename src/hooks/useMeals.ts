import { useCallback, useState } from "react";
import { toDomyliError, type DomyliAppError } from "../lib/errors";
import {
  createMealPlan,
  upsertMealSlot,
  confirmMeal,
  type MealPlanCreateInput,
  type MealSlotUpsertInput,
  type MealConfirmOutput,
} from "../services/meals/mealService";

type MealDraft = {
  meal_slot_id: string;
  planned_for: string;
  meal_type: string;
  profile_id: string | null;
  recipe_id: string | null;
  title: string;
  notes: string;
  status: "PLANNED" | "CONFIRMED";
};

type MealsState = {
  loading: boolean;
  saving: boolean;
  confirming: boolean;
  error: DomyliAppError | null;
  items: MealDraft[];
  lastCreatedMealSlotId: string | null;
  lastUpdatedMealSlotId: string | null;
  lastConfirmResult: MealConfirmOutput | null;
};

const initialState: MealsState = {
  loading: false,
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

  const createMeal = useCallback(async (payload: MealPlanCreateInput) => {
    setState((prev) => ({
      ...prev,
      saving: true,
      error: null,
      lastCreatedMealSlotId: null,
    }));

    try {
      const mealSlotId = await createMealPlan(payload);

      const newItem: MealDraft = {
        meal_slot_id: mealSlotId,
        planned_for: payload.p_planned_for,
        meal_type: payload.p_meal_type,
        profile_id: payload.p_profile_id ?? null,
        recipe_id: payload.p_recipe_id ?? null,
        title: payload.p_title ?? "Repas DOMYLI",
        notes: payload.p_notes ?? "",
        status: "PLANNED",
      };

      setState((prev) => ({
        ...prev,
        saving: false,
        items: [newItem, ...prev.items],
        lastCreatedMealSlotId: mealSlotId,
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
  }, []);

  const updateMeal = useCallback(async (payload: MealSlotUpsertInput) => {
    setState((prev) => ({
      ...prev,
      saving: true,
      error: null,
      lastUpdatedMealSlotId: null,
    }));

    try {
      const mealSlotId = await upsertMealSlot(payload);

      setState((prev) => ({
        ...prev,
        saving: false,
        items: prev.items.map((item) =>
          item.meal_slot_id === mealSlotId
            ? {
                ...item,
                planned_for: payload.p_planned_for,
                meal_type: payload.p_meal_type,
                profile_id: payload.p_profile_id ?? null,
                recipe_id: payload.p_recipe_id ?? null,
                title: payload.p_title ?? item.title,
                notes: payload.p_notes ?? "",
              }
            : item
        ),
        lastUpdatedMealSlotId: mealSlotId,
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
  }, []);

  const confirmMealSlot = useCallback(async (mealSlotId: string) => {
    setState((prev) => ({
      ...prev,
      confirming: true,
      error: null,
      lastConfirmResult: null,
    }));

    try {
      const result = await confirmMeal({ p_meal_slot_id: mealSlotId });

      setState((prev) => ({
        ...prev,
        confirming: false,
        items: prev.items.map((item) =>
          item.meal_slot_id === mealSlotId
            ? { ...item, status: "CONFIRMED" }
            : item
        ),
        lastConfirmResult: result,
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

  const preloadMeal = useCallback((meal: MealDraft) => {
    setState((prev) => {
      const exists = prev.items.some((item) => item.meal_slot_id === meal.meal_slot_id);
      if (exists) return prev;

      return {
        ...prev,
        items: [meal, ...prev.items],
      };
    });
  }, []);

  return {
    ...state,
    createMeal,
    updateMeal,
    confirmMealSlot,
    preloadMeal,
  };
}