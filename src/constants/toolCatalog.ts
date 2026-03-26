export type ToolCategoryCode =
  | "CLEANING"
  | "KITCHEN"
  | "LAUNDRY"
  | "SHOPPING"
  | "ORGANIZATION"
  | "BABY_CARE"
  | "HOME_MAINTENANCE"
  | "SAFETY";

export type ToolFlow = "TASKS" | "MEALS" | "HYGIENE" | "HOUSEHOLD" | "RULES";

export type ToolAssetStatusCode =
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "MAINTENANCE"
  | "RETIRED";

export type ToolReleaseStatusCode = "RELEASED" | "CANCELLED";

export type ToolCategoryOption = {
  value: ToolCategoryCode;
  label: string;
};

export type ToolTemplate = {
  code: string;
  categoryCode: ToolCategoryCode;
  label: string;
  description: string;
  defaultAssetName: string;
  flows: ToolFlow[];
};

export type ToolAssetStatusOption = {
  value: ToolAssetStatusCode;
  label: string;
  description: string;
};

export type ToolReleaseStatusOption = {
  value: ToolReleaseStatusCode;
  label: string;
};

export const TOOL_CATEGORY_OPTIONS: ToolCategoryOption[] = [
  { value: "CLEANING", label: "Ménage" },
  { value: "KITCHEN", label: "Cuisine" },
  { value: "LAUNDRY", label: "Linge" },
  { value: "SHOPPING", label: "Courses" },
  { value: "ORGANIZATION", label: "Organisation" },
  { value: "BABY_CARE", label: "Bébé" },
  { value: "HOME_MAINTENANCE", label: "Maintenance foyer" },
  { value: "SAFETY", label: "Sécurité / secours" },
];

export const TOOL_FLOW_LABELS: Record<ToolFlow, string> = {
  TASKS: "Tâches",
  MEALS: "Repas",
  HYGIENE: "Hygiène",
  HOUSEHOLD: "Foyer",
  RULES: "Règles",
};

export const TOOL_ASSET_STATUS_OPTIONS: ToolAssetStatusOption[] = [
  {
    value: "AVAILABLE",
    label: "Disponible",
    description: "Asset prêt à être utilisé ou réservé.",
  },
  {
    value: "UNAVAILABLE",
    label: "Indisponible",
    description: "Asset momentanément non utilisable.",
  },
  {
    value: "MAINTENANCE",
    label: "Maintenance",
    description: "Asset sorti du flux pour contrôle ou réparation.",
  },
  {
    value: "RETIRED",
    label: "Retiré",
    description: "Asset sorti durablement du parc du foyer.",
  },
];

export const TOOL_RELEASE_STATUS_OPTIONS: ToolReleaseStatusOption[] = [
  { value: "RELEASED", label: "Libérée" },
  { value: "CANCELLED", label: "Annulée" },
];

