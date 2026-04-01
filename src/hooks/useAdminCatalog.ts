import { useCallback, useEffect, useMemo, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  readAdminCatalogSummary,
  readAdminRecipeCatalog,
  readAdminTaskCatalog,
  setAdminRecipePublicationStatus,
  setAdminTaskPublicationStatus,
  type AdminCatalogSummary,
  type AdminRecipeCatalogItem,
  type AdminTaskCatalogItem,
  type PublicationStatus,
} from "@/src/services/admin/adminCatalogService";

type AdminCatalogTab = "recipes" | "tasks";

type AdminCatalogState = {
  loading: boolean;
  mutating: boolean;
  error: DomyliAppError | null;
  tab: AdminCatalogTab;
  search: string;
  publicationStatus: PublicationStatus;
  summary: AdminCatalogSummary | null;
  recipeItems: AdminRecipeCatalogItem[];
  taskItems: AdminTaskCatalogItem[];
  selectedRecipeId: string;
  selectedTaskTemplateCode: string;
};

const initialState: AdminCatalogState = {
  loading: false,
  mutating: false,
  error: null,
  tab: "recipes",
  search: "",
  publicationStatus: "ALL",
  summary: null,
  recipeItems: [],
  taskItems: [],
  selectedRecipeId: "",
  selectedTaskTemplateCode: "",
};

export function useAdminCatalog() {
  const [state, setState] = useState<AdminCatalogState>(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [summary, recipeItems, taskItems] = await Promise.all([
        readAdminCatalogSummary(),
        readAdminRecipeCatalog({
          publicationStatus: state.publicationStatus,
          search: state.search || null,
          limit: 240,
        }),
        readAdminTaskCatalog({
          publicationStatus: state.publicationStatus,
          search: state.search || null,
          limit: 240,
        }),
      ]);

      setState((prev) => ({
        ...prev,
        loading: false,
        summary,
        recipeItems,
        taskItems,
        selectedRecipeId:
          prev.selectedRecipeId && recipeItems.some((item) => item.recipe_id === prev.selectedRecipeId)
            ? prev.selectedRecipeId
            : recipeItems[0]?.recipe_id ?? "",
        selectedTaskTemplateCode:
          prev.selectedTaskTemplateCode &&
          taskItems.some((item) => item.task_template_code === prev.selectedTaskTemplateCode)
            ? prev.selectedTaskTemplateCode
            : taskItems[0]?.task_template_code ?? "",
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: toDomyliError(error) }));
    }
  }, [state.publicationStatus, state.search]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedRecipe = useMemo(
    () => state.recipeItems.find((item) => item.recipe_id === state.selectedRecipeId) ?? null,
    [state.recipeItems, state.selectedRecipeId],
  );

  const selectedTask = useMemo(
    () => state.taskItems.find((item) => item.task_template_code === state.selectedTaskTemplateCode) ?? null,
    [state.taskItems, state.selectedTaskTemplateCode],
  );

  const setRecipePublication = useCallback(
    async (recipeId: string, publicationStatus: Exclude<PublicationStatus, "ALL">) => {
      setState((prev) => ({ ...prev, mutating: true, error: null }));
      try {
        const updated = await setAdminRecipePublicationStatus(recipeId, publicationStatus);
        setState((prev) => ({
          ...prev,
          mutating: false,
          recipeItems: prev.recipeItems.map((item) => (item.recipe_id === recipeId ? updated : item)),
        }));
        await refresh();
      } catch (error) {
        setState((prev) => ({ ...prev, mutating: false, error: toDomyliError(error) }));
      }
    },
    [refresh],
  );

  const setTaskPublication = useCallback(
    async (taskTemplateCode: string, publicationStatus: Exclude<PublicationStatus, "ALL">) => {
      setState((prev) => ({ ...prev, mutating: true, error: null }));
      try {
        const updated = await setAdminTaskPublicationStatus(taskTemplateCode, publicationStatus);
        setState((prev) => ({
          ...prev,
          mutating: false,
          taskItems: prev.taskItems.map((item) =>
            item.task_template_code === taskTemplateCode ? updated : item,
          ),
        }));
        await refresh();
      } catch (error) {
        setState((prev) => ({ ...prev, mutating: false, error: toDomyliError(error) }));
      }
    },
    [refresh],
  );

  return {
    ...state,
    selectedRecipe,
    selectedTask,
    setTab: (tab: AdminCatalogTab) => setState((prev) => ({ ...prev, tab })),
    setSearch: (search: string) => setState((prev) => ({ ...prev, search })),
    setPublicationStatus: (publicationStatus: PublicationStatus) =>
      setState((prev) => ({ ...prev, publicationStatus })),
    setSelectedRecipeId: (selectedRecipeId: string) =>
      setState((prev) => ({ ...prev, selectedRecipeId })),
    setSelectedTaskTemplateCode: (selectedTaskTemplateCode: string) =>
      setState((prev) => ({ ...prev, selectedTaskTemplateCode })),
    refresh,
    setRecipePublication,
    setTaskPublication,
  };
}
