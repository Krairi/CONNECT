import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";
import type { RecipeFitStatus, RecipeMealType } from "@/src/constants/recipeCatalog";

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

export type RecipeHeroBadge = {
  code: string;
  label: string;
};

export type RecipeTag = {
  code: string;
  label: string;
};

export type RecipeFit = {
  fit_status: RecipeFitStatus;
  fit_score: number;
  warnings: string[];
  fit_reasons: string[];
  blocked_reasons: string[];
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
  tags: RecipeTag[];
  fit: RecipeFit;
  personalized_serving_label: string;
  portion_factor: number;
  hero_badges: RecipeHeroBadge[];
  image_url: string | null;
  image_alt: string;
  detail_readiness: string;
};

export type RecipeInstructionStep = {
  step_code: string;
  sort_order: number;
  label: string;
  source: string;
};

export type RecipeDetailIngredient = {
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

export type MealRecipeDetail = {
  recipe_id: string;
  recipe_code: string;
  title: string;
  short_description: string;
  description: string;
  difficulty: string;
  meal_types: MealType[];
  prep_minutes: number;
  cook_minutes: number;
  stock_intensity: string;
  default_servings: number;
  tags: RecipeTag[];
  fit: RecipeFit;
  instructions: string;
  instruction_steps: RecipeInstructionStep[];
  image_url: string | null;
  image_alt: string;
  hero_badges: RecipeHeroBadge[];
  detail_context: string;
  profile_targeted: boolean;
  selected_profile_id: string | null;
  selected_meal_type: MealType | null;
  ingredients: RecipeDetailIngredient[];
  nutrition_summary: Record<string, unknown>;
  stock_projection: Record<string, unknown>;
  portion_factor: number;
};

export type CreateMealRpcInput = {
  p_profile_id: string;
  p_recipe_id: string;
  p_planned_for: string;
  p_meal_type: MealType;
};

export type UpdateMealRpcInput = {
  p_meal_slot_id: string;
  p_profile_id: string;
  p_recipe_id: string;
  p_planned_for: string;
  p_meal_type: MealType;
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

export type MealAlertLine = {
  alert_type: string | null;
  severity: string | null;
  status: string | null;
  entity_type: string | null;
  entity_id: string | null;
};

export type MealConfirmResult = {
  meal_slot_id: string;
  status: string | null;
  confirmed_at: string | null;
  shopping_rebuild_status: string | null;
  consumption_lines: MealConfirmConsumptionLine[];
  alerts: MealAlertLine[];
  event_log_id: string | null;
};

export type MealConfirmationServerDetail = {
  meal_slot_id: string;
  status: string | null;
  confirmed_at: string | null;
  execution_source: string | null;
  event_log_id: string | null;
  event_name: string | null;
  actor_user_id: string | null;
  server_recorded_at: string | null;
  shopping_rebuild_status: string | null;
  alert_count: number;
  consumption_line_count: number;
  consumed_count: number;
  partial_count: number;
  unmapped_count: number;
  consumption_lines: MealConfirmConsumptionLine[];
  alerts: MealAlertLine[];
};

export type MealReopenCompensationLine = {
  ingredient_code: string;
  inventory_item_id: string | null;
  restored_qty: number | null;
  before_qty: number | null;
  after_qty: number | null;
  line_status: string | null;
};

export type MealReopenResult = {
  meal_slot_id: string;
  status: string | null;
  reopened_at: string | null;
  inventory_compensation_status: string | null;
  shopping_rebuild_status: string | null;
  restored_count: number;
  skipped_count: number;
  failed_count: number;
  compensation_lines: MealReopenCompensationLine[];
  event_log_id: string | null;
};

type RpcObject = Record<string, unknown>;

function pickRows<T>(value: T[] | T | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

async function callRpcFallback<T>(names: string[], payload: RpcObject, options: RpcObject = {}): Promise<T> {
  let lastError: unknown = null;
  for (const name of names) {
    try {
      return (await callRpc(name, payload, options as never)) as T;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function normalizeTags(value: unknown): RecipeTag[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      code: typeof item?.code === "string" ? item.code : "",
      label:
        typeof item?.label === "string"
          ? item.label
          : typeof item?.code === "string"
            ? item.code
            : "",
    }))
    .filter((item) => Boolean(item.code || item.label));
}

function normalizeBadges(value: unknown): RecipeHeroBadge[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      code: typeof item?.code === "string" ? item.code : "",
      label:
        typeof item?.label === "string"
          ? item.label
          : typeof item?.code === "string"
            ? item.code
            : "",
    }))
    .filter((item) => Boolean(item.code || item.label));
}

