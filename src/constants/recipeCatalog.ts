export type RecipeMealType = "BREAKFAST" | "LUNCH" | "SNACK" | "DINNER";
export type RecipeFitStatus = "OK" | "WARNING" | "BLOCKED";
export type RecipeDifficulty = "EASY" | "MEDIUM" | "ADVANCED";

export const RECIPE_LIBRARY_LIMIT = 120;

export const RECIPE_MEAL_TYPE_OPTIONS: Array<{
  value: RecipeMealType;
  label: string;
}> = [
  { value: "BREAKFAST", label: "Petit-déjeuner" },
  { value: "LUNCH", label: "Déjeuner" },
  { value: "SNACK", label: "Collation" },
  { value: "DINNER", label: "Dîner" },
];

const mealTypeLabelMap = new Map(
  RECIPE_MEAL_TYPE_OPTIONS.map((item) => [item.value, item.label]),
);

const fitStatusLabelMap = new Map<RecipeFitStatus, string>([
  ["OK", "Compatible"],
  ["WARNING", "À vérifier"],
  ["BLOCKED", "Bloqué"],
]);

const difficultyLabelMap = new Map<RecipeDifficulty, string>([
  ["EASY", "Simple"],
  ["MEDIUM", "Intermédiaire"],
  ["ADVANCED", "Avancée"],
]);

const stockIntensityLabelMap = new Map<string, string>([
  ["LOW", "Faible impact stock"],
  ["MEDIUM", "Impact stock moyen"],
  ["HIGH", "Impact stock élevé"],
]);

export function getRecipeMealTypeLabel(value?: string | null): string {
  if (!value) return "—";
  return mealTypeLabelMap.get(value as RecipeMealType) ?? value;
}

export function getRecipeFitStatusLabel(value?: string | null): string {
  if (!value) return "—";
  return fitStatusLabelMap.get(value as RecipeFitStatus) ?? value;
}

export function getRecipeDifficultyLabel(value?: string | null): string {
  if (!value) return "—";
  return difficultyLabelMap.get(value as RecipeDifficulty) ?? value;
}

export function getRecipeStockIntensityLabel(value?: string | null): string {
  if (!value) return "—";
  return stockIntensityLabelMap.get(value) ?? value;
}

export function formatRecipeTagLabel(value?: string | null): string {
  if (!value) return "—";

  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}
