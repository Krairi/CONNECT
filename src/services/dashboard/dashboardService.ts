import { callRpc } from "../rpc";
import { isMissingRpcError } from "../../lib/errors";

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

export async function getTodayHealth(): Promise<TodayHealthOutput> {
  try {
    const rawResult = await callRpc<Record<string, never>, RawTodayHealthJson>(
      "rpc_today_health",
      {}
    );

    console.log("DOMYLI rpc_today_health raw =>", rawResult);

    const raw = rawResult ?? {};

    return {
      day: raw.day ?? new Date().toISOString().slice(0, 10),
      missing_stock_count: Number(raw.missing_stock_count ?? 0),
      overdue_tasks_count: Number(raw.overdue_tasks_count ?? 0),
      planned_meals_count: Number(raw.planned_meals_count ?? 0),
      confirmed_meals_count: Number(raw.confirmed_meals_count ?? 0),
      blocked_tools_count: Number(raw.blocked_tools_count ?? 0),
    };
  } catch (error) {
    if (isMissingRpcError(error)) {
      return {
        day: new Date().toISOString().slice(0, 10),
        missing_stock_count: 0,
        overdue_tasks_count: 0,
        planned_meals_count: 0,
        confirmed_meals_count: 0,
        blocked_tools_count: 0,
      };
    }
    throw error;
  }
}

export async function getTodayLoadFeed(
  payload: TodayLoadFeedInput
): Promise<TodayLoadFeedItem[]> {
  try {
    const rawResult = await callRpc<
      TodayLoadFeedInput,
      RawTodayLoadFeedItem[] | RawTodayLoadFeedItem | null
    >("rpc_today_load_feed", payload);

    console.log("DOMYLI rpc_today_load_feed raw =>", rawResult);

    const items = Array.isArray(rawResult)
      ? rawResult
      : rawResult
        ? [rawResult]
        : [];

    return items.map((item) => ({
      item_type: item.item_type ?? "ALERT",
      item_id: item.item_id ?? "",
      title: item.title ?? "Élément DOMYLI",
      status: item.status ?? "UNKNOWN",
      scheduled_at: item.scheduled_at ?? null,
    }));
  } catch (error) {
    if (isMissingRpcError(error)) {
      return [];
    }
    throw error;
  }
}