function normalizeFit(value: unknown): RecipeFit {
  const fit = value && typeof value === "object" ? (value as RpcObject) : {};
  return {
    fit_status: (typeof fit.fit_status === "string" ? fit.fit_status : "OK") as RecipeFitStatus,
    fit_score: Number(fit.fit_score ?? 100),
    warnings: Array.isArray(fit.warnings) ? fit.warnings.filter(Boolean) as string[] : [],
    fit_reasons: Array.isArray(fit.fit_reasons) ? fit.fit_reasons.filter(Boolean) as string[] : [],
    blocked_reasons: Array.isArray(fit.blocked_reasons) ? fit.blocked_reasons.filter(Boolean) as string[] : [],
  };
}

function normalizeInstructionSteps(value: unknown): RecipeInstructionStep[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      step_code: typeof item?.step_code === "string" ? item.step_code : "STEP",
      sort_order: Number(item?.sort_order ?? 0),
      label: typeof item?.label === "string" ? item.label : "Étape",
      source: typeof item?.source === "string" ? item.source : "SYSTEM",
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
}

function normalizeDetailIngredients(value: unknown): RecipeDetailIngredient[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      recipe_ingredient_id: typeof item?.recipe_ingredient_id === "string" ? item.recipe_ingredient_id : null,
      ingredient_code: typeof item?.ingredient_code === "string" ? item.ingredient_code : "UNKNOWN_INGREDIENT",
      ingredient_label: typeof item?.ingredient_label === "string" ? item.ingredient_label : "Ingrédient",
      nutrition_role: typeof item?.nutrition_role === "string" ? item.nutrition_role : "OTHER",
      unit_code: typeof item?.unit_code === "string" ? item.unit_code : "UNIT",
      qty_base: Number(item?.qty_base ?? 0),
      qty_adjusted: Number(item?.qty_adjusted ?? 0),
      scaling_policy: typeof item?.scaling_policy === "string" ? item.scaling_policy : "FULL",
      sort_order: Number(item?.sort_order ?? 0),
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
}

function normalizeMealProfile(raw: RpcObject): ActiveMealProfile {
  return {
    profile_id: typeof raw.profile_id === "string" ? raw.profile_id : "",
    display_name: typeof raw.display_name === "string" && raw.display_name.trim() ? raw.display_name : "Profil DOMYLI",
    summary: typeof raw.summary === "string" && raw.summary.trim() ? raw.summary : "Profil humain actif",
    weight_kg: raw.weight_kg == null ? null : Number(raw.weight_kg),
    goal: typeof raw.goal === "string" ? raw.goal : null,
    activity_level: typeof raw.activity_level === "string" ? raw.activity_level : null,
    is_pregnant: Boolean(raw.is_pregnant),
    has_diabetes: Boolean(raw.has_diabetes),
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : null,
  };
}

