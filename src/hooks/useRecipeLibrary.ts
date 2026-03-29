import { useCallback, useEffect, useMemo, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  readRecipeLibrary,
  type RecipeLibraryItem,
} from "@/src/services/catalog/catalogService";
import type { RecipeMealType } from "@/src/constants/recipeCatalog";

type RecipeLibraryState = {
  loading: boolean;
  error: DomyliAppError | null;
  items: RecipeLibraryItem[];
  mealType: RecipeMealType;
  profileId: string;
  search: string;
  selectedTagCode: string;
};

const initialState: RecipeLibraryState = {
  loading: false,
  error: null,
  items: [],
  mealType: "BREAKFAST",
  profileId: "",
  search: "",
  selectedTagCode: "",
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
      });

      setState((prev) => ({
        ...prev,
        loading: false,
        items,
      }));

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
  }, [state.mealType, state.profileId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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

  const filteredItems = useMemo(() => {
    const normalizedSearch = state.search.trim().toLowerCase();

    return state.items.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.title.toLowerCase().includes(normalizedSearch) ||
        item.short_description.toLowerCase().includes(normalizedSearch) ||
        item.recipe_code.toLowerCase().includes(normalizedSearch);

      const matchesTag =
        !state.selectedTagCode ||
        item.tags.some((tag) => tag.code === state.selectedTagCode);

      return matchesSearch && matchesTag;
    });
  }, [state.items, state.search, state.selectedTagCode]);

  const summary = useMemo(() => {
    return {
      total: filteredItems.length,
      blocked: filteredItems.filter((item) => item.fit.fit_status === "BLOCKED")
        .length,
      warning: filteredItems.filter((item) => item.fit.fit_status === "WARNING")
        .length,
      ok: filteredItems.filter((item) => item.fit.fit_status === "OK").length,
    };
  }, [filteredItems]);

  return {
    ...state,
    items: filteredItems,
    allItems: state.items,
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
    refresh,
  };
}
