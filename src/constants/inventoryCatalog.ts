export type InventoryCategoryCode =
  | "EPICERIE"
  | "FRUITS_LEGUMES"
  | "FRAIS_LAITIERS"
  | "VIANDES_POISSONS"
  | "SURGELES"
  | "BOISSONS"
  | "HYGIENE"
  | "ENTRETIEN_MENAGER"
  | "BEBE"
  | "PHARMACIE_SANTE";

export type InventoryUnitCode =
  | "kg"
  | "g"
  | "l"
  | "ml"
  | "piece"
  | "pack"
  | "bouteille"
  | "boite"
  | "sachet"
  | "pot"
  | "rouleau";

export type InventoryFlow =
  | "MEALS"
  | "SHOPPING"
  | "ALERTS"
  | "HOUSEHOLD";

export type InventoryDomain =
  | "FOOD"
  | "HYGIENE"
  | "HOUSEHOLD"
  | "BABY"
  | "HEALTH";

export type InventoryCategory = {
  code: InventoryCategoryCode;
  label: string;
  domain: InventoryDomain;
};

export type InventoryUnitOption = {
  value: InventoryUnitCode;
  label: string;
};

export type InventoryCatalogItem = {
  code: string;
  label: string;
  categoryCode: InventoryCategoryCode;
  defaultUnit: InventoryUnitCode;
  allowedUnits: InventoryUnitCode[];
  domain: InventoryDomain;
  domyliFlows: InventoryFlow[];
};

export const INVENTORY_UNIT_OPTIONS: InventoryUnitOption[] = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "l", label: "litre" },
  { value: "ml", label: "millilitre" },
  { value: "piece", label: "pièce" },
  { value: "pack", label: "pack" },
  { value: "bouteille", label: "bouteille" },
  { value: "boite", label: "boîte" },
  { value: "sachet", label: "sachet" },
  { value: "pot", label: "pot" },
  { value: "rouleau", label: "rouleau" },
];

export const INVENTORY_CATEGORIES: InventoryCategory[] = [
  { code: "EPICERIE", label: "Épicerie", domain: "FOOD" },
  { code: "FRUITS_LEGUMES", label: "Fruits et légumes", domain: "FOOD" },
  { code: "FRAIS_LAITIERS", label: "Produits frais et laitiers", domain: "FOOD" },
  { code: "VIANDES_POISSONS", label: "Viandes et poissons", domain: "FOOD" },
  { code: "SURGELES", label: "Surgelés", domain: "FOOD" },
  { code: "BOISSONS", label: "Boissons", domain: "FOOD" },
  { code: "HYGIENE", label: "Hygiène", domain: "HYGIENE" },
  { code: "ENTRETIEN_MENAGER", label: "Entretien ménager", domain: "HOUSEHOLD" },
  { code: "BEBE", label: "Bébé", domain: "BABY" },
  { code: "PHARMACIE_SANTE", label: "Pharmacie et santé", domain: "HEALTH" },
];

