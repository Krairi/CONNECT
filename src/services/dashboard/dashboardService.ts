import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";

export type TodayHealth = {
  day: string | null;
  missing_stock_count: number;
  overdue_tasks_count: number;
  planned_meals_count: number;
  confirmed_meals_count: number;
  blocked_tools_count: number;
  open_alert_count: number;
  proofs_count: number;
};

export type DashboardFeedItem = {
  item_type: string;
  item_id: string;
  title: string;
  status: string;
  scheduled_at: string | null;
};

export type ActivationStatus = {
  activation_score: number;
  is_operational: boolean;
  has_members: boolean;
  has_profiles: boolean;
  has_inventory: boolean;
  has_tasks: boolean;
  has_meals: boolean;
};

export type ValueChainStatus = {
  members_count: number;
  profiles_count: number;
  inventory_items_count: number;
  meal_slots_count: number;
  tasks_count: number;
  task_instances_count: number;
  shopping_open_count: number;
  proofs_count: number;
  events_count: number;
  alerts_open_count: number;
};

type RawTodayHealth = {
  day?: string | null;
  missing_stock_count?: number | null;
  inventory_low_stock_count?: number | null;
  overdue_tasks_count?: number | null;
  today_task_count?: number | null;
  planned_meals_count?: number | null;
  today_meal_count?: number | null;
  confirmed_meals_count?: number | null;
  blocked_tools_count?: number | null;
  open_alert_count?: number | null;
  alerts_open_count?: number | null;
  proofs_count?: number | null;
};

type RawDashboardFeedItem = {
  item_type?: string | null;
  item_id?: string | null;
  title?: string | null;
  status?: string | null;
  scheduled_at?: string | null;
};

type RawActivationStatus = {
  activation_score?: number | null;
  is_operational?: boolean | null;
  has_members?: boolean | null;
  has_profiles?: boolean | null;
  has_inventory?: boolean | null;
  has_tasks?: boolean | null;
  has_meals?: boolean | null;
};

type RawValueChainStatus = {
  members_count?: number | null;
  profiles_count?: number | null;
  inventory_items_count?: number | null;
  meal_slots_count?: number | null;
  tasks_count?: number | null;
  task_instances_count?: number | null;
  shopping_open_count?: number | null;
  proofs_count?: number | null;
  events_count?: number | null;
  alerts_open_count?: number | null;
};

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function firstRow<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function manyRows<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

export async function getTodayHealth(): Promise<TodayHealth> {
  try {
    const raw = (await callRpc("rpc_today_health", {}, { unwrap: true })) as
      | RawTodayHealth
      | RawTodayHealth[]
      | null;

    const row = firstRow(raw);

    return {
      day: row?.day ?? null,
      missing_stock_count: toNumber(
        row?.missing_stock_count ?? row?.inventory_low_stock_count,
        0,
      ),
      overdue_tasks_count: toNumber(
        row?.overdue_tasks_count ?? row?.today_task_count,
        0,
      ),
      planned_meals_count: toNumber(
        row?.planned_meals_count ?? row?.today_meal_count,
        0,
      ),
      confirmed_meals_count: toNumber(row?.confirmed_meals_count, 0),
      blocked_tools_count: toNumber(row?.blocked_tools_count, 0),
      open_alert_count: toNumber(
        row?.open_alert_count ?? row?.alerts_open_count,
        0,
      ),
      proofs_count: toNumber(row?.proofs_count, 0),
    };
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function getTodayLoadFeed(): Promise<DashboardFeedItem[]> {
  try {
    const raw = (await callRpc("rpc_today_load_feed", {}, { unwrap: true })) as
      | RawDashboardFeedItem[]
      | RawDashboardFeedItem
      | { items?: RawDashboardFeedItem[] | null }
      | null;

    if (raw && typeof raw === "object" && !Array.isArray(raw) && "items" in raw) {
      return manyRows(raw.items).map((item) => ({
        item_type: item.item_type ?? "UNKNOWN",
        item_id: item.item_id ?? "",
        title: item.title ?? "Signal DOMYLI",
        status: item.status ?? "UNKNOWN",
        scheduled_at: item.scheduled_at ?? null,
      }));
    }

    return manyRows(raw as RawDashboardFeedItem[] | RawDashboardFeedItem | null).map(
      (item) => ({
        item_type: item.item_type ?? "UNKNOWN",
        item_id: item.item_id ?? "",
        title: item.title ?? "Signal DOMYLI",
        status: item.status ?? "UNKNOWN",
        scheduled_at: item.scheduled_at ?? null,
      }),
    );
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function getActivationStatus(): Promise<ActivationStatus> {
  try {
    const raw = (await callRpc("rpc_activation_status", {}, { unwrap: true })) as
      | RawActivationStatus
      | RawActivationStatus[]
      | null;

    const row = firstRow(raw);

    return {
      activation_score: toNumber(row?.activation_score, 0),
      is_operational: toBoolean(row?.is_operational, false),
      has_members: toBoolean(row?.has_members, false),
      has_profiles: toBoolean(row?.has_profiles, false),
      has_inventory: toBoolean(row?.has_inventory, false),
      has_tasks: toBoolean(row?.has_tasks, false),
      has_meals: toBoolean(row?.has_meals, false),
    };
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function getValueChainStatus(): Promise<ValueChainStatus> {
  try {
    const raw = (await callRpc("rpc_value_chain_status", {}, { unwrap: true })) as
      | RawValueChainStatus
      | RawValueChainStatus[]
      | null;

    const row = firstRow(raw);

    return {
      members_count: toNumber(row?.members_count, 0),
      profiles_count: toNumber(row?.profiles_count, 0),
      inventory_items_count: toNumber(row?.inventory_items_count, 0),
      meal_slots_count: toNumber(row?.meal_slots_count, 0),
      tasks_count: toNumber(row?.tasks_count, 0),
      task_instances_count: toNumber(row?.task_instances_count, 0),
      shopping_open_count: toNumber(row?.shopping_open_count, 0),
      proofs_count: toNumber(row?.proofs_count, 0),
      events_count: toNumber(row?.events_count, 0),
      alerts_open_count: toNumber(row?.alerts_open_count, 0),
    };
  } catch (error) {
    throw toDomyliError(error);
  }
}