function normalizeRecipeCandidate(raw: RpcObject): RecipeCandidate {
  return {
    recipe_id: typeof raw.recipe_id === "string" ? raw.recipe_id : "",
    recipe_code: typeof raw.recipe_code === "string" ? raw.recipe_code : "",
    title: typeof raw.title === "string" && raw.title.trim() ? raw.title : "Recette DOMYLI",
    short_description:
      typeof raw.short_description === "string" && raw.short_description.trim()
        ? raw.short_description
        : "Description non renseignée.",
    difficulty: typeof raw.difficulty === "string" ? raw.difficulty : "EASY",
    meal_types: Array.isArray(raw.meal_types) ? (raw.meal_types.filter(Boolean) as MealType[]) : [],
    prep_minutes: Number(raw.prep_minutes ?? 0),
    cook_minutes: Number(raw.cook_minutes ?? 0),
    default_servings: Number(raw.default_servings ?? 1),
    stock_intensity: typeof raw.stock_intensity === "string" ? raw.stock_intensity : "LOW",
    tags: normalizeTags(raw.tags),
    fit: normalizeFit(raw.fit),
    personalized_serving_label:
      typeof raw.personalized_serving_label === "string" && raw.personalized_serving_label.trim()
        ? raw.personalized_serving_label
        : "Portion personnalisée",
    portion_factor: Number(raw.portion_factor ?? 1),
    hero_badges: normalizeBadges(raw.hero_badges),
    image_url: typeof raw.image_url === "string" && raw.image_url.trim() ? raw.image_url : null,
    image_alt: typeof raw.image_alt === "string" && raw.image_alt.trim() ? raw.image_alt : "Visuel recette DOMYLI",
    detail_readiness: typeof raw.detail_readiness === "string" ? raw.detail_readiness : "BASE",
  };
}

function normalizeRecipeDetail(raw: RpcObject | null | undefined): MealRecipeDetail | null {
  if (!raw) return null;
  return {
    recipe_id: typeof raw.recipe_id === "string" ? raw.recipe_id : "",
    recipe_code: typeof raw.recipe_code === "string" ? raw.recipe_code : "",
    title: typeof raw.title === "string" && raw.title.trim() ? raw.title : "Recette DOMYLI",
    short_description: typeof raw.short_description === "string" ? raw.short_description : "",
    description: typeof raw.description === "string" ? raw.description : "",
    difficulty: typeof raw.difficulty === "string" ? raw.difficulty : "EASY",
    meal_types: Array.isArray(raw.meal_types) ? (raw.meal_types.filter(Boolean) as MealType[]) : [],
    prep_minutes: Number(raw.prep_minutes ?? 0),
    cook_minutes: Number(raw.cook_minutes ?? 0),
    stock_intensity: typeof raw.stock_intensity === "string" ? raw.stock_intensity : "LOW",
    default_servings: Number(raw.default_servings ?? 1),
    tags: normalizeTags(raw.tags),
    fit: normalizeFit(raw.fit),
    instructions: typeof raw.instructions === "string" ? raw.instructions : "",
    instruction_steps: normalizeInstructionSteps(raw.instruction_steps),
    image_url: typeof raw.image_url === "string" && raw.image_url.trim() ? raw.image_url : null,
    image_alt: typeof raw.image_alt === "string" && raw.image_alt.trim() ? raw.image_alt : "Visuel recette DOMYLI",
    hero_badges: normalizeBadges(raw.hero_badges),
    detail_context: typeof raw.detail_context === "string" ? raw.detail_context : "HOUSEHOLD_LIBRARY",
    profile_targeted: Boolean(raw.profile_targeted),
    selected_profile_id: typeof raw.selected_profile_id === "string" ? raw.selected_profile_id : null,
    selected_meal_type: typeof raw.selected_meal_type === "string" ? (raw.selected_meal_type as MealType) : null,
    ingredients: normalizeDetailIngredients(raw.ingredients),
    nutrition_summary: raw.nutrition_summary && typeof raw.nutrition_summary === "object" ? (raw.nutrition_summary as Record<string, unknown>) : {},
    stock_projection: raw.stock_projection && typeof raw.stock_projection === "object" ? (raw.stock_projection as Record<string, unknown>) : {},
    portion_factor: Number(raw.portion_factor ?? 1),
  };
}

