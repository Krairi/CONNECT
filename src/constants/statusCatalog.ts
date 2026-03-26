import type {
  TodayHealthOutput,
  TodayLoadFeedItem,
} from "@/src/services/status/statusService";

export type StatusSignalCode = "STABLE" | "WATCH" | "ATTENTION" | "CRITICAL";
export type StatusFlow = "INVENTORY" | "TASKS" | "MEALS" | "TOOLS" | "HOUSEHOLD";
export type StatusFeedType = "TASK" | "MEAL" | "ALERT" | "TOOL" | "UNKNOWN";

export type StatusSignalMeta = {
  code: StatusSignalCode;
  label: string;
  description: string;
  priority: number;
};

export type StatusFeedTypeMeta = {
  code: StatusFeedType;
  label: string;
  priority: number;
};

export const STATUS_SIGNAL_METAS: StatusSignalMeta[] = [
  {
    code: "CRITICAL",
    label: "Critique",
    description:
      "Le foyer présente plusieurs signaux forts qui demandent une action rapide.",
    priority: 1,
  },
  {
    code: "ATTENTION",
    label: "Attention requise",
    description:
      "Des points bloquants ou dégradants doivent être traités pour stabiliser l’exécution.",
    priority: 2,
  },
  {
    code: "WATCH",
    label: "Sous surveillance",
    description:
      "Le foyer reste opérationnel, mais certains signaux appellent une vigilance active.",
    priority: 3,
  },
  {
    code: "STABLE",
    label: "Stable",
    description:
      "Aucun signal critique détecté dans les indicateurs structurants du foyer.",
    priority: 4,
  },
];

export const STATUS_FLOW_LABELS: Record<StatusFlow, string> = {
  INVENTORY: "Inventaire",
  TASKS: "Tâches",
  MEALS: "Repas",
  TOOLS: "Outils",
  HOUSEHOLD: "Foyer",
};

export const STATUS_FEED_TYPE_METAS: StatusFeedTypeMeta[] = [
  { code: "ALERT", label: "Alerte", priority: 1 },
  { code: "TOOL", label: "Outil", priority: 2 },
  { code: "TASK", label: "Tâche", priority: 3 },
  { code: "MEAL", label: "Repas", priority: 4 },
  { code: "UNKNOWN", label: "Élément", priority: 5 },
];

const FEED_TYPE_MAP = new Map(
  STATUS_FEED_TYPE_METAS.map((item) => [item.code, item])
);

export function getStatusFlowLabel(flow?: string | null): string {
  if (!flow) return "—";
  return STATUS_FLOW_LABELS[flow as StatusFlow] ?? flow;
}

export function normalizeStatusFeedType(
  itemType?: string | null
): StatusFeedType {
  const normalized = (itemType ?? "").trim().toUpperCase();

  if (normalized === "TASK") return "TASK";
  if (normalized === "MEAL") return "MEAL";
  if (normalized === "ALERT") return "ALERT";
  if (normalized === "TOOL") return "TOOL";

  return "UNKNOWN";
}

export function getStatusFeedTypeMeta(
  itemType?: string | null
): StatusFeedTypeMeta {
  const code = normalizeStatusFeedType(itemType);
  return FEED_TYPE_MAP.get(code) ?? FEED_TYPE_MAP.get("UNKNOWN")!;
}

export function getStatusFeedTypeLabel(itemType?: string | null): string {
  return getStatusFeedTypeMeta(itemType).label;
}

export function getStatusItemSeverityCode(
  item: Pick<TodayLoadFeedItem, "item_type" | "status">
): StatusSignalCode {
  const type = normalizeStatusFeedType(item.item_type);
  const status = (item.status ?? "").trim().toUpperCase();

  if (type === "ALERT") return "CRITICAL";

  if (status.includes("BLOCK") || status.includes("FAIL")) {
    return "ATTENTION";
  }

  if (type === "TASK" && (status.includes("OVERDUE") || status.includes("LATE"))) {
    return "ATTENTION";
  }

  if (type === "MEAL" && (status === "PLANNED" || status === "DRAFT")) {
    return "WATCH";
  }

  if (type === "TOOL" && status.includes("MAINT")) {
    return "WATCH";
  }

  return "STABLE";
}

export function getStatusSignalMeta(
  code?: StatusSignalCode | null
): StatusSignalMeta {
  return (
    STATUS_SIGNAL_METAS.find((item) => item.code === code) ??
    STATUS_SIGNAL_METAS[STATUS_SIGNAL_METAS.length - 1]
  );
}

