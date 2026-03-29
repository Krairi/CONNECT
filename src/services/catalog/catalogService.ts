import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";
import {
  DOMYLI_RECIPE_BLUEPRINTS,
  type DomyliRecipeBlueprint,
  type DomyliRecipeDifficulty,
  type DomyliRecipeFit,
  type DomyliRecipeMealType,
  type DomyliRecipeStockIntensity,
} from "@/src/constants/recipeCatalog";

export type RecipeLibraryItem = {
  recipe_id: string;
  title: string;
  description: string;
  instructions: string;
  is_active: boolean;
  meal_type: DomyliRecipeMealType;
  difficulty: DomyliRecipeDifficulty;
  stock_intensity: DomyliRecipeStockIntensity;
  fit: DomyliRecipeFit;
  prep_minutes: number;
  servings: number;
  tags: string[];
  ingredients: string[];
  steps: string[];
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
  p_meal_type?: DomyliRecipeMealType | null;
  p_difficulty?: DomyliRecipeDifficulty | null;
  p_stock_intensity?: DomyliRecipeStockIntensity | null;
  p_fit?: DomyliRecipeFit | null;
  p_prep_minutes?: number | null;
  p_servings?: number | null;
  p_tags?: string[] | null;
  p_ingredients?: string[] | null;
  p_steps?: string[] | null;
};

const DEFAULT_MEAL_TYPE: DomyliRecipeMealType = "DINNER";
const DEFAULT_DIFFICULTY: DomyliRecipeDifficulty = "EASY";
const DEFAULT_STOCK_INTENSITY: DomyliRecipeStockIntensity = "LOW";
const DEFAULT_FIT: DomyliRecipeFit = "FAMILY_BALANCED";

function pickRows<T>(value: T[] | T | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function cleanList(values?: string[] | null): string[] {
  return (values ?? [])
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function splitBlockLines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function serializeMeta(payload: AdminRecipeUpsertInput): string {
  const tags = cleanList(payload.p_tags).join(" | ");

  return [
    "[DOMYLI_META]",
    `meal_type=${payload.p_meal_type ?? DEFAULT_MEAL_TYPE}`,
    `difficulty=${payload.p_difficulty ?? DEFAULT_DIFFICULTY}`,
    `stock_intensity=${payload.p_stock_intensity ?? DEFAULT_STOCK_INTENSITY}`,
    `fit=${payload.p_fit ?? DEFAULT_FIT}`,
    `prep_minutes=${Math.max(1, Number(payload.p_prep_minutes ?? 15))}`,
    `servings=${Math.max(1, Number(payload.p_servings ?? 2))}`,
    `tags=${tags}`,
    "[/DOMYLI_META]",
  ].join("\n");
}

function serializeSection(marker: string, values?: string[] | null): string {
  const cleaned = cleanList(values);

  return [
    `[${marker}]`,
    ...(cleaned.length > 0 ? cleaned : ["A compléter"]),
    `[/${marker}]`,
  ].join("\n");
}

function buildStructuredInstructions(payload: AdminRecipeUpsertInput): string {
  const steps = cleanList(payload.p_steps).map((step, index) => `${index + 1}. ${step}`);

  return [
    serializeMeta(payload),
    "",
    serializeSection("DOMYLI_INGREDIENTS", payload.p_ingredients),
    "",
    serializeSection("DOMYLI_STEPS", steps),
    "",
    payload.p_instructions?.trim() || "",
  ]
    .join("\n")
    .trim();
}

function extractBlock(source: string, marker: string): string {
  const startToken = `[${marker}]`;
  const endToken = `[/${marker}]`;
  const start = source.indexOf(startToken);
  const end = source.indexOf(endToken);

  if (start < 0 || end < 0 || end <= start) {
    return "";
  }

  return source.slice(start + startToken.length, end).trim();
}

function extractMetaMap(source: string): Map<string, string> {
  const rawMeta = extractBlock(source, "DOMYLI_META");
  const map = new Map<string, string>();

  splitBlockLines(rawMeta).forEach((line) => {
    const separatorIndex = line.indexOf("=");
    if (separatorIndex < 0) return;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key) {
      map.set(key, value);
    }
  });

  return map;
}

function stripStructuredBlocks(source?: string | null): string {
  if (!source) return "";

  return source
    .replace(/\[DOMYLI_META\][\s\S]*?\[\/DOMYLI_META\]/g, "")
    .replace(/\[DOMYLI_INGREDIENTS\][\s\S]*?\[\/DOMYLI_INGREDIENTS\]/g, "")
    .replace(/\[DOMYLI_STEPS\][\s\S]*?\[\/DOMYLI_STEPS\]/g, "")
    .trim();
}

function parseStructuredRecipe(item: RawRecipeLibraryItem): RecipeLibraryItem {
  const instructions = item.instructions ?? "";
  const meta = extractMetaMap(instructions);
  const rawIngredients = splitBlockLines(extractBlock(instructions, "DOMYLI_INGREDIENTS"));
  const rawSteps = splitBlockLines(extractBlock(instructions, "DOMYLI_STEPS"));
  const tags = (meta.get("tags") ?? "")
    .split("|")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return {
    recipe_id: item.recipe_id ?? "",
    title: item.title ?? "Recette DOMYLI",
    description: item.description?.trim() ?? "",
    instructions: stripStructuredBlocks(instructions),
    is_active: Boolean(item.is_active),
    meal_type: (meta.get("meal_type") as DomyliRecipeMealType | undefined) ?? DEFAULT_MEAL_TYPE,
    difficulty: (meta.get("difficulty") as DomyliRecipeDifficulty | undefined) ?? DEFAULT_DIFFICULTY,
    stock_intensity:
      (meta.get("stock_intensity") as DomyliRecipeStockIntensity | undefined) ??
      DEFAULT_STOCK_INTENSITY,
    fit: (meta.get("fit") as DomyliRecipeFit | undefined) ?? DEFAULT_FIT,
    prep_minutes: parseNumber(meta.get("prep_minutes"), 15),
    servings: parseNumber(meta.get("servings"), 2),
    tags,
    ingredients: rawIngredients.filter((line) => line !== "A compléter"),
    steps: rawSteps
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter((line) => line && line !== "A compléter"),
  };
}

export async function readRecipeLibrary(): Promise<RecipeLibraryItem[]> {
  try {
    const raw = (await callRpc("rpc_recipe_library_list", {})) as
      | RawRecipeLibraryItem[]
      | RawRecipeLibraryItem
      | null;

    return pickRows(raw)
      .map(parseStructuredRecipe)
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
      p_instructions: buildStructuredInstructions(payload),
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

export function buildAdminRecipePayloadFromBlueprint(
  blueprint: DomyliRecipeBlueprint,
): AdminRecipeUpsertInput {
  return {
    p_title: blueprint.title,
    p_description: blueprint.description,
    p_is_active: true,
    p_meal_type: blueprint.mealType,
    p_difficulty: blueprint.difficulty,
    p_stock_intensity: blueprint.stockIntensity,
    p_fit: blueprint.fit,
    p_prep_minutes: blueprint.prepMinutes,
    p_servings: blueprint.servings,
    p_tags: blueprint.tags,
    p_ingredients: blueprint.ingredients,
    p_steps: blueprint.steps,
    p_instructions:
      "Recette DOMYLI publiée depuis le cockpit Super Admin pour alimenter la bibliothèque mondiale.",
  };
}

export function readRecipeBlueprintLibrary(): DomyliRecipeBlueprint[] {
  return [...DOMYLI_RECIPE_BLUEPRINTS].sort((a, b) =>
    a.title.localeCompare(b.title, "fr"),
  );
}