import { useCallback, useEffect, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  getTodayHealth,
  getTodayLoadFeed,
} from "@/src/services/dashboard/dashboardService";

export type DashboardHealth = {
  day: string | null;
  open_alert_count: number;
  blocked_tools_count: number;
  missing_stock_count: number;
  planned_meals_count: number;
  confirmed_meals_count: number;
  overdue_tasks_count: number;
  shopping_open_count: number;
};

export type DashboardFeedItem = {
  item_id: string;
  item_type: string;
  title: string;
  scheduled_at: string | null;
  status: string;
};

export type DashboardActivation = {
  activation_score: number;
  is_operational: boolean;
  has_members: boolean;
  has_profiles: boolean;
  has_inventory: boolean;
  has_tasks: boolean;
  has_meals: boolean;
  blockers: string[];
  missing_paths: string[];
};

export type DashboardValueChain = {
  shopping_open_count: number;
  overdue_tasks_count: number;
  missing_stock_count: number;
  blocked_tools_count: number;
  open_alert_count: number;
  pending_actions: string[];
};

type DashboardState = {
  loading: boolean;
  error: DomyliAppError | null;
  health: DashboardHealth | null;
  feed: DashboardFeedItem[];
  activation: DashboardActivation;
  valueChain: DashboardValueChain;
};

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeHealth(raw: any): DashboardHealth {
  return {
    day: raw?.day ?? null,
    open_alert_count: toNumber(raw?.open_alert_count ?? raw?.alert_count, 0),
    blocked_tools_count: toNumber(raw?.blocked_tools_count, 0),
    missing_stock_count: toNumber(
      raw?.missing_stock_count ?? raw?.inventory_low_stock_count,
      0,
    ),
    planned_meals_count: toNumber(
      raw?.planned_meals_count ?? raw?.today_meal_count,
      0,
    ),
    confirmed_meals_count: toNumber(raw?.confirmed_meals_count, 0),
    overdue_tasks_count: toNumber(
      raw?.overdue_tasks_count ?? raw?.today_task_count,
      0,
    ),
    shopping_open_count: toNumber(
      raw?.shopping_open_count ?? raw?.open_shopping_count ?? raw?.shopping_count,
      0,
    ),
  };
}

function normalizeFeed(raw: any): DashboardFeedItem[] {
  if (Array.isArray(raw)) {
    return raw.map((item, index) => ({
      item_id: String(item?.item_id ?? item?.id ?? `feed-${index}`),
      item_type: String(item?.item_type ?? "SYSTEM"),
      title: String(item?.title ?? "Signal DOMYLI"),
      scheduled_at: item?.scheduled_at ?? item?.planned_for ?? null,
      status: String(item?.status ?? "OPEN"),
    }));
  }

  const members = Array.isArray(raw?.members) ? raw.members : [];

  return members.map((member: any, index: number) => ({
    item_id: String(member?.user_id ?? member?.member_user_id ?? `member-${index}`),
    item_type: "MEMBER_LOAD",
    title: `Charge ${member?.role ?? "MEMBER"}`,
    scheduled_at: null,
    status: toNumber(member?.assigned_task_count, 0) > 0 ? "OPEN" : "STABLE",
  }));
}

function buildActivation(health: DashboardHealth, feed: DashboardFeedItem[]): DashboardActivation {
  const has_members = true;
  const has_profiles = true;
  const has_inventory = true;
  const has_tasks = health.overdue_tasks_count > 0 || feed.length > 0;
  const has_meals =
    health.planned_meals_count > 0 || health.confirmed_meals_count > 0;

  const blockers: string[] = [];
  const missing_paths: string[] = [];

  if (!has_meals) {
    missing_paths.push("MEALS");
  }

  if (!has_tasks) {
    missing_paths.push("TASKS");
  }

  if (health.blocked_tools_count > 0) {
    blockers.push("TOOLS_BLOCKED");
  }

  if (health.missing_stock_count > 0) {
    blockers.push("STOCK_GAPS");
  }

  const checkpoints = [
    has_members,
    has_profiles,
    has_inventory,
    has_tasks,
    has_meals,
  ];

  const completed = checkpoints.filter(Boolean).length;
  const activation_score = Math.round((completed / checkpoints.length) * 100);

  return {
    activation_score,
    is_operational: blockers.length === 0 && missing_paths.length === 0,
    has_members,
    has_profiles,
    has_inventory,
    has_tasks,
    has_meals,
    blockers,
    missing_paths,
  };
}

function buildValueChain(health: DashboardHealth): DashboardValueChain {
  const pending_actions: string[] = [];

  if (health.shopping_open_count > 0) {
    pending_actions.push("SHOPPING");
  }

  if (health.overdue_tasks_count > 0) {
    pending_actions.push("TASKS");
  }

  if (health.missing_stock_count > 0) {
    pending_actions.push("STOCK");
  }

  if (health.open_alert_count > 0) {
    pending_actions.push("ALERTS");
  }

  return {
    shopping_open_count: health.shopping_open_count,
    overdue_tasks_count: health.overdue_tasks_count,
    missing_stock_count: health.missing_stock_count,
    blocked_tools_count: health.blocked_tools_count,
    open_alert_count: health.open_alert_count,
    pending_actions,
  };
}

const initialHealth: DashboardHealth = {
  day: null,
  open_alert_count: 0,
  blocked_tools_count: 0,
  missing_stock_count: 0,
  planned_meals_count: 0,
  confirmed_meals_count: 0,
  overdue_tasks_count: 0,
  shopping_open_count: 0,
};

const initialActivation: DashboardActivation = {
  activation_score: 0,
  is_operational: false,
  has_members: false,
  has_profiles: false,
  has_inventory: false,
  has_tasks: false,
  has_meals: false,
  blockers: [],
  missing_paths: [],
};

const initialValueChain: DashboardValueChain = {
  shopping_open_count: 0,
  overdue_tasks_count: 0,
  missing_stock_count: 0,
  blocked_tools_count: 0,
  open_alert_count: 0,
  pending_actions: [],
};

const initialState: DashboardState = {
  loading: false,
  error: null,
  health: initialHealth,
  feed: [],
  activation: initialActivation,
  valueChain: initialValueChain,
};

export function useDashboard() {
  const [state, setState] = useState<DashboardState>(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const [rawHealth, rawFeed] = await Promise.all([
        getTodayHealth(),
        getTodayLoadFeed(),
      ]);

      const health = normalizeHealth(rawHealth);
      const feed = normalizeFeed(rawFeed);
      const activation = buildActivation(health, feed);
      const valueChain = buildValueChain(health);

      setState({
        loading: false,
        error: null,
        health,
        feed,
        activation,
        valueChain,
      });
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        loading: false,
        error: normalized,
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}