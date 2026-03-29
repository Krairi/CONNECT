export type DomyliRecipeMealType = "BREAKFAST" | "LUNCH" | "SNACK" | "DINNER";
export type DomyliRecipeDifficulty = "EASY" | "MEDIUM" | "ADVANCED";
export type DomyliRecipeStockIntensity = "LOW" | "MEDIUM" | "HIGH";
export type DomyliRecipeFit =
  | "QUICK_WEEKDAY"
  | "FAMILY_BALANCED"
  | "MUSCLE_GAIN"
  | "WEIGHT_LOSS"
  | "DIABETES_FRIENDLY"
  | "PREGNANCY_SUPPORTIVE"
  | "KID_FRIENDLY"
  | "BATCH_COOKING";

export type RecipeOption<T extends string> = {
  value: T;
  label: string;
};

export type DomyliRecipeBlueprint = {
  key: string;
  title: string;
  description: string;
  mealType: DomyliRecipeMealType;
  difficulty: DomyliRecipeDifficulty;
  stockIntensity: DomyliRecipeStockIntensity;
  fit: DomyliRecipeFit;
  prepMinutes: number;
  servings: number;
  tags: string[];
  ingredients: string[];
  steps: string[];
};

export const DOMYLI_RECIPE_MEAL_TYPE_OPTIONS: RecipeOption<DomyliRecipeMealType>[] = [
  { value: "BREAKFAST", label: "Petit-déjeuner" },
  { value: "LUNCH", label: "Déjeuner" },
  { value: "SNACK", label: "Collation" },
  { value: "DINNER", label: "Dîner" },
];

export const DOMYLI_RECIPE_DIFFICULTY_OPTIONS: RecipeOption<DomyliRecipeDifficulty>[] = [
  { value: "EASY", label: "Simple" },
  { value: "MEDIUM", label: "Intermédiaire" },
  { value: "ADVANCED", label: "Avancée" },
];

export const DOMYLI_RECIPE_STOCK_INTENSITY_OPTIONS: RecipeOption<DomyliRecipeStockIntensity>[] = [
  { value: "LOW", label: "Faible impact stock" },
  { value: "MEDIUM", label: "Impact stock moyen" },
  { value: "HIGH", label: "Impact stock élevé" },
];

export const DOMYLI_RECIPE_FIT_OPTIONS: RecipeOption<DomyliRecipeFit>[] = [
  { value: "QUICK_WEEKDAY", label: "Semaine rapide" },
  { value: "FAMILY_BALANCED", label: "Famille équilibrée" },
  { value: "MUSCLE_GAIN", label: "Prise de masse" },
  { value: "WEIGHT_LOSS", label: "Perte de poids" },
  { value: "DIABETES_FRIENDLY", label: "Compatible diabète" },
  { value: "PREGNANCY_SUPPORTIVE", label: "Grossesse" },
  { value: "KID_FRIENDLY", label: "Enfant / dépendant" },
  { value: "BATCH_COOKING", label: "Batch cooking" },
];

