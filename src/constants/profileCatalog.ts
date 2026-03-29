export type ProfileSexCode = "FEMALE" | "MALE";

export type ProfileGoalCode =
  | "WEIGHT_LOSS"
  | "MASS_GAIN"
  | "MAINTENANCE"
  | "HEALTH_STABILITY"
  | "ENERGY_SUPPORT"
  | "PREGNANCY_SUPPORT";

export type ProfileActivityCode =
  | "SEDENTARY"
  | "LIGHT"
  | "MODERATE"
  | "ACTIVE"
  | "VERY_ACTIVE"
  | "SPORT";

export type ProfileAllergyCode =
  | "GLUTEN"
  | "MILK"
  | "EGGS"
  | "PEANUTS"
  | "TREE_NUTS"
  | "SOY"
  | "SESAME"
  | "FISH"
  | "SHELLFISH"
  | "MUSTARD"
  | "CELERY"
  | "LUPIN"
  | "SULPHITES";

export type ProfileFoodConstraintCode =
  | "HALAL"
  | "NO_PORK"
  | "VEGETARIAN"
  | "VEGAN"
  | "LOW_SUGAR"
  | "DIABETES_FRIENDLY"
  | "HIGH_PROTEIN"
  | "LOW_CARB"
  | "LOW_SALT"
  | "PREGNANCY_SAFE";

export type ProfileCulturalConstraintCode =
  | "NO_ALCOHOL_COOKING"
  | "RELIGIOUS_FASTING"
  | "RAMADAN"
  | "MAGHREB_CUISINE"
  | "WEST_AFRICAN_CUISINE"
  | "MEDITERRANEAN_CUISINE"
  | "FAMILY_TRADITIONAL_MEALS";

export type ProfileFlow = "MEALS" | "TASKS" | "RULES" | "SHOPPING";

export type ProfileOption<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
};

export const PROFILE_SEX_OPTIONS: ProfileOption<ProfileSexCode>[] = [
  { value: "FEMALE", label: "Femme" },
  { value: "MALE", label: "Homme" },
];

export const PROFILE_GOAL_OPTIONS: ProfileOption<ProfileGoalCode>[] = [
  { value: "WEIGHT_LOSS", label: "Perte de poids" },
  { value: "MASS_GAIN", label: "Prise de masse" },
  { value: "MAINTENANCE", label: "Maintien" },
  { value: "HEALTH_STABILITY", label: "Équilibre / santé" },
  { value: "ENERGY_SUPPORT", label: "Énergie / vitalité" },
  { value: "PREGNANCY_SUPPORT", label: "Accompagnement grossesse" },
];

export const PROFILE_ACTIVITY_OPTIONS: ProfileOption<ProfileActivityCode>[] = [
  { value: "SEDENTARY", label: "Sédentaire" },
  { value: "LIGHT", label: "Légère" },
  { value: "MODERATE", label: "Modérée" },
  { value: "ACTIVE", label: "Active" },
  { value: "VERY_ACTIVE", label: "Très active" },
  { value: "SPORT", label: "Sport régulier" },
];

export const PROFILE_ALLERGY_OPTIONS: ProfileOption<ProfileAllergyCode>[] = [
  { value: "GLUTEN", label: "Gluten" },
  { value: "MILK", label: "Lait" },
  { value: "EGGS", label: "Œufs" },
  { value: "PEANUTS", label: "Arachides" },
  { value: "TREE_NUTS", label: "Fruits à coque" },
  { value: "SOY", label: "Soja" },
  { value: "SESAME", label: "Sésame" },
  { value: "FISH", label: "Poisson" },
  { value: "SHELLFISH", label: "Crustacés / fruits de mer" },
  { value: "MUSTARD", label: "Moutarde" },
  { value: "CELERY", label: "Céleri" },
  { value: "LUPIN", label: "Lupin" },
  { value: "SULPHITES", label: "Sulfites" },
];

export const PROFILE_FOOD_CONSTRAINT_OPTIONS: ProfileOption<ProfileFoodConstraintCode>[] =
  [
    { value: "HALAL", label: "Halal" },
    { value: "NO_PORK", label: "Sans porc" },
    { value: "VEGETARIAN", label: "Végétarien" },
    { value: "VEGAN", label: "Vegan" },
    { value: "LOW_SUGAR", label: "Faible en sucre" },
    { value: "DIABETES_FRIENDLY", label: "Compatible diabète" },
    { value: "HIGH_PROTEIN", label: "Riche en protéines" },
    { value: "LOW_CARB", label: "Réduit en glucides" },
    { value: "LOW_SALT", label: "Réduit en sel" },
    { value: "PREGNANCY_SAFE", label: "Compatible grossesse" },
  ];

export const PROFILE_CULTURAL_CONSTRAINT_OPTIONS: ProfileOption<ProfileCulturalConstraintCode>[] =
  [
    { value: "NO_ALCOHOL_COOKING", label: "Sans alcool en cuisine" },
    { value: "RELIGIOUS_FASTING", label: "Jeûne religieux" },
    { value: "RAMADAN", label: "Ramadan" },
    { value: "MAGHREB_CUISINE", label: "Préférences Maghreb" },
    { value: "WEST_AFRICAN_CUISINE", label: "Préférences Afrique de l’Ouest" },
    { value: "MEDITERRANEAN_CUISINE", label: "Préférences méditerranéennes" },
    { value: "FAMILY_TRADITIONAL_MEALS", label: "Repas familiaux traditionnels" },
  ];

export const PROFILE_IMPACT_FLOWS: ProfileFlow[] = [
  "MEALS",
  "TASKS",
  "RULES",
  "SHOPPING",
];

export function getOptionLabel<T extends string>(
  options: ProfileOption<T>[],
  value?: T | string | null
): string | null {
  if (!value) return null;
  return options.find((option) => option.value === value)?.label ?? null;
}

export function getOptionLabels<T extends string>(
  options: ProfileOption<T>[],
  values?: Array<T | string> | null
): string[] {
  if (!values?.length) return [];

  return values
    .map((value) => options.find((option) => option.value === value)?.label)
    .filter((label): label is string => Boolean(label));
}