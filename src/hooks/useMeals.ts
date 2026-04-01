import { useCallback, useEffect, useMemo, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  confirmMealSlot,
  createMeal,
  listMealActiveProfiles,
  listMealSlotsFeed,
  readMealConfirmationServer,
  readMealRecipeDetail,
  readMealSlotDetail,
  readRecipeCandidatesForMeal,
  reopenMealSlot,
  updateMeal,
  type ActiveMealProfile,
  type MealConfirmResult,
  type MealConfirmationServerDetail,
  type MealFeedItem,
  type MealMutationResult,
  type MealRecipeDetail,
  type MealReopenResult,
  type MealSlotDetail,
  type MealType,
  type RecipeCandidate,
} from "@/src/services/meals/mealService";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

type MealsState = {
  loadingProfiles: boolean;
  candidatesLoading: boolean;
  recipeDetailLoading: boolean;
  mealFeedLoading: boolean;
  mealDetailLoading: boolean;
  mealExecutionLoading: boolean;
  saving: boolean;
  confirming: boolean;
  reopening: boolean;
  error: DomyliAppError | null;
  profiles: ActiveMealProfile[];
  selectedProfileId: string;
  selectedMealType: MealType;
  selectedTagCode: string;
  plannedFor: string;
  recipeCandidates: RecipeCandidate[];
  selectedRecipeId: string;
  selectedRecipeDetail: MealRecipeDetail | null;
  mealFeed: MealFeedItem[];
  selectedMealSlotId: string;
  selectedMealDetail: MealSlotDetail | null;
  selectedMealExecution: MealConfirmationServerDetail | null;
  lastMutation: MealMutationResult | null;
  lastConfirmResult: MealConfirmResult | null;
  lastReopenResult: MealReopenResult | null;
};

const initialState: MealsState = {
  loadingProfiles: false,
  candidatesLoading: false,
  recipeDetailLoading: false,
  mealFeedLoading: false,
  mealDetailLoading: false,
  mealExecutionLoading: false,
  saving: false,
  confirming: false,
  reopening: false,
  error: null,
  profiles: [],
  selectedProfileId: "",
  selectedMealType: "DINNER",
  selectedTagCode: "",
  plannedFor: todayIsoDate(),
  recipeCandidates: [],
  selectedRecipeId: "",
  selectedRecipeDetail: null,
  mealFeed: [],
  selectedMealSlotId: "",
  selectedMealDetail: null,
  selectedMealExecution: null,
  lastMutation: null,
  lastConfirmResult: null,
  lastReopenResult: null,
};

