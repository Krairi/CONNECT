import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";
import { TASK_TEMPLATES, type TaskTemplate } from "@/src/constants/taskCatalog";
import type {
  RecipeDifficulty,
  RecipeFitStatus,
  RecipeMealType,
} from "@/src/constants/recipeCatalog";

export type RecipeLibraryTag = {
  code: string;
  label: string;
};

export type RecipeLibraryFit = {
  fit_status: RecipeFitStatus;
  fit_score: number;
  warnings: string[];
  fit_reasons: string[];
  blocked_reasons: string[];
};

export type RecipeLibraryItem = {
  recipe_id: string;
  recipe_code: string;
  title: string;
  short_description: string;
  description: string;
  difficulty: RecipeDifficulty | string;
  meal_types: RecipeMealType[];
  prep_minutes: number;
  cook_minutes: number;
  stock_intensity: string;
  default_servings: number;
  tags: RecipeLibraryTag[];
  fit: RecipeLibraryFit;
  instructions: string;
  is_active: boolean;
};

type RawRecipeLibraryTag = {
  code?: string | null;
  label?: string | null;
};

type RawRecipeLibraryFit = {
  fit_status?: string | null;
  fit_score?: number | null;
  warnings?: string[] | null;
  fit_reasons?: string[] | null;
  blocked_reasons?: string[] | null;
};

type RawRecipeLibraryItem = {
  recipe_id?: string | null;
  recipe_code?: string | null;
  title?: string | null;
  short_description?: string | null;
  description?: string | null;
  difficulty?: string | null;
  meal_types?: string[] | null;
  prep_minutes?: number | null;
  cook_minutes?: number | null;
  stock_intensity?: string | null;
  default_servings?: number | null;
  tags?: RawRecipeLibraryTag[] | null;
  fit?: RawRecipeLibraryFit | null;
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

export type ReadRecipeLibraryInput = {
  mealType?: RecipeMealType | null;
  profileId?: string | null;
  limit?: number;
};

function pickRows<T>(value: T[] | T | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function normalizeFit(raw?: RawRecipeLibraryFit | null): RecipeLibraryFit {
  return {
    fit_status: (raw?.fit_status ?? "OK") as RecipeFitStatus,
    fit_score: Number(raw?.fit_score ?? 100),
    warnings: Array.isArray(raw?.warnings) ? raw!.warnings.filter(Boolean) : [],
    fit_reasons: Array.isArray(raw?.fit_reasons)
      ? raw!.fit_reasons.filter(Boolean)
      : [],
    blocked_reasons: Array.isArray(raw?.blocked_reasons)
      ? raw!.blocked_reasons.filter(Boolean)
      : [],
  };
}

function normalizeTags(raw?: RawRecipeLibraryTag[] | null): RecipeLibraryTag[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((tag) => ({
      code: tag.code ?? "",
      label: tag.label ?? tag.code ?? "",
    }))
    .filter((tag) => Boolean(tag.code || tag.label));
}

function normalizeRecipe(item: RawRecipeLibraryItem): RecipeLibraryItem {
  const shortDescription =
    item.short_description?.trim() ||
    item.description?.trim() ||
    "Description non renseignée.";

  return {
    recipe_id: item.recipe_id ?? "",
    recipe_code: item.recipe_code ?? "",
    title: item.title ?? "Recette DOMYLI",
    short_description: shortDescription,
    description: shortDescription,
    difficulty: item.difficulty ?? "EASY",
    meal_types: (item.meal_types ?? []).filter(Boolean) as RecipeMealType[],
    prep_minutes: Number(item.prep_minutes ?? 0),
    cook_minutes: Number(item.cook_minutes ?? 0),
    stock_intensity: item.stock_intensity ?? "LOW",
    default_servings: Number(item.default_servings ?? 1),
    tags: normalizeTags(item.tags),
    fit: normalizeFit(item.fit),
    instructions: item.instructions ?? "",
    is_active: Boolean(item.is_active ?? true),
  };
}

export async function readRecipeLibrary(
  input: ReadRecipeLibraryInput = {},
): Promise<RecipeLibraryItem[]> {
  try {
    const raw = (await callRpc("rpc_recipe_library_list", {
      p_meal_type: input.mealType ?? null,
      p_profile_id: input.profileId?.trim() || null,
      p_limit: input.limit ?? 80,
    })) as RawRecipeLibraryItem[] | RawRecipeLibraryItem | null;

    return pickRows(raw)
      .map(normalizeRecipe)
      .sort((a, b) => a.title.localeCompare(b.title, "fr"));
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
  return [...TASK_TEMPLATES].sort((a, b) => a.label.localeCompare(b.label, "fr"));
}
