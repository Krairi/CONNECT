import type { MealType } from "@/src/services/meals/mealService";

export type MealFlow = "PROFILES" | "INVENTORY" | "SHOPPING" | "RULES";

export type MealTypeOption = {
  value: MealType;
  label: string;
};

export type MealTemplate = {
  code: string;
  mealType: MealType;
  label: string;
  description: string;
  defaultNotes: string;
  flows: MealFlow[];
};

export const MEAL_TYPE_OPTIONS: MealTypeOption[] = [
  { value: "BREAKFAST", label: "Petit-déjeuner" },
  { value: "LUNCH", label: "Déjeuner" },
  { value: "SNACK", label: "Collation" },
  { value: "DINNER", label: "Dîner" },
];

export const MEAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PLANNED: "Planifié",
  CONFIRMED: "Confirmé",
  EXECUTED: "Exécuté",
  CANCELLED: "Annulé",
};

export const MEAL_FLOW_LABELS: Record<MealFlow, string> = {
  PROFILES: "Profils",
  INVENTORY: "Inventaire",
  SHOPPING: "Courses",
  RULES: "Règles",
};

export const MEAL_TEMPLATES: MealTemplate[] = [
  {
    code: "BREAKFAST_BALANCED",
    mealType: "BREAKFAST",
    label: "Petit-déjeuner équilibré",
    description: "Base structurée du matin pour continuité énergétique.",
    defaultNotes:
      "Template DOMYLI : petit-déjeuner équilibré. À aligner avec le profil humain, le stock disponible et les contraintes alimentaires.",
    flows: ["PROFILES", "INVENTORY", "RULES"],
  },
  {
    code: "BREAKFAST_PROTEIN",
    mealType: "BREAKFAST",
    label: "Petit-déjeuner protéiné",
    description: "Repas du matin orienté satiété et apport protéique.",
    defaultNotes:
      "Template DOMYLI : petit-déjeuner protéiné. Prioriser compatibilité profil, objectifs corporels et faisabilité stock.",
    flows: ["PROFILES", "INVENTORY", "RULES"],
  },
  {
    code: "BREAKFAST_LIGHT",
    mealType: "BREAKFAST",
    label: "Petit-déjeuner léger",
    description: "Version légère pour profils recherchant légèreté ou digestion simple.",
    defaultNotes:
      "Template DOMYLI : petit-déjeuner léger. Vérifier contraintes de santé, intensité de journée et cohérence avec le profil.",
    flows: ["PROFILES", "RULES"],
  },
  {
    code: "BREAKFAST_FAMILY",
    mealType: "BREAKFAST",
    label: "Petit-déjeuner familial",
    description: "Repas du matin orienté foyer et continuité collective.",
    defaultNotes:
      "Template DOMYLI : petit-déjeuner familial. Viser simplicité d’exécution et disponibilité réelle du stock du foyer.",
    flows: ["INVENTORY", "SHOPPING", "HOUSEHOLD" as MealFlow],
  },

  {
    code: "LUNCH_BALANCED",
    mealType: "LUNCH",
    label: "Déjeuner équilibré",
    description: "Déjeuner standard aligné sur l’objectif de stabilité.",
    defaultNotes:
      "Template DOMYLI : déjeuner équilibré. À arbitrer selon stock, profil, objectifs et contraintes du foyer.",
    flows: ["PROFILES", "INVENTORY", "RULES"],
  },
  {
    code: "LUNCH_PROTEIN",
    mealType: "LUNCH",
    label: "Déjeuner protéiné",
    description: "Déjeuner plus orienté protéines et satiété.",
    defaultNotes:
      "Template DOMYLI : déjeuner protéiné. Favoriser cohérence avec objectifs masse, énergie ou stabilité.",
    flows: ["PROFILES", "INVENTORY", "RULES"],
  },
  {
    code: "LUNCH_LOW_SUGAR",
    mealType: "LUNCH",
    label: "Déjeuner faible en sucre",
    description: "Déjeuner cadré pour compatibilité glycémique.",
    defaultNotes:
      "Template DOMYLI : déjeuner faible en sucre. Vérifier compatibilité diabète et contraintes nutritionnelles du profil.",
    flows: ["PROFILES", "RULES", "INVENTORY"],
  },
  {
    code: "LUNCH_FAMILY",
    mealType: "LUNCH",
    label: "Déjeuner familial",
    description: "Déjeuner collectif orienté simplicité et exécution.",
    defaultNotes:
      "Template DOMYLI : déjeuner familial. Viser une exécution simple, traçable et compatible avec les ressources du foyer.",
    flows: ["INVENTORY", "SHOPPING", "RULES"],
  },

  {
    code: "SNACK_LIGHT",
    mealType: "SNACK",
    label: "Collation légère",
    description: "Collation simple de continuité énergétique.",
    defaultNotes:
      "Template DOMYLI : collation légère. Maintenir compatibilité profil et sobriété d’exécution.",
    flows: ["PROFILES", "INVENTORY"],
  },
  {
    code: "SNACK_PROTEIN",
    mealType: "SNACK",
    label: "Collation protéinée",
    description: "Collation orientée satiété ou prise de masse.",
    defaultNotes:
      "Template DOMYLI : collation protéinée. À utiliser selon objectifs de profil et disponibilité réelle du stock.",
    flows: ["PROFILES", "INVENTORY", "RULES"],
  },
  {
    code: "SNACK_CHILD_FRIENDLY",
    mealType: "SNACK",
    label: "Collation foyer",
    description: "Collation pensée pour continuité familiale.",
    defaultNotes:
      "Template DOMYLI : collation foyer. Vérifier simplicité, compatibilité enfants et contraintes alimentaires.",
    flows: ["PROFILES", "INVENTORY", "SHOPPING"],
  },

  {
    code: "DINNER_BALANCED",
    mealType: "DINNER",
    label: "Dîner équilibré",
    description: "Dîner standard pour clôture de journée structurée.",
    defaultNotes:
      "Template DOMYLI : dîner équilibré. Rechercher stabilité, faisabilité et cohérence avec le profil humain.",
    flows: ["PROFILES", "INVENTORY", "RULES"],
  },
  {
    code: "DINNER_LIGHT",
    mealType: "DINNER",
    label: "Dîner léger",
    description: "Dîner léger pour fin de journée plus douce.",
    defaultNotes:
      "Template DOMYLI : dîner léger. Prioriser digestion, compatibilité santé et charge domestique réduite.",
    flows: ["PROFILES", "RULES"],
  },
  {
    code: "DINNER_FAMILY",
    mealType: "DINNER",
    label: "Dîner familial",
    description: "Repas du soir orienté cohésion et exécution foyer.",
    defaultNotes:
      "Template DOMYLI : dîner familial. Viser continuité du foyer, simplicité d’exécution et cohérence stock/courses.",
    flows: ["INVENTORY", "SHOPPING", "RULES"],
  },
  {
    code: "DINNER_PREGNANCY_SAFE",
    mealType: "DINNER",
    label: "Dîner compatible grossesse",
    description: "Dîner prudent et compatible avec une logique grossesse.",
    defaultNotes:
      "Template DOMYLI : dîner compatible grossesse. Vérifier systématiquement la compatibilité profil et la prudence alimentaire.",
    flows: ["PROFILES", "RULES", "INVENTORY"],
  },
];

