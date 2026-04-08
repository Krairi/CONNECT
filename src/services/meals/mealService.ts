import { callRpc } from "@/src/services/rpc";
import { isMissingRpcError, toDomyliError } from "@/src/lib/errors";
import type {
  RecipeFitStatus,
  RecipeMealType,
} from "@/src/constants/recipeCatalog";

export type MealType = RecipeMealType;

export type ActiveMealProfile = {
  profile_id: string;
  display_name: string;
  summary: string;
  weight_kg: number | null;
  goal: string | null;
  activity_level: string | null;
  is_pregnant: boolean;
  has_diabetes: boolean;
  updated_at: string | null;
};

export type MealDraft = {
  meal_slot_id: string;
  planned_for: string;
  meal_type: MealType;
  profile_id: string | null;
  recipe_id: string | null;
  title: string | null;
  notes: string | null;
  status: string | null;
  portion_factor: number | null;
  created_at: string | null;
  updated_at: string | null;
  inserted_ingredient_count: number;
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
  personalized_serving_label: string;
  portion_factor: number;
  hero_badges: Array<{ code: string; label: string }>;
};

export type RecipePreviewIngredient = {
  recipe_ingredient_id: string | null;
  ingredient_code: string;
  ingredient_label: string;
  nutrition_role: string;
  unit_code: string;
  qty_base: number;
  qty_adjusted: number;
  scaling_policy: string;
  sort_order: number;
};

export type RecipePreview = {
  recipe_id: string;
  title: string;
  fit_status: RecipeFitStatus;
  fit_score: number;
  fit_reasons: string[];
  warnings: string[];
  blocked_reasons: string[];
  portion_factor: number;
  ingredients: RecipePreviewIngredient[];
  nutrition_summary: Record<string, unknown>;
  stock_projection: Record<string, unknown>;
};

export type MealMutationResult = {
  meal_slot_id: string;
  status: string | null;
  profile_id: string | null;
  recipe_id: string | null;
  portion_factor: number | null;
  created_at: string | null;
  updated_at: string | null;
  inserted_ingredient_count: number;
};

export type MealConfirmResult = {
  meal_slot_id: string | null;
  status: string | null;
  consumption_lines: Array<Record<string, unknown>>;
  shopping_rebuild_status: string | null;
  alerts: Array<Record<string, unknown>>;
};

export type MealConfirmationServer = {
  meal_slot_id: string;
  status: string | null;
  consumption_lines: Array<Record<string, unknown>>;
  shopping_rebuild_status: string | null;
  alerts: Array<Record<string, unknown>>;
  updated_at: string | null;
};

export type CreateMealRpcInput = {
  p_profile_id: string;
  p_recipe_id: string;
  p_planned_for: string;
  p_meal_type: MealType;
  p_operator_notes?: string | null;
};

export type UpdateMealRpcInput = {
  p_meal_slot_id: string;
  p_profile_id: string;
  p_recipe_id: string;
  p_planned_for: string;
  p_meal_type: MealType;
  p_operator_notes?: string | null;
};

export type ListMealSlotsFeedInput = {
  from: string;
  to: string;
  profileId?: string | null;
};

type RawMealProfile = {
  profile_id?: string | null;
  display_name?: string | null;
  summary?: string | null;
  weight_kg?: number | null;
  goal?: string | null;
  activity_level?: string | null;
  is_pregnant?: boolean | null;
  has_diabetes?: boolean | null;
  updated_at?: string | null;
};

type RawMealSlot = {
  slot_id?: string | null;
  meal_slot_id?: string | null;
  slot_date?: string | null;
  planned_for?: string | null;
  meal_type?: MealType | null;
  status?: string | null;
  profile_id?: string | null;
  profile_display_name?: string | null;
  recipe_id?: string | null;
  recipe_title?: string | null;
  title?: string | null;
  notes?: string | null;
  operator_notes?: string | null;
  missing_count?: number | null;
  is_feasible?: boolean | null;
  portion_factor?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  inserted_ingredient_count?: number | null;
};