function normalizeMealMutation(raw: RpcObject | null | undefined): MealMutationResult {
  return {
    meal_slot_id: typeof raw?.meal_slot_id === "string" ? raw.meal_slot_id : "",
    status: typeof raw?.status === "string" ? raw.status : null,
    profile_id: typeof raw?.profile_id === "string" ? raw.profile_id : null,
    recipe_id: typeof raw?.recipe_id === "string" ? raw.recipe_id : null,
    portion_factor: raw?.portion_factor == null ? null : Number(raw.portion_factor),
    created_at: typeof raw?.created_at === "string" ? raw.created_at : null,
    updated_at: typeof raw?.updated_at === "string" ? raw.updated_at : null,
    inserted_ingredient_count: Number(raw?.inserted_ingredient_count ?? 0),
  };
}

function normalizeMealSlotIngredient(raw: RpcObject): MealSlotIngredientSnapshot {
  return {
    recipe_ingredient_id: typeof raw.recipe_ingredient_id === "string" ? raw.recipe_ingredient_id : null,
    ingredient_code: typeof raw.ingredient_code === "string" ? raw.ingredient_code : "UNKNOWN_INGREDIENT",
    ingredient_label: typeof raw.ingredient_label === "string" ? raw.ingredient_label : "Ingrédient",
    nutrition_role: typeof raw.nutrition_role === "string" ? raw.nutrition_role : "OTHER",
    unit_code: typeof raw.unit_code === "string" ? raw.unit_code : "UNIT",
    qty_base: Number(raw.qty_base ?? 0),
    qty_adjusted: Number(raw.qty_adjusted ?? 0),
    scaling_policy: typeof raw.scaling_policy === "string" ? raw.scaling_policy : "FULL",
    sort_order: Number(raw.sort_order ?? 0),
  };
}

function normalizeMealSlotDetail(raw: RpcObject | null | undefined): MealSlotDetail | null {
  if (!raw) return null;
  return {
    meal_slot_id: typeof raw.meal_slot_id === "string" ? raw.meal_slot_id : "",
    planned_for: typeof raw.planned_for === "string" ? raw.planned_for : "",
    meal_type: (typeof raw.meal_type === "string" ? raw.meal_type : "BREAKFAST") as MealType,
    status: typeof raw.status === "string" ? raw.status : null,
    profile_id: typeof raw.profile_id === "string" ? raw.profile_id : null,
    profile_label: typeof raw.profile_label === "string" ? raw.profile_label : null,
    recipe_id: typeof raw.recipe_id === "string" ? raw.recipe_id : null,
    recipe_code: typeof raw.recipe_code === "string" ? raw.recipe_code : null,
    recipe_title: typeof raw.recipe_title === "string" ? raw.recipe_title : null,
    title: typeof raw.title === "string" ? raw.title : null,
    operator_notes: typeof raw.operator_notes === "string" ? raw.operator_notes : null,
    portion_factor: raw.portion_factor == null ? null : Number(raw.portion_factor),
    inserted_ingredient_count: Number(raw.inserted_ingredient_count ?? 0),
    created_at: typeof raw.created_at === "string" ? raw.created_at : null,
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : null,
    confirmed_at: typeof raw.confirmed_at === "string" ? raw.confirmed_at : null,
    ingredients: Array.isArray(raw.ingredients)
      ? raw.ingredients.map((item) => normalizeMealSlotIngredient(item as RpcObject))
      : [],
  };
}