export const TOOL_TEMPLATES: ToolTemplate[] = [
  {
    code: "VACUUM_CLEANER",
    categoryCode: "CLEANING",
    label: "Aspirateur",
    description:
      "Outil de nettoyage principal pour sols, poussières et continuité d’hygiène.",
    defaultAssetName: "Aspirateur · unité 1",
    flows: ["TASKS", "HYGIENE", "HOUSEHOLD"],
  },
  {
    code: "MOP",
    categoryCode: "CLEANING",
    label: "Serpillière",
    description:
      "Outil humide de nettoyage pour les surfaces au sol du foyer.",
    defaultAssetName: "Serpillière · unité 1",
    flows: ["TASKS", "HYGIENE", "HOUSEHOLD"],
  },
  {
    code: "BROOM",
    categoryCode: "CLEANING",
    label: "Balai",
    description:
      "Outil de balayage rapide pour maintien courant des zones du foyer.",
    defaultAssetName: "Balai · unité 1",
    flows: ["TASKS", "HYGIENE", "HOUSEHOLD"],
  },
  {
    code: "SPONGE_SET",
    categoryCode: "CLEANING",
    label: "Kit éponges",
    description:
      "Matériel léger pour nettoyage ciblé des surfaces et petites zones.",
    defaultAssetName: "Kit éponges · unité 1",
    flows: ["TASKS", "HYGIENE"],
  },

  {
    code: "CHEF_KNIFE",
    categoryCode: "KITCHEN",
    label: "Couteau de chef",
    description:
      "Outil de préparation cuisine pour repas structurés et exécution fiable.",
    defaultAssetName: "Couteau de chef · unité 1",
    flows: ["MEALS", "HOUSEHOLD"],
  },
  {
    code: "BLENDER",
    categoryCode: "KITCHEN",
    label: "Mixeur",
    description:
      "Outil de préparation pour repas, textures adaptées et exécutions rapides.",
    defaultAssetName: "Mixeur · unité 1",
    flows: ["MEALS", "HOUSEHOLD"],
  },
  {
    code: "COOKING_POT",
    categoryCode: "KITCHEN",
    label: "Marmite",
    description:
      "Outil de cuisson principal pour repas collectifs et continuité du foyer.",
    defaultAssetName: "Marmite · unité 1",
    flows: ["MEALS", "HOUSEHOLD"],
  },

  {
    code: "WASHING_MACHINE",
    categoryCode: "LAUNDRY",
    label: "Machine à laver",
    description:
      "Équipement structurant du flux linge pour continuité et hygiène du foyer.",
    defaultAssetName: "Machine à laver · unité 1",
    flows: ["TASKS", "HYGIENE", "HOUSEHOLD"],
  },
  {
    code: "LAUNDRY_BASKET",
    categoryCode: "LAUNDRY",
    label: "Panier à linge",
    description:
      "Support logistique du flux linge, tri et circulation domestique.",
    defaultAssetName: "Panier à linge · unité 1",
    flows: ["TASKS", "HOUSEHOLD"],
  },

  {
    code: "SHOPPING_BAG",
    categoryCode: "SHOPPING",
    label: "Sac de courses",
    description:
      "Outil logistique pour acquisition, transport et réintégration des achats.",
    defaultAssetName: "Sac de courses · unité 1",
    flows: ["TASKS", "HOUSEHOLD"],
  },
  {
    code: "COOLER_BAG",
    categoryCode: "SHOPPING",
    label: "Sac isotherme",
    description:
      "Outil de maintien du froid pour courses sensibles et continuité qualité.",
    defaultAssetName: "Sac isotherme · unité 1",
    flows: ["TASKS", "RULES", "HOUSEHOLD"],
  },

  {
    code: "STORAGE_BIN",
    categoryCode: "ORGANIZATION",
    label: "Bac de rangement",
    description:
      "Support de rangement pour lisibilité, classement et réduction du chaos.",
    defaultAssetName: "Bac de rangement · unité 1",
    flows: ["TASKS", "HOUSEHOLD"],
  },
  {
    code: "LABEL_SET",
    categoryCode: "ORGANIZATION",
    label: "Kit étiquetage",
    description:
      "Support de repérage pour organisation stable et gouvernance du foyer.",
    defaultAssetName: "Kit étiquetage · unité 1",
    flows: ["TASKS", "RULES", "HOUSEHOLD"],
  },

  {
    code: "BABY_BAG",
    categoryCode: "BABY_CARE",
    label: "Sac bébé",
    description:
      "Support logistique pour sorties, continuité et préparation bébé.",
    defaultAssetName: "Sac bébé · unité 1",
    flows: ["TASKS", "RULES", "HOUSEHOLD"],
  },
  {
    code: "BOTTLE_WARMER",
    categoryCode: "BABY_CARE",
    label: "Chauffe-biberon",
    description:
      "Équipement d’appoint pour routine bébé et exécution maîtrisée.",
    defaultAssetName: "Chauffe-biberon · unité 1",
    flows: ["HOUSEHOLD", "RULES"],
  },

  {
    code: "TOOLBOX",
    categoryCode: "HOME_MAINTENANCE",
    label: "Boîte à outils",
    description:
      "Kit d’intervention légère pour maintenance courante et continuité matérielle.",
    defaultAssetName: "Boîte à outils · unité 1",
    flows: ["TASKS", "HOUSEHOLD", "RULES"],
  },
  {
    code: "STEP_LADDER",
    categoryCode: "HOME_MAINTENANCE",
    label: "Escabeau",
    description:
      "Outil d’accès ponctuel pour petits travaux ou rangement en hauteur.",
    defaultAssetName: "Escabeau · unité 1",
    flows: ["TASKS", "HOUSEHOLD", "RULES"],
  },

  {
    code: "FIRST_AID_KIT",
    categoryCode: "SAFETY",
    label: "Trousse de secours",
    description:
      "Équipement de sécurité pour incidents mineurs et continuité de protection.",
    defaultAssetName: "Trousse de secours · unité 1",
    flows: ["HOUSEHOLD", "RULES"],
  },
  {
    code: "FLASHLIGHT",
    categoryCode: "SAFETY",
    label: "Lampe torche",
    description:
      "Équipement de continuité pour contrôle, panne ou usage ponctuel sécurisé.",
    defaultAssetName: "Lampe torche · unité 1",
    flows: ["HOUSEHOLD", "RULES"],
  },
];

