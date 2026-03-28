import { useCallback, useEffect, useMemo, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  adminUpsertRecipe,
  readRecipeLibrary,
  readTaskLibrarySocle,
  type AdminRecipeUpsertInput,
  type RecipeLibraryItem,
} from "@/src/services/catalog/catalogService";
import type { TaskTemplate } from "@/src/constants/taskCatalog";

type CatalogState = {
  loading: boolean;
  saving: boolean;
  error: DomyliAppError | null;
  recipes: RecipeLibraryItem[];
  taskTemplates: TaskTemplate[];
  lastSavedRecipeId: string | null;
};

const initialState: CatalogState = {
  loading: false,
  saving: false,
  error: null,
  recipes: [],
  taskTemplates: [],
  lastSavedRecipeId: null,
};

export function useCatalog() {
  const [state, setState] = useState<CatalogState>(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const [recipes, taskTemplates] = await Promise.all([
        readRecipeLibrary(),
        Promise.resolve(readTaskLibrarySocle()),
      ]);

      setState((prev) => ({
        ...prev,
        loading: false,
        recipes,
        taskTemplates,
      }));

      return { recipes, taskTemplates };
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

  const saveRecipe = useCallback(async (payload: AdminRecipeUpsertInput) => {
    setState((prev) => ({
      ...prev,
      saving: true,
      error: null,
      lastSavedRecipeId: null,
    }));

    try {
      const recipeId = await adminUpsertRecipe(payload);
      const recipes = await readRecipeLibrary();

      setState((prev) => ({
        ...prev,
        saving: false,
        recipes,
        lastSavedRecipeId: recipeId,
      }));

      return recipeId;
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

  const recipeCount = useMemo(() => state.recipes.length, [state.recipes]);
  const taskTemplateCount = useMemo(
    () => state.taskTemplates.length,
    [state.taskTemplates],
  );

  return {
    ...state,
    recipeCount,
    taskTemplateCount,
    refresh,
    saveRecipe,
  };
}