function normalizeMealFeedItem(raw: RpcObject): MealFeedItem {
  return {
    meal_slot_id: typeof raw.meal_slot_id === "string" ? raw.meal_slot_id : "",
    planned_for: typeof raw.planned_for === "string" ? raw.planned_for : "",
    meal_type: (typeof raw.meal_type === "string" ? raw.meal_type : "BREAKFAST") as MealType,
    status: typeof raw.status === "string" ? raw.status : null,
    profile_id: typeof raw.profile_id === "string" ? raw.profile_id : null,
    profile_label: typeof raw.profile_label === "string" ? raw.profile_label : null,
    recipe_id: typeof raw.recipe_id === "string" ? raw.recipe_id : null,
    recipe_code: typeof raw.recipe_code === "string" ? raw.recipe_code : null,
    recipe_title: typeof raw.recipe_title === "string" ? raw.recipe_title : null,
    title: typeof raw.title === "string" ? raw.title : null,
    operator_notes: typeof raw.operator_notes === "string" ? raw.operator_notes : null,
    portion_factor: raw.portion_factor == null ? null : Number(raw.portion_factor),
    inserted_ingredient_count: Number(raw.inserted_ingredient_count ?? 0),
    created_at: typeof raw.created_at === "string" ? raw.created_at : null,
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : null,
    confirmed_at: typeof raw.confirmed_at === "string" ? raw.confirmed_at : null,
  };
}

function normalizeConsumptionLine(raw: RpcObject): MealConfirmConsumptionLine {
  return {
    ingredient_code: typeof raw.ingredient_code === "string" ? raw.ingredient_code : "UNKNOWN_INGREDIENT",
    ingredient_label: typeof raw.ingredient_label === "string" ? raw.ingredient_label : "Ingrédient",
    nutrition_role: typeof raw.nutrition_role === "string" ? raw.nutrition_role : null,
    unit_code: typeof raw.unit_code === "string" ? raw.unit_code : null,
    quantity_planned: raw.quantity_planned == null ? null : Number(raw.quantity_planned),
    quantity_confirmed: raw.quantity_confirmed == null ? null : Number(raw.quantity_confirmed),
    inventory_item_id: typeof raw.inventory_item_id === "string" ? raw.inventory_item_id : null,
    inventory_status: typeof raw.inventory_status === "string" ? raw.inventory_status : null,
    before_qty: raw.before_qty == null ? null : Number(raw.before_qty),
    after_qty: raw.after_qty == null ? null : Number(raw.after_qty),
    consumed_qty: raw.consumed_qty == null ? null : Number(raw.consumed_qty),
    shortage_qty: raw.shortage_qty == null ? null : Number(raw.shortage_qty),
  };
}

function normalizeAlertLine(raw: RpcObject): MealAlertLine {
  return {
    alert_type: typeof raw.alert_type === "string" ? raw.alert_type : null,
    severity: typeof raw.severity === "string" ? raw.severity : null,
    status: typeof raw.status === "string" ? raw.status : null,
    entity_type: typeof raw.entity_type === "string" ? raw.entity_type : null,
    entity_id: typeof raw.entity_id === "string" ? raw.entity_id : null,
  };
}

function normalizeConfirmResult(raw: RpcObject | null | undefined): MealConfirmResult {
  return {
    meal_slot_id: typeof raw?.meal_slot_id === "string" ? raw.meal_slot_id : "",
    status: typeof raw?.status === "string" ? raw.status : null,
    confirmed_at: typeof raw?.confirmed_at === "string" ? raw.confirmed_at : null,
    shopping_rebuild_status: typeof raw?.shopping_rebuild_status === "string" ? raw.shopping_rebuild_status : null,
    consumption_lines: Array.isArray(raw?.consumption_lines)
      ? raw.consumption_lines.map((item) => normalizeConsumptionLine(item as RpcObject))
      : [],
    alerts: Array.isArray(raw?.alerts)
      ? raw.alerts.map((item) => normalizeAlertLine(item as RpcObject))
      : [],
    event_log_id: typeof raw?.event_log_id === "string" ? raw.event_log_id : null,
  };
}

