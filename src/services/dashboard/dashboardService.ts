import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";

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

export type DashboardHealth = {
  missing_stock_count: number;
  low_stock_count: number;
  open_alert_count: number;
  open_shopping_count: number;
  overdue_tasks_count: number;
  planned_meals_count: number;
  blocked_tools_count: number;
  pending_invites_count: number;
  profiles_incomplete_count: number;
  day: string | null;
};

export type DashboardActivation = {
  activation_score: number;
  is_operational: boolean;
  has_members: boolean;
  has_profiles: boolean;
  has_inventory: boolean;
  has_tasks: boolean;
  has_meals: boolean;
};

export type DashboardValueChain = {
  members_count: number;
  profiles_count: number;
  inventory_items_count: number;
  meal_slots_count: number;
  tasks_count: number;
  shopping_open_count: number;
  alerts_open_count: number;
  proofs_count: number;
};

export type DashboardFeedItem = {
  item_type: string;
  title: string;
  status: string;
  scheduled_at: string | null;
  flow_code: string;
  entity_type: string | null;
  entity_id: string | null;
  route_hint: string | null;
  meta: RpcObject;
};

export type DashboardNextAction = {
  route: string;
  label: string;
};

export type DashboardSnapshot = {
  activation: DashboardActivation;
  valueChain: DashboardValueChain;
  health: DashboardHealth;
  feed: DashboardFeedItem[];
  nextAction: DashboardNextAction;
};

function asObject(value: unknown): RpcObject {
  return (value ?? {}) as RpcObject;
}

function normalizeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : value == null ? fallback : Number(value);
}

function normalizeBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeActivation(value: unknown): DashboardActivation {
  const raw = asObject(value);
  return {
    activation_score: normalizeNumber(raw.activation_score, 0),
    is_operational: normalizeBoolean(raw.is_operational, false),
    has_members: normalizeBoolean(raw.has_members, false),
    has_profiles: normalizeBoolean(raw.has_profiles, false),
    has_inventory: normalizeBoolean(raw.has_inventory, false),
    has_tasks: normalizeBoolean(raw.has_tasks, false),
    has_meals: normalizeBoolean(raw.has_meals, false),
  };
}

function normalizeValueChain(value: unknown): DashboardValueChain {
  const raw = asObject(value);
  return {
    members_count: normalizeNumber(raw.members_count, 0),
    profiles_count: normalizeNumber(raw.profiles_count, 0),
    inventory_items_count: normalizeNumber(raw.inventory_items_count, 0),
    meal_slots_count: normalizeNumber(raw.meal_slots_count, 0),
    tasks_count: normalizeNumber(raw.tasks_count, 0),
    shopping_open_count: normalizeNumber(raw.shopping_open_count, 0),
    alerts_open_count: normalizeNumber(raw.alerts_open_count, 0),
    proofs_count: normalizeNumber(raw.proofs_count, 0),
  };
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

function normalizeNextAction(value: unknown): DashboardNextAction {
  const raw = asObject(value);
  return {
    route: typeof raw.route === "string" ? raw.route : "/status",
    label: typeof raw.label === "string" ? raw.label : "Continuer",
  };
}

function normalizeSnapshot(value: unknown): DashboardSnapshot {
  const raw = asObject(value);
  return {
    activation: normalizeActivation(raw.activation),
    valueChain: normalizeValueChain(raw.value_chain ?? raw.valueChain),
    health: normalizeHealth(raw.health),
    feed: normalizeFeed(raw.feed),
    nextAction: normalizeNextAction(raw.next_action ?? raw.nextAction),
  };
}

function fallbackNextAction(activation: DashboardActivation, valueChain: DashboardValueChain, health: DashboardHealth): DashboardNextAction {
  if (!activation.has_profiles) return { route: "/profiles", label: "Continuer vers Profiles" };
  if (!activation.has_inventory) return { route: "/inventory", label: "Continuer vers Inventory" };
  if (health.open_shopping_count > 0 || valueChain.shopping_open_count > 0) return { route: "/shopping", label: "Continuer vers Shopping" };
  if (!activation.has_meals) return { route: "/meals", label: "Continuer vers Meals" };
  if (!activation.has_tasks) return { route: "/tasks", label: "Continuer vers Tasks" };
  return { route: "/status", label: "Continuer vers Status" };
}

export async function readDashboardSnapshot(): Promise<DashboardSnapshot> {
  try {
    const raw = await callRpcFallback<unknown>(["rpc_dashboard_read_v1"], {}, { unwrap: true, timeoutMs: 12000, retries: 1, retryDelayMs: 800 });
    const snapshot = normalizeSnapshot(raw);
    return {
      ...snapshot,
      nextAction: snapshot.nextAction.route ? snapshot.nextAction : fallbackNextAction(snapshot.activation, snapshot.valueChain, snapshot.health),
    };
  } catch (error) {
    throw toDomyliError(error);
  }
}
