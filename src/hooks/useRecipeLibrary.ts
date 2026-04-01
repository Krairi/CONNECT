import { useCallback, useEffect, useMemo, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  readRecipeLibrary,
  readRecipeLibraryDetail,
  type RecipeLibraryDetail,
  type RecipeLibraryItem,
} from "@/src/services/catalog/catalogService";
import type { RecipeMealType } from "@/src/constants/recipeCatalog";

type RecipeLibraryState = {
  loading: boolean;
  detailLoading: boolean;
  error: DomyliAppError | null;
  detailError: DomyliAppError | null;
  items: RecipeLibraryItem[];
  detail: RecipeLibraryDetail | null;
  mealType: RecipeMealType;
  profileId: string;
  search: string;
  selectedTagCode: string;
  selectedRecipeId: string;
};

const initialState: RecipeLibraryState = {
  loading: false,
  detailLoading: false,
  error: null,
  detailError: null,
  items: [],
  detail: null,
  mealType: "BREAKFAST",
  profileId: "",
  search: "",
  selectedTagCode: "",
  selectedRecipeId: "",
};

export function useRecipeLibrary() {
  const [state, setState] = useState<RecipeLibraryState>(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const items = await readRecipeLibrary({
        mealType: state.mealType,
        profileId: state.profileId.trim() || null,
        limit: 120,
        search: state.search.trim() || null,
        tagCode: state.selectedTagCode.trim() || null,
      });

      setState((prev) => {
        const nextSelectedRecipeId = items.some(
          (item) => item.recipe_id === prev.selectedRecipeId,
        )
          ? prev.selectedRecipeId
          : items[0]?.recipe_id ?? "";

        return {
          ...prev,
          loading: false,
          items,
          selectedRecipeId: nextSelectedRecipeId,
          detail:
            prev.detail && prev.detail.recipe_id === nextSelectedRecipeId
              ? prev.detail
              : null,
        };
      });

      return items;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        loading: false,
        error: normalized,
      }));

      throw normalized;
    }
  }, [state.mealType, state.profileId, state.search, state.selectedTagCode]);

  const refreshDetail = useCallback(async () => {
    if (!state.selectedRecipeId.trim()) {
      setState((prev) => ({
        ...prev,
        detail: null,
        detailError: null,
      }));
      return null;
    }

    setState((prev) => ({
      ...prev,
      detailLoading: true,
      detailError: null,
    }));

    try {
      const detail = await readRecipeLibraryDetail({
        recipeId: state.selectedRecipeId,
        mealType: state.mealType,
        profileId: state.profileId.trim() || null,
      });

      setState((prev) => ({
        ...prev,
        detailLoading: false,
        detail,
      }));

      return detail;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        detailLoading: false,
        detailError: normalized,
      }));

      throw normalized;
    }
  }, [state.mealType, state.profileId, state.selectedRecipeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!state.selectedRecipeId.trim()) {
      setState((prev) => ({
        ...prev,
        detail: null,
        detailError: null,
      }));
      return;
    }

    void refreshDetail();
  }, [refreshDetail, state.selectedRecipeId]);

  const allTagOptions = useMemo(() => {
    const tagMap = new Map<string, string>();

    state.items.forEach((item) => {
      item.tags.forEach((tag) => {
        if (!tagMap.has(tag.code)) {
          tagMap.set(tag.code, tag.label);
        }
      });
    });

    return [...tagMap.entries()]
      .map(([code, label]) => ({ code, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr"));
  }, [state.items]);

  const summary = useMemo(() => {
    return {
      total: state.items.length,
      blocked: state.items.filter((item) => item.fit.fit_status === "BLOCKED")
        .length,
      warning: state.items.filter((item) => item.fit.fit_status === "WARNING")
        .length,
      ok: state.items.filter((item) => item.fit.fit_status === "OK").length,
    };
  }, [state.items]);

  return {
    ...state,
    allTagOptions,
    summary,
    setMealType: (mealType: RecipeMealType) =>
      setState((prev) => ({
        ...prev,
        mealType,
      })),
    setProfileId: (profileId: string) =>
      setState((prev) => ({
        ...prev,
        profileId,
      })),
    setSearch: (search: string) =>
      setState((prev) => ({
        ...prev,
        search,
      })),
    setSelectedTagCode: (selectedTagCode: string) =>
      setState((prev) => ({
        ...prev,
        selectedTagCode,
      })),
    setSelectedRecipeId: (selectedRecipeId: string) =>
      setState((prev) => ({
        ...prev,
        selectedRecipeId,
      })),
    refresh,
    refreshDetail,
  };
}
