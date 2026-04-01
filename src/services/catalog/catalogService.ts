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

export type RecipeLibraryBadge = {
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

export type RecipeInstructionStep = {
  step_code: string;
  sort_order: number;
  label: string;
  source: string;
};

export type RecipeDetailIngredient = {
  ingredient_code: string;
  ingredient_label: string;
  nutrition_role: string;
  unit_code: string;
  qty_base: number;
  qty_adjusted: number;
  scaling_policy: string;
  sort_order: number;
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
  instruction_steps: RecipeInstructionStep[];
  is_active: boolean;
  publication_status: string;
  image_url: string | null;
  image_alt: string;
  hero_badges: RecipeLibraryBadge[];
  detail_readiness: "BASE" | "MEDIUM" | "RICH" | string;
};

export type RecipeLibraryDetail = RecipeLibraryItem & {
  detail_context: "PROFILE_TARGETED" | "HOUSEHOLD_LIBRARY" | string;
  profile_targeted: boolean;
  selected_profile_id: string | null;
  selected_meal_type: RecipeMealType | null;
  ingredients: RecipeDetailIngredient[];
  nutrition_summary: Record<string, unknown>;
  stock_projection: Record<string, unknown>;
  portion_factor: number;
};

type RawRecipeLibraryTag = {
  code?: string | null;
  label?: string | null;
};

type RawRecipeLibraryBadge = {
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

type RawRecipeInstructionStep = {
  step_code?: string | null;
  sort_order?: number | null;
  label?: string | null;
  source?: string | null;
};

type RawRecipeDetailIngredient = {
  ingredient_code?: string | null;
  ingredient_label?: string | null;
  nutrition_role?: string | null;
  unit_code?: string | null;
  qty_base?: number | null;
  qty_adjusted?: number | null;
  scaling_policy?: string | null;
  sort_order?: number | null;
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
  instruction_steps?: RawRecipeInstructionStep[] | null;
  is_active?: boolean | null;
  publication_status?: string | null;
  image_url?: string | null;
  image_alt?: string | null;
  hero_badges?: RawRecipeLibraryBadge[] | null;
  detail_readiness?: string | null;
  detail_context?: string | null;
  profile_targeted?: boolean | null;
  selected_profile_id?: string | null;
  selected_meal_type?: string | null;
  ingredients?: RawRecipeDetailIngredient[] | null;
  nutrition_summary?: Record<string, unknown> | null;
  stock_projection?: Record<string, unknown> | null;
  portion_factor?: number | null;
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
  search?: string | null;
  tagCode?: string | null;
};

export type ReadRecipeLibraryDetailInput = {
  recipeId: string;
  mealType?: RecipeMealType | null;
  profileId?: string | null;
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
    warnings: Array.isArray(raw?.warnings) ? raw.warnings.filter(Boolean) : [],
    fit_reasons: Array.isArray(raw?.fit_reasons)
      ? raw.fit_reasons.filter(Boolean)
      : [],
    blocked_reasons: Array.isArray(raw?.blocked_reasons)
      ? raw.blocked_reasons.filter(Boolean)
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

function normalizeBadges(
  raw?: RawRecipeLibraryBadge[] | null,
): RecipeLibraryBadge[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((badge) => ({
      code: badge.code ?? "",
      label: badge.label ?? badge.code ?? "",
    }))
    .filter((badge) => Boolean(badge.code || badge.label));
}

function normalizeInstructionSteps(
  raw?: RawRecipeInstructionStep[] | null,
): RecipeInstructionStep[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((step, index) => ({
      step_code: step.step_code ?? `STEP_${String(index + 1).padStart(2, "0")}`,
      sort_order: Number(step.sort_order ?? index + 1),
      label: step.label ?? "Étape DOMYLI",
      source: step.source ?? "STRUCTURED",
    }))
    .filter((step) => Boolean(step.label.trim()))
    .sort((a, b) => a.sort_order - b.sort_order);
}

function normalizeIngredients(
  raw?: RawRecipeDetailIngredient[] | null,
): RecipeDetailIngredient[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((ingredient) => ({
      ingredient_code: ingredient.ingredient_code ?? "UNKNOWN_INGREDIENT",
      ingredient_label: ingredient.ingredient_label ?? "Ingrédient",
      nutrition_role: ingredient.nutrition_role ?? "OTHER",
      unit_code: ingredient.unit_code ?? "UNIT",
      qty_base: Number(ingredient.qty_base ?? 0),
      qty_adjusted: Number(ingredient.qty_adjusted ?? 0),
      scaling_policy: ingredient.scaling_policy ?? "FULL",
      sort_order: Number(ingredient.sort_order ?? 100),
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
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
    description: item.description?.trim() || shortDescription,
    difficulty: item.difficulty ?? "EASY",
    meal_types: (item.meal_types ?? []).filter(Boolean) as RecipeMealType[],
    prep_minutes: Number(item.prep_minutes ?? 0),
    cook_minutes: Number(item.cook_minutes ?? 0),
    stock_intensity: item.stock_intensity ?? "LOW",
    default_servings: Number(item.default_servings ?? 1),
    tags: normalizeTags(item.tags),
    fit: normalizeFit(item.fit),
    instructions: item.instructions ?? "",
    instruction_steps: normalizeInstructionSteps(item.instruction_steps),
    is_active: Boolean(item.is_active ?? true),
    publication_status: item.publication_status ?? "PUBLISHED",
    image_url: item.image_url?.trim() || null,
    image_alt: item.image_alt?.trim() || item.title?.trim() || "Visuel recette DOMYLI",
    hero_badges: normalizeBadges(item.hero_badges),
    detail_readiness: item.detail_readiness ?? "BASE",
  };
}

function normalizeRecipeDetail(item: RawRecipeLibraryItem): RecipeLibraryDetail {
  const recipe = normalizeRecipe(item);

  return {
    ...recipe,
    detail_context: item.detail_context ?? "HOUSEHOLD_LIBRARY",
    profile_targeted: Boolean(item.profile_targeted ?? false),
    selected_profile_id: item.selected_profile_id ?? null,
    selected_meal_type: (item.selected_meal_type ?? null) as RecipeMealType | null,
    ingredients: normalizeIngredients(item.ingredients),
    nutrition_summary: item.nutrition_summary ?? {},
    stock_projection: item.stock_projection ?? {},
    portion_factor: Number(item.portion_factor ?? 1),
    fit: normalizeFit(item.fit),
  };
}

export async function readRecipeLibrary(
  input: ReadRecipeLibraryInput = {},
): Promise<RecipeLibraryItem[]> {
  try {
    const raw = (await callRpc("rpc_recipe_library_list_v2", {
      p_meal_type: input.mealType ?? null,
      p_profile_id: input.profileId?.trim() || null,
      p_limit: input.limit ?? 80,
      p_search: input.search?.trim() || null,
      p_tag_code: input.tagCode?.trim() || null,
    }, {
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RawRecipeLibraryItem[] | RawRecipeLibraryItem | null;

    return pickRows(raw)
      .map(normalizeRecipe)
      .filter((item) => Boolean(item.recipe_id))
      .sort((a, b) => a.title.localeCompare(b.title, "fr"));
  } catch (error) {
    try {
      const raw = (await callRpc("rpc_recipe_library_list", {
        p_meal_type: input.mealType ?? null,
        p_profile_id: input.profileId?.trim() || null,
        p_limit: input.limit ?? 80,
      }, {
        timeoutMs: 15_000,
        retries: 1,
        retryDelayMs: 900,
      })) as RawRecipeLibraryItem[] | RawRecipeLibraryItem | null;

      return pickRows(raw)
        .map(normalizeRecipe)
        .filter((item) => Boolean(item.recipe_id))
        .sort((a, b) => a.title.localeCompare(b.title, "fr"));
    } catch (legacyError) {
      throw toDomyliError(legacyError ?? error);
    }
  }
}

export async function readRecipeLibraryDetail(
  input: ReadRecipeLibraryDetailInput,
): Promise<RecipeLibraryDetail | null> {
  try {
    if (!input.recipeId.trim()) {
      return null;
    }

    const raw = (await callRpc("rpc_recipe_library_read_v1", {
      p_recipe_id: input.recipeId.trim(),
      p_profile_id: input.profileId?.trim() || null,
      p_meal_type: input.mealType ?? null,
    }, {
      unwrap: true,
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RawRecipeLibraryItem | null;

    return raw ? normalizeRecipeDetail(raw) : null;
  } catch (error) {
    const items = await readRecipeLibrary({
      mealType: input.mealType ?? null,
      profileId: input.profileId?.trim() || null,
      limit: 120,
    });

    const matched = items.find((item) => item.recipe_id === input.recipeId.trim());
    if (!matched) {
      throw toDomyliError(error);
    }

    return {
      ...matched,
      detail_context: input.profileId?.trim() ? "PROFILE_TARGETED" : "HOUSEHOLD_LIBRARY",
      profile_targeted: Boolean(input.profileId?.trim()),
      selected_profile_id: input.profileId?.trim() || null,
      selected_meal_type: input.mealType ?? null,
      ingredients: [],
      nutrition_summary: {},
      stock_projection: {},
      portion_factor: 1,
    };
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