export const DOMYLI_RECIPE_BLUEPRINTS: DomyliRecipeBlueprint[] = [
  {
    key: "breakfast-protein-omelet",
    title: "Omelette protéinée express",
    description:
      "Petit-déjeuner rapide, rassasiant et pilotable pour démarrer la journée sans improvisation.",
    mealType: "BREAKFAST",
    difficulty: "EASY",
    stockIntensity: "LOW",
    fit: "QUICK_WEEKDAY",
    prepMinutes: 12,
    servings: 2,
    tags: ["Express", "Protéiné", "Sans porc", "Compatible halal"],
    ingredients: [
      "4 œufs",
      "1 poignée d’épinards",
      "40 g de fromage râpé",
      "2 tranches de pain complet",
      "1 filet d’huile d’olive",
    ],
    steps: [
      "Battre les œufs avec une pincée de sel et poivre.",
      "Faire tomber les épinards à la poêle avec un filet d’huile.",
      "Verser les œufs, ajouter le fromage, cuire à feu doux.",
      "Servir avec le pain complet grillé.",
    ],
  },
  {
    key: "breakfast-porridge-energy",
    title: "Porridge énergie fruits et graines",
    description:
      "Base du matin structurée pour soutenir l’énergie, la satiété et la régularité alimentaire.",
    mealType: "BREAKFAST",
    difficulty: "EASY",
    stockIntensity: "LOW",
    fit: "FAMILY_BALANCED",
    prepMinutes: 10,
    servings: 2,
    tags: ["Équilibré", "Matin", "Fruits", "Satiété"],
    ingredients: [
      "80 g de flocons d’avoine",
      "300 ml de lait ou boisson végétale",
      "1 banane",
      "1 poignée de fruits rouges",
      "1 cuillère à soupe de graines de chia",
    ],
    steps: [
      "Chauffer les flocons avec le lait jusqu’à texture crémeuse.",
      "Couper la banane et préparer les fruits rouges.",
      "Verser dans des bols puis ajouter fruits et graines.",
      "Servir immédiatement ou garder au frais pour le lendemain.",
    ],
  },
  {
    key: "lunch-chicken-rice-batch",
    title: "Poulet riz légumes batch",
    description:
      "Déjeuner pivot DOMYLI : simple, reproductible, réutilisable en batch et compatible pilotage stock.",
    mealType: "LUNCH",
    difficulty: "MEDIUM",
    stockIntensity: "MEDIUM",
    fit: "BATCH_COOKING",
    prepMinutes: 35,
    servings: 4,
    tags: ["Batch", "Déjeuner", "Famille", "Compatible halal"],
    ingredients: [
      "600 g de blanc de poulet",
      "250 g de riz",
      "3 carottes",
      "1 courgette",
      "1 oignon",
      "Épices douces",
    ],
    steps: [
      "Cuire le riz selon le temps indiqué.",
      "Émincer l’oignon, couper les légumes et le poulet.",
      "Saisir le poulet, ajouter légumes puis épices.",
      "Assembler avec le riz et répartir en portions.",
    ],
  },
  {
    key: "lunch-turkey-chili",
    title: "Chili de dinde haricots rouges",
    description:
      "Recette de production familiale à forte valeur d’usage pour repas principal ou réemploi du lendemain.",
    mealType: "LUNCH",
    difficulty: "MEDIUM",
    stockIntensity: "MEDIUM",
    fit: "MUSCLE_GAIN",
    prepMinutes: 40,
    servings: 4,
    tags: ["Protéiné", "Déjeuner", "Batch", "Réemploi"],
    ingredients: [
      "500 g de dinde hachée",
      "400 g de haricots rouges",
      "400 g de tomates concassées",
      "1 poivron",
      "1 oignon",
      "Épices chili douces",
    ],
    steps: [
      "Faire revenir l’oignon et le poivron.",
      "Ajouter la dinde et la cuire complètement.",
      "Verser tomates, haricots et épices puis mijoter.",
      "Servir avec du riz ou des crudités selon le besoin du foyer.",
    ],
  },
  {
    key: "snack-greek-yogurt-bowl",
    title: "Bol yaourt grec fruits secs",
    description:
      "Collation stable et rapide, utile pour éviter les écarts et soutenir une journée dense.",
    mealType: "SNACK",
    difficulty: "EASY",
    stockIntensity: "LOW",
    fit: "MUSCLE_GAIN",
    prepMinutes: 5,
    servings: 1,
    tags: ["Collation", "Protéiné", "Rapide"],
    ingredients: [
      "200 g de yaourt grec",
      "1 poignée d’amandes",
      "1 cuillère à soupe de graines",
      "1 fruit de saison",
    ],
    steps: [
      "Déposer le yaourt dans un bol.",
      "Ajouter le fruit coupé, les amandes et les graines.",
      "Servir aussitôt.",
    ],
  },
  {
    key: "snack-smoothie-banana-oats",
    title: "Smoothie banane avoine",
    description:
      "Collation liquide rapide pour phase dense, reprise d’effort ou sécurisation d’un créneau serré.",
    mealType: "SNACK",
    difficulty: "EASY",
    stockIntensity: "LOW",
    fit: "QUICK_WEEKDAY",
    prepMinutes: 6,
    servings: 1,
    tags: ["Collation", "Express", "Transportable"],
    ingredients: [
      "1 banane",
      "200 ml de lait ou boisson végétale",
      "30 g de flocons d’avoine",
      "1 cuillère à soupe de beurre de cacahuète",
    ],
    steps: [
      "Mettre tous les ingrédients dans le blender.",
      "Mixer jusqu’à texture lisse.",
      "Servir immédiatement ou emporter.",
    ],
  },
  {
    key: "dinner-lentil-dhal",
    title: "Dhal lentilles corail coco",
    description:
      "Dîner chaud à forte stabilité domestique, peu coûteux, simple à reproduire et compatible pilotage stock.",
    mealType: "DINNER",
    difficulty: "MEDIUM",
    stockIntensity: "LOW",
    fit: "WEIGHT_LOSS",
    prepMinutes: 30,
    servings: 4,
    tags: ["Dîner", "Végétarien", "Économique", "Batch"],
    ingredients: [
      "250 g de lentilles corail",
      "1 oignon",
      "400 ml de lait de coco",
      "400 g de tomates concassées",
      "Épices curry douces",
    ],
    steps: [
      "Faire revenir l’oignon avec les épices.",
      "Ajouter les lentilles, tomates et lait de coco.",
      "Laisser cuire jusqu’à texture fondante.",
      "Servir avec du riz ou seul selon le plan du foyer.",
    ],
  },
  {
    key: "dinner-salmon-sweet-potato",
    title: "Saumon patate douce haricots verts",
    description:
      "Dîner premium pilotable, utile pour équilibre nutritionnel, préparation simple et rendu perçu haut de gamme.",
    mealType: "DINNER",
    difficulty: "MEDIUM",
    stockIntensity: "MEDIUM",
    fit: "FAMILY_BALANCED",
    prepMinutes: 28,
    servings: 2,
    tags: ["Dîner", "Poisson", "Équilibré", "Premium"],
    ingredients: [
      "2 pavés de saumon",
      "2 patates douces",
      "250 g d’haricots verts",
      "1 filet d’huile d’olive",
      "Citron",
    ],
    steps: [
      "Cuire les patates douces au four ou à la vapeur.",
      "Cuire les haricots verts jusqu’à tendreté.",
      "Saisir ou cuire le saumon au four.",
      "Servir avec citron et filet d’huile.",
    ],
  },
];