const CATEGORY_MAP = new Map(
  TOOL_CATEGORY_OPTIONS.map((item) => [item.value, item.label])
);

const ASSET_STATUS_MAP = new Map(
  TOOL_ASSET_STATUS_OPTIONS.map((item) => [item.value, item])
);

const RELEASE_STATUS_MAP = new Map(
  TOOL_RELEASE_STATUS_OPTIONS.map((item) => [item.value, item.label])
);

const TEMPLATE_MAP = new Map(TOOL_TEMPLATES.map((item) => [item.code, item]));

function normalizeText(value?: string | null) {
  return (value ?? "").trim().toLocaleLowerCase("fr");
}

export function getToolCategoryLabel(categoryCode?: string | null): string {
  if (!categoryCode) return "—";
  return CATEGORY_MAP.get(categoryCode as ToolCategoryCode) ?? categoryCode;
}

export function getToolAssetStatusLabel(status?: string | null): string {
  if (!status) return "—";
  return ASSET_STATUS_MAP.get(status as ToolAssetStatusCode)?.label ?? status;
}

export function getToolReleaseStatusLabel(status?: string | null): string {
  if (!status) return "—";
  return RELEASE_STATUS_MAP.get(status as ToolReleaseStatusCode) ?? status;
}

export function getToolFlowLabel(flow?: string | null): string {
  if (!flow) return "—";
  return TOOL_FLOW_LABELS[flow as ToolFlow] ?? flow;
}

export function getToolAssetStatusOptions() {
  return TOOL_ASSET_STATUS_OPTIONS;
}

export function getToolReleaseStatusOptions() {
  return TOOL_RELEASE_STATUS_OPTIONS;
}

export function getToolTemplatesByCategory(
  categoryCode?: string | null
): ToolTemplate[] {
  if (!categoryCode) return [];

  return TOOL_TEMPLATES.filter(
    (template) => template.categoryCode === categoryCode
  ).sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

export function getToolTemplateByCode(
  templateCode?: string | null
): ToolTemplate | null {
  if (!templateCode) return null;
  return TEMPLATE_MAP.get(templateCode) ?? null;
}

export function inferToolCategoryCodeFromLabel(
  categoryLabel?: string | null
): ToolCategoryCode | "" {
  if (!categoryLabel) return "";

  const normalized = normalizeText(categoryLabel);

  const matched = TOOL_CATEGORY_OPTIONS.find(
    (item) => normalizeText(item.label) === normalized
  );

  return matched?.value ?? "";
}

export function inferToolTemplateCodeFromDraft(
  toolName?: string | null,
  categoryLabel?: string | null
): string {
  const normalizedName = normalizeText(toolName);
  if (!normalizedName) return "";

  const inferredCategory = inferToolCategoryCodeFromLabel(categoryLabel);

  const matched = TOOL_TEMPLATES.find((template) => {
    const sameName = normalizeText(template.label) === normalizedName;
    if (!sameName) return false;

    if (!inferredCategory) return true;
    return template.categoryCode === inferredCategory;
  });

  return matched?.code ?? "";
}

export function buildToolDescription(
  template: ToolTemplate,
  operatorNotes?: string | null
): string {
  const extra = operatorNotes?.trim();

  if (!extra) return template.description;

  return `${template.description}\n\nNote foyer: ${extra}`;
}

export function extractToolOperatorNotes(description?: string | null): string {
  if (!description) return "";

  const marker = "\n\nNote foyer:";
  const index = description.indexOf(marker);

  if (index < 0) return "";

  return description.slice(index + marker.length).trim();
}