export function useMeals() {
  const [state, setState] = useState<MealsState>(initialState);

  const refreshProfiles = useCallback(async () => {
    setState((prev) => ({ ...prev, loadingProfiles: true, error: null }));
    try {
      const profiles = await listMealActiveProfiles();
      setState((prev) => ({
        ...prev,
        loadingProfiles: false,
        profiles,
        selectedProfileId:
          prev.selectedProfileId && profiles.some((item) => item.profile_id === prev.selectedProfileId)
            ? prev.selectedProfileId
            : profiles[0]?.profile_id ?? "",
      }));
      return profiles;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({ ...prev, loadingProfiles: false, error: normalized }));
      throw normalized;
    }
  }, []);

  const refreshCandidates = useCallback(async () => {
    if (!state.selectedProfileId) {
      setState((prev) => ({ ...prev, recipeCandidates: [], selectedRecipeId: "", selectedRecipeDetail: null }));
      return [];
    }

    setState((prev) => ({ ...prev, candidatesLoading: true, error: null }));
    try {
      const candidates = await readRecipeCandidatesForMeal(
        state.selectedProfileId,
        state.selectedMealType,
        state.selectedTagCode || undefined,
      );
      setState((prev) => {
        const nextRecipeId = candidates.some((item) => item.recipe_id === prev.selectedRecipeId)
          ? prev.selectedRecipeId
          : candidates[0]?.recipe_id ?? "";
        return {
          ...prev,
          candidatesLoading: false,
          recipeCandidates: candidates,
          selectedRecipeId: nextRecipeId,
          selectedRecipeDetail:
            prev.selectedRecipeDetail && prev.selectedRecipeDetail.recipe_id === nextRecipeId
              ? prev.selectedRecipeDetail
              : null,
        };
      });
      return candidates;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({ ...prev, candidatesLoading: false, error: normalized }));
      throw normalized;
    }
  }, [state.selectedMealType, state.selectedProfileId, state.selectedTagCode]);

  const refreshRecipeDetail = useCallback(async () => {
    if (!state.selectedProfileId || !state.selectedRecipeId) {
      setState((prev) => ({ ...prev, selectedRecipeDetail: null }));
      return null;
    }

    setState((prev) => ({ ...prev, recipeDetailLoading: true, error: null }));
    try {
      const detail = await readMealRecipeDetail(
        state.selectedProfileId,
        state.selectedRecipeId,
        state.selectedMealType,
      );
      setState((prev) => ({ ...prev, recipeDetailLoading: false, selectedRecipeDetail: detail }));
      return detail;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({ ...prev, recipeDetailLoading: false, error: normalized }));
      throw normalized;
    }
  }, [state.selectedMealType, state.selectedProfileId, state.selectedRecipeId]);

  const refreshMealFeed = useCallback(async () => {
    setState((prev) => ({ ...prev, mealFeedLoading: true, error: null }));
    try {
      const items = await listMealSlotsFeed({
        p_from_date: addDays(todayIsoDate(), -2),
        p_to_date: addDays(todayIsoDate(), 14),
        p_profile_id: state.selectedProfileId || null,
        p_meal_type: state.selectedMealType,
        p_limit: 80,
      });
      setState((prev) => ({
        ...prev,
        mealFeedLoading: false,
        mealFeed: items,
        selectedMealSlotId:
          prev.selectedMealSlotId && items.some((item) => item.meal_slot_id === prev.selectedMealSlotId)
            ? prev.selectedMealSlotId
            : items[0]?.meal_slot_id ?? prev.selectedMealSlotId,
      }));
      return items;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({ ...prev, mealFeedLoading: false, error: normalized }));
      throw normalized;
    }
  }, [state.selectedMealType, state.selectedProfileId]);

  const refreshSelectedMealDetail = useCallback(async () => {
    if (!state.selectedMealSlotId) {
      setState((prev) => ({ ...prev, selectedMealDetail: null, selectedMealExecution: null }));
      return null;
    }

    setState((prev) => ({ ...prev, mealDetailLoading: true, mealExecutionLoading: true, error: null }));
    try {
      const [detail, execution] = await Promise.all([
        readMealSlotDetail(state.selectedMealSlotId),
        readMealConfirmationServer(state.selectedMealSlotId),
      ]);
      setState((prev) => ({
        ...prev,
        mealDetailLoading: false,
        mealExecutionLoading: false,
        selectedMealDetail: detail,
        selectedMealExecution: execution,
      }));
      return detail;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({
        ...prev,
        mealDetailLoading: false,
        mealExecutionLoading: false,
        error: normalized,
      }));
      throw normalized;
    }
  }, [state.selectedMealSlotId]);

  useEffect(() => {
    void refreshProfiles();
  }, [refreshProfiles]);

  useEffect(() => {
    if (!state.selectedProfileId) return;
    void refreshCandidates();
  }, [refreshCandidates, state.selectedProfileId]);

  useEffect(() => {
    if (!state.selectedRecipeId) {
      setState((prev) => ({ ...prev, selectedRecipeDetail: null }));
      return;
    }
    void refreshRecipeDetail();
  }, [refreshRecipeDetail, state.selectedRecipeId]);

  useEffect(() => {
    if (!state.selectedProfileId) return;
    void refreshMealFeed();
  }, [refreshMealFeed, state.selectedProfileId]);

  useEffect(() => {
    if (!state.selectedMealSlotId) return;
    void refreshSelectedMealDetail();
  }, [refreshSelectedMealDetail, state.selectedMealSlotId]);

  const availableTagOptions = useMemo(() => {
    const map = new Map<string, string>();
    state.recipeCandidates.forEach((recipe) => {
      recipe.tags.forEach((tag) => {
        if (!map.has(tag.code)) map.set(tag.code, tag.label);
      });
    });
    return [...map.entries()].map(([code, label]) => ({ code, label })).sort((a, b) => a.label.localeCompare(b.label, "fr"));
  }, [state.recipeCandidates]);

  const profileLabel = useMemo(() => {
    return state.profiles.find((item) => item.profile_id === state.selectedProfileId)?.display_name ?? "";
  }, [state.profiles, state.selectedProfileId]);

  const createSelectedMeal = useCallback(async () => {
    if (!state.selectedProfileId || !state.selectedRecipeId) return null;
    setState((prev) => ({ ...prev, saving: true, error: null, lastMutation: null }));
    try {
      const result = await createMeal({
        p_profile_id: state.selectedProfileId,
        p_recipe_id: state.selectedRecipeId,
        p_planned_for: state.plannedFor,
        p_meal_type: state.selectedMealType,
      });
      setState((prev) => ({ ...prev, saving: false, lastMutation: result, selectedMealSlotId: result.meal_slot_id || prev.selectedMealSlotId }));
      await refreshMealFeed();
      if (result.meal_slot_id) {
        setState((prev) => ({ ...prev, selectedMealSlotId: result.meal_slot_id }));
      }
      return result;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({ ...prev, saving: false, error: normalized }));
      throw normalized;
    }
  }, [refreshMealFeed, state.plannedFor, state.selectedMealType, state.selectedProfileId, state.selectedRecipeId]);

  const updateSelectedMeal = useCallback(async () => {
    if (!state.selectedMealSlotId || !state.selectedProfileId || !state.selectedRecipeId) return null;
    setState((prev) => ({ ...prev, saving: true, error: null, lastMutation: null }));
    try {
      const result = await updateMeal({
        p_meal_slot_id: state.selectedMealSlotId,
        p_profile_id: state.selectedProfileId,
        p_recipe_id: state.selectedRecipeId,
        p_planned_for: state.plannedFor,
        p_meal_type: state.selectedMealType,
      });
      setState((prev) => ({ ...prev, saving: false, lastMutation: result }));
      await Promise.all([refreshMealFeed(), refreshSelectedMealDetail()]);
      return result;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({ ...prev, saving: false, error: normalized }));
      throw normalized;
    }
  }, [refreshMealFeed, refreshSelectedMealDetail, state.plannedFor, state.selectedMealSlotId, state.selectedMealType, state.selectedProfileId, state.selectedRecipeId]);

  const confirmSelectedMeal = useCallback(async () => {
    if (!state.selectedMealSlotId) return null;
    setState((prev) => ({ ...prev, confirming: true, error: null, lastConfirmResult: null }));
    try {
      const result = await confirmMealSlot(state.selectedMealSlotId);
      setState((prev) => ({ ...prev, confirming: false, lastConfirmResult: result }));
      await Promise.all([refreshMealFeed(), refreshSelectedMealDetail()]);
      return result;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({ ...prev, confirming: false, error: normalized }));
      throw normalized;
    }
  }, [refreshMealFeed, refreshSelectedMealDetail, state.selectedMealSlotId]);

  const reopenSelectedMeal = useCallback(async () => {
    if (!state.selectedMealSlotId) return null;
    setState((prev) => ({ ...prev, reopening: true, error: null, lastReopenResult: null }));
    try {
      const result = await reopenMealSlot(state.selectedMealSlotId);
      setState((prev) => ({ ...prev, reopening: false, lastReopenResult: result }));
      await Promise.all([refreshMealFeed(), refreshSelectedMealDetail()]);
      return result;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({ ...prev, reopening: false, error: normalized }));
      throw normalized;
    }
  }, [refreshMealFeed, refreshSelectedMealDetail, state.selectedMealSlotId]);

  const hydratePlanningFromMeal = useCallback((mealSlotId: string) => {
    const item = state.mealFeed.find((entry) => entry.meal_slot_id === mealSlotId);
    if (!item) return;

    setState((prev) => ({
      ...prev,
      selectedMealSlotId: mealSlotId,
      selectedProfileId: item.profile_id ?? prev.selectedProfileId,
      selectedMealType: item.meal_type,
      selectedRecipeId: item.recipe_id ?? prev.selectedRecipeId,
      plannedFor: item.planned_for || prev.plannedFor,
    }));
  }, [state.mealFeed]);

  return {
    ...state,
    availableTagOptions,
    profileLabel,
    setSelectedProfileId: (value: string) => setState((prev) => ({ ...prev, selectedProfileId: value, selectedMealSlotId: "", lastConfirmResult: null, lastReopenResult: null })),
    setSelectedMealType: (value: MealType) => setState((prev) => ({ ...prev, selectedMealType: value, selectedMealSlotId: "", lastConfirmResult: null, lastReopenResult: null })),
    setSelectedTagCode: (value: string) => setState((prev) => ({ ...prev, selectedTagCode: value, selectedRecipeId: "", selectedRecipeDetail: null })),
    setPlannedFor: (value: string) => setState((prev) => ({ ...prev, plannedFor: value })),
    setSelectedRecipeId: (value: string) => setState((prev) => ({ ...prev, selectedRecipeId: value })),
    setSelectedMealSlotId: (value: string) => setState((prev) => ({ ...prev, selectedMealSlotId: value })),
    hydratePlanningFromMeal,
    refreshProfiles,
    refreshCandidates,
    refreshRecipeDetail,
    refreshMealFeed,
    refreshSelectedMealDetail,
    createSelectedMeal,
    updateSelectedMeal,
    confirmSelectedMeal,
    reopenSelectedMeal,
  };
}