const mealTypeLabelMap = new Map(
  DOMYLI_RECIPE_MEAL_TYPE_OPTIONS.map((item) => [item.value, item.label]),
);
const difficultyLabelMap = new Map(
  DOMYLI_RECIPE_DIFFICULTY_OPTIONS.map((item) => [item.value, item.label]),
);
const stockIntensityLabelMap = new Map(
  DOMYLI_RECIPE_STOCK_INTENSITY_OPTIONS.map((item) => [item.value, item.label]),
);
const fitLabelMap = new Map(
  DOMYLI_RECIPE_FIT_OPTIONS.map((item) => [item.value, item.label]),
);
const blueprintMap = new Map(
  DOMYLI_RECIPE_BLUEPRINTS.map((item) => [item.key, item]),
);

export function getRecipeMealTypeLabel(value?: string | null): string {
  if (!value) return "—";
  return mealTypeLabelMap.get(value as DomyliRecipeMealType) ?? value;
}

export function getRecipeDifficultyLabel(value?: string | null): string {
  if (!value) return "—";
  return difficultyLabelMap.get(value as DomyliRecipeDifficulty) ?? value;
}

export function getRecipeStockIntensityLabel(value?: string | null): string {
  if (!value) return "—";
  return stockIntensityLabelMap.get(value as DomyliRecipeStockIntensity) ?? value;
}

export function getRecipeFitLabel(value?: string | null): string {
  if (!value) return "—";
  return fitLabelMap.get(value as DomyliRecipeFit) ?? value;
}

export function getRecipeBlueprintByKey(
  key?: string | null,
): DomyliRecipeBlueprint | null {
  if (!key) return null;
  return blueprintMap.get(key) ?? null;
}