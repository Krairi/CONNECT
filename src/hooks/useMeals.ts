import { useCallback, useEffect, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  confirmMealSlot,
  createMeal,
  listMealProfiles,
  listMealRecipes,
  listMeals,
  updateMeal,
  type CreateMealInput,
  type MealConfirmResult,
  type MealItem,
  type MealProfile,
  type MealRecipe,
  type UpdateMealInput,
} from "@/src/services/meals/mealService";

type MealsState = {
  loading: boolean;
  saving: boolean;
  confirming: boolean;
  error: DomyliAppError | null;
  items: MealItem[];
  profiles: MealProfile[];
  recipes: MealRecipe[];
  lastCreatedMealSlotId: string | null;
  lastUpdatedMealSlotId: string | null;
  lastConfirmResult: MealConfirmResult | null;
};

const initialState: MealsState = {
  loading: false,
  saving: false,
  confirming: false,
  error: null,
  items: [],
  profiles: [],
  recipes: [],
  lastCreatedMealSlotId: null,
  lastUpdatedMealSlotId: null,
  lastConfirmResult: null,
};

export function useMeals() {
  const [state, setState] = useState(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const [items, profiles, recipes] = await Promise.all([
        listMeals(),
        listMealProfiles(),
        listMealRecipes(),
      ]);

      setState((prev) => ({
        ...prev,
        loading: false,
        items,
        profiles,
        recipes,
      }));

      return { items, profiles, recipes };
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        loading: false,
        error: normalized,
      }));

      throw normalized;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createMealAction = useCallback(async (payload: CreateMealInput) => {
    setState((prev) => ({
      ...prev,
      saving: true,
      error: null,
      lastCreatedMealSlotId: null,
      lastUpdatedMealSlotId: null,
    }));

    try {
      const mealSlotId = await createMeal(payload);
      const items = await listMeals();

      setState((prev) => ({
        ...prev,
        saving: false,
        items,
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

  const updateMealAction = useCallback(async (payload: UpdateMealInput) => {
    setState((prev) => ({
      ...prev,
      saving: true,
      error: null,
      lastCreatedMealSlotId: null,
      lastUpdatedMealSlotId: null,
    }));

    try {
      const mealSlotId = await updateMeal(payload);
      const items = await listMeals();

      setState((prev) => ({
        ...prev,
        saving: false,
        items,
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

  const confirmMealSlotAction = useCallback(async (mealSlotId: string) => {
    setState((prev) => ({
      ...prev,
      confirming: true,
      error: null,
      lastConfirmResult: null,
    }));

    try {
      const result = await confirmMealSlot(mealSlotId);
      const items = await listMeals();

      setState((prev) => ({
        ...prev,
        confirming: false,
        items,
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

  return {
    ...state,
    refresh,
    createMeal: createMealAction,
    updateMeal: updateMealAction,
    confirmMealSlot: confirmMealSlotAction,
  };
}