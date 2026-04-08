import { callRpc } from "@/src/services/rpc";

export type TodayHealth = {
  day: string | null;
  inventory_low_stock_count: number;
  open_alert_count: number;
  open_shopping_count: number;
  today_meal_count: number;
  today_task_count: number;
};

type RawTodayHealth = {
  day?: string | null;
  inventory_low_stock_count?: number | null;
  missing_stock_count?: number | null;
  open_alert_count?: number | null;
  blocked_tools_count?: number | null;
  open_shopping_count?: number | null;
  shopping_count?: number | null;
  today_meal_count?: number | null;
  planned_meals_count?: number | null;
  today_task_count?: number | null;
  overdue_tasks_count?: number | null;
};

export type TodayLoadFeedMember = {
  user_id: string;
  role: string;
  capacity_points_daily: number;
  assigned_task_count: number;
};

export type TodayLoadFeed = {
  members: TodayLoadFeedMember[];
};

type RawFeedMember = {
  user_id?: string | null;
  member_user_id?: string | null;
  role?: string | null;
  capacity_points_daily?: number | null;
  assigned_task_count?: number | null;
};

type RawTodayLoadFeed =
  | {
      members?: RawFeedMember[] | null;
    }
  | RawFeedMember[]
  | null;

export async function getTodayHealth(): Promise<TodayHealth> {
  const raw = (await callRpc("rpc_today_health", {}, { unwrap: true })) as
    | RawTodayHealth
    | null
    | undefined;

  return {
    day: raw?.day ?? null,
    inventory_low_stock_count: Number(
      raw?.inventory_low_stock_count ?? raw?.missing_stock_count ?? 0,
    ),
    open_alert_count: Number(
      raw?.open_alert_count ?? raw?.blocked_tools_count ?? 0,
    ),
    open_shopping_count: Number(
      raw?.open_shopping_count ?? raw?.shopping_count ?? 0,
    ),
    today_meal_count: Number(
      raw?.today_meal_count ?? raw?.planned_meals_count ?? 0,
    ),
    today_task_count: Number(
      raw?.today_task_count ?? raw?.overdue_tasks_count ?? 0,
    ),
  };
}

export async function getTodayLoadFeed(): Promise<TodayLoadFeed> {
  const raw = (await callRpc("rpc_today_load_feed", {})) as RawTodayLoadFeed;

  const membersArray = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.members)
      ? raw.members
      : [];

  return {
    members: membersArray.map((member) => ({
      user_id: member.user_id ?? member.member_user_id ?? "",
      role: member.role ?? "MEMBER",
      capacity_points_daily: Number(member.capacity_points_daily ?? 0),
      assigned_task_count: Number(member.assigned_task_count ?? 0),
    })),
  };
}