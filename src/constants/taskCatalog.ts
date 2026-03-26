export type TaskAreaCode =
  | "CLEANING"
  | "KITCHEN"
  | "LAUNDRY"
  | "SHOPPING"
  | "ORGANIZATION"
  | "BABY_CARE"
  | "HOME_MAINTENANCE";

export type TaskFlow = "HOUSEHOLD" | "HYGIENE" | "INVENTORY" | "SHOPPING" | "RULES";

export type TaskAreaOption = {
  value: TaskAreaCode;
  label: string;
};

export type TaskTemplate = {
  code: string;
  areaCode: TaskAreaCode;
  label: string;
  description: string;
  defaultEffortPoints: number;
  defaultDurationMin: number;
  defaultProofGuideline: string;
  flows: TaskFlow[];
};

export const TASK_AREA_OPTIONS: TaskAreaOption[] = [
  { value: "CLEANING", label: "Ménage" },
  { value: "KITCHEN", label: "Cuisine" },
  { value: "LAUNDRY", label: "Linge" },
  { value: "SHOPPING", label: "Courses" },
  { value: "ORGANIZATION", label: "Organisation" },
  { value: "BABY_CARE", label: "Bébé" },
  { value: "HOME_MAINTENANCE", label: "Maintenance foyer" },
];

export const TASK_FLOW_LABELS: Record<TaskFlow, string> = {
  HOUSEHOLD: "Foyer",
  HYGIENE: "Hygiène",
  INVENTORY: "Inventaire",
  SHOPPING: "Courses",
  RULES: "Règles",
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  CREATED: "Créée",
  INSTANCES_GENERATED: "Instances générées",
  STARTED: "Démarrée",
  IN_PROGRESS: "En cours",
  DONE: "Terminée",
  COMPLETED: "Terminée",
  FAIL: "En échec",
};

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    code: "VACUUM_LIVING_ROOM",
    areaCode: "CLEANING",
    label: "Passer l’aspirateur salon",
    description: "Nettoyage du salon pour maintien de la qualité du foyer.",
    defaultEffortPoints: 3,
    defaultDurationMin: 20,
    defaultProofGuideline:
      "Preuve attendue : sol dégagé, passage terminé, zone principale traitée.",
    flows: ["HOUSEHOLD", "HYGIENE"],
  },
  {
    code: "MOP_FLOOR_MAIN",
    areaCode: "CLEANING",
    label: "Laver le sol zone principale",
    description: "Nettoyage humide des zones de circulation du foyer.",
    defaultEffortPoints: 4,
    defaultDurationMin: 30,
    defaultProofGuideline:
      "Preuve attendue : sol lavé, matériel rangé, zone sécurisée.",
    flows: ["HOUSEHOLD", "HYGIENE"],
  },
  {
    code: "CLEAN_BATHROOM",
    areaCode: "CLEANING",
    label: "Nettoyer salle de bain",
    description: "Assainissement de la salle de bain et remise en état.",
    defaultEffortPoints: 4,
    defaultDurationMin: 35,
    defaultProofGuideline:
      "Preuve attendue : lavabo, douche et WC nettoyés.",
    flows: ["HOUSEHOLD", "HYGIENE", "RULES"],
  },

  {
    code: "DO_DISHES",
    areaCode: "KITCHEN",
    label: "Faire la vaisselle",
    description: "Remise en disponibilité de la vaisselle du foyer.",
    defaultEffortPoints: 2,
    defaultDurationMin: 15,
    defaultProofGuideline:
      "Preuve attendue : vaisselle propre, égouttoir ou rangement terminé.",
    flows: ["HOUSEHOLD", "HYGIENE", "KITCHEN" as TaskFlow],
  },
  {
    code: "CLEAN_KITCHEN_SURFACES",
    areaCode: "KITCHEN",
    label: "Nettoyer plans de travail",
    description: "Nettoyage des surfaces de cuisine après usage.",
    defaultEffortPoints: 2,
    defaultDurationMin: 10,
    defaultProofGuideline:
      "Preuve attendue : plans de travail propres et zone dégagée.",
    flows: ["HOUSEHOLD", "HYGIENE"],
  },
  {
    code: "RESTOCK_KITCHEN_BASICS",
    areaCode: "KITCHEN",
    label: "Réapprovisionner bases cuisine",
    description: "Vérification et remise à niveau des essentiels cuisine.",
    defaultEffortPoints: 2,
    defaultDurationMin: 12,
    defaultProofGuideline:
      "Preuve attendue : essentiels revérifiés et emplacements cohérents.",
    flows: ["HOUSEHOLD", "INVENTORY", "SHOPPING"],
  },

  {
    code: "START_LAUNDRY",
    areaCode: "LAUNDRY",
    label: "Lancer une machine",
    description: "Démarrage d’un cycle de linge du foyer.",
    defaultEffortPoints: 2,
    defaultDurationMin: 10,
    defaultProofGuideline:
      "Preuve attendue : machine lancée, programme cohérent, linge trié.",
    flows: ["HOUSEHOLD", "RULES"],
  },
  {
    code: "FOLD_LAUNDRY",
    areaCode: "LAUNDRY",
    label: "Plier et ranger le linge",
    description: "Remise en ordre du linge propre pour continuité foyer.",
    defaultEffortPoints: 3,
    defaultDurationMin: 25,
    defaultProofGuideline:
      "Preuve attendue : linge plié, trié et rangé.",
    flows: ["HOUSEHOLD"],
  },

  {
    code: "CHECK_SHOPPING_GAPS",
    areaCode: "SHOPPING",
    label: "Vérifier les manques courses",
    description: "Relecture des besoins du foyer avant achat.",
    defaultEffortPoints: 2,
    defaultDurationMin: 15,
    defaultProofGuideline:
      "Preuve attendue : liste relue, besoins prioritaires confirmés.",
    flows: ["SHOPPING", "INVENTORY", "RULES"],
  },
  {
    code: "PUT_AWAY_GROCERIES",
    areaCode: "SHOPPING",
    label: "Ranger les courses",
    description: "Réintégration ordonnée des achats dans le foyer.",
    defaultEffortPoints: 3,
    defaultDurationMin: 20,
    defaultProofGuideline:
      "Preuve attendue : produits rangés, froid traité en priorité.",
    flows: ["SHOPPING", "INVENTORY", "HOUSEHOLD"],
  },

  {
    code: "ORGANIZE_ENTRY",
    areaCode: "ORGANIZATION",
    label: "Ranger l’entrée",
    description: "Remise en ordre d’une zone à forte circulation.",
    defaultEffortPoints: 2,
    defaultDurationMin: 15,
    defaultProofGuideline:
      "Preuve attendue : entrée dégagée, objets remis à leur place.",
    flows: ["HOUSEHOLD"],
  },
  {
    code: "REVIEW_TODAY_PLAN",
    areaCode: "ORGANIZATION",
    label: "Revoir le plan du jour",
    description: "Synchronisation quotidienne des priorités du foyer.",
    defaultEffortPoints: 1,
    defaultDurationMin: 10,
    defaultProofGuideline:
      "Preuve attendue : priorités clarifiées et prochaines actions décidées.",
    flows: ["HOUSEHOLD", "RULES"],
  },

  {
    code: "PREPARE_BABY_BAG",
    areaCode: "BABY_CARE",
    label: "Préparer le sac bébé",
    description: "Préparation logistique de sortie pour bébé.",
    defaultEffortPoints: 2,
    defaultDurationMin: 12,
    defaultProofGuideline:
      "Preuve attendue : essentiels bébé prêts et contrôlés.",
    flows: ["HOUSEHOLD", "SHOPPING", "RULES"],
  },
  {
    code: "RESTOCK_BABY_ESSENTIALS",
    areaCode: "BABY_CARE",
    label: "Vérifier essentiels bébé",
    description: "Contrôle des couches, lingettes et autres besoins critiques.",
    defaultEffortPoints: 2,
    defaultDurationMin: 10,
    defaultProofGuideline:
      "Preuve attendue : stock bébé relu et besoins identifiés.",
    flows: ["INVENTORY", "SHOPPING", "RULES"],
  },

  {
    code: "CHECK_BATTERIES_AND_LIGHTS",
    areaCode: "HOME_MAINTENANCE",
    label: "Vérifier piles et éclairage",
    description: "Contrôle basique de continuité matérielle du foyer.",
    defaultEffortPoints: 2,
    defaultDurationMin: 15,
    defaultProofGuideline:
      "Preuve attendue : points critiques vérifiés, anomalie signalée si besoin.",
    flows: ["HOUSEHOLD", "RULES"],
  },
  {
    code: "MINOR_HOME_CHECK",
    areaCode: "HOME_MAINTENANCE",
    label: "Contrôle rapide du foyer",
    description: "Vérification légère d’éléments clés du logement.",
    defaultEffortPoints: 2,
    defaultDurationMin: 15,
    defaultProofGuideline:
      "Preuve attendue : contrôle réalisé, point sensible remonté si détecté.",
    flows: ["HOUSEHOLD", "RULES"],
  },
];

