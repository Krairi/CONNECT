import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";

export type MealType = "BREAKFAST" | "LUNCH" | "SNACK" | "DINNER";

export type MealProfile = {
  profile_id: string;
  display_name: string;
  birth_date: string | null;
  sex: string | null;
  goal: string | null;
  activity_level: string | null;
  is_pregnant: boolean;
  has_diabetes: boolean;
};

export type MealRecipe = {
  recipe_id: string;
  title: string;
  description: string;
  instructions: string;
  is_active: boolean;
};

export type MealItem = {
  meal_slot_id: string;
  planned_for: string;
  meal_type: MealType;
  profile_id: string | null;
  recipe_id: string | null;
  profile_display_name: string | null;
  recipe_title: string | null;
  title: string | null;
  notes: string | null;
  status: string | null;
};

type RawMealProfile = {
  profile_id?: string | null;
  display_name?: string | null;
  birth_date?: string | null;
  sex?: string | null;
  goal?: string | null;
  activity_level?: string | null;
  is_pregnant?: boolean | null;
  has_diabetes?: boolean | null;
};

type RawMealRecipe = {
  recipe_id?: string | null;
  title?: string | null;
  description?: string | null;
  instructions?: string | null;
  is_active?: boolean | null;
};

type RawMealItem = {
  meal_slot_id?: string | null;
  planned_for?: string | null;
  meal_type?: MealType | null;
  profile_id?: string | null;
  recipe_id?: string | null;
  profile_display_name?: string | null;
  recipe_title?: string | null;
  title?: string | null;
  notes?: string | null;
  status?: string | null;
};

type RawConfirmOutput = {
  meal_slot_id?: string | null;
  status?: string | null;
  run_status?: string | null;
};

export type MealConfirmResult = {
  meal_slot_id: string | null;
  status: string | null;
};

export type CreateMealInput = {
  p_planned_for: string;
  p_meal_type: MealType;
  p_profile_id: string;
  p_recipe_id: string;
  p_title?: string | null;
  p_notes?: string | null;
};

export type UpdateMealInput = {
  p_meal_slot_id: string;
  p_planned_for: string;
  p_meal_type: MealType;
  p_profile_id: string;
  p_recipe_id: string;
  p_title?: string | null;
  p_notes?: string | null;
};

function pickRows<T>(value: T[] | T | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function normalizeMealType(value?: string | null): MealType {
  if (value === "BREAKFAST" || value === "LUNCH" || value === "SNACK" || value === "DINNER") {
    return value;
  }
  return "LUNCH";
}

function normalizeMealItem(raw: RawMealItem): MealItem {
  return {
    meal_slot_id: raw.meal_slot_id ?? "",
    planned_for: raw.planned_for ?? "",
    meal_type: normalizeMealType(raw.meal_type),
    profile_id: raw.profile_id ?? null,
    recipe_id: raw.recipe_id ?? null,
    profile_display_name: raw.profile_display_name ?? null,
    recipe_title: raw.recipe_title ?? null,
    title: raw.title ?? null,
    notes: raw.notes ?? null,
    status: raw.status ?? null,
  };
}

export async function listMealProfiles(): Promise<MealProfile[]> {
  try {
    const raw = (await callRpc("rpc_human_profile_list", {})) as
      | RawMealProfile[]
      | RawMealProfile
      | null;

    return pickRows(raw).map((item) => ({
      profile_id: item.profile_id ?? "",
      display_name: item.display_name ?? "Profil DOMYLI",
      birth_date: item.birth_date ?? null,
      sex: item.sex ?? null,
      goal: item.goal ?? null,
      activity_level: item.activity_level ?? null,
      is_pregnant: Boolean(item.is_pregnant),
      has_diabetes: Boolean(item.has_diabetes),
    }));
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function listMealRecipes(): Promise<MealRecipe[]> {
  try {
    const raw = (await callRpc("rpc_recipe_library_list", {})) as
      | RawMealRecipe[]
      | RawMealRecipe
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

export async function listMeals(): Promise<MealItem[]> {
  try {
    const raw = (await callRpc("rpc_meal_slot_list", {})) as
      | RawMealItem[]
      | RawMealItem
      | null;

    return pickRows(raw).map(normalizeMealItem);
  } catch (error) {
    throw toDomyliError(error);
  }
}

function extractUuid(raw: unknown, fallback = ""): string {
  if (typeof raw === "string") {
    return raw;
  }

  if (Array.isArray(raw) && typeof raw[0] === "string") {
    return raw[0];
  }

  if (raw && typeof raw === "object") {
    const candidate =
      ("meal_slot_id" in raw && typeof (raw as { meal_slot_id?: unknown }).meal_slot_id === "string"
        ? (raw as { meal_slot_id?: string }).meal_slot_id
        : null) ??
      ("id" in raw && typeof (raw as { id?: unknown }).id === "string"
        ? (raw as { id?: string }).id
        : null);

    return candidate ?? fallback;
  }

  return fallback;
}

export async function createMeal(payload: CreateMealInput): Promise<string> {
  try {
    const raw = await callRpc(
      "rpc_meal_plan_create",
      payload,
      { unwrap: true },
    );

    return extractUuid(raw, "");
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function updateMeal(payload: UpdateMealInput): Promise<string> {
  try {
    const raw = await callRpc(
      "rpc_meal_slot_upsert",
      payload,
      { unwrap: true },
    );

    return extractUuid(raw, payload.p_meal_slot_id);
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function confirmMealSlot(mealSlotId: string): Promise<MealConfirmResult> {
  try {
    const raw = (await callRpc(
      "rpc_meal_confirm_v3",
      { p_meal_slot_id: mealSlotId },
      { unwrap: true },
    )) as RawConfirmOutput | null;

    return {
      meal_slot_id: raw?.meal_slot_id ?? mealSlotId,
      status: raw?.status ?? raw?.run_status ?? "CONFIRMED",
    };
  } catch (error) {
    throw toDomyliError(error);
  }
}