export const INVENTORY_CATALOG_ITEMS: InventoryCatalogItem[] = [
  {
    code: "RIZ_BASMATI",
    label: "Riz basmati",
    categoryCode: "EPICERIE",
    defaultUnit: "kg",
    allowedUnits: ["kg", "g", "sachet"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },
  {
    code: "PATES",
    label: "Pâtes",
    categoryCode: "EPICERIE",
    defaultUnit: "kg",
    allowedUnits: ["kg", "g", "sachet"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },
  {
    code: "SEMOULE",
    label: "Semoule",
    categoryCode: "EPICERIE",
    defaultUnit: "kg",
    allowedUnits: ["kg", "g", "sachet"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },
  {
    code: "FARINE",
    label: "Farine",
    categoryCode: "EPICERIE",
    defaultUnit: "kg",
    allowedUnits: ["kg", "g", "sachet"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },
  {
    code: "SUCRE",
    label: "Sucre",
    categoryCode: "EPICERIE",
    defaultUnit: "kg",
    allowedUnits: ["kg", "g", "boite"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },
  {
    code: "HUILE_OLIVE",
    label: "Huile d’olive",
    categoryCode: "EPICERIE",
    defaultUnit: "bouteille",
    allowedUnits: ["bouteille", "l", "ml"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },
  {
    code: "SEL",
    label: "Sel",
    categoryCode: "EPICERIE",
    defaultUnit: "boite",
    allowedUnits: ["boite", "g", "kg"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },
  {
    code: "POIVRE",
    label: "Poivre",
    categoryCode: "EPICERIE",
    defaultUnit: "pot",
    allowedUnits: ["pot", "g"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },

  {
    code: "BANANE",
    label: "Banane",
    categoryCode: "FRUITS_LEGUMES",
    defaultUnit: "piece",
    allowedUnits: ["piece", "kg"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },
  {
    code: "POMME",
    label: "Pomme",
    categoryCode: "FRUITS_LEGUMES",
    defaultUnit: "piece",
    allowedUnits: ["piece", "kg"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },
  {
    code: "TOMATE",
    label: "Tomate",
    categoryCode: "FRUITS_LEGUMES",
    defaultUnit: "kg",
    allowedUnits: ["kg", "piece"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },
  {
    code: "OIGNON",
    label: "Oignon",
    categoryCode: "FRUITS_LEGUMES",
    defaultUnit: "kg",
    allowedUnits: ["kg", "piece"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },
  {
    code: "POMME_DE_TERRE",
    label: "Pomme de terre",
    categoryCode: "FRUITS_LEGUMES",
    defaultUnit: "kg",
    allowedUnits: ["kg", "piece"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },
  {
    code: "CAROTTE",
    label: "Carotte",
    categoryCode: "FRUITS_LEGUMES",
    defaultUnit: "kg",
    allowedUnits: ["kg", "piece"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },

  {
    code: "LAIT",
    label: "Lait",
    categoryCode: "FRAIS_LAITIERS",
    defaultUnit: "l",
    allowedUnits: ["l", "ml", "bouteille"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },
  {
    code: "YAOURT",
    label: "Yaourt",
    categoryCode: "FRAIS_LAITIERS",
    defaultUnit: "pack",
    allowedUnits: ["pack", "pot"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },
  {
    code: "BEURRE",
    label: "Beurre",
    categoryCode: "FRAIS_LAITIERS",
    defaultUnit: "g",
    allowedUnits: ["g", "pack"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },
  {
    code: "FROMAGE_RAPE",
    label: "Fromage râpé",
    categoryCode: "FRAIS_LAITIERS",
    defaultUnit: "sachet",
    allowedUnits: ["sachet", "g"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },
  {
    code: "OEUFS",
    label: "Œufs",
    categoryCode: "FRAIS_LAITIERS",
    defaultUnit: "boite",
    allowedUnits: ["boite", "piece"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },

  {
    code: "POULET",
    label: "Poulet",
    categoryCode: "VIANDES_POISSONS",
    defaultUnit: "kg",
    allowedUnits: ["kg", "g", "piece"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },
  {
    code: "VIANDE_HACHEE",
    label: "Viande hachée",
    categoryCode: "VIANDES_POISSONS",
    defaultUnit: "kg",
    allowedUnits: ["kg", "g", "boite"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },
  {
    code: "SAUMON",
    label: "Saumon",
    categoryCode: "VIANDES_POISSONS",
    defaultUnit: "kg",
    allowedUnits: ["kg", "g", "piece"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },
  {
    code: "THON",
    label: "Thon",
    categoryCode: "VIANDES_POISSONS",
    defaultUnit: "boite",
    allowedUnits: ["boite", "g"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },

  {
    code: "LEGUMES_SURGELES",
    label: "Légumes surgelés",
    categoryCode: "SURGELES",
    defaultUnit: "sachet",
    allowedUnits: ["sachet", "kg", "g"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },
  {
    code: "FRITES_SURGELEES",
    label: "Frites surgelées",
    categoryCode: "SURGELES",
    defaultUnit: "sachet",
    allowedUnits: ["sachet", "kg", "g"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },
  {
    code: "POISSON_PANE",
    label: "Poisson pané",
    categoryCode: "SURGELES",
    defaultUnit: "boite",
    allowedUnits: ["boite", "piece"],
    domain: "FOOD",
    domyliFlows: ["MEALS", "SHOPPING", "ALERTS"],
  },

  {
    code: "EAU",
    label: "Eau",
    categoryCode: "BOISSONS",
    defaultUnit: "bouteille",
    allowedUnits: ["bouteille", "l", "pack"],
    domain: "FOOD",
    domyliFlows: ["SHOPPING", "ALERTS", "HOUSEHOLD"],
  },
  {
    code: "JUS_ORANGE",
    label: "Jus d’orange",
    categoryCode: "BOISSONS",
    defaultUnit: "bouteille",
    allowedUnits: ["bouteille", "l", "ml"],
    domain: "FOOD",
    domyliFlows: ["SHOPPING", "ALERTS", "HOUSEHOLD"],
  },
  {
    code: "CAFE",
    label: "Café",
    categoryCode: "BOISSONS",
    defaultUnit: "boite",
    allowedUnits: ["boite", "g", "sachet"],
    domain: "FOOD",
    domyliFlows: ["SHOPPING", "ALERTS", "HOUSEHOLD"],
  },

  {
    code: "SAVON",
    label: "Savon",
    categoryCode: "HYGIENE",
    defaultUnit: "piece",
    allowedUnits: ["piece", "pack"],
    domain: "HYGIENE",
    domyliFlows: ["SHOPPING", "ALERTS", "HOUSEHOLD"],
  },
  {
    code: "SHAMPOING",
    label: "Shampoing",
    categoryCode: "HYGIENE",
    defaultUnit: "bouteille",
    allowedUnits: ["bouteille", "ml"],
    domain: "HYGIENE",
    domyliFlows: ["SHOPPING", "ALERTS", "HOUSEHOLD"],
  },
  {
    code: "DENTIFRICE",
    label: "Dentifrice",
    categoryCode: "HYGIENE",
    defaultUnit: "piece",
    allowedUnits: ["piece", "pack"],
    domain: "HYGIENE",
    domyliFlows: ["SHOPPING", "ALERTS", "HOUSEHOLD"],
  },
  {
    code: "GEL_DOUCHE",
    label: "Gel douche",
    categoryCode: "HYGIENE",
    defaultUnit: "bouteille",
    allowedUnits: ["bouteille", "ml"],
    domain: "HYGIENE",
    domyliFlows: ["SHOPPING", "ALERTS", "HOUSEHOLD"],
  },

  {
    code: "LIQUIDE_VAISSELLE",
    label: "Liquide vaisselle",
    categoryCode: "ENTRETIEN_MENAGER",
    defaultUnit: "bouteille",
    allowedUnits: ["bouteille", "ml", "l"],
    domain: "HOUSEHOLD",
    domyliFlows: ["SHOPPING", "ALERTS", "HOUSEHOLD"],
  },
  {
    code: "LESSIVE",
    label: "Lessive",
    categoryCode: "ENTRETIEN_MENAGER",
    defaultUnit: "bouteille",
    allowedUnits: ["bouteille", "l", "pack"],
    domain: "HOUSEHOLD",
    domyliFlows: ["SHOPPING", "ALERTS", "HOUSEHOLD"],
  },
  {
    code: "EPONGE",
    label: "Éponge",
    categoryCode: "ENTRETIEN_MENAGER",
    defaultUnit: "piece",
    allowedUnits: ["piece", "pack"],
    domain: "HOUSEHOLD",
    domyliFlows: ["SHOPPING", "ALERTS", "HOUSEHOLD"],
  },
  {
    code: "PAPIER_TOILETTE",
    label: "Papier toilette",
    categoryCode: "ENTRETIEN_MENAGER",
    defaultUnit: "pack",
    allowedUnits: ["pack", "rouleau"],
    domain: "HOUSEHOLD",
    domyliFlows: ["SHOPPING", "ALERTS", "HOUSEHOLD"],
  },

  {
    code: "COUCHES",
    label: "Couches",
    categoryCode: "BEBE",
    defaultUnit: "pack",
    allowedUnits: ["pack", "piece"],
    domain: "BABY",
    domyliFlows: ["SHOPPING", "ALERTS", "HOUSEHOLD"],
  },
  {
    code: "LINGETTES_BEBE",
    label: "Lingettes bébé",
    categoryCode: "BEBE",
    defaultUnit: "pack",
    allowedUnits: ["pack", "sachet"],
    domain: "BABY",
    domyliFlows: ["SHOPPING", "ALERTS", "HOUSEHOLD"],
  },
  {
    code: "LAIT_BEBE",
    label: "Lait bébé",
    categoryCode: "BEBE",
    defaultUnit: "boite",
    allowedUnits: ["boite", "g"],
    domain: "BABY",
    domyliFlows: ["SHOPPING", "ALERTS", "HOUSEHOLD"],
  },

  {
    code: "DOLIPRANE",
    label: "Doliprane",
    categoryCode: "PHARMACIE_SANTE",
    defaultUnit: "boite",
    allowedUnits: ["boite", "piece"],
    domain: "HEALTH",
    domyliFlows: ["SHOPPING", "ALERTS", "HOUSEHOLD"],
  },
  {
    code: "SPASFON",
    label: "Spasfon",
    categoryCode: "PHARMACIE_SANTE",
    defaultUnit: "boite",
    allowedUnits: ["boite", "piece"],
    domain: "HEALTH",
    domyliFlows: ["SHOPPING", "ALERTS", "HOUSEHOLD"],
  },
  {
    code: "PANSEMENTS",
    label: "Pansements",
    categoryCode: "PHARMACIE_SANTE",
    defaultUnit: "boite",
    allowedUnits: ["boite", "pack"],
    domain: "HEALTH",
    domyliFlows: ["SHOPPING", "ALERTS", "HOUSEHOLD"],
  },
];

const categoryMap = new Map(
  INVENTORY_CATEGORIES.map((category) => [category.code, category])
);

const unitMap = new Map(
  INVENTORY_UNIT_OPTIONS.map((unit) => [unit.value, unit])
);

const itemMap = new Map(
  INVENTORY_CATALOG_ITEMS.map((item) => [item.code, item])
);

export function getInventoryCategoryOptions() {
  return INVENTORY_CATEGORIES.map((category) => ({
    value: category.code,
    label: category.label,
  }));
}

export function getInventoryItemsByCategory(
  categoryCode?: string | null
): InventoryCatalogItem[] {
  if (!categoryCode) return [];

  return INVENTORY_CATALOG_ITEMS.filter(
    (item) => item.categoryCode === categoryCode
  ).sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

export function getInventoryItemByCode(
  itemCode?: string | null
): InventoryCatalogItem | null {
  if (!itemCode) return null;
  return itemMap.get(itemCode) ?? null;
}

export function getInventoryUnitOptionsForItem(itemCode?: string | null) {
  const item = getInventoryItemByCode(itemCode);

  if (!item) return INVENTORY_UNIT_OPTIONS;

  return item.allowedUnits
    .map((unitCode) => unitMap.get(unitCode))
    .filter((unit): unit is InventoryUnitOption => Boolean(unit));
}

export function getInventoryCategoryLabel(
  categoryCode?: string | null
): string | null {
  if (!categoryCode) return null;
  return categoryMap.get(categoryCode)?.label ?? null;
}

export function getInventoryUnitLabel(unitCode?: string | null): string | null {
  if (!unitCode) return null;
  return unitMap.get(unitCode as InventoryUnitCode)?.label ?? null;
}