const TASK_AREA_LABEL_MAP = new Map(
  TASK_AREA_OPTIONS.map((item) => [item.value, item.label])
);

const TASK_TEMPLATE_MAP = new Map(
  TASK_TEMPLATES.map((item) => [item.code, item])
);

export function getTaskAreaLabel(areaCode?: string | null): string {
  if (!areaCode) return "—";
  return TASK_AREA_LABEL_MAP.get(areaCode as TaskAreaCode) ?? areaCode;
}

export function getTaskTemplatesByArea(areaCode?: string | null): TaskTemplate[] {
  if (!areaCode) return [];

  return TASK_TEMPLATES.filter((template) => template.areaCode === areaCode).sort(
    (a, b) => a.label.localeCompare(b.label, "fr")
  );
}

export function getTaskTemplateByCode(taskCode?: string | null): TaskTemplate | null {
  if (!taskCode) return null;
  return TASK_TEMPLATE_MAP.get(taskCode) ?? null;
}

export function inferTaskTemplateCodeFromTitle(title?: string | null): string {
  if (!title) return "";

  const normalizedTitle = title.trim().toLocaleLowerCase("fr");
  const matched = TASK_TEMPLATES.find(
    (template) => template.label.trim().toLocaleLowerCase("fr") === normalizedTitle
  );

  return matched?.code ?? "";
}

export function buildTaskDescription(
  template: TaskTemplate,
  operatorNotes?: string | null
): string {
  const extra = operatorNotes?.trim();

  if (!extra) {
    return `${template.description}\n\n${template.defaultProofGuideline}`;
  }

  return `${template.description}\n\n${template.defaultProofGuideline}\n\nNote foyer: ${extra}`;
}

export function extractTaskOperatorNotes(description?: string | null): string {
  if (!description) return "";

  const marker = "\n\nNote foyer:";
  const index = description.indexOf(marker);

  if (index < 0) return "";

  return description.slice(index + marker.length).trim();
}

export function getTaskStatusLabel(status?: string | null): string {
  if (!status) return "—";
  return TASK_STATUS_LABELS[status] ?? status;
}

export function getTaskFlowLabel(flow?: string | null): string {
  if (!flow) return "—";
  return TASK_FLOW_LABELS[flow as TaskFlow] ?? flow;
}