type RawRecipeTag = {
  code?: string | null;
  label?: string | null;
};

type RawRecipeFit = {
  fit_status?: string | null;
  fit_score?: number | null;
  warnings?: string[] | null;
  fit_reasons?: string[] | null;
  blocked_reasons?: string[] | null;
};

type RawRecipeCandidate = {
  recipe_id?: string | null;
  recipe_code?: string | null;
  title?: string | null;
  recipe_title?: string | null;
  short_description?: string | null;
  compatibility_summary?: string | null;
  difficulty?: string | null;
  meal_types?: string[] | null;
  meal_type?: string | null;
  prep_minutes?: number | null;
  cook_minutes?: number | null;
  default_servings?: number | null;
  stock_intensity?: string | null;
  tags?: RawRecipeTag[] | null;
  fit?: RawRecipeFit | null;
  personalized_serving_label?: string | null;
  portion_factor?: number | null;
  hero_badges?: Array<{ code?: string | null; label?: string | null }> | null;
  compatibility_score?: number | null;
  missing_count?: number | null;
  is_feasible?: boolean | null;
  profile_id?: string | null;
  profile_display_name?: string | null;
  updated_at?: string | null;
};

type RawRecipePreviewIngredient = {
  recipe_ingredient_id?: string | null;
  ingredient_code?: string | null;
  ingredient_label?: string | null;
  nutrition_role?: string | null;
  unit_code?: string | null;
  qty_base?: number | null;
  qty_adjusted?: number | null;
  scaling_policy?: string | null;
  sort_order?: number | null;
};

type RawRecipePreview = {
  recipe_id?: string | null;
  title?: string | null;
  fit_status?: string | null;
  fit_score?: number | null;
  fit_reasons?: string[] | null;
  warnings?: string[] | null;
  blocked_reasons?: string[] | null;
  portion_factor?: number | null;
  ingredients?: RawRecipePreviewIngredient[] | null;
  nutrition_summary?: Record<string, unknown> | null;
  stock_projection?: Record<string, unknown> | null;
};

type RawMealMutationOutput = {
  meal_slot_id?: string | null;
  slot_id?: string | null;
  status?: string | null;
  profile_id?: string | null;
  recipe_id?: string | null;
  portion_factor?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  inserted_ingredient_count?: number | null;
};

type RawConfirmOutput = {
  meal_slot_id?: string | null;
  status?: string | null;
  consumption_lines?: Array<Record<string, unknown>> | null;
  shopping_rebuild_status?: string | null;
  alerts?: Array<Record<string, unknown>> | null;
};

type RawMealConfirmationServer = {
  meal_slot_id?: string | null;
  status?: string | null;
  consumption_lines?: Array<Record<string, unknown>> | null;
  shopping_rebuild_status?: string | null;
  alerts?: Array<Record<string, unknown>> | null;
  updated_at?: string | null;
};

