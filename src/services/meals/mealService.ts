import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";
import type { RecipeFitStatus, RecipeMealType } from "@/src/constants/recipeCatalog";

export type MealType = RecipeMealType;

export type MealDraft = {
  meal_slot_id: string;
  planned_for: string;
  meal_type: MealType;
  profile_id: string | null;
  recipe_id: string | null;
  title: string | null;
  notes: string | null;
  status: string | null;
};

type RawMealOutput = {
  meal_slot_id?: string | null;
  planned_for?: string | null;
  meal_type?: MealType | null;
  profile_id?: string | null;
  recipe_id?: string | null;
  title?: string | null;
  notes?: string | null;
  status?: string | null;
};

type RawConfirmOutput = {
  meal_slot_id?: string | null;
  status?: string | null;
  run_status?: string | null;
};

type RawRecipeCandidate = {
  recipe_id?: string | null;
  recipe_code?: string | null;
  title?: string | null;
  short_description?: string | null;
  difficulty?: string | null;
  meal_types?: string[] | null;
  prep_minutes?: number | null;
  cook_minutes?: number | null;
  default_servings?: number | null;
  stock_intensity?: string | null;
  tags?: Array<{ code?: string | null; label?: string | null }> | null;
  fit?: {
    fit_status?: string | null;
    fit_score?: number | null;
    warnings?: string[] | null;
    fit_reasons?: string[] | null;
    blocked_reasons?: string[] | null;
  } | null;
};

export type RecipeCandidate = {
  recipe_id: string;
  recipe_code: string;
  title: string;
  short_description: string;
  difficulty: string;
  meal_types: MealType[];
  prep_minutes: number;
  cook_minutes: number;
  default_servings: number;
  stock_intensity: string;
  tags: Array<{ code: string; label: string }>;
  fit: {
    fit_status: RecipeFitStatus;
    fit_score: number;
    warnings: string[];
    fit_reasons: string[];
    blocked_reasons: string[];
  };
};

export type MealConfirmResult = {
  meal_slot_id: string | null;
  status: string | null;
};

export type CreateMealInput = {
  p_planned_for: string;
  p_meal_type: MealType;
  p_profile_id?: string | null;
  p_recipe_id?: string | null;
  p_title?: string | null;
  p_notes?: string | null;
};

export type UpdateMealInput = {
  p_meal_slot_id: string;
  p_planned_for: string;
  p_meal_type: MealType;
  p_profile_id?: string | null;
  p_recipe_id?: string | null;
  p_title?: string | null;
  p_notes?: string | null;
};

function pickRows<T>(value: T[] | T | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function normalizeMeal(raw: RawMealOutput): MealDraft {
  return {
    meal_slot_id: raw.meal_slot_id ?? "",
    planned_for: raw.planned_for ?? "",
    meal_type: (raw.meal_type ?? "LUNCH") as MealType,
    profile_id: raw.profile_id ?? null,
    recipe_id: raw.recipe_id ?? null,
    title: raw.title ?? null,
    notes: raw.notes ?? null,
    status: raw.status ?? null,
  };
}

function normalizeRecipeCandidate(raw: RawRecipeCandidate): RecipeCandidate {
  return {
    recipe_id: raw.recipe_id ?? "",
    recipe_code: raw.recipe_code ?? "",
    title: raw.title ?? "Recette DOMYLI",
    short_description: raw.short_description ?? "Description non renseignée.",
    difficulty: raw.difficulty ?? "EASY",
    meal_types: (raw.meal_types ?? []).filter(Boolean) as MealType[],
    prep_minutes: Number(raw.prep_minutes ?? 0),
    cook_minutes: Number(raw.cook_minutes ?? 0),
    default_servings: Number(raw.default_servings ?? 1),
    stock_intensity: raw.stock_intensity ?? "LOW",
    tags: Array.isArray(raw.tags)
      ? raw.tags
          .map((tag) => ({
            code: tag.code ?? "",
            label: tag.label ?? tag.code ?? "",
          }))
          .filter((tag) => Boolean(tag.code || tag.label))
      : [],
    fit: {
      fit_status: (raw.fit?.fit_status ?? "OK") as RecipeFitStatus,
      fit_score: Number(raw.fit?.fit_score ?? 100),
      warnings: Array.isArray(raw.fit?.warnings)
        ? raw.fit!.warnings.filter(Boolean)
        : [],
      fit_reasons: Array.isArray(raw.fit?.fit_reasons)
        ? raw.fit!.fit_reasons.filter(Boolean)
        : [],
      blocked_reasons: Array.isArray(raw.fit?.blocked_reasons)
        ? raw.fit!.blocked_reasons.filter(Boolean)
        : [],
    },
  };
}

export async function readRecipeCandidatesForMeal(
  mealType: MealType,
  profileId?: string | null,
  limit = 60,
): Promise<RecipeCandidate[]> {
  try {
    const raw = (await callRpc("rpc_recipe_library_list", {
      p_meal_type: mealType,
      p_profile_id: profileId?.trim() || null,
      p_limit: limit,
    })) as RawRecipeCandidate[] | RawRecipeCandidate | null;

    return pickRows(raw)
      .map(normalizeRecipeCandidate)
      .sort((a, b) => a.title.localeCompare(b.title, "fr"));
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function createMeal(payload: CreateMealInput): Promise<string> {
  const raw = await callRpc<{ meal_slot_id?: string | null }>(
    "rpc_meal_slot_upsert",
    payload,
    { unwrap: true },
  );

  return raw?.meal_slot_id ?? "";
}

export async function updateMeal(payload: UpdateMealInput): Promise<string> {
  const raw = await callRpc<{ meal_slot_id?: string | null }>(
    "rpc_meal_slot_upsert",
    payload,
    { unwrap: true },
  );

  return raw?.meal_slot_id ?? payload.p_meal_slot_id;
}

export async function confirmMealSlot(
  mealSlotId: string,
): Promise<MealConfirmResult> {
  const raw = await callRpc<RawConfirmOutput>(
    "rpc_meal_confirm_v3",
    { p_meal_slot_id: mealSlotId },
    { unwrap: true },
  );

  return {
    meal_slot_id: raw?.meal_slot_id ?? mealSlotId,
    status: raw?.status ?? raw?.run_status ?? "CONFIRMED",
  };
}

export function buildSessionMealDraft(
  input: CreateMealInput & { meal_slot_id: string; status?: string | null },
): MealDraft {
  return normalizeMeal({
    meal_slot_id: input.meal_slot_id,
    planned_for: input.p_planned_for,
    meal_type: input.p_meal_type,
    profile_id: input.p_profile_id ?? null,
    recipe_id: input.p_recipe_id ?? null,
    title: input.p_title ?? null,
    notes: input.p_notes ?? null,
    status: input.status ?? "DRAFT",
  });
}
