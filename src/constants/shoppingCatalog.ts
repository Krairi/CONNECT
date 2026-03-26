export type ShoppingPriorityCode =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "NONE";

export type ShoppingStatusCode =
  | "OPEN"
  | "TO_BUY"
  | "PENDING"
  | "PURCHASED"
  | "REINTEGRATED"
  | "CANCELLED"
  | "UNKNOWN";

export type ShoppingPriorityMeta = {
  code: ShoppingPriorityCode;
  label: string;
  description: string;
  rank: number;
};

export type ShoppingStatusMeta = {
  code: ShoppingStatusCode;
  label: string;
  description: string;
  rank: number;
};

export type ShoppingDomyliFlow =
  | "INVENTORY_THRESHOLD"
  | "MEAL_GAP"
  | "HOUSEHOLD_CONTINUITY";

export const SHOPPING_DOMYLI_FLOWS: Array<{
  code: ShoppingDomyliFlow;
  label: string;
}> = [
  { code: "INVENTORY_THRESHOLD", label: "Seuil stock" },
  { code: "MEAL_GAP", label: "Écart repas" },
  { code: "HOUSEHOLD_CONTINUITY", label: "Continuité foyer" },
];

export const SHOPPING_PRIORITY_METAS: ShoppingPriorityMeta[] = [
  {
    code: "CRITICAL",
    label: "Critique",
    description: "Manque fort ou impact direct sur l’exécution du foyer.",
    rank: 1,
  },
  {
    code: "HIGH",
    label: "Haute",
    description: "Besoin important à traiter rapidement.",
    rank: 2,
  },
  {
    code: "MEDIUM",
    label: "Moyenne",
    description: "Besoin standard à intégrer au prochain achat.",
    rank: 3,
  },
  {
    code: "LOW",
    label: "Faible",
    description: "Besoin secondaire ou confort.",
    rank: 4,
  },
  {
    code: "NONE",
    label: "Non précisée",
    description: "Priorité non fournie par la donnée actuelle.",
    rank: 5,
  },
];

export const SHOPPING_STATUS_METAS: ShoppingStatusMeta[] = [
  {
    code: "OPEN",
    label: "Ouvert",
    description: "Article encore actif dans la liste de courses.",
    rank: 1,
  },
  {
    code: "TO_BUY",
    label: "À acheter",
    description: "Article attendu au prochain achat.",
    rank: 2,
  },
  {
    code: "PENDING",
    label: "En attente",
    description: "Article identifié mais pas encore soldé.",
    rank: 3,
  },
  {
    code: "PURCHASED",
    label: "Acheté",
    description: "Article acheté mais pas encore réintégré en stock.",
    rank: 4,
  },
  {
    code: "REINTEGRATED",
    label: "Réintégré",
    description: "Article revenu dans le stock réel du foyer.",
    rank: 5,
  },
  {
    code: "CANCELLED",
    label: "Annulé",
    description: "Article retiré du besoin courant.",
    rank: 6,
  },
  {
    code: "UNKNOWN",
    label: "Inconnu",
    description: "Statut non reconnu par le référentiel front.",
    rank: 7,
  },
];

const PRIORITY_ALIASES: Record<string, ShoppingPriorityCode> = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
  NONE: "NONE",
  NORMAL: "MEDIUM",
  STANDARD: "MEDIUM",
};

const STATUS_ALIASES: Record<string, ShoppingStatusCode> = {
  OPEN: "OPEN",
  TO_BUY: "TO_BUY",
  TODO: "TO_BUY",
  PENDING: "PENDING",
  PURCHASED: "PURCHASED",
  BOUGHT: "PURCHASED",
  REINTEGRATED: "REINTEGRATED",
  CANCELLED: "CANCELLED",
  CANCELED: "CANCELLED",
};

export function normalizeShoppingPriority(
  raw?: string | null
): ShoppingPriorityCode {
  if (!raw) return "NONE";

  const normalized = raw.trim().toUpperCase();
  return PRIORITY_ALIASES[normalized] ?? "NONE";
}

export function normalizeShoppingStatus(
  raw?: string | null
): ShoppingStatusCode {
  if (!raw) return "UNKNOWN";

  const normalized = raw.trim().toUpperCase();
  return STATUS_ALIASES[normalized] ?? "UNKNOWN";
}

export function getShoppingPriorityMeta(
  raw?: string | null
): ShoppingPriorityMeta {
  const code = normalizeShoppingPriority(raw);

  return (
    SHOPPING_PRIORITY_METAS.find((meta) => meta.code === code) ??
    SHOPPING_PRIORITY_METAS[SHOPPING_PRIORITY_METAS.length - 1]
  );
}

export function getShoppingStatusMeta(raw?: string | null): ShoppingStatusMeta {
  const code = normalizeShoppingStatus(raw);

  return (
    SHOPPING_STATUS_METAS.find((meta) => meta.code === code) ??
    SHOPPING_STATUS_METAS[SHOPPING_STATUS_METAS.length - 1]
  );
}

export function sortShoppingItemsByDomyliPriority<T extends { priority?: string | null; item_name?: string | null }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const priorityRankA = getShoppingPriorityMeta(a.priority).rank;
    const priorityRankB = getShoppingPriorityMeta(b.priority).rank;

    if (priorityRankA !== priorityRankB) {
      return priorityRankA - priorityRankB;
    }

    const nameA = (a.item_name ?? "").toLocaleLowerCase("fr");
    const nameB = (b.item_name ?? "").toLocaleLowerCase("fr");

    return nameA.localeCompare(nameB, "fr");
  });
}

export function summarizeShoppingCountsByPriority<
  T extends { priority?: string | null }
>(items: T[]) {
  return SHOPPING_PRIORITY_METAS.map((meta) => ({
    ...meta,
    count: items.filter(
      (item) => normalizeShoppingPriority(item.priority) === meta.code
    ).length,
  }));
}

export function summarizeShoppingCountsByStatus<
  T extends { status?: string | null }
>(items: T[]) {
  return SHOPPING_STATUS_METAS.map((meta) => ({
    ...meta,
    count: items.filter(
      (item) => normalizeShoppingStatus(item.status) === meta.code
    ).length,
  }));
}