export function computeDomyliGlobalStatus(
  health: TodayHealthOutput | null
): StatusSignalMeta {
  const safe = {
    missing_stock_count: Number(health?.missing_stock_count ?? 0),
    overdue_tasks_count: Number(health?.overdue_tasks_count ?? 0),
    planned_meals_count: Number(health?.planned_meals_count ?? 0),
    confirmed_meals_count: Number(health?.confirmed_meals_count ?? 0),
    blocked_tools_count: Number(health?.blocked_tools_count ?? 0),
  };

  const mealGap = Math.max(
    0,
    safe.planned_meals_count - safe.confirmed_meals_count
  );

  if (
    (safe.blocked_tools_count > 0 && safe.overdue_tasks_count > 0) ||
    (safe.missing_stock_count >= 3 && safe.overdue_tasks_count > 0)
  ) {
    return getStatusSignalMeta("CRITICAL");
  }

  if (safe.blocked_tools_count > 0 || safe.overdue_tasks_count > 0) {
    return getStatusSignalMeta("ATTENTION");
  }

  if (safe.missing_stock_count > 0 || mealGap > 0) {
    return getStatusSignalMeta("WATCH");
  }

  return getStatusSignalMeta("STABLE");
}

export function getDomyliPriorityAlerts(health: TodayHealthOutput | null) {
  const safe = {
    missing_stock_count: Number(health?.missing_stock_count ?? 0),
    overdue_tasks_count: Number(health?.overdue_tasks_count ?? 0),
    planned_meals_count: Number(health?.planned_meals_count ?? 0),
    confirmed_meals_count: Number(health?.confirmed_meals_count ?? 0),
    blocked_tools_count: Number(health?.blocked_tools_count ?? 0),
  };

  const alerts = [
    {
      code: "missing_stock_count",
      label: "Stock manquant",
      value: safe.missing_stock_count,
      description: "Articles absents ou insuffisants dans le stock gouverné.",
      severity:
        safe.missing_stock_count >= 3
          ? "ATTENTION"
          : safe.missing_stock_count > 0
          ? "WATCH"
          : "STABLE",
    },
    {
      code: "overdue_tasks_count",
      label: "Tâches en retard",
      value: safe.overdue_tasks_count,
      description: "Actions du foyer non absorbées dans le rythme prévu.",
      severity: safe.overdue_tasks_count > 0 ? "ATTENTION" : "STABLE",
    },
    {
      code: "blocked_tools_count",
      label: "Outils bloqués",
      value: safe.blocked_tools_count,
      description: "Ressources matérielles indisponibles ou contraintes.",
      severity: safe.blocked_tools_count > 0 ? "ATTENTION" : "STABLE",
    },
    {
      code: "meal_gap",
      label: "Repas à confirmer",
      value: Math.max(0, safe.planned_meals_count - safe.confirmed_meals_count),
      description: "Repas planifiés encore non confirmés dans le cycle du jour.",
      severity:
        safe.planned_meals_count - safe.confirmed_meals_count > 0
          ? "WATCH"
          : "STABLE",
    },
  ];

  return alerts
    .filter((alert) => alert.value > 0)
    .sort((a, b) => {
      const aPriority = getStatusSignalMeta(
        a.severity as StatusSignalCode
      ).priority;
      const bPriority = getStatusSignalMeta(
        b.severity as StatusSignalCode
      ).priority;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return b.value - a.value;
    });
}

export function sortStatusFeedItems(items: TodayLoadFeedItem[]) {
  return [...items].sort((a, b) => {
    const aSeverity = getStatusSignalMeta(getStatusItemSeverityCode(a)).priority;
    const bSeverity = getStatusSignalMeta(getStatusItemSeverityCode(b)).priority;

    if (aSeverity !== bSeverity) {
      return aSeverity - bSeverity;
    }

    const aType = getStatusFeedTypeMeta(a.item_type).priority;
    const bType = getStatusFeedTypeMeta(b.item_type).priority;

    if (aType !== bType) {
      return aType - bType;
    }

    const aDate = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.MAX_SAFE_INTEGER;
    const bDate = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Number.MAX_SAFE_INTEGER;

    if (aDate !== bDate) {
      return aDate - bDate;
    }

    return (a.title ?? "").localeCompare(b.title ?? "", "fr");
  });
}

export function summarizeStatusFeedByType(items: TodayLoadFeedItem[]) {
  return STATUS_FEED_TYPE_METAS.map((meta) => ({
    ...meta,
    count: items.filter(
      (item) => normalizeStatusFeedType(item.item_type) === meta.code
    ).length,
  }));
}

export function formatStatusDate(date?: string | null): string {
  if (!date) return "—";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("fr-FR");
}