function normalizeConfirmationServerDetail(raw: RpcObject | null | undefined): MealConfirmationServerDetail | null {
  if (!raw) return null;
  return {
    meal_slot_id: typeof raw.meal_slot_id === "string" ? raw.meal_slot_id : "",
    status: typeof raw.status === "string" ? raw.status : null,
    confirmed_at: typeof raw.confirmed_at === "string" ? raw.confirmed_at : null,
    execution_source: typeof raw.execution_source === "string" ? raw.execution_source : null,
    event_log_id: typeof raw.event_log_id === "string" ? raw.event_log_id : null,
    event_name: typeof raw.event_name === "string" ? raw.event_name : null,
    actor_user_id: typeof raw.actor_user_id === "string" ? raw.actor_user_id : null,
    server_recorded_at: typeof raw.server_recorded_at === "string" ? raw.server_recorded_at : null,
    shopping_rebuild_status: typeof raw.shopping_rebuild_status === "string" ? raw.shopping_rebuild_status : null,
    alert_count: Number(raw.alert_count ?? 0),
    consumption_line_count: Number(raw.consumption_line_count ?? 0),
    consumed_count: Number(raw.consumed_count ?? 0),
    partial_count: Number(raw.partial_count ?? 0),
    unmapped_count: Number(raw.unmapped_count ?? 0),
    consumption_lines: Array.isArray(raw.consumption_lines)
      ? raw.consumption_lines.map((item) => normalizeConsumptionLine(item as RpcObject))
      : [],
    alerts: Array.isArray(raw.alerts)
      ? raw.alerts.map((item) => normalizeAlertLine(item as RpcObject))
      : [],
  };
}

function normalizeReopenResult(raw: RpcObject | null | undefined): MealReopenResult {
  return {
    meal_slot_id: typeof raw?.meal_slot_id === "string" ? raw.meal_slot_id : "",
    status: typeof raw?.status === "string" ? raw.status : null,
    reopened_at: typeof raw?.reopened_at === "string" ? raw.reopened_at : null,
    inventory_compensation_status:
      typeof raw?.inventory_compensation_status === "string" ? raw.inventory_compensation_status : null,
    shopping_rebuild_status:
      typeof raw?.shopping_rebuild_status === "string" ? raw.shopping_rebuild_status : null,
    restored_count: Number(raw?.restored_count ?? 0),
    skipped_count: Number(raw?.skipped_count ?? 0),
    failed_count: Number(raw?.failed_count ?? 0),
    compensation_lines: Array.isArray(raw?.compensation_lines)
      ? raw.compensation_lines.map((item) => ({
          ingredient_code: typeof item?.ingredient_code === "string" ? item.ingredient_code : "UNKNOWN_INGREDIENT",
          inventory_item_id: typeof item?.inventory_item_id === "string" ? item.inventory_item_id : null,
          restored_qty: item?.restored_qty == null ? null : Number(item.restored_qty),
          before_qty: item?.before_qty == null ? null : Number(item.before_qty),
          after_qty: item?.after_qty == null ? null : Number(item.after_qty),
          line_status: typeof item?.line_status === "string" ? item.line_status : null,
        }))
      : [],
    event_log_id: typeof raw?.event_log_id === "string" ? raw.event_log_id : null,
  };
}

