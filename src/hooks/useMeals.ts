import { useCallback, useEffect, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  buildSessionMealDraft,
  confirmMealSlot,
  createMeal,
  listMealActiveProfiles,
  readRecipeCandidatesForMeal,
  readRecipePreviewForMeal,
  updateMeal,
  type ActiveMealProfile,
  type CreateMealRpcInput,
  type MealConfirmResult,
  type MealDraft,
  type MealMutationResult,
  type MealType,
  type RecipeCandidate,
  type RecipePreview,
  type UpdateMealRpcInput,
} from "@/src/services/meals/mealService";

type CreateMealActionInput = CreateMealRpcInput & {
  title?: string | null;
};

type UpdateMealActionInput = UpdateMealRpcInput & {
  title?: string | null;
};

type MealsState = {
  loadingProfiles: boolean;
  saving: boolean;
  confirming: boolean;
  candidatesLoading: boolean;
  previewLoading: boolean;
  error: DomyliAppError | null;
  items: MealDraft[];
  profiles: ActiveMealProfile[];
  recipeCandidates: RecipeCandidate[];
  recipePreview: RecipePreview | null;
  selectedMealType: MealType;
  selectedProfileId: string;
  selectedRecipeId: string;
  lastCreatedMealSlotId: string | null;
  lastUpdatedMealSlotId: string | null;
  lastConfirmResult: MealConfirmResult | null;
};

const initialState: MealsState = {
  loadingProfiles: false,
  saving: false,
  confirming: false,
  candidatesLoading: false,
  previewLoading: false,
  error: null,
  items: [],
  profiles: [],
  recipeCandidates: [],
  recipePreview: null,
  selectedMealType: "LUNCH",
  selectedProfileId: "",
  selectedRecipeId: "",
  lastCreatedMealSlotId: null,
  lastUpdatedMealSlotId: null,
  lastConfirmResult: null,
};

export function useMeals() {
  const [state, setState] = useState(initialState);

  const refreshActiveProfiles = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loadingProfiles: true,
      error: null,
    }));

    try {
      const profiles = await listMealActiveProfiles();

      setState((prev) => ({
        ...prev,
        loadingProfiles: false,
        profiles,
      }));

      return profiles;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({
        ...prev,
        loadingProfiles: false,
        error: normalized,
      }));
      throw normalized;
    }
  }, []);

  const refreshRecipeCandidates = useCallback(
    async (mealType?: MealType, profileId?: string, search?: string) => {
      const nextMealType = mealType ?? state.selectedMealType;
      const nextProfileId = profileId ?? state.selectedProfileId;

      setState((prev) => ({
        ...prev,
        candidatesLoading: true,
        error: null,
        selectedMealType: nextMealType,
        selectedProfileId: nextProfileId,
      }));

      try {
        const recipeCandidates = await readRecipeCandidatesForMeal(
          nextProfileId.trim(),
          nextMealType,
          search,
          120,
        );

        setState((prev) => ({
          ...prev,
          candidatesLoading: false,
          recipeCandidates,
        }));

        return recipeCandidates;
      } catch (error) {
        const normalized = toDomyliError(error);
        setState((prev) => ({
          ...prev,
          candidatesLoading: false,
          error: normalized,
        }));
        throw normalized;
      }
    },
    [state.selectedMealType, state.selectedProfileId],
  );

  const refreshRecipePreview = useCallback(
    async (mealType?: MealType, profileId?: string, recipeId?: string) => {
      const nextMealType = mealType ?? state.selectedMealType;
      const nextProfileId = profileId ?? state.selectedProfileId;
      const nextRecipeId = recipeId ?? state.selectedRecipeId;

      setState((prev) => ({
        ...prev,
        previewLoading: true,
        error: null,
        selectedMealType: nextMealType,
        selectedProfileId: nextProfileId,
        selectedRecipeId: nextRecipeId,
      }));

      try {
        const recipePreview = await readRecipePreviewForMeal(
          nextProfileId.trim(),
          nextRecipeId.trim(),
          nextMealType,
        );

        setState((prev) => ({
          ...prev,
          previewLoading: false,
          recipePreview,
        }));

        return recipePreview;
      } catch (error) {
        const normalized = toDomyliError(error);
        setState((prev) => ({
          ...prev,
          previewLoading: false,
          error: normalized,
        }));
        throw normalized;
      }
    },
    [state.selectedMealType, state.selectedProfileId, state.selectedRecipeId],
  );

  useEffect(() => {
    void refreshActiveProfiles();
  }, [refreshActiveProfiles]);

  const createMealAction = async (
    payload: CreateMealActionInput,
  ): Promise<MealMutationResult> => {
    setState((prev) => ({
      ...prev,
      saving: true,
      error: null,
      lastCreatedMealSlotId: null,
      lastUpdatedMealSlotId: null,
    }));

    try {
      const { title, ...rpcPayload } = payload;
      const result = await createMeal(rpcPayload);

      setState((prev) => ({
        ...prev,
        saving: false,
        lastCreatedMealSlotId: result.meal_slot_id,
        items: result.meal_slot_id
          ? [
              buildSessionMealDraft({
                ...rpcPayload,
                meal_slot_id: result.meal_slot_id,
                title,
                status: result.status ?? "PLANNED",
                portion_factor: result.portion_factor,
                created_at: result.created_at,
                updated_at: result.updated_at,
                inserted_ingredient_count: result.inserted_ingredient_count,
              }),
              ...prev.items.filter(
                (item) => item.meal_slot_id !== result.meal_slot_id,
              ),
            ]
          : prev.items,
      }));

      return result;
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

  const updateMealAction = async (
    payload: UpdateMealActionInput,
  ): Promise<MealMutationResult> => {
    setState((prev) => ({
      ...prev,
      saving: true,
      error: null,
      lastCreatedMealSlotId: null,
      lastUpdatedMealSlotId: null,
    }));

    try {
      const { title, ...rpcPayload } = payload;
      const result = await updateMeal(rpcPayload);

      setState((prev) => ({
        ...prev,
        saving: false,
        lastUpdatedMealSlotId: result.meal_slot_id,
        items: prev.items.map((item) =>
          item.meal_slot_id === result.meal_slot_id
            ? {
                ...item,
                planned_for: rpcPayload.p_planned_for,
                meal_type: rpcPayload.p_meal_type,
                profile_id: rpcPayload.p_profile_id,
                recipe_id: rpcPayload.p_recipe_id,
                title: title ?? item.title,
                notes: rpcPayload.p_operator_notes ?? null,
                status: result.status ?? item.status,
                portion_factor: result.portion_factor,
                updated_at: result.updated_at,
                inserted_ingredient_count: result.inserted_ingredient_count,
              }
            : item,
        ),
      }));

      return result;
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

  const confirmMealSlotAction = async (
    mealSlotId: string,
  ): Promise<MealConfirmResult> => {
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
            ? {
                ...item,
                status: result.status ?? item.status,
              }
            : item,
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
    refreshActiveProfiles,
    refreshRecipeCandidates,
    refreshRecipePreview,
    createMeal: createMealAction,
    updateMeal: updateMealAction,
    confirmMealSlot: confirmMealSlotAction,
  };
}