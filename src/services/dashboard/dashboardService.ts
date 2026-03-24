import { callRpc } from "../rpc";
import { isMissingRpcError } from "../../lib/errors";

export type TodayHealthOutput = {
  day: string;
  inventory_low_stock_count: number;
  open_shopping_count: number;
  open_alert_count: number;
  today_meal_count: number;
  today_task_count: number;
  today_task_done_count: number;
};

type RawTodayHealthJson = {
  household_id?: string | null;
  day?: string | null;
  inventory_low_stock_count?: number | null;
  open_shopping_count?: number | null;
  open_alert_count?: number | null;
  today_meal_count?: number | null;
  today_task_count?: number | null;
  today_task_done_count?: number | null;
};

export type TodayLoadFeedMember = {
  user_id: string;
  role: string;
  capacity_points_daily: number;
  assigned_task_count: number;
  assigned_effort_points: number;
  remaining_capacity_points: number;
};

export type TodayLoadFeedOutput = {
  household_id: string | null;
  day: string;
  members: TodayLoadFeedMember[];
};

type RawTodayLoadFeedMember = {
  user_id?: string | null;
  role?: string | null;
  capacity_points_daily?: number | null;
  assigned_task_count?: number | null;
  assigned_effort_points?: number | null;
  remaining_capacity_points?: number | null;
};

type RawTodayLoadFeedJson = {
  household_id?: string | null;
  day?: string | null;
  members?: RawTodayLoadFeedMember[] | null;
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
      inventory_low_stock_count: Number(raw.inventory_low_stock_count ?? 0),
      open_shopping_count: Number(raw.open_shopping_count ?? 0),
      open_alert_count: Number(raw.open_alert_count ?? 0),
      today_meal_count: Number(raw.today_meal_count ?? 0),
      today_task_count: Number(raw.today_task_count ?? 0),
      today_task_done_count: Number(raw.today_task_done_count ?? 0),
    };
  } catch (error) {
    if (isMissingRpcError(error)) {
      return {
        day: new Date().toISOString().slice(0, 10),
        inventory_low_stock_count: 0,
        open_shopping_count: 0,
        open_alert_count: 0,
        today_meal_count: 0,
        today_task_count: 0,
        today_task_done_count: 0,
      };
    }
    throw error;
  }
}

export async function getTodayLoadFeed(): Promise<TodayLoadFeedOutput> {
  try {
    const rawResult = await callRpc<Record<string, never>, RawTodayLoadFeedJson>(
      "rpc_today_load_feed",
      {}
    );

    console.log("DOMYLI rpc_today_load_feed raw =>", rawResult);

    const raw = rawResult ?? {};

    return {
      household_id: raw.household_id ?? null,
      day: raw.day ?? new Date().toISOString().slice(0, 10),
      members: Array.isArray(raw.members)
        ? raw.members.map((member) => ({
            user_id: member.user_id ?? "",
            role: member.role ?? "MEMBRE",
            capacity_points_daily: Number(member.capacity_points_daily ?? 0),
            assigned_task_count: Number(member.assigned_task_count ?? 0),
            assigned_effort_points: Number(member.assigned_effort_points ?? 0),
            remaining_capacity_points: Number(member.remaining_capacity_points ?? 0),
          }))
        : [],
    };
  } catch (error) {
    if (isMissingRpcError(error)) {
      return {
        household_id: null,
        day: new Date().toISOString().slice(0, 10),
        members: [],
      };
    }
    throw error;
  }
}