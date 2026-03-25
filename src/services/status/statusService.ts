import { callRpc } from "../rpc";
import { unwrapRpcRow } from "../unwrapRpcRow";

export type TodayHealthInput = {
  p_household_id: string;
};

export type TodayHealthOutput = {
  day: string;
  missing_stock_count: number;
  overdue_tasks_count: number;
  planned_meals_count: number;
  confirmed_meals_count: number;
  blocked_tools_count: number;
};

type RawTodayHealthOutput = {
  day?: string | null;
  missing_stock_count?: number | null;
  overdue_tasks_count?: number | null;
  planned_meals_count?: number | null;
  confirmed_meals_count?: number | null;
  blocked_tools_count?: number | null;
};

export type TodayLoadFeedInput = {
  p_household_id: string;
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

export async function getTodayHealth(
  payload: TodayHealthInput
): Promise<TodayHealthOutput> {
  const rawResult = await callRpc<RawTodayHealthOutput | RawTodayHealthOutput[]
  >("rpc_today_health", payload);

  const raw = unwrapRpcRow(rawResult);

  console.log("DOMYLI status rpc_today_health raw =>", rawResult);
  console.log("DOMYLI status rpc_today_health normalized =>", raw);

  return {
    day: raw?.day ?? new Date().toISOString().slice(0, 10),
    missing_stock_count: Number(raw?.missing_stock_count ?? 0),
    overdue_tasks_count: Number(raw?.overdue_tasks_count ?? 0),
    planned_meals_count: Number(raw?.planned_meals_count ?? 0),
    confirmed_meals_count: Number(raw?.confirmed_meals_count ?? 0),
    blocked_tools_count: Number(raw?.blocked_tools_count ?? 0),
  };
}

export async function getTodayLoadFeed(
  payload: TodayLoadFeedInput
): Promise<TodayLoadFeedItem[]> {
  const rawResult = await callRpc<RawTodayLoadFeedItem[] | RawTodayLoadFeedItem | null
  >("rpc_today_load_feed", payload);

  console.log("DOMYLI status rpc_today_load_feed raw =>", rawResult);

  const rows = Array.isArray(rawResult)
    ? rawResult
    : rawResult
      ? [rawResult]
      : [];

  return rows.map((row) => ({
    item_type: row.item_type ?? "ALERT",
    item_id: row.item_id ?? "",
    title: row.title ?? "Élément DOMYLI",
    status: row.status ?? "UNKNOWN",
    scheduled_at: row.scheduled_at ?? null,
  }));
}