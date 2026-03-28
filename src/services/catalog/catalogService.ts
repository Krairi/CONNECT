import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";
import { TASK_TEMPLATES, type TaskTemplate } from "@/src/constants/taskCatalog";

export type RecipeLibraryItem = {
  recipe_id: string;
  title: string;
  description: string;
  instructions: string;
  is_active: boolean;
};

type RawRecipeLibraryItem = {
  recipe_id?: string | null;
  title?: string | null;
  description?: string | null;
  instructions?: string | null;
  is_active?: boolean | null;
};

export type AdminRecipeUpsertInput = {
  p_recipe_id?: string | null;
  p_title: string;
  p_description?: string | null;
  p_instructions?: string | null;
  p_is_active?: boolean | null;
};

function pickRows<T>(value: T[] | T | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

export async function readRecipeLibrary(): Promise<RecipeLibraryItem[]> {
  try {
    const raw = (await callRpc("rpc_recipe_library_list", {})) as
      | RawRecipeLibraryItem[]
      | RawRecipeLibraryItem
      | null;

    return pickRows(raw).map((item) => ({
      recipe_id: item.recipe_id ?? "",
      title: item.title ?? "Recette DOMYLI",
      description: item.description ?? "",
      instructions: item.instructions ?? "",
      is_active: Boolean(item.is_active),
    }));
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function adminUpsertRecipe(
  payload: AdminRecipeUpsertInput,
): Promise<string> {
  try {
    const raw = await callRpc("rpc_admin_recipe_upsert", {
      p_recipe_id: payload.p_recipe_id ?? null,
      p_title: payload.p_title.trim(),
      p_description: payload.p_description?.trim() || null,
      p_instructions: payload.p_instructions?.trim() || null,
      p_is_active: payload.p_is_active ?? true,
    });

    if (typeof raw === "string") {
      return raw;
    }

    if (Array.isArray(raw) && typeof raw[0] === "string") {
      return raw[0];
    }

    if (raw && typeof raw === "object" && "recipe_id" in raw) {
      const value = (raw as { recipe_id?: unknown }).recipe_id;
      return typeof value === "string" ? value : "";
    }

    return "";
  } catch (error) {
    throw toDomyliError(error);
  }
}

export function readTaskLibrarySocle(): TaskTemplate[] {
  return [...TASK_TEMPLATES].sort((a, b) =>
    a.label.localeCompare(b.label, "fr"),
  );
}