const FALLBACK_FLOW_LABELS: Record<string, string> = {
  HOUSEHOLD: "Foyer",
};

export function getMealTypeLabel(mealType?: MealType | string | null): string {
  if (!mealType) return "—";

  return (
    MEAL_TYPE_OPTIONS.find((option) => option.value === mealType)?.label ??
    mealType
  );
}

export function getMealStatusLabel(status?: string | null): string {
  if (!status) return "—";
  return MEAL_STATUS_LABELS[status] ?? status;
}

export function getMealFlowLabel(flow: MealFlow | string): string {
  return MEAL_FLOW_LABELS[flow as MealFlow] ?? FALLBACK_FLOW_LABELS[flow] ?? flow;
}

export function getMealTemplatesByType(mealType?: MealType | string | null) {
  if (!mealType) return [];

  return MEAL_TEMPLATES.filter((template) => template.mealType === mealType);
}

export function getMealTemplateByCode(templateCode?: string | null) {
  if (!templateCode) return null;

  return MEAL_TEMPLATES.find((template) => template.code === templateCode) ?? null;
}

export function findMealTemplateCodeFromDraft(
  mealType?: MealType | string | null,
  title?: string | null
): string {
  if (!mealType || !title) return "";

  const normalizedTitle = title.trim().toLocaleLowerCase("fr");

  const matched = MEAL_TEMPLATES.find(
    (template) =>
      template.mealType === mealType &&
      template.label.trim().toLocaleLowerCase("fr") === normalizedTitle
  );

  return matched?.code ?? "";
}

export function buildMealNotes(
  template: MealTemplate,
  operatorNotes?: string | null
): string {
  const extra = operatorNotes?.trim();

  if (!extra) return template.defaultNotes;

  return `${template.defaultNotes}\n\nNote foyer: ${extra}`;
}

export function extractOperatorNotes(rawNotes?: string | null): string {
  if (!rawNotes) return "";

  const marker = "\n\nNote foyer:";
  const index = rawNotes.indexOf(marker);

  if (index < 0) return "";

  return rawNotes.slice(index + marker.length).trim();
}