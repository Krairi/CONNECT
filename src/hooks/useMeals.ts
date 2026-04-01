import { useCallback, useEffect, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  buildSessionMealDraft,
  confirmMealSlot,
  createMeal,
  listInventoryMappingCandidates,
  listInventoryMappingTargets,
  listMealActiveProfiles,
  readRecipeCandidatesForMeal,
  readRecipePreviewForMeal,
  updateMeal,
  upsertInventoryMapping,
  type ActiveMealProfile,
  type CreateMealRpcInput,
  type InventoryMappingCandidate,
  type InventoryMappingTarget,
  type InventoryMappingUpsertResult,
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

export type MealExecutionHistoryEntry = {
  meal_slot_id: string;
  confirmed_at: string;
  status: string | null;
  shopping_rebuild_status: string | null;
  consumption_line_count: number;
  consumed_count: number;
  partial_count: number;
  unmapped_count: number;
  alert_count: number;
  planned_for: string | null;
  meal_type: MealType | null;
  profile_id: string | null;
  recipe_id: string | null;
  title: string | null;
};

type MealsState = {
  loadingProfiles: boolean;
  saving: boolean;
  confirming: boolean;
  candidatesLoading: boolean;
  previewLoading: boolean;
  mappingTargetsLoading: boolean;
  mappingCandidatesLoading: boolean;
  mappingSaving: boolean;
  historyLoading: boolean;
  error: DomyliAppError | null;
  items: MealDraft[];
  profiles: ActiveMealProfile[];
  recipeCandidates: RecipeCandidate[];
  recipePreview: RecipePreview | null;
  inventoryMappingTargets: InventoryMappingTarget[];
  inventoryMappingCandidates: InventoryMappingCandidate[];
  confirmationHistory: MealExecutionHistoryEntry[];
  selectedMealType: MealType;
  selectedProfileId: string;
  selectedRecipeId: string;
  lastCreatedMealSlotId: string | null;
  lastUpdatedMealSlotId: string | null;
  lastConfirmResult: MealConfirmResult | null;
  lastInventoryMappingResult: InventoryMappingUpsertResult | null;
};

const initialState: MealsState = {
  loadingProfiles: false,
  saving: false,
  confirming: false,
  candidatesLoading: false,
  previewLoading: false,
  mappingTargetsLoading: false,
  mappingCandidatesLoading: false,
  mappingSaving: false,
  historyLoading: true,
  error: null,
  items: [],
  profiles: [],
  recipeCandidates: [],
  recipePreview: null,
  inventoryMappingTargets: [],
  inventoryMappingCandidates: [],
  confirmationHistory: [],
  selectedMealType: "LUNCH",
  selectedProfileId: "",
  selectedRecipeId: "",
  lastCreatedMealSlotId: null,
  lastUpdatedMealSlotId: null,
  lastConfirmResult: null,
  lastInventoryMappingResult: null,
};

const HISTORY_STORAGE_KEY = "domyli:meals:v3:confirmation-history";
const HISTORY_LIMIT = 30;

function readHistoryStorage(): MealExecutionHistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as MealExecutionHistoryEntry[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.meal_slot_id === "string" &&
          item.meal_slot_id.trim() &&
          typeof item.confirmed_at === "string" &&
          item.confirmed_at.trim(),
      )
      .slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function writeHistoryStorage(items: MealExecutionHistoryEntry[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(items.slice(0, HISTORY_LIMIT)),
    );
  } catch {
    // no-op
  }
}

function upsertHistoryEntry(
  current: MealExecutionHistoryEntry[],
  next: MealExecutionHistoryEntry,
): MealExecutionHistoryEntry[] {
  const filtered = current.filter((item) => item.meal_slot_id !== next.meal_slot_id);
  return [next, ...filtered]
    .sort((a, b) => b.confirmed_at.localeCompare(a.confirmed_at))
    .slice(0, HISTORY_LIMIT);
}

