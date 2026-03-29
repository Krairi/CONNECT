import { useCallback, useEffect, useMemo, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  adminUpsertRecipe,
  buildAdminRecipePayloadFromBlueprint,
  readRecipeBlueprintLibrary,
  readRecipeLibrary,
  type AdminRecipeUpsertInput,
  type RecipeLibraryItem,
} from "@/src/services/catalog/catalogService";
import type { DomyliRecipeBlueprint } from "@/src/constants/recipeCatalog";

type CatalogState = {
  loading: boolean;
  saving: boolean;
  publishingPack: boolean;
  error: DomyliAppError | null;
  recipes: RecipeLibraryItem[];
  blueprints: DomyliRecipeBlueprint[];
  lastSavedRecipeId: string | null;
  lastPublishedCount: number;
};

const initialState: CatalogState = {
  loading: false,
  saving: false,
  publishingPack: false,
  error: null,
  recipes: [],
  blueprints: [],
  lastSavedRecipeId: null,
  lastPublishedCount: 0,
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
      const [recipes, blueprints] = await Promise.all([
        readRecipeLibrary(),
        Promise.resolve(readRecipeBlueprintLibrary()),
      ]);

      setState((prev) => ({
        ...prev,
        loading: false,
        recipes,
        blueprints,
      }));

      return { recipes, blueprints };
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
      lastPublishedCount: 0,
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

  const publishBlueprintPack = useCallback(
    async (blueprints?: DomyliRecipeBlueprint[]) => {
      const library = blueprints?.length ? blueprints : state.blueprints;

      setState((prev) => ({
        ...prev,
        publishingPack: true,
        error: null,
        lastSavedRecipeId: null,
        lastPublishedCount: 0,
      }));

      try {
        const ids: string[] = [];

        for (const blueprint of library) {
          const recipeId = await adminUpsertRecipe(
            buildAdminRecipePayloadFromBlueprint(blueprint),
          );

          if (recipeId) {
            ids.push(recipeId);
          }
        }

        const recipes = await readRecipeLibrary();

        setState((prev) => ({
          ...prev,
          publishingPack: false,
          recipes,
          lastPublishedCount: ids.length,
        }));

        return ids;
      } catch (error) {
        const normalized = toDomyliError(error);

        setState((prev) => ({
          ...prev,
          publishingPack: false,
          error: normalized,
        }));

        throw normalized;
      }
    },
    [state.blueprints],
  );

  const recipeCount = useMemo(() => state.recipes.length, [state.recipes]);
  const blueprintCount = useMemo(() => state.blueprints.length, [state.blueprints]);

  return {
    ...state,
    recipeCount,
    blueprintCount,
    refresh,
    saveRecipe,
    publishBlueprintPack,
  };
}