function pickRows<T>(value: T[] | T | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeMealProfile(raw: RawMealProfile): ActiveMealProfile {
  return {
    profile_id: raw.profile_id ?? "",
    display_name: raw.display_name?.trim() || "Profil sans nom",
    summary: raw.summary?.trim() || "Profil DOMYLI",
    weight_kg:
      typeof raw.weight_kg === "number"
        ? Number(raw.weight_kg)
        : raw.weight_kg != null
          ? Number(raw.weight_kg)
          : null,
    goal: raw.goal ?? null,
    activity_level: raw.activity_level ?? null,
    is_pregnant: Boolean(raw.is_pregnant),
    has_diabetes: Boolean(raw.has_diabetes),
    updated_at: raw.updated_at ?? null,
  };
}

function normalizeMealTypes(
  raw: RawRecipeCandidate,
  requestedMealType?: MealType,
): MealType[] {
  const fromArray = Array.isArray(raw.meal_types)
    ? raw.meal_types.filter(Boolean)
    : [];

  const fromFlat = raw.meal_type ? [raw.meal_type] : [];

  const merged = [...new Set([...fromArray, ...fromFlat])] as MealType[];

  if (merged.length > 0) {
    return merged;
  }

  return [requestedMealType ?? "LUNCH"];
}

function normalizeFitStatus(raw: RawRecipeCandidate): RecipeFitStatus {
  const fitStatus = raw.fit?.fit_status;

  if (fitStatus) {
    return fitStatus as RecipeFitStatus;
  }

  if (raw.is_feasible === false) {
    return "BLOCKED" as RecipeFitStatus;
  }

  if (toNumber(raw.missing_count, 0) > 0) {
    return "WARNING" as RecipeFitStatus;
  }

  return "OK" as RecipeFitStatus;
}

function normalizeWarnings(raw: RawRecipeCandidate): string[] {
  if (Array.isArray(raw.fit?.warnings)) {
    return raw.fit.warnings.filter(Boolean);
  }

  const missingCount = toNumber(raw.missing_count, 0);

  if (missingCount > 0) {
    return [`${missingCount} élément(s) manquant(s).`];
  }

  return [];
}

function normalizeFitReasons(raw: RawRecipeCandidate): string[] {
  if (Array.isArray(raw.fit?.fit_reasons) && raw.fit.fit_reasons.length > 0) {
    return raw.fit.fit_reasons.filter(Boolean);
  }

  if (raw.compatibility_summary && raw.is_feasible !== false) {
    return [raw.compatibility_summary];
  }

  return [];
}

function normalizeBlockedReasons(raw: RawRecipeCandidate): string[] {
  if (
    Array.isArray(raw.fit?.blocked_reasons) &&
    raw.fit.blocked_reasons.length > 0
  ) {
    return raw.fit.blocked_reasons.filter(Boolean);
  }

  if (raw.compatibility_summary && raw.is_feasible === false) {
    return [raw.compatibility_summary];
  }

  return [];
}

function normalizeRecipeCandidate(
  raw: RawRecipeCandidate,
  requestedMealType?: MealType,
): RecipeCandidate {
  const missingCount = toNumber(raw.missing_count, 0);
  const isFeasible = raw.is_feasible ?? true;
  const fitScore = toNumber(
    raw.fit?.fit_score ?? raw.compatibility_score ?? (isFeasible ? 100 : 0),
    isFeasible ? 100 : 0,
  );

  return {
    recipe_id: raw.recipe_id ?? "",
    recipe_code: raw.recipe_code ?? "",
    title: raw.title ?? raw.recipe_title ?? "Recette DOMYLI",
    short_description:
      raw.short_description ??
      raw.compatibility_summary ??
      "Description non renseignée.",
    difficulty: raw.difficulty ?? "EASY",
    meal_types: normalizeMealTypes(raw, requestedMealType),
    prep_minutes: toNumber(raw.prep_minutes, 0),
    cook_minutes: toNumber(raw.cook_minutes, 0),
    default_servings: toNumber(raw.default_servings, 1),
    stock_intensity:
      raw.stock_intensity ?? (missingCount > 0 ? "HIGH" : "LOW"),
    tags: Array.isArray(raw.tags)
      ? raw.tags
          .map((tag) => ({
            code: tag.code ?? "",
            label: tag.label ?? tag.code ?? "",
          }))
          .filter((tag) => Boolean(tag.code || tag.label))
      : [],
    fit: {
      fit_status: normalizeFitStatus(raw),
      fit_score: fitScore,
      warnings: normalizeWarnings(raw),
      fit_reasons: normalizeFitReasons(raw),
      blocked_reasons: normalizeBlockedReasons(raw),
    },
    personalized_serving_label:
      raw.personalized_serving_label?.trim() || "Portion personnalisée",
    portion_factor: toNumber(raw.portion_factor, 1),
    hero_badges: Array.isArray(raw.hero_badges)
      ? raw.hero_badges
          .map((badge) => ({
            code: badge.code ?? "",
            label: badge.label ?? badge.code ?? "",
          }))
          .filter((badge) => Boolean(badge.code || badge.label))
      : [],
  };
}

function normalizeRecipePreviewIngredient(
  raw: RawRecipePreviewIngredient,
): RecipePreviewIngredient {
  return {
    recipe_ingredient_id: raw.recipe_ingredient_id ?? null,
    ingredient_code: raw.ingredient_code ?? "UNKNOWN_INGREDIENT",
    ingredient_label: raw.ingredient_label ?? "Ingrédient",
    nutrition_role: raw.nutrition_role ?? "OTHER",
    unit_code: raw.unit_code ?? "UNIT",
    qty_base: toNumber(raw.qty_base, 0),
    qty_adjusted: toNumber(raw.qty_adjusted, 0),
    scaling_policy: raw.scaling_policy ?? "FULL",
    sort_order: toNumber(raw.sort_order, 100),
  };
}

function normalizeRecipePreview(raw: RawRecipePreview | null): RecipePreview | null {
  if (!raw) return null;

  return {
    recipe_id: raw.recipe_id ?? "",
    title: raw.title ?? "Recette DOMYLI",
    fit_status: (raw.fit_status ?? "OK") as RecipeFitStatus,
    fit_score: toNumber(raw.fit_score, 100),
    fit_reasons: Array.isArray(raw.fit_reasons) ? raw.fit_reasons.filter(Boolean) : [],
    warnings: Array.isArray(raw.warnings) ? raw.warnings.filter(Boolean) : [],
    blocked_reasons: Array.isArray(raw.blocked_reasons)
      ? raw.blocked_reasons.filter(Boolean)
      : [],
    portion_factor: toNumber(raw.portion_factor, 1),
    ingredients: Array.isArray(raw.ingredients)
      ? raw.ingredients.map(normalizeRecipePreviewIngredient)
      : [],
    nutrition_summary:
      raw.nutrition_summary && typeof raw.nutrition_summary === "object"
        ? raw.nutrition_summary
        : {},
    stock_projection:
      raw.stock_projection && typeof raw.stock_projection === "object"
        ? raw.stock_projection
        : {},
  };
}

function normalizeMealMutationResult(
  raw: RawMealMutationOutput | null | undefined,
): MealMutationResult {
  return {
    meal_slot_id: raw?.meal_slot_id ?? raw?.slot_id ?? "",
    status: raw?.status ?? null,
    profile_id: raw?.profile_id ?? null,
    recipe_id: raw?.recipe_id ?? null,
    portion_factor:
      typeof raw?.portion_factor === "number"
        ? Number(raw.portion_factor)
        : raw?.portion_factor != null
          ? Number(raw.portion_factor)
          : null,
    created_at: raw?.created_at ?? null,
    updated_at: raw?.updated_at ?? null,
    inserted_ingredient_count: toNumber(raw?.inserted_ingredient_count, 0),
  };
}

function normalizeConfirmResult(
  raw: RawConfirmOutput | null | undefined,
): MealConfirmResult {
  return {
    meal_slot_id: raw?.meal_slot_id ?? null,
    status: raw?.status ?? null,
    consumption_lines: Array.isArray(raw?.consumption_lines)
      ? raw.consumption_lines
      : [],
    shopping_rebuild_status: raw?.shopping_rebuild_status ?? null,
    alerts: Array.isArray(raw?.alerts) ? raw.alerts : [],
  };
}

function normalizeMealConfirmationServer(
  raw: RawMealConfirmationServer | null | undefined,
): MealConfirmationServer | null {
  if (!raw?.meal_slot_id) {
    return null;
  }

  return {
    meal_slot_id: raw.meal_slot_id,
    status: raw.status ?? null,
    consumption_lines: Array.isArray(raw.consumption_lines)
      ? raw.consumption_lines
      : [],
    shopping_rebuild_status: raw.shopping_rebuild_status ?? null,
    alerts: Array.isArray(raw.alerts) ? raw.alerts : [],
    updated_at: raw.updated_at ?? null,
  };
}

function normalizeMealDraft(raw: RawMealSlot): MealDraft {
  return {
    meal_slot_id: raw.meal_slot_id ?? raw.slot_id ?? "",
    planned_for: raw.planned_for ?? raw.slot_date ?? "",
    meal_type: (raw.meal_type ?? "LUNCH") as MealType,
    profile_id: raw.profile_id ?? null,
    recipe_id: raw.recipe_id ?? null,
    title: raw.title ?? raw.recipe_title ?? null,
    notes: raw.notes ?? raw.operator_notes ?? null,
    status: raw.status ?? null,
    portion_factor:
      typeof raw.portion_factor === "number"
        ? Number(raw.portion_factor)
        : raw.portion_factor != null
          ? Number(raw.portion_factor)
          : null,
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
    inserted_ingredient_count: toNumber(raw.inserted_ingredient_count, 0),
  };
}

export async function listMealActiveProfiles(): Promise<ActiveMealProfile[]> {
  try {
    const raw = (await callRpc(
      "rpc_meal_active_profiles_list",
      {},
      { timeoutMs: 12_000, retries: 1, retryDelayMs: 900 },
    )) as RawMealProfile[] | RawMealProfile | null;

    return pickRows(raw)
      .filter((row) => typeof row.profile_id === "string" && row.profile_id.trim())
      .map(normalizeMealProfile)
      .sort((a, b) => a.display_name.localeCompare(b.display_name, "fr"));
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function listMealSlotsFeed(
  input: ListMealSlotsFeedInput,
): Promise<MealDraft[]> {
  try {
    const raw = (await callRpc(
      "rpc_meal_slots_feed_v1",
      {
        p_from: input.from,
        p_to: input.to,
        p_profile_id: input.profileId?.trim() || null,
      },
      { timeoutMs: 12_000, retries: 1, retryDelayMs: 900 },
    )) as RawMealSlot[] | RawMealSlot | null;

    return pickRows(raw)
      .map(normalizeMealDraft)
      .filter((row) => Boolean(row.meal_slot_id))
      .sort((a, b) => {
        const dateCompare = a.planned_for.localeCompare(b.planned_for, "fr");
        if (dateCompare !== 0) return dateCompare;
        return a.meal_type.localeCompare(b.meal_type, "fr");
      });
  } catch (error) {
    if (isMissingRpcError(error)) {
      return [];
    }

    throw toDomyliError(error);
  }
}

async function readBuild3ACandidates(
  profileId: string,
  mealType: MealType,
  _search?: string,
  limit = 120,
): Promise<RecipeCandidate[]> {
  const raw = (await callRpc(
    "rpc_meal_recipe_candidates_v3",
    {
      p_profile_id: profileId.trim(),
      p_meal_type: mealType,
      p_limit: limit,
    },
    { timeoutMs: 15_000, retries: 1, retryDelayMs: 900 },
  )) as RawRecipeCandidate[] | RawRecipeCandidate | null;

  return pickRows(raw)
    .map((row) => normalizeRecipeCandidate(row, mealType))
    .filter((recipe) => Boolean(recipe.recipe_id))
    .sort((a, b) => a.title.localeCompare(b.title, "fr"));
}

async function readLegacyCandidates(
  profileId: string,
  mealType: MealType,
  search?: string,
  limit = 120,
): Promise<RecipeCandidate[]> {
  const raw = (await callRpc(
    "rpc_recipe_library_list",
    {
      p_profile_id: profileId.trim(),
      p_meal_type: mealType,
      p_search: search?.trim() || null,
      p_limit: limit,
    },
    { timeoutMs: 15_000, retries: 1, retryDelayMs: 900 },
  )) as RawRecipeCandidate[] | RawRecipeCandidate | null;

  return pickRows(raw)
    .map((row) => normalizeRecipeCandidate(row, mealType))
    .filter((recipe) => Boolean(recipe.recipe_id))
    .sort((a, b) => a.title.localeCompare(b.title, "fr"));
}

export async function readRecipeCandidatesForMeal(
  profileId: string,
  mealType: MealType,
  search?: string,
  limit = 120,
): Promise<RecipeCandidate[]> {
  try {
    if (!profileId.trim()) {
      return [];
    }

    return await readBuild3ACandidates(profileId, mealType, search, limit);
  } catch (error) {
    if (!isMissingRpcError(error)) {
      throw toDomyliError(error);
    }

    try {
      return await readLegacyCandidates(profileId, mealType, search, limit);
    } catch (legacyError) {
      throw toDomyliError(legacyError);
    }
  }
}

export async function readRecipePreviewForMeal(
  profileId: string,
  recipeId: string,
  mealType: MealType,
): Promise<RecipePreview | null> {
  try {
    if (!profileId.trim() || !recipeId.trim()) {
      return null;
    }

    const raw = (await callRpc(
      "rpc_meal_recipe_preview_v3",
      {
        p_profile_id: profileId.trim(),
        p_recipe_id: recipeId.trim(),
        p_meal_type: mealType,
      },
      { unwrap: true, timeoutMs: 15_000, retries: 1, retryDelayMs: 900 },
    )) as RawRecipePreview | null;

    return normalizeRecipePreview(raw);
  } catch (error) {
    if (isMissingRpcError(error)) {
      return null;
    }

    throw toDomyliError(error);
  }
}

export async function createMeal(
  payload: CreateMealRpcInput,
): Promise<MealMutationResult> {
  try {
    const raw = (await callRpc(
      "rpc_meal_slot_create_v3",
      payload,
      { unwrap: true, timeoutMs: 15_000, retries: 1, retryDelayMs: 900 },
    )) as RawMealMutationOutput | null;

    return normalizeMealMutationResult(raw);
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function updateMeal(
  payload: UpdateMealRpcInput,
): Promise<MealMutationResult> {
  try {
    const raw = (await callRpc(
      "rpc_meal_slot_update_v3",
      payload,
      { unwrap: true, timeoutMs: 15_000, retries: 1, retryDelayMs: 900 },
    )) as RawMealMutationOutput | null;

    return normalizeMealMutationResult(raw);
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function readMealConfirmationServer(
  mealSlotId: string,
): Promise<MealConfirmationServer | null> {
  try {
    if (!mealSlotId.trim()) {
      return null;
    }

    const raw = (await callRpc(
      "rpc_meal_confirmation_read_v1",
      { p_meal_slot_id: mealSlotId.trim() },
      { unwrap: true, timeoutMs: 15_000, retries: 1, retryDelayMs: 900 },
    )) as RawMealConfirmationServer | null;

    return normalizeMealConfirmationServer(raw);
  } catch (error) {
    if (isMissingRpcError(error)) {
      return null;
    }

    throw toDomyliError(error);
  }
}

export async function confirmMealSlot(
  mealSlotId: string,
): Promise<MealConfirmResult> {
  try {
    const raw = (await callRpc(
      "rpc_meal_confirm_v4",
      { p_meal_slot_id: mealSlotId },
      { unwrap: true, timeoutMs: 15_000, retries: 1, retryDelayMs: 900 },
    )) as RawConfirmOutput | null;

    return normalizeConfirmResult(raw);
  } catch (error) {
    throw toDomyliError(error);
  }
}

export function buildSessionMealDraft(input: {
  meal_slot_id: string;
  p_planned_for: string;
  p_meal_type: MealType;
  p_profile_id: string;
  p_recipe_id: string;
  p_operator_notes?: string | null;
  title?: string | null;
  status?: string | null;
  portion_factor?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  inserted_ingredient_count?: number | null;
}): MealDraft {
  return {
    meal_slot_id: input.meal_slot_id,
    planned_for: input.p_planned_for,
    meal_type: input.p_meal_type,
    profile_id: input.p_profile_id,
    recipe_id: input.p_recipe_id,
    title: input.title ?? null,
    notes: input.p_operator_notes ?? null,
    status: input.status ?? "PLANNED",
    portion_factor:
      typeof input.portion_factor === "number" ? input.portion_factor : null,
    created_at: input.created_at ?? null,
    updated_at: input.updated_at ?? null,
    inserted_ingredient_count: toNumber(input.inserted_ingredient_count, 0),
  };
}