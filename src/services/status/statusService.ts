import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";
import type { DashboardFeedItem, DashboardHealth } from "@/src/services/dashboard/dashboardService";

type RpcObject = Record<string, unknown>;

async function callRpcFallback<T>(names: string[], payload: RpcObject, options: RpcObject = {}): Promise<T> {
  let lastError: unknown = null;
  for (const name of names) {
    try {
      return (await callRpc(name, payload, options as never)) as T;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export type StatusGlobalCode = "STABLE" | "WATCH" | "CRITICAL" | string;

export type StatusFlowSummary = {
  inventory: { missing_stock_count: number; low_stock_count: number };
  tasks: { overdue_tasks_count: number };
  meals: { planned_meals_count: number };
  shopping: { open_shopping_count: number };
  household: { pending_invites_count: number; profiles_incomplete_count: number };
  tools: { blocked_tools_count: number };
};

export type StatusSnapshot = {
  health: DashboardHealth;
  feed: DashboardFeedItem[];
  globalStatus: StatusGlobalCode;
  flowSummary: StatusFlowSummary;
};

function asObject(value: unknown): RpcObject {
  return (value ?? {}) as RpcObject;
}

function normalizeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : value == null ? fallback : Number(value);
}

function normalizeHealth(value: unknown): DashboardHealth {
  const raw = asObject(value);
  return {
    missing_stock_count: normalizeNumber(raw.missing_stock_count, 0),
    low_stock_count: normalizeNumber(raw.low_stock_count, 0),
    open_alert_count: normalizeNumber(raw.open_alert_count, 0),
    open_shopping_count: normalizeNumber(raw.open_shopping_count, 0),
    overdue_tasks_count: normalizeNumber(raw.overdue_tasks_count, 0),
    planned_meals_count: normalizeNumber(raw.planned_meals_count, 0),
    blocked_tools_count: normalizeNumber(raw.blocked_tools_count, 0),
    pending_invites_count: normalizeNumber(raw.pending_invites_count, 0),
    profiles_incomplete_count: normalizeNumber(raw.profiles_incomplete_count, 0),
    day: typeof raw.day === "string" ? raw.day : null,
  };
}

function normalizeFeed(value: unknown): DashboardFeedItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    const raw = asObject(entry);
    return {
      item_type: typeof raw.item_type === "string" ? raw.item_type : "SIGNAL",
      title: typeof raw.title === "string" ? raw.title : "Signal DOMYLI",
      status: typeof raw.status === "string" ? raw.status : "WATCH",
      scheduled_at: typeof raw.scheduled_at === "string" ? raw.scheduled_at : null,
      flow_code: typeof raw.flow_code === "string" ? raw.flow_code : "HOUSEHOLD",
      entity_type: typeof raw.entity_type === "string" ? raw.entity_type : null,
      entity_id: typeof raw.entity_id === "string" ? raw.entity_id : null,
      route_hint: typeof raw.route_hint === "string" ? raw.route_hint : null,
      meta: asObject(raw.meta),
    };
  });
}

function normalizePair(value: unknown) {
  const raw = asObject(value);
  return Object.fromEntries(Object.entries(raw).map(([key, entry]) => [key, normalizeNumber(entry, 0)]));
}

function normalizeFlowSummary(value: unknown): StatusFlowSummary {
  const raw = asObject(value);
  return {
    inventory: normalizePair(raw.inventory) as StatusFlowSummary["inventory"],
    tasks: normalizePair(raw.tasks) as StatusFlowSummary["tasks"],
    meals: normalizePair(raw.meals) as StatusFlowSummary["meals"],
    shopping: normalizePair(raw.shopping) as StatusFlowSummary["shopping"],
    household: normalizePair(raw.household) as StatusFlowSummary["household"],
    tools: normalizePair(raw.tools) as StatusFlowSummary["tools"],
  };
}

function normalizeSnapshot(value: unknown): StatusSnapshot {
  const raw = asObject(value);
  return {
    health: normalizeHealth(raw.health),
    feed: normalizeFeed(raw.feed),
    globalStatus: typeof raw.global_status === "string" ? raw.global_status : "STABLE",
    flowSummary: normalizeFlowSummary(raw.flow_summary ?? raw.flowSummary),
  };
}

export async function readStatusSnapshot(): Promise<StatusSnapshot> {
  try {
    const raw = await callRpcFallback<unknown>(["rpc_status_read_v1"], {}, { unwrap: true, timeoutMs: 12000, retries: 1, retryDelayMs: 800 });
    return normalizeSnapshot(raw);
  } catch (error) {
    throw toDomyliError(error);
  }
}
