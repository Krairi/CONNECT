import { callRpc } from "@/src/services/rpc";
import { unwrapRpcRow } from "@/src/services/unwrapRpcRow";

export type TodayHealthOutput = {
  day: string;
  missing_stock_count: number;
  overdue_tasks_count: number;
  planned_meals_count: number;
  confirmed_meals_count: number;
  blocked_tools_count: number;
};

type RawTodayHealthJson = {
  day?: string | null;
  missing_stock_count?: number | null;
  overdue_tasks_count?: number | null;
  planned_meals_count?: number | null;
  confirmed_meals_count?: number | null;
  blocked_tools_count?: number | null;
};

export type TodayLoadFeedItem = {
  item_type: "TASK" | "MEAL" | "ALERT" | "TOOL" | string;
  item_id: string;
  title: string;
  status: string;
  scheduled_at?: string | null;
};

type RawTodayLoadFeedItem = {
  item_type?: string | null;
  item_id?: string | null;
  title?: string | null;
  status?: string | null;
  scheduled_at?: string | null;
};

export async function getTodayHealth(): Promise<TodayHealthOutput> {
  const rawResult = await callRpc<RawTodayHealthJson | RawTodayHealthJson[]>(
    "rpc_today_health",
    {}
  );

  const raw = unwrapRpcRow(rawResult);

  return {
    day: raw?.day ?? new Date().toISOString().slice(0, 10),
    missing_stock_count: Number(raw?.missing_stock_count ?? 0),
    overdue_tasks_count: Number(raw?.overdue_tasks_count ?? 0),
    planned_meals_count: Number(raw?.planned_meals_count ?? 0),
    confirmed_meals_count: Number(raw?.confirmed_meals_count ?? 0),
    blocked_tools_count: Number(raw?.blocked_tools_count ?? 0),
  };
}

export async function getTodayLoadFeed(): Promise<TodayLoadFeedItem[]> {
  const rawResult = await callRpc<RawTodayLoadFeedItem[] | RawTodayLoadFeedItem | null>(
    "rpc_today_load_feed",
    {}
  );

  const rows = Array.isArray(rawResult)
    ? rawResult
    : rawResult
      ? [rawResult]
      : [];

  return rows.map((item) => ({
    item_type: item.item_type ?? "ALERT",
    item_id: item.item_id ?? "",
    title: item.title ?? "Élément DOMYLI",
    status: item.status ?? "UNKNOWN",
    scheduled_at: item.scheduled_at ?? null,
  }));
}
