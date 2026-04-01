import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";
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

export type MealFeedQuery = {
  p_from_date?: string | null;
  p_to_date?: string | null;
  p_profile_id?: string | null;
  p_meal_type?: MealType | null;
  p_status?: string | null;
  p_limit?: number | null;
};

export type MealFeedItem = {
  meal_slot_id: string;
  planned_for: string;
  meal_type: MealType;
  status: string | null;
  profile_id: string | null;
  profile_label: string | null;
  recipe_id: string | null;
  recipe_code: string | null;
  recipe_title: string | null;
  title: string | null;
  operator_notes: string | null;
  portion_factor: number | null;
  inserted_ingredient_count: number;
  created_at: string | null;
  updated_at: string | null;
  confirmed_at: string | null;
};



export type MealSlotIngredientSnapshot = {
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

export type MealSlotDetail = {
  meal_slot_id: string;
  planned_for: string;
  meal_type: MealType;
  status: string | null;
  profile_id: string | null;
  profile_label: string | null;
  recipe_id: string | null;
  recipe_code: string | null;
  recipe_title: string | null;
  title: string | null;
  operator_notes: string | null;
  portion_factor: number | null;
  inserted_ingredient_count: number;
  created_at: string | null;
  updated_at: string | null;
  confirmed_at: string | null;
  ingredients: MealSlotIngredientSnapshot[];
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
  short_description?: string | null;
  difficulty?: string | null;
  meal_types?: string[] | null;
  prep_minutes?: number | null;
  cook_minutes?: number | null;
  default_servings?: number | null;
  stock_intensity?: string | null;
  tags?: RawRecipeTag[] | null;
  fit?: RawRecipeFit | null;
  personalized_serving_label?: string | null;
  portion_factor?: number | null;
  hero_badges?:
    | Array<{ code?: string | null; label?: string | null }>
    | null;
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

type RawMealMutationOutput = {
  meal_slot_id?: string | null;
  status?: string | null;
  profile_id?: string | null;
  recipe_id?: string | null;
  portion_factor?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  inserted_ingredient_count?: number | null;
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

type RawConfirmConsumptionLine = {
  ingredient_code?: string | null;
  ingredient_label?: string | null;
  nutrition_role?: string | null;
  unit_code?: string | null;
  quantity_planned?: number | null;
  quantity_confirmed?: number | null;
  inventory_item_id?: string | null;
  inventory_status?: string | null;
  before_qty?: number | null;
  after_qty?: number | null;
  consumed_qty?: number | null;
  shortage_qty?: number | null;
};

export type MealConfirmConsumptionLine = {
  ingredient_code: string;
  ingredient_label: string;
  nutrition_role: string | null;
  unit_code: string | null;
  quantity_planned: number | null;
  quantity_confirmed: number | null;
  inventory_item_id: string | null;
  inventory_status: string | null;
  before_qty: number | null;
  after_qty: number | null;
  consumed_qty: number | null;
  shortage_qty: number | null;
};

type RawConfirmAlert = {
  ingredient_code?: string | null;
  alert_sync_status?: string | null;
  inventory_item_id?: string | null;
};

export type MealConfirmAlert = {
  ingredient_code: string;
  alert_sync_status: string | null;
  inventory_item_id: string | null;
};

type RawConfirmOutput = {
  meal_slot_id?: string | null;
  status?: string | null;
  consumption_lines?: RawConfirmConsumptionLine[] | null;
  shopping_rebuild_status?: string | null;
  alerts?: RawConfirmAlert[] | null;
};

export type MealConfirmResult = {
  meal_slot_id: string | null;
  status: string | null;
  consumption_lines: MealConfirmConsumptionLine[];
  shopping_rebuild_status: string | null;
  alerts: MealConfirmAlert[];
};


type RawMealSlotDetailIngredient = {
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

type RawMealSlotDetail = {
  meal_slot_id?: string | null;
  planned_for?: string | null;
  meal_type?: MealType | null;
  status?: string | null;
  profile_id?: string | null;
  profile_label?: string | null;
  recipe_id?: string | null;
  recipe_code?: string | null;
  recipe_title?: string | null;
  title?: string | null;
  operator_notes?: string | null;
  portion_factor?: number | null;
  inserted_ingredient_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  confirmed_at?: string | null;
  ingredients?: RawMealSlotDetailIngredient[] | null;
};

type RawInventoryMappingTarget = {
  ingredient_code?: string | null;
  ingredient_label?: string | null;
  meal_usage_count?: number | null;
  recipe_usage_count?: number | null;
  mapped_inventory_item_id?: string | null;
  mapped_item_code?: string | null;
  mapped_item_label?: string | null;
};

export type InventoryMappingTarget = {
  ingredient_code: string;
  ingredient_label: string;
  meal_usage_count: number;
  recipe_usage_count: number;
  mapped_inventory_item_id: string | null;
  mapped_item_code: string | null;
  mapped_item_label: string | null;
};

type RawInventoryMappingCandidate = {
  inventory_item_id?: string | null;
  item_code?: string | null;
  item_label?: string | null;
  qty_on_hand?: number | null;
};

export type InventoryMappingCandidate = {
  inventory_item_id: string;
  item_code: string | null;
  item_label: string;
  qty_on_hand: number | null;
};

type RawInventoryMappingUpsert = {
  ingredient_code?: string | null;
  inventory_item_id?: string | null;
  item_code?: string | null;
  item_label?: string | null;
  notes?: string | null;
  updated_at?: string | null;
};

export type InventoryMappingUpsertResult = {
  ingredient_code: string;
  inventory_item_id: string | null;
  item_code: string | null;
  item_label: string | null;
  notes: string | null;
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

type RawMealFeedItem = {
  meal_slot_id?: string | null;
  planned_for?: string | null;
  meal_type?: MealType | null;
  status?: string | null;
  profile_id?: string | null;
  profile_label?: string | null;
  recipe_id?: string | null;
  recipe_code?: string | null;
  recipe_title?: string | null;
  title?: string | null;
  operator_notes?: string | null;
  portion_factor?: number | null;
  inserted_ingredient_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  confirmed_at?: string | null;
};

function pickRows<T>(value: T[] | T | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function normalizeMealProfile(raw: RawMealProfile): ActiveMealProfile {
  return {
    profile_id: raw.profile_id ?? "",
    display_name: raw.display_name?.trim() || "Profil sans nom",
    summary: raw.summary?.trim() || "Profil DOMYLI",
    weight_kg:
      typeof raw.weight_kg === "number" ? Number(raw.weight_kg) : null,
    goal: raw.goal ?? null,
    activity_level: raw.activity_level ?? null,
    is_pregnant: Boolean(raw.is_pregnant),
    has_diabetes: Boolean(raw.has_diabetes),
    updated_at: raw.updated_at ?? null,
  };
}

function normalizeRecipeCandidate(raw: RawRecipeCandidate): RecipeCandidate {
  return {
    recipe_id: raw.recipe_id ?? "",
    recipe_code: raw.recipe_code ?? "",
    title: raw.title ?? "Recette DOMYLI",
    short_description:
      raw.short_description ?? "Description non renseignée.",
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
          .filter((tag) => Boolean(tag.code))
      : [],
    fit: {
      fit_status: (raw.fit?.fit_status ?? "OK") as RecipeFitStatus,
      fit_score: Number(raw.fit?.fit_score ?? 100),
      warnings: Array.isArray(raw.fit?.warnings)
        ? raw.fit.warnings.filter(Boolean)
        : [],
      fit_reasons: Array.isArray(raw.fit?.fit_reasons)
        ? raw.fit.fit_reasons.filter(Boolean)
        : [],
      blocked_reasons: Array.isArray(raw.fit?.blocked_reasons)
        ? raw.fit.blocked_reasons.filter(Boolean)
        : [],
    },
    personalized_serving_label:
      raw.personalized_serving_label?.trim() || "Portion personnalisée",
    portion_factor: Number(raw.portion_factor ?? 1),
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
    qty_base: Number(raw.qty_base ?? 0),
    qty_adjusted: Number(raw.qty_adjusted ?? 0),
    scaling_policy: raw.scaling_policy ?? "FULL",
    sort_order: Number(raw.sort_order ?? 100),
  };
}

function normalizeRecipePreview(raw: RawRecipePreview | null): RecipePreview | null {
  if (!raw) return null;

  return {
    recipe_id: raw.recipe_id ?? "",
    title: raw.title ?? "Recette DOMYLI",
    fit_status: (raw.fit_status ?? "OK") as RecipeFitStatus,
    fit_score: Number(raw.fit_score ?? 100),
    fit_reasons: Array.isArray(raw.fit_reasons)
      ? raw.fit_reasons.filter(Boolean)
      : [],
    warnings: Array.isArray(raw.warnings) ? raw.warnings.filter(Boolean) : [],
    blocked_reasons: Array.isArray(raw.blocked_reasons)
      ? raw.blocked_reasons.filter(Boolean)
      : [],
    portion_factor: Number(raw.portion_factor ?? 1),
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
    meal_slot_id: raw?.meal_slot_id ?? "",
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
    inserted_ingredient_count: Number(raw?.inserted_ingredient_count ?? 0),
  };
}

function normalizeConfirmConsumptionLine(
  raw: RawConfirmConsumptionLine,
): MealConfirmConsumptionLine {
  return {
    ingredient_code: raw.ingredient_code ?? "UNKNOWN_INGREDIENT",
    ingredient_label: raw.ingredient_label ?? "Ingrédient",
    nutrition_role: raw.nutrition_role ?? null,
    unit_code: raw.unit_code ?? null,
    quantity_planned:
      raw.quantity_planned != null ? Number(raw.quantity_planned) : null,
    quantity_confirmed:
      raw.quantity_confirmed != null ? Number(raw.quantity_confirmed) : null,
    inventory_item_id: raw.inventory_item_id ?? null,
    inventory_status: raw.inventory_status ?? null,
    before_qty: raw.before_qty != null ? Number(raw.before_qty) : null,
    after_qty: raw.after_qty != null ? Number(raw.after_qty) : null,
    consumed_qty: raw.consumed_qty != null ? Number(raw.consumed_qty) : null,
    shortage_qty: raw.shortage_qty != null ? Number(raw.shortage_qty) : null,
  };
}

function normalizeConfirmAlert(raw: RawConfirmAlert): MealConfirmAlert {
  return {
    ingredient_code: raw.ingredient_code ?? "UNKNOWN_INGREDIENT",
    alert_sync_status: raw.alert_sync_status ?? null,
    inventory_item_id: raw.inventory_item_id ?? null,
  };
}

function normalizeConfirmResult(
  raw: RawConfirmOutput | null | undefined,
): MealConfirmResult {
  return {
    meal_slot_id: raw?.meal_slot_id ?? null,
    status: raw?.status ?? null,
    consumption_lines: Array.isArray(raw?.consumption_lines)
      ? raw!.consumption_lines.map(normalizeConfirmConsumptionLine)
      : [],
    shopping_rebuild_status: raw?.shopping_rebuild_status ?? null,
    alerts: Array.isArray(raw?.alerts)
      ? raw!.alerts.map(normalizeConfirmAlert)
      : [],
  };
}

function normalizeInventoryMappingTarget(
  raw: RawInventoryMappingTarget,
): InventoryMappingTarget {
  return {
    ingredient_code: raw.ingredient_code ?? "",
    ingredient_label:
      raw.ingredient_label ?? raw.ingredient_code ?? "Ingrédient",
    meal_usage_count: Number(raw.meal_usage_count ?? 0),
    recipe_usage_count: Number(raw.recipe_usage_count ?? 0),
    mapped_inventory_item_id: raw.mapped_inventory_item_id ?? null,
    mapped_item_code: raw.mapped_item_code ?? null,
    mapped_item_label: raw.mapped_item_label ?? null,
  };
}

function normalizeInventoryMappingCandidate(
  raw: RawInventoryMappingCandidate,
): InventoryMappingCandidate {
  return {
    inventory_item_id: raw.inventory_item_id ?? "",
    item_code: raw.item_code ?? null,
    item_label: raw.item_label ?? "Article stock",
    qty_on_hand: raw.qty_on_hand != null ? Number(raw.qty_on_hand) : null,
  };
}

function normalizeInventoryMappingUpsert(
  raw: RawInventoryMappingUpsert | null | undefined,
): InventoryMappingUpsertResult {
  return {
    ingredient_code: raw?.ingredient_code ?? "",
    inventory_item_id: raw?.inventory_item_id ?? null,
    item_code: raw?.item_code ?? null,
    item_label: raw?.item_label ?? null,
    notes: raw?.notes ?? null,
    updated_at: raw?.updated_at ?? null,
  };
}


function normalizeMealSlotIngredientSnapshot(
  raw: RawMealSlotDetailIngredient,
): MealSlotIngredientSnapshot {
  return {
    recipe_ingredient_id: raw.recipe_ingredient_id ?? null,
    ingredient_code: raw.ingredient_code ?? "UNKNOWN_INGREDIENT",
    ingredient_label: raw.ingredient_label ?? "Ingrédient",
    nutrition_role: raw.nutrition_role ?? "OTHER",
    unit_code: raw.unit_code ?? "UNIT",
    qty_base: Number(raw.qty_base ?? 0),
    qty_adjusted: Number(raw.qty_adjusted ?? 0),
    scaling_policy: raw.scaling_policy ?? "FULL",
    sort_order: Number(raw.sort_order ?? 100),
  };
}

function normalizeMealSlotDetail(
  raw: RawMealSlotDetail | null | undefined,
): MealSlotDetail | null {
  if (!raw?.meal_slot_id) return null;

  return {
    meal_slot_id: raw.meal_slot_id,
    planned_for: raw.planned_for ?? "",
    meal_type: (raw.meal_type ?? "LUNCH") as MealType,
    status: raw.status ?? null,
    profile_id: raw.profile_id ?? null,
    profile_label: raw.profile_label ?? null,
    recipe_id: raw.recipe_id ?? null,
    recipe_code: raw.recipe_code ?? null,
    recipe_title: raw.recipe_title ?? null,
    title: raw.title ?? raw.recipe_title ?? "Repas DOMYLI",
    operator_notes: raw.operator_notes ?? null,
    portion_factor:
      raw.portion_factor != null ? Number(raw.portion_factor) : null,
    inserted_ingredient_count: Number(raw.inserted_ingredient_count ?? 0),
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
    confirmed_at: raw.confirmed_at ?? null,
    ingredients: Array.isArray(raw.ingredients)
      ? raw.ingredients.map(normalizeMealSlotIngredientSnapshot)
      : [],
  };
}

function normalizeMealFeedItem(raw: RawMealFeedItem): MealFeedItem {
  return {
    meal_slot_id: raw.meal_slot_id ?? "",
    planned_for: raw.planned_for ?? "",
    meal_type: (raw.meal_type ?? "LUNCH") as MealType,
    status: raw.status ?? null,
    profile_id: raw.profile_id ?? null,
    profile_label: raw.profile_label ?? null,
    recipe_id: raw.recipe_id ?? null,
    recipe_code: raw.recipe_code ?? null,
    recipe_title: raw.recipe_title ?? null,
    title: raw.title ?? raw.recipe_title ?? "Repas DOMYLI",
    operator_notes: raw.operator_notes ?? null,
    portion_factor:
      raw.portion_factor != null ? Number(raw.portion_factor) : null,
    inserted_ingredient_count: Number(raw.inserted_ingredient_count ?? 0),
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
    confirmed_at: raw.confirmed_at ?? null,
  };
}

export async function listMealActiveProfiles(): Promise<ActiveMealProfile[]> {
  try {
    const raw = (await callRpc("rpc_meal_active_profiles_list", {}, {
      timeoutMs: 12_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RawMealProfile[] | RawMealProfile | null;

    return pickRows(raw)
      .filter((row) => typeof row.profile_id === "string" && row.profile_id.trim())
      .map(normalizeMealProfile)
      .sort((a, b) => a.display_name.localeCompare(b.display_name, "fr"));
  } catch (error) {
    throw toDomyliError(error);
  }
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

    const raw = (await callRpc("rpc_meal_recipe_candidates_v3", {
      p_profile_id: profileId.trim(),
      p_meal_type: mealType,
      p_search: search?.trim() || null,
      p_limit: limit,
    }, {
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RawRecipeCandidate[] | RawRecipeCandidate | null;

    return pickRows(raw)
      .map(normalizeRecipeCandidate)
      .filter((recipe) => Boolean(recipe.recipe_id))
      .sort((a, b) => a.title.localeCompare(b.title, "fr"));
  } catch (error) {
    throw toDomyliError(error);
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

    const raw = (await callRpc("rpc_meal_recipe_preview_v3", {
      p_profile_id: profileId.trim(),
      p_recipe_id: recipeId.trim(),
      p_meal_type: mealType,
    }, {
      unwrap: true,
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RawRecipePreview | null;

    return normalizeRecipePreview(raw);
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function createMeal(
  payload: CreateMealRpcInput,
): Promise<MealMutationResult> {
  try {
    const raw = (await callRpc("rpc_meal_slot_create_v3", payload, {
      unwrap: true,
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RawMealMutationOutput | null;

    return normalizeMealMutationResult(raw);
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function updateMeal(
  payload: UpdateMealRpcInput,
): Promise<MealMutationResult> {
  try {
    const raw = (await callRpc("rpc_meal_slot_update_v3", payload, {
      unwrap: true,
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RawMealMutationOutput | null;

    return normalizeMealMutationResult(raw);
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function confirmMealSlot(
  mealSlotId: string,
): Promise<MealConfirmResult> {
  try {
    const raw = (await callRpc("rpc_meal_confirm_v4", {
      p_meal_slot_id: mealSlotId,
    }, {
      unwrap: true,
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RawConfirmOutput | null;

    return normalizeConfirmResult(raw);
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function listInventoryMappingTargets(
  includeMapped = true,
): Promise<InventoryMappingTarget[]> {
  try {
    const raw = (await callRpc("rpc_inventory_ingredient_map_targets_v3", {
      p_include_mapped: includeMapped,
    }, {
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RawInventoryMappingTarget[] | RawInventoryMappingTarget | null;

    return pickRows(raw)
      .map(normalizeInventoryMappingTarget)
      .filter((row) => Boolean(row.ingredient_code))
      .sort((a, b) => a.ingredient_code.localeCompare(b.ingredient_code, "fr"));
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function listInventoryMappingCandidates(
  search: string,
  limit = 25,
): Promise<InventoryMappingCandidate[]> {
  try {
    const raw = (await callRpc("rpc_inventory_mapping_candidates_v3", {
      p_search: search?.trim() || null,
      p_limit: limit,
    }, {
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RawInventoryMappingCandidate[] | RawInventoryMappingCandidate | null;

    return pickRows(raw)
      .map(normalizeInventoryMappingCandidate)
      .filter((row) => Boolean(row.inventory_item_id))
      .sort((a, b) => a.item_label.localeCompare(b.item_label, "fr"));
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function upsertInventoryMapping(
  ingredientCode: string,
  inventoryItemId: string,
  notes?: string,
): Promise<InventoryMappingUpsertResult> {
  try {
    const raw = (await callRpc("rpc_inventory_ingredient_map_upsert_v3", {
      p_ingredient_code: ingredientCode,
      p_inventory_item_id: inventoryItemId,
      p_notes: notes?.trim() || null,
    }, {
      unwrap: true,
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RawInventoryMappingUpsert | null;

    return normalizeInventoryMappingUpsert(raw);
  } catch (error) {
    throw toDomyliError(error);
  }
}


export async function readMealSlotDetail(
  mealSlotId: string,
): Promise<MealSlotDetail | null> {
  try {
    if (!mealSlotId.trim()) {
      return null;
    }

    const raw = (await callRpc("rpc_meal_slot_read_v1", {
      p_meal_slot_id: mealSlotId.trim(),
    }, {
      unwrap: true,
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RawMealSlotDetail | null;

    return normalizeMealSlotDetail(raw);
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function listMealSlotsFeed(
  query: MealFeedQuery = {},
): Promise<MealFeedItem[]> {
  try {
    const raw = (await callRpc("rpc_meal_slots_feed_v1", {
      p_from_date: query.p_from_date ?? null,
      p_to_date: query.p_to_date ?? null,
      p_profile_id: query.p_profile_id ?? null,
      p_meal_type: query.p_meal_type ?? null,
      p_status: query.p_status ?? null,
      p_limit: query.p_limit ?? 80,
    }, {
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RawMealFeedItem[] | RawMealFeedItem | null;

    return pickRows(raw)
      .map(normalizeMealFeedItem)
      .filter((row) => Boolean(row.meal_slot_id))
      .sort((a, b) => {
        const aKey = `${a.planned_for}|${a.meal_type}|${a.created_at ?? ""}`;
        const bKey = `${b.planned_for}|${b.meal_type}|${b.created_at ?? ""}`;
        return aKey.localeCompare(bKey, "fr");
      });
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
    inserted_ingredient_count: Number(input.inserted_ingredient_count ?? 0),
  };
}