export async function listMealActiveProfiles(): Promise<ActiveMealProfile[]> {
  try {
    const raw = await callRpcFallback<unknown[]>(["rpc_meal_active_profiles_list_v2", "rpc_meal_active_profiles_list"], {}, {
      timeoutMs: 12_000,
      retries: 1,
      retryDelayMs: 900,
    });

    return pickRows(raw)
      .map((row) => normalizeMealProfile((row ?? {}) as RpcObject))
      .filter((row) => Boolean(row.profile_id))
      .sort((a, b) => a.display_name.localeCompare(b.display_name, "fr"));
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function readRecipeCandidatesForMeal(
  profileId: string,
  mealType: MealType,
  tagCode?: string,
  limit = 80,
): Promise<RecipeCandidate[]> {
  try {
    if (!profileId.trim()) return [];

    const raw = await callRpcFallback<unknown[]>(["rpc_meal_recipe_candidates_v4", "rpc_meal_recipe_candidates_v3"], {
      p_profile_id: profileId.trim(),
      p_meal_type: mealType,
      p_tag_code: tagCode?.trim() || null,
      p_limit: limit,
    }, {
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 900,
    });

    return pickRows(raw)
      .map((row) => normalizeRecipeCandidate((row ?? {}) as RpcObject))
      .filter((row) => Boolean(row.recipe_id));
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function readMealRecipeDetail(
  profileId: string,
  recipeId: string,
  mealType: MealType,
): Promise<MealRecipeDetail | null> {
  try {
    if (!profileId.trim() || !recipeId.trim()) return null;

    const raw = await callRpcFallback<RpcObject | null>(["rpc_meal_recipe_read_v2", "rpc_recipe_library_read_v1"], {
      p_profile_id: profileId.trim(),
      p_recipe_id: recipeId.trim(),
      p_meal_type: mealType,
    }, {
      unwrap: true,
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 900,
    });

    return normalizeRecipeDetail(raw);
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function createMeal(payload: CreateMealRpcInput): Promise<MealMutationResult> {
  try {
    const raw = await callRpcFallback<RpcObject | null>(["rpc_meal_slot_create_v4", "rpc_meal_slot_create_v3"], payload as unknown as RpcObject, {
      unwrap: true,
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 900,
    });

    return normalizeMealMutation(raw);
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function updateMeal(payload: UpdateMealRpcInput): Promise<MealMutationResult> {
  try {
    const raw = await callRpcFallback<RpcObject | null>(["rpc_meal_slot_update_v4", "rpc_meal_slot_update_v3"], payload as unknown as RpcObject, {
      unwrap: true,
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 900,
    });

    return normalizeMealMutation(raw);
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function confirmMealSlot(mealSlotId: string): Promise<MealConfirmResult> {
  try {
    const raw = (await callRpc("rpc_meal_confirm_v4", { p_meal_slot_id: mealSlotId }, {
      unwrap: true,
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RpcObject | null;
    return normalizeConfirmResult(raw);
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function readMealConfirmationServer(mealSlotId: string): Promise<MealConfirmationServerDetail | null> {
  try {
    if (!mealSlotId.trim()) return null;
    const raw = (await callRpc("rpc_meal_confirmation_read_v1", { p_meal_slot_id: mealSlotId.trim() }, {
      unwrap: true,
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RpcObject | null;
    return normalizeConfirmationServerDetail(raw);
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function reopenMealSlot(mealSlotId: string): Promise<MealReopenResult> {
  try {
    const raw = (await callRpc("rpc_meal_reopen_v2", { p_meal_slot_id: mealSlotId.trim(), p_reason: null }, {
      unwrap: true,
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RpcObject | null;
    return normalizeReopenResult(raw);
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function readMealSlotDetail(mealSlotId: string): Promise<MealSlotDetail | null> {
  try {
    if (!mealSlotId.trim()) return null;
    const raw = (await callRpc("rpc_meal_slot_read_v1", { p_meal_slot_id: mealSlotId.trim() }, {
      unwrap: true,
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 900,
    })) as RpcObject | null;
    return normalizeMealSlotDetail(raw);
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function listMealSlotsFeed(query: MealFeedQuery = {}): Promise<MealFeedItem[]> {
  try {
    const raw = (await callRpc("rpc_meal_slots_feed_v1", {
      p_from_date: query.p_from_date ?? null,
      p_to_date: query.p_to_date ?? null,
      p_profile_id: query.p_profile_id ?? null,
      p_meal_type: query.p_meal_type ?? null,
      p_status: query.p_status ?? null,
      p_limit: query.p_limit ?? 60,
    }, {
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 900,
    })) as unknown[] | unknown | null;

    return pickRows(raw)
      .map((row) => normalizeMealFeedItem((row ?? {}) as RpcObject))
      .filter((row) => Boolean(row.meal_slot_id))
      .sort((a, b) => `${a.planned_for}|${a.meal_type}`.localeCompare(`${b.planned_for}|${b.meal_type}`, "fr"));
  } catch (error) {
    throw toDomyliError(error);
  }
}
