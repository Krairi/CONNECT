import { callRpc } from "../rpc";
import { isMissingRpcError } from "../../lib/errors";

export type DashboardHealth = {
  day: string;
  open_alert_count: number;
  blocked_tools_count: number;
  missing_stock_count: number;
  planned_meals_count: number;
  confirmed_meals_count: number;
  overdue_tasks_count: number;
};

type RawTodayHealthJson = {
  household_id?: string | null;
  day?: string | null;
  open_alert_count?: number | null;
  blocked_tools_count?: number | null;
  missing_stock_count?: number | null;
  planned_meals_count?: number | null;
  confirmed_meals_count?: number | null;
  overdue_tasks_count?: number | null;

  inventory_low_stock_count?: number | null;
  today_meal_count?: number | null;
  today_task_count?: number | null;
  today_task_done_count?: number | null;
};

export type DashboardFeedItem = {
  item_id: string;
  item_type: string;
  title: string;
  scheduled_at: string | null;
  status: string;
};

type RawTodayLoadFeedItem = {
  item_id?: string | null;
  item_type?: string | null;
  title?: string | null;
  scheduled_at?: string | null;
  status?: string | null;
};

type RawTodayLoadFeedEnvelope = {
  household_id?: string | null;
  day?: string | null;
  items?: RawTodayLoadFeedItem[] | null;
  feed?: RawTodayLoadFeedItem[] | null;
  rows?: RawTodayLoadFeedItem[] | null;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizeNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeHealth(raw: RawTodayHealthJson | null | undefined): DashboardHealth {
  return {
    day: raw?.day ?? todayIso(),
    open_alert_count: normalizeNumber(raw?.open_alert_count),
    blocked_tools_count: normalizeNumber(raw?.blocked_tools_count),
    missing_stock_count: normalizeNumber(
      raw?.missing_stock_count ?? raw?.inventory_low_stock_count,
    ),
    planned_meals_count: normalizeNumber(
      raw?.planned_meals_count ?? raw?.today_meal_count,
    ),
    confirmed_meals_count: normalizeNumber(raw?.confirmed_meals_count),
    overdue_tasks_count: normalizeNumber(raw?.overdue_tasks_count),
  };
}

function normalizeFeedItem(raw: RawTodayLoadFeedItem): DashboardFeedItem {
  return {
    item_id: String(raw.item_id ?? ""),
    item_type: String(raw.item_type ?? "SYSTEM"),
    title: String(raw.title ?? "Signal DOMYLI"),
    scheduled_at: raw.scheduled_at ?? null,
    status: String(raw.status ?? "OPEN"),
  };
}

function pickFeedRows(
  raw:
    | RawTodayLoadFeedEnvelope
    | RawTodayLoadFeedItem[]
    | RawTodayLoadFeedItem
    | null
    | undefined,
): RawTodayLoadFeedItem[] {
  if (Array.isArray(raw)) {
    return raw;
  }

  if (!raw || typeof raw !== "object") {
    return [];
  }

  const envelope = raw as RawTodayLoadFeedEnvelope;

  if (Array.isArray(envelope.items)) {
    return envelope.items;
  }

  if (Array.isArray(envelope.feed)) {
    return envelope.feed;
  }

  if (Array.isArray(envelope.rows)) {
    return envelope.rows;
  }

  return [];
}

export async function getTodayHealth(): Promise<DashboardHealth> {
  try {
    const raw = await callRpc<RawTodayHealthJson>("rpc_today_health", {});
    return normalizeHealth(raw);
  } catch (error) {
    if (isMissingRpcError(error)) {
      return normalizeHealth(null);
    }

    throw error;
  }
}

export async function getTodayLoadFeed(): Promise<DashboardFeedItem[]> {
  try {
    const raw = await callRpc<RawTodayLoadFeedEnvelope | RawTodayLoadFeedItem[]>(
      "rpc_today_load_feed",
      {},
    );

    return pickFeedRows(raw).map(normalizeFeedItem);
  } catch (error) {
    if (isMissingRpcError(error)) {
      return [];
    }

    throw error;
  }
}