function buildHistoryEntry(
  result: MealConfirmResult,
  sourceItem?: MealDraft,
): MealExecutionHistoryEntry {
  const consumedCount = result.consumption_lines.filter(
    (line) => line.inventory_status === "CONSUMED",
  ).length;

  const partialCount = result.consumption_lines.filter(
    (line) => line.inventory_status === "PARTIAL_STOCK",
  ).length;

  const unmappedCount = result.consumption_lines.filter(
    (line) => line.inventory_status === "NO_INVENTORY_ITEM",
  ).length;

  return {
    meal_slot_id: result.meal_slot_id ?? sourceItem?.meal_slot_id ?? "",
    confirmed_at: new Date().toISOString(),
    status: result.status ?? "CONFIRMED",
    shopping_rebuild_status: result.shopping_rebuild_status ?? null,
    consumption_line_count: result.consumption_lines.length,
    consumed_count: consumedCount,
    partial_count: partialCount,
    unmapped_count: unmappedCount,
    alert_count: result.alerts.length,
    planned_for: sourceItem?.planned_for ?? null,
    meal_type: sourceItem?.meal_type ?? null,
    profile_id: sourceItem?.profile_id ?? null,
    recipe_id: sourceItem?.recipe_id ?? null,
    title: sourceItem?.title ?? null,
  };
}

export function useMeals() {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    const storedHistory = readHistoryStorage();
    setState((prev) => ({
      ...prev,
      historyLoading: false,
      confirmationHistory: storedHistory,
    }));
  }, []);

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

  const refreshInventoryMappingTargets = useCallback(
    async (includeMapped = true) => {
      setState((prev) => ({
        ...prev,
        mappingTargetsLoading: true,
        error: null,
      }));

      try {
        const inventoryMappingTargets =
          await listInventoryMappingTargets(includeMapped);

        setState((prev) => ({
          ...prev,
          mappingTargetsLoading: false,
          inventoryMappingTargets,
        }));

        return inventoryMappingTargets;
      } catch (error) {
        const normalized = toDomyliError(error);
        setState((prev) => ({
          ...prev,
          mappingTargetsLoading: false,
          error: normalized,
        }));
        throw normalized;
      }
    },
    [],
  );

  const refreshInventoryMappingCandidates = useCallback(async (search: string) => {
    setState((prev) => ({
      ...prev,
      mappingCandidatesLoading: true,
      error: null,
    }));

    try {
      const inventoryMappingCandidates = await listInventoryMappingCandidates(
        search,
        25,
      );

      setState((prev) => ({
        ...prev,
        mappingCandidatesLoading: false,
        inventoryMappingCandidates,
      }));

      return inventoryMappingCandidates;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({
        ...prev,
        mappingCandidatesLoading: false,
        error: normalized,
      }));
      throw normalized;
    }
  }, []);

  const saveInventoryMapping = useCallback(
    async (ingredientCode: string, inventoryItemId: string, notes?: string) => {
      setState((prev) => ({
        ...prev,
        mappingSaving: true,
        error: null,
        lastInventoryMappingResult: null,
      }));

      try {
        const result = await upsertInventoryMapping(
          ingredientCode,
          inventoryItemId,
          notes,
        );

        const refreshedTargets = await listInventoryMappingTargets(true);

        setState((prev) => ({
          ...prev,
          mappingSaving: false,
          inventoryMappingTargets: refreshedTargets,
          lastInventoryMappingResult: result,
        }));

        return result;
      } catch (error) {
        const normalized = toDomyliError(error);
        setState((prev) => ({
          ...prev,
          mappingSaving: false,
          error: normalized,
        }));
        throw normalized;
      }
    },
    [],
  );

  useEffect(() => {
    void refreshActiveProfiles();
    void refreshInventoryMappingTargets(true);
  }, [refreshActiveProfiles, refreshInventoryMappingTargets]);

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
      const sourceItem = state.items.find((item) => item.meal_slot_id === mealSlotId);
      const historyEntry = buildHistoryEntry(result, sourceItem);
      const nextHistory = upsertHistoryEntry(state.confirmationHistory, historyEntry);

      writeHistoryStorage(nextHistory);

      setState((prev) => ({
        ...prev,
        confirming: false,
        lastConfirmResult: result,
        confirmationHistory: nextHistory,
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
    refreshInventoryMappingTargets,
    refreshInventoryMappingCandidates,
    saveInventoryMapping,
    createMeal: createMealAction,
    updateMeal: updateMealAction,
    confirmMealSlot: confirmMealSlotAction,
  };
}